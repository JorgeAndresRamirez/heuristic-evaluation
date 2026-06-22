/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEvidencePath } from "@/lib/storage";

type Params = { params: Promise<{ findingId: string; evidenceId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { findingId, evidenceId } = await params;
  const evidence = await prisma.findingEvidence.findFirst({
    where: { id: evidenceId, findingId },
  });
  if (!evidence) return NextResponse.json({ error: "Evidencia no encontrada" }, { status: 404 });

  try {
    await fs.unlink(resolveEvidencePath(evidence.storagePath));
  } catch {
    // archivo ya eliminado del disco
  }

  await prisma.findingEvidence.delete({ where: { id: evidenceId } });
  return NextResponse.json({ ok: true });
}
