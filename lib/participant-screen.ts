/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Pantalla del participante (la ventana que se comparte en la videollamada). Lógica pura, sin base de datos:
 * qué se le muestra según la fase de la sesión. El facilitador controla la fase desde su ventana.
 *
 * Regla del Máster: el participante nunca ve la palabra «tarea», el tiempo límite, el hito de finalización
 * ni los datos internos del escenario. Solo recibe la tarjeta-escenario y su posición.
 */

export type SessionPhase = "NOT_STARTED" | "WELCOME" | "SCENARIO" | "BETWEEN" | "FINISHED";

export const DEFAULT_WELCOME_TITLE = "Antes de comenzar";

export const DEFAULT_WELCOME_HTML = `<ul>
<li>Vamos a probar el sistema, <strong>no a ti</strong>: si algo te resulta difícil, es un problema del sistema y justo eso queremos descubrir.</li>
<li>Verás una situación a la vez. <strong>Léela en voz alta</strong> y actúa como lo harías en tu trabajo.</li>
<li><strong>Piensa en voz alta</strong>: cuéntanos qué buscas, qué esperas que pase y qué no entiendes.</li>
<li>No hay respuestas correctas ni incorrectas y puedes parar cuando quieras.</li>
<li>Las dudas, al final: durante la prueba no podremos ayudarte.</li>
</ul>`;

export const DEFAULT_CLOSING_MESSAGE = "Gracias por tu participación. Tu experiencia nos ayuda a mejorar el sistema.";

export type WelcomeSettings = {
  welcomeEnabled: boolean;
  welcomeTitle: string | null;
  welcomeHtml: string | null;
  closingMessage: string | null;
};

export type PresentationScenario = { id: string; scenarioCard: string };

export type ParticipantPresentation = {
  /** idle = aún no empieza; welcome = bienvenida; scenario = tarjeta en curso; between = pausa; finished = cierre. */
  state: "idle" | "welcome" | "scenario" | "between" | "finished";
  productName: string;
  welcome: { title: string; html: string } | null;
  scenario: { label: string; card: string; position: number; total: number } | null;
  closing: string | null;
};

/**
 * Decide qué muestra la pantalla del participante. Si la bienvenida está desactivada y el facilitador la pide,
 * se muestra la pausa en su lugar. Si el escenario indicado no existe, también se muestra la pausa.
 */
export function buildPresentation(input: {
  productName: string;
  settings: WelcomeSettings;
  phase: SessionPhase;
  currentScenarioId: string | null;
  scenarios: PresentationScenario[];
}): ParticipantPresentation {
  const { settings, phase, scenarios } = input;
  const base = { productName: input.productName, welcome: null, scenario: null, closing: null };

  if (phase === "FINISHED") {
    return { ...base, state: "finished", closing: settings.closingMessage?.trim() || DEFAULT_CLOSING_MESSAGE };
  }
  if (phase === "WELCOME") {
    if (!settings.welcomeEnabled) return { ...base, state: "between" };
    return {
      ...base,
      state: "welcome",
      welcome: {
        title: settings.welcomeTitle?.trim() || DEFAULT_WELCOME_TITLE,
        html: settings.welcomeHtml?.trim() || DEFAULT_WELCOME_HTML,
      },
    };
  }
  if (phase === "SCENARIO") {
    const index = scenarios.findIndex((scenario) => scenario.id === input.currentScenarioId);
    if (index === -1) return { ...base, state: "between" };
    return {
      ...base,
      state: "scenario",
      scenario: {
        label: `Situación ${index + 1} de ${scenarios.length}`,
        card: scenarios[index].scenarioCard,
        position: index + 1,
        total: scenarios.length,
      },
    };
  }
  if (phase === "BETWEEN") return { ...base, state: "between" };
  return { ...base, state: "idle" };
}

/** Acciones con las que el facilitador controla la pantalla del participante. */
export type ScreenAction =
  | { action: "open" }
  | { action: "welcome" }
  | { action: "scenario"; scenarioId: string }
  | { action: "pause" }
  | { action: "finish" }
  | { action: "reset" };

/** Fase a la que pasa la sesión con cada acción (`open` no cambia la fase, solo prepara el enlace). */
export function phaseForAction(action: ScreenAction): SessionPhase | null {
  switch (action.action) {
    case "welcome":
      return "WELCOME";
    case "scenario":
      return "SCENARIO";
    case "pause":
      return "BETWEEN";
    case "finish":
      return "FINISHED";
    case "reset":
      return "NOT_STARTED";
    default:
      return null;
  }
}
