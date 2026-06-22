/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { HeuristicsManager } from "@/components/heuristics/heuristics-manager";
import { prisma } from "@/lib/prisma";

export default async function HeuristicsPage() {
  const sets = await prisma.heuristicSet.findMany({
    include: { _count: { select: { principles: true, projects: true } } },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return <HeuristicsManager initialSets={JSON.parse(JSON.stringify(sets))} />;
}
