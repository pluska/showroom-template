# Pendientes, supuestos y decisiones abiertas

## 1. Supuestos que tomé al modelar

Están implementados así; si alguno no es correcto, cambiarlo ahora es barato.

| # | Supuesto | Por qué |
|---|---|---|
| 1 | ~~La cuadrícula pertenece a la **zona**~~ → **CORREGIDO: pertenece a la fase, y cada celda ES una zona** | Ver abajo |
| 2 | La Fase 1 tiene 4 zonas: una por celda de la cuadrícula | "las 4 zonas que tiene esa fase", y las tomas cubren la fase entera |
| 3 | ~~La cuadrícula de la Fase 1 es 2×2~~ → **CORREGIDO: es en L (3 zonas activas)** | La Zona 4 queda fuera de esta etapa por indicación del cliente |
| 8 | La **Zona 4 no entra en esta etapa** y se bloquea quitándola de la cuadrícula, no marcándola "Próximamente" | Indicación del cliente. Al no declararse, deja de ser vecina y el chevron hacia ella desaparece solo |
| 4 | Se entra a la Fase 1 por la celda **arriba izquierda (Zona 1)** | Es la toma de entrada con casas y área de piscinas (`entryZone`) |
| 5 | El desplazamiento dentro de la fase **no** es cíclico | Solo el giro de lados lo es; al llegar al borde el chevron desaparece |
| 6 | Las torres **no** son cíclicas | El cliente lo describió explícitamente: A solo derecha, C solo izquierda |
| 7 | Una casa o lote es una unidad vendible más, no una entidad aparte | Permite que el dashboard use una sola tabla `units` con `kind` |

> **El supuesto 1 y el mapeo de zonas quedaron corregidos y verificados.**
> Se comprobó recortando `FASE 1.jpg` y contrastando con las tomas entregadas:
> - **Zona 1**: `top-left` (0, 0) — Casas con el parque y el área de piscinas.
> - **Zona 2**: `bottom-left` (1, 0) — Segundo grupo de casas y lotes al este (Mz. K, L, M, N).
> - **Zona 3**: `top-right` (0, 1) — Manzana de las tres torres y lotes al este.
> - **Zona 4**: `bottom-right` (1, 1) — Sin toma: no entra en esta etapa.
>
> Hoy: `Phase` tiene `grid` y `entryZone`; `Zone` tiene `row`, `col` e `image`.
> Una zona **es** una celda. `navigation.ts` opera sobre la fase
> (`getAvailableDirections` calcula automáticamente los chevrons existentes).

---

## 2. Assets y su estado

| Asset | Estado | Detalle |
|---|---|---|
| **Video de portada del sitio** (`/`) | ✅ Subido | `FASES/PORTADA EL OLIMPO DE TUMBES.mp4` subido a R2 (`homepage/intro_video.mp4`) con poster WebP (`homepage/intro.webp`) en 4K. |
| **Imagen fallback portada** (`/`) | ✅ Subido | `FASES/aa.png` convertida a WebP 4K y subida a R2 (`homepage/fallback.webp`). |
| **Video oficial / institucional** (`/video`) | ✅ Subido | `FASES/VIDEO EL OLIMPO DE TUMBES.mp4` subido a R2 (`video/video.mp4`) con poster WebP (`video/poster.webp`) en 4K y faststart habilitado. |
| Tomas de los 4 **lados** y Cara 0 | ✅ Subido | Entrega del 24/08: `1.jpg`…`4.jpg` en WebP y los 8 giros del ciclo (1 ↔ 2 ↔ 3 ↔ 4 ↔ 1). La portada son dos videos encadenados (`0.1` entra una vez, `0.2` se queda en bucle) más `0.3.jpg` de respaldo |
| Video de **ingreso** al proyecto | ✅ Subido | `0-1.mp4` de la portada a la cara 1, y `O1-MP`…`O4-MP` de cada cara al Master Plan: se ingresa desde el lado que se esté mirando |
| Giro **cara 3 → cara 2** | ⚠️ Reconstruido | El cliente entregó dos veces el 2→3: `3-2.mp4` está mal rotulado y va en el mismo sentido que `2-3.mp4` (comprobado por ambos extremos). Lo que está subido es `2-3.mp4` invertido, que es como se comportan los demás pares de ida y vuelta. **Pedir el archivo correcto** y pisar la clave |
| **Grading** de las tomas fijas vs. los videos | ✅ Resuelto | Los renders están algo más contrastados y saturados que el fotograma final del video (PSNR 15–24 dB), pero **encuadre y brillo coinciden** (luma media dentro del 1–5 %), así que el material no era el problema. El salto que se veía lo metía el CSS: un velo negro del 15–25 % sobre cada toma que nunca se aplicaba al video. Velos eliminados; el fundido de medio segundo cubre lo que queda |
| **Velos oscuros sobre las tomas** | ✅ Eliminados | Estaban en Portada (15 %), Lados (20 %), Master Plan y Fase (25 %) y Torres (15 %); la Zona no tenía. Eran decorativos —la capa de más abajo del escenario, por debajo de los SVG de recortes— así que quitarlos no toca ni un clic. Si se reintroduce alguno, va también sobre el video del vuelo |
| Tomas de las **Fases 2, 3 y 4** | ⏳ Pendiente | Próximamente (se activan cambiando `status: AVAILABLE` en `phases.ts`) |
| Encuadres de las Zonas 1, 2 y 3 | ✅ Subido | Tomas entregadas y mapeadas en la cuadrícula en L de la Fase 1 |
| Plantas de las Torres A, B y C | ✅ Subido | 6 pisos por torre (`A1…A6`, `B1…B6`, `C1…C6`) con azotea en piso 6 |
| Videos de entrada a torres | ✅ Subido | `ABC-A5.mp4`, `ABC-B5.mp4` y `ABC-C5.mp4` para ingresar aterrizando en el piso 5 |
| **Fachadas** de las torres (alzado) | ⏳ Opcional | Recorrido actual opera con las plantas cenitales y vista general `ABC` |
| **Planos de departamentos** (4 tipologías) | ✅ Subido | 4 tipologías × 3 vistas (`furnished`, `measured`, `unfurnished`) + 24 videos de transición |
| **Galerías de departamentos (Pisos 1…5)** | ✅ Subido (20/20) | 100 % de las galerías completadas: 20 departamentos (`DEPA 101…504`) × 8 fotos = **160 fotos en 4K WebP** subidas a R2 (`apartments/gallery/`). |
| **Recorridos Virtuales 360° en departamentos** | ✅ Configurado | Integrado visor inmersivo en `DepartamentoFicha` con colección oficial en Kuula (`https://kuula.co/share/collection/7Tgw3...`). |
| **Renders de los lotes (133 lotes)** | ✅ Subido | 133 renders limpios (`{n}.webp`) y 133 renders **acotados con medidas** (`{n}-medidas.webp`) en R2 |
| **Módulos de casas sobre lotes** | ✅ Subido | Entrega del 25/08 (`FASES/MODULOS PNG`): 2 módulos (Módulo 1: 50.16 m², Módulo 2: 35.26 m²) × 4 orientaciones = 8 capas PNG con transparencia, subidas como `lots/modules/module-{1,2}/{up,down,left,right}.webp`. |
| **Fotos de puntos de vista** | ✅ Subido | Entrega del 23/08: 3 zonas × 4 puntos × día y noche (`viewpoints/{zona}/{n}.{day,night}.webp`). El panel enseña la de día; volver a pulsar la vista elegida abre el comparador de cortina |
| **Vuelos entre pantallas de la Fase 1** | ✅ Subido | Entrega del 21/08: Master Plan → Fase, Fase ↔ Zona (ida y vuelta) y los 6 pares entre las tres zonas activas |
| Vuelo **Fase 1 → Master Plan** | ⏳ Pendiente | Es el único tramo del recorrido sin animación: subir de la fase al Master Plan sigue siendo un corte. **Pedirlo al cliente** (`F1 - MP`); la clave ya la construye `phaseEntryVideo` a la inversa y solo haría falta añadir su helper |
| `FASES/nuevas imagenes/ZONA 1.jpg` | ⚠️ Archivo local dañado | Tiene un rectángulo rojo liso tapando el cuarto superior derecho. **El WebP de R2 está bien** y producción no está afectada, pero si alguien reconvierte las zonas desde esa carpeta hay que pedir el archivo otra vez |

---

## 3. Información que falta o por confirmar

1. ~~**Número de pisos de cada torre.**~~ ✅ Resuelto por los archivos: **6
   pisos** en las tres (`A1…A6`, `B1…B6`, `C1…C6`). `FLOORS_PER_TOWER = 6`.
   La azotea (piso 6) está configurada como terraza sin unidades vendibles.
   Quedan abiertos como mejoras opcionales el video de vuelta (torre → vista ABC)
   o acercamientos a pisos distintos del 5 (hoy volver atrás es un fundido).

2. **Inventario comercial y galerías de departamentos**:
   - ✅ Las **60 unidades de las torres están modeladas** (3 torres × 5 pisos × 4 unidades: `101`…`504`) con sus recortes clicables sobre las plantas y asociadas a su respectiva tipología (Depa 01 a 04).
   - ✅ **Área oficial**: **50 m²** configurada para todos los departamentos.
   - ✅ **Recorrido Virtual 360°**: Vinculado a todas las unidades con reproductor interactivo Kuula.
   - ✅ Las 3 vistas (amoblada, acotada y entregable) con videos de transición funcionan en `DepartamentoFicha`.
   - ✅ **Galerías fotográficas (100% completas)**:
     - Subidas e integradas las 20 tipologías: unidades `x01` (`101…501`), `x02` (`102…502`), `x03` (`103…503`) y `x04` (`104…504`) con 8 fotos 4K cada una (**160 fotos en total**).
   - ⏳ **Pendiente del cliente**: precios reales y estado de venta (disponible / reservado / vendido; hoy `AVAILABLE` por defecto).

3. **Inventario y recortes de terrenos (lotes) y módulos**:
   - ✅ **Módulos de casas**: Módulo 1 (dos pisos, **50.16 m²**) y Módulo 2 (ampliación, **35.26 m²**).
   - ✅ **Recortes de las 8 manzanas completados (133 lotes)**:
     - **Zona 1**: Manzanas O (15 lotes), P (14 lotes), Q (28 lotes), R (12 lotes) = **69 lotes con polígonos clicables**.
     - **Zona 2**: Manzanas K (16 lotes), L (18 lotes), M (16 lotes), N (14 lotes) = **64 lotes con polígonos clicables** y contornos de manzana rotulados (`hotspot`).
   - ✅ **Medidas**: Cada lote cuenta con su plano acotado (`{n}-medidas.webp`) que muestra las dimensiones de linderos y área en m².
   - ✅ **Área: las 8 manzanas, 133 lotes.** Entrega del 25/08 cerró K, L, M, N (Zona 2) y R (Zona 1); O, P y Q ya estaban. Las 76 nuevas se cotejaron **una a una** contra su plano acotado (`{n}-medidas.webp`), que es la misma imagen que ve el comprador en la ficha: coinciden las 76 (el lote 2 de la L entró como 89.19 y se corrigió a 89.18, confirmado por el cliente).
   - ✅ **Posición (esquinera / medianera): las 8 manzanas, 133 lotes.** 20 esquineras y 113 medianeras. Antes de pedirlas se contrastó una regla geométrica —es esquinera la que ocupa una esquina física de la manzana: los dos extremos de la fila más el extremo lejano de cada columna— contra los 57 lotes que O, P y Q ya declaraban: **57 aciertos, 0 fallos**. El cliente confirmó después K, L, M y N exactamente igual que la derivación, y la R se cargó con ella (1, 4, 8, 10).
     - ℹ️ La regla NO es "la esquinera es la más grande": en la O el lote 8 es esquinera con los mismos 66 m² que sus medianeras, y en la P los lotes 2 y 3 son medianeros con 86 y 92 m². Lo que manda es la posición en la manzana.
   - ⏳ **Lo único que falta de los terrenos: estado comercial y precio.** Los 133 figuran `AVAILABLE` por `DEFAULT_LOT_STATUS`, que es una afirmación comercial, no un dato. Precio: los 133 sin declarar.
   - ℹ️ **El aviso del filtro va por eje.** `hasLotPositionInventory()` mira solo la posición, no "¿hay algún inventario?". Con la comprobación antigua, cargar las áreas de la Zona 2 apagaba el aviso de posición mientras ese filtro seguía devolviendo cero.
   - ℹ️ `O_1-CM.jpg`: Se descartó el archivo sobrante de la Mz. O que traía medidas erróneas (`4.30m²`), usando la lámina correcta de 66.00 m².

4. **Polígonos de elementos en zonas**:
   - ✅ **Manzana de torres**: ubicada en la **Zona 3** (`f1-z3-torres`, "Torres El Olimpo de Tumbes") con polígono clicable que lleva a la vista `ABC`.
   - ⏳ **Casas y amenidades**: los elementos generales de la Zona 1 (`f1-z1-casas-1`, `f1-z1-casas-amenidades`) tienen estructura declarada pero polígono simplificado; no bloquea porque los lotes individuales ya son clicables directamente.

5. **Datos de marca, contacto y dominio**:
   - ✅ **Redes del proyecto**: Facebook, Instagram, TikTok oficiales configurados.
   - ✅ **Empresas del Grupo Titanes**: Consultoría JDM, Soluciones Inmobiliarias, Titán y Titanio con logos integrados.
   - ✅ **Ubicación y mapa**: Sector Puyango, Tumbes. Coordenadas (-80.413501, -3.562697), 27 POIs clasificados y plano maestro superpuesto y georreferenciado en Mapbox.
   - ⛔ **Dominio y Resend**: Pendiente definir dominio de producción y cuentas de correo para habilitar el envío real del formulario de contacto.

6. **Brochure y manual de marca**:
   - Pendiente archivo PDF final del brochure comercial para descarga en showroom.
   - Paleta de color aplicada: Azul marino `#233D78` y Dorado `#D69135` (muestreados de la identidad oficial).

7. **Logos**:
   - ✅ Entregados e integrados: Logo Olimpo a color y blanco (`identity/olimpo/`), Grupo Titanes y sus cuatro filiales (`identity/titanes/`).

8. **Datos comerciales generales (del formulario de inicio)**:
   - ✅ Bono Techo Propio: S/ 52,250 (para grupos familiares sin propiedades e ingresos menores a S/ 3,715).
   - ✅ Lotes estándar: 5.50 × 12.00 = 66.00 m², casas de 35 m² (2 dormitorios).
   - ✅ Servicios: Luz, agua, desagüe, áreas verdes, canchas deportivas y club house.

---

## 4. Decisiones técnicas implementadas

1. **Rutas y experiencia**:
   - Toda la navegación del recorrido (Intro → Lados → Master Plan → Fase 1 → Zonas → Torres / Lotes / Departamentos) vive dentro de `/showroom` como máquina de estados (`NavigationStep`), permitiendo transiciones fluidas sin recargas de página.
   - `/ubicacion`: Mapa interactivo con Mapbox, overlay georreferenciado del plano del proyecto, 27 POIs categorizados y panel lateral.
   - `/amenidades`: Vista general de amenidades con tarjetas por fase.
2. **Assets y entrega**:
   - Proxy same-origin `/api/r2/...` para entrega eficiente y sin problemas CORS de videos de transición y texturas WebP.
   - Fallback de imágenes: `LoteFicha` prueba primero el render acotado (`{n}-medidas.webp`) y cae transparentemente al render limpio (`{n}.webp`) si no estuviera disponible.

---

## 5. Estado de la UI y Pantallas

| Pantalla / Componente | Estado | Detalle |
|---|---|---|
| **Cara 0 (Intro)** (`/showroom`) | ✅ Completo | Imagen WebP, video loop, botón Ingresar con transición a lados |
| **Giro 360° de lados** (`/showroom`) | ✅ Completo | 4 lados continuos con videos de giro lateral y acceso a Master Plan |
| **Master Plan y Fases** (`/showroom`) | ✅ Completo | Vista aérea general; Fase 1 clicable, Fases 2, 3 y 4 con "Próximamente" |
| **Recorrido de Zonas** (`/showroom`) | ✅ Completo | Cuadrícula en L (Zonas 1, 2, 3) con navegación por chevrons y teclado |
| **Panel lateral de Zona** (`ZonePanel`) | ✅ Completo | Flota traslúcido sobre la toma, que pasa por debajo a sangre: el escenario de la zona ocupa la ventana entera como los demás pasos, de modo que los vuelos aterrizan sin salto lateral. Pestañas de "Vistas" y "Filtros"; las vistas salen de día y la elegida se vuelve a pulsar para abrir el comparador |
| **Comparador día / noche** (`ViewpointCompare`) | ✅ Completo | Ocupa el hueco de la toma, a la izquierda del panel, que se queda visible. Día a la izquierda y noche a la derecha con una cortina arrastrable en medio; se mueve con el ratón, con el dedo o con las flechas, y se cierra con Escape. La toma de noche se precarga al ELEGIR el punto, no al abrir el comparador, así que la mitad derecha entra ya pintada |
| **Terrenos de Zona 1** (Mz. O, P, Q, R) | ✅ Completo | 69 lotes con polígonos clicables, contornos de manzana rotulados y ficha |
| **Terrenos de Zona 2** (Mz. K, L, M, N) | ✅ Completo | 64 lotes con polígonos clicables, contornos de manzana rotulados y ficha |
| **Ficha de Terreno** (`LoteFicha`) | ✅ Completo | Render acotado con medidas y panel de datos. Los módulos se plantan como capas transparentes ENCIMA del render limpio —no lo sustituyen—, giradas hacia la calle a la que sale el lote. El **Módulo 2 es la ampliación del 1**, no otra casa: pintarlo apila las DOS capas; volver a pulsar el módulo puesto lo quita |
| **Vista de las tres torres (`ABC`)** | ✅ Completo | Polígonos clicables por torre con video de acercamiento a piso 5 |
| **Recorrido de Torre y Pisos** | ✅ Completo | 6 niveles, selector de piso vertical, salto lateral A ↔ B ↔ C conservando piso |
| **Departamentos en Planta** | ✅ Completo | 4 departamentos por piso (101…504), recortes clicables; piso 6 como azotea |
| **Ficha de Departamento** (`DepartamentoFicha`) | ✅ Completo | Mismo diseño que la ficha de unidad de `/unidad/[id]`: panel blanco con los datos a la izquierda y el plano a la derecha. Las otras dos vistas se ofrecen en pastillas laterales sobre el plano —entrando por Amoblado quedan Medidas a la izquierda y Sin amoblar a la derecha—, y los 24 videos animan cualquiera de los seis saltos. La X pliega el panel para ver el plano a pantalla completa |
| **Página de Ubicación** (`/ubicacion`) | ✅ Completo | Mapa Mapbox, overlay georreferenciado del plano, 27 POIs de Tumbes con filtros |
| **Página de Amenidades** (`/amenidades`) | ✅ Completo | Tarjetas de fases (Fase 1 activa) y vista de detalle `/amenidades/phase-1` con las 3 tarjetas de amenidades (Club House, Parque Mz. R, Parque Mz. P) con portadas personalizadas y visor interactivo de galería 4K WebP |
| **Herramienta de Coordenadas** | ✅ Completo | `ShowroomCoordinateTool` integrada para marcar/ajustar polígonos sobre cualquier vista |

