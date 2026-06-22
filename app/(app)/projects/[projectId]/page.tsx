/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/components/evaluation/project-detail";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

export default async function ProjectPage({ params }: Params) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      heuristicSet: { select: { name: true } },
      evaluationConfig: { select: { name: true } },
      evaluators: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { findings: true } } },
      },
      _count: { select: { findings: true, consolidatedFindings: true } },
    },
  });
  if (!project) notFound();

  return <ProjectDetailView project={JSON.parse(JSON.stringify(project))} />;
}
