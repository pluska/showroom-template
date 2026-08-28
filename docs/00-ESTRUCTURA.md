# Estructura del proyecto — Urbanización El Olimpo de Tumbes

Este documento define **qué existe** en el proyecto y **cómo se llama cada cosa**.
Es la base de la que salen la navegación (`01-NAVEGACION.md`), los assets
(`02-ASSETS.md`) y el esquema de base de datos (`03-SCHEMA-DB.md`).

El código que implementa este modelo vive en `src/data/urbanization/`.

---

## 1. Diferencias con Océano Atlántico

| Océano Atlántico | Olimpo Tumbes |
|---|---|
| Un **edificio** | Una **urbanización** |
| 3 **caras**, giro bloqueado en los extremos | 4 **lados**, giro **cíclico** (se puede dar la vuelta) |
| Edificio → Plantas → Unidad | Urbanización → **Fases** → **Zonas** → Elementos → **Torres/Casas** → Unidad |
| Selector vertical de pisos | Desplazamiento **arriba/abajo/izquierda/derecha** con chevrons dentro de la zona |
| Una sola torre | **3 torres** (A, B, C) contiguas, con salto lateral que conserva el piso |
| Pestaña Amenidades → galería directa | Pestaña Amenidades → **portada con las fases** (las no disponibles, borrosas con "Próximamente") |

Lo que **se conserva**: la intro con imagen y presentación, el patrón de
transiciones por video, la resolución de assets vía `getAssetUrl()`, el
dashboard, el modelo de unidades y la arquitectura data-driven.

---

## 2. Jerarquía

```
Urbanización
└── Lado (4, cíclico) ────────────────► "ingresar al proyecto"
    └── Fase (3; hoy solo la 1 navegable)
        └── Zona (4 por fase; hoy solo la Zona 1)
            ├── Vista (celda de la cuadrícula: ArrIzq, ArrDer, AbjIzq, AbjDer)
            └── Elemento (manzana clicable)
                ├── Torres (A, B, C)
                │   └── Piso
                │       └── Unidad (departamento)
                ├── Casas
                │   └── Unidad (casa)
                └── Amenidades
```

Un **elemento** es el polígono clicable dentro de la zona. Según el cliente,
hay tres combinaciones: solo casas, solo torres, o casas + amenidades. Por eso
el elemento tiene un `kind` (para filtrar en el dashboard) y una lista
`contents` (el detalle real).

---

## 3. Entidades

| Entidad | Archivo | Qué es |
|---|---|---|
| `Side` | `sides.ts` | Un lado desde el que se ve la urbanización. Giro cíclico. |
| `Phase` | `phases.ts` | Fase 1, 2 o 3. Tiene estado (`AVAILABLE` / `COMING_SOON`). |
| `Zone` | `zones.ts` | Zona dentro de una fase. Contiene la cuadrícula de vistas y los elementos. |
| `ZoneView` | `zones.ts` | Una celda de la cuadrícula = una imagen a pantalla completa. |
| `ZoneElement` | `zones.ts` | Manzana clicable; agrupa casas, torres o amenidades. |
| `Tower` | `towers.ts` | Torre A, B o C. Ordenadas lateralmente. |
| `TowerFloor` | `towers.ts` | Piso de una torre, con su plano y sus unidades. |
| `House` | `products.ts` | Casa individual dentro de un elemento. |
| `Amenity` | `products.ts` | Amenidad (parque, club, piscina…). |
| `Unit` | `types.ts` | Unidad vendible: departamento **o** casa (`kind` decide). |
| `AmenitiesPhaseCard` | `amenities-tab.ts` | Tarjeta vertical de la portada de Amenidades. |

---

## 4. Por qué enums (y cómo se usan)

El cliente ya avisó que la terminología puede cambiar: hoy "Lado 1", mañana
"Lado Norte" o "Noroeste". La regla del proyecto es:

> **La clave del enum es el identificador estable. El texto visible vive en un
> catálogo aparte.**

```ts
// src/data/urbanization/enums.ts
export enum SideId {
  SIDE_1 = 'side-1',   // ← esto viaja a la BD, a las URLs y a las analíticas
  ...
}

export const SideLabel: Record<SideId, string> = {
  [SideId.SIDE_1]: 'Lado 1',   // ← esto es lo único que se edita si cambia el nombre
  ...
};
```

Consecuencias prácticas:

- Renombrar "Lado 1" → "Lado Norte" es **una línea**. No se migran filas, no se
  renombran assets, no se rompen enlaces compartidos.
- El dashboard podrá editar estos textos sin tocar código (tabla de etiquetas,
  ver `03-SCHEMA-DB.md`).
- **Ninguna lógica depende de la cantidad**: ni de 4 lados, ni de la cantidad de fases, ni de
  4 zonas, ni de 3 torres, ni de una cuadrícula 2×2. Todo se recorre sobre las
  listas declaradas (`sidesOrder`, `towersOrder`, `zone.views`…).

### Enums definidos

| Enum | Valores | Nota |
|---|---|---|
| `PhaseId` | `phase-1`, `phase-2`, `phase-3` | |
| `PhaseStatus` | `available`, `coming_soon` | Rige el borroso + "Próximamente" |
| `ZoneId` | `zone-1` … `zone-4` | |
| `SideId` | `side-1` … `side-4` | Ciclo cerrado |
| `TowerId` | `tower-a`, `tower-b`, `tower-c` | |
| `PanDirection` | `up`, `down`, `left`, `right` | Chevrons dentro de la zona |
| `LateralDirection` | `left`, `right` | Giro de lados y salto de torres |
| `ViewSlot` | `top-left`, `top-right`, `bottom-left`, `bottom-right` | Alias legible de (fila, columna) |
| `ProductKind` | `house`, `tower`, `amenity`, `lot` | Qué contiene un elemento |
| `ZoneElementKind` | `houses_only`, `towers_only`, `amenities_only`, `mixed` | Resumen para filtrar |
| `UnitKind` | `apartment`, `house`, `storage` | |
| `UnitStatus` | `available`, `reserved`, `sold` | |
| `NavigationStep` | `intro` … `unit` | Paso del recorrido; sirve para analíticas |

---

## 5. Estado actual del contenido

| Elemento | Estado |
|---|---|
| Fase 1 | Toma aérea entregada (`F1.png`) |
| Fases 2 y 3 | Solo aparecen en `COMING_SOON`; sin assets |
| Zona 1 de Fase 1 | 4 vistas entregadas (cuadrícula 2×2) |
| Zonas 2, 3 y 4 | Declaradas en `COMING_SOON`; sin assets |
| Elementos de la Zona 1 | Esqueleto de 3 elementos; **polígonos pendientes** |
| Torres A/B/C | Estructura y navegación listas; **número de pisos y unidades pendientes** |
| Casas y amenidades | Molde vacío, a la espera del inventario |
| Lados | Estructura y giro cíclico listos; **imágenes y videos pendientes** |

El detalle de lo que falta y las preguntas abiertas están en `04-PENDIENTES.md`.
