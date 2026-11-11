/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/components/evaluation/project-detail";
import { TestNav } from "@/components/usability/test-nav";
import { UsabilityOverview } from "@/components/usability/overview";
import { prisma } from "@/lib/prisma";
import { computeUsabilitySummary, loadUsabilityProject } from "@/lib/usability-data";

type Params = { params: Promise<{ projectId: string }> };

export default async function ProjectPage({ params }: Params) {
  const { projectId } = await params;

  const kind = await prisma.project.findUnique({ where: { id: projectId }, select: { kind: true } });
  if (!kind) notFound();

  if (kind.kind === "USABILITY_TEST") {
    const project = await loadUsabilityProject(projectId);
    if (!project) notFound();
    const summary = computeUsabilitySummary(project);
    return (
      <>
        <TestNav projectId={project.id} projectName={project.name} />
        <UsabilityOverview
          projectId={project.id}
          productName={project.productName}
          prototypeUrl={project.prototypeUrl}
          phases={summary.phases}
          guidance={summary.guidance}
          scenarioGuidance={summary.scenarioGuidance}
          legalReviewDone={Boolean(project.testPlan?.legalReviewDone)}
          pilotCount={summary.pilotCount}
          participantCount={summary.real.length}
          scenarioMetrics={summary.scenarioMetrics.map(({ scenario, metrics }) => ({
            code: scenario.code,
            title: scenario.title,
            timeLimitMinutes: scenario.timeLimitMinutes,
            metrics,
          }))}
        />
      </>
    );
  }

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
