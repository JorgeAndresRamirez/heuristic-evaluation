/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEvidencePath } from "@/lib/storage";

type Params = { params: Promise<{ issueId: string; evidenceId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { issueId, evidenceId } = await params;
  const evidence = await prisma.issueEvidence.findFirst({ where: { id: evidenceId, issueId } });
  if (!evidence) return NextResponse.json({ error: "Evidencia no encontrada" }, { status: 404 });

  try {
    await fs.unlink(resolveEvidencePath(evidence.storagePath));
  } catch {
    // archivo ya eliminado del disco
  }
  await prisma.issueEvidence.delete({ where: { id: evidenceId } });
  return NextResponse.json({ ok: true });
}
