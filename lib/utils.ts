/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  // Patrón fijo: evita mismatch de hidratación entre Node (SSR) y el navegador con Intl.
  return format(new Date(date), "dd/MM/yyyy, HH:mm", { locale: es });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Cabecera Content-Disposition segura para descargas con el nombre del proyecto o del evaluador.
 * Los encabezados HTTP solo admiten Latin-1: un guion largo («—») o una letra fuera de ese rango hacía fallar
 * la respuesta con error 500. Se envía un nombre ASCII y, además, el nombre real codificado (RFC 5987).
 */
export function attachmentHeader(name: string, extension: string): string {
  const ascii =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "archivo";
  return `attachment; filename="${ascii}.${extension}"; filename*=UTF-8''${encodeURIComponent(name)}.${extension}`;
}
