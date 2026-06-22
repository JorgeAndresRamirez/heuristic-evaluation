/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { EXPORT_FORMAT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  if (body.format !== EXPORT_FORMAT) {
    return NextResponse.json({ error: "Formato de importación no válido" }, { status: 400 });
  }

  const data = body.data;
  if (!data?.name || !data?.heuristicSetId) {
    return NextResponse.json({ error: "Estructura JSON inválida" }, { status: 400 });
  }

  const setExists = await prisma.heuristicSet.findUnique({ where: { id: data.heuristicSetId } });
  if (!setExists) {
    return NextResponse.json({ error: "El set de heurísticas referenciado no existe" }, { status: 400 });
  }

  const config = await prisma.evaluationConfig.create({
    data: {
      name: `${data.name} (importado)`,
      description: data.description,
      heuristicSetId: data.heuristicSetId,
      isDefault: false,
    },
  });

  return NextResponse.json(config, { status: 201 });
}
