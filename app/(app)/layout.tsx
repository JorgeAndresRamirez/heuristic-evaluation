/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { AppShell } from "@/components/layout/app-shell";
import { DialogsProvider } from "@/components/ui/dialogs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DialogsProvider>
      <AppShell>{children}</AppShell>
    </DialogsProvider>
  );
}
