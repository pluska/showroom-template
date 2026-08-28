# Project Structure

This project follows a data-driven architecture where the UI components are generic and their behavior/content is dictated by central data files.

## Directory Overview

```text
src/
├── app/                # Next.js App Router pages (Showroom, Floors, Unit, etc.)
├── components/         # React components
│   ├── 360/            # Scene handling, pano transitions, video layers
│   ├── floor/          # Floor plan interactivity, unit highlights, popovers
│   ├── layout/         # Navigation, Sidebar, FloorSelector
│   ├── map/            # Mapbox integration and location markers
│   ├── UI/             # Reusable UI elements (Buttons, Loaders, Modals)
│   └── gallery/        # Image gallery components
├── data/               # Central data files (The "Fill" area)
│   ├── urbanization/      # ► Modelo de este proyecto: lados, fases, zonas, torres
│   │   ├── enums.ts       #   Ids estables + catálogos de etiquetas
│   │   ├── types.ts       #   Interfaces del dominio
│   │   ├── navigation.ts  #   Giro cíclico, chevrons, salto entre torres
│   │   ├── assets.ts      #   Constructores de claves R2
│   │   ├── sides.ts       #   4 lados (giro cíclico)
│   │   ├── phases.ts      #   3 fases (solo la 1 navegable)
│   │   ├── zones.ts       #   Zonas + cuadrícula de vistas + elementos
│   │   ├── towers.ts      #   Torres A/B/C y sus pisos
│   │   ├── products.ts    #   Casas y amenidades
│   │   └── amenities-tab.ts # Portada de la pestaña Amenidades
│   ├── asset-manifest.ts  # Registry for remote assets to be preloaded
│   ├── buildingData.ts    # (heredado de Océano) Exterior faces and transitions
│   ├── floors.ts          # (heredado de Océano) Floor plans, units, SVG paths
│   ├── locations.ts       # Map POIs and categories
│   └── config.ts          # Project identity and brand colors
├── store/              # Zustand global state (navigation, view state)
├── utils/              # Helper functions (asset resolution, preloading)
└── types/              # Global TypeScript interfaces
```

## Core Concepts

### 0. El modelo de la urbanización (específico de este proyecto)

`src/data/urbanization/` es la fuente de verdad del inmueble: qué lados, fases,
zonas, torres y casas existen, y cómo se navega entre ellos. Dos reglas:

1. **Los ids son enums estables; los textos visibles viven en catálogos aparte**
   (`SideLabel`, `PhaseLabel`, `TowerLabel`…). Renombrar "Lado 1" a "Lado Norte"
   no debe tocar ni datos ni URLs.
2. **Nada depende de cantidades.** Ni 4 lados, ni 3 fases, ni 3 torres, ni una
   cuadrícula 2×2: todo se recorre sobre las listas declaradas.

Documentación completa en [`docs/`](./docs/00-ESTRUCTURA.md).

### 1. The Asset Resolver
All assets (images, videos) should be resolved through `src/utils/assets.ts` using the `getAssetUrl` function. This allows the project to point to a remote storage (S3, Cloudflare, etc.) by simply changing `NEXT_PUBLIC_ASSET_BASE_URL`.

### 2. View States
The application uses a `viewState` (managed in `src/store/useStore.ts`) to coordinate complex transitions between:
- `IDLE`: Normal viewing mode.
- `TRANSITION_VIDEO`: A walk-through or rotation video is playing.
- `TRANSITION_FADE`: A cross-fade transition is occurring.

### 3. SVG Highlighting
Interactive floor plans use inline SVG paths defined in `src/data/floors.ts`. These paths are overlaid on the floor plan image to provide clickable hit areas for each unit.

### 4. Proximity Preloading
To ensure a "no-wait" experience, the application preloads assets based on the user's current location. For example, when on Face 0, the application preloads the background images for Face 1 and Face 2 in the background.
