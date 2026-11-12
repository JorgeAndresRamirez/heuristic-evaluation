/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { ImagePlus, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { RichTextEditor, RichTextViewer } from "@/components/ui/rich-text-editor";
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_OPTIONS, SCOPE_LABELS } from "@/lib/constants";
import { getFindingPrincipleTitles } from "@/lib/finding-principles";
import type { Severity } from "@/lib/generated/prisma";
import { formatFileSize } from "@/lib/utils";
import { useConfirm, useNotify } from "@/components/ui/dialogs";

type Principle = { id: string; title: string; description: string };
type Evidence = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  type: "IMAGE" | "VIDEO";
};
type Finding = {
  id: string;
  consolidatedFindingId: string | null;
  screen: string;
  task: string;
  step: string;
  descriptionHtml: string;
  severity: Severity;
  scope: "ISOLATED" | "GENERALIZED";
  solutionHtml: string | null;
  riskAssessment: string | null;
  principles: Array<{
    principleId: string;
    orderIndex: number;
    principle: { id: string; title: string };
  }>;
  evidence: Evidence[];
};

type PendingAttachment = {
  id: string;
  file: File;
  previewUrl: string;
};

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

export function EvaluationWorkspace({
  projectId,
  evaluatorId,
  evaluatorName,
  principles,
  initialFindings,
}: {
  projectId: string;
  evaluatorId: string;
  evaluatorName: string;
  principles: Principle[];
  initialFindings: Finding[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const [findings, setFindings] = useState(initialFindings);
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [form, setForm] = useState({
    principleIds: principles[0]?.id ? [principles[0].id] : ([] as string[]),
    screen: "",
    task: "",
    step: "",
    descriptionHtml: "",
    severity: "MAJOR" as Severity,
    scope: "ISOLATED" as Finding["scope"],
    solutionHtml: "",
    riskAssessment: "",
  });

  function addPendingFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingAttachments((current) => [...current, ...next]);
  }

  function removePendingAttachment(id: string) {
    setPendingAttachments((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((entry) => entry.id !== id);
    });
  }

  function togglePrinciple(principleId: string) {
    setForm((current) => {
      const selected = current.principleIds.includes(principleId)
        ? current.principleIds.filter((id) => id !== principleId)
        : [...current.principleIds, principleId];
      return { ...current, principleIds: selected };
    });
  }

  function resetForm() {
    pendingAttachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingAttachments([]);
    setEditingFindingId(null);
    setForm({
      principleIds: principles[0]?.id ? [principles[0].id] : [],
      screen: "",
      task: "",
      step: "",
      descriptionHtml: "",
      severity: "MAJOR",
      scope: "ISOLATED",
      solutionHtml: "",
      riskAssessment: "",
    });
  }

  function startEdit(finding: Finding) {
    pendingAttachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingAttachments([]);
    setEditingFindingId(finding.id);
    setForm({
      principleIds: finding.principles.map((link) => link.principleId),
      screen: finding.screen,
      task: finding.task,
      step: finding.step,
      descriptionHtml: finding.descriptionHtml,
      severity: finding.severity,
      scope: finding.scope,
      solutionHtml: finding.solutionHtml ?? "",
      riskAssessment: finding.riskAssessment ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadEvidence(findingId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/findings/${findingId}/evidence`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("No se pudo subir el archivo");
    }
    return response.json() as Promise<Evidence>;
  }

  async function submitFinding() {
    setSubmitting(true);
    try {
      const isEditing = Boolean(editingFindingId);
      const response = await fetch(
        isEditing
          ? `/api/findings/${editingFindingId}`
          : `/api/projects/${projectId}/evaluators/${evaluatorId}/findings`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] } }
          | null;
        let message = isEditing ? "No se pudo actualizar el hallazgo" : "No se pudo guardar el hallazgo";
        if (typeof payload?.error === "string") {
          message = payload.error;
        } else if (payload?.error && typeof payload.error === "object") {
          const fieldErrors = payload.error.fieldErrors ?? {};
          const firstFieldError = Object.values(fieldErrors).flat()[0];
          const formError = payload.error.formErrors?.[0];
          message = firstFieldError ?? formError ?? message;
        }
        notify("error", message);
        return;
      }

      const finding = (await response.json()) as Finding;
      const uploadedEvidence: Evidence[] = [];

      for (const attachment of pendingAttachments) {
        const evidence = await uploadEvidence(finding.id, attachment.file);
        uploadedEvidence.push(evidence);
      }

      const updatedFinding = {
        ...finding,
        consolidatedFindingId:
          findings.find((item) => item.id === finding.id)?.consolidatedFindingId ?? null,
        evidence: isEditing
          ? [...(findings.find((item) => item.id === finding.id)?.evidence ?? finding.evidence), ...uploadedEvidence]
          : uploadedEvidence,
      };

      if (isEditing) {
        setFindings((current) =>
          current.map((item) => (item.id === finding.id ? updatedFinding : item)),
        );
      } else {
        setFindings((current) => [updatedFinding, ...current]);
      }

      resetForm();
      router.refresh();
    } catch {
      notify(
        "error",
        editingFindingId
          ? "Error al actualizar el hallazgo o subir evidencias"
          : "Error al guardar el hallazgo o subir evidencias",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadEvidenceToExisting(findingId: string, file: File) {
    setUploading(findingId);
    try {
      const evidence = await uploadEvidence(findingId, file);
      setFindings((current) =>
        current.map((finding) =>
          finding.id === findingId ? { ...finding, evidence: [...finding.evidence, evidence] } : finding,
        ),
      );
    } catch {
      notify("error", "No se pudo subir el archivo");
    } finally {
      setUploading(null);
    }
  }

  async function deleteFinding(id: string) {
    if (!(await confirm({ title: "¿Eliminar este hallazgo?", message: "Se borran también sus evidencias.", confirmLabel: "Eliminar", destructive: true }))) return;
    await fetch(`/api/findings/${id}`, { method: "DELETE" });
    setFindings((current) => current.filter((finding) => finding.id !== id));
    if (editingFindingId === id) {
      resetForm();
    }
  }

  const editingFinding = editingFindingId
    ? findings.find((finding) => finding.id === editingFindingId)
    : null;
  const isFormValid =
    form.screen && form.task && form.step && form.descriptionHtml && form.principleIds.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Inspección heurística</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-foreground">Registrar hallazgos</h1>
        <p className="mt-2 text-muted-foreground">Evaluador: {evaluatorName}</p>
      </div>

      <Card className={`border-border/80 shadow-sm ${editingFindingId ? "ring-2 ring-primary/30" : ""}`}>
        <CardHeader>
          <CardTitle>{editingFindingId ? "Editar hallazgo" : "Nuevo hallazgo"}</CardTitle>
          <CardDescription>
            {editingFindingId
              ? "Modifica los campos y guarda los cambios. También puedes adjuntar evidencias adicionales."
              : "Completa el contexto, adjunta evidencias y define severidad antes de guardar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {editingFinding?.consolidatedFindingId ? (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Este hallazgo ya fue consolidado. Los cambios aquí no actualizan automáticamente el registro
              consolidado.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pantalla</Label>
              <Input value={form.screen} onChange={(e) => setForm({ ...form, screen: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tarea</Label>
              <Input value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Paso exacto</Label>
              <Input value={form.step} onChange={(e) => setForm({ ...form, step: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Principios vulnerados</Label>
              <p className="text-xs text-muted-foreground">
                Selecciona uno o más principios heurísticos que este hallazgo incumple.
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {principles.map((principle) => (
                  <label
                    key={principle.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                      form.principleIds.includes(principle.id)
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.principleIds.includes(principle.id)}
                      onChange={() => togglePrinciple(principle.id)}
                      className="mt-0.5"
                    />
                    <span>{principle.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción del hallazgo</Label>
            <RichTextEditor
              value={form.descriptionHtml}
              onChange={(value) => setForm({ ...form, descriptionHtml: value })}
              placeholder="Describe la observación con el máximo detalle posible"
            />
          </div>

          <div className="space-y-3">
            <Label>Evidencia multimedia</Label>
            <div className="flex flex-wrap gap-3">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.id} className="relative rounded-lg border border-border bg-muted/30 p-2">
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(attachment.id)}
                    className="absolute top-1 right-1 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Quitar archivo"
                  >
                    <X className="size-3.5" />
                  </button>
                  {isVideoFile(attachment.file) ? (
                    <video src={attachment.previewUrl} controls className="max-h-36 rounded" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={attachment.previewUrl} alt={attachment.file.name} className="max-h-36 rounded" />
                  )}
                  <p className="mt-1 max-w-40 truncate text-xs text-muted-foreground">
                    {attachment.file.name} · {formatFileSize(attachment.file.size)}
                  </p>
                </div>
              ))}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40">
              <ImagePlus className="size-4" />
              Adjuntar imágenes o videos
              <input
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                multiple
                className="hidden"
                onChange={(event) => {
                  addPendingFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Severidad</Label>
              <div className="grid grid-cols-3 gap-2">
                {SEVERITY_OPTIONS.map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => setForm({ ...form, severity })}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium ${SEVERITY_COLORS[severity]} ${
                      form.severity === severity ? "ring-2 ring-primary ring-offset-2" : "opacity-85"
                    }`}
                  >
                    {SEVERITY_LABELS[severity]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alcance</Label>
              <Select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value as Finding["scope"] })}
              >
                <option value="ISOLATED">{SCOPE_LABELS.ISOLATED}</option>
                <option value="GENERALIZED">{SCOPE_LABELS.GENERALIZED}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Solución propuesta</Label>
            <RichTextEditor
              value={form.solutionHtml}
              onChange={(value) => setForm({ ...form, solutionHtml: value })}
              placeholder="Propón una mejora concreta"
            />
          </div>

          <div className="space-y-2">
            <Label>Evaluación de riesgos de implementación</Label>
            <Textarea
              value={form.riskAssessment}
              onChange={(e) => setForm({ ...form, riskAssessment: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={submitFinding} disabled={submitting || !isFormValid}>
              {submitting
                ? "Guardando..."
                : editingFindingId
                  ? "Guardar cambios"
                  : "Guardar hallazgo"}
            </Button>
            {editingFindingId ? (
              <Button variant="outline" onClick={resetForm} disabled={submitting}>
                Cancelar edición
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Hallazgos registrados ({findings.length})</h2>
        {findings.map((finding) => (
          <Card
            key={finding.id}
            className={`border-border/80 ${editingFindingId === finding.id ? "ring-2 ring-primary/40" : ""}`}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{getFindingPrincipleTitles(finding)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {finding.screen} · {finding.task} · {finding.step} · {SCOPE_LABELS[finding.scope]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={finding.severity} />
                {finding.consolidatedFindingId ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                    Consolidado
                  </span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingFindingId === finding.id ? (
                <p className="text-sm text-primary">Editando este hallazgo en el formulario superior.</p>
              ) : (
                <>
                  <RichTextViewer html={finding.descriptionHtml} />
                  {finding.solutionHtml && (
                    <div>
                      <p className="mb-2 text-sm font-semibold">Solución propuesta</p>
                      <RichTextViewer html={finding.solutionHtml} />
                    </div>
                  )}
                  {finding.riskAssessment && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Riesgos:</strong> {finding.riskAssessment}
                    </p>
                  )}
                </>
              )}

              {finding.evidence.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {finding.evidence.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-2">
                      {item.type === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/evidence/${item.storagePath}`}
                          alt={item.fileName}
                          className="max-h-40 rounded"
                        />
                      ) : (
                        <video src={`/api/evidence/${item.storagePath}`} controls className="max-h-40 rounded" />
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.fileName} · {formatFileSize(item.fileSize)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => startEdit(finding)}
                  disabled={Boolean(editingFindingId && editingFindingId !== finding.id)}
                >
                  <Pencil className="mr-2 size-4" />
                  Editar
                </Button>
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
                  {uploading === finding.id ? "Subiendo..." : "Agregar más evidencia"}
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadEvidenceToExisting(finding.id, file);
                    }}
                  />
                </label>
                <Button variant="destructive" onClick={() => deleteFinding(finding.id)}>
                  Eliminar hallazgo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
