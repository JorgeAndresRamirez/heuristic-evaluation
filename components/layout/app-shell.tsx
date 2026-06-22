/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import Link from "next/link";
import { AUTHOR } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Proyectos" },
  { href: "/heuristics", label: "Heurísticas" },
  { href: "/configs", label: "Configuraciones" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-canvas flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              EH
            </div>
            <div>
              <Link href="/" className="font-display text-[15px] font-semibold text-foreground">
                Evaluación Heurística
              </Link>
              <p className="text-xs text-muted-foreground">Inspección · Consolidación · Reportes</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 animate-fade-up">{children}</main>
      <footer className="border-t border-border/80 bg-card/85 py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {AUTHOR.name} — {AUTHOR.title}
        </p>
      </footer>
    </div>
  );
}
