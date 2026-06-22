/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluatorSchema } from "@/lib/validators";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const evaluators = await prisma.evaluator.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { findings: true } } },
  });
  return NextResponse.json(evaluators);
}

export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const parsed = evaluatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const last = await prisma.evaluator.findFirst({
    where: { projectId },
    orderBy: { orderIndex: "desc" },
  });

  const evaluator = await prisma.evaluator.create({
    data: {
      projectId,
      orderIndex: (last?.orderIndex ?? -1) + 1,
      ...parsed.data,
    },
  });

  return NextResponse.json(evaluator, { status: 201 });
}
