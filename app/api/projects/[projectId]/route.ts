/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validators";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      evaluationConfig: true,
      heuristicSet: {
        include: { principles: { orderBy: { orderIndex: "asc" } } },
      },
      evaluators: { orderBy: { orderIndex: "asc" } },
      _count: { select: { findings: true, consolidatedFindings: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(request: Request, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const parsed = projectSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...parsed.data,
      prototypeUrl: parsed.data.prototypeUrl === "" ? null : parsed.data.prototypeUrl,
    },
  });
  return NextResponse.json(project);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { projectId } = await params;
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}
