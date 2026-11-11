/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { issueInclude } from "@/lib/usability-queries";
import { prisma } from "@/lib/prisma";
import { usabilityIssueSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const issues = await prisma.usabilityIssue.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
    include: issueInclude,
  });
  return NextResponse.json(issues);
}

export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;
  const parsed = usabilityIssueSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { principleIds, runIds, ...data } = parsed.data;
  const last = await prisma.usabilityIssue.findFirst({ where: { projectId }, orderBy: { orderIndex: "desc" } });

  const issue = await prisma.usabilityIssue.create({
    data: {
      projectId,
      orderIndex: (last?.orderIndex ?? -1) + 1,
      ...data,
      principles: { create: principleIds.map((principleId) => ({ principleId })) },
      runs: { create: (runIds ?? []).map((runId) => ({ runId })) },
    },
    include: issueInclude,
  });
  return NextResponse.json(issue, { status: 201 });
}
