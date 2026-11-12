/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { SessionWorkspace } from "@/components/usability/session-workspace";
import { TestNav } from "@/components/usability/test-nav";
import { DEFAULT_SATISFACTION_SCALE } from "@/lib/constants";
import { loadUsabilityProject } from "@/lib/usability-data";
import { scenariosForProfile } from "@/lib/usability-test";

type Params = { params: Promise<{ projectId: string; participantId: string }> };

export default async function SessionPage({ params }: Params) {
  const { projectId, participantId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();
  const participant = project.participants.find((item) => item.id === participantId);
  if (!participant) notFound();

  const session = participant.session;
  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <SessionWorkspace
        projectId={project.id}
        participant={{
          id: participant.id,
          code: participant.code,
          profile: participant.profile,
          isPilot: participant.isPilot,
          consentSigned: participant.consentSigned,
          recordingAuthorized: participant.recordingAuthorized,
        }}
        facilitators={project.evaluators.map((item) => ({ id: item.id, name: item.name, role: item.role }))}
        session={{
          facilitatorId: session?.facilitatorId ?? null,
          sessionDate: session?.sessionDate ? session.sessionDate.toISOString().slice(0, 10) : null,
          notes: session?.notes ?? "",
          finalQuestionsNotes: session?.finalQuestionsNotes ?? "",
        }}
        satisfactionScale={project.testPlan?.satisfactionScale || DEFAULT_SATISFACTION_SCALE}
        welcomeEnabled={project.testPlan?.welcomeEnabled ?? true}
        screen={{
          token: participant.presentationToken,
          sessionId: session?.id ?? null,
          phase: session?.phase ?? "NOT_STARTED",
          currentScenarioId: session?.currentScenarioId ?? null,
          startedAt: session?.startedAt ? session.startedAt.toISOString() : null,
        }}
        scenarios={scenariosForProfile(project.scenarios, participant.profile).map((scenario) => {
          const run = session?.runs.find((item) => item.scenarioId === scenario.id);
          return {
            id: scenario.id,
            code: scenario.code,
            title: scenario.title,
            startingPoint: scenario.startingPoint,
            timeLimitMinutes: scenario.timeLimitMinutes,
            completionMilestone: scenario.completionMilestone,
            scenarioCard: scenario.scenarioCard,
            run: run
              ? {
                  outcome: run.outcome,
                  falseCompletion: run.falseCompletion,
                  stoppedAtLimit: run.stoppedAtLimit,
                  timeOnTaskSeconds: run.timeOnTaskSeconds,
                  nonCriticalErrors: run.nonCriticalErrors,
                  observationsHtml: run.observationsHtml ?? "",
                  satisfaction: run.satisfaction,
                }
              : null,
          };
        })}
      />
    </>
  );
}
