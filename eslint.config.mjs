import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Salida de `npm run build:worker`. No viene en los ignores por defecto,
    // así que sin esto un `npm run lint` después de compilar el worker recorre
    // ~34 MB de código generado y devuelve decenas de miles de falsos avisos.
    ".open-next/**",
  ]),
]);

export default eslintConfig;
