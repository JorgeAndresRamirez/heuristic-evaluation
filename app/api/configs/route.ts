/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluationConfigSchema } from "@/lib/validators";

export async function GET() {
  const configs = await prisma.evaluationConfig.findMany({
    include: {
      heuristicSet: { select: { id: true, name: true, source: true } },
      _count: { select: { projects: true } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = evaluationConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const config = await prisma.evaluationConfig.create({ data: parsed.data });
  return NextResponse.json(config, { status: 201 });
}
