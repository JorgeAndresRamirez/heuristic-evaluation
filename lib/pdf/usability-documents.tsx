/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Documentos PDF del test de usabilidad. Estructura del documento-tipo del Máster (ICU, Tema 1.7):
 * 1 Identificación · 2 Presentación · 3 Resumen ejecutivo · 4 Metodología · 5 Aspectos éticos y legales ·
 * 6 Reporte y análisis de resultados · 7 Conclusiones y recomendaciones · Anexos.
 */

import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  ENVIRONMENT_LABELS,
  ISSUE_ERROR_TYPE_LABELS,
  ISSUE_SEVERITY_LABELS,
  LEVEL_LABELS,
  OUTCOME_LABELS,
  DEFAULT_PARTICIPANT_INSTRUCTIONS,
  DEFAULT_SATISFACTION_SCALE,
  DEFAULT_SEVERITY_CRITERIA,
} from "@/lib/constants";
import type { EmbeddedEvidence } from "@/lib/evidence-embed";
import { htmlToPlainText } from "@/lib/report-utils";
import type { UsabilityProject } from "@/lib/usability-data";
import { computeUsabilitySummary } from "@/lib/usability-data";
import { formatSeconds, severityRank } from "@/lib/usability-test";

const BRAND = "#1d4ed8";

// Sin partir palabras con guion: en títulos y celdas estrechas se leía «manten-imiento».
Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  page: { padding: 42, fontSize: 10, fontFamily: "Helvetica", color: "#18181b", lineHeight: 1.4 },
  cover: { marginTop: 120 },
  kicker: { fontSize: 10, color: BRAND, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10, lineHeight: 1.25 },
  subtitle: { fontSize: 12, color: "#52525b", marginBottom: 4 },
  h1: { fontSize: 14, fontWeight: "bold", color: BRAND, marginTop: 14, marginBottom: 6 },
  h2: { fontSize: 11, fontWeight: "bold", marginTop: 8, marginBottom: 3 },
  p: { marginBottom: 5 },
  label: { fontSize: 9, color: "#71717a", marginTop: 5 },
  box: { border: "1pt solid #d4d4d8", borderRadius: 4, padding: 8, marginBottom: 8 },
  warn: { border: "1.5pt solid #b91c1c", backgroundColor: "#fef2f2", color: "#7f1d1d", padding: 8, marginBottom: 10, fontWeight: "bold" },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #e4e4e7" },
  headRow: { flexDirection: "row", backgroundColor: "#f4f4f5", borderBottom: "1pt solid #a1a1aa" },
  cell: { padding: 4, fontSize: 9 },
  evidenceImage: { maxWidth: 380, maxHeight: 220, marginTop: 4, marginBottom: 2, objectFit: "contain" },
  caption: { fontSize: 8, color: "#71717a", marginBottom: 4 },
  cardPage: { padding: 40, fontFamily: "Helvetica", color: "#18181b" },
  cardKicker: { fontSize: 11, color: "#71717a", marginBottom: 14 },
  cardText: { fontSize: 19, lineHeight: 1.55 },
  line: { borderBottom: "0.6pt solid #71717a", height: 18 },
});

const t = (value: string | null | undefined, fallback = "No definido") =>
  value && value.trim() ? value.trim() : fallback;

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View wrap={false}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.p}>{t(value)}</Text>
    </View>
  );
}

type Column<T> = { label: string; width: string; render: (row: T) => string };

function Table<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <View style={{ marginBottom: 8 }}>
      {/* minPresenceAhead evita dejar el encabezado solo al pie de una página */}
      <View style={s.headRow} fixed minPresenceAhead={70}>
        {columns.map((column) => (
          <Text key={column.label} style={[s.cell, { width: column.width, fontWeight: "bold" }]}>
            {column.label}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={index} style={s.row} wrap={false}>
          {columns.map((column) => (
            <Text key={column.label} style={[s.cell, { width: column.width }]}>
              {column.render(row)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function PlanSections({ project, withResultsNote }: { project: UsabilityProject; withResultsNote?: boolean }) {
  const plan = project.testPlan;
  return (
    <>
      <Text style={s.h1}>1. Identificación</Text>
      <Field label="Título" value={`${project.name}${project.productName ? ` · ${project.productName}` : ""}`} />
      <Field label="Responsables" value={plan?.responsibles} />
      <Field label="Contacto" value={plan?.contact} />
      <Field label="Lugar" value={plan?.location} />
      <Field label="Fechas" value={plan?.plannedDates} />
      <Field label="Versión" value={plan?.version} />
      <Field label="Palabras clave" value={plan?.keywords} />
      <Field label="Confidencialidad" value={plan?.confidentiality} />

      <Text style={s.h1}>2. Presentación</Text>
      <Field label="Aplicación objeto de estudio" value={plan?.applicationSummary} />
      <Field label="Tipos de usuarios" value={plan?.userTypes} />
      <Field label="Momento del proyecto" value={plan?.projectMoment} />
      <Field label="Propósito de la prueba" value={plan?.purpose} />
      <Field label="Contexto" value={plan?.context} />

      <Text style={s.h1}>3. Resumen ejecutivo</Text>
      <Text style={s.p}>{t(plan?.executiveSummary)}</Text>

      <Text style={s.h1}>4. Metodología</Text>
      <Text style={s.h2}>Participantes</Text>
      <Field label="Número planificado" value={String(plan?.plannedParticipants ?? 5)} />
      <Field label="Perfiles representados" value={plan?.profiles} />
      <Field label="Criterios de elegibilidad" value={plan?.eligibilityCriteria} />
      <Field label="Procedimiento de reclutamiento" value={plan?.recruitmentProcedure} />
      <Field label="Retribución" value={plan?.incentive} />
      <Text style={s.h2}>Procedimiento y operativa</Text>
      <Field label="Entorno" value={ENVIRONMENT_LABELS[plan?.environment ?? "PHYSICAL"]} />
      <Field label="Duración total prevista" value={`${plan?.totalDurationMinutes ?? 45} minutos`} />
      <Field label="Medios técnicos" value={plan?.technicalMeans} />
      <Field label="Sistemas de registro" value={plan?.recordingSystems} />
      <Field label="Roles del equipo" value={plan?.teamRoles} />
      <Field label="Información que se registra y se presenta" value={plan?.dataToCollect} />
      <Text style={s.h2}>Criterios de evaluación de los resultados</Text>
      <Field label="Criterios de gravedad" value={plan?.severityCriteria || DEFAULT_SEVERITY_CRITERIA} />
      <Field label="Valoración subjetiva" value={plan?.satisfactionScale || DEFAULT_SATISFACTION_SCALE} />
      <Text style={s.h2}>Instrucciones al participante</Text>
      <Text style={s.p}>{t(plan?.participantInstructions || DEFAULT_PARTICIPANT_INSTRUCTIONS)}</Text>
      <Text style={s.h2}>Escenarios (documentación interna)</Text>
      <Table
        rows={project.scenarios}
        columns={[
          { label: "Código", width: "9%", render: (r) => r.code },
          { label: "Objetivo del usuario", width: "26%", render: (r) => r.userGoal },
          { label: "Punto de partida", width: "20%", render: (r) => r.startingPoint },
          { label: "Límite", width: "9%", render: (r) => `${r.timeLimitMinutes} min` },
          { label: "Hito de finalización", width: "36%", render: (r) => r.completionMilestone },
        ]}
      />

      <Text style={s.h1}>5. Aspectos éticos y legales</Text>
      {!plan?.legalReviewDone && (
        <Text style={s.warn}>Pendiente de revisión por asesoría legal.</Text>
      )}
      <Field label="Consentimiento informado" value={plan?.consentText} />
      <Field label="Derechos de imagen" value={plan?.imageRights} />
      <Field label="Protección de datos" value={plan?.dataProtection} />
      <Field label="Conservación de los datos" value={plan?.dataRetention} />
      <Field label="Código ético de los evaluadores" value={plan?.ethicsCode} />
      {withResultsNote && (
        <Text style={s.p}>Los resultados de la prueba se presentan en el informe de resultados.</Text>
      )}
    </>
  );
}

export function ScenarioCardsAnnex({ project }: { project: UsabilityProject }) {
  return (
    <>
      <Text style={s.h1}>Anexo · Tarjetas-escenario</Text>
      <Text style={s.p}>
        Texto exacto que lee el participante (sin pasos, sin nombres de la interfaz y sin tiempo límite).
      </Text>
      {project.scenarios.map((scenario, index) => (
        <View key={scenario.id} style={s.box} wrap={false}>
          <Text style={s.h2}>
            Escenario {index + 1} ({scenario.code})
          </Text>
          <Text>{scenario.scenarioCard}</Text>
        </View>
      ))}
    </>
  );
}

function Cover({ project, kind }: { project: UsabilityProject; kind: string }) {
  return (
    <View style={s.cover}>
      <Text style={s.kicker}>{kind}</Text>
      <Text style={s.title}>{project.name}</Text>
      {project.productName && <Text style={s.subtitle}>{project.productName}</Text>}
      <Text style={s.subtitle}>{t(project.testPlan?.responsibles, "")}</Text>
      <Text style={s.subtitle}>{t(project.testPlan?.plannedDates, "")}</Text>
    </View>
  );
}

// ─── Documento-guía (planificación) ────────────────────────────────────────────────────────────

export function GuideDocument({ project }: { project: UsabilityProject }) {
  return (
    <Document title={`Documento-guía · ${project.name}`} author={project.testPlan?.responsibles ?? undefined}>
      <Page size="A4" style={s.page}>
        <Cover project={project} kind="Documento-guía del test de usabilidad" />
      </Page>
      <Page size="A4" style={s.page}>
        <PlanSections project={project} />
        <ScenarioCardsAnnex project={project} />
      </Page>
    </Document>
  );
}

// ─── Tarjetas-escenario para el participante ──────────────────────────────────────────────────

export function CardsDocument({ project }: { project: UsabilityProject }) {
  return (
    <Document title={`Tarjetas-escenario · ${project.name}`}>
      {project.scenarios.map((scenario, index) => (
        <Page key={scenario.id} size="A5" orientation="landscape" style={s.cardPage}>
          <Text style={s.cardKicker}>
            Escenario {index + 1} de {project.scenarios.length}
          </Text>
          <Text style={s.cardText}>{scenario.scenarioCard}</Text>
          <Text style={[s.cardKicker, { position: "absolute", bottom: 28, left: 40 }]}>
            Lee esta tarjeta en voz alta y actúa como lo harías en tu trabajo. Piensa en voz alta.
          </Text>
        </Page>
      ))}
    </Document>
  );
}

// ─── Consentimiento informado (borrador) ──────────────────────────────────────────────────────

export function ConsentDocument({ project }: { project: UsabilityProject }) {
  const plan = project.testPlan;
  return (
    <Document title={`Consentimiento informado · ${project.name}`}>
      <Page size="A4" style={s.page}>
        {!plan?.legalReviewDone && (
          <Text style={s.warn}>
            BORRADOR: no usar con participantes hasta que asesoría legal valide este texto. El contenido del
            consentimiento no es estándar ni se copia de otro estudio.
          </Text>
        )}
        <Text style={s.title}>Consentimiento informado</Text>
        <Text style={s.subtitle}>
          {project.name}
          {project.productName ? ` · ${project.productName}` : ""}
        </Text>
        <Text style={s.h1}>Propósito</Text>
        <Text style={s.p}>{t(plan?.purpose)}</Text>
        <Text style={s.h1}>Qué se le pedirá</Text>
        <Text style={s.p}>
          Realizar unos escenarios de uso en el sistema pensando en voz alta. Se prueba el sistema, no a usted. Puede
          detenerse en cualquier momento sin consecuencias.
        </Text>
        <Text style={s.h1}>Texto de consentimiento</Text>
        <Text style={s.p}>{t(plan?.consentText, "Pendiente: redactar con asesoría legal.")}</Text>
        <Text style={s.h1}>Derechos de imagen</Text>
        <Text style={s.p}>{t(plan?.imageRights)}</Text>
        <Text style={s.h1}>Protección de datos y conservación</Text>
        <Text style={s.p}>{t(plan?.dataProtection)}</Text>
        <Text style={s.p}>{t(plan?.dataRetention)}</Text>
        <Text style={s.h1}>Mi decisión</Text>
        <Text style={s.p}>[   ] Acepto participar.     [   ] Autorizo la grabación de pantalla.     [   ] Autorizo la grabación de voz.</Text>
        <View style={{ marginTop: 24 }}>
          <Text style={s.label}>Código del participante</Text>
          <View style={s.line} />
          <Text style={s.label}>Nombre (solo en este formulario, que se archiva aparte de los resultados)</Text>
          <View style={s.line} />
          <Text style={s.label}>Firma y fecha</Text>
          <View style={s.line} />
          <Text style={s.label}>Facilitador</Text>
          <View style={s.line} />
        </View>
      </Page>
    </Document>
  );
}

// ─── Hoja de observación en blanco (una por participante) ─────────────────────────────────────

export function ObservationSheetDocument({ project, role }: { project: UsabilityProject; role?: string | null }) {
  return (
    <Document title={`Hoja de observación${role ? ` · ${role}` : ""} · ${project.name}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Hoja de observación{role ? ` · ${role}` : ""}</Text>
        <Text style={s.subtitle}>{project.name}</Text>
        <View style={[s.box, { marginTop: 8 }]}>
          <Text>Código del participante: ____________   Fecha: ____________   Facilitador: ____________________</Text>
          <Text style={{ marginTop: 6 }}>Versión del sistema: ____________   Dispositivo y navegador: ____________________</Text>
        </View>
        <Text style={s.p}>
          Registra hechos, no interpretaciones. No preguntes durante la prueba: las dudas, al final. No informes del
          tiempo límite; si se cumple, pide que pase al siguiente escenario.
        </Text>
        {project.scenarios.map((scenario) => (
          <View key={scenario.id} style={s.box} wrap={false}>
            <Text style={s.h2}>
              {scenario.code} · {scenario.title}
            </Text>
            <Text style={s.caption}>
              Punto de partida: {scenario.startingPoint} · Límite interno: {scenario.timeLimitMinutes} min · Hito: {scenario.completionMilestone}
            </Text>
            <Text>[   ] Completado     [   ] No completado     [   ] Dijo «ya está» sin lograrlo (error crítico)     [   ] Detenido al límite</Text>
            <Text style={{ marginTop: 5 }}>Tiempo en tarea: ______ s     Errores no críticos: ______</Text>
            <Text style={[s.label, { marginTop: 6 }]}>Pensamientos en voz alta y observaciones</Text>
            <View style={s.line} />
            <View style={s.line} />
            <View style={s.line} />
            <Text style={{ marginTop: 6 }}>Satisfacción (1 a 10): 1  2  3  4  5  6  7  8  9  10</Text>
          </View>
        ))}
        <View style={s.box} wrap={false}>
          <Text style={s.h2}>Preguntas finales (solo al terminar)</Text>
          <View style={s.line} />
          <View style={s.line} />
          <View style={s.line} />
        </View>
      </Page>
    </Document>
  );
}

// ─── Informe de resultados ────────────────────────────────────────────────────────────────────

export function ResultsReportDocument({
  project,
  evidenceByIssue,
}: {
  project: UsabilityProject;
  evidenceByIssue: Record<string, EmbeddedEvidence[]>;
}) {
  const summary = computeUsabilitySummary(project);
  const sortedIssues = [...project.issues].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  return (
    <Document title={`Informe de resultados · ${project.name}`}>
      <Page size="A4" style={s.page}>
        <Cover project={project} kind="Informe de resultados del test de usabilidad" />
      </Page>

      <Page size="A4" style={s.page}>
        <PlanSections project={project} withResultsNote />

        <Text style={s.h1}>6. Reporte y análisis de resultados</Text>
        <Text style={s.p}>
          {summary.real.length} participante(s) real(es){summary.pilotCount ? `; ${summary.pilotCount} piloto(s) excluido(s)` : ""}.
          Métricas según ISO 9241-11: efectividad (escenarios completados), eficiencia (tiempo en tarea) y satisfacción.
        </Text>
        <Table
          rows={summary.scenarioMetrics}
          columns={[
            { label: "Escenario", width: "27%", render: (r) => `${r.scenario.code} · ${r.scenario.title}` },
            { label: "Completaron", width: "15%", render: (r) => (r.metrics.attempted ? `${r.metrics.completed}/${r.metrics.attempted} (${r.metrics.completionRate} %)` : "—") },
            { label: "Err. críticos", width: "11%", render: (r) => (r.metrics.attempted ? String(r.metrics.criticalErrors) : "—") },
            { label: "Err. no crít.", width: "11%", render: (r) => (r.metrics.attempted ? String(r.metrics.nonCriticalErrors) : "—") },
            { label: "Tiempo medio", width: "12%", render: (r) => formatSeconds(r.metrics.timeMean) },
            { label: "Sobre el límite", width: "12%", render: (r) => String(r.metrics.overLimit) },
            { label: "Satisf.", width: "12%", render: (r) => r.metrics.satisfactionValues.join(", ") || "—" },
          ]}
        />
        <Text style={s.caption}>
          La satisfacción es una valoración subjetiva de 1 a 10 y se interpreta cualitativamente; no se hacen estadísticas con ella.
        </Text>

        <Text style={s.h2}>Resultado por participante y escenario</Text>
        <Table
          rows={summary.real}
          columns={[
            { label: "Part.", width: "10%", render: (p) => p.code },
            ...project.scenarios.map((scenario) => ({
              label: scenario.code,
              width: `${Math.max(10, Math.floor(90 / Math.max(project.scenarios.length, 1)))}%`,
              render: (p: (typeof summary.real)[number]) => {
                const run = p.session?.runs.find((item) => item.scenarioId === scenario.id);
                if (!run || !run.outcome) return "—";
                const mark = run.falseCompletion ? "Falso final" : OUTCOME_LABELS[run.outcome];
                return `${mark} · ${formatSeconds(run.timeOnTaskSeconds)}`;
              },
            })),
          ]}
        />

        <Text style={s.h2}>Problemas de usabilidad por gravedad</Text>
        {sortedIssues.length === 0 ? (
          <Text style={s.p}>No se registraron problemas.</Text>
        ) : (
          <Table
            rows={sortedIssues}
            columns={[
              { label: "Gravedad", width: "12%", render: (i) => ISSUE_SEVERITY_LABELS[i.severity] },
              { label: "Problema", width: "34%", render: (i) => i.title },
              { label: "Tipo", width: "16%", render: (i) => (i.errorType === "CRITICAL" ? "Crítico" : "No crítico") },
              { label: "Principio vulnerado", width: "22%", render: (i) => i.principles.map((l) => l.principle.title).join(" · ") },
              { label: "Observado en", width: "16%", render: (i) => String(i.runs.length) + " ejecuc." },
            ]}
          />
        )}

        <Text style={s.h1}>7. Conclusiones y recomendaciones</Text>
        {sortedIssues.length === 0 && <Text style={s.p}>Sin recomendaciones: no hay problemas registrados.</Text>}
        {sortedIssues.map((issue, index) => (
          <View key={issue.id} style={s.box} wrap={false}>
            <Text style={s.h2}>
              {index + 1}. {issue.title} · {ISSUE_SEVERITY_LABELS[issue.severity]}
            </Text>
            <Text style={s.caption}>
              {ISSUE_ERROR_TYPE_LABELS[issue.errorType]} · Impacto {LEVEL_LABELS[issue.impact].toLowerCase()}, frecuencia{" "}
              {LEVEL_LABELS[issue.frequency].toLowerCase()}, persistencia {LEVEL_LABELS[issue.persistence].toLowerCase()} · Principio:{" "}
              {issue.principles.map((l) => l.principle.title).join(" · ") || "—"}
            </Text>
            <Text style={s.p}>{htmlToPlainText(issue.descriptionHtml)}</Text>
            {issue.recommendationHtml && (
              <>
                <Text style={s.label}>Recomendación</Text>
                <Text style={s.p}>{htmlToPlainText(issue.recommendationHtml)}</Text>
              </>
            )}
            {(evidenceByIssue[issue.id] ?? []).map((item) =>
              item.type === "IMAGE" && item.dataUri ? (
                <View key={item.storagePath}>
                  <Image src={item.dataUri} style={s.evidenceImage} />
                  <Text style={s.caption}>{item.fileName}</Text>
                </View>
              ) : (
                <Text key={item.storagePath} style={s.caption}>
                  Vídeo adjunto: {item.fileName}
                </Text>
              ),
            )}
          </View>
        ))}

        <ScenarioCardsAnnex project={project} />
      </Page>
    </Document>
  );
}
