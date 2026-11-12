/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEvidencePath } from "@/lib/storage";
import { sessionFindingSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ findingId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { findingId } = await params;
  const parsed = sessionFindingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const existing = await prisma.sessionFinding.findUnique({ where: { id: findingId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Hallazgo no encontrado" }, { status: 404 });
  const finding = await prisma.sessionFinding.update({
    where: { id: findingId },
    data: {
      title: parsed.data.title,
      observation: parsed.data.observation,
      recommendation: parsed.data.recommendation?.trim() || null,
      recordingOffsetSeconds: parsed.data.recordingOffsetSeconds ?? null,
      scenarioId: parsed.data.scenarioId || null,
    },
  });
  return NextResponse.json(finding);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { findingId } = await params;
  const finding = await prisma.sessionFinding.findUnique({ where: { id: findingId }, select: { screenshotPath: true } });
  if (finding?.screenshotPath) await fs.rm(resolveEvidencePath(finding.screenshotPath), { force: true });
  await prisma.sessionFinding.deleteMany({ where: { id: findingId } });
  return NextResponse.json({ ok: true });
}
