/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PROJECT_KIND_LABELS, PROJECT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/dialogs";

type ProjectItem = {
  id: string;
  name: string;
  description: string | null;
  status: keyof typeof PROJECT_STATUS_LABELS;
  kind: keyof typeof PROJECT_KIND_LABELS;
  updatedAtLabel: string;
  heuristicSet: { name: string };
  _count: { evaluators: number; findings: number; participants: number; scenarios: number; issues: number };
};

type ConfigItem = { id: string; name: string; heuristicSetId: string };

export function ProjectsDashboard({
  initialProjects,
  configs,
}: {
  initialProjects: ProjectItem[];
  configs: ConfigItem[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [projects, setProjects] = useState(initialProjects);
  // `router.refresh()` entrega nuevas `initialProjects`, pero el estado inicial no se actualiza solo: sin esto la copia
  // creada no aparecía y parecía que el botón no hacía nada.
  const [seenProjects, setSeenProjects] = useState(initialProjects);
  if (seenProjects !== initialProjects) {
    setSeenProjects(initialProjects);
    setProjects(initialProjects);
  }
  /** Acción en curso por proyecto (duplicar o exportar): bloquea el botón para no repetirla y muestra el avance. */
  const [busy, setBusy] = useState<{ id: string; action: "clone" | "export" } | null>(null);
  // El estado se actualiza al renderizar: un doble clic rápido llegaba dos veces antes de bloquear el botón. La referencia
  // se marca en el acto y evita la segunda petición.
  const working = useRef(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    productName: string;
    prototypeUrl: string;
    evaluationConfigId: string;
    heuristicSetId: string;
    kind: keyof typeof PROJECT_KIND_LABELS;
  }>({
    name: "",
    description: "",
    productName: "",
    prototypeUrl: "",
    evaluationConfigId: configs[0]?.id ?? "",
    heuristicSetId: configs[0]?.heuristicSetId ?? "",
    kind: "HEURISTIC_EVALUATION",
  });

  async function createProject() {
    setLoading(true);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!response.ok) return;
    const project = await response.json();
    router.push(`/projects/${project.id}`);
  }

  async function deleteProject(id: string, name: string) {
    if (working.current) return;
    const accepted = await confirm({
      title: `¿Eliminar «${name}»?`,
      message: "Se borran también sus participantes, sesiones, hallazgos y evidencias. No se puede deshacer.",
      confirmLabel: "Eliminar proyecto",
      destructive: true,
    });
    if (!accepted) return;
    working.current = true;
    setNotice(null);
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete");
      setProjects((current) => current.filter((p) => p.id !== id));
      setNotice({ tone: "ok", text: `Proyecto eliminado: «${name}».` });
    } catch {
      setNotice({ tone: "error", text: "No se pudo eliminar el proyecto." });
    } finally {
      working.current = false;
    }
  }

  async function cloneProject(id: string) {
    if (working.current) return;
    working.current = true;
    setBusy({ id, action: "clone" });
    setNotice(null);
    try {
      const response = await fetch(`/api/projects/${id}/clone`, { method: "POST" });
      if (!response.ok) throw new Error("clone");
      const copy = await response.json();
      setNotice({ tone: "ok", text: `Copia creada: «${copy.name}». Está al inicio de la lista.` });
      router.refresh();
    } catch {
      setNotice({ tone: "error", text: "No se pudo duplicar el proyecto. Inténtalo de nuevo." });
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  async function exportProject(id: string, name: string) {
    if (working.current) return;
    working.current = true;
    setBusy({ id, action: "export" });
    setNotice(null);
    try {
      const response = await fetch(`/api/projects/${id}/export`);
      if (!response.ok) throw new Error("export");
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${name.replace(/\s+/g, "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice({ tone: "ok", text: `Exportado: ${anchor.download}.` });
    } catch {
      setNotice({ tone: "error", text: "No se pudo exportar el proyecto." });
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Panel principal</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-foreground">Proyectos de evaluación</h1>
          <p className="mt-2 text-muted-foreground">
            Evaluaciones heurísticas con expertos y tests de usabilidad con usuarios, de forma local.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Cancelar" : "Nuevo proyecto"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Crear proyecto</CardTitle>
            <CardDescription>Define el producto a evaluar y la configuración heurística.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="kind">Técnica</Label>
              <Select
                id="kind"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as keyof typeof PROJECT_KIND_LABELS })}
              >
                {Object.entries(PROJECT_KIND_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.kind === "USABILITY_TEST"
                  ? "Con usuarios reales: escenarios, éxito, tiempo y errores críticos. Complementa a la evaluación heurística, no la sustituye."
                  : "Con expertos: inspección con un set de heurísticas y consolidación de hallazgos."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del proyecto</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">Producto / sistema</Label>
              <Input
                id="productName"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prototypeUrl">URL del prototipo o sistema evaluado</Label>
              <Input
                id="prototypeUrl"
                type="url"
                placeholder="https://..."
                value={form.prototypeUrl}
                onChange={(e) => setForm({ ...form, prototypeUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="config">
                {form.kind === "USABILITY_TEST"
                  ? "Principios de usabilidad (para indicar cuál se vulnera)"
                  : "Configuración de evaluación"}
              </Label>
              <Select
                id="config"
                value={form.evaluationConfigId}
                onChange={(e) => {
                  const config = configs.find((item) => item.id === e.target.value);
                  setForm({
                    ...form,
                    evaluationConfigId: e.target.value,
                    heuristicSetId: config?.heuristicSetId ?? form.heuristicSetId,
                  });
                }}
              >
                {configs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button disabled={loading || !form.name || !form.evaluationConfigId} onClick={createProject}>
                Crear proyecto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notice && (
        <p
          role="status"
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            notice.tone === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900",
          )}
        >
          {notice.text}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="border-border/80 shadow-sm">
            <CardHeader>
              <Badge variant={project.kind === "USABILITY_TEST" ? "default" : "secondary"} className="mb-2 w-fit">
                {PROJECT_KIND_LABELS[project.kind]}
              </Badge>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.heuristicSet.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Estado: {PROJECT_STATUS_LABELS[project.status]}</p>
                {project.kind === "USABILITY_TEST" ? (
                  <p>
                    {project._count.scenarios} escenarios · {project._count.participants} participantes ·{" "}
                    {project._count.issues} problemas
                  </p>
                ) : (
                  <p>{project._count.evaluators} evaluadores · {project._count.findings} hallazgos</p>
                )}
                <p>Actualizado: {project.updatedAtLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className={cn(buttonVariants({ size: "default" }))}
                >
                  Abrir
                </Link>
                <Button variant="outline" onClick={() => cloneProject(project.id)} disabled={busy !== null}>
                  {busy?.id === project.id && busy.action === "clone" ? "Duplicando…" : "Duplicar"}
                </Button>
                <Button variant="outline" onClick={() => exportProject(project.id, project.name)} disabled={busy !== null}>
                  {busy?.id === project.id && busy.action === "export" ? "Exportando…" : "Exportar"}
                </Button>
                <Button variant="destructive" onClick={() => deleteProject(project.id, project.name)}>
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
