/**
 * What this file does:
 * Provides a tiny typed JSON parsing helper so route files keep their body parsing consistent.
 * What calls it:
 * API route handlers under src/app/api.
 * What it calls:
 * Zod schemas supplied by the caller.
 * One thing a junior engineer would likely get wrong:
 * Parsing request JSON in several different ways and accidentally skipping schema validation on one route.
 */

import type { z } from "zod";

export async function parseJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const body = await request.json();
  return schema.parse(body);
}
