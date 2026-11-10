/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { PrismaClient } from "@/lib/generated/prisma";

/** Increment when Prisma schema changes require a fresh client in dev. */
const PRISMA_SCHEMA_REVISION = 3;

type GlobalPrisma = {
  prisma?: PrismaClient;
  prismaRevision?: number;
};

const globalForPrisma = globalThis as unknown as GlobalPrisma;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  if (
    process.env.NODE_ENV !== "production" &&
    globalForPrisma.prisma &&
    globalForPrisma.prismaRevision === PRISMA_SCHEMA_REVISION
  ) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaRevision = PRISMA_SCHEMA_REVISION;
  }

  return client;
}

export const prisma = getPrismaClient();
