/**
 * What this file does:
 * Owns quote aggregate persistence including quote lines, approvals, and deal desk cases.
 * What calls it:
 * src/services/quote-service.ts and dashboard queries that need quote snapshots.
 * What it calls:
 * Prisma Quote, QuoteApproval, and DealDeskCase delegates.
 * One thing a junior engineer would likely get wrong:
 * Updating quote status in one query and approvals in another without a transaction, which leaves the workflow half-moved on failure.
 */

import type { ApprovalStatus, ApprovalType, Prisma, QuoteStatus, UserRole } from "@prisma/client";

import type { DbExecutor } from "@/repositories/types";

export async function createQuoteAggregate(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.QuoteUncheckedCreateInput & {
    lines: Prisma.QuoteLineUncheckedCreateWithoutQuoteInput[];
  }
) {
  return db.quote.create({
    data: {
      ...data,
      tenantId,
      lines: {
        create: data.lines
      }
    },
    include: {
      lines: true
    }
  });
}

export async function getQuoteById(db: DbExecutor, tenantId: string, quoteId: string) {
  return db.quote.findFirst({
    // Quotes carry revenue-impacting data, so we scope the root aggregate by tenant before loading children.
    where: {
      tenantId,
      id: quoteId
    },
    include: {
      lines: {
        include: {
          product: {
            include: {
              priceRules: true
            }
          }
        }
      },
      // ⚠️ SENIOR NOTE: We fetch approvals and deal desk state with the quote so services can make one coherent state decision instead of racing on separate reads.
      approvals: true,
      dealDeskCase: true,
      customerAccount: true,
      salesOrder: true
    }
  });
}

export async function listQuotes(db: DbExecutor, tenantId: string) {
  return db.quote.findMany({
    // Tenant scoping here protects quote metadata in list views and prevents cross-tenant search leaks.
    where: { tenantId },
    include: {
      customerAccount: true,
      dealDeskCase: true,
      salesOrder: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateQuoteStatus(
  db: DbExecutor,
  tenantId: string,
  quoteId: string,
  status: QuoteStatus
) {
  return db.quote.updateMany({
    // ⚠️ SENIOR NOTE: updateMany keeps the tenant filter in the write itself instead of assuming the caller's earlier read is still enough.
    where: {
      id: quoteId,
      tenantId
    },
    data: {
      status
    }
  });
}

export async function createApprovals(
  db: DbExecutor,
  tenantId: string,
  quoteId: string,
  approvals: Array<{ approverRole: UserRole; approvalType: ApprovalType; note?: string }>
) {
  if (approvals.length === 0) {
    return [];
  }

  await db.quoteApproval.createMany({
    data: approvals.map((approval) => ({
      tenantId,
      quoteId,
      approverRole: approval.approverRole,
      approvalType: approval.approvalType,
      status: "PENDING",
      note: approval.note
    }))
  });

  return db.quoteApproval.findMany({
    where: {
      tenantId,
      quoteId
    }
  });
}

export async function updateApprovalDecision(
  db: DbExecutor,
  tenantId: string,
  quoteId: string,
  approverRole: UserRole,
  status: ApprovalStatus,
  note?: string
) {
  return db.quoteApproval.updateMany({
    where: {
      tenantId,
      quoteId,
      approverRole,
      status: "PENDING"
    },
    data: {
      status,
      decidedAt: new Date(),
      note
    }
  });
}

export async function createDealDeskCase(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.DealDeskCaseUncheckedCreateInput
) {
  return db.dealDeskCase.upsert({
    where: {
      quoteId: data.quoteId
    },
    update: {
      status: data.status,
      reason: data.reason,
      assignedRole: data.assignedRole,
      resolutionNote: data.resolutionNote
    },
    create: {
      ...data,
      tenantId
    }
  });
}

export async function listOpenDealDeskCases(db: DbExecutor, tenantId: string) {
  return db.dealDeskCase.findMany({
    // The deal desk queue is especially sensitive because it surfaces unusual commercial terms.
    where: {
      tenantId,
      status: "OPEN"
    },
    include: {
      quote: {
        include: {
          customerAccount: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function resolveDealDeskCase(
  db: DbExecutor,
  tenantId: string,
  quoteId: string,
  status: "APPROVED_EXCEPTION" | "DENIED_EXCEPTION",
  resolutionNote: string
) {
  return db.dealDeskCase.updateMany({
    where: {
      quoteId,
      tenantId
    },
    data: {
      status,
      resolutionNote
    }
  });
}
