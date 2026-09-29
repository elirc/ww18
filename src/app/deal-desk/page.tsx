import { DealDeskQueue } from "@/components/deal-desk-queue";
import { PageShell } from "@/components/page-shell";

export default function DealDeskPage() {
  return (
    <PageShell
      title="Deal Desk"
      description="Operations reviews quotes that breach commercial policy here. The important architecture point is that resolving the case also moves the quote state in one service transaction."
    >
      <DealDeskQueue />
    </PageShell>
  );
}
