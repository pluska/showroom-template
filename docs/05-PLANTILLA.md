# Qué es plantilla y qué es proyecto

Este documento existe solo en la branch `horizontal` de `showroom-template`.
Separa lo que se reutiliza tal cual de lo que se reescribe en cada cliente, y
explica por qué la frontera está donde está.

## 1. El motor: no se toca

Estos archivos son genéricos. Si un proyecto necesita cambiarlos, lo correcto
casi siempre es **añadir un dato**, no una rama en el código.

| Zona | Qué hace |
|---|---|
| `src/data/urbanization/types.ts` | Contrato entre datos, UI y D1 |
| `src/data/urbanization/navigation.ts` | Giro cíclico, chevrons, salto entre torres — funciones puras |
| `src/components/urbanization/` | Los 10 componentes de la experiencia horizontal |
| `src/components/dashboard/` | Todo el panel de administración |
| `src/lib/`, `src/utils/`, `src/store/` | Infraestructura, helpers y estado |
| `drizzle/` | Migraciones. Se añaden, no se editan las existentes |

La UI **no decide**: pinta lo que devuelven los helpers de `navigation.ts`. Por
eso una fase en L, una cuadrícula 3×3 o cinco lados funcionan sin tocar un
componente.

## 2. Los datos: se reescriben enteros

`src/data/urbanization/*` (salvo `types.ts`, `navigation.ts` e `index.ts`)
describe **un** inmueble concreto. Lo que trae la branch es el modelo de una
urbanización real, completo y funcionando: sirve para ver la forma que debe
tener cada archivo, no para editarlo encima.

El orden de relleno está en [CLONE_AND_FILL.md](../CLONE_AND_FILL.md#4-el-modelo-del-inmueble).

## 3. La frontera: ids estables vs. texto visible

Es la decisión que sostiene todo lo demás.

- La **clave** del enum es el identificador estable. Viaja a la base de datos,
  a las URLs y a las analíticas. No cambia nunca.
- El **texto** que ve el usuario vive en los catálogos `*Label`.

Cuando el cliente decide a mitad de proyecto que "Lado 1" ahora es "Vista
Norte" —y lo decide siempre— se edita una línea de `enums.ts`. Ni las filas de
la base, ni las rutas, ni las claves de R2, ni los datos históricos de
analíticas se enteran.

## 4. Lo que se rellena, en una tabla

| Archivo | Contiene |
|---|---|
| `src/config/config.ts` | Identidad, marca, correos, redes |
| `src/app/globals.css` | Variables CSS de color, que deben coincidir con `config.colors` |
| `wrangler.toml` + `package.json` | Nombres de la D1 y el bucket R2 |
| `.env` | Secretos y URLs públicas |
| `src/lib/db/insert-users.sql` | **Se queda con placeholders.** Los hashes reales van en `.users.local.sql`, fuera del repo |
| `src/data/urbanization/*` | El inmueble |
| `src/data/homepage.ts`, `landmarks.ts`, `project-outline.ts`, `*_locations.json` | Entorno y portada |
| `public/identity/`, `public/icons/` | Logotipos e íconos — ver [public/README.md](../public/README.md) |

## 5. Herencia de la variante vertical

La branch nace de la de un solo edificio (`dashboard`) y conserva parte de su
modelo, que sigue en uso: `floors.ts` describe los pisos de las **torres**
dentro de la urbanización, y `buildingData.ts` alimenta el módulo "El
Edificio". No son residuo: son la parte vertical de un proyecto que tiene las
dos.

Lo que sí es residuo está listado en `docs/04-PENDIENTES.md`.

## 6. Volver a subir mejoras a la plantilla

Las dos branches comparten historia, así que un arreglo del panel hecho en un
proyecto se lleva de vuelta con `git cherry-pick`. La regla para decidir si
sube o no:

> ¿El cambio sigue teniendo sentido con **otros** datos? Si sí, es del motor y
> sube a la plantilla. Si solo tiene sentido con este cliente, es dato y se
> queda.
