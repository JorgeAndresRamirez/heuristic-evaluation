/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type EvaluatorItem = {
  id: string;
  name: string;
  role: string | null;
  notes: string | null;
  _count?: { findings: number };
};

type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  productName: string | null;
  prototypeUrl: string | null;
  status: keyof typeof PROJECT_STATUS_LABELS;
  heuristicSet: { name: string };
  evaluationConfig: { name: string };
  evaluators: EvaluatorItem[];
  _count: { findings: number; consolidatedFindings: number };
};

export function ProjectDetailView({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [evaluatorForm, setEvaluatorForm] = useState({ name: "", role: "", notes: "" });
  const [status, setStatus] = useState(project.status);

  async function addEvaluator() {
    const response = await fetch(`/api/projects/${project.id}/evaluators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evaluatorForm),
    });
    if (!response.ok) return;
    router.refresh();
    setEvaluatorForm({ name: "", role: "", notes: "" });
  }

  async function updateStatus(nextStatus: keyof typeof PROJECT_STATUS_LABELS) {
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setStatus(nextStatus);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Proyecto</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-foreground">{project.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {project.productName ?? "Sin producto"} · {project.heuristicSet.name}
          </p>
          {project.description && <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/projects/${project.id}/consolidation`} className={cn(buttonVariants())}>
            Consolidación
          </Link>
          <Link href={`/projects/${project.id}/reports`} className={cn(buttonVariants({ variant: "outline" }))}>
            Reportes
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado del proyecto</CardTitle>
          <CardDescription>Actual: {PROJECT_STATUS_LABELS[status]}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={status === key ? "default" : "outline"}
              onClick={() => updateStatus(key as keyof typeof PROJECT_STATUS_LABELS)}
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evaluadores</CardTitle>
            <CardDescription>{project.evaluators.length} expertos asignados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.evaluators.map((evaluator) => (
              <div key={evaluator.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{evaluator.name}</p>
                    {evaluator.role && <p className="text-sm text-zinc-500">{evaluator.role}</p>}
                    <p className="text-sm text-zinc-500">{evaluator._count?.findings ?? 0} hallazgos</p>
                  </div>
                  <Link
                    href={`/projects/${project.id}/evaluate/${evaluator.id}`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Evaluar
                  </Link>
                </div>
              </div>
            ))}

            <div className="space-y-2 border-t border-zinc-200 pt-4">
              <Label>Agregar evaluador</Label>
              <Input
                placeholder="Nombre"
                value={evaluatorForm.name}
                onChange={(e) => setEvaluatorForm({ ...evaluatorForm, name: e.target.value })}
              />
              <Input
                placeholder="Rol"
                value={evaluatorForm.role}
                onChange={(e) => setEvaluatorForm({ ...evaluatorForm, role: e.target.value })}
              />
              <Input
                placeholder="Notas"
                value={evaluatorForm.notes}
                onChange={(e) => setEvaluatorForm({ ...evaluatorForm, notes: e.target.value })}
              />
              <Button onClick={addEvaluator} disabled={!evaluatorForm.name}>Agregar evaluador</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-600">
            <p>Configuración: {project.evaluationConfig.name}</p>
            <p>Hallazgos registrados: {project._count.findings}</p>
            <p>Hallazgos consolidados: {project._count.consolidatedFindings}</p>
            {project.prototypeUrl && (
              <p>
                Prototipo:{" "}
                <a href={project.prototypeUrl} className="text-zinc-900 underline" target="_blank" rel="noreferrer">
                  {project.prototypeUrl}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
