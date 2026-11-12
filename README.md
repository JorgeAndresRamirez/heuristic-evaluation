# Evaluación de usabilidad (heurística y tests con usuarios)

Herramienta **100% local** para **planificar, ejecutar, consolidar y documentar** dos técnicas complementarias:

- **Evaluación heurística** (con expertos): sets de heurísticas, hallazgos con evidencia multimedia, consolidación de varios evaluadores y reportes.
- **Test de usabilidad** (con usuarios): documento-guía, escenarios no dirigidos, participantes, **pantalla del participante** (bienvenida y una situación a la vez, para compartir en la videollamada), sesión del facilitador con cronómetro, errores críticos y no críticos, síntesis con grabación, marcadores y hallazgos con captura, problemas con gravedad y recomendaciones, e informes (ejecutivo y con la estructura del documento-tipo del Máster).

El test de usabilidad no sustituye a la evaluación heurística: la complementa. Fundamento y trazabilidad con el material del Máster en [docs/FundamentoMetodologico.md](docs/FundamentoMetodologico.md).

**Autor:** Jorge Andrés Ramírez Sierra — Ingeniero de Software, Máster en Diseño de Experiencia de Usuario (Colombia)

**Repositorio:** [github.com/JorgeAndresRamirez/heuristic-evaluation](https://github.com/JorgeAndresRamirez/heuristic-evaluation)

Proyecto hermano de referencia: [usability-test-management](https://github.com/JorgeAndresRamirez/usability-test-management)

---

## Justificación UX

Las evaluaciones heurísticas suelen documentarse en hojas de cálculo o documentos dispersos, lo que dificulta:

- Mantener **criterios consistentes** entre evaluadores
- **Adjuntar evidencia** (capturas y videos) vinculada a cada hallazgo
- **Consolidar** observaciones duplicadas con severidad consensuada
- Generar **reportes ejecutivos** para priorizar mejoras

Esta herramienta centraliza todo el flujo en una aplicación web local, sin servidores en la nube, con datos y multimedia almacenados en el disco del usuario.

---

## Características principales

### M1 — Configuración y sets de heurísticas

- CRUD de sets personalizados y configuraciones de evaluación
- Sets predefinidos del sistema:
  - **Nielsen** (10 principios)
  - **Shneiderman** (8 reglas)
  - **Instone**, **Mayhew**, **Material Design**, **Apple HIG**
- Descripciones enriquecidas y ejemplos de buenas/malas prácticas por principio
- Importar / exportar JSON de sets y configuraciones

### M2 — Proyectos y evaluadores

- Crear proyectos vinculados a una configuración heurística
- URL del prototipo evaluado (campo opcional)
- Agregar múltiples evaluadores (nombre, rol, notas) **sin login complejo**
- Estados: Borrador → En evaluación → Consolidación → Cerrado
- Duplicar, exportar e importar proyectos (JSON)

### M3 — Interfaz de inspección

Por cada hallazgo:

| Campo | Descripción |
|-------|-------------|
| Contexto | Pantalla, tarea y paso exacto |
| Principios | **Uno o más** principios vulnerados del set activo |
| Evidencia | Imágenes y videos (`.mp4`, `.webm`, `.mov`) desde almacenamiento local |
| Descripción | Texto enriquecido (Tiptap: negrita, cursiva, subrayado, listas) |
| Severidad | Crítico / Mayor / Menor |
| Alcance | Aislado o generalizado |
| Solución y riesgos | Propuesta de mejora y evaluación de riesgos |

Además:

- **Editar** hallazgos ya guardados (campos, principios y evidencias adicionales)
- **Eliminar** hallazgos con confirmación
- Adjuntar evidencias **antes** de guardar o después sobre hallazgos existentes

### M4 — Consolidación

- Guía paso a paso y barra de progreso
- Hallazgos agrupados por principio heurístico
- Vista previa de evidencias en pendientes
- Selección múltiple y **fusión** de duplicados (mínimo 2 hallazgos)
- Re-evaluación de severidad final (con sugerencia automática)
- Trazabilidad de evaluadores por hallazgo consolidado
- Confirmación antes de desfusionar

### M5 — Reportes

- Gráficos interactivos (Recharts): severidad, heurísticas vulneradas, hallazgos por evaluador
- **Top 10 problemas más críticos** (a partir de hallazgos consolidados)
- Exportación **HTML** consolidada e individual por evaluador
- Exportación **PDF** consolidada e **individual por evaluador** (con evidencias embebidas)
- Exportación **CSV** de hallazgos crudos
- Reportes individuales ordenados por severidad, principio, pantalla, tarea y paso

### M6 — Test de usabilidad con usuarios

Se crea un proyecto con la técnica **Test de usabilidad** y se trabaja por secciones:

| Sección | Qué permite |
|---------|-------------|
| **Resumen** | Avance por fase (briefing, planificación, reclutamiento, desarrollo, evaluación de resultados, recomendaciones), avisos y resultados por escenario |
| **Documento-guía** | Los apartados del documento-tipo: identificación, presentación, resumen ejecutivo, metodología, aspectos éticos y legales. Lista lo que falta del planteamiento mínimo y avisa de criterios de elegibilidad sociodemográficos |
| **Escenarios** | Rol o perfil, objetivo del usuario, punto de partida, tiempo límite (solo del facilitador), hito de finalización y **tarjeta-escenario**. Revisa la tarjeta en vivo: detecta la palabra «tarea», escenarios dirigidos (pasos, menús, botones) e informar del tiempo |
| **Participantes** | Códigos (P1…), perfil (lista con los roles de los escenarios), elegibilidad, consentimiento, autorización de grabación, piloto y reserva. Guía de cuántos participantes se necesitan (5 por rol si hay varios roles) y avance «X de N escenarios» según su rol |
| **Pantalla del participante** | Bienvenida y cierre parametrizables (título, texto enriquecido, mensaje de despedida) con vista previa. Es lo primero y lo último que ve el participante en su pantalla |
| **Sesión** | Modo facilitador con **pantalla del participante** en una pestaña aparte (`/p/<enlace>`, es la que se comparte en la videollamada: bienvenida, una situación a la vez, pausa y cierre, controlados desde la ventana del facilitador) y marcadores de momento en vivo. Solo los escenarios del rol del participante, tarjeta visible, cronómetro (ToT), resultado según el hito, «falso final» como error crítico, errores no críticos, pensamientos en voz alta y satisfacción 1–10. Preguntas finales al terminar |
| **Síntesis de la sesión** | Tras la sesión: enlace de la grabación (Meet, Loom, Drive…), marcadores de tiempo sobre ella y hallazgos con captura de pantalla, recomendación y momento en la grabación. PDF de hallazgos por participante |
| **Problemas** | Hechos observados, principio de usabilidad vulnerado, tipo de error (crítico / no crítico), impacto, frecuencia y persistencia, gravedad (muy leve, leve, grave) con sugerencia, recomendación y capturas |
| **Informe** | Resumen para decidir (efectividad, éxito limpio, brecha de recuperación, errores críticos) con barras por escenario; efectividad, eficiencia y satisfacción (ISO 9241-11) por escenario; resultado por participante; problemas por gravedad; descargas |

Descargas (PDF): informe de resultados, documento-guía, **tarjetas-escenario** para el participante, hoja de observación en blanco y consentimiento (borrador); **informe ejecutivo** (2 páginas orientadas a decidir) y **hallazgos de una sesión** con capturas; CSV de ejecuciones y de hallazgos y marcadores. Si los escenarios tienen **rol**, el informe añade una hoja del observador y unas tarjetas por rol (`?doc=observation&role=…` y `?doc=cards&role=…`), para que cada observador y cada participante reciba solo lo suyo.

**Pruebas con varios roles:** el campo «Rol o perfil» del escenario agrupa los escenarios por rol. Con dos o más roles, la sesión filtra los escenarios por el perfil del participante (un perfil que no coincide con ningún rol muestra todos, para no ocultar nada), la meta de participantes es por rol y el tope de escenarios se mide por rol. La lógica pura está en `lib/usability-test.ts` (`scenarioRoles`, `scenariosForProfile`, `roleParticipantGuidance`, `scenarioCountGuidanceByRole`) con pruebas en `lib/usability-test.test.ts`.

**Decisiones de diseño tomadas a propósito (del Máster):** no se muestra el tiempo límite al participante; no hay encuestas dentro del test (SUS/SEQ) —la satisfacción es una sola valoración numérica por escenario, tratada de forma cualitativa—; un piloto no cuenta en los resultados; el consentimiento queda como borrador hasta marcar la revisión legal.

**Datos de GOM:** `npm run db:seed:gom` carga la ronda 1 de usabilidad de GOM como **una sola prueba por roles** con 18 escenarios (SoporteAdmin S1–S5, TecnicoOperativo E1–E5, O1–O2 y A1–A2, Laboratorista L1–L4) y el documento-guía diligenciado. Si el proyecto ya existe y no tiene participantes ni problemas, lo reemplaza; si ya tiene datos, no lo toca. Detalle, orden, supuestos y pendientes en [docs/RondaGOM.md](docs/RondaGOM.md).

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) + TypeScript |
| UI | [Tailwind CSS 4](https://tailwindcss.com/) + componentes estilo shadcn/ui |
| Base de datos | [SQLite](https://www.sqlite.org/) + [Prisma 6](https://www.prisma.io/) |
| Formularios | React Hook Form + [Zod](https://zod.dev/) |
| Texto enriquecido | [Tiptap](https://tiptap.dev/) + DOMPurify |
| Gráficos | [Recharts](https://recharts.org/) |
| PDF | [@react-pdf/renderer](https://react-pdf.org/) |
| Multimedia | Sistema de archivos local (`storage/evidence/`) |

**Requisitos:** Node.js 20+, npm 10+ — **sin Docker, sin PostgreSQL, sin despliegue en nube**

---

## Instalación local paso a paso

### 1. Clonar e instalar

```bash
git clone https://github.com/JorgeAndresRamirez/heuristic-evaluation.git
cd heuristic-evaluation
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
```

El archivo `.env` debe contener (la ruta de SQLite es relativa a `prisma/schema.prisma`, por eso lleva `../`; así la base queda en `storage/` junto a las evidencias y el respaldo la incluye):

```env
DATABASE_URL="file:../storage/heuristic-evaluation.db"
```

### 3. Base de datos

```bash
npm run db:push
npm run db:seed    # Carga los 6 sets de heurísticas + proyecto demo
```

### 4. Arrancar la aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

> `npm run dev` ejecuta `prisma generate` automáticamente antes de iniciar Next.js.

---

## Manual de uso básico

### Crear un proyecto

1. Ve al **Dashboard** (`/`)
2. Pulsa **Nuevo proyecto**
3. Elige nombre, producto, URL del prototipo (opcional) y configuración heurística
4. Agrega evaluadores desde la ficha del proyecto

### Evaluar

1. En el proyecto, pulsa **Evaluar** junto al evaluador correspondiente
2. Completa el formulario de hallazgo (contexto, **uno o más principios**, severidad, alcance)
3. Adjunta capturas o videos desde tu disco local
4. Guarda cada hallazgo
5. Usa **Editar** en hallazgos existentes para corregir o ampliar la información

### Consolidar

1. Abre **Consolidación** en el proyecto
2. Sigue la guía: selecciona al menos 2 hallazgos que describan el mismo problema
3. Define título, resumen y severidad final consensuada
4. Pulsa **Fusionar hallazgos**

### Exportar reportes

1. Abre **Reportes** en el proyecto
2. Revisa gráficos y Top 10
3. Descarga HTML/PDF consolidado, CSV o reportes **individuales por evaluador** (HTML y PDF)

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Regenera Prisma y arranca servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run start` | Servidor de producción local |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:push` | Sincroniza esquema SQLite |
| `npm run db:seed` | Carga sets de heurísticas y demo |
| `npm run db:seed:gom` | Carga la ronda 1 de usabilidad de GOM (requiere `db:seed` antes) |
| `npm run db:studio` | Abre Prisma Studio |
| `npm test` | Pruebas de la lógica del test de usabilidad (`node:test`) |

---

## Estructura de carpetas

```
heuristic-evaluation/
├── app/
│   ├── (app)/                 # Dashboard, heurísticas, proyectos, reportes
│   └── api/                   # API REST local
├── components/
│   ├── heuristics/            # Gestión de sets y configuraciones
│   ├── evaluation/            # Proyectos e inspección
│   ├── usability/             # Test de usabilidad: plan, escenarios, participantes, sesión, síntesis, problemas, informe
│   ├── participant/           # Pantalla del participante (/p/<enlace>)
│   ├── consolidation/         # Panel de fusión
│   ├── reports/               # Gráficos y exportación
│   ├── layout/                # Shell de navegación
│   └── ui/                    # Componentes base
├── lib/
│   ├── generated/prisma/      # Cliente Prisma (generado, gitignored)
│   ├── heuristic-seeds/       # Nielsen, Shneiderman, etc.
│   ├── finding-principles.ts  # Relación hallazgo ↔ principios
│   ├── consolidation.ts       # Lógica de agrupación y severidad
│   ├── evidence-embed.ts      # Evidencias en reportes HTML/PDF
│   ├── export-import.ts       # JSON/CSV
│   ├── report-builder.ts      # HTML y analítica
│   ├── usability-test.ts      # Lógica pura del test de usabilidad (con .test.ts)
│   ├── usability-data.ts      # Carga y resumen del test de usabilidad
│   ├── participant-screen.ts  # Qué ve el participante según la fase de la sesión (lógica pura)
│   ├── usability-transfer.ts  # Exportar/importar un test completo entre equipos
│   ├── pdf/                   # Documentos PDF
│   ├── storage.ts             # Evidencias locales
│   └── validators/            # Esquemas Zod
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── seed-gom.ts            # Ronda 1 de usabilidad de GOM (npm run db:seed:gom)
│   └── migrate-finding-principles.ts
├── storage/
│   ├── heuristic-evaluation.db   # SQLite (gitignored)
│   └── evidence/                 # Multimedia (gitignored)
└── README.md
```

---

## Rutas principales

| Módulo | Ruta |
|--------|------|
| Dashboard | `/` |
| Sets de heurísticas | `/heuristics`, `/heuristics/[setId]` |
| Configuraciones | `/configs` |
| Proyecto | `/projects/[projectId]` |
| Inspección | `/projects/[projectId]/evaluate/[evaluatorId]` |
| Consolidación | `/projects/[projectId]/consolidation` |
| Reportes | `/projects/[projectId]/reports` |
| Test de usabilidad: resumen, documento-guía, escenarios, participantes, problemas, informe | `/projects/[projectId]`, `/plan`, `/scenarios`, `/participants`, `/issues`, `/test-report` |
| Test de usabilidad: pantalla del participante (configuración) | `/projects/[projectId]/participant-screen` |
| Test de usabilidad: sesión del facilitador y su síntesis | `/projects/[projectId]/sessions/[participantId]`, `/synthesis` |
| Pantalla del participante (la que se comparte; sin menús, enlace secreto por participante) | `/p/[token]` |
| Test de usabilidad: documentos | `/api/projects/[projectId]/test-report?doc=report\|guide\|cards\|consent\|observation\|csv` (`cards` y `observation` aceptan `&role=<rol>`) |

---

## Modelo de datos (hallazgos)

Cada hallazgo puede asociarse a **varios principios heurísticos** mediante la tabla intermedia `FindingPrinciple`. Esto refleja casos reales donde una misma observación vulnera más de una heurística.

---

## Almacenamiento local y respaldo

- **Base de datos:** `storage/heuristic-evaluation.db`
- **Evidencias:** `storage/evidence/{projectId}/{findingId}/`
- **Respaldo completo:** copia la carpeta `storage/`

Los archivos en `storage/` no se versionan en git.

---

## Formato de exportación JSON

Un **test de usabilidad** se exporta completo: además del plan y los escenarios, una copia portátil (`data.transfer`) de participantes, sesiones, ejecuciones, marcadores, hallazgos con sus capturas (en base64) y problemas con sus evidencias de imagen. Al importarlo en otro equipo se enlazan por código de escenario y de participante (no por identificadores de la base de origen) y el set de heurísticas se busca por nombre: la base de destino debe tener los sets (`npm run db:seed`). Las imágenes de más de 8 MB y los vídeos no viajan dentro del JSON: se listan en `transfer.skippedFiles`. El proyecto importado se llama «… (importado)».

```json
{
  "format": "heuristic-evaluation",
  "version": 1,
  "type": "project | evaluation-config | heuristic-set",
  "exportedAt": "2026-06-20T...",
  "data": { }
}
```

---

## Solución de problemas

### El cliente Prisma no se encuentra

```bash
npm run db:generate
```

### Errores tras cambiar el schema (`severity`, `principles`, etc.)

El servidor de desarrollo puede cachear un cliente Prisma antiguo. Reinicia:

```bash
# Ctrl+C para detener, luego:
npm run dev
```

### Base de datos existente tras actualizar el código

Si ya tenías una base creada y actualizas el código, aplica el esquema con `npm run db:push -- --accept-data-loss`. El aviso de «pérdida de datos» es solo por la nueva restricción de unicidad del enlace del participante (columna vacía en las filas existentes): no borra nada.

### Base de datos vacía

```bash
npm run db:push
npm run db:seed
```

### Evidencias no se muestran

Verifica que el archivo exista en `storage/evidence/` y que la ruta no haya sido movida manualmente.

---

## Licencia

© Jorge Andrés Ramírez Sierra. Todos los derechos reservados.

Proyecto de autor personal. Puedes usarlo, adaptarlo y redistribuirlo según los términos que definas en tu despliegue.

---

## Créditos y contacto

**Autor:** Jorge Andrés Ramírez Sierra — Ingeniero de Software, Máster en Diseño de Experiencia de Usuario (Colombia)

- GitHub: [JorgeAndresRamirez](https://github.com/JorgeAndresRamirez)
- LinkedIn: [jorgeandresramirez](https://www.linkedin.com/in/jorgeandresramirez)
- Correo: jor.ramirez@pascualbravo.edu.co

Herramienta personal para evaluaciones heurísticas colaborativas, con enfoque en consolidación, evidencia multimedia local y reportes accionables para equipos de diseño y producto.
