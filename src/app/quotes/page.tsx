import { PageShell } from "@/components/page-shell";
import { QuotesBoard } from "@/components/quotes-board";

export default function QuotesPage() {
  return (
    <PageShell
      title="Quotes"
      description="Quote creation pulls active products and price rules from the tenant catalog, computes pricing decisions, and stores a snapshot that downstream billing can trust."
    >
      <QuotesBoard />
    </PageShell>
  );
}
