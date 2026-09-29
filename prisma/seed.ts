import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.upsert({
    where: { id: "tenant_acme" },
    update: {},
    create: {
      id: "tenant_acme",
      name: "Acme Cloud"
    }
  });

  await prisma.user.createMany({
    data: [
      {
        id: "user_org_admin",
        tenantId: "tenant_acme",
        email: "ops.admin@acme.io",
        name: "Jordan Admin",
        role: "ORG_ADMIN"
      },
      {
        id: "user_sales",
        tenantId: "tenant_acme",
        email: "sales@acme.io",
        name: "Casey Sales",
        role: "SALES"
      },
      {
        id: "user_deal_desk",
        tenantId: "tenant_acme",
        email: "dealdesk@acme.io",
        name: "Avery Deal Desk",
        role: "DEAL_DESK"
      },
      {
        id: "user_finance",
        tenantId: "tenant_acme",
        email: "finance@acme.io",
        name: "Morgan Finance",
        role: "FINANCE"
      },
      {
        id: "user_legal",
        tenantId: "tenant_acme",
        email: "legal@acme.io",
        name: "Taylor Legal",
        role: "LEGAL"
      },
      {
        id: "user_ops",
        tenantId: "tenant_acme",
        email: "ops@acme.io",
        name: "Quinn Ops",
        role: "OPS"
      }
    ],
    skipDuplicates: true
  });

  await prisma.customerAccount.upsert({
    where: { id: "acct_demo_acme" },
    update: {},
    create: {
      id: "acct_demo_acme",
      tenantId: "tenant_acme",
      name: "Northstar Biotech",
      billingCountry: "US",
      primaryContact: "chris@northstarbio.example",
      contractTemplate: "msa-v3"
    }
  });

  await prisma.product.upsert({
    where: {
      tenantId_sku: {
        tenantId: "tenant_acme",
        sku: "CORE-PLATFORM"
      }
    },
    update: {},
    create: {
      id: "prod_demo_core",
      tenantId: "tenant_acme",
      sku: "CORE-PLATFORM",
      name: "Core Platform Subscription",
      billingCadence: "annual",
      basePriceCents: 9600,
      standardTermMonths: 12,
      autoApprovalDiscountPct: 10,
      dealDeskDiscountPct: 20
    }
  });

  await prisma.priceRule.createMany({
    data: [
      {
        id: "rule_core_1_99",
        tenantId: "tenant_acme",
        productId: "prod_demo_core",
        minQuantity: 1,
        maxQuantity: 99,
        floorPriceCents: 7200,
        financeApprovalDiscountPct: 10,
        legalApprovalForNonStandardTerm: true,
        allowedTermMonths: [12, 24]
      }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
