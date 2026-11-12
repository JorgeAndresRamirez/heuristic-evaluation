/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Informe ejecutivo (2 páginas, orientado a decidir) y hallazgos de una sesión (para diseño y desarrollo).
 */

import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ISSUE_SEVERITY_LABELS } from "@/lib/constants";
import { htmlToPlainText } from "@/lib/report-utils";
import type { UsabilityProject } from "@/lib/usability-data";
import { computeUsabilitySummary } from "@/lib/usability-data";
import { formatSeconds, severityRank } from "@/lib/usability-test";

Font.registerHyphenationCallback((word) => [word]);

const BRAND = "#1d4ed8";
const GOOD = "#047857";
const WARN = "#b45309";
const BAD = "#b91c1c";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#18181b", lineHeight: 1.4 },
  kicker: { fontSize: 9, color: BRAND, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4, lineHeight: 1.25 },
  subtitle: { fontSize: 10, color: "#52525b", marginBottom: 12 },
  h1: { fontSize: 12.5, fontWeight: "bold", color: BRAND, marginTop: 14, marginBottom: 6 },
  p: { marginBottom: 4 },
  caption: { fontSize: 8, color: "#71717a", marginBottom: 3 },
  kpiRow: { flexDirection: "row", marginBottom: 6 },
  kpi: { flexGrow: 1, flexBasis: 0, border: "1pt solid #d4d4d8", borderRadius: 4, padding: 8, marginRight: 6 },
  kpiLabel: { fontSize: 8, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.6 },
  kpiValue: { fontSize: 20, fontWeight: "bold", marginTop: 4, marginBottom: 6, lineHeight: 1.1 },
  kpiHint: { fontSize: 8, color: "#71717a", marginTop: 1 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  barLabel: { width: 170, fontSize: 8.5 },
  barTrack: { flexGrow: 1, height: 8, backgroundColor: "#e4e4e7", borderRadius: 4 },
  barValue: { width: 92, fontSize: 8, color: "#52525b", textAlign: "right" },
  box: { border: "1pt solid #d4d4d8", borderRadius: 4, padding: 8, marginBottom: 7 },
  boxTitle: { fontSize: 10.5, fontWeight: "bold", marginBottom: 2 },
  label: { fontSize: 8, color: "#71717a", marginTop: 3 },
  shot: { maxWidth: 360, maxHeight: 210, marginTop: 4, objectFit: "contain" },
  markerRow: { flexDirection: "row", borderBottom: "0.5pt solid #e4e4e7", paddingVertical: 2 },
});

function barColor(rate: number) {
  return rate >= 80 ? GOOD : rate >= 50 ? WARN : BAD;
}

function Kpi({ label, value, hint, color }: { label: string; value: string; hint: string; color?: string }) {
  return (
    <View style={s.kpi}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, color ? { color } : {}]}>{value}</Text>
      <Text style={s.kpiHint}>{hint}</Text>
    </View>
  );
}

/** Capturas de los hallazgos ya incrustadas (data URI), por id de hallazgo. */
export type ScreenshotMap = Record<string, string | null>;

export function ExecutiveReportDocument({ project, screenshots }: { project: UsabilityProject; screenshots: ScreenshotMap }) {
  const summary = computeUsabilitySummary(project);
  const { kpis } = summary;
  const plan = project.testPlan;
  const pct = (value: number | null) => (value === null ? "—" : `${value} %`);
  const issues = [...project.issues].sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 6);
  const scenarios = summary.scenarioMetrics.filter(({ metrics }) => metrics.attempted > 0);
  const findings = project.participants
    .filter((participant) => !participant.isPilot)
    .flatMap((participant) => (participant.session?.findings ?? []).map((finding) => ({ participant, finding })))
    .slice(0, 6);

  return (
    <Document title={`Informe ejecutivo · ${project.name}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Informe ejecutivo · test de usabilidad</Text>
        <Text style={s.title}>{project.name}</Text>
        <Text style={s.subtitle}>
          {project.productName ? `${project.productName} · ` : ""}
          {summary.real.length} participante(s) real(es)
          {summary.pilotCount ? `, ${summary.pilotCount} piloto(s) excluido(s)` : ""}
          {plan?.plannedDates ? ` · ${plan.plannedDates}` : ""}
          {plan?.responsibles ? ` · ${plan.responsibles}` : ""}
        </Text>

        <Text style={s.h1}>Lo esencial</Text>
        <View style={s.kpiRow}>
          <Kpi label="Efectividad" value={pct(kpis.effectiveness)} hint="Ejecuciones completadas" color={kpis.effectiveness !== null && kpis.effectiveness >= 80 ? GOOD : undefined} />
          <Kpi label="Éxito limpio" value={pct(kpis.cleanSuccess)} hint="Sin errores ni falso final" color={kpis.cleanSuccess !== null && kpis.cleanSuccess >= 70 ? GOOD : undefined} />
          <Kpi label="Brecha" value={kpis.recoveryGap === null ? "—" : `${kpis.recoveryGap} pts`} hint="Logrado a costa de errores" color={kpis.recoveryGap !== null && kpis.recoveryGap >= 20 ? BAD : undefined} />
          <Kpi label="Críticos" value={String(kpis.criticalRuns)} hint={`${kpis.falseCompletions} falso final · mediana ${formatSeconds(kpis.medianTime)}`} color={kpis.criticalRuns > 0 ? BAD : GOOD} />
        </View>
        <Text style={s.caption}>
          Efectividad = ejecuciones completadas. Éxito limpio = completadas sin errores no críticos, sin falso final y sin llegar al
          límite de tiempo. Brecha = efectividad menos éxito limpio. {kpis.runs} ejecuciones.
        </Text>

        <Text style={s.h1}>Efectividad por escenario</Text>
        {scenarios.length === 0 && <Text style={s.p}>Aún no hay ejecuciones registradas.</Text>}
        {scenarios.map(({ scenario, metrics }) => (
          <View key={scenario.id} style={s.barRow} wrap={false}>
            <Text style={s.barLabel}>
              {scenario.code} · {scenario.title.length > 34 ? `${scenario.title.slice(0, 33)}…` : scenario.title}
            </Text>
            <View style={s.barTrack}>
              <View style={{ width: `${metrics.completionRate ?? 0}%`, height: 8, borderRadius: 4, backgroundColor: barColor(metrics.completionRate ?? 0) }} />
            </View>
            <Text style={s.barValue}>
              {metrics.completionRate} % · {metrics.criticalErrors} crít.
            </Text>
          </View>
        ))}

        <Text style={s.h1}>Qué corregir primero</Text>
        {issues.length === 0 && <Text style={s.p}>Aún no hay problemas registrados.</Text>}
        {issues.map((issue, index) => (
          <View key={issue.id} style={s.box} wrap={false}>
            <Text style={s.boxTitle}>
              {index + 1}. {issue.title} · {ISSUE_SEVERITY_LABELS[issue.severity]}
            </Text>
            <Text style={s.caption}>Principio: {issue.principles.map((link) => link.principle.title).join(" · ") || "—"} · Observado en {issue.runs.length} ejecuc.</Text>
            <Text style={s.p}>{htmlToPlainText(issue.descriptionHtml)}</Text>
            {issue.recommendationHtml && (
              <>
                <Text style={s.label}>Recomendación</Text>
                <Text style={s.p}>{htmlToPlainText(issue.recommendationHtml)}</Text>
              </>
            )}
          </View>
        ))}
      </Page>

      {findings.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.h1}>Hallazgos clave de las sesiones</Text>
          {findings.map(({ participant, finding }) => (
            <View key={finding.id} style={s.box} wrap={false}>
              <Text style={s.boxTitle}>{finding.title}</Text>
              <Text style={s.caption}>
                {participant.code}
                {finding.recordingOffsetSeconds !== null ? ` · grabación ${formatSeconds(finding.recordingOffsetSeconds)}` : ""}
              </Text>
              <Text style={s.p}>{finding.observation}</Text>
              {finding.recommendation && (
                <>
                  <Text style={s.label}>Recomendación</Text>
                  <Text style={s.p}>{finding.recommendation}</Text>
                </>
              )}
              {screenshots[finding.id] && <Image src={screenshots[finding.id] as string} style={s.shot} />}
            </View>
          ))}
        </Page>
      )}
    </Document>
  );
}

/** Hallazgos de una sesión para diseño y desarrollo: grabación, momentos marcados y cada hallazgo con su captura. */
export function SessionFindingsDocument({
  project,
  participantId,
  screenshots,
}: {
  project: UsabilityProject;
  participantId: string;
  screenshots: ScreenshotMap;
}) {
  const participant = project.participants.find((item) => item.id === participantId);
  const session = participant?.session;
  const scenarioLabel = (id: string | null) => {
    const scenario = project.scenarios.find((item) => item.id === id);
    return scenario ? `${scenario.code} · ${scenario.title}` : "Toda la sesión";
  };

  return (
    <Document title={`Hallazgos de ${participant?.code ?? "la sesión"} · ${project.name}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Hallazgos de la sesión · {project.name}</Text>
        <Text style={s.title}>Participante {participant?.code}</Text>
        <Text style={s.subtitle}>
          {participant?.profile ? `${participant.profile} · ` : ""}
          {session?.sessionDate ? `${session.sessionDate.toISOString().slice(0, 10)} · ` : ""}
          {session?.recordingUrl ? `Grabación: ${session.recordingUrl}` : "Sin enlace de grabación"}
        </Text>
        {session?.recordingNotes && <Text style={s.p}>{session.recordingNotes}</Text>}

        {(session?.markers.length ?? 0) > 0 && (
          <>
            <Text style={s.h1}>Momentos marcados en la grabación</Text>
            {session!.markers.map((marker) => (
              <View key={marker.id} style={s.markerRow} wrap={false}>
                <Text style={{ width: 44, fontFamily: "Courier", fontSize: 9 }}>{formatSeconds(marker.offsetSeconds)}</Text>
                <Text style={{ flexGrow: 1, fontSize: 9 }}>
                  {marker.label}
                  {marker.notes ? ` — ${marker.notes}` : ""}
                </Text>
                <Text style={{ width: 150, fontSize: 8, color: "#71717a" }}>{scenarioLabel(marker.scenarioId)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={s.h1}>Hallazgos</Text>
        {(session?.findings.length ?? 0) === 0 && <Text style={s.p}>Esta sesión no tiene hallazgos registrados.</Text>}
        {(session?.findings ?? []).map((finding, index) => (
          <View key={finding.id} style={s.box} wrap={false}>
            <Text style={s.boxTitle}>
              {index + 1}. {finding.title}
            </Text>
            <Text style={s.caption}>
              {scenarioLabel(finding.scenarioId)}
              {finding.recordingOffsetSeconds !== null ? ` · grabación ${formatSeconds(finding.recordingOffsetSeconds)}` : ""}
            </Text>
            <Text style={s.label}>Lo observado</Text>
            <Text style={s.p}>{finding.observation}</Text>
            {finding.recommendation && (
              <>
                <Text style={s.label}>Recomendación</Text>
                <Text style={s.p}>{finding.recommendation}</Text>
              </>
            )}
            {screenshots[finding.id] && <Image src={screenshots[finding.id] as string} style={s.shot} />}
          </View>
        ))}
      </Page>
    </Document>
  );
}
