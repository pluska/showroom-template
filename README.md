# Showroom Virtual — Plantilla **Horizontal** (urbanización)

Branch `horizontal` de `showroom-template`. Es la variante para proyectos de
**urbanización horizontal**: lados → fases → zonas → manzanas → lotes / torres →
unidad. Para un proyecto de un solo edificio (caras → plantas → unidad), usa la
branch `dashboard`.

| Branch | Modelo del inmueble | Navegación |
|---|---|---|
| `dashboard` | Un **edificio** | Caras (giro con topes) → Plantas → Unidad |
| `horizontal` | Una **urbanización** | Lados (giro **cíclico**) → Fases → Zonas → Elementos → Torres/Casas → Unidad |

Las dos comparten el mismo panel de administración, la misma base D1, el mismo
bucket R2 y los mismos módulos (media, brochure, tours, calendario, mapa,
avance de obra, analíticas, contenido). Lo único que cambia es la capa que
describe el inmueble.

## Empezar un proyecto nuevo

Lee **[CLONE_AND_FILL.md](./CLONE_AND_FILL.md)**: es la lista ordenada de todo
lo que hay que rellenar, con los archivos exactos. Después de eso, la
documentación del modelo:

| Documento | Contenido |
|---|---|
| [docs/00-ESTRUCTURA.md](./docs/00-ESTRUCTURA.md) | Modelo de dominio, jerarquía y enums |
| [docs/01-NAVEGACION.md](./docs/01-NAVEGACION.md) | Flujo y reglas de desplazamiento |
| [docs/02-ASSETS.md](./docs/02-ASSETS.md) | Nomenclatura de archivos y claves R2 |
| [docs/03-SCHEMA-DB.md](./docs/03-SCHEMA-DB.md) | Esquema D1 propuesto para el inmueble |
| [docs/04-PENDIENTES.md](./docs/04-PENDIENTES.md) | Supuestos del modelo y decisiones abiertas |
| [docs/05-PLANTILLA.md](./docs/05-PLANTILLA.md) | Qué es genérico y qué se rellena por proyecto |
| [STRUCTURE.md](./STRUCTURE.md) | Arquitectura y organización de archivos |
| [RULES_AI.md](./RULES_AI.md) | Reglas para agentes de IA que toquen este código |

> Los documentos `00`–`04` describen el modelo **con los datos de ejemplo que
> vienen en la branch** (una urbanización de 4 lados, 3 fases y 3 torres,
> tomados de El Olimpo de Tumbes). El modelo no asume esas cantidades: son
> datos, no reglas. Ver `docs/05-PLANTILLA.md`.

## Puesta en marcha

```bash
npm install
cp .env.example .env
```

Rellena al menos `NEXTAUTH_SECRET`, `NEXT_PUBLIC_R2_PUBLIC_URL` y
`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Después, la base de datos:

```bash
wrangler d1 create PROJECT-db      # pega el id en wrangler.toml
npm run db:generate                # migraciones desde el schema
npm run db:migrate                 # aplicarlas a la D1 local
```

Los usuarios del panel se siembran desde un archivo **local**, nunca desde el
repositorio: ver la cabecera de `src/lib/db/insert-users.sql`.

Y a correr:

```bash
npm run dev          # Next.js a secas
npm run dev:pages    # con D1/R2 reales vía wrangler (recomendado)
```

## Qué trae

- **Recorrido 360° de la urbanización**: giro cíclico entre lados con videos de
  transición, entrada al proyecto, desplazamiento por zonas con chevrons.
- **Modelo de dominio data-driven** (`src/data/urbanization/`): nada en la UI
  asume cuántos lados, fases, zonas o torres hay.
- **Fichas de módulo y departamento** con planos SVG interactivos y estado
  comercial por unidad.
- **Panel de administración**: unidades, multimedia, brochures, tours 360,
  galerías, calendario de citas, mapa de POIs, avance de obra, identidad,
  usuarios con roles, analíticas y generación de contenido.
- **Cloudflare nativo**: D1 (datos), R2 (media pesada), Pages/Workers vía
  OpenNext.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 + DaisyUI · Zustand · GSAP ·
Konva (planos) · Mapbox · Drizzle + D1 · NextAuth · Resend
