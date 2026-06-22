/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import { NextResponse } from "next/server";
import { resolveEvidencePath } from "@/lib/storage";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const { path: segments } = await params;
  const relativePath = segments.join("/");

  try {
    const absolutePath = resolveEvidencePath(relativePath.startsWith("evidence/") ? relativePath : `evidence/${relativePath}`);
    const file = await fs.readFile(absolutePath);
    const ext = absolutePath.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
    };

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeTypes[ext ?? ""] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}
