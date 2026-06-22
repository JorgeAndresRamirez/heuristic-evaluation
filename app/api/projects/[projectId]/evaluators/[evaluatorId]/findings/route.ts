/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import {
  buildFindingPrincipleCreates,
  findingPrinciplesInclude,
} from "@/lib/finding-principles";
import { prisma } from "@/lib/prisma";
import { findingSchema } from "@/lib/validators";

type Params = { params: Promise<{ projectId: string; evaluatorId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId, evaluatorId } = await params;
  const findings = await prisma.finding.findMany({
    where: { projectId, evaluatorId },
    include: {
      ...findingPrinciplesInclude,
      evidence: true,
      consolidatedFinding: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(findings);
}

export async function POST(request: Request, { params }: Params) {
  const { projectId, evaluatorId } = await params;

  try {
    const body = await request.json();
    const parsed = findingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { principleIds, ...findingData } = parsed.data;

    const finding = await prisma.finding.create({
      data: {
        projectId,
        evaluatorId,
        ...findingData,
        principles: {
          create: buildFindingPrincipleCreates(principleIds),
        },
      },
      include: { ...findingPrinciplesInclude, evidence: true },
    });

    return NextResponse.json(finding, { status: 201 });
  } catch (error) {
    console.error("[findings POST]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al guardar el hallazgo";
    return NextResponse.json(
      {
        error: message.includes("severity")
          ? "La severidad no es válida. Reinicia el servidor de desarrollo (Ctrl+C y npm run dev) tras actualizar la base de datos."
          : message,
      },
      { status: 500 },
    );
  }
}
