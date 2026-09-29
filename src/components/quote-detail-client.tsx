"use client";

import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { useApproveQuote, useQuoteDetail, useSubmitQuote } from "@/hooks/use-quotes";

export function QuoteDetailClient({ quoteId }: { quoteId: string }) {
  const { data, isLoading } = useQuoteDetail(quoteId);
  const submitQuote = useSubmitQuote(quoteId);
  const approveQuote = useApproveQuote(quoteId);

  if (isLoading || !data) {
    return <p className="text-sm text-steel">Loading quote...</p>;
  }

  const lines = (data.lines as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Quote Snapshot">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-ink">{String(data.id)}</p>
            <p className="text-sm text-steel">Customer account: {String((data.customerAccount as Record<string, unknown>)?.name)}</p>
          </div>
          <StatusBadge value={String(data.status)} />
        </div>
        <div className="mt-5 space-y-3">
          {lines.map((line) => (
            <div key={String(line.id)} className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="font-medium text-ink">{String((line.product as Record<string, unknown>)?.name)}</p>
              <p className="text-sm text-steel">
                Qty {String(line.quantity)} at ${Number(line.unitPriceCents ?? 0) / 100}
              </p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Workflow Actions">
        <div className="space-y-3">
          <button
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            onClick={() => submitQuote.mutate({ note: "Submitting from the quote detail workbench." })}
            type="button"
          >
            Submit into routing
          </button>
          <button
            className="w-full rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white"
            onClick={() => approveQuote.mutate({ decision: "APPROVED", note: "Approved from the learning UI." })}
            type="button"
          >
            Approve as current demo user
          </button>
          <div className="rounded-2xl bg-mist p-4 text-sm text-steel">
            The demo client uses the default org admin headers so you can walk the flow end to end without wiring a real IdP.
          </div>
          {submitQuote.error ? <p className="text-sm text-rose-700">{submitQuote.error.message}</p> : null}
          {approveQuote.error ? <p className="text-sm text-rose-700">{approveQuote.error.message}</p> : null}
        </div>
      </Panel>
    </div>
  );
}
