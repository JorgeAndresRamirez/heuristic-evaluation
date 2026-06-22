/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluationConfigSchema } from "@/lib/validators";

type Params = { params: Promise<{ configId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { configId } = await params;
  const config = await prisma.evaluationConfig.findUnique({
    where: { id: configId },
    include: {
      heuristicSet: {
        include: { principles: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });
  if (!config) return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 });
  return NextResponse.json(config);
}

export async function PATCH(request: Request, { params }: Params) {
  const { configId } = await params;
  const body = await request.json();
  const parsed = evaluationConfigSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const config = await prisma.evaluationConfig.update({
    where: { id: configId },
    data: parsed.data,
  });
  return NextResponse.json(config);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { configId } = await params;
  const count = await prisma.project.count({ where: { evaluationConfigId: configId } });
  if (count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: hay proyectos que usan esta configuración" },
      { status: 409 },
    );
  }
  await prisma.evaluationConfig.delete({ where: { id: configId } });
  return NextResponse.json({ ok: true });
}
