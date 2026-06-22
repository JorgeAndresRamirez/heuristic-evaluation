/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import { resolveEvidencePath } from "@/lib/storage";
import type { EvidenceType } from "@/lib/generated/prisma";

export type ReportEvidence = {
  fileName: string;
  type: EvidenceType | string;
  mimeType: string;
  storagePath: string;
};

export type EmbeddedEvidence = ReportEvidence & {
  dataUri: string | null;
};

export async function embedEvidenceForReport(
  evidence: ReportEvidence[],
): Promise<EmbeddedEvidence[]> {
  const embedded: EmbeddedEvidence[] = [];

  for (const item of evidence) {
    if (item.type !== "IMAGE") {
      embedded.push({ ...item, dataUri: null });
      continue;
    }

    try {
      const fullPath = resolveEvidencePath(item.storagePath);
      const buffer = await fs.readFile(fullPath);
      embedded.push({
        ...item,
        dataUri: `data:${item.mimeType};base64,${buffer.toString("base64")}`,
      });
    } catch {
      embedded.push({ ...item, dataUri: null });
    }
  }

  return embedded;
}
