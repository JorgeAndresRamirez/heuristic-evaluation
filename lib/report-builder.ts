/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { SEVERITY_LABELS, SCOPE_LABELS } from "@/lib/constants";
import type { EmbeddedEvidence } from "@/lib/evidence-embed";
import { getFindingPrincipleTitles } from "@/lib/finding-principles";
import { getTopCriticalFindings } from "@/lib/consolidation";
import type { Severity } from "@/lib/generated/prisma";
import { sortFindingsForReport } from "@/lib/report-utils";

export type ReportProject = {
  name: string;
  productName: string | null;
  description: string | null;
  evaluators: Array<{ name: string; role: string | null }>;
  findings: Array<{
    id: string;
    screen: string;
    task: string;
    step: string;
    severity: Severity;
    scope: string;
    descriptionHtml: string;
    solutionHtml: string | null;
    riskAssessment: string | null;
    evaluator: { name: string };
    principles: Array<{ principle: { title: string } }>;
    evidence: Array<{
      fileName: string;
      type: string;
      mimeType: string;
      storagePath: string;
    }>;
    createdAt?: Date | string;
  }>;
  consolidatedFindings: Array<{
    id: string;
    title: string;
    summaryHtml: string;
    finalSeverity: Severity;
    finalScope: string;
    solutionHtml: string | null;
    riskAssessment: string | null;
    principle: { title: string };
    findings: Array<{ evaluator: { name: string } }>;
  }>;
};

export function buildConsolidatedHtmlReport(project: ReportProject): string {
  const top10 = getTopCriticalFindings(
    project.consolidatedFindings.map((f) => ({
      id: f.id,
      title: f.title,
      finalSeverity: f.finalSeverity,
      summaryHtml: f.summaryHtml,
    })),
  );

  const severityCounts = project.findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});

  const principleCounts = project.findings.reduce<Record<string, number>>((acc, f) => {
    for (const link of f.principles) {
      const key = link.principle.title;
      acc[key] = (acc[key] ?? 0) + 1;
    }
    return acc;
  }, {});

  const topPrinciples = Object.entries(principleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte consolidado — ${escapeHtml(project.name)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem; color: #18181b; }
    h1, h2, h3 { color: #09090b; }
    .meta { color: #71717a; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
    .card { border: 1px solid #e4e4e7; border-radius: 12px; padding: 1rem; background: #fafafa; }
    .critical { border-left: 4px solid #ef4444; }
    .major { border-left: 4px solid #facc15; }
    .minor { border-left: 4px solid #22c55e; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #e4e4e7; padding: 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f4f4f5; }
  </style>
</head>
<body>
  <h1>Reporte consolidado de evaluación heurística</h1>
  <p class="meta"><strong>Proyecto:</strong> ${escapeHtml(project.name)}${project.productName ? ` · ${escapeHtml(project.productName)}` : ""}</p>
  ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ""}

  <h2>Resumen ejecutivo</h2>
  <div class="grid">
    <div class="card"><strong>${project.evaluators.length}</strong><br/>Evaluadores</div>
    <div class="card"><strong>${project.findings.length}</strong><br/>Hallazgos individuales</div>
    <div class="card"><strong>${project.consolidatedFindings.length}</strong><br/>Hallazgos consolidados</div>
    <div class="card"><strong>${severityCounts.CRITICAL ?? 0}</strong><br/>Críticos</div>
  </div>

  <h2>Distribución por severidad</h2>
  <ul>
    ${Object.entries(severityCounts)
      .map(([key, value]) => `<li>${SEVERITY_LABELS[key as Severity] ?? key}: ${value}</li>`)
      .join("")}
  </ul>

  <h2>Heurísticas más vulneradas</h2>
  <ol>
    ${topPrinciples.map(([title, count]) => `<li>${escapeHtml(title)} (${count})</li>`).join("")}
  </ol>

  <h2>Top 10 problemas más críticos</h2>
  ${top10.length === 0 ? "<p>No hay hallazgos consolidados aún.</p>" : top10
    .map(
      (item, index) => `
    <div class="card ${item.finalSeverity.toLowerCase()}">
      <h3>${index + 1}. ${escapeHtml(item.title)}</h3>
      <div>${item.summaryHtml}</div>
    </div>`,
    )
    .join("")}

  <h2>Detalle consolidado</h2>
  <table>
    <thead>
      <tr>
        <th>Título</th>
        <th>Principio</th>
        <th>Severidad</th>
        <th>Alcance</th>
        <th>Evaluadores</th>
      </tr>
    </thead>
    <tbody>
      ${project.consolidatedFindings
        .map(
          (f) => `<tr>
        <td>${escapeHtml(f.title)}</td>
        <td>${escapeHtml(f.principle.title)}</td>
        <td>${SEVERITY_LABELS[f.finalSeverity]}</td>
        <td>${SCOPE_LABELS[f.finalScope as keyof typeof SCOPE_LABELS] ?? f.finalScope}</td>
        <td>${f.findings.map((x) => escapeHtml(x.evaluator.name)).join(", ")}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <footer style="margin-top:3rem;color:#71717a;font-size:0.875rem;">
    Generado localmente · Jorge Andrés Ramírez Sierra — Evaluación Heurística
  </footer>
</body>
</html>`;
}

export function buildIndividualHtmlReport(
  project: ReportProject,
  evaluatorName: string,
  findings: ReportProject["findings"],
  embeddedEvidenceByFindingId: Record<string, EmbeddedEvidence[]>,
): string {
  const orderedFindings = sortFindingsForReport(findings);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte individual — ${escapeHtml(evaluatorName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; color: #18181b; }
    .meta { color: #71717a; margin-bottom: 1.5rem; }
    .finding { border: 1px solid #e4e4e7; border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem; }
    .critical { border-left: 4px solid #ef4444; }
    .major { border-left: 4px solid #facc15; }
    .minor { border-left: 4px solid #22c55e; }
    .finding-meta { font-size: 0.875rem; color: #52525b; margin: 0.5rem 0 1rem; }
    .evidence-grid { display: grid; gap: 1rem; margin-top: 1rem; }
    .evidence-item img { max-width: 100%; border-radius: 8px; border: 1px solid #e4e4e7; }
    .evidence-caption { font-size: 0.75rem; color: #71717a; margin-top: 0.25rem; }
    .evidence-video { font-size: 0.875rem; color: #52525b; padding: 0.75rem; background: #f4f4f5; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Reporte individual de evaluación heurística</h1>
  <p><strong>Proyecto:</strong> ${escapeHtml(project.name)}${project.productName ? ` · ${escapeHtml(project.productName)}` : ""}</p>
  <p><strong>Evaluador:</strong> ${escapeHtml(evaluatorName)}</p>
  <p><strong>Total hallazgos:</strong> ${orderedFindings.length}</p>
  <p class="meta">Orden: severidad (crítico → menor), principio heurístico, pantalla, tarea y paso.</p>
  ${orderedFindings
    .map(
      (f, index) => `<article class="finding ${f.severity.toLowerCase()}">
    <h2>${index + 1}. ${escapeHtml(getFindingPrincipleTitles(f))} — ${SEVERITY_LABELS[f.severity]}</h2>
    <p class="finding-meta">
      <strong>Pantalla:</strong> ${escapeHtml(f.screen)} ·
      <strong>Tarea:</strong> ${escapeHtml(f.task)} ·
      <strong>Paso:</strong> ${escapeHtml(f.step)} ·
      <strong>Alcance:</strong> ${SCOPE_LABELS[f.scope as keyof typeof SCOPE_LABELS] ?? escapeHtml(f.scope)}
    </p>
    <h3>Descripción</h3>
    <div>${f.descriptionHtml}</div>
    ${f.solutionHtml ? `<h3>Solución propuesta</h3><div>${f.solutionHtml}</div>` : ""}
    ${f.riskAssessment ? `<h3>Riesgos</h3><p>${escapeHtml(f.riskAssessment)}</p>` : ""}
    ${renderEvidenceHtml(embeddedEvidenceByFindingId[f.id] ?? [])}
  </article>`,
    )
    .join("")}
  <footer style="margin-top:3rem;color:#71717a;font-size:0.875rem;">
    Generado localmente · Jorge Andrés Ramírez Sierra — Evaluación Heurística
  </footer>
</body>
</html>`;
}

function renderEvidenceHtml(evidence: EmbeddedEvidence[]): string {
  if (evidence.length === 0) return "";

  const items = evidence
    .map((item) => {
      if (item.type === "IMAGE" && item.dataUri) {
        return `<figure class="evidence-item">
          <img src="${item.dataUri}" alt="${escapeHtml(item.fileName)}" />
          <figcaption class="evidence-caption">${escapeHtml(item.fileName)}</figcaption>
        </figure>`;
      }
      return `<div class="evidence-video">${item.type === "VIDEO" ? "Video adjunto" : "Archivo adjunto"}: ${escapeHtml(item.fileName)}</div>`;
    })
    .join("");

  return `<section><h3>Evidencias</h3><div class="evidence-grid">${items}</div></section>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAnalytics(project: ReportProject) {
  const bySeverity = Object.entries(
    project.findings.reduce<Record<string, number>>((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({
    name: SEVERITY_LABELS[name as Severity] ?? name,
    value,
  }));

  const byPrinciple = Object.entries(
    project.findings.reduce<Record<string, number>>((acc, f) => {
      for (const link of f.principles) {
        acc[link.principle.title] = (acc[link.principle.title] ?? 0) + 1;
      }
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const byEvaluator = project.evaluators.map((evaluator) => ({
    name: evaluator.name,
    value: project.findings.filter((f) => f.evaluator.name === evaluator.name).length,
  }));

  return { bySeverity, byPrinciple, byEvaluator };
}
