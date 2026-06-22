/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { heuristicPrincipleSchema } from "@/lib/validators";

type Params = { params: Promise<{ setId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { setId } = await params;
  const principles = await prisma.heuristicPrinciple.findMany({
    where: { setId },
    orderBy: { orderIndex: "asc" },
  });
  return NextResponse.json(principles);
}

export async function POST(request: Request, { params }: Params) {
  const { setId } = await params;
  const set = await prisma.heuristicSet.findUnique({ where: { id: setId } });
  if (!set) return NextResponse.json({ error: "Set no encontrado" }, { status: 404 });
  if (set.isSystem) {
    return NextResponse.json({ error: "Los sets del sistema no se pueden modificar" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = heuristicPrincipleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const last = await prisma.heuristicPrinciple.findFirst({
    where: { setId },
    orderBy: { orderIndex: "desc" },
  });

  const principle = await prisma.heuristicPrinciple.create({
    data: {
      setId,
      orderIndex: (last?.orderIndex ?? -1) + 1,
      ...parsed.data,
    },
  });

  return NextResponse.json(principle, { status: 201 });
}
