/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFindingSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { sessionId } = await params;
  const findings = await prisma.sessionFinding.findMany({ where: { sessionId }, orderBy: { orderIndex: "asc" } });
  return NextResponse.json(findings);
}

export async function POST(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    select: { id: true, participant: { select: { projectId: true } } },
  });
  if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  const parsed = sessionFindingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.scenarioId) {
    const scenario = await prisma.testScenario.findUnique({ where: { id: parsed.data.scenarioId }, select: { projectId: true } });
    if (!scenario || scenario.projectId !== session.participant.projectId) {
      return NextResponse.json({ error: "Escenario no encontrado en este proyecto" }, { status: 404 });
    }
  }

  const last = await prisma.sessionFinding.findFirst({ where: { sessionId }, orderBy: { orderIndex: "desc" } });
  const finding = await prisma.sessionFinding.create({
    data: {
      sessionId,
      orderIndex: (last?.orderIndex ?? -1) + 1,
      title: parsed.data.title,
      observation: parsed.data.observation,
      recommendation: parsed.data.recommendation?.trim() || null,
      recordingOffsetSeconds: parsed.data.recordingOffsetSeconds ?? null,
      scenarioId: parsed.data.scenarioId || null,
    },
  });
  return NextResponse.json(finding, { status: 201 });
}
