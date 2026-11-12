/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { buildPresentation } from "@/lib/participant-screen";
import { prisma } from "@/lib/prisma";
import { scenariosForProfile } from "@/lib/usability-test";

type Params = { params: Promise<{ token: string }> };

/**
 * Lo único que recibe la pantalla del participante: el estado, la bienvenida o la tarjeta del escenario en curso.
 * Nunca incluye el tiempo límite, el hito, el nombre interno ni los datos del facilitador.
 */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const participant = await prisma.participant.findUnique({
    where: { presentationToken: token },
    include: {
      session: { select: { phase: true, currentScenarioId: true } },
      project: {
        select: {
          productName: true,
          name: true,
          testPlan: { select: { welcomeEnabled: true, welcomeTitle: true, welcomeHtml: true, closingMessage: true } },
          scenarios: { orderBy: { orderIndex: "asc" }, select: { id: true, scenarioCard: true, role: true } },
        },
      },
    },
  });
  if (!participant) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const plan = participant.project.testPlan;
  const presentation = buildPresentation({
    productName: participant.project.productName || participant.project.name,
    settings: {
      welcomeEnabled: plan?.welcomeEnabled ?? true,
      welcomeTitle: plan?.welcomeTitle ?? null,
      welcomeHtml: plan?.welcomeHtml ?? null,
      closingMessage: plan?.closingMessage ?? null,
    },
    phase: participant.session?.phase ?? "NOT_STARTED",
    currentScenarioId: participant.session?.currentScenarioId ?? null,
    scenarios: scenariosForProfile(participant.project.scenarios, participant.profile),
  });
  return NextResponse.json(presentation, { headers: { "Cache-Control": "no-store" } });
}
