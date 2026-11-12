/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Pruebas de la lógica del test de usabilidad. Se ejecutan con `npm test` (node:test + tsx).
 * Los casos de escenarios reproducen los ejemplos «mal» y «bien» del Tema 3 del Máster (ICU).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPresentation, phaseForAction } from "./participant-screen";
import { generatePresentationToken } from "./presentation-token";
import {
  analyzeScenarioCard,
  buildExecutiveKpis,
  buildScenarioMetrics,
  eligibilityWarnings,
  formatSeconds,
  parseTimecode,
  participantGuidance,
  planCompleteness,
  roleParticipantGuidance,
  scenarioCountGuidance,
  scenarioCountGuidanceByRole,
  scenarioRoles,
  scenariosForProfile,
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

describe("pruebas con varios roles", () => {
  const scenarios = [
    { code: "S1", role: "SoporteAdmin" },
    { code: "E1", role: "TecnicoOperativo" },
    { code: "E2", role: "TecnicoOperativo" },
    { code: "L1", role: "Laboratorista" },
  ];

  it("lista los roles sin repetir y en orden", () => {
    assert.deepEqual(scenarioRoles(scenarios), ["SoporteAdmin", "TecnicoOperativo", "Laboratorista"]);
  });

  it("muestra a cada participante solo los escenarios de su rol", () => {
    assert.deepEqual(scenariosForProfile(scenarios, "TecnicoOperativo").map((s) => s.code), ["E1", "E2"]);
  });

  it("si el perfil no coincide con ningún rol, no oculta escenarios", () => {
    assert.equal(scenariosForProfile(scenarios, "Tecnico").length, 4);
    assert.equal(scenariosForProfile(scenarios, null).length, 4);
    const noRoles: Array<{ code: string; role?: string | null }> = [{ code: "A" }, { code: "B" }];
    assert.equal(scenariosForProfile(noRoles, "Cualquiera").length, 2);
  });

  it("recomienda 5 participantes por rol y no 5 en total", () => {
    const roles = ["A", "B", "C"];
    assert.match(roleParticipantGuidance({}, roles).message, /5 participantes por rol \(15 en total\)/);
    assert.equal(roleParticipantGuidance({ A: 1, B: 5, C: 5 }, roles).level, "warning");
    assert.equal(roleParticipantGuidance({ A: 3, B: 5, C: 5 }, roles).level, "info");
    assert.equal(roleParticipantGuidance({ A: 5, B: 5, C: 6 }, roles).level, "ok");
  });

  it("mide el tope de escenarios por rol, no el total de la prueba", () => {
    assert.equal(scenarioCountGuidanceByRole(scenarios), null);
    const many = [...Array(9).keys()].map((i) => ({ role: "T", i })).concat([{ role: "S", i: 0 }]);
    assert.equal(scenarioCountGuidanceByRole(many)?.level, "info");
    assert.equal(scenarioCountGuidanceByRole(Array.from({ length: 8 }, () => ({ role: null })))?.level, "warning");
  });
});

describe("pantalla del participante", () => {
  const settings = { welcomeEnabled: true, welcomeTitle: null, welcomeHtml: null, closingMessage: null };
  const scenarios = [
    { id: "a", scenarioCard: "Tarjeta A" },
    { id: "b", scenarioCard: "Tarjeta B" },
  ];
  const base = { productName: "GOM", settings, scenarios, currentScenarioId: null };

  it("antes de empezar no muestra nada y usa bienvenida por defecto", () => {
    assert.equal(buildPresentation({ ...base, phase: "NOT_STARTED" }).state, "idle");
    const welcome = buildPresentation({ ...base, phase: "WELCOME" });
    assert.equal(welcome.state, "welcome");
    assert.equal(welcome.welcome?.title, "Antes de comenzar");
  });

  it("muestra solo la tarjeta y la posición del escenario en curso, sin datos internos", () => {
    const shown = buildPresentation({ ...base, phase: "SCENARIO", currentScenarioId: "b" });
    assert.equal(shown.state, "scenario");
    assert.deepEqual(shown.scenario, { label: "Situación 2 de 2", card: "Tarjeta B", position: 2, total: 2 });
    const text = JSON.stringify(shown).toLowerCase();
    assert.ok(!text.includes("tarea") && !text.includes("límite") && !text.includes("hito"));
  });

  it("si la bienvenida está desactivada o el escenario no existe, muestra la pausa", () => {
    assert.equal(buildPresentation({ ...base, settings: { ...settings, welcomeEnabled: false }, phase: "WELCOME" }).state, "between");
    assert.equal(buildPresentation({ ...base, phase: "SCENARIO", currentScenarioId: "zzz" }).state, "between");
  });

  it("al terminar muestra el cierre configurado o el de por defecto", () => {
    assert.match(buildPresentation({ ...base, phase: "FINISHED" }).closing ?? "", /Gracias/);
    const custom = buildPresentation({ ...base, settings: { ...settings, closingMessage: "Hasta pronto" }, phase: "FINISHED" });
    assert.equal(custom.closing, "Hasta pronto");
  });

  it("genera tokens largos y distintos, y la acción decide la fase", () => {
    const a = generatePresentationToken();
    assert.ok(a.length >= 20 && a !== generatePresentationToken());
    assert.equal(phaseForAction({ action: "scenario", scenarioId: "a" }), "SCENARIO");
    assert.equal(phaseForAction({ action: "open" }), null);
  });
});

describe("parseTimecode", () => {
  it("convierte m:ss, h:mm:ss y segundos sueltos", () => {
    assert.equal(parseTimecode("3:12"), 192);
    assert.equal(parseTimecode("1:02:03"), 3723);
    assert.equal(parseTimecode("45"), 45);
    assert.equal(parseTimecode(" 0:05 "), 5);
  });
  it("rechaza lo que no es un tiempo", () => {
    assert.equal(parseTimecode(""), null);
    assert.equal(parseTimecode("3:75"), null);
    assert.equal(parseTimecode("abc"), null);
  });
});

describe("buildExecutiveKpis", () => {
  const run = (over: Partial<RunMetricInput>): RunMetricInput => ({
    participantId: "p",
    outcome: "COMPLETED",
    falseCompletion: false,
    stoppedAtLimit: false,
    timeOnTaskSeconds: 60,
    nonCriticalErrors: 0,
    satisfaction: null,
    ...over,
  });

  it("separa el éxito limpio de lo logrado con tropiezos", () => {
    const kpis = buildExecutiveKpis([
      run({}),
      run({ nonCriticalErrors: 2 }),
      run({ outcome: "NOT_COMPLETED", timeOnTaskSeconds: null }),
      run({ outcome: "NOT_COMPLETED", falseCompletion: true, timeOnTaskSeconds: null }),
    ]);
    assert.equal(kpis.runs, 4);
    assert.equal(kpis.effectiveness, 50);
    assert.equal(kpis.cleanSuccess, 25);
    assert.equal(kpis.recoveryGap, 25);
    assert.equal(kpis.criticalRuns, 2);
    assert.equal(kpis.falseCompletions, 1);
  });

  it("sin ejecuciones no inventa cifras", () => {
    const kpis = buildExecutiveKpis([]);
    assert.equal(kpis.effectiveness, null);
    assert.equal(kpis.recoveryGap, null);
    assert.equal(kpis.medianTime, null);
  });
});
