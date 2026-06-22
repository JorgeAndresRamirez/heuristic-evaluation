/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { findingPrinciplesInclude } from "@/lib/finding-principles";
import { buildAnalytics } from "@/lib/report-builder";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

export default async function ReportsPage({ params }: Params) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      evaluators: { orderBy: { orderIndex: "asc" } },
      findings: {
        include: { evaluator: true, ...findingPrinciplesInclude, evidence: true },
      },
      consolidatedFindings: {
        include: { principle: true, findings: { include: { evaluator: true } } },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  if (!project) notFound();

  const analytics = buildAnalytics(project);

  return (
    <ReportsDashboard
      projectId={project.id}
      projectName={project.name}
      analytics={analytics}
      consolidatedFindings={JSON.parse(JSON.stringify(project.consolidatedFindings))}
      evaluators={JSON.parse(JSON.stringify(project.evaluators))}
    />
  );
}
