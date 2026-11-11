/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scenarioSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const scenarios = await prisma.testScenario.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
  });
  return NextResponse.json(scenarios);
}

export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;
  const parsed = scenarioSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const last = await prisma.testScenario.findFirst({ where: { projectId }, orderBy: { orderIndex: "desc" } });
  const scenario = await prisma.testScenario.create({
    data: { projectId, orderIndex: (last?.orderIndex ?? -1) + 1, ...parsed.data },
  });
  return NextResponse.json(scenario, { status: 201 });
}
