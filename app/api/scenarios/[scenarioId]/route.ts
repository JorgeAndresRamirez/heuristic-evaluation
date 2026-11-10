/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scenarioSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ scenarioId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { scenarioId } = await params;
  const parsed = scenarioSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const scenario = await prisma.testScenario.update({ where: { id: scenarioId }, data: parsed.data });
  return NextResponse.json(scenario);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { scenarioId } = await params;
  await prisma.testScenario.delete({ where: { id: scenarioId } });
  return NextResponse.json({ ok: true });
}
