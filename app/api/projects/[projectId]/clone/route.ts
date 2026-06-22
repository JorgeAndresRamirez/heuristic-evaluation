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
    include: { evaluators: true },
  });
  if (!original) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const duplicate = await prisma.project.create({
    data: {
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
