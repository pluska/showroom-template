# Showroom Virtual Template: Project Context & Rules

This project is a high-performance, data-driven Next.js template for creating virtual real estate showrooms. It follows a **"clone-and-fill"** architecture where UI components are generic, and their behavior/content is dictated by central data files.

## 🚀 Tech Stack

- **Framework**: Next.js 15+ (App Router) / React 19
- **Runtime**: Cloudflare Pages (using `@opennextjs/cloudflare`)
- **Database**: Cloudflare D1 with **Drizzle ORM**
- **Storage**: Cloudflare R2 (for remote assets)
- **State Management**: **Zustand**
- **Animations**: **GSAP** (GreenSock)
- **Styling**: Tailwind CSS 4 + DaisyUI
- **Maps**: React Map GL (Mapbox)
- **Auth**: Next-Auth (Auth.js v5)

## 📂 Core Directory Structure

- `src/app/`: Next.js App Router pages (Lobby, Floors, Unit, etc.).
- `src/components/`: Generic React components.
  - `360/`: Scene handling, pano transitions, and video layers.
  - `floor/`: Floor plan interactivity and unit highlights.
- `src/data/`: **The "Fill" Area.** Central configuration for building faces, floors, and locations.
- `src/store/`: Zustand global state (manages `viewState` and transitions).
- `src/utils/`: Helper functions (Asset resolution, preloading).
- `src/config/config.ts`: Project identity, brand colors, and metadata.

## 🛠 Key Commands

- `npm run dev`: Standard Next.js development.
- `npm run dev:pages`: Cloudflare Pages development environment (Recommended for D1/R2).
- `npm run build`: Standard Next.js build.
- `npm run pages:build`: Build for Cloudflare Pages deployment.
- `npm run db:generate`: Generate Drizzle migrations.
- `npm run db:migrate`: Apply migrations to local D1 instance.
- `npm run db:seed`: Seed the local D1 database.

## 📜 Development Rules & Conventions

### 1. Asset Resolution (CRITICAL)
- **NO HARDCODED PATHS**: Never use direct local paths or hardcoded URLs for images/videos in components.
- **USE `getAssetUrl`**: Always resolve assets using `getAssetUrl(path)` from `@/utils/assets`.
- Assets are typically served from a remote base URL defined in `NEXT_PUBLIC_ASSET_BASE_URL`.

### 2. "Clone-and-Fill" Workflow
- Keep logic in `components/` and state in `store/`.
- Keep configuration and project-specific content in `src/data/` and `src/config/config.ts`.
- When adding features, ensure they can be toggled or configured via data files.

### 3. State & Transitions
- Coordinate complex animations (rotations, walks, timelapses) via the `viewState` in `src/store/useStore.ts`.
- Valid states: `IDLE`, `TRANSITION_VIDEO`, `TRANSITION_ROTATION`, `TRANSITION_TIMELAPSE`, `TRANSITION_FADE`.

### 4. Database & D1
- Use the `DB` binding for D1 interactions.
- Schema and migrations are located in `drizzle/`.

### 5. Best Practices
- **Suspense**: Always wrap components using `useSearchParams` in a `<Suspense>` boundary.
- **Brand Colors**: Use the color tokens defined in `src/config/config.ts` (e.g., via Tailwind classes or CSS variables).
- **GSAP**: Prefer GSAP for UI animations and transitions for a "premium" feel.
- **Verification**: Run `npm run build` after any structural or data schema changes.
