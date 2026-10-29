# Next.js security maintenance

Moves Next.js from 16.1.6 to 16.4.1, with its required compiler/runtime and image-processing dependency entries. No framework major is changed. The locked Next.js advisory entry is eliminated after the update; remaining dependency alerts are not declared resolved.

Validated: reproducible `npm ci --ignore-scripts`, static typecheck, and Next production build. No existing application test script is defined in this snapshot.

GHSA-2464-fhr4-w9xw describes native image processing on glibc Linux; do not infer exploitation solely from the Next.js version. GHSA-673q-mjm6-r5xr requires a use-cache function returning multiple typed arrays; that code path was not identified in the audited application. The maintenance patch does not prove compromise occurred or every advisory was reachable. Server Actions denial-of-service and other framework corrections are included in the vendor patch.

No deployment or merge performed. Review deployment/runtime compatibility before approval; in particular the OpenNext packaging must pass its own pipeline. References: https://github.com/advisories/GHSA-2464-fhr4-w9xw and https://github.com/advisories/GHSA-p3m5-59mp-jv5r.
