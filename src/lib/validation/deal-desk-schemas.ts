/**
 * What this file does:
 * Validates deal desk resolution actions at the API boundary.
 * What calls it:
 * Deal desk route handlers.
 * What it calls:
 * Zod only.
 * One thing a junior engineer would likely get wrong:
 * Treating every exception as a boolean approval instead of requiring a resolution note for auditability.
 */

import { z } from "zod";

export const resolveDealDeskCaseSchema = z.object({
  status: z.enum(["APPROVED_EXCEPTION", "DENIED_EXCEPTION"]),
  resolutionNote: z.string().min(5).max(1000)
});
