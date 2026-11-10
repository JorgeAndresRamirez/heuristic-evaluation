/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Carga las dos pruebas de la ronda 1 de usabilidad de GOM (Gestión y Optimización de Mantenimiento, I.U. Pascual Bravo).
 * Siguen el criterio del Máster (ICU Tema 3): si dos grupos usan el sistema de forma totalmente distinta, se hacen
 * pruebas separadas. Por eso hay un proyecto para el administrador de mantenimiento y otro para el laboratorista.
 *
 * Lo que no se conoce (responsables, fechas, lugar, retribución, texto legal…) se deja VACÍO a propósito: el documento-guía
 * lo marca como pendiente. Nada de eso se inventa.
 *
 * Uso: npm run db:seed:gom
 */

import { PrismaClient } from "../lib/generated/prisma";
import {
  DEFAULT_PARTICIPANT_INSTRUCTIONS,
  DEFAULT_SATISFACTION_SCALE,
  DEFAULT_SEVERITY_CRITERIA,
} from "../lib/constants";
import { analyzeScenarioCard } from "../lib/usability-test";

const prisma = new PrismaClient();

type SeedScenario = {
  code: string;
  title: string;
  userGoal: string;
  startingPoint: string;
  timeLimitMinutes: number;
  completionMilestone: string;
  scenarioCard: string;
};

const PRODUCT = "GOM (Gestión y Optimización de Mantenimiento)";

const APPLICATION_SUMMARY =
  "GOM es la aplicación web de la I.U. Pascual Bravo para el inventario de equipos de laboratorio y su mantenimiento preventivo y correctivo. Permite calificar la criticidad de cada equipo para definir su frecuencia de mantenimiento, configurar la lista de actividades por tipo de equipo, registrar los mantenimientos realizados, reportar fallas y consultar el histórico.";

const INSTRUCTIONS = DEFAULT_PARTICIPANT_INSTRUCTIONS.replace("[sistema]", "GOM");

const ADMIN_SCENARIOS: SeedScenario[] = [
  {
    code: "E1",
    title: "Definir la frecuencia de mantenimiento de un equipo nuevo",
    userGoal: "Saber cada cuánto necesita mantenimiento un equipo nuevo para poder programarlo en el semestre.",
    startingPoint: "Sesión iniciada como administrador, en la pantalla de inicio.",
    timeLimitMinutes: 6,
    completionMilestone:
      "Tras guardar, el equipo aparece en la lista con todos sus criterios calificados y su frecuencia calculada (anual, semestral o mensual).",
    scenarioCard:
      "Eres responsable del mantenimiento de los laboratorios de tu institución. Esta mañana llegó un equipo nuevo, el de la placa que te indica el facilitador, y necesitas dejar definido cada cuánto tiempo hay que hacerle mantenimiento para poder programarlo en el semestre. Sabes que se va a usar con mucha frecuencia, que una falla tendría consecuencias importantes y que el fabricante recomienda cuidarlo con regularidad. Decides dejarlo evaluado en el sistema y averiguar qué frecuencia le corresponde.",
  },
  {
    code: "E2",
    title: "Dejar lista la rutina de mantenimiento de un tipo de equipo",
    userGoal: "Que quienes hacen el mantenimiento encuentren las actividades que deben realizar a un tipo de equipo.",
    startingPoint: "Sesión iniciada como administrador, en la pantalla de inicio.",
    timeLimitMinutes: 6,
    completionMilestone:
      "El tipo de equipo indicado queda con tres actividades activas para la frecuencia mensual y aparece el aviso de guardado.",
    scenarioCard:
      "Los laboratoristas te contaron que, cuando hacen el mantenimiento de un tipo de equipo concreto (el que te indica el facilitador), el sistema no les muestra ninguna actividad por realizar. Quieres que, al revisarlo cada mes, encuentren al menos tres actividades, escogidas de las que ya existen en el sistema. Decides dejarlo resuelto ahora para que mañana puedan trabajar con normalidad.",
  },
  {
    code: "E3",
    title: "Encontrar la ficha técnica y los documentos de un equipo",
    userGoal: "Tener a la mano la información técnica y los documentos de un equipo para mostrarlos a un auditor.",
    startingPoint: "Sesión iniciada como administrador, en la pantalla de inicio.",
    timeLimitMinutes: 5,
    completionMilestone: "Se muestra la información técnica del equipo y se puede acceder a sus documentos.",
    scenarioCard:
      "Mañana te visita un auditor que quiere ver la información técnica y los documentos de respaldo de un equipo de tu laboratorio, el de la placa que te indica el facilitador. Para no improvisar durante la visita, decides ubicar hoy esa información en el sistema y confirmar que puedes mostrársela.",
  },
  {
    code: "E4",
    title: "Saber qué mantenimientos se hicieron en un periodo",
    userGoal: "Responder a una solicitud de la dirección con los mantenimientos realizados en un periodo y un bloque.",
    startingPoint: "Sesión iniciada como administrador, en la pantalla de inicio.",
    timeLimitMinutes: 5,
    completionMilestone:
      "Se muestra el listado de mantenimientos del periodo y del bloque indicados y el participante lo interpreta correctamente.",
    scenarioCard:
      "La dirección de tu institución te pidió esta tarde que le cuentes qué mantenimientos se realizaron durante el periodo académico que te indica el facilitador en el bloque que también te indica. Quieres reunir esa información en el sistema y poder decirles, sin dudar, qué se hizo.",
  },
];

const LAB_SCENARIOS: SeedScenario[] = [
  {
    code: "E1",
    title: "Decidir con qué equipo empezar la jornada",
    userGoal: "Atender primero los mantenimientos más urgentes para que no se venzan.",
    startingPoint: "Sesión iniciada como laboratorista, en la pantalla de inicio.",
    timeLimitMinutes: 4,
    completionMilestone:
      "El participante identifica correctamente el equipo con el mantenimiento más urgente de su bloque y lo dice en voz alta.",
    scenarioCard:
      "Empiezas tu jornada en el laboratorio de tu bloque. Sabes que tienes mantenimientos pendientes y que algunos ya van atrasados, y no quieres que se te venzan los más urgentes. Antes de ponerte a trabajar, decides revisar qué equipos te tocan y escoger con cuál vas a empezar.",
  },
  {
    code: "E2",
    title: "Registrar un mantenimiento sin novedades",
    userGoal: "Dejar constancia de un mantenimiento realizado a un equipo.",
    startingPoint: "Sesión iniciada como laboratorista, en la pantalla de inicio.",
    timeLimitMinutes: 6,
    completionMilestone:
      "El registro del equipo indicado queda guardado, con una actividad como «no aplica», y aparece la confirmación.",
    scenarioCard:
      "Acabas de terminar el mantenimiento del equipo con la placa que te indica el facilitador. Todo estuvo en orden, salvo una de las actividades de la lista, que no aplica a este equipo porque no tiene ese componente. Quieres dejar constancia de lo que hiciste para que quede en el sistema.",
  },
  {
    code: "E3",
    title: "Avisar de una falla encontrada durante el mantenimiento",
    userGoal: "Que quede registrada una falla para que otra persona la atienda.",
    startingPoint: "Sesión iniciada como laboratorista, en la pantalla de inicio.",
    timeLimitMinutes: 6,
    completionMilestone:
      "El registro se guarda con el hallazgo (gravedad y descripción de lo ocurrido) y aparece la confirmación.",
    scenarioCard:
      "Mientras hacías el mantenimiento del equipo con la placa que te indica el facilitador, notaste que una pieza falla: pierde presión cuando lo pones a trabajar con carga. No puedes arreglarlo tú, pero no quieres que se olvide. Decides dejar registrada la falla para que alguien más la atienda.",
  },
  {
    code: "E4",
    title: "Reportar un equipo que dejó de funcionar",
    userGoal: "Pedir una reparación para un equipo dañado que no estaba programado.",
    startingPoint: "Sesión iniciada como laboratorista, en la pantalla de inicio.",
    timeLimitMinutes: 6,
    completionMilestone: "El mantenimiento no programado del equipo queda guardado y aparece la confirmación.",
    scenarioCard:
      "Un compañero te cuenta que el equipo con la placa que te indica el facilitador no encendió esta mañana y que no estaba programado para ninguna revisión. Quieres que un técnico lo repare cuanto antes. Decides reportarlo en el sistema.",
  },
];

const PROJECTS = [
  {
    name: "GOM · Ronda 1 · Administrador de mantenimiento",
    description:
      "Prueba de usabilidad con quienes administran el mantenimiento. Se hace por separado de la prueba con laboratoristas porque usan el sistema de forma distinta (ICU, Tema 3).",
    profile: "Administrador de mantenimiento",
    userTypes: "Administrador del mantenimiento (gestión de ambientes de aprendizaje) y laboratorista.",
    profiles: "Administrador de mantenimiento: gestiona la configuración, la planeación y la consulta del mantenimiento.",
    eligibility:
      "Personas que gestionan el mantenimiento de equipos de laboratorio en la institución y que usan o usarían GOM para configurarlo y consultarlo. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    scenarios: ADMIN_SCENARIOS,
  },
  {
    name: "GOM · Ronda 1 · Laboratorista",
    description:
      "Prueba de usabilidad con quienes ejecutan y registran los mantenimientos. Se hace por separado de la prueba con administradores (ICU, Tema 3).",
    profile: "Laboratorista",
    userTypes: "Administrador del mantenimiento (gestión de ambientes de aprendizaje) y laboratorista.",
    profiles: "Laboratorista: ejecuta los mantenimientos de los equipos de su bloque y los registra.",
    eligibility:
      "Personas que ejecutan el mantenimiento de equipos de laboratorio en la institución y que registran lo que hacen. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    scenarios: LAB_SCENARIOS,
  },
];

async function main() {
  console.log("Sembrando la ronda 1 de usabilidad de GOM...");

  const set = await prisma.heuristicSet.findFirst({ where: { source: "NIELSEN", isSystem: true } });
  const config = set ? await prisma.evaluationConfig.findFirst({ where: { heuristicSetId: set.id } }) : null;
  if (!set || !config) {
    throw new Error("Falta el set de Nielsen. Ejecuta antes: npm run db:seed");
  }

  for (const definition of PROJECTS) {
    const existing = await prisma.project.findFirst({ where: { name: definition.name } });
    if (existing) {
      console.log(`  · Omitido (ya existe): ${definition.name}`);
      continue;
    }

    // Control de calidad de las tarjetas con las mismas comprobaciones de la aplicación.
    for (const scenario of definition.scenarios) {
      const errors = analyzeScenarioCard(scenario.scenarioCard).filter((issue) => issue.level === "error");
      if (errors.length > 0) {
        throw new Error(`La tarjeta ${scenario.code} de «${definition.name}» incumple el criterio: ${errors[0].message}`);
      }
    }

    await prisma.project.create({
      data: {
        name: definition.name,
        description: definition.description,
        productName: PRODUCT,
        kind: "USABILITY_TEST",
        status: "DRAFT",
        evaluationConfigId: config.id,
        heuristicSetId: set.id,
        testPlan: {
          create: {
            applicationSummary: APPLICATION_SUMMARY,
            userTypes: definition.userTypes,
            projectMoment:
              "Fase 2 del proyecto GOM. Primera ronda de pruebas con usuarios sobre las mejoras ya construidas, en el ambiente de pruebas.",
            purpose:
              "Descubrir errores de usabilidad al realizar los escenarios de uso más relevantes para este perfil, antes de corregir y volver a probar.",
            context: "Primera ronda; las siguientes se compararán con esta (éxito, tiempo y errores por escenario).",
            plannedParticipants: 5,
            profiles: definition.profiles,
            eligibilityCriteria: definition.eligibility,
            totalDurationMinutes: 45,
            environment: "PHYSICAL",
            severityCriteria: DEFAULT_SEVERITY_CRITERIA,
            satisfactionScale: DEFAULT_SATISFACTION_SCALE,
            participantInstructions: INSTRUCTIONS,
            dataToCollect:
              "Por escenario y participante: completado o no, tiempo en tarea, errores críticos y no críticos, pensamientos en voz alta, satisfacción de 1 a 10. Al final, preguntas para entender conductas puntuales. No se hacen encuestas.",
            // Quedan vacíos a propósito (el documento-guía los marca como pendientes): responsables, contacto, lugar, fechas,
            // reclutamiento, retribución, medios técnicos, sistemas de registro, roles, texto de consentimiento, derechos de
            // imagen, protección de datos, conservación y código ético.
          },
        },
        scenarios: {
          create: definition.scenarios.map((scenario, index) => ({ orderIndex: index, ...scenario })),
        },
      },
    });
    console.log(`  ✓ Creado: ${definition.name} (${definition.scenarios.length} escenarios)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
