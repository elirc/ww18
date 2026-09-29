# Domain Model

```mermaid
erDiagram
  Tenant ||--o{ User : has
  Tenant ||--o{ CustomerAccount : owns
  Tenant ||--o{ Product : owns
  Tenant ||--o{ PriceRule : owns
  Tenant ||--o{ Opportunity : owns
  Tenant ||--o{ Quote : owns
  Tenant ||--o{ DealDeskCase : owns
  Tenant ||--o{ SalesOrder : owns
  Tenant ||--o{ Invoice : owns
  Tenant ||--o{ Payment : owns
  Tenant ||--o{ RevenueEvent : owns
  Tenant ||--o{ WorkflowJob : owns
  Tenant ||--o{ AuditLog : owns

  CustomerAccount ||--o{ Opportunity : pipeline_for
  CustomerAccount ||--o{ Quote : commercial_for
  CustomerAccount ||--o{ SalesOrder : contract_for
  Product ||--o{ PriceRule : priced_by
  Product ||--o{ QuoteLine : quoted_as
  Opportunity ||--o{ Quote : converts_to
  Quote ||--o{ QuoteLine : contains
  Quote ||--o{ QuoteApproval : routes_to
  Quote ||--o| DealDeskCase : may_create
  Quote ||--o| SalesOrder : converts_to
  SalesOrder ||--o{ OrderLine : contains
  SalesOrder ||--o| ProvisioningRequest : hands_off
  SalesOrder ||--o{ Invoice : bills
  Invoice ||--o{ Payment : applies
  Invoice ||--o{ RevenueEvent : triggers
  Payment ||--o{ RevenueEvent : sources
```

Entities and ownership:

- `Tenant`
  Schema: `prisma/schema.prisma` model `Tenant`
  Primary service owner: tenant scope is enforced from `src/lib/auth/session.ts` and then consumed across all service files
- `CustomerAccount`
  Schema: `prisma/schema.prisma` model `CustomerAccount`
  Primary service owner: `src/services/opportunity-service.ts` and `src/services/quote-service.ts`
- `Product`
  Schema: `prisma/schema.prisma` model `Product`
  Primary service owner: `src/services/catalog-service.ts`
- `PriceRule`
  Schema: `prisma/schema.prisma` model `PriceRule`
  Primary service owner: `src/services/catalog-service.ts`
- `Opportunity`
  Schema: `prisma/schema.prisma` model `Opportunity`
  Primary service owner: `src/services/opportunity-service.ts`
- `Quote`
  Schema: `prisma/schema.prisma` model `Quote`
  Primary service owner: `src/services/quote-service.ts`
- `QuoteLine`
  Schema: `prisma/schema.prisma` model `QuoteLine`
  Primary service owner: `src/services/quote-service.ts`
- `QuoteApproval`
  Schema: `prisma/schema.prisma` model `QuoteApproval`
  Primary service owner: `src/services/quote-service.ts`
- `DealDeskCase`
  Schema: `prisma/schema.prisma` model `DealDeskCase`
  Primary service owner: `src/services/quote-service.ts`
- `SalesOrder`
  Schema: `prisma/schema.prisma` model `SalesOrder`
  Primary service owner: `src/services/order-service.ts`
- `OrderLine`
  Schema: `prisma/schema.prisma` model `OrderLine`
  Primary service owner: `src/services/order-service.ts`
- `ProvisioningRequest`
  Schema: `prisma/schema.prisma` model `ProvisioningRequest`
  Primary service owner: `src/services/order-service.ts`
- `Invoice`
  Schema: `prisma/schema.prisma` model `Invoice`
  Primary service owner: `src/services/invoice-service.ts`
- `Payment`
  Schema: `prisma/schema.prisma` model `Payment`
  Primary service owner: `src/services/invoice-service.ts`
- `RevenueEvent`
  Schema: `prisma/schema.prisma` model `RevenueEvent`
  Primary service owner: `src/services/invoice-service.ts`
- `WorkflowJob`
  Schema: `prisma/schema.prisma` model `WorkflowJob`
  Primary service owner: enqueue points live in `src/services/order-service.ts` and `src/services/invoice-service.ts`
- `AuditLog`
  Schema: `prisma/schema.prisma` model `AuditLog`
  Primary service owner: called from `src/services/catalog-service.ts`, `src/services/opportunity-service.ts`, `src/services/quote-service.ts`, `src/services/order-service.ts`, and `src/services/invoice-service.ts`
