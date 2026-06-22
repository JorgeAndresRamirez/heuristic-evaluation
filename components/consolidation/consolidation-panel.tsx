/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { RichTextEditor, RichTextViewer } from "@/components/ui/rich-text-editor";
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_OPTIONS, SCOPE_LABELS } from "@/lib/constants";
import { groupFindingsByPrinciple, suggestConsolidatedSeverity } from "@/lib/consolidation";
import { findingsShareAnyPrinciple, getFindingPrincipleTitles } from "@/lib/finding-principles";
import type { Severity } from "@/lib/generated/prisma";

type Evidence = {
  id: string;
  type: "IMAGE" | "VIDEO";
  fileName: string;
  storagePath: string;
};

type Finding = {
  id: string;
  screen: string;
  task: string;
  step: string;
  severity: Severity;
  scope: "ISOLATED" | "GENERALIZED";
  descriptionHtml: string;
  consolidatedFindingId: string | null;
  evaluator: { name: string };
  principles: Array<{
    principleId: string;
    principle: { title: string };
  }>;
  evidence: Evidence[];
};

type Consolidated = {
  id: string;
  title: string;
  summaryHtml: string;
  finalSeverity: Finding["severity"];
  finalScope: Finding["scope"];
  solutionHtml: string | null;
  riskAssessment: string | null;
  principle: { title: string };
  findings: Array<{ evaluator: { name: string } }>;
};

const STEPS = [
  "Revisa los hallazgos pendientes y busca los que describen el mismo problema (idealmente del mismo principio heurístico).",
  "Marca con la casilla al menos 2 hallazgos relacionados reportados por uno o varios evaluadores.",
  "Completa el título y resumen consolidado, define la severidad y alcance final consensuados.",
  "Pulsa «Fusionar hallazgos». Los originales desaparecerán de pendientes y quedarán agrupados abajo.",
  "Cuando termines, ve a Reportes para exportar el análisis consolidado del proyecto.",
];

export function ConsolidationPanel({
  projectId,
  initialFindings,
  initialConsolidated,
}: {
  projectId: string;
  initialFindings: Finding[];
  initialConsolidated: Consolidated[];
}) {
  const router = useRouter();
  const [findings, setFindings] = useState(initialFindings);
  const [consolidated, setConsolidated] = useState(initialConsolidated);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergeForm, setMergeForm] = useState({
    title: "",
    summaryHtml: "",
    finalSeverity: "MAJOR" as Severity,
    finalScope: "GENERALIZED" as Finding["scope"],
    solutionHtml: "",
    riskAssessment: "",
  });

  const unconsolidated = useMemo(
    () => findings.filter((finding) => !finding.consolidatedFindingId),
    [findings],
  );

  const groupedUnconsolidated = useMemo(
    () => groupFindingsByPrinciple(unconsolidated),
    [unconsolidated],
  );

  const consolidatedCount = findings.length - unconsolidated.length;
  const progressPercent =
    findings.length === 0 ? 0 : Math.round((consolidatedCount / findings.length) * 100);

  const selectedFindings = useMemo(
    () => findings.filter((finding) => selectedIds.includes(finding.id)),
    [findings, selectedIds],
  );

  const selectedPrincipleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const finding of selectedFindings) {
      for (const link of finding.principles) {
        ids.add(link.principleId);
      }
    }
    return ids;
  }, [selectedFindings]);

  const lacksSharedPrinciple =
    selectedFindings.length >= 2 && !findingsShareAnyPrinciple(selectedFindings);

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function applySuggestedSeverity() {
    if (selectedFindings.length === 0) return;
    setMergeForm((current) => ({
      ...current,
      finalSeverity: suggestConsolidatedSeverity(selectedFindings),
    }));
  }

  async function mergeSelected() {
    const response = await fetch(`/api/projects/${projectId}/consolidation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "merge",
        findingIds: selectedIds,
        ...mergeForm,
      }),
    });
    if (!response.ok) {
      alert("No se pudo fusionar los hallazgos seleccionados");
      return;
    }
    const item = await response.json();
    setConsolidated((current) => [...current, item]);
    setFindings((current) =>
      current.map((finding) =>
        selectedIds.includes(finding.id) ? { ...finding, consolidatedFindingId: item.id } : finding,
      ),
    );
    setSelectedIds([]);
    setMergeForm({
      title: "",
      summaryHtml: "",
      finalSeverity: "MAJOR",
      finalScope: "GENERALIZED",
      solutionHtml: "",
      riskAssessment: "",
    });
    router.refresh();
  }

  async function deleteConsolidated(id: string, title: string) {
    const confirmed = window.confirm(
      `¿Desfusionar «${title}»? Los hallazgos volverán a la lista de pendientes.`,
    );
    if (!confirmed) return;

    await fetch(`/api/consolidation/${id}`, { method: "DELETE" });
    setConsolidated((current) => current.filter((item) => item.id !== id));
    setFindings((current) =>
      current.map((finding) =>
        finding.consolidatedFindingId === id ? { ...finding, consolidatedFindingId: null } : finding,
      ),
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Consolidación de hallazgos</h1>
        <p className="mt-2 max-w-3xl text-zinc-600">
          Esta fase une hallazgos duplicados o equivalentes (reportados por distintos evaluadores) en un
          único registro con severidad y alcance consensuados. Es el paso previo a generar el reporte
          consolidado del proyecto.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>¿Qué debes hacer aquí?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
            <p className="font-medium text-zinc-900">Progreso de consolidación</p>
            <p className="mt-1 text-zinc-600">
              {consolidatedCount} de {findings.length} hallazgos ya consolidados ({progressPercent}%)
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hallazgos pendientes de consolidar ({unconsolidated.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {unconsolidated.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-600">
              {findings.length === 0
                ? "Aún no hay hallazgos registrados. Completa la inspección antes de consolidar."
                : "Todos los hallazgos están consolidados. Puedes revisar el resultado abajo o ir a Reportes."}
            </div>
          ) : (
            Array.from(groupedUnconsolidated.entries()).map(([principleId, groupFindings]) => (
              <section key={principleId} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  {groupFindings[0]?.principles.find((link) => link.principleId === principleId)?.principle
                    .title ?? "Principio heurístico"}
                </h3>
                {groupFindings.map((finding) => (
                  <label
                    key={finding.id}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                      selectedIds.includes(finding.id)
                        ? "border-primary bg-primary/5"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(finding.id)}
                      onChange={() => toggleSelection(finding.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{getFindingPrincipleTitles(finding)}</span>
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-sm text-zinc-500">{finding.evaluator.name}</span>
                        <span className="text-xs text-zinc-400">
                          {SCOPE_LABELS[finding.scope]}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600">
                        {finding.screen} · {finding.task} · {finding.step}
                      </p>
                      <RichTextViewer html={finding.descriptionHtml} />
                      {finding.evidence.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {finding.evidence.map((item) =>
                            item.type === "IMAGE" ? (
                              <img
                                key={item.id}
                                src={`/api/evidence/${item.storagePath}`}
                                alt={item.fileName}
                                className="h-16 w-24 rounded-md border border-zinc-200 object-cover"
                              />
                            ) : (
                              <span
                                key={item.id}
                                className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                              >
                                Video: {item.fileName}
                              </span>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  </label>
                ))}
              </section>
            ))
          )}

          {unconsolidated.length > 0 && selectedIds.length === 1 ? (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Selecciona al menos <strong>2 hallazgos</strong> que describan el mismo problema para poder fusionarlos.
            </p>
          ) : null}

          {selectedIds.length >= 2 && (
            <div className="space-y-4 border-t border-zinc-200 pt-4">
              <div>
                <h3 className="font-semibold">Fusionar {selectedIds.length} hallazgos seleccionados</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Redacta un único hallazgo que represente el consenso del equipo sobre este problema.
                </p>
              </div>

              {lacksSharedPrinciple ? (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Los hallazgos seleccionados no comparten ningún principio heurístico. Revisa si realmente
                  describen el mismo problema antes de fusionarlos.
                </p>
              ) : selectedPrincipleIds.size > 1 ? (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Los hallazgos seleccionados involucran varios principios. Se usará el principio más frecuente
                  como referencia del registro consolidado.
                </p>
              ) : null}

              <Input
                placeholder="Título consolidado (ej.: Falta de retroalimentación al enviar el formulario)"
                value={mergeForm.title}
                onChange={(e) => setMergeForm({ ...mergeForm, title: e.target.value })}
              />
              <div className="space-y-2">
                <Label>Resumen consolidado</Label>
                <RichTextEditor
                  value={mergeForm.summaryHtml}
                  onChange={(value) => setMergeForm({ ...mergeForm, summaryHtml: value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Severidad final consensuada</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {SEVERITY_OPTIONS.map((severity) => (
                      <button
                        key={severity}
                        type="button"
                        onClick={() => setMergeForm({ ...mergeForm, finalSeverity: severity })}
                        className={`rounded-lg px-3 py-2.5 text-sm font-medium ${SEVERITY_COLORS[severity]} ${
                          mergeForm.finalSeverity === severity ? "ring-2 ring-primary ring-offset-2" : "opacity-85"
                        }`}
                      >
                        {SEVERITY_LABELS[severity]}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" onClick={applySuggestedSeverity}>
                    Sugerir severidad según selección
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Alcance final</Label>
                  <Select
                    value={mergeForm.finalScope}
                    onChange={(e) =>
                      setMergeForm({ ...mergeForm, finalScope: e.target.value as Finding["scope"] })
                    }
                  >
                    <option value="ISOLATED">{SCOPE_LABELS.ISOLATED}</option>
                    <option value="GENERALIZED">{SCOPE_LABELS.GENERALIZED}</option>
                  </Select>
                  <p className="text-xs text-zinc-500">
                    Aislado: afecta un flujo puntual. Generalizado: se repite en varias pantallas o tareas.
                  </p>
                </div>
              </div>
              <Button onClick={mergeSelected} disabled={!mergeForm.title || !mergeForm.summaryHtml}>
                Fusionar hallazgos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Hallazgos consolidados ({consolidated.length})</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Estos registros alimentan el Top 10 y los reportes consolidados del proyecto.
          </p>
        </div>
        {consolidated.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-600">
            Aún no hay hallazgos consolidados. Fusiona hallazgos pendientes para crear el primer registro.
          </div>
        ) : (
          consolidated.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <p className="text-sm text-zinc-500">{item.principle.title}</p>
                </div>
                <SeverityBadge severity={item.finalSeverity} />
              </CardHeader>
              <CardContent className="space-y-3">
                <RichTextViewer html={item.summaryHtml} />
                <p className="text-sm text-zinc-600">
                  Alcance: {SCOPE_LABELS[item.finalScope]} · Evaluadores:{" "}
                  {item.findings.map((finding) => finding.evaluator.name).join(", ")}
                </p>
                <Button variant="destructive" onClick={() => deleteConsolidated(item.id, item.title)}>
                  Desfusionar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
