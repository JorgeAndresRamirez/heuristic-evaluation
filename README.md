# Evaluación Heurística

Herramienta **100% local** para **planificar, ejecutar, consolidar y documentar** evaluaciones heurísticas de usabilidad. Permite parametrizar sets de heurísticas, registrar hallazgos con evidencia multimedia, fusionar observaciones de múltiples evaluadores y generar reportes accionables para diseño y producto.

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

El archivo `.env` debe contener:

```env
DATABASE_URL="file:./storage/heuristic-evaluation.db"
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
| `npm run db:studio` | Abre Prisma Studio |

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
│   ├── pdf/                   # Documentos PDF
│   ├── storage.ts             # Evidencias locales
│   └── validators/            # Esquemas Zod
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
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
