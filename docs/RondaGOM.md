# Ronda 1 de usabilidad de GOM

Prueba de usabilidad de GOM (Gestión y Optimización de Mantenimiento, I.U. Pascual Bravo) cargada con `npm run db:seed:gom` (`prisma/seed-gom.ts`). Requiere `npm run db:seed` antes. Es **una sola prueba con tres roles**; cada participante hace solo los escenarios de su rol.

## Cómo se construyó

- Alcance de cada rol: matriz de roles aprobada de GOM (`MatrizDeRoles.aprobada.txt`) y ADR-007 del repositorio de GOM. Quedan fuera por ser solo del Admin: Configuraciones, Soporte, Periodos académicos y crear o editar roles.
- Tarjetas validadas con `analyzeScenarioCard`: el seed falla si una tarjeta incumple (menciona «tarea», es dirigida o informa del tiempo).
- Orden lógico: SoporteAdmin da acceso y asigna espacios; el TecnicoOperativo parametriza (bien de SEVEN → equipo, ficha, frecuencia, actividades y checklist, plan maestro), planea y opera, y hace seguimiento; el Laboratorista ejecuta y registra.

## Escenarios (17)

| Rol | Escenarios |
|---|---|
| SoporteAdmin | S1 alta del técnico y del laboratorista · S2 asignar espacios al técnico · S3 reenviar correo y cambiar rol · S4 reporte de auditoría |
| TecnicoOperativo | E1 bien de SEVEN a equipo con tipo · E2 ficha técnica (estado, componentes, documentos) · E3 criterios y calificación de frecuencia · E4 actividades y checklist · E5 plan maestro y equipo guía · O1 asignar al laboratorista, programación y brigada · O2 registro de actividades y no programado · A1 histórico y reportes · A2 evaluación tecnológica |
| Laboratorista | L1 activar la cuenta · L2 jornada y registro sin novedades · L3 falla grave con correctivo · L4 no programado e histórico |

Cada escenario agrupa funciones relacionadas para acercarse al tope de seis del Máster. El técnico hace 9: es una desviación declarada (ver `FundamentoMetodologico.md`, «Decisiones en contra»).

## Datos de partida

Cada participante usa sus propios datos reales de piloto. Los escenarios encadenados continúan con el mismo equipo y las mismas personas: el facilitador anota en el campo «Notas» del participante la placa, el tipo y las personas usadas. Antes de cada sesión se comprueba que tiene lo necesario (por ejemplo, un bien de SEVEN que aún no esté en GOM). Lo guardado en el ambiente de pruebas permanece. S3 cambia un rol: usar una cuenta distinta de la del escenario L1. E3 edita criterios globales: acordar el ajuste antes y restaurarlo si hace falta.

## Documento-guía diligenciado (2026-11-11)

Google Meet con pantalla compartida y grabación; del 2026-11-11 al 2026-11-13; facilitador Jorge Andrés Ramírez Sierra (Ingeniero de Software Senior, SICAU) y observador Gerónimo Álvarez (QA de SICAU); participantes designados por el solicitante (Juan Guillermo Rojas); datos de uso exclusivo del equipo de SICAU y solo para GOM; conservación según la política de tratamiento de datos de la universidad; sin retribución; contacto por el chat de Meet. El texto del consentimiento, el código ético, la versión («1.0 · 2026-11-11») y las palabras clave los redactó el agente: revisarlos.

**Pendiente:** revisión legal del consentimiento (la casilla «Revisado por asesoría legal» sigue sin marcar y el PDF sale como borrador).

## Versión de GOM contra la que se redactaron los escenarios

Ambiente de pruebas con la versión `70095fc` (2026-11-11): incluye el cierre del correctivo con «Registrar trabajo», la ventana de registro por frecuencia, «Crear actividad nueva» dentro del checklist, «Editar» y «Cambió en SEVEN» en Bienes de SEVEN y el correo institucional automático al crear un usuario. Las notas de esa entrega están en `docs/Pruebas/Entregas/2026-11-11_70095fc.md` del repositorio de GOM.

**No incluido a propósito:** la «reversa» de un registro guardado por error (Admin y SoporteAdmin, desde el Histórico) se desarrolló después de esa versión y necesita la migración `AgregarReversaAlRegistroDeActividades`. Si se publica antes de las sesiones, conviene agregar un escenario S5 al bloque del SoporteAdmin («corregir un registro guardado por error, dejando el motivo»).

**Ventana de registro:** un técnico o laboratorista solo puede registrar un mantenimiento dentro de la ventana de su frecuencia (mensual 7 días antes del vencimiento, semestral 15, anual 30). Antes de O2 y L2 el facilitador comprueba que el equipo esté dentro de ella.

## Cómo hacer una sesión con un participante real

1. Participantes → agregar (código, rol de la lista, elegibilidad, consentimiento, grabación). Marcar «Es el piloto» solo en el ensayo.
2. Informe → descargar la hoja del observador y las tarjetas del rol.
3. Participantes → «Iniciar sesión»: facilitador y fecha; por cada escenario, leer la tarjeta, iniciar el cronómetro, marcar el resultado y guardar.
4. Preguntas finales al terminar; después registrar problemas (principio, gravedad, recomendación) y descargar el informe.

## Si hay que cambiar algo

- Un escenario: pantalla Escenarios (el rol es el campo «Rol o perfil»). Para que el cambio viaje a otra copia, editar también `prisma/seed-gom.ts` (`BLOCKS`).
- Un dato del documento-guía: pantalla Documento-guía y, si debe sobrevivir a un reseed, `main()` en `seed-gom.ts`.
- Reseed: solo reemplaza la prueba si no tiene participantes ni problemas.
- Defectos hallados en la simulación del 2026-11-11 y ya corregidos: sesión filtrada por rol, perfil como lista, meta por rol, tarjetas por rol, aviso de escenarios por rol y S4 dentro del bloque SoporteAdmin.
