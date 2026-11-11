/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { ScenariosManager } from "@/components/usability/scenarios-manager";
import { TestNav } from "@/components/usability/test-nav";
import { loadUsabilityProject } from "@/lib/usability-data";

type Params = { params: Promise<{ projectId: string }> };

export default async function ScenariosPage({ params }: Params) {
  const { projectId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();

  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <ScenariosManager
        projectId={project.id}
        scenarios={project.scenarios.map((scenario) => ({
          id: scenario.id,
          code: scenario.code,
          title: scenario.title,
          userGoal: scenario.userGoal,
          description: scenario.description,
          startingPoint: scenario.startingPoint,
          timeLimitMinutes: scenario.timeLimitMinutes,
          completionMilestone: scenario.completionMilestone,
          scenarioCard: scenario.scenarioCard,
          role: scenario.role,
        }))}
      />
    </>
  );
}
