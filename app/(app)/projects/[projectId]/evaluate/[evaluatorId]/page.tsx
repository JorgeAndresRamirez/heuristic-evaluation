/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { EvaluationWorkspace } from "@/components/evaluation/evaluation-workspace";
import { findingPrinciplesInclude } from "@/lib/finding-principles";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string; evaluatorId: string }> };

export default async function EvaluatePage({ params }: Params) {
  const { projectId, evaluatorId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      heuristicSet: {
        include: { principles: { orderBy: { orderIndex: "asc" } } },
      },
      evaluators: { where: { id: evaluatorId } },
    },
  });
  if (!project || project.evaluators.length === 0) notFound();

  const findings = await prisma.finding.findMany({
    where: { projectId, evaluatorId },
    include: { ...findingPrinciplesInclude, evidence: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <EvaluationWorkspace
      projectId={projectId}
      evaluatorId={evaluatorId}
      evaluatorName={project.evaluators[0].name}
      principles={JSON.parse(JSON.stringify(project.heuristicSet.principles))}
      initialFindings={JSON.parse(JSON.stringify(findings))}
    />
  );
}
