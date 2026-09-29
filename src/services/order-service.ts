/**
 * What this file does:
 * Converts approved quotes into orders and activates orders into provisioning + billing work.
 * What calls it:
 * src/services/quote-service.ts and src/app/api/orders/[orderId]/activate/route.ts.
 * What it calls:
 * Order, invoice, workflow-job, and audit-log repositories.
 * One thing a junior engineer would likely get wrong:
 * Triggering provisioning and invoice creation before the order status update is durable, which makes retries unsafe.
 */

import type { Prisma } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import * as auditLogRepository from "@/repositories/audit-log-repository";
import * as invoiceRepository from "@/repositories/invoice-repository";
import * as orderRepository from "@/repositories/order-repository";
import * as workflowJobRepository from "@/repositories/workflow-job-repository";

export async function createOrderFromApprovedQuote(
  tx: Prisma.TransactionClient,
  context: RequestContext,
  quote: {
    id: string;
    customerAccountId: string;
    contractTermMonths: number;
    totalCents: number;
    startsAt: Date;
    lines: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
  }
) {
  const order = await orderRepository.createOrderAggregate(tx, context.tenantId, {
    quoteId: quote.id,
    customerAccountId: quote.customerAccountId,
    status: "DRAFT",
    effectiveAt: quote.startsAt,
    billingStartDate: quote.startsAt,
    contractTermMonths: quote.contractTermMonths,
    totalCents: quote.totalCents,
    lines: quote.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      serviceStartAt: quote.startsAt
    }))
  });

  await auditLogRepository.createAuditLog(tx, context.tenantId, {
    actorUserId: context.session.userId,
    action: "order.created_from_quote",
    entityType: "SalesOrder",
    entityId: order.id,
    metadata: {
      quoteId: quote.id
    }
  });

  return order;
}

export async function activateOrder(context: RequestContext, orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await orderRepository.getOrderById(tx, context.tenantId, orderId);

    if (!order) {
      throw new AppError(404, `Order ${orderId} was not found.`);
    }

    if (order.status !== "DRAFT") {
      throw new AppError(409, `Only draft orders can be activated. Current status: ${order.status}.`);
    }

    // ⚠️ SENIOR NOTE: Activation is the point where downstream systems start acting, so every side effect stays in the same transaction.
    await orderRepository.updateOrderStatus(tx, context.tenantId, order.id, "ACTIVE");

    const provisioningRequest = await orderRepository.createProvisioningRequest(tx, context.tenantId, {
      orderId: order.id,
      status: "QUEUED",
      payload: {
        orderId: order.id,
        customerAccountId: order.customerAccountId,
        lineCount: order.lines.length
      }
    });

    const invoice = await invoiceRepository.createInvoice(tx, context.tenantId, {
      orderId: order.id,
      status: "ISSUED",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      totalCents: order.totalCents,
      balanceCents: order.totalCents
    });

    await workflowJobRepository.enqueueWorkflowJob(tx, context.tenantId, {
      jobType: "PROVISIONING_HANDOFF",
      status: "PENDING",
      payload: {
        provisioningRequestId: provisioningRequest.id,
        orderId: order.id
      },
      runAt: new Date()
    });

    await auditLogRepository.createAuditLog(tx, context.tenantId, {
      actorUserId: context.session.userId,
      action: "order.activated",
      entityType: "SalesOrder",
      entityId: order.id,
      metadata: {
        provisioningRequestId: provisioningRequest.id,
        invoiceId: invoice.id
      }
    });

    return {
      orderId: order.id,
      provisioningRequestId: provisioningRequest.id,
      invoiceId: invoice.id
    };
  });
}
