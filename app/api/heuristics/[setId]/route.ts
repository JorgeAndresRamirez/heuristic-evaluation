/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { heuristicSetSchema } from "@/lib/validators";

type Params = { params: Promise<{ setId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { setId } = await params;
  const set = await prisma.heuristicSet.findUnique({
    where: { id: setId },
    include: {
      principles: { orderBy: { orderIndex: "asc" } },
      _count: { select: { evaluationConfigs: true, projects: true } },
    },
  });
  if (!set) return NextResponse.json({ error: "Set no encontrado" }, { status: 404 });
  return NextResponse.json(set);
}

export async function PATCH(request: Request, { params }: Params) {
  const { setId } = await params;
  const existing = await prisma.heuristicSet.findUnique({ where: { id: setId } });
  if (!existing) return NextResponse.json({ error: "Set no encontrado" }, { status: 404 });
  if (existing.isSystem) {
    return NextResponse.json({ error: "Los sets del sistema no se pueden editar" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = heuristicSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const set = await prisma.heuristicSet.update({
    where: { id: setId },
    data: parsed.data,
  });
  return NextResponse.json(set);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { setId } = await params;
  const existing = await prisma.heuristicSet.findUnique({ where: { id: setId } });
  if (!existing) return NextResponse.json({ error: "Set no encontrado" }, { status: 404 });
  if (existing.isSystem) {
    return NextResponse.json({ error: "Los sets del sistema no se pueden eliminar" }, { status: 403 });
  }

  await prisma.heuristicSet.delete({ where: { id: setId } });
  return NextResponse.json({ ok: true });
}
