/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { ConfigsManager } from "@/components/heuristics/configs-manager";
import { prisma } from "@/lib/prisma";

export default async function ConfigsPage() {
  const [configs, sets] = await Promise.all([
    prisma.evaluationConfig.findMany({
      include: {
        heuristicSet: { select: { id: true, name: true } },
        _count: { select: { projects: true } },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.heuristicSet.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <ConfigsManager
      initialConfigs={JSON.parse(JSON.stringify(configs))}
      sets={sets}
    />
  );
}
