import { PageShell } from "@/components/page-shell";
import { QuoteDetailClient } from "@/components/quote-detail-client";

export default async function QuoteDetailPage({
  params
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;

  return (
    <PageShell
      title="Quote Detail"
      description="This view is intentionally thin. Submitting, approving, and exception handling all flow through the same API and service boundaries used elsewhere in the product."
    >
      <QuoteDetailClient quoteId={quoteId} />
    </PageShell>
  );
}
