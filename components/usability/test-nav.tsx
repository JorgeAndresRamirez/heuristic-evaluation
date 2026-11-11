/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROJECT_KIND_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const sections = [
  { href: "", label: "Resumen" },
  { href: "/plan", label: "Documento-guía" },
  { href: "/scenarios", label: "Escenarios" },
  { href: "/participants", label: "Participantes" },
  { href: "/issues", label: "Problemas" },
  { href: "/test-report", label: "Informe" },
];

export function TestNav({ projectId, projectName }: { projectId: string; projectName: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <div className="mb-8 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          {PROJECT_KIND_LABELS.USABILITY_TEST}
        </p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-foreground">{projectName}</h1>
      </div>
      <nav aria-label="Secciones del test de usabilidad" className="flex flex-wrap gap-1 border-b border-border">
        {sections.map((section) => {
          const href = `${base}${section.href}`;
          const active = section.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={section.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
