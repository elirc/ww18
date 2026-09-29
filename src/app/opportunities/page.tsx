import { OpportunitiesBoard } from "@/components/opportunities-board";
import { PageShell } from "@/components/page-shell";

export default function OpportunitiesPage() {
  return (
    <PageShell
      title="Opportunities"
      description="Sales creates pipeline opportunities here. The important backend detail is that ownership comes from the authenticated session in the service layer, not from the browser payload."
    >
      <OpportunitiesBoard />
    </PageShell>
  );
}
