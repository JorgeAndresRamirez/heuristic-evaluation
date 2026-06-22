/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { ConsolidationPanel } from "@/components/consolidation/consolidation-panel";
import { findingPrinciplesInclude } from "@/lib/finding-principles";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

export default async function ConsolidationPage({ params }: Params) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [findings, consolidated] = await Promise.all([
    prisma.finding.findMany({
      where: { projectId },
      include: {
        evaluator: true,
        ...findingPrinciplesInclude,
        evidence: { orderBy: { createdAt: "asc" } },
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

  return (
    <ConsolidationPanel
      projectId={projectId}
      initialFindings={JSON.parse(JSON.stringify(findings))}
      initialConsolidated={JSON.parse(JSON.stringify(consolidated))}
    />
  );
}
