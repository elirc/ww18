import { CatalogWorkbench } from "@/components/catalog-workbench";
import { PageShell } from "@/components/page-shell";

export default function CatalogPage() {
  return (
    <PageShell
      title="Catalog"
      description="Products and price rules are upstream from every commercial workflow, so catalog writes go through the same audited service boundary as approvals and billing."
    >
      <CatalogWorkbench />
    </PageShell>
  );
}
