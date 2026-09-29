/**
 * What this file does:
 * Stores invoices, applied payments, and revenue events for the billing side of the workflow.
 * What calls it:
 * src/services/order-service.ts and src/services/invoice-service.ts.
 * What it calls:
 * Prisma Invoice, Payment, and RevenueEvent delegates.
 * One thing a junior engineer would likely get wrong:
 * Updating invoice balance and writing the payment record outside one transaction, which causes financial drift on partial failures.
 */

import type { Prisma } from "@prisma/client";

import type { DbExecutor } from "@/repositories/types";

export async function createInvoice(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.InvoiceUncheckedCreateInput
) {
  return db.invoice.create({
    data: {
      ...data,
      tenantId
    }
  });
}

export async function getInvoiceById(db: DbExecutor, tenantId: string, invoiceId: string) {
  return db.invoice.findFirst({
    // Finance data is tenant-owned and must not be retrievable without the active tenant constraint.
    where: {
      tenantId,
      id: invoiceId
    },
    include: {
      salesOrder: true,
      // ⚠️ SENIOR NOTE: Existing payments load with the invoice so finance workflows can extend later into duplicate-reference checks without changing call sites.
      payments: true
    }
  });
}

export async function createPayment(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.PaymentUncheckedCreateInput
) {
  return db.payment.create({
    data: {
      ...data,
      tenantId
    }
  });
}

export async function updateInvoiceBalance(
  db: DbExecutor,
  tenantId: string,
  invoiceId: string,
  balanceCents: number,
  status: "PARTIALLY_PAID" | "PAID"
) {
  return db.invoice.updateMany({
    where: {
      id: invoiceId,
      tenantId
    },
    data: {
      balanceCents,
      status
    }
  });
}

export async function createRevenueEvent(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.RevenueEventUncheckedCreateInput
) {
  return db.revenueEvent.create({
    data: {
      ...data,
      tenantId
    }
  });
}
