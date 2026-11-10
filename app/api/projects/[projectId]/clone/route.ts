/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const original = await prisma.project.findUnique({
    where: { id: projectId },
    include: { evaluators: true, testPlan: true, scenarios: { orderBy: { orderIndex: "asc" } } },
  });
  if (!original) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  // En un test de usabilidad, duplicar sirve para la siguiente ronda: conserva el plan y los escenarios,
  // pero nunca los participantes, sesiones ni resultados.
  const usability =
    original.kind === "USABILITY_TEST"
      ? {
          kind: "USABILITY_TEST" as const,
          testPlan: original.testPlan
            ? (() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, projectId: _projectId, createdAt, updatedAt, ...plan } = original.testPlan;
                return { create: plan };
              })()
            : undefined,
          scenarios: {
            create: original.scenarios.map((scenario) => ({
              orderIndex: scenario.orderIndex,
              code: scenario.code,
              title: scenario.title,
              userGoal: scenario.userGoal,
              description: scenario.description,
              startingPoint: scenario.startingPoint,
              timeLimitMinutes: scenario.timeLimitMinutes,
              completionMilestone: scenario.completionMilestone,
              scenarioCard: scenario.scenarioCard,
            })),
          },
        }
      : {};

  const duplicate = await prisma.project.create({
    data: {
      ...usability,
      name: `${original.name} (copia)`,
      description: original.description,
      productName: original.productName,
      prototypeUrl: original.prototypeUrl,
      status: "DRAFT",
      evaluationConfigId: original.evaluationConfigId,
      heuristicSetId: original.heuristicSetId,
      evaluators: {
        create: original.evaluators.map((evaluator) => ({
          name: evaluator.name,
          role: evaluator.role,
          notes: evaluator.notes,
          orderIndex: evaluator.orderIndex,
        })),
      },
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
