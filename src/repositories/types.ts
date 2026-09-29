/**
 * What this file does:
 * Shares the database-executor type used by repositories so services can pass either PrismaClient or a transaction.
 * What calls it:
 * Repository modules across src/repositories.
 * What it calls:
 * Prisma runtime types from @prisma/client.
 * One thing a junior engineer would likely get wrong:
 * Hard-coding repositories to PrismaClient only and then abandoning transactions because the types get awkward.
 */

import type { Prisma, PrismaClient } from "@prisma/client";

export type DbExecutor = PrismaClient | Prisma.TransactionClient;
