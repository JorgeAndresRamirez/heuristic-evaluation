/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { phaseForAction } from "@/lib/participant-screen";
import { generatePresentationToken } from "@/lib/presentation-token";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ participantId: string }> };

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open") }),
  z.object({ action: z.literal("welcome") }),
  z.object({ action: z.literal("scenario"), scenarioId: z.string().min(1) }),
  z.object({ action: z.literal("pause") }),
  z.object({ action: z.literal("finish") }),
  z.object({ action: z.literal("reset") }),
]);

/**
 * El facilitador controla lo que ve el participante en su pantalla (/p/<token>).
 * `open` solo prepara el enlace y la sesión; las demás acciones cambian la fase.
 */
export async function POST(request: Request, { params }: Params) {
  const { participantId } = await params;
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, projectId: true, presentationToken: true },
  });
  if (!participant) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });

  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const command = parsed.data;

  let token = participant.presentationToken;
  if (!token) {
    token = generatePresentationToken();
    await prisma.participant.update({ where: { id: participantId }, data: { presentationToken: token } });
  }

  if (command.action === "scenario") {
    const scenario = await prisma.testScenario.findUnique({
      where: { id: command.scenarioId },
      select: { projectId: true },
    });
    if (!scenario || scenario.projectId !== participant.projectId) {
      return NextResponse.json({ error: "Escenario no encontrado en este proyecto" }, { status: 404 });
    }
  }

  const existing = await prisma.testSession.upsert({
    where: { participantId },
    create: { participantId },
    update: {},
  });

  const phase = phaseForAction(command);
  const data: {
    phase?: NonNullable<typeof phase>;
    currentScenarioId?: string | null;
    startedAt?: Date;
    completedAt?: Date | null;
  } = {};
  if (phase) {
    data.phase = phase;
    if (command.action === "scenario") data.currentScenarioId = command.scenarioId;
    if (command.action === "reset") {
      data.currentScenarioId = null;
      data.completedAt = null;
    }
    if (command.action === "finish") data.completedAt = new Date();
    // El inicio de la sesión (referencia de los marcadores de tiempo) es la primera vez que se muestra algo.
    if (!existing.startedAt && (command.action === "welcome" || command.action === "scenario")) data.startedAt = new Date();
  }

  const session = Object.keys(data).length
    ? await prisma.testSession.update({ where: { id: existing.id }, data })
    : existing;

  return NextResponse.json({
    token,
    path: `/p/${token}`,
    sessionId: session.id,
    phase: session.phase,
    currentScenarioId: session.currentScenarioId,
    startedAt: session.startedAt,
  });
}
