/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

export const AUTHOR = {
  name: "Jorge Andrés Ramírez Sierra",
  title: "Ingeniero de Software - Máster en Diseño de Experiencia de Usuario",
  email: "jor.ramirez@pascualbravo.edu.co",
  github: "https://github.com/JorgeAndresRamirez",
  linkedin: "https://www.linkedin.com/in/jorgeandresramirez",
  repository: "https://github.com/JorgeAndresRamirez/heuristic-evaluation",
} as const;

export const EXPORT_FORMAT = "heuristic-evaluation" as const;
export const EXPORT_VERSION = 1 as const;

export const SEVERITY_LABELS = {
  CRITICAL: "Crítico",
  MAJOR: "Mayor",
  MINOR: "Menor",
} as const;

export const SEVERITY_COLORS = {
  CRITICAL: "bg-red-500 text-white",
  MAJOR: "bg-yellow-400 text-black",
  MINOR: "bg-green-500 text-white",
} as const;

export const SEVERITY_OPTIONS = ["CRITICAL", "MAJOR", "MINOR"] as const;

export const SCOPE_LABELS = {
  ISOLATED: "Aislado",
  GENERALIZED: "Generalizado",
} as const;

export const PROJECT_STATUS_LABELS = {
  DRAFT: "Borrador",
  IN_EVALUATION: "En evaluación",
  CONSOLIDATION: "Consolidación",
  CLOSED: "Cerrado",
} as const;

export const HEURISTIC_SOURCE_LABELS = {
  NIELSEN: "Nielsen",
  SHNEIDERMAN: "Shneiderman",
  INSTONE: "Instone",
  MAYHEW: "Mayhew",
  MATERIAL_DESIGN: "Material Design",
  APPLE_HIG: "Apple HIG",
  CUSTOM: "Personalizado",
} as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024;

// ─── Test de usabilidad ───────────────────────────────────────────────────────────────────────

export const PROJECT_KIND_LABELS = {
  HEURISTIC_EVALUATION: "Evaluación heurística",
  USABILITY_TEST: "Test de usabilidad",
} as const;

export const ENVIRONMENT_LABELS = {
  PHYSICAL: "Presencial",
  VIRTUAL: "Virtual",
} as const;

export const OUTCOME_LABELS = {
  COMPLETED: "Completado",
  NOT_COMPLETED: "No completado",
} as const;

export const ISSUE_ERROR_TYPE_LABELS = {
  CRITICAL: "Crítico (impide completar el escenario)",
  NON_CRITICAL: "No crítico (el usuario se recupera)",
} as const;

/** Escala corta definida en el plan de la prueba (ICU Tema 3): muy leve, leve, grave. */
export const ISSUE_SEVERITY_LABELS = {
  VERY_MILD: "Muy leve",
  MILD: "Leve",
  SEVERE: "Grave",
} as const;

export const ISSUE_SEVERITY_COLORS = {
  VERY_MILD: "bg-green-500 text-white",
  MILD: "bg-yellow-400 text-black",
  SEVERE: "bg-red-500 text-white",
} as const;

export const LEVEL_LABELS = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
} as const;

/** Escala de satisfacción por defecto: se debe explicar el sentido al participante (ICU Tema 3). */
export const DEFAULT_SATISFACTION_SCALE =
  "De 1 a 10: 1 = ninguna satisfacción, 10 = la máxima satisfacción. Se pregunta al terminar cada escenario: «¿Cómo de satisfactoria ha sido para ti la experiencia de hacer lo que acabas de intentar?». Se trata de forma cualitativa.";

export const DEFAULT_SEVERITY_CRITERIA =
  "Error crítico: el participante no puede completar el escenario o cree haberlo completado sin lograrlo (falta de feedback); se considera siempre grave. Error no crítico: el participante se recupera; se valora por impacto, frecuencia y persistencia en una escala de tres niveles: muy leve, leve y grave.";

export const DEFAULT_PARTICIPANT_INSTRUCTIONS =
  "«Gracias por ayudarnos. Estamos probando [sistema], no a ti: si algo te resulta difícil, es un problema del sistema y justo eso queremos descubrir para hacerlo más fácil de usar. Te iré entregando unas tarjetas con situaciones; léelas en voz alta y actúa como lo harías en tu trabajo. Por favor, piensa en voz alta: cuéntanos qué buscas, qué esperas que pase y qué no entiendes. No hay respuestas correctas ni incorrectas y puedes parar cuando quieras.»";
