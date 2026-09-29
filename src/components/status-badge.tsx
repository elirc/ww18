import { cn } from "@/lib/ui";

const toneMap: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_DEAL_DESK: "bg-amber-100 text-amber-800",
  PENDING_APPROVAL: "bg-blue-100 text-blue-800",
  APPROVED_EXCEPTION: "bg-emerald-100 text-emerald-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700",
  CONVERTED_TO_ORDER: "bg-moss/15 text-moss",
  ACTIVE: "bg-moss/15 text-moss",
  ISSUED: "bg-blue-100 text-blue-800",
  PAID: "bg-emerald-100 text-emerald-800"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        toneMap[value] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
