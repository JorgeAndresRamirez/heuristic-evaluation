/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { heuristicSetSchema } from "@/lib/validators";

export async function GET() {
  const sets = await prisma.heuristicSet.findMany({
    include: {
      _count: { select: { principles: true, projects: true } },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(sets);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = heuristicSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const set = await prisma.heuristicSet.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      source: "CUSTOM",
      isSystem: false,
    },
  });

  return NextResponse.json(set, { status: 201 });
}
