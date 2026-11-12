/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { HEURISTIC_SOURCE_LABELS } from "@/lib/constants";
import { useNotify } from "@/components/ui/dialogs";

type HeuristicSetItem = {
  id: string;
  name: string;
  description: string | null;
  source: keyof typeof HEURISTIC_SOURCE_LABELS;
  isSystem: boolean;
  _count: { principles: number; projects: number };
};

export function HeuristicsManager({ initialSets }: { initialSets: HeuristicSetItem[] }) {
  const router = useRouter();
  const notify = useNotify();
  const [sets, setSets] = useState(initialSets);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function createSet() {
    const response = await fetch("/api/heuristics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) return;
    router.refresh();
    setName("");
    setDescription("");
  }

  async function duplicateSet(id: string) {
    await fetch(`/api/heuristics/${id}/duplicate`, { method: "POST" });
    router.refresh();
  }

  async function exportSet(id: string, setName: string) {
    const response = await fetch(`/api/heuristics/${id}/export`);
    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${setName.replace(/\s+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteSet(id: string) {
    const response = await fetch(`/api/heuristics/${id}`, { method: "DELETE" });
    if (!response.ok) {
      notify("error", "No se pudo eliminar el set");
      return;
    }
    setSets((current) => current.filter((set) => set.id !== id));
  }

  async function importSet(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = JSON.parse(await file.text());
    await fetch("/api/heuristics/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sets de heurísticas</h1>
        <p className="mt-2 text-zinc-600">
          Gestiona principios parametrizables con ejemplos de buenas y malas prácticas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear set personalizado</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button onClick={createSet} disabled={!name}>Crear set</Button>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
              Importar JSON
              <input type="file" accept="application/json" className="hidden" onChange={importSet} />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sets.map((set) => (
          <Card key={set.id}>
            <CardHeader>
              <CardTitle>{set.name}</CardTitle>
              <CardDescription>
                {HEURISTIC_SOURCE_LABELS[set.source]} · {set._count.principles} principios
                {set.isSystem ? " · Sistema" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {set.description && <p className="text-sm text-zinc-600">{set.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Link href={`/heuristics/${set.id}`} className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm text-white">
                  Ver principios
                </Link>
                <Button variant="outline" onClick={() => duplicateSet(set.id)}>Duplicar</Button>
                <Button variant="outline" onClick={() => exportSet(set.id, set.name)}>Exportar</Button>
                {!set.isSystem && (
                  <Button variant="destructive" onClick={() => deleteSet(set.id)}>Eliminar</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
