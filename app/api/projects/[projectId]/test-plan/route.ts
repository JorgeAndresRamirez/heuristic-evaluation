/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testPlanSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const plan = await prisma.testPlan.findUnique({ where: { projectId } });
  return NextResponse.json(plan);
}

export async function PUT(request: Request, { params }: Params) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const parsed = testPlanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await prisma.testPlan.upsert({
    where: { projectId },
    create: { projectId, ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json(plan);
}
