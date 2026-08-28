# Rules for AI Agents

When modifying or expanding this project, AI agents MUST adhere to the following rules to maintain template integrity and "clone-and-fill" compatibility.

## 0. Terminología y cantidades (variante horizontal)
- **NUNCA** escribas un nombre visible ("Lado 1", "Fase 2", "Torre A") dentro de
  un componente. Usa el enum + su catálogo de etiquetas en
  `src/data/urbanization/enums.ts`. El cliente ya avisó que estos nombres pueden
  cambiar.
- **NUNCA** asumas cantidades: ni cuántos lados, ni cuántas fases, zonas o
  torres, ni que la cuadrícula sea 2×2. Los datos de ejemplo de esta branch
  traen unas cifras concretas y el siguiente proyecto traerá otras. Recorre
  siempre las listas declaradas y deriva los controles (chevrons, flechas) con
  los helpers de `navigation.ts`.
- El giro entre **lados** es cíclico; el desplazamiento dentro de una **zona** y
  el salto entre **torres** no lo son.
- El salto lateral entre torres **conserva el piso**. No lo reimplementes:
  usa `resolveTowerSwitch()`.

## 1. Do Not Hardcode Assets
- **NEVER** use direct local paths or hardcoded URLs for images/videos in components.
- **ALWAYS** use `getAssetUrl(path)` from `@/utils/assets`.
- Ensure all new assets are added to the appropriate data file (`src/data/urbanization/assets.ts`, `buildingData.ts`, `floors.ts`, etc.).

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

## 8. Secretos
- **NUNCA** commitees hashes de contraseñas, tokens, ids de base de datos ni
  dominios de bucket. `src/lib/db/insert-users.sql` se queda con placeholders;
  las credenciales reales viven en `.users.local.sql`, que está en `.gitignore`.
- Ningún valor por defecto debe apuntar al bucket o a la base de otro proyecto:
  es mejor que falle a la vista a que cargue en silencio datos ajenos.
