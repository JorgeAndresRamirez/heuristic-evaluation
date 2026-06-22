/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { z } from "zod";
import { isEmptyEditorHtml } from "@/lib/rich-text-html";

export const severitySchema = z.enum(["CRITICAL", "MAJOR", "MINOR"]);
export const scopeSchema = z.enum(["ISOLATED", "GENERALIZED"]);
export const projectStatusSchema = z.enum([
  "DRAFT",
  "IN_EVALUATION",
  "CONSOLIDATION",
  "CLOSED",
]);

export const heuristicSetSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
});

export const heuristicPrincipleSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  goodExampleHtml: z.string().optional(),
  badExampleHtml: z.string().optional(),
});

export const evaluationConfigSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  heuristicSetId: z.string().min(1, "Selecciona un set de heurísticas"),
});

export const projectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es obligatorio"),
  description: z.string().optional(),
  productName: z.string().optional(),
  prototypeUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  evaluationConfigId: z.string().min(1),
  heuristicSetId: z.string().min(1),
  status: projectStatusSchema.optional(),
});

export const evaluatorSchema = z.object({
  name: z.string().min(1, "El nombre del evaluador es obligatorio"),
  role: z.string().optional(),
  notes: z.string().optional(),
});

export const findingSchema = z.object({
  principleIds: z.array(z.string()).min(1, "Selecciona al menos un principio"),
  screen: z.string().min(1, "Indica la pantalla"),
  task: z.string().min(1, "Indica la tarea"),
  step: z.string().min(1, "Indica el paso exacto"),
  descriptionHtml: z.string().refine((value) => !isEmptyEditorHtml(value), {
    message: "La descripción es obligatoria",
  }),
  severity: severitySchema,
  scope: scopeSchema,
  solutionHtml: z.string().optional(),
  riskAssessment: z.string().optional(),
});

export const consolidatedFindingSchema = z.object({
  principleId: z.string().min(1),
  title: z.string().min(1, "El título es obligatorio"),
  summaryHtml: z.string().min(1, "El resumen es obligatorio"),
  finalSeverity: severitySchema,
  finalScope: scopeSchema,
  solutionHtml: z.string().optional(),
  riskAssessment: z.string().optional(),
  findingIds: z.array(z.string()).min(1, "Selecciona al menos un hallazgo"),
});

export const mergeFindingsSchema = z.object({
  findingIds: z.array(z.string()).min(2, "Selecciona al menos dos hallazgos"),
  title: z.string().min(1),
  summaryHtml: z.string().min(1),
  finalSeverity: severitySchema,
  finalScope: scopeSchema,
  solutionHtml: z.string().optional(),
  riskAssessment: z.string().optional(),
});
