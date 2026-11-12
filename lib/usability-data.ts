/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { prisma } from "@/lib/prisma";
import { issueInclude } from "@/lib/usability-queries";
import {
  buildExecutiveKpis,
  buildScenarioMetrics,
  participantGuidance,
  planCompleteness,
  roleParticipantGuidance,
  scenarioCountGuidanceByRole,
  scenarioRoles,
  type RunMetricInput,
} from "@/lib/usability-test";

/** Carga todo lo necesario de un proyecto de test de usabilidad (plan, escenarios, sesiones y problemas). */
export async function loadUsabilityProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      heuristicSet: { include: { principles: { orderBy: { orderIndex: "asc" } } } },
      testPlan: true,
      evaluators: { orderBy: { orderIndex: "asc" } },
      scenarios: { orderBy: { orderIndex: "asc" } },
      participants: {
        orderBy: { orderIndex: "asc" },
        include: {
          session: {
            include: {
              facilitator: true,
              runs: true,
              markers: { orderBy: { offsetSeconds: "asc" } },
              findings: { orderBy: { orderIndex: "asc" } },
            },
          },
        },
      },
      issues: { orderBy: { orderIndex: "asc" }, include: issueInclude },
    },
  });
  return project;
}

export type UsabilityProject = NonNullable<Awaited<ReturnType<typeof loadUsabilityProject>>>;

/** Participantes reales: sin piloto ni reserva sin usar, con al menos un escenario registrado. */
export function realParticipants(project: UsabilityProject) {
  return project.participants.filter(
    (participant) =>
      !participant.isPilot &&
      (participant.session?.runs ?? []).some((run) => run.outcome !== null),
  );
}

export function computeUsabilitySummary(project: UsabilityProject) {
  const real = realParticipants(project);
  const realIds = new Set(real.map((participant) => participant.id));

  const scenarioMetrics = project.scenarios.map((scenario) => {
    const runs: RunMetricInput[] = [];
    for (const participant of project.participants) {
      if (!realIds.has(participant.id)) continue;
      const run = participant.session?.runs.find((item) => item.scenarioId === scenario.id);
      if (run) {
        runs.push({
          participantId: participant.id,
          outcome: run.outcome,
          falseCompletion: run.falseCompletion,
          stoppedAtLimit: run.stoppedAtLimit,
          timeOnTaskSeconds: run.timeOnTaskSeconds,
          nonCriticalErrors: run.nonCriticalErrors,
          satisfaction: run.satisfaction,
        });
      }
    }
    return { scenario, metrics: buildScenarioMetrics(runs, scenario.timeLimitMinutes) };
  });

  const roles = scenarioRoles(project.scenarios);
  const countsByRole: Record<string, number> = {};
  for (const participant of real) {
    const role = participant.profile?.trim() ?? "";
    if (roles.includes(role)) countsByRole[role] = (countsByRole[role] ?? 0) + 1;
  }
  const roleFactor = Math.max(roles.length, 1);
  const profiles = new Set(project.participants.map((participant) => participant.profile?.trim() || "—"));
  const completeness = planCompleteness(project.testPlan, project.scenarios.length);
  const issuesWithRecommendation = project.issues.filter((issue) => (issue.recommendationHtml ?? "").trim()).length;

  const phases = [
    {
      key: "briefing",
      label: "Briefing",
      detail: "Objetivos, contexto y propósito de la prueba",
      done: completeness.byPhase.briefing.filled,
      total: completeness.byPhase.briefing.total,
      href: "plan",
    },
    {
      key: "planning",
      label: "Planificación",
      detail: "Documento-guía, escenarios y criterios de evaluación",
      done: completeness.byPhase.planning.filled + completeness.byPhase.ethics.filled,
      total: completeness.byPhase.planning.total + completeness.byPhase.ethics.total,
      href: "plan",
    },
    {
      key: "recruitment",
      label: "Reclutamiento",
      detail: "Participantes elegibles con consentimiento",
      done: project.participants.filter((p) => p.eligibilityConfirmed && p.consentSigned && !p.isReserve).length,
      total: (project.testPlan?.plannedParticipants ?? 5) * roleFactor,
      href: "participants",
    },
    {
      key: "execution",
      label: "Desarrollo de la prueba",
      detail: "Sesiones realizadas con participantes reales",
      done: real.length,
      total: (project.testPlan?.plannedParticipants ?? 5) * roleFactor,
      href: "participants",
    },
    {
      key: "evaluation",
      label: "Evaluación de resultados",
      detail: "Problemas de usabilidad identificados y valorados",
      done: project.issues.length > 0 ? 1 : 0,
      total: 1,
      href: "issues",
    },
    {
      key: "recommendations",
      label: "Recomendaciones",
      detail: "Cada problema con su solución propuesta",
      done: issuesWithRecommendation,
      total: Math.max(project.issues.length, 1),
      href: "issues",
    },
  ];

  const allRuns: RunMetricInput[] = [];
  for (const participant of real) {
    for (const run of participant.session?.runs ?? []) {
      allRuns.push({
        participantId: participant.id,
        outcome: run.outcome,
        falseCompletion: run.falseCompletion,
        stoppedAtLimit: run.stoppedAtLimit,
        timeOnTaskSeconds: run.timeOnTaskSeconds,
        nonCriticalErrors: run.nonCriticalErrors,
        satisfaction: run.satisfaction,
      });
    }
  }

  return {
    kpis: buildExecutiveKpis(allRuns),
    real,
    scenarioMetrics,
    completeness,
    phases,
    guidance:
      roles.length > 1 ? roleParticipantGuidance(countsByRole, roles) : participantGuidance(real.length, profiles.size),
    scenarioGuidance: scenarioCountGuidanceByRole(project.scenarios),
    roles,
    pilotCount: project.participants.filter((p) => p.isPilot).length,
  };
}
