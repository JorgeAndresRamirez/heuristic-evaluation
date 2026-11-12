/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useState } from "react";
import { Field } from "@/components/usability/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SessionPhase } from "@/lib/participant-screen";
import { formatSeconds } from "@/lib/usability-test";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/dialogs";

export type ScreenState = {
  token: string | null;
  sessionId: string | null;
  phase: SessionPhase;
  currentScenarioId: string | null;
  startedAt: string | null;
};

const PHASE_TEXT: Record<SessionPhase, string> = {
  NOT_STARTED: "Todavía nada («En un momento comenzamos»)",
  WELCOME: "La bienvenida",
  SCENARIO: "Una situación",
  BETWEEN: "La pausa («Un momento, por favor»)",
  FINISHED: "El cierre («¡Gracias!»)",
};

export type ScreenCommand =
  | { action: "open" }
  | { action: "welcome" }
  | { action: "scenario"; scenarioId: string }
  | { action: "pause" }
  | { action: "finish" }
  | { action: "reset" };

/**
 * Panel del facilitador para controlar la pantalla del participante (la pestaña que se comparte en la videollamada)
 * y para marcar momentos sobre la grabación sin salir de la sesión.
 */
export function ScreenControl({
  state,
  scenarioLabel,
  welcomeEnabled,
  send,
}: {
  state: ScreenState;
  /** Código del escenario que se está mostrando, si hay uno. */
  scenarioLabel: string | null;
  welcomeEnabled: boolean;
  send: (command: ScreenCommand) => Promise<ScreenState | null>;
}) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markerLabel, setMarkerLabel] = useState("");
  const [markerMessage, setMarkerMessage] = useState<string | null>(null);

  async function run(command: ScreenCommand) {
    setBusy(true);
    await send(command);
    setBusy(false);
  }

  async function openScreen() {
    // La pestaña se abre en el mismo clic (antes de esperar al servidor) para que el navegador no la bloquee.
    const screenWindow = window.open("", "pantalla-del-participante");
    setBusy(true);
    const next = await send({ action: "open" });
    setBusy(false);
    if (next?.token && screenWindow) screenWindow.location.href = `/p/${next.token}`;
    else if (next?.token) window.open(`/p/${next.token}`, "pantalla-del-participante");
    else screenWindow?.close();
  }

  async function copyLink() {
    if (!state.token) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${state.token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function addMarker() {
    if (!state.sessionId || !markerLabel.trim()) return;
    const offset = state.startedAt ? Math.max(0, Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000)) : 0;
    const response = await fetch(`/api/sessions/${state.sessionId}/markers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: markerLabel.trim(), offsetSeconds: offset, scenarioId: state.currentScenarioId }),
    });
    if (response.ok) {
      setMarkerMessage(`Momento marcado en ${formatSeconds(offset)}.`);
      setMarkerLabel("");
    } else {
      setMarkerMessage("No se pudo marcar el momento.");
    }
  }

  const opened = !!state.token;
  const watching =
    state.phase === "SCENARIO" && scenarioLabel ? `Situación ${scenarioLabel}` : PHASE_TEXT[state.phase];

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle>Pantalla del participante</CardTitle>
        <CardDescription>
          Es la pestaña que se comparte en la videollamada: sin cronómetro, notas ni datos tuyos. Tú decides qué ve y cuándo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={openScreen} disabled={busy}>
            {opened ? "Reabrir la pantalla del participante" : "Abrir la pantalla del participante"}
          </Button>
          {opened && (
            <Button variant="outline" onClick={copyLink}>
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </Button>
          )}
          <p className="text-sm text-muted-foreground" role="status">
            El participante ve: <strong className="text-foreground">{opened ? watching : "nada todavía"}</strong>
          </p>
        </div>

        {opened && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={state.phase === "WELCOME" ? "default" : "outline"}
              onClick={() => run({ action: "welcome" })}
              disabled={busy}
              title={welcomeEnabled ? undefined : "La bienvenida está desactivada: se mostrará la pausa"}
            >
              Mostrar la bienvenida
            </Button>
            <Button variant={state.phase === "BETWEEN" ? "default" : "outline"} onClick={() => run({ action: "pause" })} disabled={busy}>
              Pausa
            </Button>
            <Button
              variant={state.phase === "FINISHED" ? "default" : "outline"}
              onClick={async () => {
                const accepted = await confirm({
                  title: "¿Mostrar el cierre al participante?",
                  message: "Úsalo cuando termine el último escenario.",
                  confirmLabel: "Finalizar sesión",
                });
                if (accepted) run({ action: "finish" });
              }}
              disabled={busy}
            >
              Finalizar sesión
            </Button>
            <Button variant="ghost" onClick={() => run({ action: "reset" })} disabled={busy}>
              Reiniciar pantalla
            </Button>
          </div>
        )}

        {state.sessionId && (
          <div className={cn("grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_auto] sm:items-end")}>
            <Field
              label="Marcar un momento sobre la grabación"
              htmlFor="screen-marker"
              hint={
                state.startedAt
                  ? "Queda con el tiempo transcurrido desde que se mostró algo al participante."
                  : "Aún no se ha mostrado nada: el tiempo quedará en 0:00 y podrás ajustarlo en la síntesis."
              }
            >
              <Input
                id="screen-marker"
                value={markerLabel}
                onChange={(e) => setMarkerLabel(e.target.value)}
                placeholder="Ej.: duda al buscar el menú"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addMarker();
                }}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={addMarker} disabled={!markerLabel.trim()}>
                Marcar momento
              </Button>
              {markerMessage && (
                <p role="status" className="text-sm text-muted-foreground">
                  {markerMessage}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
