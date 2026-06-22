/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { EXPORT_FORMAT, EXPORT_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  if (body.format !== EXPORT_FORMAT) {
    return NextResponse.json({ error: "Formato de importación no válido" }, { status: 400 });
  }

  const data = body.data;
  if (!data?.name || !Array.isArray(data.principles)) {
    return NextResponse.json({ error: "Estructura JSON inválida" }, { status: 400 });
  }

  const set = await prisma.heuristicSet.create({
    data: {
      name: `${data.name} (importado)`,
      description: data.description,
      source: "CUSTOM",
      isSystem: false,
      principles: {
        create: data.principles.map(
          (
            principle: {
              title: string;
              description: string;
              goodExampleHtml?: string;
              badExampleHtml?: string;
            },
            index: number,
          ) => ({
            orderIndex: index,
            title: principle.title,
            description: principle.description,
            goodExampleHtml: principle.goodExampleHtml,
            badExampleHtml: principle.badExampleHtml,
          }),
        ),
      },
    },
    include: { principles: true },
  });

  return NextResponse.json({ set, version: EXPORT_VERSION }, { status: 201 });
}
