/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { participantSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ participantId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { participantId } = await params;
  const parsed = participantSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const participant = await prisma.participant.update({ where: { id: participantId }, data: parsed.data });
  return NextResponse.json(participant);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { participantId } = await params;
  await prisma.participant.delete({ where: { id: participantId } });
  return NextResponse.json({ ok: true });
}
