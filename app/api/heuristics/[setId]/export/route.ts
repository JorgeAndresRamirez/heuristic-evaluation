/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { exportHeuristicSet } from "@/lib/export-import";

type Params = { params: Promise<{ setId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { setId } = await params;
  const payload = await exportHeuristicSet(setId);
  return NextResponse.json(payload);
}
