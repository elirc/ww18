/**
 * What this file does:
 * Contains tenant-aware opportunity persistence operations.
 * What calls it:
 * src/services/opportunity-service.ts and dashboard queries.
 * What it calls:
 * Prisma Opportunity delegate.
 * One thing a junior engineer would likely get wrong:
 * Trusting client-provided owner ids instead of binding the opportunity to the authenticated user in the service layer.
 */

import type { Prisma } from "@prisma/client";

import type { DbExecutor } from "@/repositories/types";

export async function listOpportunities(db: DbExecutor, tenantId: string) {
  return db.opportunity.findMany({
    // Opportunities are tenant-owned pipeline objects, so every read stays within the active tenant.
    where: { tenantId },
    include: {
      customerAccount: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createOpportunity(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.OpportunityUncheckedCreateInput
) {
  return db.opportunity.create({
    data: {
      ...data,
      tenantId
    }
  });
}

export async function getOpportunityById(db: DbExecutor, tenantId: string, opportunityId: string) {
  return db.opportunity.findFirst({
    // Opportunity lookups remain tenant-scoped so downstream quote creation cannot bind to another tenant's pipeline record.
    where: {
      tenantId,
      id: opportunityId
    }
  });
}
