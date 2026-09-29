/**
 * What this file does:
 * Persists sales orders, order lines, and provisioning records after quote approval.
 * What calls it:
 * src/services/order-service.ts and src/services/quote-service.ts.
 * What it calls:
 * Prisma SalesOrder and ProvisioningRequest delegates.
 * One thing a junior engineer would likely get wrong:
 * Creating an order from a quote without copying the priced line snapshot, which makes downstream billing depend on mutable catalog data.
 */

import type { Prisma } from "@prisma/client";

import type { DbExecutor } from "@/repositories/types";

export async function createOrderAggregate(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.SalesOrderUncheckedCreateInput & {
    lines: Prisma.OrderLineUncheckedCreateWithoutSalesOrderInput[];
  }
) {
  return db.salesOrder.create({
    data: {
      ...data,
      tenantId,
      lines: {
        create: data.lines
      }
    },
    include: {
      lines: true
    }
  });
}

export async function getOrderById(db: DbExecutor, tenantId: string, orderId: string) {
  return db.salesOrder.findFirst({
    // Tenant scope remains on the root order because invoices and provisioning inherit from it.
    where: {
      tenantId,
      id: orderId
    },
    include: {
      lines: true,
      invoices: true,
      // ⚠️ SENIOR NOTE: Pulling invoices with the order lets activation logic guard against duplicate downstream documents without a second trip.
      quote: {
        include: {
          customerAccount: true
        }
      }
    }
  });
}

export async function updateOrderStatus(
  db: DbExecutor,
  tenantId: string,
  orderId: string,
  status: "ACTIVE" | "CANCELLED"
) {
  return db.salesOrder.updateMany({
    where: {
      id: orderId,
      tenantId
    },
    data: {
      status
    }
  });
}

export async function createProvisioningRequest(
  db: DbExecutor,
  tenantId: string,
  data: Prisma.ProvisioningRequestUncheckedCreateInput
) {
  return db.provisioningRequest.upsert({
    where: {
      orderId: data.orderId
    },
    update: {
      status: data.status,
      payload: data.payload
    },
    create: {
      ...data,
      tenantId
    }
  });
}
