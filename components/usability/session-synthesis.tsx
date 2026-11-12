/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Field, Notice } from "@/components/usability/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatSeconds, parseTimecode } from "@/lib/usability-test";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/dialogs";

export type SynthesisMarker = { id: string; offsetSeconds: number; label: string; notes: string | null; scenarioId: string | null };
export type SynthesisFinding = {
  id: string;
  title: string;
  observation: string;
  recommendation: string | null;
  recordingOffsetSeconds: number | null;
  scenarioId: string | null;
  screenshotPath: string | null;
  screenshotName: string | null;
};
export type SynthesisScenario = { id: string; code: string; title: string };

async function api(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: unknown }> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: response.ok, data: await response.json().catch(() => null) };
}

function ScenarioSelect({
  id,
  value,
  scenarios,
  onChange,
}: {
  id: string;
  value: string;
  scenarios: SynthesisScenario[];
  onChange: (value: string) => void;
}) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Toda la sesión</option>
      {scenarios.map((scenario) => (
        <option key={scenario.id} value={scenario.id}>
          {scenario.code} · {scenario.title}
        </option>
      ))}
    </Select>
  );
}

/** Enlace de la grabación y notas sobre ella. */
function RecordingCard({ participantId, initialUrl, initialNotes }: { participantId: string; initialUrl: string; initialNotes: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function save() {
    const result = await api(`/api/participants/${participantId}/recording`, "PATCH", { recordingUrl: url, recordingNotes: notes });
    setStatus(
      result.ok
        ? { tone: "ok", text: "Grabación guardada." }
        : { tone: "error", text: "No se pudo guardar. El enlace debe empezar por http:// o https://." },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grabación</CardTitle>
        <CardDescription>
          Enlace de la grabación de la sesión (Meet, Loom, Drive…). Los marcadores y los hallazgos se refieren a sus minutos.
          La grabación se guarda fuera de esta herramienta: aquí solo va el enlace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Enlace de la grabación" htmlFor="rec-url">
          <div className="flex flex-wrap gap-2">
            <Input id="rec-url" className="min-w-64 flex-1" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
            {/^https?:\/\//i.test(url) && (
              <a href={url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
                Abrir
              </a>
            )}
          </div>
        </Field>
        <Field label="Notas sobre la grabación" htmlFor="rec-notes">
          <Textarea id="rec-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save}>Guardar grabación</Button>
          {status && (
            <p role="status" className={cn("text-sm", status.tone === "ok" ? "text-emerald-700" : "text-red-700")}>
              {status.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MarkerRow({
  marker,
  scenarios,
  onChanged,
}: {
  marker: SynthesisMarker;
  scenarios: SynthesisScenario[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const confirm = useConfirm();
  const [time, setTime] = useState(formatSeconds(marker.offsetSeconds));
  const [label, setLabel] = useState(marker.label);
  const [notes, setNotes] = useState(marker.notes ?? "");
  const [scenarioId, setScenarioId] = useState(marker.scenarioId ?? "");
  const [error, setError] = useState<string | null>(null);
  const scenario = scenarios.find((item) => item.id === marker.scenarioId);

  async function save() {
    const offset = parseTimecode(time);
    if (offset === null) return setError("Escribe el tiempo como m:ss (por ejemplo 3:12).");
    const result = await api(`/api/markers/${marker.id}`, "PATCH", { label, notes, offsetSeconds: offset, scenarioId: scenarioId || null });
    if (!result.ok) return setError("No se pudo guardar el marcador.");
    setEditing(false);
    setError(null);
    onChanged();
  }

  async function remove() {
    if (!(await confirm({ title: "¿Eliminar este marcador?", confirmLabel: "Eliminar", destructive: true }))) return;
    await api(`/api/markers/${marker.id}`, "DELETE");
    onChanged();
  }

  if (!editing) {
    return (
      <li className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3">
        <div>
          <p className="text-sm">
            <span className="font-mono font-semibold tabular-nums">{formatSeconds(marker.offsetSeconds)}</span> · {marker.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {scenario ? `${scenario.code} · ${scenario.title}` : "Toda la sesión"}
            {marker.notes ? ` · ${marker.notes}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={remove}>
            Eliminar
          </Button>
        </div>
      </li>
    );
  }
  return (
    <li className="space-y-3 rounded-lg border border-primary/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
        <Field label="Tiempo" htmlFor={`mk-t-${marker.id}`}>
          <Input id={`mk-t-${marker.id}`} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Qué ocurrió" htmlFor={`mk-l-${marker.id}`}>
          <Input id={`mk-l-${marker.id}`} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="Escenario" htmlFor={`mk-s-${marker.id}`} className="sm:col-span-2">
          <ScenarioSelect id={`mk-s-${marker.id}`} value={scenarioId} scenarios={scenarios} onChange={setScenarioId} />
        </Field>
        <Field label="Notas" htmlFor={`mk-n-${marker.id}`} className="sm:col-span-2">
          <Input id={`mk-n-${marker.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save}>
          Guardar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </li>
  );
}

function MarkersCard({
  sessionId,
  markers,
  scenarios,
}: {
  sessionId: string | null;
  markers: SynthesisMarker[];
  scenarios: SynthesisScenario[];
}) {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [label, setLabel] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!sessionId) return setError("Esta sesión aún no tiene datos: registra al menos un escenario o abre la pantalla del participante.");
    const offset = parseTimecode(time);
    if (offset === null) return setError("Escribe el tiempo como m:ss (por ejemplo 3:12).");
    if (!label.trim()) return setError("Escribe qué ocurrió en ese momento.");
    const result = await api(`/api/sessions/${sessionId}/markers`, "POST", { label, offsetSeconds: offset, scenarioId: scenarioId || null });
    if (!result.ok) return setError("No se pudo agregar el marcador.");
    setTime("");
    setLabel("");
    setError(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marcadores de tiempo</CardTitle>
        <CardDescription>
          Momentos de la grabación que vale la pena volver a ver: una duda, un error, una frase del participante. También se
          pueden marcar en vivo desde la sesión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[7rem_1fr_14rem_auto] sm:items-end">
          <Field label="Tiempo" htmlFor="mk-new-t" hint="m:ss">
            <Input id="mk-new-t" value={time} onChange={(e) => setTime(e.target.value)} placeholder="3:12" />
          </Field>
          <Field label="Qué ocurrió" htmlFor="mk-new-l">
            <Input id="mk-new-l" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Escenario" htmlFor="mk-new-s">
            <ScenarioSelect id="mk-new-s" value={scenarioId} scenarios={scenarios} onChange={setScenarioId} />
          </Field>
          <Button onClick={add}>Agregar</Button>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {markers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay marcadores.</p>
        ) : (
          <ul className="space-y-2">
            {markers.map((marker) => (
              <MarkerRow key={marker.id} marker={marker} scenarios={scenarios} onChanged={() => router.refresh()} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FindingCard({
  finding,
  scenarios,
  onChanged,
}: {
  finding: SynthesisFinding;
  scenarios: SynthesisScenario[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const confirm = useConfirm();
  const [title, setTitle] = useState(finding.title);
  const [observation, setObservation] = useState(finding.observation);
  const [recommendation, setRecommendation] = useState(finding.recommendation ?? "");
  const [time, setTime] = useState(finding.recordingOffsetSeconds !== null ? formatSeconds(finding.recordingOffsetSeconds) : "");
  const [scenarioId, setScenarioId] = useState(finding.scenarioId ?? "");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const scenario = scenarios.find((item) => item.id === finding.scenarioId);

  async function save() {
    const offset = time.trim() ? parseTimecode(time) : null;
    if (time.trim() && offset === null) return setError("Escribe el tiempo como m:ss (por ejemplo 3:12).");
    const result = await api(`/api/session-findings/${finding.id}`, "PATCH", {
      title,
      observation,
      recommendation,
      recordingOffsetSeconds: offset,
      scenarioId: scenarioId || null,
    });
    if (!result.ok) return setError("Revisa el título y la observación: son obligatorios.");
    setEditing(false);
    setError(null);
    onChanged();
  }

  async function remove() {
    if (!(await confirm({ title: "¿Eliminar este hallazgo?", message: "Se borra también su captura.", confirmLabel: "Eliminar", destructive: true }))) return;
    await api(`/api/session-findings/${finding.id}`, "DELETE");
    onChanged();
  }

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`/api/session-findings/${finding.id}/screenshot`, { method: "POST", body: form });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "No se pudo subir la captura.");
      return;
    }
    setError(null);
    onChanged();
  }

  async function removeShot() {
    await api(`/api/session-findings/${finding.id}/screenshot`, "DELETE");
    onChanged();
  }

  return (
    <li className="space-y-3 rounded-xl border border-border p-4">
      {!editing ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{finding.title}</p>
              <p className="text-xs text-muted-foreground">
                {scenario ? `${scenario.code} · ${scenario.title}` : "Toda la sesión"}
                {finding.recordingOffsetSeconds !== null ? ` · grabación ${formatSeconds(finding.recordingOffsetSeconds)}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={remove}>
                Eliminar
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-line text-sm">{finding.observation}</p>
          {finding.recommendation && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              <strong className="text-foreground">Recomendación:</strong> {finding.recommendation}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Título" htmlFor={`fd-t-${finding.id}`} className="md:col-span-2">
            <Input id={`fd-t-${finding.id}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Escenario" htmlFor={`fd-s-${finding.id}`}>
            <ScenarioSelect id={`fd-s-${finding.id}`} value={scenarioId} scenarios={scenarios} onChange={setScenarioId} />
          </Field>
          <Field label="Momento en la grabación" htmlFor={`fd-m-${finding.id}`} hint="m:ss, opcional">
            <Input id={`fd-m-${finding.id}`} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Lo observado (hechos)" htmlFor={`fd-o-${finding.id}`} className="md:col-span-2">
            <Textarea id={`fd-o-${finding.id}`} rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} />
          </Field>
          <Field label="Recomendación" htmlFor={`fd-r-${finding.id}`} className="md:col-span-2">
            <Textarea id={`fd-r-${finding.id}`} rows={2} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          </Field>
          <div className="flex gap-2 md:col-span-2">
            <Button size="sm" onClick={save}>
              Guardar hallazgo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {finding.screenshotPath ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/evidence/${finding.screenshotPath}`}
              alt={`Captura del hallazgo «${finding.title}»: ${finding.observation.slice(0, 120)}`}
              className="max-h-72 rounded-lg border border-border"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                Reemplazar captura
              </Button>
              <Button variant="ghost" size="sm" onClick={removeShot}>
                Quitar captura
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            Agregar captura de pantalla
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          aria-label="Subir captura de pantalla"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </li>
  );
}

function FindingsCard({
  sessionId,
  findings,
  scenarios,
}: {
  sessionId: string | null;
  findings: SynthesisFinding[];
  scenarios: SynthesisScenario[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [observation, setObservation] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [time, setTime] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!sessionId) return setError("Esta sesión aún no tiene datos: registra al menos un escenario o abre la pantalla del participante.");
    const offset = time.trim() ? parseTimecode(time) : null;
    if (time.trim() && offset === null) return setError("Escribe el tiempo como m:ss (por ejemplo 3:12).");
    const result = await api(`/api/sessions/${sessionId}/findings`, "POST", {
      title,
      observation,
      recommendation,
      recordingOffsetSeconds: offset,
      scenarioId: scenarioId || null,
    });
    if (!result.ok) return setError("El título y lo observado son obligatorios.");
    setTitle("");
    setObservation("");
    setRecommendation("");
    setTime("");
    setError(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hallazgos de la sesión</CardTitle>
        <CardDescription>
          Lo que se aprendió de este participante, listo para el equipo de diseño y desarrollo: qué se observó, qué recomiendas, una
          captura y el momento en la grabación. Los problemas consolidados de todo el test se registran en «Problemas».
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-dashed border-border p-4 md:grid-cols-2">
          <Field label="Título del hallazgo" htmlFor="fd-new-t" className="md:col-span-2">
            <Input id="fd-new-t" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Escenario" htmlFor="fd-new-s">
            <ScenarioSelect id="fd-new-s" value={scenarioId} scenarios={scenarios} onChange={setScenarioId} />
          </Field>
          <Field label="Momento en la grabación" htmlFor="fd-new-m" hint="m:ss, opcional">
            <Input id="fd-new-m" value={time} onChange={(e) => setTime(e.target.value)} placeholder="3:12" />
          </Field>
          <Field label="Lo observado (hechos)" htmlFor="fd-new-o" className="md:col-span-2">
            <Textarea id="fd-new-o" rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} />
          </Field>
          <Field label="Recomendación" htmlFor="fd-new-r" className="md:col-span-2">
            <Textarea id="fd-new-r" rows={2} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Button onClick={add}>Agregar hallazgo</Button>
            <span className="ml-3 text-xs text-muted-foreground">La captura se agrega después de crear el hallazgo.</span>
          </div>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay hallazgos.</p>
        ) : (
          <ul className="space-y-3">
            {findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} scenarios={scenarios} onChanged={() => router.refresh()} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function SessionSynthesis({
  projectId,
  participant,
  sessionId,
  recording,
  markers,
  findings,
  scenarios,
}: {
  projectId: string;
  participant: { id: string; code: string; profile: string | null; isPilot: boolean };
  sessionId: string | null;
  recording: { url: string; notes: string };
  markers: SynthesisMarker[];
  findings: SynthesisFinding[];
  scenarios: SynthesisScenario[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Síntesis de {participant.code}
            {participant.isPilot ? " (piloto)" : ""}
          </h2>
          <p className="text-sm text-muted-foreground">{participant.profile || "Sin perfil indicado"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {findings.length > 0 && (
            <a
              href={`/api/projects/${projectId}/test-report?doc=findings&participant=${participant.id}`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Hallazgos en PDF
            </a>
          )}
          <Link href={`/projects/${projectId}/sessions/${participant.id}`} className={cn(buttonVariants({ variant: "outline" }))}>
            Volver a la sesión
          </Link>
        </div>
      </div>
      {!sessionId && (
        <Notice tone="warning" title="La sesión aún no empezó">
          Los marcadores y los hallazgos se pueden agregar en cuanto se registre un escenario o se abra la pantalla del participante.
        </Notice>
      )}
      <RecordingCard participantId={participant.id} initialUrl={recording.url} initialNotes={recording.notes} />
      <MarkersCard sessionId={sessionId} markers={markers} scenarios={scenarios} />
      <FindingsCard sessionId={sessionId} findings={findings} scenarios={scenarios} />
    </div>
  );
}
