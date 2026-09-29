/**
 * What this file does:
 * Encapsulates tenant-scoped catalog queries for products and price rules.
 * What calls it:
 * src/services/catalog-service.ts and src/services/quote-service.ts.
 * What it calls:
 * Prisma Product and PriceRule delegates through the shared database executor.
 * One thing a junior engineer would likely get wrong:
 * Looking up products by id without tenantId, which can leak another tenant's pricing model into the quote calculation.
 */

import type { Prisma } from "@prisma/client";

import type { DbExecutor } from "@/repositories/types";

export async function listProducts(db: DbExecutor, tenantId: string) {
  return db.product.findMany({
    // Tenant filter is mandatory because catalog records are tenant-owned and affect downstream pricing decisions.
    where: { tenantId },
    include: { priceRules: true },
    orderBy: { name: "asc" }
  });
}

export async function createProduct(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.ProductUncheckedCreateInput
) {
  return db.product.create({
    data: {
      ...data,
      tenantId
    }
  });
}

export async function createPriceRule(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.PriceRuleUncheckedCreateInput
) {
  return db.priceRule.create({
    data: {
      ...data,
      tenantId
    }
  });
}

export async function getProductsForQuote(db: DbExecutor, tenantId: string, productIds: string[]) {
  return db.product.findMany({
    // Tenant scoping here prevents a quote in one org from referencing a catalog item in another org.
    where: {
      tenantId,
      id: { in: productIds },
      active: true
    },
    // ⚠️ SENIOR NOTE: Price rules are included with the products to avoid an N+1 pricing loop inside quote evaluation.
    include: { priceRules: true }
  });
}
