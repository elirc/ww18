/**
 * What this file does:
 * Wraps fetch for the client-side demo UI so React Query hooks hit the same API boundary as real consumers.
 * What calls it:
 * Hooks in src/hooks.
 * What it calls:
 * Browser fetch and src/lib/auth/demo-users.ts for default demo headers.
 * One thing a junior engineer would likely get wrong:
 * Bypassing the API layer from the browser and calling service code directly, which erases auth and validation boundaries.
 */

import { DEFAULT_DEMO_EMAIL, DEMO_TENANTS } from "@/lib/auth/demo-users";

type FetchInit = RequestInit & {
  json?: unknown;
};

export async function demoFetch<T>(input: string, init?: FetchInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-demo-user-email": DEFAULT_DEMO_EMAIL,
      "x-active-tenant-id": DEMO_TENANTS.acme,
      ...init?.headers
    },
    body: init?.json ? JSON.stringify(init.json) : init?.body
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Unknown API error");
  }

  return payload.data as T;
}
