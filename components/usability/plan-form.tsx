/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Field, Notice } from "@/components/usability/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  DEFAULT_PARTICIPANT_INSTRUCTIONS,
  DEFAULT_SATISFACTION_SCALE,
  DEFAULT_SEVERITY_CRITERIA,
  ENVIRONMENT_LABELS,
} from "@/lib/constants";
import { eligibilityWarnings, planCompleteness } from "@/lib/usability-test";
import { cn } from "@/lib/utils";

type TextKey =
  | "responsibles" | "contact" | "location" | "plannedDates" | "version" | "confidentiality" | "keywords"
  | "applicationSummary" | "userTypes" | "projectMoment" | "purpose" | "context"
  | "executiveSummary"
  | "profiles" | "eligibilityCriteria" | "recruitmentProcedure" | "incentive" | "technicalMeans" | "recordingSystems"
  | "teamRoles" | "severityCriteria" | "satisfactionScale" | "participantInstructions" | "dataToCollect"
  | "consentText" | "imageRights" | "dataProtection" | "dataRetention" | "ethicsCode";

export type PlanState = Record<TextKey, string> & {
  plannedParticipants: number;
  totalDurationMinutes: number;
  environment: "PHYSICAL" | "VIRTUAL";
  legalReviewDone: boolean;
};

type FieldDef = { key: TextKey; label: string; hint?: string; rows?: number; short?: boolean };

const SECTIONS: Array<{ id: string; title: string; description: string; fields: FieldDef[] }> = [
  {
    id: "identificacion",
    title: "1. Identificación",
    description: "Que quien abra el documento sepa a simple vista qué es, cuándo se hizo y quién lo hizo.",
    fields: [
      { key: "responsibles", label: "Personas y organizaciones responsables", short: true },
      { key: "contact", label: "Datos de contacto", short: true },
      { key: "location", label: "Lugar", hint: "Ubicación física o plataforma virtual donde se conduce la prueba.", short: true },
      { key: "plannedDates", label: "Fechas", short: true },
      { key: "version", label: "Versión del documento", short: true },
      { key: "keywords", label: "Palabras clave", hint: "Etiquetas para catalogar y archivar la prueba.", short: true },
      { key: "confidentiality", label: "Indicaciones de confidencialidad", rows: 2 },
    ],
  },
  {
    id: "presentacion",
    title: "2. Presentación",
    description: "Contexto mínimo para que un lector ajeno entienda el propósito de la prueba.",
    fields: [
      { key: "applicationSummary", label: "Aplicación objeto de estudio", hint: "Qué es, para qué sirve y qué la caracteriza.", rows: 3 },
      { key: "userTypes", label: "Tipos de usuarios del sistema", rows: 2 },
      { key: "projectMoment", label: "Momento del proyecto en el que se inscribe", rows: 2 },
      { key: "purpose", label: "Propósito de la prueba", hint: "Para qué se hace y qué se intenta descubrir. El test sirve exclusivamente para descubrir errores de usabilidad.", rows: 3 },
      { key: "context", label: "Contexto", hint: "Relación con pruebas anteriores o posteriores y por qué se decidió hacerla.", rows: 2 },
    ],
  },
  {
    id: "resumen",
    title: "3. Resumen ejecutivo",
    description: "Objetivos concretos, metodología en pocas líneas y, tras la prueba, las conclusiones más destacadas.",
    fields: [{ key: "executiveSummary", label: "Resumen ejecutivo", rows: 5 }],
  },
  {
    id: "metodologia",
    title: "4. Metodología",
    description: "Debe permitir que otra persona repita la prueba exactamente igual (reproducibilidad).",
    fields: [
      { key: "profiles", label: "Perfiles de usuario representados", hint: "Si dos grupos usan el sistema de forma muy distinta, planifica pruebas separadas.", rows: 3 },
      { key: "eligibilityCriteria", label: "Criterios de elegibilidad", hint: "Basados en la relación usuario–sistema. Nunca en criterios sociodemográficos como criterio principal.", rows: 3 },
      { key: "recruitmentProcedure", label: "Procedimiento de reclutamiento", hint: "Confirma la asistencia 24 horas antes y ten un candidato de reserva.", rows: 3 },
      { key: "incentive", label: "Retribución (si procede)", short: true },
      { key: "technicalMeans", label: "Medios técnicos", rows: 2 },
      { key: "recordingSystems", label: "Sistemas de registro", hint: "Vídeo del usuario, pantalla sincronizada, anotaciones del facilitador y audio.", rows: 2 },
      { key: "teamRoles", label: "Roles del equipo", hint: "Como mínimo: facilitador y quien evalúa los resultados y redacta el informe.", rows: 2 },
      { key: "severityCriteria", label: "Criterios de gravedad de los problemas", hint: "Escala corta decidida antes de la prueba (muy leve, leve, grave).", rows: 4 },
      { key: "satisfactionScale", label: "Sistema de valoración subjetiva", hint: "Explica el sentido de la escala: no se debe dar por hecho que 1 es peor que 4.", rows: 3 },
      { key: "participantInstructions", label: "Instrucciones al participante", hint: "Guion de apertura: se prueba la aplicación, no a la persona.", rows: 6 },
      { key: "dataToCollect", label: "Información a registrar y a presentar", hint: "Éxito de cada escenario, tiempo en tarea, errores, pensamientos en voz alta y satisfacción.", rows: 3 },
    ],
  },
  {
    id: "etica",
    title: "5. Aspectos éticos y legales",
    description: "El contenido legal no es estándar ni se copia de otro estudio: lo debe validar una persona asesora en derecho.",
    fields: [
      { key: "consentText", label: "Texto del consentimiento informado (borrador)", rows: 8 },
      { key: "imageRights", label: "Derechos de imagen", hint: "Qué se hará con las grabaciones de vídeo y voz.", rows: 2 },
      { key: "dataProtection", label: "Protección de datos", hint: "Normativa aplicable, derechos del titular y medidas adoptadas.", rows: 3 },
      { key: "dataRetention", label: "Conservación de los datos", hint: "Qué se hará con los datos y las grabaciones al terminar.", rows: 2 },
      { key: "ethicsCode", label: "Código ético de los evaluadores", rows: 3 },
    ],
  },
];

export function TestPlanForm({
  projectId,
  initial,
  scenarioCount,
}: {
  projectId: string;
  initial: PlanState;
  scenarioCount: number;
}) {
  const [plan, setPlan] = useState<PlanState>({
    ...initial,
    satisfactionScale: initial.satisfactionScale || DEFAULT_SATISFACTION_SCALE,
    severityCriteria: initial.severityCriteria || DEFAULT_SEVERITY_CRITERIA,
    participantInstructions: initial.participantInstructions || DEFAULT_PARTICIPANT_INSTRUCTIONS,
  });
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const completeness = useMemo(() => planCompleteness(plan, scenarioCount), [plan, scenarioCount]);
  const eligibility = useMemo(() => eligibilityWarnings(plan.eligibilityCriteria), [plan.eligibilityCriteria]);

  function setText(key: TextKey, value: string) {
    setPlan((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    const response = await fetch(`/api/projects/${projectId}/test-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    setSaving(false);
    setStatus(
      response.ok
        ? { tone: "ok", text: "Documento-guía guardado." }
        : { tone: "error", text: "No se pudo guardar el documento-guía. Revisa los datos e inténtalo de nuevo." },
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {section.id === "metodologia" && (
                  <>
                    <Field label="Participantes planificados" htmlFor="plannedParticipants" hint="Recomendado: 5 por versión y por perfil de uso distinto (Nielsen).">
                      <Input
                        id="plannedParticipants"
                        type="number"
                        min={1}
                        max={50}
                        value={plan.plannedParticipants}
                        onChange={(e) => setPlan({ ...plan, plannedParticipants: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Duración total de la prueba (minutos)" htmlFor="totalDurationMinutes">
                      <Input
                        id="totalDurationMinutes"
                        type="number"
                        min={5}
                        max={480}
                        value={plan.totalDurationMinutes}
                        onChange={(e) => setPlan({ ...plan, totalDurationMinutes: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Entorno de conducción" htmlFor="environment">
                      <Select
                        id="environment"
                        value={plan.environment}
                        onChange={(e) => setPlan({ ...plan, environment: e.target.value as PlanState["environment"] })}
                      >
                        {Object.entries(ENVIRONMENT_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </>
                )}
                {section.fields.map((field) => {
                  const id = `plan-${field.key}`;
                  return (
                    <Field
                      key={field.key}
                      label={field.label}
                      hint={field.hint}
                      htmlFor={id}
                      className={field.short ? undefined : "md:col-span-2"}
                    >
                      {field.short ? (
                        <Input id={id} value={plan[field.key]} onChange={(e) => setText(field.key, e.target.value)} />
                      ) : (
                        <Textarea
                          id={id}
                          rows={field.rows ?? 3}
                          value={plan[field.key]}
                          onChange={(e) => setText(field.key, e.target.value)}
                        />
                      )}
                      {field.key === "eligibilityCriteria" &&
                        eligibility.map((warning) => (
                          <Notice key={warning} tone="warning" className="mt-2">
                            {warning}
                          </Notice>
                        ))}
                    </Field>
                  );
                })}
                {section.id === "etica" && (
                  <div className="md:col-span-2">
                    <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4"
                        checked={plan.legalReviewDone}
                        onChange={(e) => setPlan({ ...plan, legalReviewDone: e.target.checked })}
                      />
                      <span>
                        <span className="font-medium">Revisado por asesoría legal.</span>{" "}
                        <span className="text-muted-foreground">
                          Un profesional de la investigación UX no es experto en derecho: el consentimiento, la
                          protección de datos y los derechos de imagen deben validarse antes de usar el documento
                          con participantes.
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Estado del documento-guía">
          <Card>
            <CardHeader>
              <CardTitle>Completitud</CardTitle>
              <CardDescription>
                {completeness.filled} de {completeness.total} puntos mínimos del planteamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {completeness.missing.length === 0 ? (
                <Notice tone="ok">Están todos los puntos mínimos.</Notice>
              ) : (
                <>
                  <p className="font-medium">Falta definir:</p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {completeness.missing.map((item) => (
                      <li key={item.key}>{item.label}</li>
                    ))}
                  </ul>
                </>
              )}
              {!plan.legalReviewDone && (
                <Notice tone="warning">El apartado ético y legal aún no está revisado por asesoría legal.</Notice>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando…" : "Guardar documento-guía"}
            </Button>
            <Link
              href={`/api/projects/${projectId}/test-report?doc=guide&format=pdf`}
              className={cn(buttonVariants({ variant: "outline" }))}
              target="_blank"
            >
              Descargar PDF
            </Link>
          </div>
          {status && (
            <p role="status" className={cn("text-sm", status.tone === "ok" ? "text-emerald-700" : "text-red-700")}>
              {status.text}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
