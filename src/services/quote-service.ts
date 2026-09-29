/**
 * What this file does:
 * Owns the commercial workflow from quote drafting through deal desk review, approvals, and order creation.
 * What calls it:
 * Quote and deal desk route handlers plus the quote detail page.
 * What it calls:
 * Catalog, quote, order, and audit repositories together with pure quote-policy helpers.
 * One thing a junior engineer would likely get wrong:
 * Letting routes flip quote statuses directly and slowly creating impossible state combinations between quote, case, approval, and order records.
 */

import type { Prisma, QuoteApproval, UserRole } from "@prisma/client";
import type { z } from "zod";

import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db";
import { ensureQuoteTransition, evaluateQuoteDraft } from "@/domain/quote-policy";
import { AppError } from "@/lib/errors";
import * as auditLogRepository from "@/repositories/audit-log-repository";
import * as catalogRepository from "@/repositories/catalog-repository";
import * as customerAccountRepository from "@/repositories/customer-account-repository";
import * as opportunityRepository from "@/repositories/opportunity-repository";
import * as quoteRepository from "@/repositories/quote-repository";
import { createOrderFromApprovedQuote } from "@/services/order-service";
import type {
  createAmendmentQuoteSchema,
  createQuoteSchema,
  decideApprovalSchema,
  submitQuoteSchema
} from "@/lib/validation/quote-schemas";

function buildApprovalPlan(decision: ReturnType<typeof evaluateQuoteDraft>) {
  const approvals: Array<{ approverRole: UserRole; approvalType: "FINANCE" | "LEGAL"; note?: string }> = [];

  if (decision.requiresFinanceApproval) {
    approvals.push({
      approverRole: "FINANCE",
      approvalType: "FINANCE",
      note: "Discount or commercial terms require finance review."
    });
  }

  if (decision.requiresLegalApproval) {
    approvals.push({
      approverRole: "LEGAL",
      approvalType: "LEGAL",
      note: "Non-standard term requires legal review."
    });
  }

  return approvals;
}

async function finalizeApprovedQuote(
  tx: Prisma.TransactionClient,
  context: RequestContext,
  quote: NonNullable<Awaited<ReturnType<typeof quoteRepository.getQuoteById>>>
) {
  ensureQuoteTransition(quote.status, "APPROVED");
  await quoteRepository.updateQuoteStatus(tx, context.tenantId, quote.id, "APPROVED");

  const order = await createOrderFromApprovedQuote(tx, context, {
    id: quote.id,
    customerAccountId: quote.customerAccountId,
    contractTermMonths: quote.contractTermMonths,
    totalCents: quote.totalCents,
    startsAt: quote.startsAt,
    lines: quote.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents
    }))
  });

  await quoteRepository.updateQuoteStatus(tx, context.tenantId, quote.id, "CONVERTED_TO_ORDER");

  await auditLogRepository.createAuditLog(tx, context.tenantId, {
    actorUserId: context.session.userId,
    action: "quote.approved_and_converted",
    entityType: "Quote",
    entityId: quote.id,
    metadata: {
      orderId: order.id
    }
  });

  return {
    quoteId: quote.id,
    orderId: order.id
  };
}

function normalizeProductsFromQuote(
  quote: NonNullable<Awaited<ReturnType<typeof quoteRepository.getQuoteById>>>
) {
  return quote.lines.map((line) => ({
    ...line.product,
    priceRules: line.product.priceRules
  }));
}

function normalizeDraftLinesFromQuote(
  quote: NonNullable<Awaited<ReturnType<typeof quoteRepository.getQuoteById>>>
) {
  return quote.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents
  }));
}

export async function listQuotes(context: RequestContext) {
  return quoteRepository.listQuotes(prisma, context.tenantId);
}

export async function getQuote(context: RequestContext, quoteId: string) {
  const quote = await quoteRepository.getQuoteById(prisma, context.tenantId, quoteId);

  if (!quote) {
    throw new AppError(404, `Quote ${quoteId} was not found.`);
  }

  return quote;
}

export async function listDealDeskQueue(context: RequestContext) {
  return quoteRepository.listOpenDealDeskCases(prisma, context.tenantId);
}

export async function createQuote(
  context: RequestContext,
  input: z.infer<typeof createQuoteSchema>
) {
  const customerAccount = await customerAccountRepository.getCustomerAccountById(
    prisma,
    context.tenantId,
    input.customerAccountId
  );

  if (!customerAccount) {
    throw new AppError(404, `Customer account ${input.customerAccountId} was not found.`);
  }

  if (input.opportunityId) {
    const opportunity = await opportunityRepository.getOpportunityById(
      prisma,
      context.tenantId,
      input.opportunityId
    );

    if (!opportunity) {
      throw new AppError(404, `Opportunity ${input.opportunityId} was not found.`);
    }
  }

  const products = await catalogRepository.getProductsForQuote(
    prisma,
    context.tenantId,
    input.lines.map((line) => line.productId)
  );
  const decision = evaluateQuoteDraft(products, input.lines, input.contractTermMonths);

  return prisma.$transaction(async (tx) => {
    const quote = await quoteRepository.createQuoteAggregate(tx, context.tenantId, {
      opportunityId: input.opportunityId,
      customerAccountId: input.customerAccountId,
      createdByUserId: context.session.userId,
      status: "DRAFT",
      currency: input.currency,
      contractTermMonths: input.contractTermMonths,
      startsAt: new Date(input.startsAt),
      subtotalCents: decision.subtotalCents,
      discountCents: decision.discountCents,
      totalCents: decision.totalCents,
      exceptionReason: input.exceptionReason,
      lines: decision.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        pricingRuleId: line.pricingRuleId,
        listPriceCents: line.listPriceCents,
        unitPriceCents: line.unitPriceCents,
        discountPct: line.discountPct
      }))
    });

    await auditLogRepository.createAuditLog(tx, context.tenantId, {
      actorUserId: context.session.userId,
      action: "quote.created",
      entityType: "Quote",
      entityId: quote.id,
      metadata: {
        reasons: decision.reasons
      }
    });

    return {
      ...quote,
      pricingDecision: decision
    };
  });
}

export async function submitQuote(
  context: RequestContext,
  quoteId: string,
  input: z.infer<typeof submitQuoteSchema>
) {
  const quote = await getQuote(context, quoteId);

  if (quote.status !== "DRAFT") {
    throw new AppError(409, `Only draft quotes can be submitted. Current status: ${quote.status}.`);
  }

  const decision = evaluateQuoteDraft(
    normalizeProductsFromQuote(quote),
    normalizeDraftLinesFromQuote(quote),
    quote.contractTermMonths
  );

  return prisma.$transaction(async (tx) => {
    if (decision.requiresDealDesk) {
      ensureQuoteTransition(quote.status, "PENDING_DEAL_DESK");
      await quoteRepository.updateQuoteStatus(tx, context.tenantId, quote.id, "PENDING_DEAL_DESK");

      const caseRecord = await quoteRepository.createDealDeskCase(tx, context.tenantId, {
        quoteId: quote.id,
        status: "OPEN",
        reason: decision.reasons.join(" "),
        assignedRole: "DEAL_DESK",
        resolutionNote: input.note
      });

      await auditLogRepository.createAuditLog(tx, context.tenantId, {
        actorUserId: context.session.userId,
        action: "quote.routed_to_deal_desk",
        entityType: "Quote",
        entityId: quote.id,
        metadata: {
          dealDeskCaseId: caseRecord.id,
          reasons: decision.reasons
        }
      });

      return {
        quoteId: quote.id,
        status: "PENDING_DEAL_DESK",
        reasons: decision.reasons
      };
    }

    const approvals = buildApprovalPlan(decision);

    if (approvals.length > 0) {
      ensureQuoteTransition(quote.status, "PENDING_APPROVAL");
      await quoteRepository.updateQuoteStatus(tx, context.tenantId, quote.id, "PENDING_APPROVAL");
      await quoteRepository.createApprovals(tx, context.tenantId, quote.id, approvals);

      await auditLogRepository.createAuditLog(tx, context.tenantId, {
        actorUserId: context.session.userId,
        action: "quote.routed_to_approval",
        entityType: "Quote",
        entityId: quote.id,
        metadata: {
          approvals
        }
      });

      return {
        quoteId: quote.id,
        status: "PENDING_APPROVAL",
        approvals
      };
    }

    return finalizeApprovedQuote(tx, context, quote);
  });
}

function pendingApprovalForRole(approvals: QuoteApproval[], role: UserRole) {
  return approvals.find((approval) => approval.approverRole === role && approval.status === "PENDING");
}

export async function resolveDealDeskCase(
  context: RequestContext,
  quoteId: string,
  input: { status: "APPROVED_EXCEPTION" | "DENIED_EXCEPTION"; resolutionNote: string }
) {
  const quote = await getQuote(context, quoteId);

  if (quote.status !== "PENDING_DEAL_DESK" || !quote.dealDeskCase) {
    throw new AppError(409, "This quote is not waiting on a deal desk decision.");
  }

  return prisma.$transaction(async (tx) => {
    await quoteRepository.resolveDealDeskCase(
      tx,
      context.tenantId,
      quote.id,
      input.status,
      input.resolutionNote
    );

    if (input.status === "DENIED_EXCEPTION") {
      ensureQuoteTransition(quote.status, "REJECTED");
      await quoteRepository.updateQuoteStatus(tx, context.tenantId, quote.id, "REJECTED");

      await auditLogRepository.createAuditLog(tx, context.tenantId, {
        actorUserId: context.session.userId,
        action: "quote.exception_denied",
        entityType: "Quote",
        entityId: quote.id,
        metadata: input
      });

      return {
        quoteId: quote.id,
        status: "REJECTED"
      };
    }

    const decision = evaluateQuoteDraft(
      normalizeProductsFromQuote(quote),
      normalizeDraftLinesFromQuote(quote),
      quote.contractTermMonths
    );
    const approvals = buildApprovalPlan({
      ...decision,
      requiresDealDesk: false
    });

    if (approvals.length > 0) {
      ensureQuoteTransition(quote.status, "PENDING_APPROVAL");
      await quoteRepository.updateQuoteStatus(tx, context.tenantId, quote.id, "PENDING_APPROVAL");
      await quoteRepository.createApprovals(tx, context.tenantId, quote.id, approvals);

      await auditLogRepository.createAuditLog(tx, context.tenantId, {
        actorUserId: context.session.userId,
        action: "quote.exception_approved_to_routing",
        entityType: "Quote",
        entityId: quote.id,
        metadata: {
          approvals
        }
      });

      return {
        quoteId: quote.id,
        status: "PENDING_APPROVAL",
        approvals
      };
    }

    return finalizeApprovedQuote(tx, context, quote);
  });
}

export async function decideQuoteApproval(
  context: RequestContext,
  quoteId: string,
  input: z.infer<typeof decideApprovalSchema>
) {
  const quote = await getQuote(context, quoteId);

  if (quote.status !== "PENDING_APPROVAL") {
    throw new AppError(409, "This quote is not waiting on approvers.");
  }

  const pendingDecision = pendingApprovalForRole(quote.approvals, context.session.role);

  if (!pendingDecision) {
    throw new AppError(403, `Role ${context.session.role} has no pending approval for this quote.`);
  }

  return prisma.$transaction(async (tx) => {
    await quoteRepository.updateApprovalDecision(
      tx,
      context.tenantId,
      quote.id,
      context.session.role,
      input.decision,
      input.note
    );

    if (input.decision === "REJECTED") {
      ensureQuoteTransition(quote.status, "REJECTED");
      await quoteRepository.updateQuoteStatus(tx, context.tenantId, quote.id, "REJECTED");

      await auditLogRepository.createAuditLog(tx, context.tenantId, {
        actorUserId: context.session.userId,
        action: "quote.approval_rejected",
        entityType: "Quote",
        entityId: quote.id,
        metadata: input
      });

      return {
        quoteId: quote.id,
        status: "REJECTED"
      };
    }

    const refreshedQuote = await quoteRepository.getQuoteById(tx, context.tenantId, quote.id);

    if (!refreshedQuote) {
      throw new AppError(404, `Quote ${quote.id} disappeared during approval.`);
    }

    const hasPendingApprovals = refreshedQuote.approvals.some((approval) => approval.status === "PENDING");

    if (hasPendingApprovals) {
      return {
        quoteId: refreshedQuote.id,
        status: refreshedQuote.status
      };
    }

    return finalizeApprovedQuote(tx, context, refreshedQuote);
  });
}

export async function createAmendmentQuote(
  context: RequestContext,
  input: z.infer<typeof createAmendmentQuoteSchema>
) {
  // ⚠️ SENIOR NOTE: Amendment flows are a common place to skip inheritance checks; we keep them on the same quote aggregate so the approval logic stays reused.
  const customerAccount = await customerAccountRepository.getCustomerAccountById(
    prisma,
    context.tenantId,
    input.customerAccountId
  );

  if (!customerAccount) {
    throw new AppError(404, `Customer account ${input.customerAccountId} was not found.`);
  }

  const products = await catalogRepository.getProductsForQuote(
    prisma,
    context.tenantId,
    input.lines.map((line) => line.productId)
  );
  const decision = evaluateQuoteDraft(products, input.lines, input.contractTermMonths);

  return prisma.$transaction(async (tx) => {
    const quote = await quoteRepository.createQuoteAggregate(tx, context.tenantId, {
      customerAccountId: input.customerAccountId,
      createdByUserId: context.session.userId,
      amendmentOfOrderId: input.amendmentOfOrderId,
      amendmentType: input.amendmentType,
      status: "DRAFT",
      currency: input.currency,
      contractTermMonths: input.contractTermMonths,
      startsAt: new Date(input.startsAt),
      subtotalCents: decision.subtotalCents,
      discountCents: decision.discountCents,
      totalCents: decision.totalCents,
      exceptionReason: input.exceptionReason,
      lines: decision.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        pricingRuleId: line.pricingRuleId,
        listPriceCents: line.listPriceCents,
        unitPriceCents: line.unitPriceCents,
        discountPct: line.discountPct
      }))
    });

    await auditLogRepository.createAuditLog(tx, context.tenantId, {
      actorUserId: context.session.userId,
      action: "quote.amendment_created",
      entityType: "Quote",
      entityId: quote.id,
      metadata: {
        amendmentOfOrderId: input.amendmentOfOrderId,
        amendmentType: input.amendmentType
      }
    });

    return quote;
  });
}
