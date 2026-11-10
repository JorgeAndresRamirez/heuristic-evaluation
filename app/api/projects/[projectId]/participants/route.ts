/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { participantSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const participants = await prisma.participant.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
    include: { session: { include: { _count: { select: { runs: true } } } } },
  });
  return NextResponse.json(participants);
}

export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;
  const parsed = participantSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const duplicate = await prisma.participant.findFirst({
    where: { projectId, code: parsed.data.code },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json({ error: `Ya existe un participante con el código ${parsed.data.code}` }, { status: 409 });
  }

  const last = await prisma.participant.findFirst({ where: { projectId }, orderBy: { orderIndex: "desc" } });
  const participant = await prisma.participant.create({
    data: { projectId, orderIndex: (last?.orderIndex ?? -1) + 1, ...parsed.data },
  });
  return NextResponse.json(participant, { status: 201 });
}
