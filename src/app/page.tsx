import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { Panel } from "@/components/panel";

const featureCards = [
  {
    title: "CPQ and pricing controls",
    body: "Products, pricing rules, floor prices, discount thresholds, and term validation stay in the catalog and quote services."
  },
  {
    title: "Operational routing",
    body: "Deal desk, finance, and legal approvals are generated from quote policy decisions instead of UI conditionals."
  },
  {
    title: "Downstream fulfillment",
    body: "Approved quotes create orders, activated orders enqueue provisioning handoffs, and billing triggers revenue events."
  }
];

export default function HomePage() {
  return (
    <PageShell
      title="Production-Style Learning Project"
      description="This codebase models a tenant-aware quote-to-cash workflow with explicit service, repository, auth, validation, and async handoff boundaries. The UI stays intentionally thin so the backend patterns remain easy to trace."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Architecture Summary">
          <div className="space-y-4 text-sm leading-6 text-steel">
            <p>
              The app uses Next.js App Router, TypeScript, Prisma, Zod, and React Query. I kept REST instead of tRPC because this domain benefits from visible request boundaries and explicit handler-level auth.
            </p>
            <p>
              Multi-tenancy is first-class because quote, order, invoice, and revenue data are all tenant-owned. Every repository read and write that touches tenant data scopes by <code>tenantId</code>.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white" href="/opportunities">
                Start with opportunities
              </Link>
              <Link className="rounded-full bg-signal px-5 py-3 text-sm font-semibold text-white" href="/quotes">
                Jump to quotes
              </Link>
            </div>
          </div>
        </Panel>
        <div className="grid gap-6">
          {featureCards.map((card) => (
            <Panel key={card.title} title={card.title}>
              <p className="text-sm leading-6 text-steel">{card.body}</p>
            </Panel>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
