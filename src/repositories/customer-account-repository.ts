/**
 * What this file does:
 * Encapsulates tenant-aware customer account lookups used by quote and opportunity workflows.
 * What calls it:
 * src/services/quote-service.ts and future account-management features.
 * What it calls:
 * Prisma CustomerAccount delegate.
 * One thing a junior engineer would likely get wrong:
 * Assuming a foreign key alone proves tenant ownership of an account when ids are globally guessable.
 */

import type { DbExecutor } from "@/repositories/types";

export async function getCustomerAccountById(db: DbExecutor, tenantId: string, customerAccountId: string) {
  return db.customerAccount.findFirst({
    // Customer account scope is load-bearing because quotes, orders, and invoices all inherit from it.
    where: {
      tenantId,
      id: customerAccountId
    }
  });
}
