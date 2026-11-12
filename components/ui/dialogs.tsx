/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Confirmaciones y avisos dentro de la página. Sustituyen a `confirm()` y `alert()` del navegador, que los navegadores
 * integrados (y algunos ajustes) bloquean sin avisar: `confirm()` devolvía «no» al instante y el botón parecía no hacer nada.
 */

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Acción destructiva: el botón de confirmar va en rojo. */
  destructive?: boolean;
};

type Notice = { id: number; tone: "ok" | "error" | "info"; text: string };

type DialogsApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (tone: Notice["tone"], text: string) => void;
};

const DialogsContext = React.createContext<DialogsApi | null>(null);

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const nextId = React.useRef(1);
  const confirmButton = React.useRef<HTMLButtonElement>(null);

  const confirm = React.useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const notify = React.useCallback((tone: Notice["tone"], text: string) => {
    const id = nextId.current++;
    setNotices((current) => [...current, { id, tone, text }]);
    setTimeout(() => setNotices((current) => current.filter((item) => item.id !== id)), tone === "error" ? 9000 : 5000);
  }, []);

  function answer(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  React.useEffect(() => {
    if (!pending) return;
    confirmButton.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        pending?.resolve(false);
        setPending(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  const api = React.useMemo(() => ({ confirm, notify }), [confirm, notify]);

  return (
    <DialogsContext.Provider value={api}>
      {children}

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => answer(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialogs-title"
            aria-describedby={pending.message ? "dialogs-message" : undefined}
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="dialogs-title" className="font-display text-lg font-semibold">
              {pending.title}
            </h2>
            {pending.message && (
              <p id="dialogs-message" className="mt-2 text-sm text-muted-foreground">
                {pending.message}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => answer(false)}>
                Cancelar
              </Button>
              <Button ref={confirmButton} variant={pending.destructive ? "destructive" : "default"} onClick={() => answer(true)}>
                {pending.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {notices.map((item) => (
          <p
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg",
              item.tone === "ok" && "border-emerald-300 bg-emerald-50 text-emerald-900",
              item.tone === "error" && "border-red-300 bg-red-50 text-red-900",
              item.tone === "info" && "border-border bg-background text-foreground",
            )}
          >
            {item.text}
          </p>
        ))}
      </div>
    </DialogsContext.Provider>
  );
}

function useDialogs(): DialogsApi {
  const context = React.useContext(DialogsContext);
  if (!context) throw new Error("Falta DialogsProvider en el layout");
  return context;
}

/** `const confirm = useConfirm(); if (!(await confirm({ title: "¿Eliminar?", destructive: true }))) return;` */
export function useConfirm() {
  return useDialogs().confirm;
}

/** `const notify = useNotify(); notify("error", "No se pudo guardar.");` */
export function useNotify() {
  return useDialogs().notify;
}
