/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import type { Metadata } from "next";
import { ParticipantScreen } from "@/components/participant/participant-screen";

export const metadata: Metadata = {
  title: "Prueba de usabilidad",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ token: string }> };

/** Pantalla del participante: fuera del shell de la aplicación, sin menús ni datos del facilitador. */
export default async function ParticipantPage({ params }: Params) {
  const { token } = await params;
  return <ParticipantScreen token={token} />;
}
