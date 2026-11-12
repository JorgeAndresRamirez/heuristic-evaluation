/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { randomBytes } from "node:crypto";

/** Token largo y no adivinable para el enlace de la pantalla del participante (solo servidor). */
export function generatePresentationToken(): string {
  return randomBytes(18).toString("base64url");
}
