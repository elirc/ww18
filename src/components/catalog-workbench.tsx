"use client";

import { useState } from "react";

import { Panel } from "@/components/panel";
import { useCatalog, useCreateProduct } from "@/hooks/use-catalog";

export function CatalogWorkbench() {
  const { data, isLoading } = useCatalog();
  const createProduct = useCreateProduct();
  const [sku, setSku] = useState("CORE-ANNUAL");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Product Catalog">
        {isLoading ? (
          <p className="text-sm text-steel">Loading catalog...</p>
        ) : (
          <div className="space-y-3">
            {data?.map((product) => (
              <div key={String(product.id)} className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="font-semibold text-ink">
                  {String(product.name)} <span className="text-steel">({String(product.sku)})</span>
                </p>
                <p className="text-sm text-steel">
                  List price ${(Number(product.basePriceCents ?? 0) / 100).toLocaleString()} with auto-approval at{" "}
                  {String(product.autoApprovalDiscountPct)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Add Product">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createProduct.mutate({
              sku,
              name: "Core Platform Annual",
              billingCadence: "annual",
              basePriceCents: 9600,
              standardTermMonths: 12,
              autoApprovalDiscountPct: 10,
              dealDeskDiscountPct: 20
            });
          }}
        >
          <label className="block text-sm font-medium text-ink">
            SKU
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
              onChange={(event) => setSku(event.target.value)}
              value={sku}
            />
          </label>
          <button className="rounded-full bg-signal px-5 py-3 text-sm font-semibold text-white" type="submit">
            {createProduct.isPending ? "Saving..." : "Create product"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
