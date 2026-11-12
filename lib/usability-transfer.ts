/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Traslado de un test de usabilidad entre equipos: participantes, sesiones, ejecuciones, marcadores, hallazgos con
 * sus capturas, problemas y evidencias, sin depender de los identificadores de la base de origen (se enlazan por
 * código de escenario, código de participante y título de principio).
 */

import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { EVIDENCE_ROOT, resolveEvidencePath, toRelativeStoragePath } from "@/lib/storage";

/** Imágenes de más de este tamaño no viajan dentro del JSON (se avisa en la importación). */
const MAX_EMBEDDED_BYTES = 8 * 1024 * 1024;

export type TransferFile = { fileName: string; mimeType: string; base64: string };

export type UsabilityTransfer = {
  version: 1;
  participants: Array<{
    code: string;
    profile: string | null;
    eligibilityConfirmed: boolean;
    isPilot: boolean;
    isReserve: boolean;
    consentSigned: boolean;
    recordingAuthorized: boolean;
    notes: string | null;
    session: null | {
      facilitatorName: string | null;
      sessionDate: string | null;
      notes: string | null;
      finalQuestionsNotes: string | null;
      phase: string;
      currentScenarioCode: string | null;
      startedAt: string | null;
      completedAt: string | null;
      recordingUrl: string | null;
      recordingNotes: string | null;
      runs: Array<{
        scenarioCode: string;
        outcome: string | null;
        falseCompletion: boolean;
        stoppedAtLimit: boolean;
        timeOnTaskSeconds: number | null;
        nonCriticalErrors: number;
        observationsHtml: string | null;
        satisfaction: number | null;
      }>;
      markers: Array<{ scenarioCode: string | null; offsetSeconds: number; label: string; notes: string | null }>;
      findings: Array<{
        scenarioCode: string | null;
        title: string;
        observation: string;
        recommendation: string | null;
        recordingOffsetSeconds: number | null;
        screenshot: TransferFile | null;
      }>;
    };
  }>;
  issues: Array<{
    title: string;
    descriptionHtml: string;
    errorType: string;
    impact: string;
    frequency: string;
    persistence: string;
    severity: string;
    recommendationHtml: string | null;
    principleTitles: string[];
    runRefs: Array<{ participantCode: string; scenarioCode: string }>;
    evidence: Array<TransferFile & { type: string }>;
  }>;
  skippedFiles: string[];
};

async function readFile(relativePath: string, fileName: string, mimeType: string, skipped: string[]): Promise<TransferFile | null> {
  try {
    const buffer = await fs.readFile(resolveEvidencePath(relativePath));
    if (buffer.length > MAX_EMBEDDED_BYTES) {
      skipped.push(`${fileName} (${Math.round(buffer.length / 1024 / 1024)} MB)`);
      return null;
    }
    return { fileName, mimeType, base64: buffer.toString("base64") };
  } catch {
    skipped.push(`${fileName} (archivo no encontrado)`);
    return null;
  }
}

const IMAGE_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

/** Representación portátil de lo registrado en un test de usabilidad. */
export async function buildUsabilityTransfer(projectId: string): Promise<UsabilityTransfer> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      scenarios: true,
      participants: {
        orderBy: { orderIndex: "asc" },
        include: {
          session: { include: { facilitator: true, runs: true, markers: { orderBy: { offsetSeconds: "asc" } }, findings: { orderBy: { orderIndex: "asc" } } } },
        },
      },
      issues: {
        orderBy: { orderIndex: "asc" },
        include: {
          principles: { include: { principle: { select: { title: true } } } },
          runs: { include: { run: { include: { scenario: { select: { code: true } }, session: { include: { participant: { select: { code: true } } } } } } } },
          evidence: true,
        },
      },
    },
  });
  const skipped: string[] = [];
  const scenarioCode = (id: string | null) => (id ? (project.scenarios.find((scenario) => scenario.id === id)?.code ?? null) : null);

  const participants: UsabilityTransfer["participants"] = [];
  for (const participant of project.participants) {
    const session = participant.session;
    const findings: NonNullable<UsabilityTransfer["participants"][number]["session"]>["findings"] = [];
    for (const finding of session?.findings ?? []) {
      const ext = finding.screenshotPath?.split(".").pop()?.toLowerCase() ?? "";
      findings.push({
        scenarioCode: scenarioCode(finding.scenarioId),
        title: finding.title,
        observation: finding.observation,
        recommendation: finding.recommendation,
        recordingOffsetSeconds: finding.recordingOffsetSeconds,
        screenshot: finding.screenshotPath
          ? await readFile(finding.screenshotPath, finding.screenshotName ?? "captura", IMAGE_MIME[ext] ?? "image/png", skipped)
          : null,
      });
    }
    participants.push({
      code: participant.code,
      profile: participant.profile,
      eligibilityConfirmed: participant.eligibilityConfirmed,
      isPilot: participant.isPilot,
      isReserve: participant.isReserve,
      consentSigned: participant.consentSigned,
      recordingAuthorized: participant.recordingAuthorized,
      notes: participant.notes,
      session: session
        ? {
            facilitatorName: session.facilitator?.name ?? null,
            sessionDate: session.sessionDate?.toISOString() ?? null,
            notes: session.notes,
            finalQuestionsNotes: session.finalQuestionsNotes,
            phase: session.phase,
            currentScenarioCode: scenarioCode(session.currentScenarioId),
            startedAt: session.startedAt?.toISOString() ?? null,
            completedAt: session.completedAt?.toISOString() ?? null,
            recordingUrl: session.recordingUrl,
            recordingNotes: session.recordingNotes,
            runs: session.runs.map((run) => ({
              scenarioCode: scenarioCode(run.scenarioId) ?? "",
              outcome: run.outcome,
              falseCompletion: run.falseCompletion,
              stoppedAtLimit: run.stoppedAtLimit,
              timeOnTaskSeconds: run.timeOnTaskSeconds,
              nonCriticalErrors: run.nonCriticalErrors,
              observationsHtml: run.observationsHtml,
              satisfaction: run.satisfaction,
            })),
            markers: session.markers.map((marker) => ({
              scenarioCode: scenarioCode(marker.scenarioId),
              offsetSeconds: marker.offsetSeconds,
              label: marker.label,
              notes: marker.notes,
            })),
            findings,
          }
        : null,
    });
  }

  const issues: UsabilityTransfer["issues"] = [];
  for (const issue of project.issues) {
    const evidence: UsabilityTransfer["issues"][number]["evidence"] = [];
    for (const item of issue.evidence) {
      if (item.type !== "IMAGE") {
        skipped.push(`${item.fileName} (vídeo: se guarda aparte)`);
        continue;
      }
      const file = await readFile(item.storagePath, item.fileName, item.mimeType, skipped);
      if (file) evidence.push({ ...file, type: item.type });
    }
    issues.push({
      title: issue.title,
      descriptionHtml: issue.descriptionHtml,
      errorType: issue.errorType,
      impact: issue.impact,
      frequency: issue.frequency,
      persistence: issue.persistence,
      severity: issue.severity,
      recommendationHtml: issue.recommendationHtml,
      principleTitles: issue.principles.map((link) => link.principle.title),
      runRefs: issue.runs.map((link) => ({ participantCode: link.run.session.participant.code, scenarioCode: link.run.scenario.code })),
      evidence,
    });
  }

  return { version: 1, participants, issues, skippedFiles: skipped };
}

async function writeEmbedded(dir: string, file: TransferFile, prefix: string): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${prefix}-${Date.now()}-${file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const absolutePath = path.join(dir, safeName);
  await fs.writeFile(absolutePath, Buffer.from(file.base64, "base64"));
  return toRelativeStoragePath(absolutePath);
}

/**
 * Restaura participantes, sesiones y problemas en un proyecto de usabilidad ya creado (con sus escenarios).
 * Devuelve cuántos elementos se importaron.
 */
export async function importUsabilityTransfer(projectId: string, transfer: UsabilityTransfer) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      scenarios: true,
      evaluators: true,
      heuristicSet: { include: { principles: true } },
    },
  });
  const scenarioId = (code: string | null) => (code ? (project.scenarios.find((scenario) => scenario.code === code)?.id ?? null) : null);
  const runIdByKey = new Map<string, string>();
  const counts = { participants: 0, runs: 0, markers: 0, findings: 0, issues: 0, files: 0 };

  for (const [index, source] of transfer.participants.entries()) {
    const participant = await prisma.participant.create({
      data: {
        projectId,
        orderIndex: index,
        code: source.code,
        profile: source.profile,
        eligibilityConfirmed: source.eligibilityConfirmed,
        isPilot: source.isPilot,
        isReserve: source.isReserve,
        consentSigned: source.consentSigned,
        recordingAuthorized: source.recordingAuthorized,
        notes: source.notes,
      },
    });
    counts.participants += 1;
    const sourceSession = source.session;
    if (!sourceSession) continue;

    const facilitator = sourceSession.facilitatorName
      ? project.evaluators.find((evaluator) => evaluator.name === sourceSession.facilitatorName)
      : undefined;
    const session = await prisma.testSession.create({
      data: {
        participantId: participant.id,
        facilitatorId: facilitator?.id ?? null,
        sessionDate: sourceSession.sessionDate ? new Date(sourceSession.sessionDate) : null,
        notes: sourceSession.notes,
        finalQuestionsNotes: sourceSession.finalQuestionsNotes,
        phase: sourceSession.phase as "NOT_STARTED" | "WELCOME" | "SCENARIO" | "BETWEEN" | "FINISHED",
        currentScenarioId: scenarioId(sourceSession.currentScenarioCode),
        startedAt: sourceSession.startedAt ? new Date(sourceSession.startedAt) : null,
        completedAt: sourceSession.completedAt ? new Date(sourceSession.completedAt) : null,
        recordingUrl: sourceSession.recordingUrl,
        recordingNotes: sourceSession.recordingNotes,
      },
    });

    for (const run of sourceSession.runs) {
      const id = scenarioId(run.scenarioCode);
      if (!id) continue;
      const created = await prisma.taskRun.create({
        data: {
          sessionId: session.id,
          scenarioId: id,
          outcome: run.outcome as "COMPLETED" | "NOT_COMPLETED" | null,
          falseCompletion: run.falseCompletion,
          stoppedAtLimit: run.stoppedAtLimit,
          timeOnTaskSeconds: run.timeOnTaskSeconds,
          nonCriticalErrors: run.nonCriticalErrors,
          observationsHtml: run.observationsHtml,
          satisfaction: run.satisfaction,
        },
      });
      runIdByKey.set(`${source.code}|${run.scenarioCode}`, created.id);
      counts.runs += 1;
    }

    for (const [order, marker] of sourceSession.markers.entries()) {
      await prisma.sessionMarker.create({
        data: {
          sessionId: session.id,
          scenarioId: scenarioId(marker.scenarioCode),
          orderIndex: order,
          offsetSeconds: marker.offsetSeconds,
          label: marker.label,
          notes: marker.notes,
        },
      });
      counts.markers += 1;
    }

    for (const [order, finding] of sourceSession.findings.entries()) {
      let screenshotPath: string | null = null;
      if (finding.screenshot) {
        screenshotPath = await writeEmbedded(path.join(EVIDENCE_ROOT, projectId, `sesion-${session.id}`), finding.screenshot, `h${order}`);
        counts.files += 1;
      }
      await prisma.sessionFinding.create({
        data: {
          sessionId: session.id,
          scenarioId: scenarioId(finding.scenarioCode),
          orderIndex: order,
          title: finding.title,
          observation: finding.observation,
          recommendation: finding.recommendation,
          recordingOffsetSeconds: finding.recordingOffsetSeconds,
          screenshotPath,
          screenshotName: finding.screenshot?.fileName ?? null,
        },
      });
      counts.findings += 1;
    }
  }

  for (const [index, source] of transfer.issues.entries()) {
    const principleIds = source.principleTitles
      .map((title) => project.heuristicSet.principles.find((principle) => principle.title === title)?.id)
      .filter((id): id is string => !!id);
    const issue = await prisma.usabilityIssue.create({
      data: {
        projectId,
        orderIndex: index,
        title: source.title,
        descriptionHtml: source.descriptionHtml,
        errorType: source.errorType as "CRITICAL" | "NON_CRITICAL",
        impact: source.impact as "LOW" | "MEDIUM" | "HIGH",
        frequency: source.frequency as "LOW" | "MEDIUM" | "HIGH",
        persistence: source.persistence as "LOW" | "MEDIUM" | "HIGH",
        severity: source.severity as "VERY_MILD" | "MILD" | "SEVERE",
        recommendationHtml: source.recommendationHtml,
        principles: { create: principleIds.map((principleId) => ({ principleId })) },
        runs: {
          create: source.runRefs
            .map((ref) => runIdByKey.get(`${ref.participantCode}|${ref.scenarioCode}`))
            .filter((id): id is string => !!id)
            .map((runId) => ({ runId })),
        },
      },
    });
    counts.issues += 1;
    for (const file of source.evidence) {
      const storagePath = await writeEmbedded(path.join(EVIDENCE_ROOT, projectId, issue.id), file, "ev");
      await prisma.issueEvidence.create({
        data: {
          issueId: issue.id,
          type: "IMAGE",
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSize: Buffer.from(file.base64, "base64").length,
          storagePath,
        },
      });
      counts.files += 1;
    }
  }

  return counts;
}
