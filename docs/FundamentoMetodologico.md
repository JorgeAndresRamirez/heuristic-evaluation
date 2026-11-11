# Fundamento metodológico del módulo «Test de usabilidad»

Este documento dice **de dónde sale cada decisión** del módulo y qué hace la herramienta para que no se incumpla. Las fuentes son los materiales oficiales del Máster en Diseño de Experiencia de Usuario (UNIR):

| Sigla | Fuente |
|---|---|
| **ICU-T1** | Investigación centrada en el usuario · Tema 1 «La investigación como parte del proceso de diseño centrado en el usuario», sección 1.7 «Cómo documentar la investigación con usuarios» y 1.8 «Reclutar usuarios» |
| **ICU-T3** | Investigación centrada en el usuario · Tema 3 «El test de usabilidad» |
| **ICU-S3** | Investigación centrada en el usuario · Sesión «El test de usabilidad» (Prof. Dr. Ernesto del Valle) |
| **EUU-T6** | Experiencia de uso y usabilidad · Tema 6 «Usabilidad» (ISO 9241-11) |

> Las referencias por tema y sección son del material, no de esta herramienta. Si una cifra o regla importa para un informe formal, se contrasta con la fuente original.

## 1. Qué es (y qué no es) un test de usabilidad

- Es una técnica **cualitativa** basada en la **observación** de pocos usuarios haciendo tareas concretas; sirve para **descubrir errores de usabilidad** (ICU-T3, ICU-S3).
- **No** sustituye a la evaluación heurística: se complementan. La evaluación por expertos no es una metodología centrada en el usuario (ICU-T3). Por eso la herramienta mantiene ambas técnicas como tipos de proyecto distintos.
- **No** es una encuesta: «No podemos hacer una encuesta como parte de un test de usabilidad» (ICU-S3). Se observa, no se pide opinión.

## 2. Trazabilidad: regla del Máster → qué hace la herramienta

| Regla del Máster | Fuente | En la herramienta |
|---|---|---|
| Documentar la prueba para que sea reproducible, comunicable, catalogable y con niveles de información | ICU-T1 §1.7 | `Documento-guía` con los apartados del documento-tipo; palabras clave; el informe repite la misma estructura |
| Estructura: 1 Identificación, 2 Presentación, 3 Resumen ejecutivo, 4 Metodología, 5 Aspectos éticos y legales, 6 Reporte y análisis, 7 Conclusiones y recomendaciones, Anexos | ICU-T1 §1.7 | `lib/pdf/usability-documents.tsx` (`PlanSections`, `ResultsReportDocument`) |
| Mínimo a documentar al planificar (ubicación, fechas, tareas, tiempo límite por tarea y total, cómo se narran los escenarios, nº de participantes, perfiles, elegibilidad, reclutamiento, entorno, criterios de gravedad, información a presentar, documentos a firmar, código ético, valoración subjetiva, medios, registro, roles) | ICU-T3 «Planteamiento del test» | `planCompleteness()` lista lo que falta; la pantalla muestra la completitud |
| Una **tarea** nace de un escenario de uso: necesidad real del usuario, punto de partida, meta alcanzable, tiempo límite y **hito de finalización** predefinido | ICU-T3, ICU-S3 | Campos obligatorios del escenario: objetivo del usuario, punto de partida, tiempo límite, hito |
| Los objetivos son del **usuario**, no del negocio | ICU-S3 | Rótulo y ayuda del campo «Objetivo del usuario» |
| Las tareas **no deben ser dirigidas** (no explicar pasos ni apartados) | ICU-T3 | `analyzeScenarioCard()`: marca verbos de acción, menús, botones, pestañas |
| **No decir «tarea»** al participante (se siente evaluado); la palabra solo en documentación interna | ICU-T3, ICU-S3 | La tarjeta lo rechaza; la sesión, las tarjetas impresas y el guion dicen «escenario» |
| **No informar del tiempo límite** al participante (sesgo: presión, distracción) | ICU-T3, ICU-S3 | La tarjeta lo marca; las tarjetas PDF no lo llevan; solo el facilitador ve el límite |
| Si se cumple el tiempo límite, el facilitador pide que **abandone y pase al siguiente** | ICU-T3 | El cronómetro avisa y existe «Detenido al llegar al límite» |
| El criterio de finalización no lo decide el moderador sobre la marcha | ICU-T3 | «Hito de finalización» es un campo obligatorio y se muestra durante la sesión |
| No más de **seis** tareas por prueba | ICU-T3 | `scenarioCountGuidance()`; con varios roles, `scenarioCountGuidanceByRole()` lo mide por rol (aviso informativo hasta 10) |
| Si dos grupos usan el sistema de forma totalmente distinta, **pruebas separadas** | ICU-T3, ICU-S3 | GOM: una sola prueba con los tres roles, por decisión del responsable (ver «Decisiones en contra»); el campo «Rol» separa escenarios, tarjetas y hojas del observador |
| **5 a 15** participantes; Nielsen: 5 por versión descubren ~85 %; 1 usuario ~31 % con riesgo de conducta anómala | ICU-T3 | `participantGuidance()`; con varios roles, `roleParticipantGuidance()` recomienda 5 por rol |
| Elegibilidad por **relación usuario–sistema**; lo sociodemográfico «nunca» como criterio principal, solo cuotas de diversidad | ICU-T3, ICU-S3 | `eligibilityWarnings()` en el documento-guía |
| Confirmar asistencia 24 h antes y tener candidato de reserva; **piloto** que no cuenta como test | ICU-T3 | Participantes: reserva y piloto; el piloto queda fuera de las métricas |
| Pensar en voz alta es la fuente de información más valiosa | ICU-T3 | Campo de observaciones con ayuda para citas textuales |
| Las preguntas del facilitador van **al final**, para no interrumpir | ICU-T3 | Bloque «Preguntas finales» al terminar la sesión |
| Registrar **ToT** (tiempo en tarea) y tarea completada / no completada | ICU-T3 | Cronómetro y resultado por escenario |
| **Error crítico**: no se completa la tarea; si el usuario dice «ya está» sin haberlo logrado, también es crítico y el facilitador no lo oculta | ICU-T3 | Resultado «No completado» y casilla «Falso final» (fuerza «No completado») |
| **Error no crítico**: el usuario se recupera; se valora por **impacto, frecuencia y persistencia** con una escala corta decidida de antemano (muy leve, leve, grave) | ICU-T3 | Problema con tres niveles y gravedad; `suggestIssueSeverity()`; un error crítico es siempre grave |
| Tiempos anormalmente altos o errores recuperados son síntomas de mala usabilidad | ICU-T3 | Informe: «sobre el límite», errores no críticos, tiempo medio, mediana y rango |
| **Satisfacción subjetiva**: un valor numérico por tarea, con la escala explicada; se trata cualitativamente, sin estadísticas | ICU-T3 | Valoración de 1 a 10 con el sentido de la escala visible; el informe lista los valores y avisa que son cualitativos |
| Recomendaciones: indicar escuetamente el problema y **qué principio de usabilidad se vulnera**, y proponer la solución; preferiblemente **visuales** | ICU-T3 | Problema → principio, recomendación y capturas adjuntas |
| Usabilidad = efectividad, eficiencia y satisfacción en un contexto de uso | EUU-T6 (ISO 9241-11) | Métricas del informe: % que completa, tiempo en tarea, satisfacción |
| Consentimiento informado, derechos de imagen, protección de datos y conservación; **no copiar y pegar** entre estudios; requiere **asesoría legal** | ICU-T1 §1.7 | Apartado ético y legal; casilla «Revisado por asesoría legal»; el PDF de consentimiento sale como **borrador** mientras no se marque |
| Los resultados se evalúan con los registros de la prueba, no con la memoria | ICU-T3 | Todo se guarda por participante y escenario y se exporta a CSV |

## 3. Decisiones que se tomaron «en contra» de lo habitual

1. **No hay SUS ni SEQ.** Son cuestionarios y el material del Máster es explícito: no se hacen encuestas en un test de usabilidad. Se conserva una única valoración de satisfacción por escenario, como pide el Tema 3.
2. **No hay «ayuda» graduada** al participante. El Tema 3 solo contempla explicar sin añadir información y, si se cumple el tiempo, pedir que abandone. Una ayuda del facilitador invalida el resultado de ese escenario.
3. **No se calculan estadísticas de satisfacción** (solo se listan los valores y la media se evita en la interfaz del informe).
4. **Una sola prueba para tres roles (GOM, 2026-11-11).** El Máster pide pruebas separadas y no más de seis escenarios; el responsable no tiene tiempo para varias pruebas. Se mantiene una prueba con escenarios agrupados por funciones relacionadas y un campo «Rol» que filtra la sesión, las tarjetas y las hojas del observador. El técnico hace 9 escenarios (supera el tope): se compensa agrupando y vigilando la fatiga.
5. **El consentimiento no se genera automáticamente**: la herramienta solo ofrece un borrador marcado, porque el contenido legal no es estándar.

## 4. Lo que la herramienta no puede garantizar

- No sustituye el criterio del investigador: las revisiones automáticas de la tarjeta-escenario son heurísticas simples y pueden fallar. Lo correcto es validar la tarjeta con otra persona (o con un piloto).
- No gestiona el reclutamiento ni la retribución; solo los registra.
- No hace análisis de grabaciones: las evidencias se adjuntan a los problemas, pero los vídeos de la sesión se guardan fuera de la aplicación.
- No ofrece asesoría legal. Un profesional de la investigación UX no es experto en derecho.
