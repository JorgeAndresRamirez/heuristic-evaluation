/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { findingPrinciplesInclude, resolveConsolidatedPrincipleId } from "@/lib/finding-principles";
import { prisma } from "@/lib/prisma";
import { consolidatedFindingSchema, mergeFindingsSchema } from "@/lib/validators";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const [findings, consolidated] = await Promise.all([
    prisma.finding.findMany({
      where: { projectId },
      include: {
        evaluator: true,
        ...findingPrinciplesInclude,
        evidence: true,
        consolidatedFinding: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consolidatedFinding.findMany({
      where: { projectId },
      include: {
        principle: true,
        findings: { include: { evaluator: true } },
      },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  return NextResponse.json({ findings, consolidated });
}

export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();

  if (body.action === "merge") {
    const parsed = mergeFindingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const findings = await prisma.finding.findMany({
      where: { id: { in: parsed.data.findingIds }, projectId },
      include: findingPrinciplesInclude,
    });
    if (findings.length !== parsed.data.findingIds.length) {
      return NextResponse.json({ error: "Algunos hallazgos no pertenecen al proyecto" }, { status: 400 });
    }

    const last = await prisma.consolidatedFinding.findFirst({
      where: { projectId },
      orderBy: { orderIndex: "desc" },
    });

    const consolidated = await prisma.consolidatedFinding.create({
      data: {
        projectId,
        principleId: resolveConsolidatedPrincipleId(findings),
        title: parsed.data.title,
        summaryHtml: parsed.data.summaryHtml,
        finalSeverity: parsed.data.finalSeverity,
        finalScope: parsed.data.finalScope,
        solutionHtml: parsed.data.solutionHtml,
        riskAssessment: parsed.data.riskAssessment,
        orderIndex: (last?.orderIndex ?? -1) + 1,
        findings: {
          connect: parsed.data.findingIds.map((id) => ({ id })),
        },
      },
      include: {
        principle: true,
        findings: { include: { evaluator: true } },
      },
    });

    return NextResponse.json(consolidated, { status: 201 });
  }

  const parsed = consolidatedFindingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const last = await prisma.consolidatedFinding.findFirst({
    where: { projectId },
    orderBy: { orderIndex: "desc" },
  });

  const consolidated = await prisma.consolidatedFinding.create({
    data: {
      projectId,
      principleId: parsed.data.principleId,
      title: parsed.data.title,
      summaryHtml: parsed.data.summaryHtml,
      finalSeverity: parsed.data.finalSeverity,
      finalScope: parsed.data.finalScope,
      solutionHtml: parsed.data.solutionHtml,
      riskAssessment: parsed.data.riskAssessment,
      orderIndex: (last?.orderIndex ?? -1) + 1,
      findings: {
        connect: parsed.data.findingIds.map((id) => ({ id })),
      },
    },
    include: {
      principle: true,
      findings: { include: { evaluator: true } },
    },
  });

  return NextResponse.json(consolidated, { status: 201 });
}
