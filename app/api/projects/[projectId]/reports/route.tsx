/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { embedEvidenceForReport } from "@/lib/evidence-embed";
import { findingPrinciplesInclude } from "@/lib/finding-principles";
import { findingsToCsv } from "@/lib/export-import";
import { prisma } from "@/lib/prisma";
import { ConsolidatedPdfDocument } from "@/lib/pdf/consolidated-report";
import { IndividualPdfDocument } from "@/lib/pdf/individual-report";
import { buildAnalytics, buildConsolidatedHtmlReport, buildIndividualHtmlReport } from "@/lib/report-builder";
import { sortFindingsForReport } from "@/lib/report-utils";

type Params = { params: Promise<{ projectId: string }> };

async function loadReportProject(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      evaluators: { orderBy: { orderIndex: "asc" } },
      findings: {
        include: {
          evaluator: true,
          ...findingPrinciplesInclude,
          evidence: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
      consolidatedFindings: {
        include: {
          principle: true,
          findings: { include: { evaluator: true } },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
}

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const project = await loadReportProject(projectId);
  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      productName: project.productName,
    },
    analytics: buildAnalytics(project),
    topCritical: project.consolidatedFindings
      .filter((f) => f.finalSeverity === "CRITICAL")
      .slice(0, 10),
  });
}

export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const project = await loadReportProject(projectId);

  if (body.type === "individual" && body.evaluatorId) {
    const evaluator = project.evaluators.find((e) => e.id === body.evaluatorId);
    if (!evaluator) {
      return NextResponse.json({ error: "Evaluador no encontrado" }, { status: 404 });
    }
    const findings = sortFindingsForReport(
      project.findings.filter((f) => f.evaluatorId === body.evaluatorId),
    );
    const embeddedEvidenceByFindingId: Record<string, Awaited<ReturnType<typeof embedEvidenceForReport>>> = {};
    for (const finding of findings) {
      embeddedEvidenceByFindingId[finding.id] = await embedEvidenceForReport(finding.evidence);
    }
    const html = buildIndividualHtmlReport(project, evaluator.name, findings, embeddedEvidenceByFindingId);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte-${evaluator.name.replace(/\s+/g, "-")}.html"`,
      },
    });
  }

  if (body.type === "individual-pdf" && body.evaluatorId) {
    const evaluator = project.evaluators.find((e) => e.id === body.evaluatorId);
    if (!evaluator) {
      return NextResponse.json({ error: "Evaluador no encontrado" }, { status: 404 });
    }
    const findings = sortFindingsForReport(
      project.findings.filter((f) => f.evaluatorId === body.evaluatorId),
    );
    const findingsWithEvidence = await Promise.all(
      findings.map(async (finding) => ({
        id: finding.id,
        screen: finding.screen,
        task: finding.task,
        step: finding.step,
        severity: finding.severity,
        scope: finding.scope,
        descriptionHtml: finding.descriptionHtml,
        solutionHtml: finding.solutionHtml,
        riskAssessment: finding.riskAssessment,
        principles: finding.principles,
        evidence: await embedEvidenceForReport(finding.evidence),
      })),
    );
    const pdfBuffer = await renderToBuffer(
      <IndividualPdfDocument
        projectName={project.name}
        productName={project.productName}
        evaluatorName={evaluator.name}
        findings={findingsWithEvidence}
      />,
    );
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-${evaluator.name.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  }

  if (body.type === "csv") {
    const csv = findingsToCsv(project.findings);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hallazgos-${project.name.replace(/\s+/g, "-")}.csv"`,
      },
    });
  }

  if (body.type === "pdf") {
    const pdfBuffer = await renderToBuffer(<ConsolidatedPdfDocument project={project} />);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-consolidado-${project.name.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  }

  const html = buildConsolidatedHtmlReport(project);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-consolidado-${project.name.replace(/\s+/g, "-")}.html"`,
    },
  });
}
