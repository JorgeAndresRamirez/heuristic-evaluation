/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { SessionSynthesis } from "@/components/usability/session-synthesis";
import { TestNav } from "@/components/usability/test-nav";
import { loadUsabilityProject } from "@/lib/usability-data";
import { scenariosForProfile } from "@/lib/usability-test";

type Params = { params: Promise<{ projectId: string; participantId: string }> };

export const dynamic = "force-dynamic";

export default async function SessionSynthesisPage({ params }: Params) {
  const { projectId, participantId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();
  const participant = project.participants.find((item) => item.id === participantId);
  if (!participant) notFound();
  const session = participant.session;

  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <SessionSynthesis
        projectId={project.id}
        participant={{ id: participant.id, code: participant.code, profile: participant.profile, isPilot: participant.isPilot }}
        sessionId={session?.id ?? null}
        recording={{ url: session?.recordingUrl ?? "", notes: session?.recordingNotes ?? "" }}
        scenarios={scenariosForProfile(project.scenarios, participant.profile).map((scenario) => ({
          id: scenario.id,
          code: scenario.code,
          title: scenario.title,
        }))}
        markers={(session?.markers ?? []).map((marker) => ({
          id: marker.id,
          offsetSeconds: marker.offsetSeconds,
          label: marker.label,
          notes: marker.notes,
          scenarioId: marker.scenarioId,
        }))}
        findings={(session?.findings ?? []).map((finding) => ({
          id: finding.id,
          title: finding.title,
          observation: finding.observation,
          recommendation: finding.recommendation,
          recordingOffsetSeconds: finding.recordingOffsetSeconds,
          scenarioId: finding.scenarioId,
          screenshotPath: finding.screenshotPath,
          screenshotName: finding.screenshotName,
        }))}
      />
    </>
  );
}
