/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { IssuesManager } from "@/components/usability/issues-manager";
import { TestNav } from "@/components/usability/test-nav";
import { DEFAULT_SEVERITY_CRITERIA, OUTCOME_LABELS } from "@/lib/constants";
import { loadUsabilityProject } from "@/lib/usability-data";

type Params = { params: Promise<{ projectId: string }> };

export default async function IssuesPage({ params }: Params) {
  const { projectId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();

  const runs = project.participants.flatMap((participant) =>
    (participant.session?.runs ?? [])
      .filter((run) => run.outcome !== null)
      .map((run) => {
        const scenario = project.scenarios.find((item) => item.id === run.scenarioId);
        return {
          id: run.id,
          label: `${participant.code} · ${scenario?.code ?? "?"} (${OUTCOME_LABELS[run.outcome!]})`,
        };
      }),
  );

  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <IssuesManager
        projectId={project.id}
        principles={project.heuristicSet.principles.map((principle) => ({ id: principle.id, title: principle.title }))}
        runs={runs}
        severityCriteria={project.testPlan?.severityCriteria || DEFAULT_SEVERITY_CRITERIA}
        issues={project.issues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          descriptionHtml: issue.descriptionHtml,
          errorType: issue.errorType,
          impact: issue.impact,
          frequency: issue.frequency,
          persistence: issue.persistence,
          severity: issue.severity,
          recommendationHtml: issue.recommendationHtml,
          principleIds: issue.principles.map((link) => link.principleId),
          principleTitles: issue.principles.map((link) => link.principle.title),
          runIds: issue.runs.map((link) => link.runId),
          runLabels: issue.runs.map(
            (link) => `${link.run.session.participant.code} · ${link.run.scenario.code}`,
          ),
          evidence: issue.evidence.map((item) => ({
            id: item.id,
            type: item.type,
            fileName: item.fileName,
            fileSize: item.fileSize,
            storagePath: item.storagePath,
          })),
        }))}
      />
    </>
  );
}
