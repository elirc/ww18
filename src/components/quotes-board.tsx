"use client";

import Link from "next/link";
import { useState } from "react";

import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { useCreateQuote, useQuotes } from "@/hooks/use-quotes";

export function QuotesBoard() {
  const { data, isLoading } = useQuotes();
  const createQuote = useCreateQuote();
  const [term, setTerm] = useState(24);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel title="Quotes">
        {isLoading ? (
          <p className="text-sm text-steel">Loading quotes...</p>
        ) : (
          <div className="space-y-3">
            {data?.map((quote) => (
              <Link
                key={String(quote.id)}
                href={`/quotes/${String(quote.id)}`}
                className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-signal/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{String(quote.id).slice(0, 12)}</p>
                    <p className="text-sm text-steel">
                      {String((quote.customerAccount as Record<string, unknown>)?.name ?? "Unknown account")}
                    </p>
                  </div>
                  <StatusBadge value={String(quote.status)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Draft Quote">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createQuote.mutate({
              customerAccountId: "acct_demo_acme",
              currency: "USD",
              contractTermMonths: term,
              startsAt: new Date().toISOString(),
              exceptionReason: term > 12 ? "Customer wants a non-standard commercial term." : undefined,
              lines: [
                {
                  productId: "prod_demo_core",
                  quantity: 10,
                  unitPriceCents: term > 12 ? 7000 : 8400
                }
              ]
            });
          }}
        >
          <label className="block text-sm font-medium text-ink">
            Contract term
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
              onChange={(event) => setTerm(Number(event.target.value))}
              value={term}
            >
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
              <option value={36}>36 months</option>
            </select>
          </label>
          <button className="rounded-full bg-signal px-5 py-3 text-sm font-semibold text-white" type="submit">
            {createQuote.isPending ? "Creating..." : "Create quote draft"}
          </button>
          {createQuote.error ? (
            <p className="text-sm text-rose-700">{createQuote.error.message}</p>
          ) : null}
        </form>
      </Panel>
    </div>
  );
}
