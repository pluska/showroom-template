# Rules for AI Agents

When modifying or expanding this project, AI agents MUST adhere to the following rules to maintain template integrity and "clone-and-fill" compatibility.

## 1. Do Not Hardcode Assets
- **NEVER** use direct local paths or hardcoded URLs for images/videos in components.
- **ALWAYS** use `getAssetUrl(path)` from `@/utils/assets`.
- Ensure all new assets are added to the appropriate data file (`buildingData.ts`, `floors.ts`, etc.).

## 2. Maintain Interface Parity
- When updating data structures in `src/data/`, ensure the TypeScript interfaces are updated consistently across the project.
- Do not remove existing fields from interfaces (like `backgroundVideo`) as they are used by core components.

## 3. Protect the "Fill" Workflow
- Keep logic in `components/` and state in `store/`.
- Keep configuration in `data/`.
- If adding a new feature, ensure it can be toggled or configured via a data file so the template remains reusable for other projects.

## 4. Asset Manifest Management
- Any new critical asset (Intro videos, main face backgrounds) should be added to the example list in `src/data/asset-manifest.ts` or documented as a requirement.

## 5. Next.js Best Practices
- **Suspense Boundaries**: Always wrap components using `useSearchParams` in a `<Suspense>` boundary to prevent build-time errors.
- **Client Components**: Use `"use client";` directives appropriately for interactive elements.

## 6. Styling Standards
- Use the brand color tokens defined in `src/config/config.ts` via Tailwind classes or CSS variables.
- Maintain the premium, minimalist aesthetic: use `backdrop-blur`, subtle shadows, and smooth GSAP transitions.

## 7. Build Verification
- After any structural change, **ALWAYS** run `npm run build` to ensure the template still compiles correctly.
