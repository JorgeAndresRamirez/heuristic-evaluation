/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import type { Prisma } from "@/lib/generated/prisma";

/** Todo lo que se necesita para mostrar un problema de usabilidad. */
export const issueInclude = {
  principles: { include: { principle: { select: { id: true, title: true } } } },
  runs: {
    include: {
      run: {
        include: {
          scenario: { select: { id: true, code: true, title: true } },
          session: { include: { participant: { select: { id: true, code: true } } } },
        },
      },
    },
  },
  evidence: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.UsabilityIssueInclude;
