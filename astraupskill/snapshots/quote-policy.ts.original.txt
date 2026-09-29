/**
 * What this file does:
 * Holds the pure business rules for quote pricing, exception routing, and safe status transitions.
 * What calls it:
 * src/services/quote-service.ts and tests that verify invalid state changes.
 * What it calls:
 * src/lib/errors.ts and src/lib/money.ts.
 * One thing a junior engineer would likely get wrong:
 * Encoding approval logic inline inside a route or repository and making it impossible to test without the full stack.
 */

import type { PriceRule, Product, QuoteStatus } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { calculatePercentDiscount, sumMoney } from "@/lib/money";

export type QuoteDraftLine = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
};

export type CatalogProductForQuote = Product & {
  priceRules: PriceRule[];
};

export type EvaluatedQuoteLine = QuoteDraftLine & {
  pricingRuleId: string | null;
  listPriceCents: number;
  discountPct: number;
};

export type QuoteDecision = {
  lines: EvaluatedQuoteLine[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  requiresDealDesk: boolean;
  requiresFinanceApproval: boolean;
  requiresLegalApproval: boolean;
  reasons: string[];
};

function findApplicableRule(product: CatalogProductForQuote, quantity: number): PriceRule | null {
  return (
    product.priceRules.find(
      (rule) => quantity >= rule.minQuantity && quantity <= rule.maxQuantity
    ) ?? null
  );
}

export function evaluateQuoteDraft(
  products: CatalogProductForQuote[],
  draftLines: QuoteDraftLine[],
  contractTermMonths: number
): QuoteDecision {
  const lines = draftLines.map((line) => {
    const product = products.find((candidate) => candidate.id === line.productId);

    if (!product) {
      throw new AppError(404, `Product ${line.productId} was not found in the active tenant.`);
    }

    const rule = findApplicableRule(product, line.quantity);
    const discountPct = calculatePercentDiscount(product.basePriceCents, line.unitPriceCents);

    if (rule && line.unitPriceCents < rule.floorPriceCents) {
      throw new AppError(422, `Line for ${product.sku} falls below the configured floor price.`);
    }

    return {
      ...line,
      pricingRuleId: rule?.id ?? null,
      listPriceCents: product.basePriceCents,
      discountPct
    };
  });

  const subtotalCents = sumMoney(lines.map((line) => line.listPriceCents * line.quantity));
  const totalCents = sumMoney(lines.map((line) => line.unitPriceCents * line.quantity));
  const discountCents = subtotalCents - totalCents;
  const reasons = new Set<string>();

  for (const line of lines) {
    const product = products.find((candidate) => candidate.id === line.productId)!;
    const rule = product.priceRules.find((candidate) => candidate.id === line.pricingRuleId) ?? null;

    if (line.discountPct > product.dealDeskDiscountPct) {
      reasons.add(`${product.sku} exceeds the deal desk discount threshold.`);
    }

    if (line.discountPct > product.autoApprovalDiscountPct) {
      reasons.add(`${product.sku} requires finance approval for discounting.`);
    }

    if (rule && !((rule.allowedTermMonths as number[]).includes(contractTermMonths))) {
      reasons.add(`${product.sku} uses a non-standard contract term.`);
    }
  }

  const reasonList = Array.from(reasons);

  return {
    lines,
    subtotalCents,
    discountCents,
    totalCents,
    requiresDealDesk: reasonList.some((reason) => reason.includes("deal desk")),
    requiresFinanceApproval: reasonList.some(
      (reason) => reason.includes("finance approval") || reason.includes("deal desk")
    ),
    requiresLegalApproval: reasonList.some((reason) => reason.includes("non-standard contract term")),
    reasons: reasonList
  };
}

const allowedTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["PENDING_DEAL_DESK", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
  PENDING_DEAL_DESK: ["PENDING_APPROVAL", "REJECTED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["CONVERTED_TO_ORDER"],
  REJECTED: [],
  CONVERTED_TO_ORDER: []
};

export function ensureQuoteTransition(current: QuoteStatus, next: QuoteStatus): void {
  if (!allowedTransitions[current].includes(next)) {
    throw new AppError(409, `Quote cannot move from ${current} to ${next}.`);
  }
}
