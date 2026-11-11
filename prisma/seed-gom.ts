/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 *
 * Ronda 1 de pruebas de usabilidad de GOM (Gestión y Optimización de Mantenimiento, I.U. Pascual Bravo).
 *
 * Criterios (material del Máster, ICU Tema 3):
 *  - Una sola prueba con los tres roles (decisión del responsable, 2026-11-11), cada participante hace el bloque de su rol.
 *  - Supera el máximo de 6 escenarios del Máster: queda dicho en el plan.
 *  - Los escenarios son narrativos, de la necesidad del usuario y no dirigidos (se validan con analyzeScenarioCard).
 *  - Lo que no se conoce (responsables, fechas, lugar, texto legal…) queda vacío: el documento-guía lo marca como pendiente.
 *
 * El alcance de cada rol sale de la matriz de roles aprobada de GOM (MatrizDeRoles.aprobada.txt) y del ADR-007.
 * Orden lógico de la ronda (cada prueba deja listo lo que necesita la siguiente):
 *   1 SoporteAdmin → 2 TecnicoOperativo «Preparar» → 3 TecnicoOperativo «Planear y operar» →
 *   4 TecnicoOperativo «Seguimiento» → 5 Laboratorista (y cierre del SoporteAdmin: escenario S6).
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
  /** Documentación interna: ruta esperada, de qué depende y qué deja listo. Nunca se muestra al participante. */
  description: string;
  startingPoint: string;
  timeLimitMinutes: number;
  completionMilestone: string;
  scenarioCard: string;
};

type SeedProject = {
  name: string;
  description: string;
  profile: string;
  profiles: string;
  eligibility: string;
  context: string;
  scenarios: SeedScenario[];
};

const PRODUCT = "GOM (Gestión y Optimización de Mantenimiento)";

const APPLICATION_SUMMARY =
  "GOM es la aplicación web de la I.U. Pascual Bravo para el inventario de equipos de laboratorio y su mantenimiento preventivo y correctivo. Permite dar acceso al personal, asignarle espacios físicos, convertir bienes de SEVEN en equipos, parametrizarlos (tipo de equipo, frecuencia, actividades, checklist y plan maestro), programar y registrar los mantenimientos, reportar fallas y consultar el histórico y los reportes.";

const USER_TYPES =
  "SoporteAdmin (administra el sistema a nivel operativo), TecnicoOperativo (responsable técnico de unos espacios físicos) y Laboratorista (ejecuta y registra el mantenimiento). El Admin (desarrolladores) y el Auxiliar (consulta estadística) quedan fuera de esta ronda.";

const INSTRUCTIONS = DEFAULT_PARTICIPANT_INSTRUCTIONS.replace("[sistema]", "GOM");

const DATA_NOTE =
  "Datos de partida (decisión del responsable, 2026-11-11): cada participante trabaja con sus propios datos reales de piloto (el bien, el equipo, las personas), para que la prueba sea realista. Los escenarios encadenados continúan con el mismo equipo y las mismas personas; el facilitador anota en el participante (campo notas) la placa, el tipo y las personas usados para retomarlos en la sesión siguiente. Antes de cada sesión el facilitador comprueba que el participante tiene lo necesario (por ejemplo, un bien de SEVEN de su laboratorio que aún no esté en GOM). Los datos y los correos son reales: lo guardado en el ambiente de pruebas permanece.";

const BLOCKS: SeedProject[] = [
  // ───────────────────────────────────────────────── 1 · SoporteAdmin
  {
    name: "GOM · Ronda 1 · 1 · SoporteAdmin · Alta y asignación de personal",
    description:
      "Primera prueba de la ronda. Da acceso al personal y le asigna espacios físicos: lo que necesitan después el TecnicoOperativo y el Laboratorista. Alcance según la matriz de roles: Usuarios, Roles (solo consulta), Personal › Asignación y Reporte de auditoría. Quedan fuera por ser solo del Admin: Configuraciones, Soporte (iniciar sesión como otro usuario), Periodos académicos y crear o editar roles. Lo demás que puede hacer el SoporteAdmin (inventario y mantenimiento) se prueba en las pruebas del TecnicoOperativo, que es quien lo hace a diario.",
    profile: "SoporteAdmin",
    profiles: "SoporteAdmin: administra el sistema a nivel operativo (usuarios, asignaciones y, con alcance total, inventario y mantenimiento).",
    eligibility:
      "Personas que dan acceso al personal y administran el sistema en la institución (por ejemplo, quien crea las cuentas y asigna a las personas a los laboratorios) y que usarían GOM para ello. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    context:
      "Esta prueba va primero: crea las cuentas y asigna los espacios que usan las siguientes. El escenario S6 (auditoría) necesita registros de mantenimiento: se aplica al cierre de la ronda, cuando ya hay registros de las pruebas del Laboratorista. Quedan fuera de alcance y anotados: desbloquear una cuenta (requiere una cuenta bloqueada preparada) y las funciones exclusivas del Admin. Los límites de tiempo son estimaciones que se calibran con el piloto.",
    scenarios: [
      {
        code: "S1",
        title: "Dar de alta a una persona nueva como técnico responsable",
        userGoal: "Que una persona recién incorporada pueda entrar a GOM con las funciones de técnico responsable de espacios.",
        description:
          "Ruta esperada: Seguridad › Usuarios › Nuevo (persona, correo, contraseña temporal y rol TecnicoOperativo). Depende de: la persona existe en SICAU. Deja listo: la cuenta que usan S3, S4 y las pruebas del TecnicoOperativo. Nota: se envía un correo de confirmación real.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "El usuario queda guardado con su persona, su correo y el rol TecnicoOperativo, aparece en el listado de usuarios y el sistema confirma que se envió el correo de activación.",
        scenarioCard:
          "Esta semana se incorpora a tu institución una persona que será la responsable técnica de varios laboratorios. Necesita entrar a GOM con lo que le corresponde por su cargo: configurar los equipos, planear su mantenimiento y hacerles seguimiento, pero solo en los laboratorios que se le asignen. Tú eres quien le da acceso al sistema. Decides dejar lista su cuenta hoy, para que pueda activarla y empezar a trabajar.",
      },
      {
        code: "S2",
        title: "Dar de alta a un laboratorista",
        userGoal: "Que quien hace los mantenimientos pueda registrar su trabajo y nada más.",
        description:
          "Ruta esperada: Seguridad › Usuarios › Nuevo (rol Laboratorista). Depende de: S1 (conviene que el técnico ya exista). Deja listo: la cuenta que usa la prueba del Laboratorista (primer ingreso). Nota: se envía un correo de confirmación real.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 6,
        completionMilestone:
          "El usuario queda guardado con el rol Laboratorista, aparece en el listado y el sistema confirma que se envió el correo de activación.",
        scenarioCard:
          "La persona responsable técnica ya tiene su cuenta. Ahora necesita que quien se encarga de hacer los mantenimientos en su laboratorio también pueda entrar a GOM, pero solo para dejar registrado el trabajo que realiza en los equipos. Quieres que el sistema le permita únicamente eso y nada más. Decides crear su acceso para que lo active esta semana.",
      },
      {
        code: "S3",
        title: "Asignar al técnico los espacios de los que es responsable",
        userGoal: "Que el técnico encuentre, al entrar, los equipos de los laboratorios que le corresponden.",
        description:
          "Ruta esperada: Personal › Asignación (persona, bloque y espacios físicos). Depende de: S1. Deja listo: el alcance del técnico, necesario para todas sus pruebas. Según el ADR-007 es el SoporteAdmin quien asigna espacios al técnico.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "La persona queda asignada al bloque y a los espacios correctos y aparece en el listado de personal asignado.",
        scenarioCard:
          "El técnico recién incorporado ya tiene cuenta, pero todavía no puede ver ningún equipo: el sistema aún no sabe de cuáles laboratorios es responsable. Tú sabes en qué bloque está y qué espacios le corresponden. Decides dejar registrado a cuáles queda asignado, para que cuando entre encuentre los equipos que debe atender.",
      },
      {
        code: "S4",
        title: "Ayudar a quien no recibió el correo de activación",
        userGoal: "Que una persona pueda activar su cuenta sin tener que crearle otra.",
        description:
          "Ruta esperada: Seguridad › Usuarios › reenviar confirmación de la cuenta. Depende de: S1 o S2. Nota: se envía un correo real. Simula el caso frecuente de soporte.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 4,
        completionMilestone: "El sistema confirma que el correo de activación se reenvió a la cuenta indicada.",
        scenarioCard:
          "El nuevo técnico te escribe preocupado: pasaron varias horas y no le llegó el correo para activar su cuenta, así que no puede entrar al sistema. Quieres resolverlo de inmediato, sin crearle otra cuenta, para que pueda empezar a trabajar hoy.",
      },
      {
        code: "S5",
        title: "Cambiar las funciones de una persona",
        userGoal: "Que el acceso de una persona refleje su nuevo cargo sin crearle otra cuenta.",
        description:
          "Ruta esperada: Seguridad › Usuarios › Editar (rol). Depende de: S2. Nota para el facilitador: usar una cuenta distinta de la que se usará en la prueba del Laboratorista, para no alterarla.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 6,
        completionMilestone: "La persona queda con el rol nuevo guardado y el listado de usuarios lo muestra.",
        scenarioCard:
          "Una persona de tu equipo, que hoy tiene acceso solo para registrar mantenimientos, asume desde hoy la responsabilidad técnica de otro bloque. Quieres que su acceso refleje su nuevo cargo, sin crearle una cuenta nueva ni pedirle que se registre otra vez.",
      },
      {
        code: "S6",
        title: "Reunir la evidencia de los mantenimientos para una auditoría",
        userGoal: "Entregar a control interno un archivo con lo que se hizo, quién lo hizo y qué se encontró.",
        description:
          "Ruta esperada: Actividades › Histórico › Reporte de auditoría (Excel con ejecuciones y hallazgos; Admin y SoporteAdmin). Depende de: registros de mantenimiento (se aplica al cierre de la ronda, después de la prueba del Laboratorista). Con el histórico vacío el sistema avisa y no descarga: ese caso se prueba aparte.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 6,
        completionMilestone:
          "Se descarga el archivo de auditoría y el participante confirma, al abrirlo, que contiene lo pedido (quién, cuándo y hallazgos).",
        scenarioCard:
          "La oficina de control interno te pidió soporte de los mantenimientos que se hicieron durante el periodo académico actual: quién los realizó, cuándo y qué fallas se encontraron. Quieres entregarles hoy un archivo que puedan revisar con calma, sin que tengas que armarlo a mano.",
      },
    ],
  },
  // ───────────────────────────────────────────────── 2 · TecnicoOperativo · Preparar
  {
    name: "GOM · Ronda 1 · 2 · TecnicoOperativo · Preparar un equipo para el mantenimiento",
    description:
      "Primera de tres sesiones del TecnicoOperativo. Parte de un bien de SEVEN y lo deja listo para el mantenimiento, en el orden en que el sistema lo exige: equipo y tipo → frecuencia → actividades → checklist → plan maestro → replicar la configuración. Alcance: solo los espacios que SoporteAdmin le asignó (prueba 1, S3). Fuera de esta prueba y anotado: completar la ficha técnica del equipo (componentes y documentos) y editar los criterios de frecuencia (configuración puntual).",
    profile: "TecnicoOperativo",
    profiles: "TecnicoOperativo: responsable técnico de unos espacios físicos; configura y planea el mantenimiento de sus equipos.",
    eligibility:
      "Personas responsables técnicas de laboratorios que gestionan el inventario y el mantenimiento de sus equipos y usarían GOM para ello. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    context:
      "Segunda prueba de la ronda: necesita la cuenta y los espacios de la prueba 1. Cada escenario deja listo lo que usa el siguiente, así que se aplican en el orden E1 a E6 con el mismo equipo. Fuera de alcance y anotado: ficha técnica (componentes y documentos) y criterios de frecuencia. Los límites de tiempo son estimaciones que se calibran con el piloto.",
    scenarios: [
      {
        code: "E1",
        title: "Dejar un bien de SEVEN como equipo de GOM, completo",
        userGoal: "Poder dar mantenimiento a un bien que hoy solo existe en el inventario institucional.",
        description:
          "Ruta esperada: Inventario › Bienes de SEVEN (filtrar y marcar como equipo) y su tipo de equipo para mantenimiento; si el tipo no existe, se crea desde ese mismo paso. Depende de: prueba 1 (cuenta y espacios del técnico) y de un bien de SEVEN que aún no sea equipo. Deja listo: el equipo con su tipo, que usan E2 a E6. Riesgo conocido (L-03): el tipo se presenta como paso opcional.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 10,
        completionMilestone:
          "El bien aparece en Equipos con su tipo de equipo para mantenimiento asignado, sin avisos de datos pendientes.",
        scenarioCard:
          "En tu laboratorio hay un bien que sí está en el inventario institucional, pero todavía no figura en GOM, y por eso no puedes planear su mantenimiento. Quieres incorporarlo y dejarlo completamente listo en el sistema para poder empezar a darle mantenimiento. Decides hacerlo hoy.",
      },
      {
        code: "E2",
        title: "Definir cada cuánto necesita mantenimiento el equipo",
        userGoal: "Saber cada cuánto debe revisarse el equipo para programarlo en el semestre.",
        description:
          "Ruta esperada: Mantenimiento › Frecuencias de mantenimiento (consultar el equipo, abrir la ficha de calificación, calificar los siete criterios y guardar). Depende de: E1 y de criterios de frecuencia activos que sumen 100 %. Deja listo: la frecuencia (con estas respuestas debe salir alta) que usa E4.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "Los siete criterios quedan calificados y guardados y la lista muestra el total y la frecuencia calculada del equipo.",
        scenarioCard:
          "El equipo que acabas de incorporar se usa casi todos los días, una falla detendría varias clases y el fabricante pide revisarlo con frecuencia. Para programar su mantenimiento en el semestre necesitas que el sistema te diga cada cuánto debe revisarse. Decides evaluarlo y conocer ese resultado.",
      },
      {
        code: "E3",
        title: "Crear las actividades que faltan en el catálogo",
        userGoal: "Contar con las actividades que realmente se le hacen al equipo para poder asignárselas.",
        description:
          "Ruta esperada: Mantenimiento › Actividades › Nueva (nombre y detalles). Depende de: ninguno, pero va antes del checklist. Deja listo: las actividades que usa E4. Nota: el participante define las actividades con su conocimiento del equipo; el facilitador no las dicta.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "Al menos tres actividades nuevas quedan guardadas y activas en el catálogo de actividades.",
        scenarioCard:
          "Sabes muy bien qué debe revisarse en ese equipo cada vez que se le da mantenimiento. Cuando buscas esas actividades en el sistema, notas que algunas todavía no están. Quieres dejarlas creadas, con lo que hay que hacer en cada una, para poder usarlas más adelante.",
      },
      {
        code: "E4",
        title: "Dejar lista la rutina de revisión del tipo de equipo",
        userGoal: "Que quien dé mantenimiento a ese tipo de equipo vea qué debe revisar según la frecuencia que le toca.",
        description:
          "Ruta esperada: Mantenimiento › Checklist (fila del tipo › Configurar o Editar › pestaña de la frecuencia › agregar o activar actividades › guardar). Depende de: E1 (tipo), E2 (frecuencia) y E3 (actividades). Deja listo: el checklist que copia el plan y que ve el laboratorista en su registro.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "El tipo de equipo queda con actividades activas en la frecuencia calculada para el equipo y el sistema confirma el guardado.",
        scenarioCard:
          "Ahora que las actividades existen, quieres que cada vez que alguien le dé mantenimiento a ese tipo de equipo vea exactamente qué debe revisar, de acuerdo con cada cuánto le toca. Decides dejar armada esa lista hoy, para que nadie tenga que adivinar.",
      },
      {
        code: "E5",
        title: "Dejar definido el plan de mantenimiento del equipo",
        userGoal: "Tener formalmente definido cómo se le dará mantenimiento al equipo.",
        description:
          "Ruta esperada: Mantenimiento › Plan maestro › Nuevo (bloque, equipo, duración, trabajo interno o contratado, valores y responsable). Depende de: E1 a E4 (el plan copia el checklist de la frecuencia calculada). Deja listo: el equipo en el Registro de actividades.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 10,
        completionMilestone:
          "El plan del equipo queda guardado, con las actividades de su frecuencia, y aparece en el listado de planes.",
        scenarioCard:
          "Con el equipo clasificado, su frecuencia definida y su lista de actividades, ya puedes dejar formalmente establecido cómo se le va a dar mantenimiento: quién será el responsable, cuánto tiempo toma y si lo hará personal propio o un contratista. Decides dejar creado el plan de ese equipo.",
      },
      {
        code: "E6",
        title: "Dejar listos otros equipos iguales sin repetir todo",
        userGoal: "Evitar repetir uno por uno lo ya hecho en equipos idénticos.",
        description:
          "Ruta esperada: Inventario › Equipos › barra de guía del equipo ya parametrizado (aplicar la configuración a otros equipos) o, desde otro equipo, importar la configuración. Depende de: E1 a E5 y de que existan otros equipos iguales en GOM (verificar antes con el participante). No se mide la frecuencia ni el plan de los equipos copiados.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "Al menos un segundo equipo queda con la configuración copiada del primero y aparece vinculado a su equipo guía.",
        scenarioCard:
          "En tu laboratorio hay otros equipos idénticos al que acabas de dejar listo y todos necesitan lo mismo. Repetir uno por uno todo lo que hiciste sería larguísimo. Quieres dejar los demás con la misma configuración aprovechando lo que ya hiciste con el primero.",
      },
    ],
  },
  // ───────────────────────────────────────────────── 3 · TecnicoOperativo · Planear y operar
  {
    name: "GOM · Ronda 1 · 3 · TecnicoOperativo · Planear y operar",
    description:
      "Segunda sesión del TecnicoOperativo. Con el equipo ya preparado, deja listo a su laboratorista, programa el mantenimiento y lo ejecuta (registro y no programados). Alcance: solo sus espacios.",
    profile: "TecnicoOperativo",
    profiles: "TecnicoOperativo: responsable técnico de unos espacios físicos; planea y ejecuta el mantenimiento de sus equipos.",
    eligibility:
      "Personas responsables técnicas de laboratorios que planean y ejecutan el mantenimiento de sus equipos y usarían GOM para ello. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    context:
      "Tercera prueba de la ronda: continúa con el equipo de la prueba 2 y con el laboratorista de la prueba 1. Se aplica con el mismo participante que la prueba 2, retomando sus datos. Puede hacerse en la misma visita que la prueba 4 (juntas son 8 escenarios: conviene una pausa). Los límites de tiempo son estimaciones que se calibran con el piloto.",
    scenarios: [
      {
        code: "O1",
        title: "Dejar al laboratorista listo para trabajar",
        userGoal: "Que el laboratorista vea, al entrar, los equipos de los laboratorios donde trabaja.",
        description:
          "Ruta esperada: Personal › Asignación (el técnico asigna a su laboratorista espacios de los suyos; no crea cuentas). Depende de: prueba 1 (S2 y S3). Deja listo: el alcance del laboratorista para su prueba.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "El laboratorista queda asignado a espacios que están dentro de los del técnico y aparece en el listado de personal asignado.",
        scenarioCard:
          "Tu laboratorista ya tiene su cuenta, pero al entrar no ve ningún equipo porque aún no tiene laboratorios asignados. Eres tú quien decide en cuáles trabaja, dentro de los que están a tu cargo. Quieres dejarlo asignado hoy, para que mañana pueda empezar a registrar los mantenimientos.",
      },
      {
        code: "O2",
        title: "Programar el mantenimiento y organizar a quién le toca",
        userGoal: "Fijar las fechas del mantenimiento y que lo atienda el mismo grupo que los demás equipos del bloque.",
        description:
          "Ruta esperada: Mantenimiento › Programación de planes y/o Brigadas (crear o elegir una brigada y asociarle el plan). Depende de: plan del equipo (prueba 2, E5). Es la parte menos obvia del flujo (pantallas poco enlazadas).",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 10,
        completionMilestone:
          "El plan queda con su programación de fechas (inicial y final) y asociado a la brigada elegida o creada.",
        scenarioCard:
          "El plan del equipo ya existe, pero nadie sabe en qué fechas debe hacerse el mantenimiento. Quieres dejar fijado el periodo del semestre en que se hará y que el mismo grupo que atiende los demás equipos del bloque se encargue también de este. Decides dejarlo organizado hoy.",
      },
      {
        code: "O3",
        title: "Registrar un mantenimiento realizado",
        userGoal: "Dejar constancia de lo hecho en un equipo.",
        description:
          "Ruta esperada: Actividades › Registro de actividades (Mi trabajo › equipo › resolver cada actividad › guardar). Depende de: plan del equipo y alcance del técnico. Una actividad debe quedar como «No aplica». No registrar con datos que el participante no haya hecho realmente en el piloto sin avisarlo.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "El registro del equipo queda guardado, con una actividad como «No aplica», y el sistema lo confirma.",
        scenarioCard:
          "Hoy hiciste el mantenimiento del equipo que preparaste. Todo estuvo en orden, salvo una actividad de la lista que no aplica a este equipo porque no tiene ese componente. Quieres dejar constancia de lo que hiciste para que quede en el sistema.",
      },
      {
        code: "O4",
        title: "Reportar un daño que no estaba programado",
        userGoal: "Dejar constancia de un equipo dañado para que se repare.",
        description:
          "Ruta esperada: Actividades › Mantenimientos no programados › Nuevo (equipo, tipo de mantenimiento, responsable). Depende de: un equipo en sus espacios. Deja listo: un correctivo que consulta la prueba 4.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone: "El mantenimiento no programado queda guardado y aparece en el listado.",
        scenarioCard:
          "Al terminar, descubres que otro equipo de tu laboratorio dejó de funcionar y que no estaba programado para ninguna revisión. Necesitas que se repare y que quede constancia de lo ocurrido. Decides reportarlo en el sistema.",
      },
    ],
  },
  // ───────────────────────────────────────────────── 4 · TecnicoOperativo · Seguimiento
  {
    name: "GOM · Ronda 1 · 4 · TecnicoOperativo · Seguimiento y análisis",
    description:
      "Tercera sesión del TecnicoOperativo. Consulta lo ocurrido (histórico y reportes) y analiza la vigencia tecnológica de un equipo. Es lo que el rol hace para dar cuenta de su gestión.",
    profile: "TecnicoOperativo",
    profiles: "TecnicoOperativo: responsable técnico de unos espacios físicos; hace seguimiento de su gestión.",
    eligibility:
      "Personas responsables técnicas de laboratorios que consultan reportes e histórico de sus equipos y usarían GOM para ello. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    context:
      "Cuarta prueba de la ronda: necesita registros y correctivos de la prueba 3 (si no hay datos, los reportes salen vacíos y el sistema avisa). Se aplica con el mismo participante. Los límites de tiempo son estimaciones que se calibran con el piloto.",
    scenarios: [
      {
        code: "A1",
        title: "Saber qué se ha hecho en tus equipos",
        userGoal: "Responder a la coordinación qué mantenimientos se hicieron y si hubo fallas.",
        description:
          "Ruta esperada: Actividades › Histórico (periodo actual, bloque; filtros al instante; desplegar una visita). Depende de: registros de la prueba 3.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 6,
        completionMilestone:
          "Se muestra el histórico del periodo y del bloque indicados y el participante identifica correctamente las visitas y los hallazgos.",
        scenarioCard:
          "La coordinación te pide que le cuentes qué mantenimientos se hicieron en uno de tus bloques durante el periodo académico actual y si se encontraron fallas. Quieres tener esa información clara para responderles hoy, sin dudar.",
      },
      {
        code: "A2",
        title: "Llevar el listado de equipos de un bloque a una reunión",
        userGoal: "Tener en un archivo el listado de equipos de un bloque con su estado.",
        description: "Ruta esperada: Reportes › Equipos (bloque o espacio › descargar el Excel). Depende de: equipos en sus espacios.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 5,
        completionMilestone: "Se descarga el archivo con los equipos del bloque y el participante confirma que contiene lo esperado.",
        scenarioCard:
          "Mañana tienes una reunión y necesitas llevar el listado de los equipos de uno de tus bloques, con su estado, en un archivo que puedas abrir y compartir. Quieres dejarlo listo hoy para no improvisar.",
      },
      {
        code: "A3",
        title: "Saber cuántos daños imprevistos hubo",
        userGoal: "Responder con datos cuántos daños imprevistos hubo y en qué equipos.",
        description:
          "Ruta esperada: Reportes › Mantenimientos no programados (consultar, abrir el detalle y descargar). Depende de: correctivos de la prueba 3 (O4).",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 5,
        completionMilestone: "Se muestra el reporte con los correctivos del periodo y el participante nombra cuántos hay y de qué equipos.",
        scenarioCard:
          "Tu jefe te pregunta cuántos daños imprevistos hubo este periodo en tus laboratorios y de qué equipos fueron. Quieres responderle con datos, no de memoria, y poder mostrarle de dónde salen.",
      },
      {
        code: "A4",
        title: "Valorar si un equipo ya quedó atrasado tecnológicamente",
        userGoal: "Tener una valoración objetiva para decidir si un equipo debe reemplazarse.",
        description:
          "Ruta esperada: Mantenimiento › Evaluación tecnológica (equipo › variables › calcular y guardar). Depende de: calificación de frecuencia del equipo (prueba 2, E2: el criterio 1 debe estar calificado).",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 10,
        completionMilestone: "El análisis del equipo queda guardado con su resultado y aparece en el listado de evaluaciones.",
        scenarioCard:
          "Un equipo de tu laboratorio ya es muy antiguo y cada vez falla más. Antes de pedir presupuesto para reemplazarlo, necesitas una valoración objetiva de qué tan vigente sigue siendo su tecnología. Decides evaluarlo en el sistema y obtener ese resultado.",
      },
    ],
  },
  // ───────────────────────────────────────────────── 5 · Laboratorista
  {
    name: "GOM · Ronda 1 · 5 · Laboratorista · Mi trabajo diario",
    description:
      "Última prueba de la ronda. El laboratorista activa su cuenta y hace su trabajo: ver qué le toca, registrar mantenimientos, avisar de fallas, reportar daños y revisar lo registrado. Alcance según la matriz de roles: solo Registro de actividades, Mantenimientos no programados e Histórico, en los espacios que su técnico le asignó.",
    profile: "Laboratorista",
    profiles: "Laboratorista: ejecuta los mantenimientos de los equipos de sus laboratorios y los registra.",
    eligibility:
      "Personas que ejecutan el mantenimiento de equipos de laboratorio en la institución y que registran lo que hacen. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    context:
      "Quinta prueba de la ronda: necesita la cuenta (prueba 1, S2), los espacios que le asigna el técnico (prueba 3, O1) y un equipo con plan (prueba 2). Sus registros alimentan el escenario S6 del SoporteAdmin. Los límites de tiempo son estimaciones que se calibran con el piloto. Sin datos reales de uso, el participante usa sus equipos reales.",
    scenarios: [
      {
        code: "L1",
        title: "Activar la cuenta y entrar por primera vez",
        userGoal: "Poder usar el sistema nuevo para registrar su trabajo.",
        description:
          "Ruta esperada: correo de activación › confirmar la cuenta › iniciar sesión con la clave temporal › cambiar la clave. Depende de: S2. El participante escribe sus propias claves; nadie del equipo las ve ni las anota.",
        startingPoint: "El participante tiene el correo de activación en su buzón; el navegador está en la página de inicio de sesión.",
        timeLimitMinutes: 8,
        completionMilestone: "El participante inicia sesión, cambia la clave temporal y llega a la pantalla de inicio con sus opciones de trabajo.",
        scenarioCard:
          "Te avisaron que, desde hoy, el mantenimiento de los equipos de tu laboratorio se registra en un sistema nuevo y que tu acceso ya fue creado. Te llegó un correo a tu buzón. Quieres entrar al sistema por primera vez y dejar tu cuenta lista para usarla en tu trabajo.",
      },
      {
        code: "L2",
        title: "Saber qué mantenimientos te tocan primero",
        userGoal: "Atender primero lo más urgente para que no se venza.",
        description:
          "Ruta esperada: Actividades › Registro de actividades (Mi trabajo: vencidos, por hacer y al día). Depende de: espacios asignados (O1) y planes (prueba 2). Si no ve equipos, es un hallazgo de alcance, no un error del participante.",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 4,
        completionMilestone: "El participante identifica correctamente el equipo con el mantenimiento más urgente de su laboratorio y lo dice en voz alta.",
        scenarioCard:
          "Empiezas tu jornada en el laboratorio. Sabes que tienes mantenimientos pendientes y que algunos ya van atrasados, y no quieres que se te venzan los más urgentes. Antes de ponerte a trabajar, decides revisar qué equipos te tocan y escoger con cuál vas a empezar.",
      },
      {
        code: "L3",
        title: "Registrar un mantenimiento sin novedades",
        userGoal: "Dejar constancia de un mantenimiento realizado a un equipo.",
        description:
          "Ruta esperada: Registro de actividades › equipo › marcar lo hecho (o «Marcar todo como hecho») › «No aplica» en una actividad › guardar. Depende de: L2.",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone: "El registro del equipo queda guardado, con una actividad como «No aplica», y aparece la confirmación.",
        scenarioCard:
          "Acabas de terminar el mantenimiento de uno de tus equipos. Todo estuvo en orden, salvo una de las actividades de la lista, que no aplica a este equipo porque no tiene ese componente. Quieres dejar constancia de lo que hiciste para que quede en el sistema.",
      },
      {
        code: "L4",
        title: "Avisar de una falla grave y pedir su reparación",
        userGoal: "Que una falla grave quede registrada y alguien la atienda de inmediato.",
        description:
          "Ruta esperada: Registro de actividades › actividad «Con hallazgo» › gravedad crítica › qué pasó › componente › pedir el correctivo › guardar. Depende de: L2. Con gravedad leve el correctivo se rechaza: es una regla del sistema.",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone: "El registro se guarda con el hallazgo crítico (qué pasó y componente) y se crea el mantenimiento no programado enlazado.",
        scenarioCard:
          "Mientras revisabas un equipo notaste una falla grave: ya no funciona de manera segura y debe dejar de usarse hasta que lo reparen. Quieres que quede registrada tal como la viste y que quien debe repararlo sepa que tiene que atenderla de inmediato.",
      },
      {
        code: "L5",
        title: "Reportar un equipo que dejó de funcionar",
        userGoal: "Pedir una reparación para un equipo dañado que no estaba programado.",
        description:
          "Ruta esperada: Actividades › Mantenimientos no programados › Nuevo. Depende de: un equipo en sus espacios. Es el otro camino hacia un correctivo (distinto de L4).",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 6,
        completionMilestone: "El mantenimiento no programado queda guardado y aparece en el listado.",
        scenarioCard:
          "Un compañero te cuenta que otro equipo de tu laboratorio no encendió esta mañana y que no estaba programado para ninguna revisión. Quieres que un técnico lo repare cuanto antes. Decides reportarlo en el sistema.",
      },
      {
        code: "L6",
        title: "Revisar lo que registraste",
        userGoal: "Contar con precisión lo que registró en el mes.",
        description: "Ruta esperada: Actividades › Histórico (periodo actual; filtros al instante; desplegar una visita). Depende de: L3 y L4.",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 5,
        completionMilestone: "Se muestran sus propios registros del periodo y el participante identifica los de esta sesión, incluido el hallazgo.",
        scenarioCard:
          "Al terminar la semana, tu coordinador te pregunta qué mantenimientos registraste en tu laboratorio este mes y si encontraste fallas. Quieres revisar tu propio registro para contárselo con precisión.",
      },
    ],
  },
];

/** Nombres de la primera versión (perfiles «Administrador de mantenimiento» y «Laboratorista» sueltos): no coinciden con los roles reales de GOM. */
const OBSOLETE_NAMES = ["GOM · Ronda 1 · Administrador de mantenimiento", "GOM · Ronda 1 · Laboratorista"];

async function removeObsoleteIfEmpty() {
  for (const name of OBSOLETE_NAMES) {
    const old = await prisma.project.findFirst({
      where: { name },
      include: { _count: { select: { participants: true, issues: true } } },
    });
    if (!old) continue;
    if (old._count.participants > 0 || old._count.issues > 0) {
      console.log(`  ! Se conserva «${name}»: ya tiene participantes o problemas. Revísalo a mano.`);
      continue;
    }
    await prisma.project.delete({ where: { id: old.id } });
    console.log(`  - Retirado el proyecto obsoleto sin datos: ${name}`);
  }
}

const TEST_NAME = "GOM · Ronda 1 · Prueba de usabilidad por roles";

/**
 * Decisión del responsable (2026-11-11): no hay tiempo ni forma de aplicar varias pruebas, así que la ronda es UNA sola
 * prueba con todos los escenarios, en el orden real de trabajo: SoporteAdmin → TecnicoOperativo → Laboratorista.
 * Se supera a propósito el máximo de 6 escenarios del Máster: el plan lo deja dicho y la guía invita a repartirlos en sesiones.
 * La auditoría (S6) se mueve al final porque necesita los registros que deja el Laboratorista.
 */
function buildSingleProject(): SeedProject {
  const audit = BLOCKS[0].scenarios.find((scenario) => scenario.code === "S6");
  const ordered = BLOCKS.flatMap((block) => block.scenarios.filter((scenario) => scenario !== audit));
  if (audit) ordered.push(audit);
  return {
    name: TEST_NAME,
    description:
      "Una sola prueba de usabilidad con los escenarios de los tres roles que usan GOM, en el orden real de trabajo: SoporteAdmin (S1–S5: alta de personal y asignación de espacios), TecnicoOperativo (E1–E6 preparar un equipo; O1–O4 planear y operar; A1–A4 seguimiento y análisis), Laboratorista (L1–L6: su trabajo diario) y cierre del SoporteAdmin (S6: auditoría). Alcance según la matriz de roles aprobada de GOM y el ADR-007. Fuera de alcance por ser solo del Admin: Configuraciones, Soporte, Periodos académicos y crear o editar roles.",
    profile: "SoporteAdmin, TecnicoOperativo y Laboratorista",
    profiles:
      "Tres perfiles, un bloque de escenarios para cada uno, aplicado a personas de ese perfil: SoporteAdmin (administra el sistema a nivel operativo), TecnicoOperativo (responsable técnico de espacios físicos) y Laboratorista (ejecuta y registra el mantenimiento). Cada participante hace solo los escenarios de su rol.",
    eligibility:
      "Personas que desempeñan alguno de los tres roles en la institución y que usarían GOM para ese trabajo. Cada participante se asigna al bloque de escenarios de su rol. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    context:
      "Desviación consciente del Máster, por decisión del responsable: una sola prueba con " +
      ordered.length +
      " escenarios (el Máster recomienda no más de 6 por prueba y pruebas separadas por grupos distintos). Cada participante solo hace los de su rol, así que en la práctica ve de 4 a 10; el facilitador puede partirlos en sesiones o pausas si la fatiga lo exige. En las descripciones internas, «prueba 1» a «prueba 5» se refiere a los bloques S (SoporteAdmin), E, O, A (TecnicoOperativo) y L (Laboratorista). Orden de aplicación: S1–S5, E1–E6, O1–O4, A1–A4, L1–L6 y por último S6 (auditoría: necesita los registros del Laboratorista). Los límites de tiempo son estimaciones que se calibran con el piloto.",
    scenarios: ordered,
  };
}

async function main() {
  console.log("Sembrando la ronda 1 de usabilidad de GOM (una sola prueba)...");

  const set = await prisma.heuristicSet.findFirst({ where: { source: "NIELSEN", isSystem: true } });
  const config = set ? await prisma.evaluationConfig.findFirst({ where: { heuristicSetId: set.id } }) : null;
  if (!set || !config) throw new Error("Falta el set de Nielsen. Ejecuta antes: npm run db:seed");

  await removeObsoleteIfEmpty();

  const definition = buildSingleProject();
  const existing = await prisma.project.findFirst({ where: { name: definition.name } });
  if (existing) {
    console.log(`  · Omitido (ya existe): ${definition.name}`);
    return;
  }

  // Control de calidad de las tarjetas con las mismas comprobaciones de la aplicación.
  for (const scenario of definition.scenarios) {
    const errors = analyzeScenarioCard(scenario.scenarioCard).filter((issue) => issue.level === "error");
    if (errors.length > 0) {
      throw new Error(`La tarjeta ${scenario.code} incumple el criterio: ${errors[0].message}`);
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
          userTypes: USER_TYPES,
          projectMoment:
            "Fase 2 del proyecto GOM. Primera ronda de pruebas con usuarios sobre las mejoras ya construidas, en el ambiente de pruebas.",
          purpose:
            "Descubrir errores de usabilidad al realizar los escenarios de uso más relevantes de cada rol, en el orden en que realmente se trabaja en GOM, antes de corregir y volver a probar.",
          context: `${definition.context} ${DATA_NOTE}`,
          plannedParticipants: 5,
          profiles: definition.profiles,
          eligibilityCriteria: definition.eligibility,
          totalDurationMinutes: 60,
          environment: "PHYSICAL",
          severityCriteria: DEFAULT_SEVERITY_CRITERIA,
          satisfactionScale: DEFAULT_SATISFACTION_SCALE,
          participantInstructions: INSTRUCTIONS,
          dataToCollect:
            "Por escenario y participante: completado o no, tiempo en tarea, errores críticos y no críticos, pensamientos en voz alta, satisfacción de 1 a 10. Al final, preguntas para entender conductas puntuales. No se hacen encuestas.",
          // Quedan vacíos a propósito (el documento-guía los marca como pendientes): responsables, contacto, lugar, fechas,
          // reclutamiento, retribución, medios técnicos, sistemas de registro, roles del equipo, texto de consentimiento,
          // derechos de imagen, protección de datos, conservación y código ético.
        },
      },
      scenarios: {
        create: definition.scenarios.map((scenario, index) => ({ orderIndex: index, ...scenario })),
      },
    },
  });
  console.log(`  ✓ Creado: ${definition.name} (${definition.scenarios.length} escenarios)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
