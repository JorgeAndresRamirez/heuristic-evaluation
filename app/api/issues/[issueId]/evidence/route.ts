/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { MAX_EVIDENCE_SIZE_BYTES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  ensureStorageDirs,
  getEvidenceType,
  isAllowedMimeType,
  toRelativeStoragePath,
  getFindingEvidenceDir,
} from "@/lib/storage";

type Params = { params: Promise<{ issueId: string }> };

/** Captura o vídeo que sitúa el problema en la interfaz (las recomendaciones del Máster son visuales). */
export async function POST(request: Request, { params }: Params) {
  const { issueId } = await params;
  const issue = await prisma.usabilityIssue.findUnique({
    where: { id: issueId },
    select: { id: true, projectId: true },
  });
  if (!issue) return NextResponse.json({ error: "Problema no encontrado" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }
  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }
  if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx. 100 MB)" }, { status: 400 });
  }

  await ensureStorageDirs(issue.projectId, issue.id);
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const absolutePath = path.join(getFindingEvidenceDir(issue.projectId, issue.id), safeName);
  await fs.writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  const evidence = await prisma.issueEvidence.create({
    data: {
      issueId: issue.id,
      type: getEvidenceType(file.type),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storagePath: toRelativeStoragePath(absolutePath),
    },
  });
  return NextResponse.json(evidence, { status: 201 });
}
