/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import * as React from "react";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

/** Aviso con rol accesible: el color nunca va solo, lleva siempre un rótulo de texto. */
export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "error" | "ok";
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-sky-300 bg-sky-50 text-sky-950",
    warning: "border-amber-300 bg-amber-50 text-amber-950",
    error: "border-red-300 bg-red-50 text-red-950",
    ok: "border-emerald-300 bg-emerald-50 text-emerald-950",
  }[tone];
  const label = { info: "Nota", warning: "Atención", error: "Corregir", ok: "Correcto" }[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "note"}
      className={cn("rounded-lg border px-4 py-3 text-sm leading-relaxed", styles, className)}
    >
      <p className="font-semibold">
        {label}
        {title ? ` · ${title}` : ""}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(done, total)}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {Math.min(done, total)} de {total}
      </p>
    </div>
  );
}
