"use client";

import { useState } from "react";

import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { useCreateOpportunity, useOpportunities } from "@/hooks/use-opportunities";

export function OpportunitiesBoard() {
  const [name, setName] = useState("Northstar Expansion");
  const { data, isLoading } = useOpportunities();
  const createOpportunity = useCreateOpportunity();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Pipeline">
        {isLoading ? (
          <p className="text-sm text-steel">Loading opportunities...</p>
        ) : (
          <div className="space-y-3">
            {data?.map((opportunity) => (
              <div
                key={String(opportunity.id)}
                className="rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{String(opportunity.name)}</p>
                    <p className="text-sm text-steel">
                      {String((opportunity.customerAccount as Record<string, unknown>)?.name ?? "Unknown account")}
                    </p>
                  </div>
                  <StatusBadge value={String(opportunity.stage)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Create Opportunity">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createOpportunity.mutate({
              customerAccountId: "acct_demo_acme",
              name,
              currency: "USD",
              targetAmountCents: 72000,
              expectedCloseDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              notes: "Learning-project seeded pipeline opportunity."
            });
          }}
        >
          <label className="block text-sm font-medium text-ink">
            Opportunity name
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-signal/30 transition focus:ring"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <button
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            disabled={createOpportunity.isPending}
            type="submit"
          >
            {createOpportunity.isPending ? "Creating..." : "Create opportunity"}
          </button>
          {createOpportunity.error ? (
            <p className="text-sm text-rose-700">{createOpportunity.error.message}</p>
          ) : null}
        </form>
      </Panel>
    </div>
  );
}
