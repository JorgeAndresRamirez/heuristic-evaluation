/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ participantId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { participantId } = await params;
  const participant = await prisma.participant.findUnique({ where: { id: participantId }, select: { id: true } });
  if (!participant) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });

  const parsed = sessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionDate, ...rest } = parsed.data;
  const data = {
    ...rest,
    ...(sessionDate !== undefined ? { sessionDate: sessionDate ? new Date(sessionDate) : null } : {}),
  };

  const session = await prisma.testSession.upsert({
    where: { participantId },
    create: { participantId, ...data },
    update: data,
  });
  return NextResponse.json(session);
}
