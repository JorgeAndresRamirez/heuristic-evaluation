/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Field, Notice } from "@/components/usability/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { formatSeconds } from "@/lib/usability-test";
import { cn } from "@/lib/utils";

export type RunState = {
  outcome: "COMPLETED" | "NOT_COMPLETED" | null;
  falseCompletion: boolean;
  stoppedAtLimit: boolean;
  timeOnTaskSeconds: number | null;
  nonCriticalErrors: number;
  observationsHtml: string;
  satisfaction: number | null;
};

export type SessionScenario = {
  id: string;
  code: string;
  title: string;
  startingPoint: string;
  timeLimitMinutes: number;
  completionMilestone: string;
  scenarioCard: string;
  run: RunState | null;
};

const emptyRun: RunState = {
  outcome: null,
  falseCompletion: false,
  stoppedAtLimit: false,
  timeOnTaskSeconds: null,
  nonCriticalErrors: 0,
  observationsHtml: "",
  satisfaction: null,
};

function RunCard({
  participantId,
  scenario,
  satisfactionScale,
}: {
  participantId: string;
  scenario: SessionScenario;
  satisfactionScale: string;
}) {
  const router = useRouter();
  const [run, setRun] = useState<RunState>(scenario.run ?? emptyRun);
  const [elapsed, setElapsed] = useState(scenario.run?.timeOnTaskSeconds ?? 0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const limitSeconds = scenario.timeLimitMinutes * 60;
  const overLimit = elapsed > limitSeconds;

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  function stopTimer() {
    setRunning(false);
    setRun((current) => ({ ...current, timeOnTaskSeconds: elapsed }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const payload = { ...run, timeOnTaskSeconds: running ? elapsed : (run.timeOnTaskSeconds ?? (elapsed || null)) };
    if (running) setRunning(false);
    const response = await fetch(`/api/participants/${participantId}/runs/${scenario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!response.ok) {
      setMessage({ tone: "error", text: "No se pudo guardar este escenario." });
      return;
    }
    setRun((current) => ({ ...current, ...payload, outcome: payload.falseCompletion ? "NOT_COMPLETED" : payload.outcome }));
    setMessage({ tone: "ok", text: "Escenario guardado." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {scenario.code} · {scenario.title}
        </CardTitle>
        <CardDescription>
          Punto de partida: {scenario.startingPoint} · Límite interno: {scenario.timeLimitMinutes} min · Hito: {scenario.completionMilestone}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border-2 border-dashed border-border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tarjeta que lee el participante en voz alta
          </p>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{scenario.scenarioCard}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <p
            className={cn("font-mono text-3xl tabular-nums", overLimit && "text-red-700")}
            aria-label="Tiempo en tarea"
            role="timer"
          >
            {formatSeconds(elapsed)}
          </p>
          {!running ? (
            <Button onClick={() => setRunning(true)}>{elapsed > 0 ? "Reanudar" : "Iniciar"}</Button>
          ) : (
            <Button variant="outline" onClick={stopTimer}>
              Detener
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setRunning(false);
              setElapsed(0);
              setRun({ ...run, timeOnTaskSeconds: null });
            }}
          >
            Poner a cero
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor={`t-${scenario.id}`}>Tiempo (s)</label>
            <Input
              id={`t-${scenario.id}`}
              className="w-24"
              type="number"
              min={0}
              value={elapsed}
              onChange={(e) => {
                setRunning(false);
                const value = Math.max(0, Number(e.target.value));
                setElapsed(value);
                setRun({ ...run, timeOnTaskSeconds: value });
              }}
            />
          </div>
        </div>
        {overLimit && (
          <Notice tone="warning" title="Tiempo límite superado">
            Indica al participante, simplemente, que abandone el escenario y pase al siguiente. No le informes antes del límite
            y marca «Detenido al llegar al límite».
          </Notice>
        )}

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Resultado (según el hito de finalización)</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Resultado del escenario">
            {(
              [
                ["COMPLETED", "Completado"],
                ["NOT_COMPLETED", "No completado"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={run.outcome === value}
                onClick={() => setRun({ ...run, outcome: value, falseCompletion: value === "COMPLETED" ? false : run.falseCompletion })}
                className={cn(
                  buttonVariants({ variant: run.outcome === value ? "default" : "outline" }),
                  "min-w-36",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4"
              checked={run.falseCompletion}
              onChange={(e) =>
                setRun({ ...run, falseCompletion: e.target.checked, outcome: e.target.checked ? "NOT_COMPLETED" : run.outcome })
              }
            />
            <span>
              El participante dijo «ya está» pero <strong>no lo había logrado</strong>. Es un error crítico (probable falta de
              feedback del sistema): no lo ocultes ni lo corrijas.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={run.stoppedAtLimit}
              onChange={(e) => setRun({ ...run, stoppedAtLimit: e.target.checked })}
            />
            Detenido al llegar al límite de tiempo
          </label>
        </fieldset>

        <Field label="Errores no críticos (el participante se recuperó)" htmlFor={`e-${scenario.id}`}>
          <Input
            id={`e-${scenario.id}`}
            className="w-28"
            type="number"
            min={0}
            value={run.nonCriticalErrors}
            onChange={(e) => setRun({ ...run, nonCriticalErrors: Math.max(0, Number(e.target.value)) })}
          />
        </Field>

        <Field
          label="Pensamientos en voz alta y observaciones"
          hint="Anota lo que hace y dice (citas textuales), dónde duda, retrocede o se desvía. Describe hechos; las interpretaciones, aparte."
        >
          <RichTextEditor
            value={run.observationsHtml}
            onChange={(value) => setRun((current) => ({ ...current, observationsHtml: value }))}
            minHeight="7rem"
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Satisfacción subjetiva (1 a 10)</legend>
          <p className="text-xs text-muted-foreground">{satisfactionScale}</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Satisfacción de 1 a 10">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={run.satisfaction === value}
                onClick={() => setRun({ ...run, satisfaction: run.satisfaction === value ? null : value })}
                className={cn(buttonVariants({ variant: run.satisfaction === value ? "default" : "outline", size: "icon" }))}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={saving || run.outcome === null}>
            {saving ? "Guardando…" : "Guardar escenario"}
          </Button>
          {run.outcome === null && <p className="text-xs text-muted-foreground">Marca el resultado para poder guardar.</p>}
          {message && (
            <p role="status" className={cn("text-sm", message.tone === "ok" ? "text-emerald-700" : "text-red-700")}>
              {message.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SessionWorkspace({
  projectId,
  participant,
  facilitators,
  session,
  scenarios,
  satisfactionScale,
}: {
  projectId: string;
  participant: {
    id: string;
    code: string;
    profile: string | null;
    isPilot: boolean;
    consentSigned: boolean;
    recordingAuthorized: boolean;
  };
  facilitators: Array<{ id: string; name: string; role: string | null }>;
  session: { facilitatorId: string | null; sessionDate: string | null; notes: string; finalQuestionsNotes: string };
  scenarios: SessionScenario[];
  satisfactionScale: string;
}) {
  const router = useRouter();
  const [meta, setMeta] = useState(session);
  const [message, setMessage] = useState<string | null>(null);

  async function saveMeta() {
    const response = await fetch(`/api/participants/${participant.id}/session`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facilitatorId: meta.facilitatorId || null,
        sessionDate: meta.sessionDate || null,
        notes: meta.notes,
        finalQuestionsNotes: meta.finalQuestionsNotes,
      }),
    });
    setMessage(response.ok ? "Datos de la sesión guardados." : "No se pudieron guardar los datos de la sesión.");
    if (response.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Sesión de {participant.code}
            {participant.isPilot ? " (piloto)" : ""}
          </h2>
          <p className="text-sm text-muted-foreground">{participant.profile || "Sin perfil indicado"}</p>
        </div>
        <Link href={`/projects/${projectId}/participants`} className={cn(buttonVariants({ variant: "outline" }))}>
          Volver a participantes
        </Link>
      </div>

      {!participant.consentSigned && (
        <Notice tone="error" title="Consentimiento pendiente">
          Este participante no tiene el consentimiento informado firmado. No inicies la sesión hasta tenerlo.
        </Notice>
      )}
      {!participant.recordingAuthorized && (
        <Notice tone="warning" title="Sin autorización de grabación">
          No grabes la pantalla ni la voz. Toma notas.
        </Notice>
      )}
      <Notice tone="info" title="Recuerda al conducir">
        Lee el guion de apertura: se prueba el sistema, no a la persona. Pide que piense en voz alta. No guíes, no hagas
        preguntas durante la prueba (déjalas para el final) y no digas «tarea». No informes del tiempo límite.
      </Notice>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la sesión</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Facilitador" htmlFor="ss-facilitator">
            <Select
              id="ss-facilitator"
              value={meta.facilitatorId ?? ""}
              onChange={(e) => setMeta({ ...meta, facilitatorId: e.target.value || null })}
            >
              <option value="">Sin asignar</option>
              {facilitators.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.role ? ` · ${item.role}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha de la sesión" htmlFor="ss-date">
            <Input
              id="ss-date"
              type="date"
              value={meta.sessionDate ?? ""}
              onChange={(e) => setMeta({ ...meta, sessionDate: e.target.value || null })}
            />
          </Field>
          <Field label="Notas generales de la sesión" htmlFor="ss-notes" className="md:col-span-2">
            <Textarea id="ss-notes" rows={2} value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} />
          </Field>
        </CardContent>
      </Card>

      {scenarios.length === 0 && (
        <Notice tone="warning">
          El proyecto no tiene escenarios. Agrégalos en la sección «Escenarios» antes de hacer sesiones.
        </Notice>
      )}
      {scenarios.map((scenario) => (
        <RunCard
          key={scenario.id}
          participantId={participant.id}
          scenario={scenario}
          satisfactionScale={satisfactionScale}
        />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Preguntas finales</CardTitle>
          <CardDescription>
            Solo al terminar la prueba, para entender una actitud o un suceso que no se pueda interpretar observando. No
            pidas opiniones («¿te gusta?»): se observa, no se encuesta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            aria-label="Preguntas finales y respuestas"
            rows={4}
            value={meta.finalQuestionsNotes}
            onChange={(e) => setMeta({ ...meta, finalQuestionsNotes: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveMeta}>Guardar datos de la sesión</Button>
            {message && (
              <p role="status" className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
