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
│   ├── asset-manifest.ts  # Registry for remote assets to be preloaded
│   ├── buildingData.ts    # Exterior faces and transitions
│   ├── floors.ts          # Floor plans, units, and SVG paths
│   ├── locations.ts       # Map POIs and categories
│   └── config.ts          # Project identity and brand colors
├── store/              # Zustand global state (navigation, view state)
├── utils/              # Helper functions (asset resolution, preloading)
└── types/              # Global TypeScript interfaces
```

## Core Concepts

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
