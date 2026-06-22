/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { EXPORT_FORMAT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  if (body.format !== EXPORT_FORMAT) {
    return NextResponse.json({ error: "Formato de importación no válido" }, { status: 400 });
  }

  const data = body.data;
  if (!data?.name || !data?.evaluationConfigId || !data?.heuristicSetId) {
    return NextResponse.json({ error: "Estructura JSON inválida" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: `${data.name} (importado)`,
      description: data.description,
      productName: data.productName,
      prototypeUrl: data.prototypeUrl,
      status: "DRAFT",
      evaluationConfigId: data.evaluationConfigId,
      heuristicSetId: data.heuristicSetId,
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

  return NextResponse.json(project, { status: 201 });
}
