/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { EXPORT_FORMAT, EXPORT_VERSION } from "@/lib/constants";
import { findingPrinciplesInclude, getFindingPrincipleTitles } from "@/lib/finding-principles";
import { prisma } from "@/lib/prisma";

export async function exportEvaluationConfig(configId: string) {
  const config = await prisma.evaluationConfig.findUniqueOrThrow({
    where: { id: configId },
    include: {
      heuristicSet: {
        include: {
          principles: { orderBy: { orderIndex: "asc" } },
        },
      },
    },
  });

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    type: "evaluation-config",
    exportedAt: new Date().toISOString(),
    data: config,
  };
}

export async function exportHeuristicSet(setId: string) {
  const set = await prisma.heuristicSet.findUniqueOrThrow({
    where: { id: setId },
    include: {
      principles: { orderBy: { orderIndex: "asc" } },
    },
  });

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    type: "heuristic-set",
    exportedAt: new Date().toISOString(),
    data: set,
  };
}

export async function exportProject(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      evaluationConfig: true,
      heuristicSet: {
        include: { principles: { orderBy: { orderIndex: "asc" } } },
      },
      evaluators: { orderBy: { orderIndex: "asc" } },
      findings: {
        include: {
          evaluator: true,
          ...findingPrinciplesInclude,
          evidence: true,
        },
      },
      consolidatedFindings: {
        include: {
          principle: true,
          findings: true,
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    type: "project",
    exportedAt: new Date().toISOString(),
    data: project,
  };
}

export function findingsToCsv(
  findings: Array<{
    screen: string;
    task: string;
    step: string;
    severity: string;
    scope: string;
    descriptionHtml: string;
    evaluator: { name: string };
    principles: Array<{ principle: { title: string } }>;
  }>,
): string {
  const header = [
    "Evaluador",
    "Principios",
    "Pantalla",
    "Tarea",
    "Paso",
    "Severidad",
    "Alcance",
    "Descripcion",
  ];
  const rows = findings.map((f) => [
    f.evaluator.name,
    getFindingPrincipleTitles(f),
    f.screen,
    f.task,
    f.step,
    f.severity,
    f.scope,
    f.descriptionHtml.replace(/"/g, '""'),
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
}
