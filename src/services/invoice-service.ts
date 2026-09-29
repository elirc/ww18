/**
 * What this file does:
 * Applies payments to invoices and emits revenue-recognition triggers after durable billing updates.
 * What calls it:
 * src/app/api/invoices/[invoiceId]/apply-payment/route.ts.
 * What it calls:
 * Invoice, workflow-job, and audit-log repositories.
 * One thing a junior engineer would likely get wrong:
 * Marking the invoice paid before checking for overpayment and then having no safe rollback path once a payment row is inserted.
 */

import type { PaymentMethod } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import * as auditLogRepository from "@/repositories/audit-log-repository";
import * as invoiceRepository from "@/repositories/invoice-repository";
import * as workflowJobRepository from "@/repositories/workflow-job-repository";

export async function applyPayment(
  context: RequestContext,
  invoiceId: string,
  input: { amountCents: number; method: PaymentMethod; reference: string }
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await invoiceRepository.getInvoiceById(tx, context.tenantId, invoiceId);

    if (!invoice) {
      throw new AppError(404, `Invoice ${invoiceId} was not found.`);
    }

    if (!["ISSUED", "PARTIALLY_PAID"].includes(invoice.status)) {
      throw new AppError(409, `Invoice ${invoice.id} cannot accept a payment while ${invoice.status}.`);
    }

    if (input.amountCents > invoice.balanceCents) {
      throw new AppError(422, "Payment amount exceeds the outstanding balance.");
    }

    const payment = await invoiceRepository.createPayment(tx, context.tenantId, {
      invoiceId: invoice.id,
      amountCents: input.amountCents,
      method: input.method,
      reference: input.reference
    });

    // ⚠️ SENIOR NOTE: Balance calculation happens after the durable payment insert so audit and reconciliation can always reconstruct the attempted application.
    const newBalance = invoice.balanceCents - input.amountCents;
    const nextStatus = newBalance === 0 ? "PAID" : "PARTIALLY_PAID";

    await invoiceRepository.updateInvoiceBalance(tx, context.tenantId, invoice.id, newBalance, nextStatus);

    const revenueEvent = await invoiceRepository.createRevenueEvent(tx, context.tenantId, {
      orderId: invoice.orderId,
      invoiceId: invoice.id,
      sourcePaymentId: payment.id,
      eventType: "PAYMENT_RECEIVED",
      status: newBalance === 0 ? "READY_FOR_RECOGNITION" : "PENDING",
      amountCents: input.amountCents
    });

    await workflowJobRepository.enqueueWorkflowJob(tx, context.tenantId, {
      jobType: "REVENUE_RECOGNITION",
      status: "PENDING",
      payload: {
        revenueEventId: revenueEvent.id,
        invoiceId: invoice.id
      },
      runAt: new Date()
    });

    await auditLogRepository.createAuditLog(tx, context.tenantId, {
      actorUserId: context.session.userId,
      action: "invoice.payment_applied",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: {
        paymentId: payment.id,
        revenueEventId: revenueEvent.id,
        amountCents: input.amountCents
      }
    });

    return {
      invoiceId: invoice.id,
      paymentId: payment.id,
      balanceCents: newBalance,
      revenueEventId: revenueEvent.id
    };
  });
}
