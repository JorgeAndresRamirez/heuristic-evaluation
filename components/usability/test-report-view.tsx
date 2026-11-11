/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import Link from "next/link";
import { Notice } from "@/components/usability/fields";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ISSUE_SEVERITY_COLORS, ISSUE_SEVERITY_LABELS, OUTCOME_LABELS } from "@/lib/constants";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import { computeUsabilitySummary, type UsabilityProject } from "@/lib/usability-data";
import { formatSeconds, severityRank } from "@/lib/usability-test";
import { cn } from "@/lib/utils";

const downloads = [
  { doc: "report", label: "Informe de resultados (PDF)", variant: "default" as const },
  { doc: "guide", label: "Documento-guía (PDF)", variant: "outline" as const },
  { doc: "cards", label: "Tarjetas-escenario (PDF)", variant: "outline" as const },
  { doc: "observation", label: "Hoja de observación (PDF)", variant: "outline" as const },
  { doc: "consent", label: "Consentimiento, borrador (PDF)", variant: "outline" as const },
  { doc: "csv", label: "Ejecuciones (CSV)", variant: "outline" as const },
];

export function TestReportView({ project }: { project: UsabilityProject }) {
  const summary = computeUsabilitySummary(project);
  const issues = [...project.issues].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const roles = [...new Set(project.scenarios.map((scenario) => scenario.role).filter((role): role is string => !!role))];
  const criticalScenarios = summary.scenarioMetrics.filter(({ metrics }) => metrics.criticalErrors > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {downloads.map((item) => (
          <Link
            key={item.doc}
            href={`/api/projects/${project.id}/test-report?doc=${item.doc}`}
            target="_blank"
            className={cn(buttonVariants({ variant: item.variant, size: "sm" }))}
          >
            {item.label}
          </Link>
        ))}
        {roles.map((role) => (
          <Link
            key={role}
            href={`/api/projects/${project.id}/test-report?doc=observation&role=${encodeURIComponent(role)}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Hoja del observador · {role} (PDF)
          </Link>
        ))}
      </div>

      <Notice tone={summary.guidance.level === "warning" ? "warning" : "info"} title="Participantes">
        {summary.real.length} real(es). {summary.guidance.message}
      </Notice>
      {criticalScenarios.length > 0 && (
        <Notice tone="warning" title="Errores críticos">
          {criticalScenarios.map(({ scenario }) => scenario.code).join(", ")}: al menos un participante no completó el
          escenario o creyó haberlo completado. Un problema que impide completar un escenario es siempre grave.
        </Notice>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Efectividad, eficiencia y satisfacción</CardTitle>
          <CardDescription>ISO 9241-11. El tiempo medio y la mediana solo cuentan a quienes completan.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Métricas por escenario</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-3">Escenario</th>
                <th scope="col" className="py-2 pr-3">Completaron</th>
                <th scope="col" className="py-2 pr-3">Err. críticos</th>
                <th scope="col" className="py-2 pr-3">Err. no críticos</th>
                <th scope="col" className="py-2 pr-3">Tiempo (media · mediana · rango)</th>
                <th scope="col" className="py-2 pr-3">Sobre el límite</th>
                <th scope="col" className="py-2">Satisfacción (1–10)</th>
              </tr>
            </thead>
            <tbody>
              {summary.scenarioMetrics.map(({ scenario, metrics }) => (
                <tr key={scenario.id} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2 pr-3 font-medium">{scenario.code} · {scenario.title}</th>
                  <td className="py-2 pr-3">
                    {metrics.attempted ? `${metrics.completed} de ${metrics.attempted} (${metrics.completionRate} %)` : "—"}
                  </td>
                  <td className="py-2 pr-3">{metrics.attempted ? metrics.criticalErrors : "—"}</td>
                  <td className="py-2 pr-3">{metrics.attempted ? metrics.nonCriticalErrors : "—"}</td>
                  <td className="py-2 pr-3">
                    {formatSeconds(metrics.timeMean)} · {formatSeconds(metrics.timeMedian)} · {formatSeconds(metrics.timeMin)}–{formatSeconds(metrics.timeMax)}
                  </td>
                  <td className="py-2 pr-3">{metrics.overLimit} (límite {scenario.timeLimitMinutes} min)</td>
                  <td className="py-2">{metrics.satisfactionValues.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            La satisfacción subjetiva se interpreta de forma cualitativa; no se hacen estadísticas con ella.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado por participante</CardTitle>
          <CardDescription>Sin pilotos. «Falso final»: dijo «ya está» sin haberlo logrado.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Resultado de cada participante en cada escenario</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-3">Participante</th>
                {project.scenarios.map((scenario) => (
                  <th key={scenario.id} scope="col" className="py-2 pr-3">{scenario.code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.real.map((participant) => (
                <tr key={participant.id} className="border-b border-border/60">
                  <th scope="row" className="py-2 pr-3 font-medium">{participant.code}</th>
                  {project.scenarios.map((scenario) => {
                    const run = participant.session?.runs.find((item) => item.scenarioId === scenario.id);
                    if (!run?.outcome) return <td key={scenario.id} className="py-2 pr-3">—</td>;
                    return (
                      <td key={scenario.id} className="py-2 pr-3">
                        {run.falseCompletion ? "Falso final" : OUTCOME_LABELS[run.outcome]} · {formatSeconds(run.timeOnTaskSeconds)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Problemas y recomendaciones</CardTitle>
          <CardDescription>Ordenados de mayor a menor gravedad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {issues.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay problemas registrados.</p>}
          {issues.map((issue) => (
            <div key={issue.id} className="space-y-2 rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={ISSUE_SEVERITY_COLORS[issue.severity]}>{ISSUE_SEVERITY_LABELS[issue.severity]}</Badge>
                <p className="font-medium">{issue.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Principio: {issue.principles.map((link) => link.principle.title).join(" · ") || "—"}
              </p>
              <RichTextViewer html={issue.descriptionHtml} />
              {issue.recommendationHtml && (
                <div className="rounded-lg bg-emerald-50/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Recomendación</p>
                  <RichTextViewer html={issue.recommendationHtml} />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
