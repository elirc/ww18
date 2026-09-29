"use client";

import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { useDealDeskCases, useResolveDealDeskCase } from "@/hooks/use-deal-desk";

function CaseActions({ quoteId }: { quoteId: string }) {
  const resolveCase = useResolveDealDeskCase(quoteId);

  return (
    <div className="flex gap-3">
      <button
        className="rounded-full bg-moss px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
        onClick={() =>
          resolveCase.mutate({
            status: "APPROVED_EXCEPTION",
            resolutionNote: "Approved with documented exception handling."
          })
        }
        type="button"
      >
        Approve exception
      </button>
      <button
        className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
        onClick={() =>
          resolveCase.mutate({
            status: "DENIED_EXCEPTION",
            resolutionNote: "Denied because the concession breaches commercial policy."
          })
        }
        type="button"
      >
        Deny
      </button>
    </div>
  );
}

export function DealDeskQueue() {
  const { data, isLoading } = useDealDeskCases();

  return (
    <Panel title="Exception Queue">
      {isLoading ? (
        <p className="text-sm text-steel">Loading exception queue...</p>
      ) : (
        <div className="space-y-4">
          {data?.map((item) => (
            <div key={String(item.id)} className="rounded-2xl border border-slate-200 px-4 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-ink">
                      {String((item.quote as Record<string, unknown>)?.id).slice(0, 12)}
                    </p>
                    <StatusBadge value={String(item.status)} />
                  </div>
                  <p className="text-sm text-steel">
                    {String((item.quote as Record<string, unknown>)?.customerAccount?.name ?? "Unknown account")}
                  </p>
                  <p className="text-sm leading-6 text-steel">{String(item.reason)}</p>
                </div>
                <CaseActions quoteId={String(item.quoteId)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
