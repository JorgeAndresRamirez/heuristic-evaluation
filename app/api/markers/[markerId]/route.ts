/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markerSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ markerId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { markerId } = await params;
  const parsed = markerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const existing = await prisma.sessionMarker.findUnique({ where: { id: markerId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Marcador no encontrado" }, { status: 404 });
  const marker = await prisma.sessionMarker.update({
    where: { id: markerId },
    data: {
      label: parsed.data.label,
      notes: parsed.data.notes?.trim() || null,
      offsetSeconds: parsed.data.offsetSeconds,
      scenarioId: parsed.data.scenarioId || null,
    },
  });
  return NextResponse.json(marker);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { markerId } = await params;
  await prisma.sessionMarker.deleteMany({ where: { id: markerId } });
  return NextResponse.json({ ok: true });
}
