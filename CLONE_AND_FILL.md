# Clonar y rellenar — proyecto horizontal

Lista ordenada de todo lo que cambia al arrancar una urbanización nueva desde
esta branch. Está ordenada por dependencia: cada paso asume hecho el anterior.

```bash
git clone https://github.com/pluska/showroom-template.git mi-proyecto
cd mi-proyecto
git checkout horizontal
git checkout --orphan main     # historia limpia para el proyecto nuevo
npm install
```

---

## 1. Infraestructura Cloudflare (primero: todo lo demás depende de esto)

Cada proyecto tiene **su propia** base y **su propio** bucket. Nunca reutilizar
los de otro cliente: se mezclan inventarios y media, y el borrado de uno afecta
al otro.

```bash
wrangler d1 create PROJECT-db          # devuelve un database_id
wrangler r2 bucket create PROJECT-showroom
```

| Archivo | Qué cambiar |
|---|---|
| `wrangler.toml` | `name`, `database_name`, `database_id`, `bucket_name` |
| `package.json` | `name` y `PROJECT-db` en los scripts `db:*` |
| `.env` | copiar de `.env.example` y rellenar |

Variables mínimas para que la app arranque: `NEXTAUTH_SECRET`
(`openssl rand -base64 32`), `NEXT_PUBLIC_R2_PUBLIC_URL` (el dominio público
del bucket) y `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.

> `NEXT_PUBLIC_R2_PUBLIC_URL` no tiene valor por defecto a propósito: sin ella
> las imágenes se rompen a la vista, que es mejor que cargar en silencio los
> assets del cliente anterior.

```bash
npm run db:generate      # migraciones desde src/lib/db/schema.ts
npm run db:migrate       # aplicarlas a la D1 local
```

## 2. Usuarios del panel

`src/lib/db/insert-users.sql` es una **plantilla con placeholders** y así se
queda: los hashes reales no se commitean nunca. El procedimiento está en la
cabecera de ese archivo; en resumen:

```bash
node scripts/hash-password.mjs 'la-contraseña'
cp src/lib/db/insert-users.sql .users.local.sql   # .gitignore lo ignora
# rellenar .users.local.sql con los hashes y correos reales
wrangler d1 execute PROJECT-db --local --file=./.users.local.sql
```

## 3. Identidad del proyecto

**`src/config/config.ts`** es la única fuente de la marca. Todo lo marcado
`RELLENAR`: nombre, dominio, correos de Resend, colores, redes, grupo
inmobiliario y estudio. Ningún componente debe hardcodear nada de esto.

Después, los colores en `src/app/globals.css` para que las variables CSS
coincidan con `config.colors`.

Logotipos en `public/identity/` — ver [public/README.md](./public/README.md)
para la lista exacta de archivos y variantes.

## 4. El modelo del inmueble

Aquí está el grueso del trabajo. Todo vive en `src/data/urbanization/` y se
rellena **en este orden**, porque cada archivo referencia ids del anterior:

| # | Archivo | Qué declara |
|---|---|---|
| 1 | `enums.ts` | Ids estables (fases, zonas, lados, torres) y sus **etiquetas visibles** |
| 2 | `sides.ts` | Los lados del giro exterior y sus videos de transición |
| 3 | `phases.ts` | Fases, su cuadrícula, la zona de entrada y su hotspot en el master plan |
| 4 | `zones.ts` | Zonas (cada celda de la cuadrícula) y sus elementos clicables |
| 5 | `modules.ts` / `lots.ts` | Manzanas, lotes y módulos de vivienda con sus polígonos |
| 6 | `towers.ts` / `apartments.ts` | Torres, pisos y tipologías de departamento |
| 7 | `products.ts` / `amenities-tab.ts` | Amenidades y la portada de su pestaña |
| 8 | `viewpoints.ts` / `tours.ts` | Miradores comparables y tours 360 |
| 9 | `assets.ts` | Constructores de claves R2 a partir de los ids de arriba |

**Las dos reglas que no se rompen** (ver `RULES_AI.md`):

1. El texto visible vive en los catálogos `*Label` de `enums.ts`, nunca en un
   componente. Los nombres cambian a mitad de proyecto, siempre.
2. Nada asume **cantidades**. Ni cuántos lados, ni cuántas fases, ni que la
   cuadrícula sea 2×2. Se recorren las listas declaradas y los controles se
   derivan con los helpers de `navigation.ts`.

Los datos que vienen en la branch son un ejemplo funcional completo (4 lados,
3 fases, 3 torres, ~200 lotes). Sirven de referencia de forma; se reemplazan,
no se editan encima.

## 5. Contenido del entorno

| Archivo | Qué |
|---|---|
| `src/data/homepage.ts` | Portada: video de fondo, póster, claim |
| `src/data/*_locations.json` | POIs del mapa (se siembran en `locations_poi`) |
| `src/data/landmarks.ts` | Hitos con clip propio en el mapa de ubicación |
| `src/data/project-outline.ts` | Perímetro del terreno, en `[lon, lat]` |
| `src/data/advisers.ts` | Asesores comerciales del formulario de contacto |
| `src/data/asset-manifest.ts` | Assets críticos que se precargan al entrar |

## 6. Assets a R2

La nomenclatura del cliente **nunca** se parsea en código: se traduce una sola
vez al subir, a los slugs estables del dominio. La tabla de equivalencias y la
estructura de claves están en [docs/02-ASSETS.md](./docs/02-ASSETS.md).

`src/utils/assets.ts` expone `ASSET_VERSION`: **súbela cada vez que reemplaces
el contenido de una clave que ya existía** en el bucket. La URL no cambia, así
que sin eso el navegador sigue sirviendo la copia vieja.

## 7. Verificar

```bash
npm run dev:pages     # con D1/R2 reales
npm run build         # obligatorio antes de dar por cerrado cualquier cambio estructural
```
