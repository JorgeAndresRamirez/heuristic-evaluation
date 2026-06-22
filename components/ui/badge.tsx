/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import * as React from "react";
import { SEVERITY_LABELS } from "@/lib/constants";
import type { Severity } from "@/lib/generated/prisma";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "critical" | "major" | "minor";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        {
          default: "bg-primary text-primary-foreground",
          secondary: "bg-secondary text-secondary-foreground",
          outline: "border border-border text-foreground",
          critical: "bg-red-500 text-white",
          major: "bg-yellow-400 text-black",
          minor: "bg-green-500 text-white",
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map = {
    CRITICAL: { label: SEVERITY_LABELS.CRITICAL, variant: "critical" as const },
    MAJOR: { label: SEVERITY_LABELS.MAJOR, variant: "major" as const },
    MINOR: { label: SEVERITY_LABELS.MINOR, variant: "minor" as const },
  };
  const item = map[severity];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
