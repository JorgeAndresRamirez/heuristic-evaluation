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
} from "@/lib/storage";

type Params = { params: Promise<{ findingId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { findingId } = await params;
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    select: { id: true, projectId: true },
  });
  if (!finding) return NextResponse.json({ error: "Hallazgo no encontrado" }, { status: 404 });

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

  await ensureStorageDirs(finding.projectId, finding.id);
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const absolutePath = path.join(
    process.cwd(),
    "storage",
    "evidence",
    finding.projectId,
    finding.id,
    safeName,
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  const evidence = await prisma.findingEvidence.create({
    data: {
      findingId: finding.id,
      type: getEvidenceType(file.type),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storagePath: toRelativeStoragePath(absolutePath),
    },
  });

  return NextResponse.json(evidence, { status: 201 });
}
