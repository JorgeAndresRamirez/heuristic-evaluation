/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { ParticipantsManager } from "@/components/usability/participants-manager";
import { TestNav } from "@/components/usability/test-nav";
import { computeUsabilitySummary, loadUsabilityProject } from "@/lib/usability-data";
import { scenariosForProfile } from "@/lib/usability-test";

type Params = { params: Promise<{ projectId: string }> };

export default async function ParticipantsPage({ params }: Params) {
  const { projectId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();
  const summary = computeUsabilitySummary(project);

  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <ParticipantsManager
        projectId={project.id}
        roles={summary.roles}
        guidance={summary.guidance}
        plannedParticipants={project.testPlan?.plannedParticipants ?? 5}
        participants={project.participants.map((participant) => ({
          id: participant.id,
          code: participant.code,
          profile: participant.profile,
          eligibilityConfirmed: participant.eligibilityConfirmed,
          isPilot: participant.isPilot,
          isReserve: participant.isReserve,
          consentSigned: participant.consentSigned,
          recordingAuthorized: participant.recordingAuthorized,
          notes: participant.notes,
          scenarioCount: scenariosForProfile(project.scenarios, participant.profile).length,
          recordedScenarios: (participant.session?.runs ?? []).filter((run) => run.outcome !== null).length,
        }))}
      />
    </>
  );
}
