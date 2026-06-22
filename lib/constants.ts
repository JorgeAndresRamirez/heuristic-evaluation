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
