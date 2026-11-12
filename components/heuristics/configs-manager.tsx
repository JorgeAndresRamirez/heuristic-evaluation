/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useNotify } from "@/components/ui/dialogs";

type ConfigItem = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  heuristicSet: { id: string; name: string };
  _count: { projects: number };
};

type SetOption = { id: string; name: string };

export function ConfigsManager({
  initialConfigs,
  sets,
}: {
  initialConfigs: ConfigItem[];
  sets: SetOption[];
}) {
  const router = useRouter();
  const notify = useNotify();
  const [configs, setConfigs] = useState(initialConfigs);
  const [form, setForm] = useState({ name: "", description: "", heuristicSetId: sets[0]?.id ?? "" });

  async function createConfig() {
    const response = await fetch("/api/configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) return;
    router.refresh();
    setForm({ name: "", description: "", heuristicSetId: sets[0]?.id ?? "" });
  }

  async function duplicateConfig(id: string) {
    await fetch(`/api/configs/${id}/duplicate`, { method: "POST" });
    router.refresh();
  }

  async function exportConfig(id: string, name: string) {
    const response = await fetch(`/api/configs/${id}/export`);
    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/\s+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteConfig(id: string) {
    const response = await fetch(`/api/configs/${id}`, { method: "DELETE" });
    if (!response.ok) {
      notify("error", "No se puede eliminar: hay proyectos asociados");
      return;
    }
    setConfigs((current) => current.filter((config) => config.id !== id));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuraciones de evaluación</h1>
        <p className="mt-2 text-zinc-600">Parametriza qué set de heurísticas usar en cada proyecto.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nueva configuración</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Set de heurísticas</Label>
            <Select value={form.heuristicSetId} onChange={(e) => setForm({ ...form, heuristicSetId: e.target.value })}>
              {sets.map((set) => (
                <option key={set.id} value={set.id}>{set.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descripción</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button onClick={createConfig} disabled={!form.name || !form.heuristicSetId}>Crear configuración</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle>{config.name}</CardTitle>
              <CardDescription>
                {config.heuristicSet.name}
                {config.isDefault ? " · Predeterminada" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.description && <p className="text-sm text-zinc-600">{config.description}</p>}
              <p className="text-sm text-zinc-500">{config._count.projects} proyectos</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => duplicateConfig(config.id)}>Duplicar</Button>
                <Button variant="outline" onClick={() => exportConfig(config.id, config.name)}>Exportar JSON</Button>
                <Button variant="destructive" onClick={() => deleteConfig(config.id)}>Eliminar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
