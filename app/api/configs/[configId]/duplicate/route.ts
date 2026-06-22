/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ configId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { configId } = await params;
  const original = await prisma.evaluationConfig.findUnique({
    where: { id: configId },
  });
  if (!original) {
    return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 });
  }

  const duplicate = await prisma.evaluationConfig.create({
    data: {
      name: `${original.name} (copia)`,
      description: original.description,
      heuristicSetId: original.heuristicSetId,
      isDefault: false,
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
