/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { embedEvidenceForReport, type EmbeddedEvidence } from "@/lib/evidence-embed";
import {
  CardsDocument,
  ConsentDocument,
  GuideDocument,
  ObservationSheetDocument,
  ResultsReportDocument,
} from "@/lib/pdf/usability-documents";
import { htmlToPlainText } from "@/lib/report-utils";
import { loadUsabilityProject } from "@/lib/usability-data";

type Params = { params: Promise<{ projectId: string }> };

const slug = (value: string) => value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function pdfResponse(buffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}

/**
 * GET ?doc=report|guide|cards|consent|observation (PDF) o ?doc=csv.
 * - report: informe de resultados con la estructura del documento-tipo del Máster.
 * - guide: documento-guía de planificación (antes de la prueba).
 * - cards: tarjetas-escenario para el participante.
 * - consent: borrador de consentimiento (requiere validación legal).
 * - observation: hoja de observación en blanco.
 */
export async function GET(request: Request, { params }: Params) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const doc = url.searchParams.get("doc") ?? "report";

  const project = await loadUsabilityProject(projectId);
  if (!project || project.kind !== "USABILITY_TEST") {
    return NextResponse.json({ error: "Proyecto de test de usabilidad no encontrado" }, { status: 404 });
  }
  const base = slug(project.name) || "test-de-usabilidad";

  if (doc === "csv") {
    const header = [
      "Participante", "Piloto", "Perfil", "Escenario", "Resultado", "Error crítico", "Falso final",
      "Detenido al límite", "Tiempo en tarea (s)", "Errores no críticos", "Satisfacción (1-10)", "Observaciones",
    ];
    const rows: string[][] = [];
    for (const participant of project.participants) {
      for (const run of participant.session?.runs ?? []) {
        const scenario = project.scenarios.find((item) => item.id === run.scenarioId);
        rows.push([
          participant.code,
          participant.isPilot ? "Sí" : "No",
          participant.profile ?? "",
          scenario ? `${scenario.code} ${scenario.title}` : run.scenarioId,
          run.outcome === "COMPLETED" ? "Completado" : run.outcome === "NOT_COMPLETED" ? "No completado" : "",
          run.outcome === "NOT_COMPLETED" || run.falseCompletion ? "Sí" : "No",
          run.falseCompletion ? "Sí" : "No",
          run.stoppedAtLimit ? "Sí" : "No",
          run.timeOnTaskSeconds ?? "",
          run.nonCriticalErrors,
          run.satisfaction ?? "",
          htmlToPlainText(run.observationsHtml ?? ""),
        ].map((cell) => csvCell(cell)));
      }
    }
    const csv = "﻿" + [header.map(csvCell).join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}-ejecuciones.csv"`,
      },
    });
  }

  if (doc === "guide") return pdfResponse(await renderToBuffer(<GuideDocument project={project} />), `${base}-documento-guia.pdf`);
  if (doc === "cards") return pdfResponse(await renderToBuffer(<CardsDocument project={project} />), `${base}-tarjetas-escenario.pdf`);
  if (doc === "consent") return pdfResponse(await renderToBuffer(<ConsentDocument project={project} />), `${base}-consentimiento.pdf`);
  if (doc === "observation") {
    // ?role=<rol> imprime solo los escenarios de ese rol; sin parámetro, todos.
    const role = url.searchParams.get("role");
    const scenarios = role ? project.scenarios.filter((scenario) => scenario.role === role) : project.scenarios;
    if (scenarios.length === 0) return NextResponse.json({ error: "No hay escenarios para ese rol" }, { status: 404 });
    const suffix = role ? `-${slug(role)}` : "";
    return pdfResponse(
      await renderToBuffer(<ObservationSheetDocument project={{ ...project, scenarios }} role={role} />),
      `${base}-hoja-de-observacion${suffix}.pdf`,
    );
  }

  if (doc === "report") {
    const evidenceByIssue: Record<string, EmbeddedEvidence[]> = {};
    for (const issue of project.issues) {
      evidenceByIssue[issue.id] = await embedEvidenceForReport(issue.evidence);
    }
    return pdfResponse(
      await renderToBuffer(<ResultsReportDocument project={project} evidenceByIssue={evidenceByIssue} />),
      `${base}-informe-de-resultados.pdf`,
    );
  }

  return NextResponse.json({ error: "Documento no reconocido" }, { status: 400 });
}
