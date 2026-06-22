/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import type { Finding, Severity } from "@/lib/generated/prisma";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  CRITICAL: 3,
  MAJOR: 2,
  MINOR: 1,
};

export function severityWeight(severity: Severity): number {
  return SEVERITY_WEIGHT[severity];
}

export function suggestConsolidatedSeverity(findings: Pick<Finding, "severity">[]): Severity {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    MAJOR: 0,
    MINOR: 0,
  };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }
  if (counts.CRITICAL > 0) return "CRITICAL";
  if (counts.MAJOR >= Math.ceil(findings.length / 2)) return "MAJOR";
  return "MINOR";
}

export function groupFindingsByPrinciple<T extends { id: string; principles: Array<{ principleId: string }> }>(
  findings: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const finding of findings) {
    for (const link of finding.principles) {
      const current = groups.get(link.principleId) ?? [];
      if (!current.some((item) => item.id === finding.id)) {
        current.push(finding);
      }
      groups.set(link.principleId, current);
    }
  }
  return groups;
}

export function getTopCriticalFindings<
  T extends { id: string; title: string; finalSeverity: Severity; summaryHtml: string },
>(findings: T[], limit = 10): T[] {
  return [...findings]
    .sort((a, b) => severityWeight(b.finalSeverity) - severityWeight(a.finalSeverity))
    .slice(0, limit);
}
