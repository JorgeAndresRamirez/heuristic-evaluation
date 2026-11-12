/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Notice } from "@/components/usability/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { RichTextEditor, RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  ISSUE_ERROR_TYPE_LABELS,
  ISSUE_SEVERITY_COLORS,
  ISSUE_SEVERITY_LABELS,
  LEVEL_LABELS,
} from "@/lib/constants";
import { suggestIssueSeverity, type IssueErrorType, type IssueSeverity, type Level } from "@/lib/usability-test";
import { cn, formatFileSize } from "@/lib/utils";
import { useConfirm, useNotify } from "@/components/ui/dialogs";

export type IssueItem = {
  id: string;
  title: string;
  descriptionHtml: string;
  errorType: IssueErrorType;
  impact: Level;
  frequency: Level;
  persistence: Level;
  severity: IssueSeverity;
  recommendationHtml: string | null;
  principleIds: string[];
  principleTitles: string[];
  runIds: string[];
  runLabels: string[];
  evidence: Array<{ id: string; type: "IMAGE" | "VIDEO"; fileName: string; fileSize: number; storagePath: string }>;
};

type Draft = {
  title: string;
  descriptionHtml: string;
  errorType: IssueErrorType;
  impact: Level;
  frequency: Level;
  persistence: Level;
  severity: IssueSeverity;
  recommendationHtml: string;
  principleIds: string[];
  runIds: string[];
};

const emptyDraft: Draft = {
  title: "",
  descriptionHtml: "",
  errorType: "NON_CRITICAL",
  impact: "MEDIUM",
  frequency: "MEDIUM",
  persistence: "MEDIUM",
  severity: "MILD",
  recommendationHtml: "",
  principleIds: [],
  runIds: [],
};

function LevelSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: Level;
  onChange: (value: Level) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as Level)}>
        {Object.entries(LEVEL_LABELS).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function IssuesManager({
  projectId,
  issues,
  principles,
  runs,
  severityCriteria,
}: {
  projectId: string;
  issues: IssueItem[];
  principles: Array<{ id: string; title: string }>;
  runs: Array<{ id: string; label: string }>;
  severityCriteria: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function startEdit(issue: IssueItem) {
    setEditingId(issue.id);
    setDraft({
      title: issue.title,
      descriptionHtml: issue.descriptionHtml,
      errorType: issue.errorType,
      impact: issue.impact,
      frequency: issue.frequency,
      persistence: issue.persistence,
      severity: issue.severity,
      recommendationHtml: issue.recommendationHtml ?? "",
      principleIds: issue.principleIds,
      runIds: issue.runIds,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const response = await fetch(editingId ? `/api/issues/${editingId}` : `/api/projects/${projectId}/issues`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const fieldErrors = body?.error?.fieldErrors as Record<string, string[]> | undefined;
      setError(Object.values(fieldErrors ?? {}).flat()[0] ?? "No se pudo guardar el problema.");
      return;
    }
    reset();
    router.refresh();
  }

  async function remove(id: string) {
    if (!(await confirm({ title: "¿Eliminar este problema?", message: "Se borran también sus evidencias.", confirmLabel: "Eliminar", destructive: true }))) return;
    const response = await fetch(`/api/issues/${id}`, { method: "DELETE" });
    notify(response.ok ? "ok" : "error", response.ok ? "Problema eliminado." : "No se pudo eliminar el problema.");
    router.refresh();
  }

  async function upload(issueId: string, file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`/api/issues/${issueId}/evidence`, { method: "POST", body: form });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      notify("error", typeof body?.error === "string" ? body.error : "No se pudo adjuntar el archivo");
      return;
    }
    router.refresh();
  }

  async function removeEvidence(issueId: string, evidenceId: string) {
    await fetch(`/api/issues/${issueId}/evidence/${evidenceId}`, { method: "DELETE" });
    router.refresh();
  }

  const suggestion = suggestIssueSeverity(draft.errorType, draft.impact, draft.frequency, draft.persistence);

  return (
    <div className="space-y-6">
      <Notice tone="info" title="Cómo registrar un problema">
        Un problema se deduce de lo observado: asócialo a los momentos de interacción donde el participante se bloqueó, se
        retrasó, volvió atrás o se desvió de la meta. Indica <strong>qué principio de usabilidad se vulnera</strong> y propón una{" "}
        <strong>solución</strong>. Un problema que impide completar un escenario es siempre grave.
      </Notice>
      <details className="rounded-lg border border-border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-medium">Criterios de gravedad de esta prueba</summary>
        <p className="mt-2 whitespace-pre-line text-muted-foreground">{severityCriteria}</p>
      </details>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar problema" : "Nuevo problema de usabilidad"}</CardTitle>
          <CardDescription>
            Las capturas con el punto exacto del problema se adjuntan después de guardarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Field label="Título" htmlFor="is-title" className="lg:col-span-2">
            <Input id="is-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Qué se observó (hechos)" className="lg:col-span-2">
            <RichTextEditor
              value={draft.descriptionHtml}
              onChange={(value) => setDraft((current) => ({ ...current, descriptionHtml: value }))}
              minHeight="7rem"
            />
          </Field>

          <fieldset className="space-y-2 lg:col-span-2">
            <legend className="text-sm font-medium">Principio de usabilidad vulnerado</legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {principles.map((principle) => (
                <label key={principle.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4"
                    checked={draft.principleIds.includes(principle.id)}
                    onChange={() => setDraft({ ...draft, principleIds: toggle(draft.principleIds, principle.id) })}
                  />
                  {principle.title}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Tipo de error" htmlFor="is-type">
            <Select
              id="is-type"
              value={draft.errorType}
              onChange={(e) => {
                const errorType = e.target.value as IssueErrorType;
                setDraft({ ...draft, errorType, severity: errorType === "CRITICAL" ? "SEVERE" : draft.severity });
              }}
            >
              {Object.entries(ISSUE_ERROR_TYPE_LABELS).map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <LevelSelect id="is-impact" label="Impacto" value={draft.impact} onChange={(impact) => setDraft({ ...draft, impact })} />
            <LevelSelect id="is-freq" label="Frecuencia" value={draft.frequency} onChange={(frequency) => setDraft({ ...draft, frequency })} />
            <LevelSelect id="is-pers" label="Persistencia" value={draft.persistence} onChange={(persistence) => setDraft({ ...draft, persistence })} />
          </div>
          <Field label="Gravedad" htmlFor="is-sev" hint={`Sugerida por el sistema: ${ISSUE_SEVERITY_LABELS[suggestion]}.`}>
            <div className="flex gap-2">
              <Select
                id="is-sev"
                value={draft.severity}
                onChange={(e) => setDraft({ ...draft, severity: e.target.value as IssueSeverity })}
              >
                {Object.entries(ISSUE_SEVERITY_LABELS).map(([key, text]) => (
                  <option key={key} value={key}>
                    {text}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="outline" onClick={() => setDraft({ ...draft, severity: suggestion })}>
                Usar sugerida
              </Button>
            </div>
          </Field>

          <fieldset className="space-y-2 lg:col-span-2">
            <legend className="text-sm font-medium">Momentos donde se observó</legend>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay escenarios registrados en sesiones.</p>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {runs.map((run) => (
                  <label key={run.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4"
                      checked={draft.runIds.includes(run.id)}
                      onChange={() => setDraft({ ...draft, runIds: toggle(draft.runIds, run.id) })}
                    />
                    {run.label}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <Field label="Recomendación (solución propuesta)" className="lg:col-span-2">
            <RichTextEditor
              value={draft.recommendationHtml}
              onChange={(value) => setDraft((current) => ({ ...current, recommendationHtml: value }))}
              minHeight="6rem"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <Button onClick={save} disabled={saving || !draft.title}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Agregar problema"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset}>
                Cancelar edición
              </Button>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {issues.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay problemas registrados.</p>}
        {issues.map((issue) => (
          <Card key={issue.id}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-2">
                <CardTitle className="text-base">{issue.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={ISSUE_SEVERITY_COLORS[issue.severity]}>{ISSUE_SEVERITY_LABELS[issue.severity]}</Badge>
                  <Badge variant="outline">{ISSUE_ERROR_TYPE_LABELS[issue.errorType]}</Badge>
                  <Badge variant="outline">
                    Impacto {LEVEL_LABELS[issue.impact].toLowerCase()} · Frecuencia {LEVEL_LABELS[issue.frequency].toLowerCase()} ·
                    Persistencia {LEVEL_LABELS[issue.persistence].toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Principio: {issue.principleTitles.join(" · ") || "—"}
                  {issue.runLabels.length > 0 ? ` · Observado en: ${issue.runLabels.join(", ")}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(issue)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => remove(issue.id)}>
                  Eliminar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <RichTextViewer html={issue.descriptionHtml} />
              {issue.recommendationHtml && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Recomendación</p>
                  <RichTextViewer html={issue.recommendationHtml} />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidencias</p>
                <div className="flex flex-wrap gap-3">
                  {issue.evidence.map((item) => (
                    <figure key={item.id} className="w-44 space-y-1">
                      {item.type === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/evidence/${item.storagePath}`}
                          alt={`Evidencia: ${item.fileName}`}
                          className="h-28 w-full rounded border border-border object-cover"
                        />
                      ) : (
                        <video src={`/api/evidence/${item.storagePath}`} controls className="h-28 w-full rounded" />
                      )}
                      <figcaption className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate" title={item.fileName}>
                          {item.fileName} · {formatFileSize(item.fileSize)}
                        </span>
                        <button
                          type="button"
                          className="text-red-700 underline"
                          onClick={() => removeEvidence(issue.id, item.id)}
                          aria-label={`Quitar la evidencia ${item.fileName}`}
                        >
                          Quitar
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <label className={cn("inline-block text-sm")}>
                  <span className="sr-only">Adjuntar captura o vídeo al problema {issue.title}</span>
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    onChange={(e) => {
                      void upload(issue.id, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
