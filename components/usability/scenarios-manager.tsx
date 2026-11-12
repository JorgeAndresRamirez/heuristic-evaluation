/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Field, Notice } from "@/components/usability/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { analyzeScenarioCard, MAX_RECOMMENDED_SCENARIOS, scenarioCountGuidanceByRole } from "@/lib/usability-test";
import { useConfirm, useNotify } from "@/components/ui/dialogs";

export type ScenarioItem = {
  id: string;
  code: string;
  title: string;
  userGoal: string;
  description: string | null;
  startingPoint: string;
  timeLimitMinutes: number;
  completionMilestone: string;
  scenarioCard: string;
  role?: string | null;
};

type Draft = Omit<ScenarioItem, "id">;

const emptyDraft = (code: string): Draft => ({
  code,
  title: "",
  userGoal: "",
  description: "",
  startingPoint: "",
  timeLimitMinutes: 5,
  completionMilestone: "",
  scenarioCard: "",
  role: "",
});

export function ScenariosManager({ projectId, scenarios }: { projectId: string; scenarios: ScenarioItem[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const [draft, setDraft] = useState<Draft>(emptyDraft(`E${scenarios.length + 1}`));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const issues = useMemo(() => analyzeScenarioCard(draft.scenarioCard), [draft.scenarioCard]);
  const countGuidance = scenarioCountGuidanceByRole(editingId ? scenarios : [...scenarios, { role: draft.role }]);
  const blocking = issues.some((issue) => issue.level === "error");

  function startEdit(item: ScenarioItem) {
    const { id, ...rest } = item;
    setEditingId(id);
    setDraft(rest);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setDraft(emptyDraft(`E${scenarios.length + 1}`));
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const response = await fetch(editingId ? `/api/scenarios/${editingId}` : `/api/projects/${projectId}/scenarios`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const fieldErrors = body?.error?.fieldErrors as Record<string, string[]> | undefined;
      setError(Object.values(fieldErrors ?? {}).flat()[0] ?? "No se pudo guardar el escenario.");
      return;
    }
    setEditingId(null);
    setDraft(emptyDraft(`E${scenarios.length + (editingId ? 1 : 2)}`));
    router.refresh();
  }

  async function remove(id: string) {
    if (!(await confirm({ title: "¿Eliminar este escenario?", message: "Se borran también los resultados registrados en él.", confirmLabel: "Eliminar", destructive: true }))) return;
    const response = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
    notify(response.ok ? "ok" : "error", response.ok ? "Escenario eliminado." : "No se pudo eliminar el escenario.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Notice tone="info" title="Cómo plantear un escenario">
        Un escenario parte de una <strong>necesidad real del usuario</strong> (no del negocio), tiene un punto de partida y una
        meta alcanzable. Al participante se le entrega solo la <strong>tarjeta-escenario</strong>: narrativa, en su
        lenguaje, sin explicar los pasos ni el tiempo límite. Se recomiendan no más de {MAX_RECOMMENDED_SCENARIOS}.
      </Notice>
      {countGuidance && (
        <Notice tone={countGuidance.level === "warning" ? "warning" : "info"}>{countGuidance.message}</Notice>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar escenario" : "Nuevo escenario"}</CardTitle>
          <CardDescription>
            Los campos de la izquierda son documentación interna; la tarjeta es lo único que lee el participante.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
              <Field label="Código" htmlFor="sc-code">
                <Input id="sc-code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
              </Field>
              <Field label="Nombre interno" htmlFor="sc-title" hint="Solo para el equipo; no se muestra al participante.">
                <Input id="sc-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </Field>
            </div>
            <Field label="Rol o perfil" htmlFor="sc-role" hint="Quién hace este escenario (p. ej. SoporteAdmin). Genera una hoja de observación por rol.">
              <Input id="sc-role" value={draft.role ?? ""} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
            </Field>
            <Field label="Objetivo del usuario" htmlFor="sc-goal" hint="La necesidad que el usuario espera satisfacer en el sistema.">
              <Textarea id="sc-goal" rows={2} value={draft.userGoal} onChange={(e) => setDraft({ ...draft, userGoal: e.target.value })} />
            </Field>
            <Field label="Descripción de la tarea (interna)" htmlFor="sc-desc">
              <Textarea id="sc-desc" rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <Field label="Punto de partida" htmlFor="sc-start" hint="Dónde empieza el participante (pantalla y sesión).">
                <Input id="sc-start" value={draft.startingPoint} onChange={(e) => setDraft({ ...draft, startingPoint: e.target.value })} />
              </Field>
              <Field label="Tiempo límite (min)" htmlFor="sc-limit" hint="Solo para el facilitador.">
                <Input
                  id="sc-limit"
                  type="number"
                  min={1}
                  max={120}
                  value={draft.timeLimitMinutes}
                  onChange={(e) => setDraft({ ...draft, timeLimitMinutes: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field
              label="Hito de finalización"
              htmlFor="sc-milestone"
              hint="Criterio objetivo y predefinido: un hito de interacción (por ejemplo, aparece el mensaje «…guardado con éxito»). No lo decide el moderador sobre la marcha."
            >
              <Textarea id="sc-milestone" rows={2} value={draft.completionMilestone} onChange={(e) => setDraft({ ...draft, completionMilestone: e.target.value })} />
            </Field>
          </div>

          <div className="space-y-4">
            <Field label="Tarjeta-escenario (lo que lee el participante)" htmlFor="sc-card">
              <Textarea
                id="sc-card"
                rows={9}
                aria-describedby="sc-card-analysis"
                value={draft.scenarioCard}
                onChange={(e) => setDraft({ ...draft, scenarioCard: e.target.value })}
              />
            </Field>
            <div id="sc-card-analysis" className="space-y-2" aria-live="polite">
              {issues.map((issue) => (
                <Notice key={issue.code} tone={issue.level === "error" ? "error" : "warning"}>
                  {issue.message}
                </Notice>
              ))}
              {draft.scenarioCard.trim() && issues.length === 0 && (
                <Notice tone="ok">La tarjeta cumple las comprobaciones automáticas. Léela con otra persona para validarla.</Notice>
              )}
            </div>
            {draft.scenarioCard.trim() && (
              <div className="rounded-xl border-2 border-dashed border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Así lo verá el participante</p>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{draft.scenarioCard}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <Button onClick={save} disabled={saving || !draft.title || !draft.scenarioCard}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Agregar escenario"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset}>
                Cancelar edición
              </Button>
            )}
            {blocking && (
              <p className="text-sm text-amber-800">
                Hay problemas de planteamiento en la tarjeta. Puedes guardar, pero conviene corregirlos antes de la prueba.
              </p>
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
        {scenarios.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay escenarios.</p>}
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>
                  {scenario.code} · {scenario.title}
                </CardTitle>
                <CardDescription>
                  {scenario.role ? `${scenario.role} · ` : ""}Objetivo: {scenario.userGoal} · Límite {scenario.timeLimitMinutes} min (interno)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(scenario)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => remove(scenario.id)}>
                  Eliminar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tarjeta del participante</p>
                <p className="mt-1 whitespace-pre-line leading-relaxed">{scenario.scenarioCard}</p>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium">Punto de partida</dt>
                  <dd className="text-muted-foreground">{scenario.startingPoint}</dd>
                </div>
                <div>
                  <dt className="font-medium">Hito de finalización</dt>
                  <dd className="text-muted-foreground">{scenario.completionMilestone}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
