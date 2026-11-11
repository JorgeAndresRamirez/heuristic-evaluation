/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { TestPlanForm, type PlanState } from "@/components/usability/plan-form";
import { TestNav } from "@/components/usability/test-nav";
import { loadUsabilityProject } from "@/lib/usability-data";

type Params = { params: Promise<{ projectId: string }> };

export default async function PlanPage({ params }: Params) {
  const { projectId } = await params;
  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") notFound();

  const plan = project.testPlan;
  const text = (value: string | null | undefined) => value ?? "";
  const initial: PlanState = {
    responsibles: text(plan?.responsibles),
    contact: text(plan?.contact),
    location: text(plan?.location),
    plannedDates: text(plan?.plannedDates),
    version: text(plan?.version),
    confidentiality: text(plan?.confidentiality),
    keywords: text(plan?.keywords),
    applicationSummary: text(plan?.applicationSummary),
    userTypes: text(plan?.userTypes),
    projectMoment: text(plan?.projectMoment),
    purpose: text(plan?.purpose),
    context: text(plan?.context),
    executiveSummary: text(plan?.executiveSummary),
    plannedParticipants: plan?.plannedParticipants ?? 5,
    profiles: text(plan?.profiles),
    eligibilityCriteria: text(plan?.eligibilityCriteria),
    recruitmentProcedure: text(plan?.recruitmentProcedure),
    incentive: text(plan?.incentive),
    environment: plan?.environment ?? "PHYSICAL",
    technicalMeans: text(plan?.technicalMeans),
    recordingSystems: text(plan?.recordingSystems),
    teamRoles: text(plan?.teamRoles),
    totalDurationMinutes: plan?.totalDurationMinutes ?? 45,
    severityCriteria: text(plan?.severityCriteria),
    satisfactionScale: text(plan?.satisfactionScale),
    participantInstructions: text(plan?.participantInstructions),
    dataToCollect: text(plan?.dataToCollect),
    consentText: text(plan?.consentText),
    legalReviewDone: plan?.legalReviewDone ?? false,
    imageRights: text(plan?.imageRights),
    dataProtection: text(plan?.dataProtection),
    dataRetention: text(plan?.dataRetention),
    ethicsCode: text(plan?.ethicsCode),
  };

  return (
    <>
      <TestNav projectId={project.id} projectName={project.name} />
      <TestPlanForm projectId={project.id} initial={initial} scenarioCount={project.scenarios.length} />
    </>
  );
}
