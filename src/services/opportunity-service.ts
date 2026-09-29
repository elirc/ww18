/**
 * What this file does:
 * Owns opportunity creation and listing behind an explicit service boundary.
 * What calls it:
 * src/app/api/opportunities/route.ts and dashboard reads.
 * What it calls:
 * src/repositories/opportunity-repository.ts and src/repositories/audit-log-repository.ts.
 * One thing a junior engineer would likely get wrong:
 * Taking ownerUserId from the request body instead of binding ownership to the authenticated session.
 */

import type { z } from "zod";

import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import * as auditLogRepository from "@/repositories/audit-log-repository";
import * as customerAccountRepository from "@/repositories/customer-account-repository";
import * as opportunityRepository from "@/repositories/opportunity-repository";
import type { createOpportunitySchema } from "@/lib/validation/opportunity-schemas";

export async function listPipeline(context: RequestContext) {
  return opportunityRepository.listOpportunities(prisma, context.tenantId);
}

export async function createOpportunity(
  context: RequestContext,
  input: z.infer<typeof createOpportunitySchema>
) {
  const customerAccount = await customerAccountRepository.getCustomerAccountById(
    prisma,
    context.tenantId,
    input.customerAccountId
  );

  if (!customerAccount) {
    throw new AppError(404, `Customer account ${input.customerAccountId} was not found.`);
  }

  return prisma.$transaction(async (tx) => {
    const opportunity = await opportunityRepository.createOpportunity(tx, context.tenantId, {
      ...input,
      // ⚠️ SENIOR NOTE: Ownership comes from the authenticated session, not the request body, to prevent horizontal privilege abuse.
      ownerUserId: context.session.userId,
      stage: "DISCOVERY",
      expectedCloseDate: new Date(input.expectedCloseDate)
    });

    await auditLogRepository.createAuditLog(tx, context.tenantId, {
      actorUserId: context.session.userId,
      action: "opportunity.created",
      entityType: "Opportunity",
      entityId: opportunity.id,
      metadata: input
    });

    return opportunity;
  });
}
