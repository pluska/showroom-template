# `public/` — qué va en cada carpeta

Esta branch viene **sin imágenes**: los assets pesados son material del cliente
y no se versionan. Lo que sigue es el contrato de nombres que espera el código.

Casi todo el media del showroom (tomas, videos, planos, recorridos) **no vive
aquí**: vive en R2 y se resuelve con `getAssetUrl()`. Ver
[docs/02-ASSETS.md](../docs/02-ASSETS.md). En `public/` solo va lo que el
navegador necesita antes de que el bucket entre en juego.

| Carpeta | Contenido | Referenciado desde |
|---|---|---|
| `identity/project/` | `logo.png`, `logo-white.png` del proyecto | `config.logos` |
| `identity/realstate/` | `logo.png`, `logo-white.png` de la inmobiliaria, más un archivo por empresa del grupo | `config.logos`, `config.company.realStateMembers` |
| `icons/` | Íconos de los POI del mapa, agrupados por categoría (`FINANZAS/`, `COMERCIO/`, `EDUCACION/`…), más el emblema del pin del proyecto | `src/data/*_locations.json`, `config.logos.mapPin` |

Y nada más. Todo lo demás —tomas, renders, planos, videos, portadas de
amenidades, póster de la home— se sirve desde R2 con `getAssetUrl()`. Si te
encuentras añadiendo una carpeta aquí para media del proyecto, casi seguro que
va al bucket.

## Las variantes `-white`

Son **monocromas**, no el mismo logo con el fondo quitado: se pintan sobre
fondos oscuros y un logotipo a color no se lee encima del video de portada.

## Íconos de POI

El set de íconos de marcas (bancos, supermercados, colegios, restaurantes) es
reutilizable entre proyectos de la misma ciudad o país y **no está en esta
branch** por peso. Cópialo del proyecto más reciente que lo tenga.

La estructura que espera el mapa es `icons/<CATEGORIA>/<marca>.png`, con la
categoría en mayúsculas y sin acentos, y el nombre del archivo en minúsculas
con guiones bajos.

## Peso

Cloudflare Pages rechaza cualquier asset de más de 25 MiB y tumba el build.
Los videos se sirven **siempre** desde R2; `.gitignore` ya bloquea `.mp4` y
`.mov` bajo `public/`.
