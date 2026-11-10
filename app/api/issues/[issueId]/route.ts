/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import fs from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEvidencePath } from "@/lib/storage";
import { issueInclude } from "@/lib/usability-queries";
import { usabilityIssueSchema } from "@/lib/validators/usability";

type Params = { params: Promise<{ issueId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { issueId } = await params;
  const parsed = usabilityIssueSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { principleIds, runIds, ...data } = parsed.data;
  const issue = await prisma.usabilityIssue.update({
    where: { id: issueId },
    data: {
      ...data,
      ...(principleIds
        ? { principles: { deleteMany: {}, create: principleIds.map((principleId) => ({ principleId })) } }
        : {}),
      ...(runIds ? { runs: { deleteMany: {}, create: runIds.map((runId) => ({ runId })) } } : {}),
    },
    include: issueInclude,
  });
  return NextResponse.json(issue);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { issueId } = await params;
  const evidence = await prisma.issueEvidence.findMany({ where: { issueId } });
  for (const item of evidence) {
    try {
      await fs.unlink(resolveEvidencePath(item.storagePath));
    } catch {
      // archivo ya eliminado del disco
    }
  }
  await prisma.usabilityIssue.delete({ where: { id: issueId } });
  return NextResponse.json({ ok: true });
}
