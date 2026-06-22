/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluatorSchema } from "@/lib/validators";

type Params = { params: Promise<{ projectId: string; evaluatorId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { projectId, evaluatorId } = await params;
  const body = await request.json();
  const parsed = evaluatorSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const evaluator = await prisma.evaluator.update({
    where: { id: evaluatorId, projectId },
    data: parsed.data,
  });
  return NextResponse.json(evaluator);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { projectId, evaluatorId } = await params;
  await prisma.evaluator.delete({ where: { id: evaluatorId, projectId } });
  return NextResponse.json({ ok: true });
}
