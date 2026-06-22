/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import type { HeuristicSetSource } from "@/lib/generated/prisma";

export type SeedPrinciple = {
  title: string;
  description: string;
  goodExampleHtml?: string;
  badExampleHtml?: string;
};

export type SeedHeuristicSet = {
  name: string;
  description: string;
  source: HeuristicSetSource;
  principles: SeedPrinciple[];
};

export const HEURISTIC_SEEDS: SeedHeuristicSet[] = [
  {
    name: "10 Principios de Usabilidad de Nielsen",
    description:
      "Heurísticas clásicas de Jakob Nielsen para evaluar la usabilidad de interfaces interactivas.",
    source: "NIELSEN",
    principles: [
      {
        title: "Visibilidad del estado del sistema",
        description:
          "El sistema debe mantener informados a los usuarios sobre lo que ocurre, mediante retroalimentación adecuada y en un tiempo razonable.",
        goodExampleHtml:
          "<p>Mostrar un indicador de carga y el porcentaje al guardar cambios.</p>",
        badExampleHtml:
          "<p>El botón de envío no cambia de estado y el usuario no sabe si la acción se procesó.</p>",
      },
      {
        title: "Correspondencia entre el sistema y el mundo real",
        description:
          "El sistema debe hablar el lenguaje del usuario, con palabras, frases y conceptos familiares, en lugar de términos orientados al sistema.",
      },
      {
        title: "Control y libertad del usuario",
        description:
          "Los usuarios necesitan una salida de emergencia claramente marcada para deshacer acciones no deseadas.",
      },
      {
        title: "Consistencia y estándares",
        description:
          "Los usuarios no deberían preguntarse si palabras, situaciones o acciones diferentes significan lo mismo.",
      },
      {
        title: "Prevención de errores",
        description:
          "Un diseño cuidadoso que previene la ocurrencia de un problema es preferible a buenos mensajes de error.",
      },
      {
        title: "Reconocimiento antes que recuerdo",
        description:
          "Minimizar la carga de memoria del usuario haciendo visibles objetos, acciones y opciones.",
      },
      {
        title: "Flexibilidad y eficiencia de uso",
        description:
          "Atajos —invisibles para usuarios novatos— pueden acelerar la interacción para usuarios expertos.",
      },
      {
        title: "Diseño estético y minimalista",
        description:
          "Las interfaces no deben contener información irrelevante o raramente necesaria.",
      },
      {
        title: "Ayudar a reconocer, diagnosticar y recuperarse de errores",
        description:
          "Los mensajes de error deben expresarse en lenguaje claro, indicar el problema y sugerir una solución.",
      },
      {
        title: "Ayuda y documentación",
        description:
          "Aunque es mejor que el sistema sea usable sin documentación, puede ser necesaria para completar tareas.",
      },
    ],
  },
  {
    name: "8 Reglas de Oro de Shneiderman",
    description:
      "Reglas de diseño de interfaces de Ben Shneiderman para sistemas interactivos.",
    source: "SHNEIDERMAN",
    principles: [
      {
        title: "Buscar la consistencia",
        description:
          "Acciones secuenciales similares deben producir resultados similares en situaciones similares.",
      },
      {
        title: "Permitir a usuarios frecuentes usar atajos",
        description:
          "Los expertos desean atajos que aceleren la interacción; el sistema debe soportarlos sin penalizar a novatos.",
      },
      {
        title: "Ofrecer retroalimentación informativa",
        description:
          "Para cada acción del usuario debe existir alguna respuesta del sistema.",
      },
      {
        title: "Diseñar diálogos para cerrar secuencias",
        description:
          "Las acciones deben organizarse en grupos con inicio, medio y fin informativos.",
      },
      {
        title: "Ofrecer manejo simple de errores",
        description:
          "Diseñar para que los errores sean imposibles; cuando ocurran, ofrecer mecanismos claros de recuperación.",
      },
      {
        title: "Permitir reversión fácil de acciones",
        description:
          "Las acciones deben ser reversibles para reducir la ansiedad del usuario.",
      },
      {
        title: "Soportar control interno del usuario",
        description:
          "Los usuarios expertos desean sentir que controlan el sistema y que este responde a sus acciones.",
      },
      {
        title: "Reducir la carga de memoria a corto plazo",
        description:
          "Las interfaces deben reducir la necesidad de recordar información de un paso a otro.",
      },
    ],
  },
  {
    name: "Heurísticas de Instone",
    description:
      "Conjunto de heurísticas de Keith Instone orientadas a sitios web y experiencias digitales.",
    source: "INSTONE",
    principles: [
      {
        title: "Accesibilidad",
        description:
          "La interfaz debe ser usable por personas con diversas capacidades y contextos de acceso.",
      },
      {
        title: "Identidad",
        description:
          "El sitio debe comunicar claramente quién es la organización y qué ofrece.",
      },
      {
        title: "Información",
        description:
          "El contenido debe ser útil, actualizado y fácil de encontrar.",
      },
      {
        title: "Navegación",
        description:
          "Los usuarios deben poder orientarse y moverse con facilidad por la estructura del sitio.",
      },
      {
        title: "Búsqueda",
        description:
          "Debe existir un mecanismo eficaz para localizar contenido específico.",
      },
      {
        title: "Interactividad",
        description:
          "Los elementos interactivos deben responder de forma predecible y útil.",
      },
      {
        title: "Feedback",
        description:
          "El sistema debe informar al usuario sobre el resultado de sus acciones.",
      },
      {
        title: "Confianza",
        description:
          "La interfaz debe generar credibilidad y seguridad en el usuario.",
      },
    ],
  },
  {
    name: "Heurísticas de Mayhew",
    description:
      "Heurísticas de Deborah Mayhew para evaluar la usabilidad de productos software.",
    source: "MAYHEW",
    principles: [
      {
        title: "Utilidad",
        description:
          "El sistema debe permitir al usuario completar tareas relevantes para sus objetivos.",
      },
      {
        title: "Eficiencia",
        description:
          "Las tareas deben poder completarse con el mínimo esfuerzo y tiempo razonable.",
      },
      {
        title: "Efectividad",
        description:
          "El usuario debe lograr sus metas con precisión y sin errores evitables.",
      },
      {
        title: "Aprendibilidad",
        description:
          "Los usuarios novatos deben poder aprender a usar el sistema rápidamente.",
      },
      {
        title: "Memorabilidad",
        description:
          "Tras un periodo sin uso, el usuario debe poder retomar el sistema con facilidad.",
      },
      {
        title: "Satisfacción",
        description:
          "La experiencia debe resultar agradable y apropiada para el contexto de uso.",
      },
      {
        title: "Accesibilidad",
        description:
          "El diseño debe considerar restricciones físicas, cognitivas y contextuales.",
      },
      {
        title: "Estética",
        description:
          "La presentación visual debe ser coherente, legible y profesional.",
      },
    ],
  },
  {
    name: "Material Design — Usabilidad",
    description:
      "Principios de usabilidad derivados de las guías Material Design de Google.",
    source: "MATERIAL_DESIGN",
    principles: [
      {
        title: "Material como metáfora",
        description:
          "La interfaz debe basarse en superficies, profundidad y movimiento comprensibles.",
      },
      {
        title: "Tipografía con intención",
        description:
          "La jerarquía tipográfica debe guiar la lectura y la priorización de contenido.",
      },
      {
        title: "Color con propósito",
        description:
          "El color debe comunicar estado, jerarquía y acción de forma accesible.",
      },
      {
        title: "Iconografía significativa",
        description:
          "Los iconos deben ser reconocibles, consistentes y acompañados de etiquetas cuando sea necesario.",
      },
      {
        title: "Motion con significado",
        description:
          "Las animaciones deben orientar la atención y explicar transiciones, no distraer.",
      },
      {
        title: "Componentes adaptables",
        description:
          "Los componentes deben responder correctamente a distintos tamaños y contextos.",
      },
      {
        title: "Acciones claras",
        description:
          "Los botones y controles deben indicar claramente qué ocurrirá al activarlos.",
      },
      {
        title: "Feedback del sistema",
        description:
          "Las interacciones deben confirmarse visualmente de forma inmediata.",
      },
    ],
  },
  {
    name: "Apple Human Interface Guidelines",
    description:
      "Principios de usabilidad basados en las Human Interface Guidelines de Apple.",
    source: "APPLE_HIG",
    principles: [
      {
        title: "Claridad",
        description:
          "El texto debe ser legible, los iconos precisos y el adorno sutil y apropiado.",
      },
      {
        title: "Deferencia",
        description:
          "La interfaz ayuda a entender el contenido sin competir con él.",
      },
      {
        title: "Profundidad",
        description:
          "Capas visuales y movimiento realista comunican jerarquía y facilitan la comprensión.",
      },
      {
        title: "Consistencia",
        description:
          "Los elementos familiares y predecibles ayudan a los usuarios a sentirse seguros.",
      },
      {
        title: "Retroalimentación directa",
        description:
          "Las acciones deben confirmarse de inmediato para mantener la confianza del usuario.",
      },
      {
        title: "Metáforas",
        description:
          "Las metáforas familiares ayudan a los usuarios a comprender cómo interactuar.",
      },
      {
        title: "Control del usuario",
        description:
          "El usuario inicia y controla las acciones; el sistema responde, no impone.",
      },
      {
        title: "Accesibilidad",
        description:
          "El diseño debe funcionar para todos, con soporte de tecnologías asistivas.",
      },
    ],
  },
];
