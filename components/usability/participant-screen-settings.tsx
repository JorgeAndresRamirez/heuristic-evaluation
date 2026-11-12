/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useState } from "react";
import { Field, Notice } from "@/components/usability/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { RichTextEditor, RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  DEFAULT_CLOSING_MESSAGE,
  DEFAULT_WELCOME_HTML,
  DEFAULT_WELCOME_TITLE,
} from "@/lib/participant-screen";
import { cn } from "@/lib/utils";

export type ParticipantScreenState = {
  welcomeEnabled: boolean;
  welcomeTitle: string;
  welcomeHtml: string;
  closingMessage: string;
};

/**
 * Configura lo que ve el participante antes y después de los escenarios. Los escenarios se muestran de uno en uno
 * en su pantalla (/p/<enlace>) según lo que el facilitador decida desde la sesión.
 */
export function ParticipantScreenSettings({
  projectId,
  initial,
  productName,
  locked,
}: {
  projectId: string;
  initial: ParticipantScreenState;
  productName: string;
  /** Si ya hay sesiones, se avisa de que el cambio no afecta a lo ya presentado, pero sigue siendo editable. */
  locked: boolean;
}) {
  const [state, setState] = useState<ParticipantScreenState>({
    ...initial,
    welcomeTitle: initial.welcomeTitle || DEFAULT_WELCOME_TITLE,
    welcomeHtml: initial.welcomeHtml || DEFAULT_WELCOME_HTML,
    closingMessage: initial.closingMessage || DEFAULT_CLOSING_MESSAGE,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setStatus(null);
    const response = await fetch(`/api/projects/${projectId}/participant-screen`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setSaving(false);
    setStatus(
      response.ok
        ? { tone: "ok", text: "Pantalla del participante guardada." }
        : { tone: "error", text: "No se pudo guardar. Revisa los datos e inténtalo de nuevo." },
    );
  }

  return (
    <div className="space-y-6">
      <Notice tone="info" title="La ventana que se comparte">
        En cada sesión se abre una pestaña aparte con la pantalla del participante: primero la bienvenida que configuras aquí,
        luego cada situación de una en una, y al final el cierre. Es la que compartes en la videollamada; tu ventana de
        observación (con el cronómetro y las notas) no se comparte. El participante nunca ve la palabra «tarea», el tiempo
        límite ni el hito de finalización.
      </Notice>
      {locked && (
        <Notice tone="warning" title="Ya hay sesiones">
          Puedes editar el texto, pero las sesiones ya hechas se presentaron con la versión anterior.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenida y cierre</CardTitle>
            <CardDescription>Las orientaciones iniciales y el mensaje de despedida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
                checked={state.welcomeEnabled}
                onChange={(e) => setState({ ...state, welcomeEnabled: e.target.checked })}
              />
              <span>
                <span className="font-medium">Mostrar la bienvenida antes del primer escenario.</span>{" "}
                <span className="text-muted-foreground">Si se desactiva, el participante pasa directo a la pausa.</span>
              </span>
            </label>
            <Field label="Título de la bienvenida" htmlFor="ws-title">
              <Input id="ws-title" value={state.welcomeTitle} onChange={(e) => setState({ ...state, welcomeTitle: e.target.value })} />
            </Field>
            <Field
              label="Orientaciones iniciales"
              hint="Con negrita, cursiva y viñetas. Lo que el participante necesita saber antes de empezar."
            >
              <RichTextEditor value={state.welcomeHtml} onChange={(value) => setState((s) => ({ ...s, welcomeHtml: value }))} minHeight="12rem" />
            </Field>
            <Field label="Mensaje de cierre" htmlFor="ws-closing">
              <Textarea id="ws-closing" rows={2} value={state.closingMessage} onChange={(e) => setState({ ...state, closingMessage: e.target.value })} />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? "Guardando…" : "Guardar pantalla del participante"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setState({
                    ...state,
                    welcomeTitle: DEFAULT_WELCOME_TITLE,
                    welcomeHtml: DEFAULT_WELCOME_HTML,
                    closingMessage: DEFAULT_CLOSING_MESSAGE,
                  })
                }
              >
                Restablecer textos
              </Button>
              {status && (
                <p role="status" className={cn("text-sm", status.tone === "ok" ? "text-emerald-700" : "text-red-700")}>
                  {status.text}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
            <CardDescription>Así lo verá el participante.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-border bg-background p-8">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{productName}</p>
              {state.welcomeEnabled ? (
                <>
                  <h2 className="font-display mt-6 text-3xl font-semibold tracking-tight">{state.welcomeTitle || DEFAULT_WELCOME_TITLE}</h2>
                  <RichTextViewer html={state.welcomeHtml || DEFAULT_WELCOME_HTML} className="mt-5 [&_li]:my-2" />
                </>
              ) : (
                <p className="mt-6 text-muted-foreground">La bienvenida está desactivada.</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-background p-8 text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight">¡Gracias!</h2>
              <p className="mt-4 text-muted-foreground">{state.closingMessage || DEFAULT_CLOSING_MESSAGE}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
