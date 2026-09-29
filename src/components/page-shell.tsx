import { cn } from "@/lib/ui";

export function PageShell({
  title,
  description,
  children,
  className
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div>
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">{description}</p>
      </div>
      {children}
    </section>
  );
}
