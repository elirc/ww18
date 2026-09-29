import type { Metadata } from "next";
import Link from "next/link";

import { AppProviders } from "@/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Q2C Ops Platform",
  description: "Production-style quote-to-cash learning project"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-ink">
        <AppProviders>
          <div className="mx-auto min-h-screen max-w-7xl px-6 py-8">
            <header className="mb-8 rounded-[28px] border border-white/70 bg-white/85 px-6 py-5 shadow-panel backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-steel">Quote to Cash</p>
                  <h1 className="font-display text-4xl text-ink">Revenue Operations Workbench</h1>
                  <p className="mt-2 max-w-2xl text-sm text-steel">
                    Multi-tenant Q2C platform with CPQ, approvals, deal desk, order activation,
                    invoicing, payment application, and revenue-recognition triggers.
                  </p>
                </div>
                <nav className="flex flex-wrap gap-3 text-sm font-medium text-steel">
                  <Link href="/">Overview</Link>
                  <Link href="/opportunities">Opportunities</Link>
                  <Link href="/quotes">Quotes</Link>
                  <Link href="/deal-desk">Deal Desk</Link>
                  <Link href="/catalog">Catalog</Link>
                </nav>
              </div>
            </header>
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
