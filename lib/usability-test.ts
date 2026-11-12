/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Lógica pura del módulo «Test de usabilidad». Sin dependencias de Prisma ni de Next para poder
 * probarla con `npm test`.
 *
 * Fundamento (material del Máster, UNIR):
 *  - Investigación centrada en el usuario, Tema 3 «El test de usabilidad» y Tema 1.7 «Cómo documentar
 *    la investigación con usuarios».
 *  - Experiencia de uso y usabilidad, Tema 6: ISO 9241-11 (efectividad, eficiencia y satisfacción).
 */

export type Level = "LOW" | "MEDIUM" | "HIGH";
export type IssueErrorType = "CRITICAL" | "NON_CRITICAL";
export type IssueSeverity = "VERY_MILD" | "MILD" | "SEVERE";
export type TaskOutcome = "COMPLETED" | "NOT_COMPLETED";

// ─── Escenarios (Tema 3: «Definición de tareas» y «Las tareas no deben ser dirigidas») ─────────────

export type ScenarioIssue = { level: "error" | "warning"; code: string; message: string };

const MIN_CARD_LENGTH = 140;

/** `\b` de JavaScript no reconoce letras con tilde («tú», «dirígete»): se usan límites Unicode. */
function hasWord(text: string, alternatives: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "iu").test(text);
}

/**
 * Revisa el texto que leerá el participante. No sustituye el criterio del investigador: marca lo que el
 * Máster identifica como errores graves de planteamiento (escenario dirigido, la palabra «tarea»,
 * informar del tiempo límite, falta de contexto).
 */
export function analyzeScenarioCard(card: string): ScenarioIssue[] {
  const text = card.trim();
  const issues: ScenarioIssue[] = [];

  if (hasWord(text, "tareas?")) {
    issues.push({
      level: "error",
      code: "uses-task-word",
      message:
        "No uses la palabra «tarea» con el participante: puede sentirse evaluado. Usa «escenario», «situación» o una narración.",
    });
  }

  const directed =
    "haz|haga|hagan|pulsa|pulse|presiona|presione|clic|clica|click|selecciona|seleccione|dirígete|dirigete|navega|navegue|abre el menú|abra el menú|ve a la|ve al|entra en el menú|en el menú|en el apartado|en la sección|en la pestaña|en el botón|el botón|pestaña";
  if (hasWord(text, directed)) {
    issues.push({
      level: "error",
      code: "directed",
      message:
        "Parece un escenario dirigido: describe la necesidad y el contexto, no los pasos ni los nombres de la interfaz. En la vida real nadie le explica al usuario cómo hacerlo.",
    });
  }

  if (hasWord(text, "minutos?|segundos?|tiempo límite|tiempo limite|dispones de|tienes \\d+")) {
    issues.push({
      level: "error",
      code: "mentions-time",
      message:
        "No informes al participante del tiempo límite: lo presionaría y lo distraería (sesgo). El límite es solo para el facilitador.",
    });
  }

  if (text.length > 0 && text.length < MIN_CARD_LENGTH) {
    issues.push({
      level: "warning",
      code: "too-short",
      message:
        "La tarjeta es muy breve. Un buen escenario cuenta quién eres, qué necesitas y por qué, y le da sentido a la meta.",
    });
  }

  if (text.length > 0 && !hasWord(text, "tú|tu|te|necesitas|quieres|decides|debes|acabas|has|tienes|estás|estas|buscas|recibes|recibiste")) {
    issues.push({
      level: "warning",
      code: "not-narrative",
      message: "Redáctala en segunda persona y en lenguaje del usuario («Necesitas…», «Decides…»).",
    });
  }

  return issues;
}

/** Palabras sociodemográficas que no deberían ser el criterio de elegibilidad principal (ICU Tema 3). */
export function eligibilityWarnings(criteria: string | null | undefined): string[] {
  const text = criteria ?? "";
  if (!text.trim()) return [];
  const warnings: string[] = [];
  if (hasWord(text, "edad|años de edad|género|genero|sexo|hombres?|mujeres?|estrato|ingresos|nivel socioecon\\p{L}*")) {
    warnings.push(
      "Hay criterios sociodemográficos. En UX el criterio principal es la relación usuario–sistema (qué hace la persona con el producto), no quién es. Úsalos solo como cuotas de diversidad.",
    );
  }
  if (!hasWord(text, "usa|usan|utiliza|utilizan|trabaja|trabajan|realiza|realizan|gestiona|gestionan|registra|registran|responsable|administra|administran")) {
    warnings.push(
      "No se ve una relación usuario–sistema explícita (por ejemplo «usa el sistema al menos una vez por semana para…»).",
    );
  }
  return warnings;
}

// ─── Gravedad (Tema 3: «Errores críticos» y «Errores no críticos») ─────────────────────────────────

const LEVEL_VALUE: Record<Level, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

/**
 * Sugerencia de gravedad con la escala corta del Máster (muy leve, leve, grave).
 * Un problema que impide completar el escenario es siempre «grave»; el resto se valora por impacto,
 * frecuencia y persistencia. Es una sugerencia: el investigador decide.
 */
export function suggestIssueSeverity(
  errorType: IssueErrorType,
  impact: Level,
  frequency: Level,
  persistence: Level,
): IssueSeverity {
  if (errorType === "CRITICAL") return "SEVERE";
  const score = LEVEL_VALUE[impact] + LEVEL_VALUE[frequency] + LEVEL_VALUE[persistence];
  if (score >= 7) return "SEVERE";
  if (score >= 5) return "MILD";
  return "VERY_MILD";
}

export function severityRank(severity: IssueSeverity): number {
  return { SEVERE: 3, MILD: 2, VERY_MILD: 1 }[severity];
}

// ─── Participantes (Tema 3: «¿Cuántos usuarios se necesitan para el test?») ───────────────────────

export type Guidance = { level: "ok" | "info" | "warning"; message: string };

/** `valid` = participantes reales con sesión registrada (sin piloto). */
export function participantGuidance(valid: number, distinctProfiles = 1): Guidance {
  const perProfile = distinctProfiles > 0 ? valid / distinctProfiles : valid;
  if (valid === 0) return { level: "info", message: "Aún no hay sesiones. Nielsen: 5 participantes por versión descubren cerca del 85 % de los problemas." };
  if (valid === 1)
    return {
      level: "warning",
      message: "Con un solo participante no se puede contrastar una conducta anómala. Un usuario revela ~31 % de los problemas.",
    };
  if (perProfile < 5 && valid < 5)
    return {
      level: "info",
      message:
        "Entre 2 y 4 participantes solo se justifica con recursos muy limitados (enfoque Lean). Lo recomendado es 5 por versión y por perfil de uso distinto.",
    };
  if (valid > 15)
    return { level: "info", message: "Más de 15 participantes no aporta valor: cada uno nuevo añade muy poco." };
  return { level: "ok", message: "Número de participantes dentro de lo recomendado (5 a 15)." };
}

// ─── Métricas por escenario (ISO 9241-11: efectividad, eficiencia, satisfacción) ──────────────────

export type RunMetricInput = {
  participantId: string;
  outcome: TaskOutcome | null;
  falseCompletion: boolean;
  stoppedAtLimit: boolean;
  timeOnTaskSeconds: number | null;
  nonCriticalErrors: number;
  satisfaction: number | null;
};

export type ScenarioMetrics = {
  attempted: number;
  completed: number;
  /** Efectividad: porcentaje de participantes que completan el escenario. */
  completionRate: number | null;
  criticalErrors: number;
  falseCompletions: number;
  stoppedAtLimit: number;
  nonCriticalErrors: number;
  /** Eficiencia: tiempo en tarea de quienes completan (segundos). */
  timeMean: number | null;
  timeMedian: number | null;
  timeMin: number | null;
  timeMax: number | null;
  overLimit: number;
  satisfactionValues: number[];
  satisfactionMean: number | null;
};

export function isCriticalRun(run: Pick<RunMetricInput, "outcome" | "falseCompletion">): boolean {
  return run.outcome === "NOT_COMPLETED" || run.falseCompletion;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildScenarioMetrics(runs: RunMetricInput[], timeLimitMinutes: number): ScenarioMetrics {
  const recorded = runs.filter((run) => run.outcome !== null);
  const completed = recorded.filter((run) => run.outcome === "COMPLETED");
  const times = completed
    .map((run) => run.timeOnTaskSeconds)
    .filter((value): value is number => typeof value === "number");
  const satisfaction = recorded
    .map((run) => run.satisfaction)
    .filter((value): value is number => typeof value === "number");
  const limitSeconds = timeLimitMinutes * 60;

  return {
    attempted: recorded.length,
    completed: completed.length,
    completionRate: recorded.length ? Math.round((completed.length / recorded.length) * 100) : null,
    criticalErrors: recorded.filter(isCriticalRun).length,
    falseCompletions: recorded.filter((run) => run.falseCompletion).length,
    stoppedAtLimit: recorded.filter((run) => run.stoppedAtLimit).length,
    nonCriticalErrors: recorded.reduce((sum, run) => sum + run.nonCriticalErrors, 0),
    timeMean: times.length ? round1(times.reduce((sum, value) => sum + value, 0) / times.length) : null,
    timeMedian: median(times),
    timeMin: times.length ? Math.min(...times) : null,
    timeMax: times.length ? Math.max(...times) : null,
    overLimit: times.filter((value) => value > limitSeconds).length,
    satisfactionValues: satisfaction,
    satisfactionMean: satisfaction.length
      ? round1(satisfaction.reduce((sum, value) => sum + value, 0) / satisfaction.length)
      : null,
  };
}

// ─── Indicadores para decidir (informe ejecutivo) ──────────────────────────────────────────────────

export type ExecutiveKpis = {
  /** Escenarios resueltos por todos los participantes reales (ejecuciones registradas). */
  runs: number;
  /** Efectividad: % de ejecuciones completadas (incluye las logradas tras un error no crítico). */
  effectiveness: number | null;
  /** % completado sin errores, sin falso final y sin llegar al límite: la experiencia fluida. */
  cleanSuccess: number | null;
  /** Efectividad − éxito limpio: cuánto se logró a costa de tropiezos. */
  recoveryGap: number | null;
  /** Ejecuciones con error crítico (no completadas o con falso final). */
  criticalRuns: number;
  falseCompletions: number;
  /** Mediana del tiempo en tarea de quienes completan (segundos). */
  medianTime: number | null;
};

function percent(part: number, total: number): number | null {
  return total ? Math.round((part / total) * 100) : null;
}

export function buildExecutiveKpis(runs: RunMetricInput[]): ExecutiveKpis {
  const recorded = runs.filter((run) => run.outcome !== null);
  const completed = recorded.filter((run) => run.outcome === "COMPLETED");
  const clean = completed.filter((run) => !run.falseCompletion && !run.stoppedAtLimit && run.nonCriticalErrors === 0);
  const effectiveness = percent(completed.length, recorded.length);
  const cleanSuccess = percent(clean.length, recorded.length);
  return {
    runs: recorded.length,
    effectiveness,
    cleanSuccess,
    recoveryGap: effectiveness !== null && cleanSuccess !== null ? effectiveness - cleanSuccess : null,
    criticalRuns: recorded.filter(isCriticalRun).length,
    falseCompletions: recorded.filter((run) => run.falseCompletion).length,
    medianTime: median(
      completed.map((run) => run.timeOnTaskSeconds).filter((value): value is number => typeof value === "number"),
    ),
  };
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/**
 * Convierte «m:ss», «mm:ss» o «h:mm:ss» (o solo segundos) a segundos. Devuelve null si el texto no es un tiempo válido.
 * Sirve para los marcadores sobre la grabación.
 */
export function parseTimecode(text: string): number | null {
  const value = text.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d{1,2}):)?(\d{1,3}):([0-5]\d)$/);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  return hours * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

// ─── Completitud del plan (Tema 3: «Planteamiento del test», mínimo a documentar) ─────────────────

export type PlanLike = {
  responsibles?: string | null;
  location?: string | null;
  plannedDates?: string | null;
  applicationSummary?: string | null;
  purpose?: string | null;
  plannedParticipants?: number | null;
  profiles?: string | null;
  eligibilityCriteria?: string | null;
  recruitmentProcedure?: string | null;
  totalDurationMinutes?: number | null;
  technicalMeans?: string | null;
  recordingSystems?: string | null;
  teamRoles?: string | null;
  severityCriteria?: string | null;
  satisfactionScale?: string | null;
  participantInstructions?: string | null;
  dataToCollect?: string | null;
  consentText?: string | null;
  legalReviewDone?: boolean | null;
  dataProtection?: string | null;
  dataRetention?: string | null;
  ethicsCode?: string | null;
};

const PLAN_REQUIREMENTS: Array<{ key: keyof PlanLike; label: string; phase: "briefing" | "planning" | "ethics" }> = [
  { key: "responsibles", label: "Responsables de la prueba", phase: "briefing" },
  { key: "applicationSummary", label: "Qué es la aplicación y para qué sirve", phase: "briefing" },
  { key: "purpose", label: "Propósito: qué se quiere descubrir", phase: "briefing" },
  { key: "location", label: "Ubicación o entorno de conducción", phase: "planning" },
  { key: "plannedDates", label: "Fechas", phase: "planning" },
  { key: "profiles", label: "Perfiles de usuario representados", phase: "planning" },
  { key: "eligibilityCriteria", label: "Criterios de elegibilidad", phase: "planning" },
  { key: "recruitmentProcedure", label: "Procedimiento de reclutamiento", phase: "planning" },
  { key: "technicalMeans", label: "Medios técnicos", phase: "planning" },
  { key: "recordingSystems", label: "Sistemas de registro (vídeo, pantalla, anotaciones)", phase: "planning" },
  { key: "teamRoles", label: "Roles del equipo (facilitador, observadores)", phase: "planning" },
  { key: "severityCriteria", label: "Criterios para valorar la gravedad de los problemas", phase: "planning" },
  { key: "satisfactionScale", label: "Sistema de valoración subjetiva (escala y su sentido)", phase: "planning" },
  { key: "participantInstructions", label: "Instrucciones que se darán al participante", phase: "planning" },
  { key: "dataToCollect", label: "Información cualitativa y cuantificada a presentar", phase: "planning" },
  { key: "consentText", label: "Consentimiento informado", phase: "ethics" },
  { key: "dataProtection", label: "Protección de datos", phase: "ethics" },
  { key: "dataRetention", label: "Conservación de los datos", phase: "ethics" },
  { key: "ethicsCode", label: "Código ético de los evaluadores", phase: "ethics" },
];

export type PlanCompleteness = {
  total: number;
  filled: number;
  missing: Array<{ key: string; label: string }>;
  byPhase: Record<"briefing" | "planning" | "ethics", { total: number; filled: number }>;
  legalReviewDone: boolean;
};

export function planCompleteness(plan: PlanLike | null | undefined, scenarioCount: number): PlanCompleteness {
  const data = plan ?? {};
  const byPhase = {
    briefing: { total: 0, filled: 0 },
    planning: { total: 0, filled: 0 },
    ethics: { total: 0, filled: 0 },
  };
  const missing: Array<{ key: string; label: string }> = [];
  let filled = 0;

  for (const requirement of PLAN_REQUIREMENTS) {
    const value = data[requirement.key];
    const ok = typeof value === "string" ? value.trim().length > 0 : Boolean(value);
    byPhase[requirement.phase].total += 1;
    if (ok) {
      byPhase[requirement.phase].filled += 1;
      filled += 1;
    } else {
      missing.push({ key: requirement.key, label: requirement.label });
    }
  }

  // Dos requisitos que no son campos de texto: escenarios (con tiempo límite) y duración total.
  byPhase.planning.total += 2;
  if (scenarioCount > 0) {
    byPhase.planning.filled += 1;
    filled += 1;
  } else {
    missing.push({ key: "scenarios", label: "Escenarios con su tiempo límite" });
  }
  if ((data.totalDurationMinutes ?? 0) > 0) {
    byPhase.planning.filled += 1;
    filled += 1;
  } else {
    missing.push({ key: "totalDurationMinutes", label: "Duración total de la prueba" });
  }

  return {
    total: PLAN_REQUIREMENTS.length + 2,
    filled,
    missing,
    byPhase,
    legalReviewDone: Boolean(data.legalReviewDone),
  };
}

/** Máximo recomendado de escenarios en una sesión (ICU Tema 3: «no más de seis»). */
export const MAX_RECOMMENDED_SCENARIOS = 6;

export function scenarioCountGuidance(count: number): Guidance | null {
  if (count > MAX_RECOMMENDED_SCENARIOS) {
    return {
      level: "warning",
      message: `Más de ${MAX_RECOMMENDED_SCENARIOS} escenarios agota al participante y suele repetir información. Considera dividir la prueba.`,
    };
  }
  return null;
}

// ─── Pruebas con varios roles (una hoja y unas tarjetas por rol) ───────────────────────────────────

type WithRole = { role?: string | null };

/** Roles distintos de los escenarios, en el orden en que aparecen. */
export function scenarioRoles(scenarios: WithRole[]): string[] {
  const roles: string[] = [];
  for (const scenario of scenarios) {
    const role = scenario.role?.trim();
    if (role && !roles.includes(role)) roles.push(role);
  }
  return roles;
}

/**
 * Escenarios que le corresponden a un participante según su perfil. Si la prueba no define roles, o el perfil no
 * coincide con ninguno, devuelve todos (así nunca se oculta un escenario por un perfil mal escrito).
 */
export function scenariosForProfile<T extends WithRole>(scenarios: T[], profile: string | null | undefined): T[] {
  const wanted = profile?.trim();
  if (!wanted || !scenarioRoles(scenarios).includes(wanted)) return scenarios;
  return scenarios.filter((scenario) => scenario.role?.trim() === wanted);
}

/** Recomendación de participantes cuando hay varios roles: 5 por rol (Nielsen), no 5 en total. */
export function roleParticipantGuidance(countsByRole: Record<string, number>, roles: string[]): Guidance {
  const total = roles.reduce((sum, role) => sum + (countsByRole[role] ?? 0), 0);
  const recommended = `Lo recomendado son 5 participantes por rol (${roles.length * 5} en total).`;
  if (total === 0) return { level: "info", message: `Aún no hay sesiones. ${recommended}` };
  const detail = roles.map((role) => `${role}: ${countsByRole[role] ?? 0}`).join(" · ");
  if (roles.some((role) => countsByRole[role] === 1)) {
    return {
      level: "warning",
      message: `Por rol, ${detail}. Con un solo participante no se puede contrastar una conducta anómala. ${recommended}`,
    };
  }
  if (roles.some((role) => (countsByRole[role] ?? 0) < 5)) {
    return {
      level: "info",
      message: `Por rol, ${detail}. ${recommended} Entre 2 y 4 solo se justifica con recursos muy limitados (enfoque Lean).`,
    };
  }
  return { level: "ok", message: `Por rol, ${detail}: dentro de lo recomendado.` };
}

/** Con varios roles, el límite de escenarios se mide por rol (lo que realmente hace cada participante). */
export function scenarioCountGuidanceByRole(scenarios: WithRole[]): Guidance | null {
  const roles = scenarioRoles(scenarios);
  if (roles.length < 2) return scenarioCountGuidance(scenarios.length);
  const perRole = roles.map((role) => scenarios.filter((scenario) => scenario.role?.trim() === role).length);
  const max = Math.max(...perRole);
  if (max <= MAX_RECOMMENDED_SCENARIOS) return null;
  return {
    level: max > 10 ? "warning" : "info",
    message: `Cada participante hace los escenarios de su rol (de ${Math.min(...perRole)} a ${max}). El Máster recomienda no más de ${MAX_RECOMMENDED_SCENARIOS} por prueba: agrupa funciones relacionadas y vigila la fatiga.`,
  };
}
