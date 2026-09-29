import { cn } from "@/lib/ui";

export function Panel({
  title,
  children,
  className
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-panel", className)}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-steel">{title}</h3>
      <div className="mt-4">{children}</div>
    </article>
  );
}
