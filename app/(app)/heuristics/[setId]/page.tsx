/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { notFound } from "next/navigation";
import { HeuristicSetDetail } from "@/components/heuristics/heuristic-set-detail";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ setId: string }> };

export default async function HeuristicSetPage({ params }: Params) {
  const { setId } = await params;
  const set = await prisma.heuristicSet.findUnique({
    where: { id: setId },
    include: { principles: { orderBy: { orderIndex: "asc" } } },
  });
  if (!set) notFound();

  return (
    <HeuristicSetDetail
      setId={set.id}
      setName={set.name}
      isSystem={set.isSystem}
      initialPrinciples={JSON.parse(JSON.stringify(set.principles))}
    />
  );
}
