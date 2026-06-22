/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import type { Severity } from "@/lib/generated/prisma";
import { getPrimaryPrincipleTitle } from "@/lib/finding-principles";
import { severityWeight } from "@/lib/consolidation";
import { sanitizeRichHtml } from "@/lib/rich-text-html";

export function sortFindingsForReport<
  T extends {
    severity: Severity;
    principles: Array<{ principle: { title: string } }>;
    screen: string;
    task: string;
    step: string;
    createdAt?: Date | string;
  },
>(findings: T[]): T[] {
  return [...findings].sort((a, b) => {
    const bySeverity = severityWeight(b.severity) - severityWeight(a.severity);
    if (bySeverity !== 0) return bySeverity;

    const byPrinciple = getPrimaryPrincipleTitle(a).localeCompare(getPrimaryPrincipleTitle(b), "es");
    if (byPrinciple !== 0) return byPrinciple;

    const byScreen = a.screen.localeCompare(b.screen, "es");
    if (byScreen !== 0) return byScreen;

    const byTask = a.task.localeCompare(b.task, "es");
    if (byTask !== 0) return byTask;

    const byStep = a.step.localeCompare(b.step, "es");
    if (byStep !== 0) return byStep;

    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return 0;
  });
}

export function htmlToPlainText(html: string): string {
  return sanitizeRichHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
