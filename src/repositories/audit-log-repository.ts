/**
 * What this file does:
 * Writes audit events for sensitive commercial and financial state changes.
 * What calls it:
 * Quote, order, and invoice services after important transitions.
 * What it calls:
 * Prisma AuditLog delegate.
 * One thing a junior engineer would likely get wrong:
 * Logging only the happy path and forgetting rejected approvals or denied exceptions, which destroys operational forensics.
 */

import type { Prisma } from "@prisma/client";

import type { DbExecutor } from "@/repositories/types";

export async function createAuditLog(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.AuditLogUncheckedCreateInput
) {
  return db.auditLog.create({
    data: {
      ...data,
      tenantId
    }
  });
}
