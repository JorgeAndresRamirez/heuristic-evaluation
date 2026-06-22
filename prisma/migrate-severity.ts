/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE Finding SET severity = 'MAJOR' WHERE severity = 'MEDIUM'`);
  await prisma.$executeRawUnsafe(`UPDATE Finding SET severity = 'MINOR' WHERE severity = 'POSITIVE'`);
  await prisma.$executeRawUnsafe(
    `UPDATE ConsolidatedFinding SET finalSeverity = 'MAJOR' WHERE finalSeverity = 'MEDIUM'`,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ConsolidatedFinding SET finalSeverity = 'MINOR' WHERE finalSeverity = 'POSITIVE'`,
  );
  console.log("Migración de severidad completada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
