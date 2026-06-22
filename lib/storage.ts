/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import path from "path";
import fs from "fs/promises";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "@/lib/constants";
import type { EvidenceType } from "@/lib/generated/prisma";

export const STORAGE_ROOT = path.join(process.cwd(), "storage");
export const EVIDENCE_ROOT = path.join(STORAGE_ROOT, "evidence");

export function getProjectEvidenceDir(projectId: string): string {
  return path.join(EVIDENCE_ROOT, projectId);
}

export function getFindingEvidenceDir(projectId: string, findingId: string): string {
  return path.join(getProjectEvidenceDir(projectId), findingId);
}

export async function ensureStorageDirs(projectId: string, findingId?: string): Promise<void> {
  await fs.mkdir(getProjectEvidenceDir(projectId), { recursive: true });
  if (findingId) {
    await fs.mkdir(getFindingEvidenceDir(projectId, findingId), { recursive: true });
  }
}

export function resolveEvidencePath(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, "");
  const fullPath = path.join(STORAGE_ROOT, normalized);
  if (!fullPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Ruta de evidencia no permitida");
  }
  return fullPath;
}

export function getEvidenceType(mimeType: string): EvidenceType {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return "IMAGE";
  }
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType)) {
    return "VIDEO";
  }
  throw new Error(`Tipo de archivo no permitido: ${mimeType}`);
}

export function isAllowedMimeType(mimeType: string): boolean {
  return (
    (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType) ||
    (ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType)
  );
}

export function toRelativeStoragePath(absolutePath: string): string {
  return path.relative(STORAGE_ROOT, absolutePath).split(path.sep).join("/");
}
