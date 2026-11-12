/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { ParticipantScreenSettings } from "@/components/usability/participant-screen-settings";
import { TestNav } from "@/components/usability/test-nav";
import { loadUsabilityProject } from "@/lib/usability-data";

type Params = { params: Promise<{ projectId: string }> };

export const dynamic = "force-dynamic";

export default async function ParticipantScreenPage({ params }: Params) {
  const { projectId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();
  const plan = project.testPlan;

  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <ParticipantScreenSettings
        projectId={project.id}
        productName={project.productName || project.name}
        locked={project.participants.some((participant) => (participant.session?.runs ?? []).length > 0)}
        initial={{
          welcomeEnabled: plan?.welcomeEnabled ?? true,
          welcomeTitle: plan?.welcomeTitle ?? "",
          welcomeHtml: plan?.welcomeHtml ?? "",
          closingMessage: plan?.closingMessage ?? "",
        }}
      />
    </>
  );
}
