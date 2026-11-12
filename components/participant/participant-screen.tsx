/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import { useEffect, useState } from "react";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import type { ParticipantPresentation } from "@/lib/participant-screen";

const POLL_MS = 1500;

/**
 * Pantalla del participante: es la ventana que se comparte en la videollamada. No muestra menús, tiempos ni datos
 * del facilitador; solo lo que este decide mostrar. Consulta el estado cada pocos segundos.
 */
export function ParticipantScreen({ token }: { token: string }) {
  const [presentation, setPresentation] = useState<ParticipantPresentation | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/presentation/${token}`, { cache: "no-store" });
        if (cancelled) return;
        if (response.status === 404) {
          setInvalid(true);
          return;
        }
        if (response.ok) {
          setInvalid(false);
          setPresentation(await response.json());
        }
      } catch {
        // Sin conexión un momento: se reintenta en el siguiente ciclo, sin mostrar errores al participante.
      }
    }
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token]);

  if (invalid) {
    return (
      <Canvas>
        <p className="text-center text-lg text-muted-foreground">Este enlace no es válido. Pide uno nuevo a quien conduce la prueba.</p>
      </Canvas>
    );
  }
  if (!presentation) {
    return (
      <Canvas>
        <div className="size-2 animate-pulse rounded-full bg-primary/40" aria-label="Cargando" role="status" />
      </Canvas>
    );
  }

  const { state } = presentation;
  return (
    <Canvas product={presentation.productName}>
      {state === "idle" && (
        <Message title="En un momento comenzamos" text="Gracias por acompañarnos. Quien conduce la prueba te indicará cuándo empezar." />
      )}
      {state === "welcome" && presentation.welcome && (
        <div key="welcome" className="animate-in fade-in w-full max-w-3xl">
          <h1 className="font-display text-balance text-4xl font-semibold tracking-tight">{presentation.welcome.title}</h1>
          <RichTextViewer html={presentation.welcome.html} className="mt-8 [&_li]:my-4 [&_li]:!text-xl [&_li]:!leading-relaxed [&_p]:!text-xl [&_p]:!leading-relaxed [&_ul]:pl-2" />
        </div>
      )}
      {state === "scenario" && presentation.scenario && (
        <div key={presentation.scenario.position} className="animate-in fade-in w-full max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">{presentation.scenario.label}</p>
          <p className="mt-8 whitespace-pre-line text-balance text-2xl leading-relaxed text-foreground md:text-3xl md:leading-relaxed">
            {presentation.scenario.card}
          </p>
        </div>
      )}
      {state === "between" && (
        <Message title="Un momento, por favor" text="Estamos registrando lo ocurrido. Enseguida continuamos." />
      )}
      {state === "finished" && <Message title="¡Gracias!" text={presentation.closing ?? ""} />}
    </Canvas>
  );
}

function Canvas({ children, product }: { children: React.ReactNode; product?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-8 py-16">
      {product && (
        <p className="absolute left-8 top-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{product}</p>
      )}
      {children}
    </main>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="animate-in fade-in max-w-2xl text-center">
      <h1 className="font-display text-balance text-4xl font-semibold tracking-tight">{title}</h1>
      {text && <p className="mt-6 text-balance text-xl leading-relaxed text-muted-foreground">{text}</p>}
    </div>
  );
}
