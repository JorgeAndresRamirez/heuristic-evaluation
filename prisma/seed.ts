/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { PrismaClient } from "../lib/generated/prisma";
import { HEURISTIC_SEEDS } from "../lib/heuristic-seeds";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando sets de heurísticas del sistema...");

  for (const seed of HEURISTIC_SEEDS) {
    const existing = await prisma.heuristicSet.findFirst({
      where: { source: seed.source, isSystem: true },
    });

    if (existing) {
      console.log(`  · Omitido (ya existe): ${seed.name}`);
      continue;
    }

    const set = await prisma.heuristicSet.create({
      data: {
        name: seed.name,
        description: seed.description,
        source: seed.source,
        isSystem: true,
        principles: {
          create: seed.principles.map((principle, index) => ({
            orderIndex: index,
            title: principle.title,
            description: principle.description,
            goodExampleHtml: principle.goodExampleHtml,
            badExampleHtml: principle.badExampleHtml,
          })),
        },
      },
    });

    await prisma.evaluationConfig.create({
      data: {
        name: `Configuración estándar — ${seed.name}`,
        description: `Configuración predeterminada basada en ${seed.name}.`,
        heuristicSetId: set.id,
        isDefault: seed.source === "NIELSEN",
      },
    });

    console.log(`  ✓ Creado: ${seed.name}`);
  }

  const nielsenSet = await prisma.heuristicSet.findFirst({
    where: { source: "NIELSEN", isSystem: true },
    include: { principles: true },
  });

  if (nielsenSet) {
    const existingDemo = await prisma.project.findFirst({
      where: { name: "App de reservas — Evaluación piloto" },
    });

    if (!existingDemo) {
      const config = await prisma.evaluationConfig.findFirst({
        where: { heuristicSetId: nielsenSet.id },
      });

      if (config) {
        const project = await prisma.project.create({
          data: {
            name: "App de reservas — Evaluación piloto",
            description: "Proyecto de demostración para evaluación heurística colaborativa.",
            productName: "ReservaYa",
            prototypeUrl: "https://ejemplo.local/reservas",
            status: "IN_EVALUATION",
            evaluationConfigId: config.id,
            heuristicSetId: nielsenSet.id,
            evaluators: {
              create: [
                { name: "Ana López", role: "UX Researcher", orderIndex: 0 },
                { name: "Carlos Ruiz", role: "Diseñador UI", orderIndex: 1 },
                { name: "María Gómez", role: "Product Owner", orderIndex: 2 },
              ],
            },
          },
          include: { evaluators: true },
        });

        const principle = nielsenSet.principles[0];
        const evaluator = project.evaluators[0];

        if (principle && evaluator) {
          await prisma.finding.create({
            data: {
              projectId: project.id,
              evaluatorId: evaluator.id,
              screen: "Pantalla de confirmación de reserva",
              task: "Completar una reserva de hotel",
              step: "Paso 4 — Confirmar pago",
              descriptionHtml:
                "<p>Tras pulsar «Confirmar», no hay indicador de progreso ni mensaje de éxito inmediato. El usuario puede pulsar varias veces el botón.</p>",
              severity: "CRITICAL",
              scope: "GENERALIZED",
              solutionHtml:
                "<p>Mostrar spinner en el botón y un toast de confirmación al completar la reserva.</p>",
              riskAssessment:
                "Riesgo bajo: cambio de UI localizado. Impacto alto en confianza del usuario.",
              principles: {
                create: [{ principleId: principle.id, orderIndex: 0 }],
              },
            },
          });
        }

        console.log("  ✓ Proyecto demo creado");
      }
    }
  }

  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
