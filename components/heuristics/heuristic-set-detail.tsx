/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RichTextEditor, RichTextViewer } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

type Principle = {
  id: string;
  title: string;
  description: string;
  goodExampleHtml: string | null;
  badExampleHtml: string | null;
};

export function HeuristicSetDetail({
  setId,
  setName,
  isSystem,
  initialPrinciples,
}: {
  setId: string;
  setName: string;
  isSystem: boolean;
  initialPrinciples: Principle[];
}) {
  const router = useRouter();
  const [principles, setPrinciples] = useState(initialPrinciples);
  const [form, setForm] = useState({
    title: "",
    description: "",
    goodExampleHtml: "",
    badExampleHtml: "",
  });

  async function addPrinciple() {
    const response = await fetch(`/api/heuristics/${setId}/principles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) return;
    const principle = await response.json();
    setPrinciples((current) => [...current, principle]);
    setForm({ title: "", description: "", goodExampleHtml: "", badExampleHtml: "" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{setName}</h1>
        <p className="mt-2 text-zinc-600">{principles.length} principios configurados</p>
      </div>

      {!isSystem && (
        <Card>
          <CardHeader><CardTitle>Agregar principio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Buena práctica</Label>
              <RichTextEditor
                value={form.goodExampleHtml}
                onChange={(value) => setForm({ ...form, goodExampleHtml: value })}
              />
            </div>
            <div>
              <Label>Mala práctica</Label>
              <RichTextEditor
                value={form.badExampleHtml}
                onChange={(value) => setForm({ ...form, badExampleHtml: value })}
              />
            </div>
            <Button onClick={addPrinciple} disabled={!form.title || !form.description}>Guardar principio</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {principles.map((principle, index) => (
          <Card key={principle.id}>
            <CardHeader>
              <CardTitle>{index + 1}. {principle.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-700">{principle.description}</p>
              {principle.goodExampleHtml && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-green-700">Buena práctica</p>
                  <RichTextViewer html={principle.goodExampleHtml} />
                </div>
              )}
              {principle.badExampleHtml && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-red-700">Mala práctica</p>
                  <RichTextViewer html={principle.badExampleHtml} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
