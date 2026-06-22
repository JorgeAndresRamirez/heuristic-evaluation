/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { prisma } from "../lib/prisma";

async function migrate() {
  const findings = await prisma.finding.findMany({
    include: { principles: true },
  });

  const pending = findings.filter((finding) => finding.principles.length === 0);
  if (pending.length === 0) {
    console.log("Todos los hallazgos ya tienen principios asociados.");
    return;
  }

  console.log(
    `${pending.length} hallazgo(s) sin principios. Ejecuta db:seed o edítalos manualmente en la app.`,
  );
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
