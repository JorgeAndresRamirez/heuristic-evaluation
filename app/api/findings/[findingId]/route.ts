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

type Params = { params: Promise<{ findingId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { findingId } = await params;
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: {
      ...findingPrinciplesInclude,
      evaluator: true,
      evidence: true,
      consolidatedFinding: true,
    },
  });
  if (!finding) return NextResponse.json({ error: "Hallazgo no encontrado" }, { status: 404 });
  return NextResponse.json(finding);
}

export async function PATCH(request: Request, { params }: Params) {
  const { findingId } = await params;

  try {
    const body = await request.json();
    const parsed = findingSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { principleIds, ...findingData } = parsed.data;

    const finding = await prisma.finding.update({
      where: { id: findingId },
      data: {
        ...findingData,
        ...(principleIds
          ? {
              principles: {
                deleteMany: {},
                create: buildFindingPrincipleCreates(principleIds),
              },
            }
          : {}),
      },
      include: { ...findingPrinciplesInclude, evidence: true },
    });

    return NextResponse.json(finding);
  } catch (error) {
    console.error("[findings PATCH]", error);
    const message = error instanceof Error ? error.message : "Error desconocido al actualizar el hallazgo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { findingId } = await params;
  await prisma.finding.delete({ where: { id: findingId } });
  return NextResponse.json({ ok: true });
}
