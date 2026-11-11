/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskRunSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ participantId: string; scenarioId: string }> };

/**
 * Guarda lo ocurrido en un escenario (crea la sesión y la ejecución si no existen).
 * Regla del Máster: si el participante cree haber terminado y no es así, es un error crítico y el
 * escenario se considera NO completado; el facilitador no lo oculta.
 */
export async function PUT(request: Request, { params }: Params) {
  const { participantId, scenarioId } = await params;

  const [participant, scenario] = await Promise.all([
    prisma.participant.findUnique({ where: { id: participantId }, select: { id: true, projectId: true } }),
    prisma.testScenario.findUnique({ where: { id: scenarioId }, select: { id: true, projectId: true } }),
  ]);
  if (!participant || !scenario || participant.projectId !== scenario.projectId) {
    return NextResponse.json({ error: "Participante o escenario no encontrado en este proyecto" }, { status: 404 });
  }

  const parsed = taskRunSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.falseCompletion) data.outcome = "NOT_COMPLETED";

  const session = await prisma.testSession.upsert({
    where: { participantId },
    create: { participantId },
    update: {},
  });

  const run = await prisma.taskRun.upsert({
    where: { sessionId_scenarioId: { sessionId: session.id, scenarioId } },
    create: { sessionId: session.id, scenarioId, ...data },
    update: data,
  });
  return NextResponse.json(run);
}
