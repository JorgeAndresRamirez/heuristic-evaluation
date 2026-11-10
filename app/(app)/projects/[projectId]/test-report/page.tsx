/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { TestNav } from "@/components/usability/test-nav";
import { TestReportView } from "@/components/usability/test-report-view";
import { loadUsabilityProject } from "@/lib/usability-data";

type Params = { params: Promise<{ projectId: string }> };

export default async function TestReportPage({ params }: Params) {
  const { projectId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();

  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <TestReportView project={project} />
    </>
  );
}
