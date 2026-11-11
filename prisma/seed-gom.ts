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
 *   4 TecnicoOperativo «Seguimiento» → 5 Laboratorista.
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
  role?: string;
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
  // ───────────────────────────────────────────────── SoporteAdmin
  {
    name: "SoporteAdmin",
    description: "",
    profile: "SoporteAdmin",
    profiles: "",
    eligibility: "",
    context: "",
    scenarios: [
      {
        code: "S1",
        title: "Dar acceso al técnico responsable y a su laboratorista",
        userGoal: "Que quien configura el mantenimiento y quien lo ejecuta puedan entrar a GOM, cada uno con lo que le corresponde.",
        description:
          "Ruta esperada: Seguridad › Usuarios › Nuevo, dos veces (persona, correo, contraseña temporal; rol TecnicoOperativo y rol Laboratorista; consultar Roles para entender qué permite cada uno). Depende de: las personas existen en SICAU. Deja listo: las cuentas que usan los escenarios E, O y L. Se envían correos de confirmación reales. Agrupa: alta de técnico + alta de laboratorista.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 14,
        completionMilestone:
          "Los dos usuarios quedan guardados (uno con el rol TecnicoOperativo y otro con el rol Laboratorista), aparecen en el listado de usuarios y el sistema confirma el envío del correo de activación de cada uno.",
        scenarioCard:
          "Esta semana se incorpora a tu institución una persona que será la responsable técnica de varios laboratorios, y con ella trabajará quien se encarga de hacer los mantenimientos en esos laboratorios. La responsable técnica necesita configurar los equipos, planear su mantenimiento y hacerles seguimiento. Quien hace los mantenimientos solo debe poder dejar registrado su trabajo, nada más. Tú eres quien les da acceso al sistema. Decides dejar listas las dos cuentas hoy, para que puedan activarlas y empezar a trabajar.",
      },
      {
        code: "S2",
        title: "Asignar al técnico los espacios de los que es responsable",
        userGoal: "Que el técnico encuentre, al entrar, los equipos de los laboratorios que le corresponden.",
        description:
          "Ruta esperada: Personal › Asignación (persona, bloque y espacios físicos). Depende de: S1. Deja listo: el alcance del técnico, necesario para todos sus escenarios. Según el ADR-007 es el SoporteAdmin quien asigna espacios al técnico.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone:
          "La persona queda asignada al bloque y a los espacios correctos y aparece en el listado de personal asignado.",
        scenarioCard:
          "El técnico recién incorporado ya tiene cuenta, pero todavía no puede ver ningún equipo: el sistema aún no sabe de cuáles laboratorios es responsable. Tú sabes en qué bloque está y qué espacios le corresponden. Decides dejar registrado a cuáles queda asignado, para que cuando entre encuentre los equipos que debe atender.",
      },
      {
        code: "S3",
        title: "Resolver problemas de acceso y cambios de cargo",
        userGoal: "Que una persona pueda activar su cuenta y que su acceso refleje su cargo actual, sin crearle otra cuenta.",
        description:
          "Ruta esperada: Seguridad › Usuarios › reenviar la confirmación de la cuenta; Usuarios › Editar (rol). Depende de: S1. Se envía un correo real. Nota para el facilitador: para el cambio de rol usar una cuenta distinta de la del escenario L1, para no alterarla. Desbloquear una cuenta queda fuera de alcance (requiere una cuenta bloqueada preparada). Agrupa: reenviar correo + cambiar rol.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 10,
        completionMilestone:
          "El sistema confirma el reenvío del correo de activación a la cuenta indicada y la otra persona queda con el rol nuevo guardado, visible en el listado de usuarios.",
        scenarioCard:
          "Hoy te llegan dos casos. El nuevo técnico te escribe preocupado: pasaron horas y no le llegó el correo para activar su cuenta, así que no puede entrar. Además, una persona de tu equipo, que solo registraba mantenimientos, asume desde hoy la responsabilidad técnica de otro bloque y su acceso debe reflejar su nuevo cargo. Quieres resolver ambos casos sin crear cuentas nuevas ni pedirle a nadie que se registre otra vez.",
      },
      {
        code: "S4",
        title: "Reunir la evidencia de los mantenimientos para una auditoría",
        userGoal: "Entregar a control interno un archivo con lo que se hizo, quién lo hizo y qué se encontró.",
        description:
          "Ruta esperada: Actividades › Histórico › Reporte de auditoría (Excel con ejecuciones y hallazgos; Admin y SoporteAdmin). Depende de: que el ambiente de pruebas tenga registros de mantenimiento (los datos de prueba existentes bastan; no hace falta esperar a la prueba del Laboratorista). Con el histórico vacío el sistema avisa y no descarga: ese caso se prueba aparte.",
        startingPoint: "Sesión iniciada como SoporteAdmin, en la pantalla de inicio.",
        timeLimitMinutes: 6,
        completionMilestone:
          "Se descarga el archivo de auditoría y el participante confirma, al abrirlo, que contiene lo pedido (quién, cuándo y hallazgos).",
        scenarioCard:
          "La oficina de control interno te pidió soporte de los mantenimientos que se hicieron durante el periodo académico actual: quién los realizó, cuándo y qué fallas se encontraron. Quieres entregarles hoy un archivo que puedan revisar con calma, sin que tengas que armarlo a mano.",
      },
    ],
  },
  // ───────────────────────────────────────────────── TecnicoOperativo · Preparar
  {
    name: "TecnicoOperativo · Preparar",
    description: "",
    profile: "TecnicoOperativo",
    profiles: "",
    eligibility: "",
    context: "",
    scenarios: [
      {
        code: "E1",
        title: "Dejar un bien de SEVEN como equipo de GOM",
        userGoal: "Poder dar mantenimiento a un bien que hoy solo existe en el inventario institucional.",
        description:
          "Ruta esperada: Inventario › Bienes de SEVEN (filtrar y marcar como equipo) y su tipo de equipo para mantenimiento; si el tipo no existe, se crea desde ese mismo paso. Depende de: S1 y S2 y de un bien de SEVEN que aún no sea equipo. Deja listo: el equipo con su tipo, que usan E2 a E5. Riesgo conocido (L-03): el tipo se presenta como paso opcional.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 10,
        completionMilestone:
          "El bien aparece en Equipos con su tipo de equipo para mantenimiento asignado, sin avisos de datos pendientes.",
        scenarioCard:
          "En tu laboratorio hay un bien que sí está en el inventario institucional, pero todavía no figura en GOM, y por eso no puedes planear su mantenimiento. Quieres incorporarlo y dejarlo clasificado en el sistema como el tipo de equipo que realmente es, para poder empezar a trabajar con él. Decides hacerlo hoy.",
      },
      {
        code: "E2",
        title: "Completar la ficha técnica del equipo",
        userGoal: "Que quien consulte el equipo encuentre su estado, sus partes y su documentación.",
        description:
          "Ruta esperada: Inventario › Equipos › Editar (ficha técnica: estado y datos del equipo, pestaña de componentes técnicos con «Agregar componente», pestaña de documentos con carga de archivos, enlace externo o ficha técnica). Depende de: E1 (sin tipo de equipo la ficha no se puede guardar). Los componentes alimentan el hallazgo del laboratorista (L3). Los documentos se cargan con archivos reales del participante (PDF) o un enlace; no registrar documentos ajenos al piloto.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 14,
        completionMilestone:
          "La ficha del equipo queda guardada con su estado actualizado, al menos dos componentes técnicos y al menos un documento (archivo o enlace) visibles al reabrir el equipo.",
        scenarioCard:
          "El equipo que acabas de incorporar ya aparece en GOM, pero su información está casi vacía. Quieres que cualquiera que lo consulte sepa en qué estado está, de qué partes importantes se compone y encuentre a mano sus manuales y documentos del fabricante. Decides dejar completa su ficha hoy.",
      },
      {
        code: "E3",
        title: "Ajustar los criterios de frecuencia y definir cada cuánto necesita mantenimiento el equipo",
        userGoal: "Saber cada cuánto debe revisarse el equipo para programarlo en el semestre.",
        description:
          "Ruta esperada: Mantenimiento › Criterios de evaluación de frecuencia (consultar, editar el peso o la descripción de un criterio y verificar que la suma siga en 100 %) y luego Mantenimiento › Frecuencias de mantenimiento (consultar el equipo, abrir la ficha de calificación, calificar los criterios y guardar). Depende de: E1. Deja listo: la frecuencia que usa E4 (con estas respuestas debe salir alta). Los criterios son globales: el cambio afecta a todos los equipos, así que el facilitador acuerda antes con el participante qué ajuste hará (o lo deja igual) y se restaura al terminar si hace falta. Agrupa: criterios + calificación.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 16,
        completionMilestone:
          "Los criterios quedan revisados con su suma en 100 %, todos los criterios del equipo quedan calificados y guardados y la lista muestra el total y la frecuencia calculada del equipo.",
        scenarioCard:
          "El equipo que acabas de incorporar se usa casi todos los días, una falla detendría varias clases y el fabricante pide revisarlo con frecuencia. Antes de evaluarlo, quieres comprobar que los criterios con los que el sistema decide la frecuencia reflejan lo que de verdad importa en tu institución, y ajustarlos si no es así. Para programar su mantenimiento en el semestre necesitas que el sistema te diga cada cuánto debe revisarse. Decides evaluarlo y conocer ese resultado.",
      },
      {
        code: "E4",
        title: "Crear las actividades y armar la rutina de revisión del tipo de equipo",
        userGoal: "Que quien dé mantenimiento a ese tipo de equipo vea exactamente qué debe revisar según la frecuencia que le toca.",
        description:
          "Ruta esperada: Mantenimiento › Actividades › Nueva (nombre y detalles, varias) y luego Mantenimiento › Checklist (fila del tipo › Configurar o Editar › pestaña de la frecuencia › agregar o activar actividades › guardar). Depende de: E1 (tipo) y E3 (frecuencia). Deja listo: el checklist que copia el plan y que ve el laboratorista. El participante define las actividades con su conocimiento del equipo; el facilitador no las dicta. Agrupa: crear actividades + checklist.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 16,
        completionMilestone:
          "Al menos tres actividades nuevas quedan creadas y activas, y el tipo de equipo queda con ellas activas en la frecuencia calculada para el equipo, con el guardado confirmado por el sistema.",
        scenarioCard:
          "Sabes muy bien qué debe revisarse en ese equipo cada vez que se le da mantenimiento. Cuando buscas esas actividades en el sistema, notas que algunas todavía no están. Quieres dejarlas creadas y, además, que cada vez que alguien le dé mantenimiento a ese tipo de equipo vea exactamente qué debe revisar, de acuerdo con cada cuánto le toca, para que nadie tenga que adivinar.",
      },
      {
        code: "E5",
        title: "Dejar definido el plan del equipo y replicar lo hecho en equipos iguales",
        userGoal: "Tener formalmente definido cómo se le dará mantenimiento al equipo, sin repetir todo en los equipos idénticos.",
        description:
          "Ruta esperada: Mantenimiento › Plan maestro › Nuevo (bloque, equipo, duración, trabajo interno o contratado, valores y responsable); luego Inventario › Equipos › barra de guía del equipo ya parametrizado (aplicar la configuración a otros equipos) o, desde otro equipo, importar la configuración. Depende de: E1 a E4 y de que existan otros equipos iguales en GOM (verificar antes con el participante). Agrupa: plan maestro + equipo guía.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 16,
        completionMilestone:
          "El plan del equipo queda guardado, con las actividades de su frecuencia, y al menos un segundo equipo queda con la configuración copiada del primero y vinculado a su equipo guía.",
        scenarioCard:
          "Con el equipo clasificado, su ficha completa, su frecuencia definida y su lista de actividades, ya puedes dejar formalmente establecido cómo se le va a dar mantenimiento: quién será el responsable, cuánto tiempo toma y si lo hará personal propio o un contratista. Además, en tu laboratorio hay otros equipos idénticos que necesitan lo mismo y repetir todo uno por uno sería larguísimo. Quieres dejar listo el plan y que los demás queden con la misma configuración aprovechando lo que ya hiciste.",
      },
    ],
  },
  // ───────────────────────────────────────────────── TecnicoOperativo · Planear y operar
  {
    name: "TecnicoOperativo · Planear y operar",
    description: "",
    profile: "TecnicoOperativo",
    profiles: "",
    eligibility: "",
    context: "",
    scenarios: [
      {
        code: "O1",
        title: "Organizar al laboratorista y programar el mantenimiento",
        userGoal: "Que el laboratorista vea sus equipos y que el mantenimiento tenga fechas y un grupo a cargo.",
        description:
          "Ruta esperada: Personal › Asignación (el técnico asigna a su laboratorista espacios de los suyos; no crea cuentas) y Mantenimiento › Programación de planes y/o Brigadas (crear o elegir una brigada y asociarle el plan). Depende de: S1 y S2 y plan del equipo (E5). Es la parte menos obvia del flujo (pantallas poco enlazadas). Deja listo: el alcance del laboratorista para L2 a L4. Agrupa: asignación del laboratorista + programación y brigada.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 16,
        completionMilestone:
          "El laboratorista queda asignado a espacios que están dentro de los del técnico y el plan queda con su programación de fechas (inicial y final), asociado a la brigada elegida o creada.",
        scenarioCard:
          "Tu laboratorista ya tiene su cuenta, pero al entrar no ve ningún equipo porque aún no tiene laboratorios asignados, y eres tú quien decide en cuáles trabaja, dentro de los que están a tu cargo. Además, el plan del equipo existe pero nadie sabe en qué fechas debe hacerse el mantenimiento ni quién lo atiende. Quieres dejar fijado el periodo del semestre en que se hará y que el mismo grupo que atiende los demás equipos del bloque se encargue también de este. Decides dejarlo todo organizado hoy.",
      },
      {
        code: "O2",
        title: "Registrar un mantenimiento realizado y un daño imprevisto",
        userGoal: "Dejar constancia de lo hecho y de un equipo dañado para que se repare.",
        description:
          "Ruta esperada: Actividades › Registro de actividades (Mi trabajo › equipo › resolver cada actividad, una como «No aplica» › guardar) y Actividades › Mantenimientos no programados › Nuevo (equipo, tipo de mantenimiento, responsable). Depende de: plan del equipo (E5) y un segundo equipo en sus espacios. No registrar como hechas actividades que el participante no haya realizado en el piloto sin avisarlo. Deja listo: registros y un correctivo para A1. Agrupa: registro de actividades + no programado.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 16,
        completionMilestone:
          "El registro del equipo queda guardado, con una actividad como «No aplica», y el mantenimiento no programado queda guardado y aparece en el listado.",
        scenarioCard:
          "Hoy hiciste el mantenimiento del equipo que preparaste. Todo estuvo en orden, salvo una actividad de la lista que no aplica a este equipo porque no tiene ese componente. Quieres dejar constancia de lo que hiciste. Al terminar, descubres que otro equipo de tu laboratorio dejó de funcionar y que no estaba programado para ninguna revisión: necesita que se repare y que quede constancia de lo ocurrido. Decides dejar ambas cosas en el sistema.",
      },
    ],
  },
  // ───────────────────────────────────────────────── TecnicoOperativo · Seguimiento
  {
    name: "TecnicoOperativo · Seguimiento",
    description: "",
    profile: "TecnicoOperativo",
    profiles: "",
    eligibility: "",
    context: "",
    scenarios: [
      {
        code: "A1",
        title: "Dar cuenta de la gestión: histórico y reportes",
        userGoal: "Responder con datos qué se hizo, qué equipos hay y cuántos daños imprevistos ocurrieron.",
        description:
          "Ruta esperada: Actividades › Histórico (periodo actual, bloque; filtros al instante; desplegar una visita), Reportes › Equipos (bloque o espacio › descargar el Excel) y Reportes › Mantenimientos no programados (consultar, detalle y descarga). Depende de: registros y correctivo de O2. Con datos vacíos los reportes avisan y no descargan. Agrupa: histórico + reporte de equipos + reporte de no programados.",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 16,
        completionMilestone:
          "El participante muestra el histórico del periodo y del bloque, descarga el listado de equipos del bloque y consulta el reporte de no programados, y confirma con sus propias palabras cuántas visitas, equipos y daños imprevistos hay.",
        scenarioCard:
          "Esta semana te piden tres cosas. La coordinación quiere saber qué mantenimientos se hicieron en uno de tus bloques durante el periodo actual y si hubo fallas. Para una reunión de mañana necesitas llevar el listado de los equipos de ese bloque, con su estado, en un archivo que puedas abrir y compartir. Y tu jefe te pregunta cuántos daños imprevistos hubo este periodo y de qué equipos fueron. Quieres responder con datos, no de memoria.",
      },
      {
        code: "A2",
        title: "Valorar si un equipo ya quedó atrasado tecnológicamente",
        userGoal: "Tener una valoración objetiva para decidir si un equipo debe reemplazarse.",
        description:
          "Ruta esperada: Mantenimiento › Evaluación tecnológica (equipo › variables › calcular y guardar). Depende de: calificación de frecuencia del equipo (E3: el criterio 1 debe estar calificado).",
        startingPoint: "Sesión iniciada como TecnicoOperativo, en la pantalla de inicio.",
        timeLimitMinutes: 10,
        completionMilestone: "El análisis del equipo queda guardado con su resultado y aparece en el listado de evaluaciones.",
        scenarioCard:
          "Un equipo de tu laboratorio ya es muy antiguo y cada vez falla más. Antes de pedir presupuesto para reemplazarlo, necesitas una valoración objetiva de qué tan vigente sigue siendo su tecnología. Decides evaluarlo en el sistema y obtener ese resultado.",
      },
    ],
  },
  // ───────────────────────────────────────────────── Laboratorista
  {
    name: "Laboratorista",
    description: "",
    profile: "Laboratorista",
    profiles: "",
    eligibility: "",
    context: "",
    scenarios: [
      {
        code: "L1",
        title: "Activar la cuenta y entrar por primera vez",
        userGoal: "Poder usar el sistema nuevo para registrar su trabajo.",
        description:
          "Ruta esperada: correo de activación › confirmar la cuenta › iniciar sesión con la clave temporal › cambiar la clave. Depende de: S1. El participante escribe sus propias claves; nadie del equipo las ve ni las anota.",
        startingPoint: "El participante tiene el correo de activación en su buzón; el navegador está en la página de inicio de sesión.",
        timeLimitMinutes: 8,
        completionMilestone: "El participante inicia sesión, cambia la clave temporal y llega a la pantalla de inicio con sus opciones de trabajo.",
        scenarioCard:
          "Te avisaron que, desde hoy, el mantenimiento de los equipos de tu laboratorio se registra en un sistema nuevo y que tu acceso ya fue creado. Te llegó un correo a tu buzón. Quieres entrar al sistema por primera vez y dejar tu cuenta lista para usarla en tu trabajo.",
      },
      {
        code: "L2",
        title: "Empezar la jornada y registrar un mantenimiento sin novedades",
        userGoal: "Atender primero lo más urgente y dejar constancia de lo hecho.",
        description:
          "Ruta esperada: Actividades › Registro de actividades (Mi trabajo: vencidos, por hacer y al día › equipo › marcar lo hecho o «Marcar todo como hecho» › «No aplica» en una actividad › guardar). Depende de: espacios asignados (O1) y planes (E5). Si no ve equipos es un hallazgo de alcance, no un error del participante. Agrupa: ver lo urgente + registro sin novedades.",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 14,
        completionMilestone:
          "El participante identifica el equipo con el mantenimiento más urgente, lo registra con una actividad como «No aplica» y aparece la confirmación del guardado.",
        scenarioCard:
          "Empiezas tu jornada en el laboratorio. Sabes que tienes mantenimientos pendientes y que algunos ya van atrasados, y no quieres que se te venzan los más urgentes. Decides revisar qué equipos te tocan y empezar por el más urgente. Al terminar su mantenimiento, todo estuvo en orden, salvo una actividad de la lista que no aplica porque el equipo no tiene ese componente. Quieres dejar constancia de lo que hiciste para que quede en el sistema.",
      },
      {
        code: "L3",
        title: "Avisar de una falla grave y pedir su reparación",
        userGoal: "Que una falla grave quede registrada y alguien la atienda de inmediato.",
        description:
          "Ruta esperada: Registro de actividades › actividad «Con hallazgo» › gravedad crítica › qué pasó › componente (usa los componentes de la ficha, E2) › pedir el correctivo › guardar. Depende de: L2. Con gravedad leve el correctivo se rechaza: es una regla del sistema.",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 8,
        completionMilestone: "El registro se guarda con el hallazgo crítico (qué pasó y componente) y se crea el mantenimiento no programado enlazado.",
        scenarioCard:
          "Mientras revisabas un equipo notaste una falla grave: ya no funciona de manera segura y debe dejar de usarse hasta que lo reparen. Quieres que quede registrada tal como la viste y que quien debe repararlo sepa que tiene que atenderla de inmediato.",
      },
      {
        code: "L4",
        title: "Reportar un equipo dañado y revisar lo que registraste",
        userGoal: "Pedir la reparación de un equipo y poder contar con precisión lo registrado en el mes.",
        description:
          "Ruta esperada: Actividades › Mantenimientos no programados › Nuevo y luego Actividades › Histórico (periodo actual; filtros al instante; desplegar una visita). Depende de: un equipo en sus espacios y de L2 y L3. Es el otro camino hacia un correctivo (distinto de L3). Agrupa: no programado + histórico.",
        startingPoint: "Sesión iniciada como Laboratorista, en la pantalla de inicio.",
        timeLimitMinutes: 12,
        completionMilestone:
          "El mantenimiento no programado queda guardado y aparece en el listado, y el participante identifica en el histórico sus registros de esta sesión, incluido el hallazgo.",
        scenarioCard:
          "Un compañero te cuenta que otro equipo de tu laboratorio no encendió esta mañana y que no estaba programado para ninguna revisión. Quieres que un técnico lo repare cuanto antes y lo dejas reportado en el sistema. Al terminar la semana, tu coordinador te pregunta qué mantenimientos registraste en tu laboratorio este mes y si encontraste fallas, y quieres revisar tu propio registro para contárselo con precisión.",
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
 */
function buildSingleProject(): SeedProject {
  const ordered = BLOCKS.flatMap((block) => block.scenarios.map((scenario) => ({ ...scenario, role: block.profile })));
  return {
    name: TEST_NAME,
    description:
      "Una sola prueba de usabilidad con los escenarios de los tres roles que usan GOM, en el orden real de trabajo: SoporteAdmin (S1–S4: alta de personal, asignación de espacios, soporte de cuentas y reporte de auditoría), TecnicoOperativo (E1–E5 preparar un equipo, con ficha técnica y criterios de frecuencia; O1–O2 planear y operar; A1–A2 seguimiento y análisis), Laboratorista (L1–L4: su trabajo diario). Alcance según la matriz de roles aprobada de GOM y el ADR-007. Fuera de alcance por ser solo del Admin: Configuraciones, Soporte, Periodos académicos y crear o editar roles.",
    profile: "SoporteAdmin, TecnicoOperativo y Laboratorista",
    profiles:
      "Tres perfiles, un bloque de escenarios para cada uno, aplicado a personas de ese perfil: SoporteAdmin (administra el sistema a nivel operativo), TecnicoOperativo (responsable técnico de espacios físicos) y Laboratorista (ejecuta y registra el mantenimiento). Cada participante hace solo los escenarios de su rol.",
    eligibility:
      "Personas que desempeñan alguno de los tres roles en la institución y que usarían GOM para ese trabajo. Cada participante se asigna al bloque de escenarios de su rol. No se usan criterios sociodemográficos; solo se podrán añadir cuotas de diversidad.",
    context:
      "Desviación consciente del Máster, por decisión del responsable: una sola prueba con " +
      ordered.length +
      " escenarios (el Máster recomienda no más de 6 por prueba y pruebas separadas por grupos distintos). Cada participante solo hace los de su rol, así que en la práctica ve de 4 a 9; cada escenario agrupa varias funciones relacionadas para acercarse a lo recomendado; el facilitador puede partirlos en sesiones o pausas si la fatiga lo exige. En las descripciones internas, los códigos S, E, O, A y L indican el bloque: S (SoporteAdmin), E, O, A (TecnicoOperativo) y L (Laboratorista). Orden de aplicación: S1–S4, E1–E5, O1–O2, A1–A2, L1–L4. Cada participante hace solo el bloque de su rol, completo en una sola sesión. Los límites de tiempo son estimaciones que se calibran con el piloto.",
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
    const used = await prisma.project.findFirst({
      where: { id: existing.id },
      include: { _count: { select: { participants: true, issues: true } } },
    });
    if (used && (used._count.participants > 0 || used._count.issues > 0)) {
      console.log(`  · Omitido (ya existe y tiene datos): ${definition.name}`);
      return;
    }
    await prisma.project.delete({ where: { id: existing.id } });
    console.log("  - Reemplazada la versión anterior sin datos.");
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
          totalDurationMinutes: 120,
          environment: "VIRTUAL",
          severityCriteria: DEFAULT_SEVERITY_CRITERIA,
          satisfactionScale: DEFAULT_SATISFACTION_SCALE,
          participantInstructions: INSTRUCTIONS,
          dataToCollect:
            "Por escenario y participante: completado o no, tiempo en tarea, errores críticos y no críticos, pensamientos en voz alta, satisfacción de 1 a 10. Al final, preguntas para entender conductas puntuales. No se hacen encuestas.",
          // 1. Identificación (datos confirmados por el responsable, 2026-11-11)
          responsibles:
            "Jorge Andrés Ramírez Sierra, Ingeniero de Software Senior de SICAU (facilitador y responsable de la prueba). Gerónimo Álvarez, equipo de QA de SICAU (observador). Solicitante del sistema: Juan Guillermo Rojas.",
          contact: "Chat de la videollamada de Google Meet de cada sesión.",
          location: "Remoto, por videollamada de Google Meet (herramienta institucional).",
          plannedDates: "Del 2026-11-11 al 2026-11-13.",
          version: "1.0 · 2026-11-11",
          confidentiality:
            "La información recopilada es de uso exclusivo del equipo de SICAU y se refiere únicamente al sistema GOM. No se comparte fuera de ese equipo.",
          keywords: "GOM, usabilidad, mantenimiento de equipos, SoporteAdmin, TecnicoOperativo, Laboratorista",
          executiveSummary:
            "Prueba de usabilidad de GOM con usuarios reales de los tres roles que lo usan (SoporteAdmin, TecnicoOperativo y Laboratorista), en sesiones remotas por Google Meet. Cada participante resuelve los escenarios de su rol; el equipo registra si los completa, cuánto tarda, qué errores comete y qué dice, para detectar problemas de usabilidad que corregir antes de la siguiente entrega.",
          // 4. Metodología
          recruitmentProcedure:
            "Los participantes los designa el solicitante, Juan Guillermo Rojas, entre el personal y los contratistas de la institución que desempeñan el rol de cada bloque. Se les invita a una sesión por Google Meet.",
          incentive: "Sin retribución: participan como parte de sus funciones en la institución.",
          technicalMeans:
            "Google Meet con pantalla compartida y audio; el participante usa su propio equipo y navegador, con el ambiente de pruebas de GOM. El facilitador y el observador usan esta herramienta para la guía, las tarjetas y la hoja de observación.",
          recordingSystems:
            "Grabación de la sesión en Google Meet (pantalla y voz) con aviso previo, y hoja de observación del observador por cada participante. Los hallazgos se registran en esta herramienta.",
          teamRoles:
            "Facilitador: Jorge Andrés Ramírez Sierra (presenta la prueba, entrega las tarjetas y atiende las preguntas al final). Observador: Gerónimo Álvarez (registra hechos en la hoja de observación sin intervenir).",
          // 5. Aspectos éticos y legales (legalReviewDone queda en falso: el texto se apoya en lo ya aceptado, pendiente de revisión legal)
          consentText:
            "Participas en una prueba de usabilidad del sistema GOM. Se evalúa el sistema, no a ti: no hay respuestas correctas ni incorrectas. Se grabará la pantalla y la voz de la sesión de Google Meet. Puedes detener la prueba cuando quieras. Como personal o contratista de la institución, ya aceptaste el tratamiento de datos de la universidad y el uso de tu imagen; la información de esta prueba se usará exclusivamente por el equipo de SICAU y solo en relación con GOM.",
          imageRights:
            "El personal y los contratistas de la institución ya aceptaron el uso de su imagen. Las grabaciones de estas sesiones se usan solo para el análisis de la prueba por el equipo de SICAU.",
          dataProtection:
            "La universidad cuenta con una política de tratamiento de datos que el personal y los contratistas ya aceptaron. Los datos de la prueba se usan exclusivamente por el equipo de SICAU y para el sistema GOM.",
          dataRetention: "Según la política de tratamiento de datos de la universidad.",
          ethicsCode:
            "El facilitador y el observador tratan al participante con respeto, evalúan el sistema y no a la persona, no inducen las respuestas ni ayudan durante los escenarios, no revelan el tiempo límite y mantienen la confidencialidad de lo observado.",
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
