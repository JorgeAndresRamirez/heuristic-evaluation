/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { exportEvaluationConfig } from "@/lib/export-import";

type Params = { params: Promise<{ configId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { configId } = await params;
  const payload = await exportEvaluationConfig(configId);
  return NextResponse.json(payload);
}
