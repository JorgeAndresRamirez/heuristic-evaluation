/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import type { Prisma } from "@/lib/generated/prisma";

export const findingPrinciplesInclude = {
  principles: {
    include: { principle: true },
    orderBy: { orderIndex: "asc" as const },
  },
} satisfies Prisma.FindingInclude;

export type FindingWithPrinciples = {
  principles: Array<{
    principleId?: string;
    orderIndex?: number;
    principle?: { id?: string; title: string };
  }>;
};

export function getFindingPrincipleIds(finding: FindingWithPrinciples): string[] {
  return finding.principles
    .map((link) => link.principleId)
    .filter((id): id is string => Boolean(id));
}

export function getFindingPrincipleTitles(finding: FindingWithPrinciples): string {
  return finding.principles
    .map((link) => link.principle?.title)
    .filter(Boolean)
    .join(" · ");
}

export function getPrimaryPrincipleTitle(finding: FindingWithPrinciples): string {
  return finding.principles[0]?.principle?.title ?? "";
}

export function buildFindingPrincipleCreates(principleIds: string[]) {
  return principleIds.map((principleId, orderIndex) => ({
    principleId,
    orderIndex,
  }));
}

export function resolveConsolidatedPrincipleId(
  findings: Array<FindingWithPrinciples & { id?: string }>,
): string {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    for (const link of finding.principles) {
      if (!link.principleId) continue;
      counts.set(link.principleId, (counts.get(link.principleId) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? findings[0]?.principles[0]?.principleId ?? "";
}

export function findingsShareAnyPrinciple(findings: FindingWithPrinciples[]): boolean {
  if (findings.length < 2) return true;

  const shared = new Set(getFindingPrincipleIds(findings[0]));
  for (const finding of findings.slice(1)) {
    if (finding.principles.some((link) => link.principleId && shared.has(link.principleId))) {
      return true;
    }
  }

  return false;
}
