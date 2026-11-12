/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { EXPORT_FORMAT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { importUsabilityTransfer, type UsabilityTransfer } from "@/lib/usability-transfer";

export async function POST(request: Request) {
  const body = await request.json();
  if (body.format !== EXPORT_FORMAT) {
    return NextResponse.json({ error: "Formato de importación no válido" }, { status: 400 });
  }

  const data = body.data;
  if (!data?.name || !data?.evaluationConfigId || !data?.heuristicSetId) {
    return NextResponse.json({ error: "Estructura JSON inválida" }, { status: 400 });
  }

  // Los identificadores de la base de origen no existen en otro equipo: se busca el set y la configuración por id y,
  // si no están, por nombre (los sets del sistema se cargan con `npm run db:seed`).
  const heuristicSet =
    (await prisma.heuristicSet.findUnique({ where: { id: data.heuristicSetId } })) ??
    (data.heuristicSet?.name ? await prisma.heuristicSet.findFirst({ where: { name: data.heuristicSet.name } }) : null);
  const evaluationConfig =
    (await prisma.evaluationConfig.findUnique({ where: { id: data.evaluationConfigId } })) ??
    (data.evaluationConfig?.name ? await prisma.evaluationConfig.findFirst({ where: { name: data.evaluationConfig.name } }) : null) ??
    (heuristicSet ? await prisma.evaluationConfig.findFirst({ where: { heuristicSetId: heuristicSet.id } }) : null);
  if (!heuristicSet || !evaluationConfig) {
    return NextResponse.json(
      { error: "No se encontró el set de heurísticas o la configuración del proyecto en esta base. Ejecuta antes: npm run db:seed" },
      { status: 400 },
    );
  }

  // Un test de usabilidad exportado se importa como plantilla de la siguiente ronda: plan y escenarios.
  const isUsability = data.kind === "USABILITY_TEST";
  const usability = isUsability
    ? {
        kind: "USABILITY_TEST" as const,
        testPlan: data.testPlan
          ? (() => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id, projectId, createdAt, updatedAt, ...plan } = data.testPlan;
              return { create: plan };
            })()
          : undefined,
        scenarios: {
          create: (data.scenarios ?? []).map(
            (
              scenario: {
                code: string;
                title: string;
                userGoal: string;
                description?: string | null;
                startingPoint: string;
                timeLimitMinutes: number;
                completionMilestone: string;
                scenarioCard: string;
                role?: string | null;
              },
              index: number,
            ) => ({
              orderIndex: index,
              code: scenario.code,
              title: scenario.title,
              userGoal: scenario.userGoal,
              description: scenario.description ?? null,
              startingPoint: scenario.startingPoint,
              timeLimitMinutes: scenario.timeLimitMinutes,
              completionMilestone: scenario.completionMilestone,
              scenarioCard: scenario.scenarioCard,
              role: scenario.role ?? null,
            }),
          ),
        },
      }
    : {};

  const project = await prisma.project.create({
    data: {
      ...usability,
      name: `${data.name} (importado)`,
      description: data.description,
      productName: data.productName,
      prototypeUrl: data.prototypeUrl,
      status: "DRAFT",
      evaluationConfigId: evaluationConfig.id,
      heuristicSetId: heuristicSet.id,
      evaluators: data.evaluators
        ? {
            create: data.evaluators.map(
              (evaluator: { name: string; role?: string; notes?: string; orderIndex?: number }, index: number) => ({
                name: evaluator.name,
                role: evaluator.role,
                notes: evaluator.notes,
                orderIndex: evaluator.orderIndex ?? index,
              }),
            ),
          }
        : undefined,
    },
  });

  // Participantes, sesiones, hallazgos con capturas y problemas (solo si el JSON es de un test de usabilidad completo).
  let imported: Awaited<ReturnType<typeof importUsabilityTransfer>> | null = null;
  if (isUsability && data.transfer?.version === 1 && body.includeResults !== false) {
    imported = await importUsabilityTransfer(project.id, data.transfer as UsabilityTransfer);
  }

  return NextResponse.json({ ...project, imported }, { status: 201 });
}
