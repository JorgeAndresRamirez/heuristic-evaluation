/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import Link from "next/link";
import { Notice, ProgressBar } from "@/components/usability/fields";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSeconds, type Guidance, type ScenarioMetrics } from "@/lib/usability-test";
import { cn } from "@/lib/utils";

type Phase = { key: string; label: string; detail: string; done: number; total: number; href: string };

export function UsabilityOverview({
  projectId,
  productName,
  prototypeUrl,
  phases,
  guidance,
  scenarioGuidance,
  legalReviewDone,
  pilotCount,
  participantCount,
  scenarioMetrics,
}: {
  projectId: string;
  productName: string | null;
  prototypeUrl: string | null;
  phases: Phase[];
  guidance: Guidance;
  scenarioGuidance: Guidance | null;
  legalReviewDone: boolean;
  pilotCount: number;
  participantCount: number;
  scenarioMetrics: Array<{ code: string; title: string; timeLimitMinutes: number; metrics: ScenarioMetrics }>;
}) {
  const base = `/projects/${projectId}`;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {productName ?? "Sin producto indicado"}
        {prototypeUrl && (
          <>
            {" · "}
            <a href={prototypeUrl} target="_blank" rel="noreferrer" className="underline">
              {prototypeUrl}
            </a>
          </>
        )}
      </p>

      {!legalReviewDone && (
        <Notice tone="warning" title="Revisión legal pendiente">
          El consentimiento informado, la protección de datos y los derechos de imagen deben validarse con asesoría legal
          antes de las sesiones. Márcalo en el documento-guía cuando esté hecho.
        </Notice>
      )}
      {scenarioGuidance && (
        <Notice tone={scenarioGuidance.level === "warning" ? "warning" : "info"}>{scenarioGuidance.message}</Notice>
      )}
      <Notice tone={guidance.level === "warning" ? "warning" : "info"} title="Participantes">
        {guidance.message}
        {pilotCount > 0 && ` Hay ${pilotCount} piloto(s) que no cuentan en los resultados.`}
      </Notice>

      <Card>
        <CardHeader>
          <CardTitle>Avance por fase</CardTitle>
          <CardDescription>
            Fases del test de usabilidad: briefing, planificación, reclutamiento, desarrollo, evaluación de resultados y
            recomendaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {phases.map((phase, index) => (
            <div key={phase.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">
                  {index + 1}. {phase.label}
                </p>
                <Link href={`${base}/${phase.href}`} className="text-sm text-primary underline-offset-4 hover:underline">
                  Abrir
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">{phase.detail}</p>
              <ProgressBar done={phase.done} total={phase.total} label={phase.label} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados por escenario</CardTitle>
          <CardDescription>
            Efectividad (éxito), eficiencia (tiempo en tarea) y errores, según ISO 9241-11. {participantCount} participante(s) real(es).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scenarioMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay escenarios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Resultados por escenario</caption>
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-3">Escenario</th>
                    <th scope="col" className="py-2 pr-3">Completaron</th>
                    <th scope="col" className="py-2 pr-3">Errores críticos</th>
                    <th scope="col" className="py-2 pr-3">Tiempo medio</th>
                    <th scope="col" className="py-2">Límite</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioMetrics.map(({ code, title, timeLimitMinutes, metrics }) => (
                    <tr key={code} className="border-b border-border/60">
                      <th scope="row" className="py-2 pr-3 font-medium">
                        {code} · {title}
                      </th>
                      <td className="py-2 pr-3">
                        {metrics.attempted === 0 ? "—" : `${metrics.completed} de ${metrics.attempted} (${metrics.completionRate} %)`}
                      </td>
                      <td className="py-2 pr-3">{metrics.attempted === 0 ? "—" : metrics.criticalErrors}</td>
                      <td className="py-2 pr-3">{formatSeconds(metrics.timeMean)}</td>
                      <td className="py-2">{timeLimitMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href={`${base}/test-report`} className={cn(buttonVariants())}>
          Ver informe
        </Link>
        <Link href={`${base}/participants`} className={cn(buttonVariants({ variant: "outline" }))}>
          Ir a participantes
        </Link>
      </div>
    </div>
  );
}
