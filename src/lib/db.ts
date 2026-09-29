/**
 * What this file does:
 * Creates the shared Prisma client used by repository modules.
 * What calls it:
 * Repository files under src/repositories and server components that intentionally read through services.
 * What it calls:
 * PrismaClient from @prisma/client.
 * One thing a junior engineer would likely get wrong:
 * Instantiating PrismaClient on every import in development and exhausting database connections.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
