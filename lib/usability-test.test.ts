/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Pruebas de la lógica del test de usabilidad. Se ejecutan con `npm test` (node:test + tsx).
 * Los casos de escenarios reproducen los ejemplos «mal» y «bien» del Tema 3 del Máster (ICU).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeScenarioCard,
  buildScenarioMetrics,
  eligibilityWarnings,
  formatSeconds,
  participantGuidance,
  planCompleteness,
  scenarioCountGuidance,
  suggestIssueSeverity,
  type RunMetricInput,
} from "./usability-test";

const codes = (card: string) => analyzeScenarioCard(card).map((issue) => issue.code);

describe("analyzeScenarioCard", () => {
  it("acepta el escenario «bien planteado» del Máster (narrativo, con contexto y sin pasos)", () => {
    const bien =
      "Has recibido una notificación de multa con el número que ves en esta tarjeta. La comunicación indica que puedes pagar online con un descuento a través de la web de tributos del Ayuntamiento. Como quieres beneficiarte de la rebaja, decides acceder a la aplicación con los datos de la multa y proceder a pagarla.";
    assert.deepEqual(codes(bien), []);
  });

  it("marca como dirigido el escenario «mal» del Máster (explica pasos y apartados)", () => {
    const mal =
      "Has recibido una notificación de multa. Accedes a la aplicación y, en el apartado «multas», buscas la opción «pagar multa». Después, haz clic en el tipo de multa (tráfico) y a continuación pulsa el botón de pago.";
    assert.ok(codes(mal).includes("directed"));
  });

  it("no permite la palabra «tarea» de cara al participante", () => {
    assert.ok(codes("Tu tarea es registrar el mantenimiento de un equipo que acabas de revisar en el laboratorio.").includes("uses-task-word"));
  });

  it("no permite informar del tiempo límite", () => {
    assert.ok(
      codes("Necesitas registrar un mantenimiento hoy. Tienes 5 minutos para hacerlo porque el laboratorio cierra pronto y debes entregar el equipo.").includes("mentions-time"),
    );
  });

  it("avisa de una tarjeta demasiado breve", () => {
    assert.ok(codes("Registra un mantenimiento.").includes("too-short"));
  });

  it("reconoce la segunda persona con tilde («tú», «estás»)", () => {
    const text =
      "Estás encargado de un laboratorio de biología y acaba de llegar un equipo nuevo para tu bloque. Necesitas saber cada cuánto debe recibir mantenimiento para organizar a tu equipo de trabajo durante el semestre.";
    assert.ok(!codes(text).includes("not-narrative"));
  });
});

describe("eligibilityWarnings", () => {
  it("advierte de criterios sociodemográficos y de la falta de relación usuario–sistema", () => {
    const warnings = eligibilityWarnings("Mujeres y hombres de entre 25 y 40 años de edad");
    assert.equal(warnings.length, 2);
  });

  it("no advierte cuando el criterio es la relación con el sistema", () => {
    assert.deepEqual(
      eligibilityWarnings("Personas que registran mantenimientos de equipos de laboratorio al menos una vez por semana"),
      [],
    );
  });
});

describe("suggestIssueSeverity", () => {
  it("un error crítico siempre es grave", () => {
    assert.equal(suggestIssueSeverity("CRITICAL", "LOW", "LOW", "LOW"), "SEVERE");
  });
  it("un error no crítico se gradúa por impacto, frecuencia y persistencia", () => {
    assert.equal(suggestIssueSeverity("NON_CRITICAL", "LOW", "LOW", "LOW"), "VERY_MILD");
    assert.equal(suggestIssueSeverity("NON_CRITICAL", "MEDIUM", "MEDIUM", "LOW"), "MILD");
    assert.equal(suggestIssueSeverity("NON_CRITICAL", "HIGH", "HIGH", "MEDIUM"), "SEVERE");
  });
});

const run = (overrides: Partial<RunMetricInput>): RunMetricInput => ({
  participantId: "p",
  outcome: "COMPLETED",
  falseCompletion: false,
  stoppedAtLimit: false,
  timeOnTaskSeconds: 60,
  nonCriticalErrors: 0,
  satisfaction: null,
  ...overrides,
});

describe("buildScenarioMetrics", () => {
  it("calcula efectividad, eficiencia y errores de un escenario", () => {
    const metrics = buildScenarioMetrics(
      [
        run({ participantId: "1", timeOnTaskSeconds: 60, satisfaction: 8 }),
        run({ participantId: "2", timeOnTaskSeconds: 400, nonCriticalErrors: 2, satisfaction: 6 }),
        run({ participantId: "3", outcome: "NOT_COMPLETED", falseCompletion: true, timeOnTaskSeconds: 300, satisfaction: 3 }),
        run({ participantId: "4", outcome: null, timeOnTaskSeconds: null }),
      ],
      5,
    );
    assert.equal(metrics.attempted, 3);
    assert.equal(metrics.completed, 2);
    assert.equal(metrics.completionRate, 67);
    assert.equal(metrics.criticalErrors, 1);
    assert.equal(metrics.falseCompletions, 1);
    assert.equal(metrics.nonCriticalErrors, 2);
    assert.equal(metrics.timeMean, 230);
    assert.equal(metrics.timeMedian, 230);
    assert.equal(metrics.overLimit, 1); // 400 s > 5 min
    assert.equal(metrics.satisfactionMean, 5.7);
  });

  it("devuelve nulos si no hay ejecuciones registradas", () => {
    const metrics = buildScenarioMetrics([run({ outcome: null })], 5);
    assert.equal(metrics.completionRate, null);
    assert.equal(metrics.timeMean, null);
  });
});

describe("participantGuidance", () => {
  it("recomienda 5 a 15 participantes", () => {
    assert.equal(participantGuidance(5).level, "ok");
    assert.equal(participantGuidance(1).level, "warning");
    assert.equal(participantGuidance(3).level, "info");
    assert.equal(participantGuidance(16).level, "info");
  });
});

describe("planCompleteness y escenarios", () => {
  it("lista lo que falta del plan y cuenta los escenarios y la duración", () => {
    const empty = planCompleteness(null, 0);
    assert.equal(empty.filled, 0);
    assert.ok(empty.missing.some((item) => item.key === "scenarios"));
    const partial = planCompleteness({ responsibles: "Equipo UX", totalDurationMinutes: 45 }, 3);
    assert.equal(partial.filled, 3);
    assert.equal(partial.byPhase.briefing.filled, 1);
  });

  it("avisa si hay más de seis escenarios", () => {
    assert.equal(scenarioCountGuidance(6), null);
    assert.equal(scenarioCountGuidance(7)?.level, "warning");
  });
});

describe("formatSeconds", () => {
  it("formatea mm:ss", () => {
    assert.equal(formatSeconds(75), "1:15");
    assert.equal(formatSeconds(null), "—");
  });
});
