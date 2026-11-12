/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { z } from "zod";
import { isEmptyEditorHtml } from "@/lib/rich-text-html";

const optionalText = z.string().optional().nullable();
const level = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const testPlanSchema = z.object({
  responsibles: optionalText,
  contact: optionalText,
  location: optionalText,
  plannedDates: optionalText,
  version: optionalText,
  confidentiality: optionalText,
  keywords: optionalText,
  applicationSummary: optionalText,
  userTypes: optionalText,
  projectMoment: optionalText,
  purpose: optionalText,
  context: optionalText,
  executiveSummary: optionalText,
  plannedParticipants: z.number().int().min(1).max(50).optional(),
  profiles: optionalText,
  eligibilityCriteria: optionalText,
  recruitmentProcedure: optionalText,
  incentive: optionalText,
  environment: z.enum(["PHYSICAL", "VIRTUAL"]).optional(),
  technicalMeans: optionalText,
  recordingSystems: optionalText,
  teamRoles: optionalText,
  totalDurationMinutes: z.number().int().min(5).max(480).optional(),
  severityCriteria: optionalText,
  satisfactionScale: optionalText,
  participantInstructions: optionalText,
  dataToCollect: optionalText,
  consentText: optionalText,
  legalReviewDone: z.boolean().optional(),
  imageRights: optionalText,
  dataProtection: optionalText,
  dataRetention: optionalText,
  ethicsCode: optionalText,
});

export const scenarioSchema = z.object({
  code: z.string().min(1, "El código es obligatorio (por ejemplo E1)").max(12),
  title: z.string().min(1, "El nombre interno es obligatorio"),
  userGoal: z.string().min(1, "Indica el objetivo del usuario (su necesidad, no la del negocio)"),
  description: optionalText,
  startingPoint: z.string().min(1, "Indica el punto de partida"),
  timeLimitMinutes: z.number().int().min(1, "El tiempo límite es obligatorio").max(120),
  completionMilestone: z.string().min(1, "Define el hito de finalización (qué ocurre en pantalla cuando se logra)"),
  scenarioCard: z.string().min(20, "Escribe la tarjeta-escenario que leerá el participante"),
  role: optionalText,
});

export const participantSchema = z.object({
  code: z.string().min(1, "El código es obligatorio (por ejemplo P1)").max(12),
  profile: optionalText,
  eligibilityConfirmed: z.boolean().optional(),
  isPilot: z.boolean().optional(),
  isReserve: z.boolean().optional(),
  consentSigned: z.boolean().optional(),
  recordingAuthorized: z.boolean().optional(),
  notes: optionalText,
});

export const sessionSchema = z.object({
  facilitatorId: z.string().nullable().optional(),
  sessionDate: z.string().nullable().optional(),
  notes: optionalText,
  finalQuestionsNotes: optionalText,
});

export const taskRunSchema = z.object({
  outcome: z.enum(["COMPLETED", "NOT_COMPLETED"]).nullable().optional(),
  falseCompletion: z.boolean().optional(),
  stoppedAtLimit: z.boolean().optional(),
  timeOnTaskSeconds: z.number().int().min(0).max(24 * 3600).nullable().optional(),
  nonCriticalErrors: z.number().int().min(0).max(999).optional(),
  observationsHtml: optionalText,
  satisfaction: z.number().int().min(1).max(10).nullable().optional(),
});

export const usabilityIssueSchema = z.object({
  title: z.string().min(1, "El título del problema es obligatorio"),
  descriptionHtml: z.string().refine((value) => !isEmptyEditorHtml(value), {
    message: "Describe el problema observado (hechos, no interpretaciones)",
  }),
  errorType: z.enum(["CRITICAL", "NON_CRITICAL"]),
  impact: level,
  frequency: level,
  persistence: level,
  severity: z.enum(["VERY_MILD", "MILD", "SEVERE"]),
  recommendationHtml: optionalText,
  principleIds: z.array(z.string()).min(1, "Indica qué principio de usabilidad se vulnera"),
  runIds: z.array(z.string()).optional(),
});

// ─── Síntesis de la sesión: grabación, marcadores y hallazgos ─────────────────────────────────────

export const recordingSchema = z.object({
  recordingUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\//i.test(value), "El enlace debe empezar por http:// o https://")
    .optional()
    .nullable(),
  recordingNotes: optionalText,
});

export const markerSchema = z.object({
  label: z.string().trim().min(1, "Escribe qué ocurrió en ese momento"),
  notes: optionalText,
  offsetSeconds: z.number().int().min(0).max(24 * 3600),
  scenarioId: z.string().nullable().optional(),
});

export const sessionFindingSchema = z.object({
  title: z.string().trim().min(1, "El título del hallazgo es obligatorio"),
  observation: z.string().trim().min(1, "Describe lo observado (hechos, no interpretaciones)"),
  recommendation: optionalText,
  recordingOffsetSeconds: z.number().int().min(0).max(24 * 3600).nullable().optional(),
  scenarioId: z.string().nullable().optional(),
});
