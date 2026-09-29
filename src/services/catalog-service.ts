/**
 * What this file does:
 * Owns catalog writes and keeps product/pricing changes behind a permissioned service boundary.
 * What calls it:
 * Catalog route handlers and quote pricing workflows.
 * What it calls:
 * src/repositories/catalog-repository.ts and src/repositories/audit-log-repository.ts.
 * One thing a junior engineer would likely get wrong:
 * Letting a route write directly to product tables and skipping audit history for commercial-policy changes.
 */

import type { z } from "zod";

import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db";
import * as auditLogRepository from "@/repositories/audit-log-repository";
import * as catalogRepository from "@/repositories/catalog-repository";
import type {
  createPriceRuleSchema,
  createProductSchema
} from "@/lib/validation/catalog-schemas";

export async function listCatalog(context: RequestContext) {
  return catalogRepository.listProducts(prisma, context.tenantId);
}

export async function createProduct(
  context: RequestContext,
  input: z.infer<typeof createProductSchema>
) {
  return prisma.$transaction(async (tx) => {
    const product = await catalogRepository.createProduct(tx, context.tenantId, input);

    // ⚠️ SENIOR NOTE: Catalog changes get audited because pricing policy is effectively code for your revenue process.
    await auditLogRepository.createAuditLog(tx, context.tenantId, {
      actorUserId: context.session.userId,
      action: "catalog.product.created",
      entityType: "Product",
      entityId: product.id,
      metadata: input
    });

    return product;
  });
}

export async function createPriceRule(
  context: RequestContext,
  input: z.infer<typeof createPriceRuleSchema>
) {
  return prisma.$transaction(async (tx) => {
    const rule = await catalogRepository.createPriceRule(tx, context.tenantId, input);

    await auditLogRepository.createAuditLog(tx, context.tenantId, {
      actorUserId: context.session.userId,
      action: "catalog.priceRule.created",
      entityType: "PriceRule",
      entityId: rule.id,
      metadata: input
    });

    return rule;
  });
}
