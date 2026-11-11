/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Notice } from "@/components/usability/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { Guidance } from "@/lib/usability-test";
import { cn } from "@/lib/utils";

export type ParticipantItem = {
  id: string;
  code: string;
  profile: string | null;
  eligibilityConfirmed: boolean;
  isPilot: boolean;
  isReserve: boolean;
  consentSigned: boolean;
  recordingAuthorized: boolean;
  notes: string | null;
  recordedScenarios: number;
  scenarioCount: number;
};

type Draft = {
  code: string;
  profile: string;
  eligibilityConfirmed: boolean;
  isPilot: boolean;
  isReserve: boolean;
  consentSigned: boolean;
  recordingAuthorized: boolean;
  notes: string;
};

const emptyDraft = (code: string): Draft => ({
  code,
  profile: "",
  eligibilityConfirmed: false,
  isPilot: false,
  isReserve: false,
  consentSigned: false,
  recordingAuthorized: false,
  notes: "",
});

export function ParticipantsManager({
  projectId,
  participants,
  roles,
  guidance,
  plannedParticipants,
}: {
  projectId: string;
  participants: ParticipantItem[];
  roles: string[];
  guidance: Guidance;
  plannedParticipants: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft(`P${participants.length + 1}`));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function add() {
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/projects/${projectId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "No se pudo agregar el participante.");
      return;
    }
    setDraft(emptyDraft(`P${participants.length + 2}`));
    router.refresh();
  }

  async function toggle(id: string, patch: Partial<Draft>) {
    await fetch(`/api/participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este participante y todo lo registrado en su sesión?")) return;
    await fetch(`/api/participants/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const checkboxes: Array<[keyof Draft, string]> = [
    ["eligibilityConfirmed", "Cumple los criterios de elegibilidad"],
    ["consentSigned", "Consentimiento firmado"],
    ["recordingAuthorized", "Autoriza la grabación"],
    ["isPilot", "Es el piloto (no cuenta en los resultados)"],
    ["isReserve", "Es candidato de reserva"],
  ];

  return (
    <div className="space-y-6">
      <Notice tone={guidance.level === "warning" ? "warning" : "info"} title={roles.length > 1 ? `Objetivo: ${plannedParticipants} participantes por rol (${plannedParticipants * roles.length} en total)` : `Objetivo: ${plannedParticipants} participantes`}>
        {guidance.message}
      </Notice>
      <Notice tone="info" title="Antes de las sesiones">
        Reclútalos por su relación con el sistema, no por datos sociodemográficos. Confirma la asistencia 24 horas antes
        y ten un candidato de reserva. Un piloto con una persona sirve para comprobar que los escenarios se entienden y
        no se cuenta como test.
      </Notice>

      <Card>
        <CardHeader>
          <CardTitle>Agregar participante</CardTitle>
          <CardDescription>
            Usa un código (P1, P2…). No escribas nombres: el consentimiento firmado se archiva aparte de los resultados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Código" htmlFor="pt-code">
            <Input id="pt-code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          </Field>
          <Field label="Perfil (relación con el sistema)" htmlFor="pt-profile">
            {roles.length > 0 ? (
              <Select id="pt-profile" value={draft.profile} onChange={(e) => setDraft({ ...draft, profile: e.target.value })}>
                <option value="">Selecciona el rol</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            ) : (
              <Input id="pt-profile" value={draft.profile} onChange={(e) => setDraft({ ...draft, profile: e.target.value })} />
            )}
          </Field>
          <fieldset className="grid gap-2 md:col-span-2 md:grid-cols-2">
            <legend className="mb-1 text-sm font-medium">Estado</legend>
            {checkboxes.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={draft[key] as boolean}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <Field label="Notas" htmlFor="pt-notes" className="md:col-span-2">
            <Textarea id="pt-notes" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
          <div className="flex items-center gap-3 md:col-span-2">
            <Button onClick={add} disabled={saving || !draft.code}>
              Agregar participante
            </Button>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {participants.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay participantes.</p>}
        {participants.map((participant) => {
          const ready = participant.consentSigned && participant.eligibilityConfirmed;
          return (
            <Card key={participant.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">{participant.code}</p>
                    {participant.isPilot && <Badge variant="secondary">Piloto</Badge>}
                    {participant.isReserve && <Badge variant="secondary">Reserva</Badge>}
                    <Badge variant="outline">
                      {participant.recordedScenarios} de {participant.scenarioCount} escenarios registrados
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{participant.profile || "Sin perfil indicado"}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    {(
                      [
                        ["eligibilityConfirmed", "Elegible"],
                        ["consentSigned", "Consentimiento"],
                        ["recordingAuthorized", "Grabación"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={participant[key]}
                          onChange={(e) => toggle(participant.id, { [key]: e.target.checked })}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {!ready && !participant.isReserve && (
                    <p className="text-xs text-amber-800">
                      Falta confirmar la elegibilidad o el consentimiento firmado antes de iniciar la sesión.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/projects/${projectId}/sessions/${participant.id}`}
                    className={cn(buttonVariants({ size: "default" }))}
                  >
                    {participant.recordedScenarios > 0 ? "Continuar sesión" : "Iniciar sesión"}
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => remove(participant.id)}>
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
