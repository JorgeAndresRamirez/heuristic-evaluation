/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_EVIDENCE_SIZE_BYTES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { EVIDENCE_ROOT, resolveEvidencePath, toRelativeStoragePath } from "@/lib/storage";

type Params = { params: Promise<{ findingId: string }> };

/** Captura de pantalla del hallazgo (una por hallazgo; subir otra reemplaza la anterior). */
export async function POST(request: Request, { params }: Params) {
  const { findingId } = await params;
  const finding = await prisma.sessionFinding.findUnique({
    where: { id: findingId },
    select: { id: true, screenshotPath: true, session: { select: { id: true, participant: { select: { projectId: true } } } } },
  });
  if (!finding) return NextResponse.json({ error: "Hallazgo no encontrado" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "La captura debe ser una imagen (PNG, JPG, WebP o GIF)" }, { status: 400 });
  }
  if (file.size > MAX_EVIDENCE_SIZE_BYTES) return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 400 });

  const dir = path.join(EVIDENCE_ROOT, finding.session.participant.projectId, `sesion-${finding.session.id}`);
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${finding.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const absolutePath = path.join(dir, safeName);
  await fs.writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
  if (finding.screenshotPath) await fs.rm(resolveEvidencePath(finding.screenshotPath), { force: true });

  const updated = await prisma.sessionFinding.update({
    where: { id: findingId },
    data: { screenshotPath: toRelativeStoragePath(absolutePath), screenshotName: file.name },
  });
  return NextResponse.json(updated, { status: 201 });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { findingId } = await params;
  const finding = await prisma.sessionFinding.findUnique({ where: { id: findingId }, select: { screenshotPath: true } });
  if (finding?.screenshotPath) await fs.rm(resolveEvidencePath(finding.screenshotPath), { force: true });
  await prisma.sessionFinding.update({ where: { id: findingId }, data: { screenshotPath: null, screenshotName: null } });
  return NextResponse.json({ ok: true });
}
