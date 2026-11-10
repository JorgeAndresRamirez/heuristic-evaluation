/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { ProjectsDashboard } from "@/components/evaluation/projects-dashboard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const [projects, configs] = await Promise.all([
    prisma.project.findMany({
      include: {
        heuristicSet: { select: { name: true } },
        _count: {
          select: { evaluators: true, findings: true, participants: true, scenarios: true, issues: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.evaluationConfig.findMany({
      include: { heuristicSet: { select: { id: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProjectsDashboard
      initialProjects={JSON.parse(
        JSON.stringify(
          projects.map((project) => ({
            ...project,
            updatedAtLabel: formatDate(project.updatedAt),
          })),
        ),
      )}
      configs={configs.map((config) => ({
        id: config.id,
        name: config.name,
        heuristicSetId: config.heuristicSet.id,
      }))}
    />
  );
}
