/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consolidatedFindingSchema } from "@/lib/validators";

type Params = { params: Promise<{ consolidatedId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { consolidatedId } = await params;
  const body = await request.json();
  const parsed = consolidatedFindingSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const consolidated = await prisma.consolidatedFinding.update({
    where: { id: consolidatedId },
    data: {
      principleId: data.principleId,
      title: data.title,
      summaryHtml: data.summaryHtml,
      finalSeverity: data.finalSeverity,
      finalScope: data.finalScope,
      solutionHtml: data.solutionHtml,
      riskAssessment: data.riskAssessment,
      ...(data.findingIds
        ? {
            findings: {
              set: data.findingIds.map((id) => ({ id })),
            },
          }
        : {}),
    },
    include: {
      principle: true,
      findings: { include: { evaluator: true } },
    },
  });

  return NextResponse.json(consolidated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { consolidatedId } = await params;
  await prisma.finding.updateMany({
    where: { consolidatedFindingId: consolidatedId },
    data: { consolidatedFindingId: null },
  });
  await prisma.consolidatedFinding.delete({ where: { id: consolidatedId } });
  return NextResponse.json({ ok: true });
}
