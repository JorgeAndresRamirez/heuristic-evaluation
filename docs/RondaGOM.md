# Ronda 1 de usabilidad de GOM

Prueba de usabilidad de GOM (Gestión y Optimización de Mantenimiento, I.U. Pascual Bravo) cargada con `npm run db:seed:gom` (`prisma/seed-gom.ts`). Requiere `npm run db:seed` antes. Es **una sola prueba con tres roles**; cada participante hace solo los escenarios de su rol.

## Cómo se construyó

- Alcance de cada rol: matriz de roles aprobada de GOM (`MatrizDeRoles.aprobada.txt`) y ADR-007 del repositorio de GOM. Quedan fuera por ser solo del Admin: Configuraciones, Soporte, Periodos académicos y crear o editar roles.
- Tarjetas validadas con `analyzeScenarioCard`: el seed falla si una tarjeta incumple (menciona «tarea», es dirigida o informa del tiempo).
- Orden lógico: SoporteAdmin da acceso y asigna espacios; el TecnicoOperativo parametriza (bien de SEVEN → equipo, ficha, frecuencia, actividades y checklist, plan maestro), planea y opera, y hace seguimiento; el Laboratorista ejecuta y registra.

## Escenarios (18)

| Rol | Escenarios |
|---|---|
| SoporteAdmin | S1 alta del técnico y del laboratorista · S2 asignar espacios al técnico · S3 reenviar correo y cambiar rol · S4 reporte de auditoría · S5 reversa de un registro guardado por error |
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

**Escenario S5 (reversa):** la «reversa» de un registro guardado por error (Admin y SoporteAdmin, desde el Histórico) se desarrolló después de `70095fc` y necesita la migración `AgregarReversaAlRegistroDeActividades`. S5 solo se puede evaluar si el ambiente de pruebas ya tiene esa versión; si no, se omite en esa ronda (sin ella el botón «Revertir registro» no existe). La reversa no tiene deshacer y no procede en una visita que abrió un correctivo: usar una visita de prueba.

**Ventana de registro:** un técnico o laboratorista solo puede registrar un mantenimiento dentro de la ventana de su frecuencia (mensual 7 días antes del vencimiento, semestral 15, anual 30). Antes de O2 y L2 el facilitador comprueba que el equipo esté dentro de ella.

## Cómo hacer una sesión con un participante real

1. Pantalla del participante → revisar la bienvenida y el cierre (ya vienen escritos para GOM).
2. Participantes → agregar (código, rol de la lista, elegibilidad, consentimiento, grabación). Marcar «Es el piloto» solo en el ensayo.
3. Informe → descargar la hoja del observador del rol (para el segundo observador).
4. Participantes → «Iniciar sesión». En la videollamada de Meet, **compartir solo la pestaña de la pantalla del participante**: se abre con «Abrir la pantalla del participante» y es la que muestra la bienvenida, cada situación y el cierre. La ventana del facilitador (cronómetro, notas) no se comparte.
5. Desde la ventana del facilitador: «Mostrar la bienvenida» → por cada escenario, «Iniciar» (muestra la tarjeta al participante y arranca el cronómetro), marcar el resultado y «Guardar escenario» (el participante pasa a la pausa) → al final «Finalizar sesión» (muestra el cierre). Con «Marcar momento» se anotan instantes de la grabación.
6. Preguntas finales al terminar. Después, **Síntesis**: enlace de la grabación de Meet, marcadores y hallazgos con captura; y en Problemas, lo consolidado con gravedad y recomendación.
7. Informe: resumen para decidir, informe ejecutivo en PDF y hallazgos de la sesión en PDF.

## Si hay que cambiar algo

- Un escenario: pantalla Escenarios (el rol es el campo «Rol o perfil»). Para que el cambio viaje a otra copia, editar también `prisma/seed-gom.ts` (`BLOCKS`).
- Un dato del documento-guía: pantalla Documento-guía y, si debe sobrevivir a un reseed, `main()` en `seed-gom.ts`.
- Reseed: solo reemplaza la prueba si no tiene participantes ni problemas.
- Defectos hallados en la simulación del 2026-11-11 y ya corregidos: sesión filtrada por rol, perfil como lista, meta por rol, tarjetas por rol, aviso de escenarios por rol y S4 dentro del bloque SoporteAdmin.
