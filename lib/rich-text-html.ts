/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li"];
const ALLOWED_ATTR: string[] = [];

export function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text.trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function looksLikeMarkdown(text: string): boolean {
  return /(\*\*.+?\*\*|\*.+?\*|__.+?__|_.+?_|\+.+?\+)/.test(text);
}

function markdownLineToHtml(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function plainTextToHtml(
  text: string,
  variant: "list" | "prose" | "inline",
): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (isHtmlContent(trimmed)) return trimmed;

  const lines = trimmed.split(/\n+/).filter(Boolean);

  if (looksLikeMarkdown(trimmed)) {
    if (variant === "list") {
      return `<ul>${lines.map((line) => `<li>${markdownLineToHtml(line)}</li>`).join("")}</ul>`;
    }
    return lines.map((line) => `<p>${markdownLineToHtml(line)}</p>`).join("");
  }

  if (variant === "inline") {
    return `<p>${escapeHtml(lines.join(" "))}</p>`;
  }

  if (variant === "list") {
    return `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
  }

  if (lines.length === 1) {
    return `<p>${escapeHtml(lines[0])}</p>`;
  }

  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function prepareDisplayHtml(
  text: string,
  variant: "list" | "prose" | "inline",
): string {
  if (!text.trim()) return "";
  const html = isHtmlContent(text) ? text : plainTextToHtml(text, variant);
  return sanitizeRichHtml(html);
}

export function isEmptyEditorHtml(html: string): boolean {
  const sanitized = sanitizeRichHtml(html).trim();
  return !sanitized || sanitized === "<p></p>" || sanitized === "<p><br></p>";
}

export function normalizeEditorHtml(html: string): string {
  if (isEmptyEditorHtml(html)) return "";
  return sanitizeRichHtml(html);
}
