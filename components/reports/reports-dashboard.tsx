/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopCriticalFindings } from "@/lib/consolidation";

type Analytics = {
  bySeverity: Array<{ name: string; value: number }>;
  byPrinciple: Array<{ name: string; value: number }>;
  byEvaluator: Array<{ name: string; value: number }>;
};

type Consolidated = {
  id: string;
  title: string;
  summaryHtml: string;
  finalSeverity: "CRITICAL" | "MAJOR" | "MINOR";
};

type Evaluator = { id: string; name: string };

const COLORS = ["#ef4444", "#facc15", "#22c55e", "#059669", "#3b82f6", "#a855f7"];

export function ReportsDashboard({
  projectId,
  projectName,
  analytics,
  consolidatedFindings,
  evaluators,
}: {
  projectId: string;
  projectName: string;
  analytics: Analytics;
  consolidatedFindings: Consolidated[];
  evaluators: Evaluator[];
}) {
  const top10 = getTopCriticalFindings(
    consolidatedFindings.map((item) => ({
      id: item.id,
      title: item.title,
      finalSeverity: item.finalSeverity,
      summaryHtml: item.summaryHtml,
    })),
  );

  async function downloadReport(options: {
    type: "consolidated" | "csv" | "pdf" | "individual" | "individual-pdf";
    evaluatorId?: string;
  }) {
    const response = await fetch(`/api/projects/${projectId}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: options.type,
        evaluatorId: options.evaluatorId,
      }),
    });
    if (!response.ok) {
      alert("No se pudo generar el reporte");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const safeName = projectName.replace(/\s+/g, "-");
    if (options.type === "csv") {
      anchor.download = `${safeName}-hallazgos.csv`;
    } else if (options.type === "pdf") {
      anchor.download = `${safeName}-consolidado.pdf`;
    } else if (options.type === "individual-pdf" && options.evaluatorId) {
      anchor.download = `${safeName}-individual.pdf`;
    } else if (options.type === "individual" && options.evaluatorId) {
      anchor.download = `${safeName}-individual.html`;
    } else {
      anchor.download = `${safeName}-consolidado.html`;
    }
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="mt-2 text-zinc-600">{projectName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadReport({ type: "consolidated" })}>Exportar HTML consolidado</Button>
          <Button variant="outline" onClick={() => downloadReport({ type: "csv" })}>Exportar CSV</Button>
          <Button variant="outline" onClick={() => downloadReport({ type: "pdf" })}>
            Exportar PDF consolidado
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Severidad de hallazgos</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.bySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {analytics.bySeverity.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hallazgos por evaluador</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byEvaluator}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#18181b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Heurísticas más vulneradas</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.byPrinciple} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={180} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top 10 problemas más críticos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {top10.length === 0 ? (
            <p className="text-sm text-zinc-500">Consolida hallazgos para generar el ranking crítico.</p>
          ) : (
            top10.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <span className="font-medium">{item.title}</span>
                  <SeverityBadge severity={item.finalSeverity} />
                </div>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.summaryHtml }} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reportes individuales por evaluador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-600">
            Incluyen los hallazgos del evaluador ordenados por severidad y sus evidencias adjuntas (imágenes embebidas; videos listados por nombre).
          </p>
          <div className="flex flex-col gap-3">
            {evaluators.map((evaluator) => (
              <div
                key={evaluator.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4"
              >
                <span className="font-medium">{evaluator.name}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadReport({ type: "individual", evaluatorId: evaluator.id })}
                  >
                    Exportar HTML
                  </Button>
                  <Button onClick={() => downloadReport({ type: "individual-pdf", evaluatorId: evaluator.id })}>
                    Exportar PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
