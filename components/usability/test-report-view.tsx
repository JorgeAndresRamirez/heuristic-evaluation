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
  { doc: "executive", label: "Informe ejecutivo (PDF)", variant: "default" as const },
  { doc: "report", label: "Informe de resultados (PDF)", variant: "outline" as const },
  { doc: "guide", label: "Documento-guía (PDF)", variant: "outline" as const },
  { doc: "cards", label: "Tarjetas-escenario (PDF)", variant: "outline" as const },
  { doc: "observation", label: "Hoja de observación (PDF)", variant: "outline" as const },
  { doc: "consent", label: "Consentimiento, borrador (PDF)", variant: "outline" as const },
  { doc: "csv", label: "Ejecuciones (CSV)", variant: "outline" as const },
  { doc: "findings-csv", label: "Hallazgos y marcadores (CSV)", variant: "outline" as const },
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
        {roles.flatMap((role) => [
          <Link
            key={`obs-${role}`}
            href={`/api/projects/${project.id}/test-report?doc=observation&role=${encodeURIComponent(role)}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Hoja del observador · {role} (PDF)
          </Link>,
          <Link
            key={`cards-${role}`}
            href={`/api/projects/${project.id}/test-report?doc=cards&role=${encodeURIComponent(role)}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Tarjetas · {role} (PDF)
          </Link>,
        ])}
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

      <ExecutiveOverview summary={summary} />

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

      <SessionFindingsSection project={project} />

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

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "good" | "bad" | "neutral" }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-display mt-1 text-3xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-700",
          tone === "bad" && "text-red-700",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** Indicadores para decidir y comparación visual por escenario (sin dependencias de gráficos: barras accesibles). */
function ExecutiveOverview({ summary }: { summary: ReturnType<typeof computeUsabilitySummary> }) {
  const { kpis } = summary;
  const pct = (value: number | null) => (value === null ? "—" : `${value} %`);
  const scenarios = summary.scenarioMetrics.filter(({ metrics }) => metrics.attempted > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen para decidir</CardTitle>
        <CardDescription>
          {kpis.runs} ejecuciones de participantes reales (sin pilotos). Efectividad = completaron; éxito limpio = completaron sin
          errores, sin falso final y sin llegar al límite.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Efectividad"
            value={pct(kpis.effectiveness)}
            hint="Ejecuciones completadas"
            tone={kpis.effectiveness !== null && kpis.effectiveness >= 80 ? "good" : "neutral"}
          />
          <Kpi
            label="Éxito limpio"
            value={pct(kpis.cleanSuccess)}
            hint="Sin tropiezos"
            tone={kpis.cleanSuccess !== null && kpis.cleanSuccess >= 70 ? "good" : "neutral"}
          />
          <Kpi
            label="Brecha de recuperación"
            value={kpis.recoveryGap === null ? "—" : `${kpis.recoveryGap} pts`}
            hint="Logrado a costa de errores"
            tone={kpis.recoveryGap !== null && kpis.recoveryGap >= 20 ? "bad" : "neutral"}
          />
          <Kpi
            label="Errores críticos"
            value={String(kpis.criticalRuns)}
            hint={`${kpis.falseCompletions} con falso final · tiempo mediano ${formatSeconds(kpis.medianTime)}`}
            tone={kpis.criticalRuns > 0 ? "bad" : "good"}
          />
        </div>

        {scenarios.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Efectividad por escenario</h3>
            <ul className="mt-3 space-y-2" aria-label="Efectividad por escenario">
              {scenarios.map(({ scenario, metrics }) => (
                <li key={scenario.id} className="grid items-center gap-3 sm:grid-cols-[16rem_1fr_11rem]">
                  <span className="truncate text-sm" title={`${scenario.code} · ${scenario.title}`}>
                    {scenario.code} · {scenario.title}
                  </span>
                  <div className="h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${metrics.completionRate} % completaron`}>
                    <div
                      className={cn(
                        "h-full rounded-full",
                        (metrics.completionRate ?? 0) >= 80 ? "bg-emerald-600" : (metrics.completionRate ?? 0) >= 50 ? "bg-amber-500" : "bg-red-600",
                      )}
                      style={{ width: `${metrics.completionRate ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {metrics.completionRate} % · {metrics.criticalErrors} crít. · {metrics.nonCriticalErrors} no crít.
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Hallazgos curados por sesión: lo que se aprendió de cada participante, con captura y enlace a la grabación. */
function SessionFindingsSection({ project }: { project: UsabilityProject }) {
  const withFindings = project.participants.filter(
    (participant) => (participant.session?.findings.length ?? 0) > 0 || (participant.session?.markers.length ?? 0) > 0,
  );
  const scenarioLabel = (id: string | null) => {
    const scenario = project.scenarios.find((item) => item.id === id);
    return scenario ? `${scenario.code} · ${scenario.title}` : "Toda la sesión";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hallazgos de las sesiones</CardTitle>
        <CardDescription>
          Lo registrado en la síntesis de cada sesión: observaciones, recomendaciones, capturas y momentos de la grabación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {withFindings.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aún no hay hallazgos de sesión. Se registran en «Síntesis de la sesión», desde cada sesión.
          </p>
        )}
        {withFindings.map((participant) => {
          const session = participant.session!;
          return (
            <section key={participant.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  {participant.code}
                  {participant.isPilot ? " (piloto)" : ""}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{participant.profile}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {session.recordingUrl && (
                    <a href={session.recordingUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      Ver grabación
                    </a>
                  )}
                  {session.findings.length > 0 && (
                    <a
                      href={`/api/projects/${project.id}/test-report?doc=findings&participant=${participant.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Hallazgos en PDF
                    </a>
                  )}
                </div>
              </div>
              {session.findings.map((finding) => (
                <div key={finding.id} className="space-y-2 rounded-lg border border-border p-4">
                  <p className="font-medium">{finding.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {scenarioLabel(finding.scenarioId)}
                    {finding.recordingOffsetSeconds !== null ? ` · grabación ${formatSeconds(finding.recordingOffsetSeconds)}` : ""}
                  </p>
                  <p className="whitespace-pre-line text-sm">{finding.observation}</p>
                  {finding.recommendation && (
                    <p className="whitespace-pre-line rounded-lg bg-emerald-50/70 p-3 text-sm">
                      <strong>Recomendación:</strong> {finding.recommendation}
                    </p>
                  )}
                  {finding.screenshotPath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/evidence/${finding.screenshotPath}`}
                      alt={`Captura del hallazgo «${finding.title}»`}
                      className="max-h-64 rounded-lg border border-border"
                    />
                  )}
                </div>
              ))}
              {session.markers.length > 0 && (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {session.markers.map((marker) => (
                    <li key={marker.id}>
                      <span className="font-mono tabular-nums text-foreground">{formatSeconds(marker.offsetSeconds)}</span> · {marker.label} ·{" "}
                      {scenarioLabel(marker.scenarioId)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
