/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeRichHtml } from "@/lib/rich-text-html";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

const schema = z.object({
  welcomeEnabled: z.boolean(),
  welcomeTitle: z.string().trim().max(120).optional().nullable(),
  welcomeHtml: z.string().optional().nullable(),
  closingMessage: z.string().trim().max(500).optional().nullable(),
});

/** Bienvenida y cierre de la pantalla del participante (parametrizables por proyecto). */
export async function PUT(request: Request, { params }: Params) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = {
    welcomeEnabled: parsed.data.welcomeEnabled,
    welcomeTitle: parsed.data.welcomeTitle?.trim() || null,
    welcomeHtml: parsed.data.welcomeHtml ? sanitizeRichHtml(parsed.data.welcomeHtml) : null,
    closingMessage: parsed.data.closingMessage?.trim() || null,
  };
  const plan = await prisma.testPlan.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });
  return NextResponse.json(plan);
}
