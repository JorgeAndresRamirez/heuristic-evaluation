/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ setId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { setId } = await params;
  const original = await prisma.heuristicSet.findUnique({
    where: { id: setId },
    include: { principles: { orderBy: { orderIndex: "asc" } } },
  });
  if (!original) return NextResponse.json({ error: "Set no encontrado" }, { status: 404 });

  const duplicate = await prisma.heuristicSet.create({
    data: {
      name: `${original.name} (copia)`,
      description: original.description,
      source: "CUSTOM",
      isSystem: false,
      principles: {
        create: original.principles.map((principle) => ({
          orderIndex: principle.orderIndex,
          title: principle.title,
          description: principle.description,
          goodExampleHtml: principle.goodExampleHtml,
          badExampleHtml: principle.badExampleHtml,
          goodExampleImagePath: principle.goodExampleImagePath,
          badExampleImagePath: principle.badExampleImagePath,
        })),
      },
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
