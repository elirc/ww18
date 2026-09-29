/**
 * What this file does:
 * Persists async workflow jobs so provisioning and revenue handoffs can be retried safely.
 * What calls it:
 * src/services/order-service.ts and src/services/invoice-service.ts.
 * What it calls:
 * Prisma WorkflowJob delegate.
 * One thing a junior engineer would likely get wrong:
 * Firing network side effects inline in the request and losing retry visibility when an external system is down.
 */

import type { Prisma } from "@prisma/client";

import type { DbExecutor } from "@/repositories/types";

export async function enqueueWorkflowJob(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.WorkflowJobUncheckedCreateInput
) {
  return db.workflowJob.create({
    data: {
      ...data,
      tenantId
    }
  });
}
