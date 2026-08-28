# Assets: nomenclatura y rutas

## 1. Dos nomenclaturas, una tabla de equivalencias

El cliente entrega los archivos con su propia nomenclatura
(`F1.Z1.ArrIzq.png`). Dentro del bucket R2 se guardan con los **slugs estables**
del dominio, que son los mismos que usan los enums, la base de datos y las URLs.

La conversión se hace una sola vez, al subir. El código **nunca** parsea nombres
de archivo del cliente.

| Archivo entregado | Significado | Clave en R2 |
|---|---|---|
| `MASTER PLAN.jpg` | La urbanización entera | `urbanization/master-plan.webp` |
| `FASE 1.jpg` | Toma aérea de la Fase 1 | `urbanization/phases/phase-1/overview.webp` |
| `ZONA 1.jpg` | Fase 1, Zona 1 | `urbanization/phases/phase-1/zone-1.webp` |
| `ZONA 2.jpg` | Fase 1, Zona 2 | `urbanization/phases/phase-1/zone-2.webp` |
| `ZONA 3.jpg` | Fase 1, Zona 3 | `urbanization/phases/phase-1/zone-3.webp` |

Cada una de esas tomas **es una zona**: la cuadrícula por la que se desplaza el
visitante pertenece a la fase, no a la zona.

Los renders definitivos (`FASES/nuevas imagenes/`) sustituyen a la primera
entrega, que venía con la nomenclatura `F1.Z1.ArrIzq.png`. Aquella traía las
cuatro celdas nombradas todas con `Z1`, así que el número de zona no se podía
deducir del nombre y se asignó en orden de lectura. Con los renders nuevos el
reparto sale de lo que se ve en las imágenes, comprobado recortando
`FASE 1.jpg` y comparando cada encuadre:

| Zona | Celda | (fila, columna) | Qué se ve |
|---|---|---|---|
| Zona 1 | `top-left` | (0, 0) | Casas con el parque y el área de piscinas |
| Zona 2 | `bottom-left` | (1, 0) | Segundo grupo de casas y los lotes al este |
| Zona 3 | `top-right` | (0, 1) | La manzana de las torres y los lotes al este |
| Zona 4 | `bottom-right` | (1, 1) | Sin toma: no entra en esta etapa |

`ViewSlotAssetSuffix` (`enums.ts`) sigue guardando los sufijos de la primera
entrega por si vuelve a llegar material con esa nomenclatura; los renders
nuevos ya no la usan.

> **Clave renombrada**: la toma general pasó de
> `urbanization/phases/overview.webp` a `urbanization/master-plan.webp`. El
> cliente la llama Master Plan y es la primera vista del proyecto, no un
> accesorio de las fases. La clave vieja sigue en el bucket con la toma
> anterior (`TOMA_FASES.png`); ya no la usa nadie.

---

## 2. Mapa de claves R2

```
homepage/
├── intro_video.mp4                      ← PORTADA EL OLIMPO DE TUMBES.mp4 ✅ subido
├── intro.webp                           ← Poster del video en 4K          ✅ subido
└── fallback.webp                        ← Imagen fallback portada (aa.png)✅ subido

video/
├── video.mp4                            ← VIDEO EL OLIMPO DE TUMBES.mp4   ✅ subido
└── poster.webp                          ← Poster 4K del Master Plan       ✅ subido

urbanization/
├── master-plan.webp                     ← MASTER PLAN       ✅ subido
├── phases/
│   ├── overview.webp                    ← TOMA_FASES        (huérfano)
│   ├── phase-1/
│   │   ├── overview.webp                ← FASE 1            ✅ subido
│   │   ├── zone-1.webp                  ← ZONA 1            ✅ subido
│   │   ├── zone-2.webp                  ← ZONA 2            ✅ subido
│   │   ├── zone-3.webp                  ← ZONA 3            ✅ subido
│   │   ├── zone-4.webp                  ← (primera entrega) (sin usar)
│   │   ├── entry.mp4                    ← MP - F1           ✅ subido
│   │   ├── zone-{1,2,3}-entry.mp4       ← F1 - Z{n}         ✅ subido
│   │   ├── zone-{1,2,3}-exit.mp4        ← Z{n} - F1         ✅ subido
│   │   └── transitions/
│   │       └── zone-{n}_to_zone-{m}.mp4 ← Z{n} - Z{m}  (6)  ✅ subido
│   ├── phase-2/  (pendiente)
│   ├── phase-3/  (pendiente)
│   └── phase-4/  (pendiente)
├── amenities/
│   └── phase-1/
│       ├── club-house/{1…7}.webp        ← CLUB HOUSE (7 fotos, portada #7) ✅ subido
│       ├── parque-mz-r/{1…6}.webp       ← PARQUE 1 (Mz R, 6 fotos, portada #6) ✅ subido
│       └── parque-mz-p/{1…6}.webp       ← PARQUE 2 (Mz P, 6 fotos, portada #4) ✅ subido
├── sides/

│   ├── side-0/                                             ✅ subido
│   │   ├── day.webp        ← 0.3.jpg   (respaldo)
│   │   ├── loop-intro.mp4  ← 0.1.mp4   (entra una vez)
│   │   ├── loop.mp4        ← 0.2.mp4   (se queda en bucle)
│   │   └── enter.mp4       ← 0-1.mp4   (portada → cara 1)
│   ├── side-1/             ← 1.jpg + O1-MP.mp4 + giros 1↔2, 1↔4 ✅ subido
│   ├── side-2/             ← 2.jpg + O2-MP.mp4 + giros 2↔1, 2↔3 ✅ subido
│   ├── side-3/             ← 3.jpg + O3-MP.mp4 + giros 3↔2, 3↔4 ✅ subido
│   └── side-4/             ← 4.jpg + O4-MP.mp4 + giros 4↔3, 4↔1 ✅ subido
├── viewpoints/
│   └── zone-{1,2,3}/{1,2,3,4}.{day,night}.webp             ✅ subido
├── lots/
│   ├── mz-{k,l,m,n,o,p,q,r}/{n}.webp                       ✅ subido
│   ├── mz-{k,l,m,n,o,p,q,r}/{n}-medidas.webp               ✅ subido
│   └── modules/module-{1,2}/{up,down,left,right}.webp       ✅ subido
├── apartments/
│   ├── depa-1/
│   │   ├── {furnished,measured,unfurnished}.webp
│   │   └── transitions/{furnished,measured,unfurnished}_to_{…}.mp4
│   ├── depa-2/…  depa-3/…  depa-4/…
│   └── gallery/
│       ├── floor-{1…5}/1…8.webp         ← DEPA 101…501 (8 fotos × piso) ✅ subido
│       ├── depa-{102…502}/1…8.webp      ← DEPA 102…502 (8 fotos × depa) ✅ subido
│       ├── depa-{103…503}/1…8.webp      ← DEPA 103…503 (8 fotos × depa) ✅ subido
│       └── depa-{104…504}/1…8.webp      ← DEPA 104…504 (8 fotos × depa) ✅ subido
└── towers/
    ├── overview.webp                        ← ABC              ✅ subido
    ├── tower-a/
    │   ├── entry.mp4                        ← ABC-A5.mp4       ✅ subido
    │   ├── facade.webp                                         (pendiente)
    │   └── floors/1…6.webp                  ← A1…A6            ✅ subido
    ├── tower-b/  (entry.mp4 ← ABC-B5.mp4, floors/1…6 ← B1…B6)  ✅ subido
    └── tower-c/  (entry.mp4 ← ABC-C5.mp4, floors/1…6 ← C1…C6)  ✅ subido
```

### Terrenos: un render por lote

| Archivo entregado | Significado | Clave en R2 |
|---|---|---|
| `PLANTAS/K_2.png` | Toma cenital centrada en el lote 2 de la Mz. K | `urbanization/lots/mz-k/2.webp` |

Son **133 archivos** repartidos entre `FASES/PLANTAS` y `FASES/PLANTAS 2` —las dos
carpetas son una sola entrega partida en dos, no hay solapes— y cubren ocho
manzanas: K, L, M, N (Zona 2) y O, P, Q, R (Zona 1).

Dos avisos sobre la numeración, los dos comprobados contra los archivos:

1. **El número del archivo no siempre es el del lote.** En la manzana O los
   quince archivos van de `O_1` a `O_15` y los lotes que representan son del
   **8 al 22**. El desfase vive en `firstFileNumber` (`lots.ts`) y en ningún
   otro sitio. En las demás manzanas coinciden.
2. **Los huecos no son archivos que falten.** No hay `P_10` ni `R_9` porque el
   lote 10 de la P y el 9 de la R son **áreas recreativas**: no se venden.

Estos renders son fotográficos (césped, tierra), así que comprimen mal: a
3840×2160 pesaban 3,3 MB cada uno. Se subieron a **2560×1440 con `-q 78`**, que
los deja en ~1,1 MB —igual de nítidos a pantalla completa— y baja el lote
entero de 440 MB a 152 MB:

```bash
cwebp -q 78 -m 6 -mt -resize 2560 1440 FASES/PLANTAS/K_2.png -o K_2.webp
```

> Ojo: estas tomas **no** resaltan el lote; el resaltado lo pinta la web con su
> propio polígono. Las de `FASES/PLANTAS MEDIDAS` sí lo resaltan y además lo
> acotan (`5.50 × 12.00 = 66.00 m²`), que es lo que le falta a la ficha — pero
> ahí solo llegaron 8 archivos.

### Módulos de casa: ocho capas para los 133 lotes

| Archivo entregado | Significado | Clave en R2 |
|---|---|---|
| `MODULOS PNG/M1-DER.png` | Módulo 1 con la fachada a la derecha | `urbanization/lots/modules/module-1/right.webp` |

Entrega del **25/08** (`FASES/MODULOS PNG`). No son tomas: son **capas**. Cada
archivo es un PNG transparente de 2560×1440 —el mismo encuadre que el render
del lote— con la casa ya dibujada en el sitio que le toca, así que la ficha
apila el que corresponda encima del render limpio y no tiene que colocar nada.

**El módulo 2 no sustituye al 1: se suma.** No son dos casas alternativas sino
una casa y su ampliación, y el recorte del 2 encaja exactamente en el hueco que
deja el 1 —se comprobó superponiéndolos—. Por eso "Módulo 1" pinta una capa y
"Módulo 2" pinta las dos, el 1 debajo y el 2 encima; enseñar la del 2 sola
dejaría media casa dibujada.

Por eso son ocho archivos y no 266: lo que cambia entre un lote y otro no es la
casa sino **hacia dónde sale a la calle**, y de eso solo hay cuatro
posibilidades. La equivalencia es directa:

| Cliente | `LotFacing` | Clave |
|---|---|---|
| `ARRIBA` | `UP` | `up.webp` |
| `ABAJO` | `DOWN` | `down.webp` |
| `IZQ` | `LEFT` | `left.webp` |
| `DER` | `RIGHT` | `right.webp` |

Qué lote mira a dónde lo dictó el cliente por manzana y vive en `BLOCK_FACINGS`
(`lots.ts`), declarado como él lo dijo: una orientación por manzana y las
excepciones aparte ("del 1 al 4 abajo, del 5 al 9 izquierda, **el resto** a la
derecha"). Escrito así los huecos se resuelven solos — la P no tiene lote 10 ni
la R el 9. Es un dato **oculto**: no se rotula en ninguna parte, su única misión
es elegir el archivo.

Las ocho líneas se comprobaron contra los polígonos de `LOT_HOTSPOTS`, que están
medidos sobre la misma toma de zona: los lotes 1–4 de la Q ocupan la fila de
abajo de su manzana (`y 71.6–83.4`), y por eso miran ABAJO. Y el apilado se
comprobó superponiendo los archivos sobre los renders de las ocho manzanas
antes de subir nada.

Comprimen muy bien —son casi todo transparencia— así que las ocho capas pesan
**160 KB en total**:

```bash
cwebp -q 88 -alpha_q 100 -m 6 -mt "FASES/MODULOS PNG/M1-DER.png" -o right.webp
```

> El `-alpha_q 100` no es opcional: el canal alfa es el recorte de la casa, y
> comprimirlo con pérdida le come el borde. El WebP con alfa a 2560×1440 tiene
> que medir **exactamente** lo mismo que el render del lote: las dos imágenes
> se recortan con el mismo `object-cover`, y si una tuviera otra proporción el
> módulo se despegaría del terreno al cambiar de pantalla.

### Departamentos: cuatro tipologías, no setenta y dos unidades

| Archivo entregado | Significado | Clave en R2 |
|---|---|---|
| `DEPA 01/AMOBLADO.jpg` | El departamento 1 de la planta, con muebles | `urbanization/apartments/depa-1/furnished.webp` |
| `DEPA 01/CAD.jpg` | El mismo, acotado | `urbanization/apartments/depa-1/measured.webp` |
| `DEPA 01/ENTREGABLE.jpg` | El mismo, sin amoblar | `urbanization/apartments/depa-1/unfurnished.webp` |
| `DEPA 01/ANIMACIONES/D1.A - D1.AC.mp4` | Amoblado → acotado | `urbanization/apartments/depa-1/transitions/furnished_to_measured.mp4` |

Solo llegaron **cuatro juegos** y eso es todo lo que hace falta: las cuatro
posiciones de la planta se repiten idénticas en las tres torres y en los cinco
pisos con departamentos, así que la tipología es del SITIO, no de la unidad.
Doce imágenes y veinticuatro videos cubren las sesenta unidades; colgarlos de
la unidad habría pedido setecientos veinte archivos.

Qué `DEPA` es cada sitio se comprobó recortando la planta (`A5.webp`) por los
polígonos de `towers.ts` y comparándola con cada plano, **no** se dedujo del
nombre del archivo: la `DEPA 01` es la de abajo a la izquierda —cocina arriba a
la derecha, entrada por la derecha— y la `DEPA 04` la de arriba a la izquierda.
El reparto vive en `apartments.ts`.

Tres cosas sobre las transiciones:

1. **Están los seis pares ordenados**, no cuatro: se puede saltar del acotado
   al entregable sin pasar por el amoblado. Ir y volver son archivos distintos
   —la animación no es la misma del revés—, así que la clave lleva origen y
   destino, como la de los lados.
2. **La `DEPA 01` trae una letra de más en el destino** (`D1.A - D1.AC.mp4` en
   vez de `D1.A - D1.C.mp4`). Es la única; se corrigió al subir tomando la
   última letra del tramo, y en el bucket ya no queda rastro.
3. **El primer fotograma es la vista de origen y el último la de destino**,
   exactos. Por eso la ficha cambia la imagen al terminar el video y el corte
   no se ve.

Las tomas llegaron a **5504×3072**, que no es 16:9 (1,791 frente a 1,778), y los
videos a 1920×1080, que sí lo es. Se subieron **a 3840×2160**, es decir con un
0,8 % de compresión horizontal, para que imagen y video ocupen exactamente el
mismo rectángulo: con la proporción original el relevo daba un salto de unos
quince píxeles justo en el fotograma en el que no se puede notar nada.

```bash
cwebp -q 82 -m 6 -mt -resize 3840 2160 "FASES/3.DEPARTAMENTOS/DEPA 01/AMOBLADO.jpg" -o furnished.webp
```

Los 24 videos (1920×1080, ~2,2 s, ~3,4 MB) se subieron tal cual, sin
recomprimir: 82 MB en total. Las 12 imágenes pasaron de 58 MB en JPG a 2,1 MB
en WebP.

### Portada y lados: la entrega del 24/08

Llegó en `FASES/portada imagenes/` (portada y las 4 caras) y
`FASES/animaciones nuevas/` (los 13 videos de movimiento). Sustituye por
completo a `FASES/TRANSICIONES/`, que era la primera entrega.

| Archivo entregado | Significado | Clave en R2 |
|---|---|---|
| `portada imagenes/0.1.mp4` | Entrada a la Urbanización, se ve una vez | `urbanization/sides/side-0/intro.day.mp4` |
| `portada imagenes/0.2 loop.mp4` | Se queda en bucle después de la entrada | `urbanization/sides/side-0/loop.day.mp4` |
| `portada imagenes/0.3.jpg` | Respaldo del bucle | `urbanization/sides/side-0/day.webp` |
| `animaciones nuevas/0-1.mp4` | Del bucle de portada a la cara 1 | `urbanization/sides/transitions/side-0_to_side-1.day.mp4` |
| `portada imagenes/1.jpg` … `4.jpg` | Las cuatro caras | `urbanization/sides/side-{1…4}/day.webp` |
| `animaciones nuevas/1-2.mp4` | Giro de la cara 1 a la 2 | `urbanization/sides/transitions/side-1_to_side-2.day.mp4` |
| `animaciones nuevas/O1-MP.mp4` | De la cara 1 al Master Plan | `urbanization/sides/transitions/side-1_to_master-plan.day.mp4` |

Cuatro cosas comprobadas contra los archivos, no deducidas de los nombres:

1. **La portada son DOS videos, no uno.** `0.1` entra y termina; `0.2` es
   cerrado y se queda girando. El último fotograma de `0.1` es el primero de
   `0.2` (PSNR 39 dB) y el primero de `0.2` es igual al último (39,6 dB), así
   que ni el relevo ni la vuelta del bucle se ven. Por eso el bucle NO lleva
   `autoPlay`: se queda quieto en su primer fotograma y arranca cuando la
   entrada acaba. Si se dejara suelto, la entrada (15,1 s) duraría más que el
   bucle (12,1 s) y al relevo lo encontraría a media vuelta.

2. **`3-2.mp4` está mal rotulado: va de la 2 a la 3, no de la 3 a la 2.**
   Comprobado por los dos extremos —su primer fotograma es la cara 2 (22,6 dB
   contra `2.jpg`, 12,1 contra `3.jpg`) y el último la cara 3— y contra
   `2-3.mp4`, con el que coincide fotograma a fotograma en el mismo sentido
   (32 dB) y no invertido (13 dB). Es decir: llegaron dos veces el 2→3 y **el
   3→2 no llegó**. El que está subido se reconstruyó invirtiendo `2-3.mp4`,
   que es exactamente lo que son los demás pares de ida y vuelta (`1-2` y
   `2-1` coinciden invertidos a 28–31 dB en todo el clip) y es seguro porque
   las escenas no tienen nada animado: con la cámara detenida los fotogramas
   son idénticos bit a bit. **Cuando el cliente entregue el 3→2 de verdad, se
   sube a la misma clave y se pisa.**

3. **Los videos van a R2 sin recomprimir**, en 4K a 24 fps como llegaron. Es
   lo que ya había en el bucket y además pesan menos que la primera entrega
   (5 MB por giro frente a 11 MB). Solo se convirtieron las imágenes.

4. **Las tomas fijas no son el fotograma final del video.** Comparten encuadre
   pero los renders están más contrastados y saturados, y los videos llevan
   una neblina que ellos no tienen (PSNR 20–24 dB en los trece pares, muy por
   debajo de los 39 dB del empalme `0.1`→`0.2`). Al cambiar de video a imagen
   se nota un salto de color. No es un error de mapeo —el encuadre coincide en
   todos— sino que vienen de pasadas de render distintas; corregirlo pide
   igualar el grading, que es trabajo del cliente.

```bash
cwebp -q 82 -m 6 -mt -resize 3840 2160 "FASES/portada imagenes/1.jpg" -o side-1.day.webp
```

Las 5 imágenes pasaron de 48 MB en JPG a 9,4 MB en WebP (PSNR 39–40 dB).

### Recorrido de la fase: los vuelos entre pantallas

Entrega del 21/08 en `FASES/ANIMACIONES/`. Son los trece vuelos de cámara que
enlazan las pantallas del recorrido dentro de la Fase 1:

| Archivo entregado | Tramo | Clave en R2 |
|---|---|---|
| `MP - F1.mp4` | Master Plan → Fase 1 | `urbanization/phases/phase-1/entry.mp4` |
| `F1 - Z1.mp4` | Fase 1 → Zona 1 | `urbanization/phases/phase-1/zone-1-entry.mp4` |
| `Z1 - F1.mp4` | Zona 1 → Fase 1 | `urbanization/phases/phase-1/zone-1-exit.mp4` |
| `Z1 - Z2.mp4` | Zona 1 → Zona 2 | `urbanization/phases/phase-1/transitions/zone-1_to_zone-2.mp4` |

Todos a 3840×2160, 60 fps, ~2,2 s (el del Master Plan, 2,5 s) y 5–9 MB. Se
suben sin recomprimir, como los de los lados.

Tres cosas de esta entrega:

1. **Están los seis pares ordenados entre las tres zonas activas**, y la ida y
   la vuelta con la fase por separado. Es decir, todo tramo que la UI permite
   recorrer tiene su vuelo, con una excepción: **no llegó el `F1 - MP`**, así
   que subir de la fase al Master Plan es lo único que sigue siendo un corte.

2. **El encuadre coincide** —los trece pares dan valores de PSNR agrupados
   (15–17 dB), que es lo que descarta un error de mapeo— y **el brillo también**:
   la luma media del último fotograma y la de su toma fija no se separan más de
   un 1 %. Lo que sí difiere es el contraste y la saturación locales; los videos
   se ven algo más lavados, pero de lejos. `StepTransition` funde el video sobre
   el destino medio segundo en vez de cortar, y con eso no se nota.

   > **Lo que se veía antes NO era el material.** Cada paso echaba un velo negro
   > sobre su toma (15–25 % según el paso) que nunca se aplicaba al video, así
   > que al aterrizar la imagen entraba hasta un 33 % más oscura de golpe. Los
   > velos eran decorativos —la capa de más abajo, debajo de los SVG de
   > recortes— y se quitaron todos. Si alguien vuelve a añadir uno, tiene que
   > ponerlo también sobre el video del vuelo o el salto vuelve.

3. **`FASES/nuevas imagenes/ZONA 1.jpg` está corrupto**: tiene un rectángulo
   rojo liso tapando el cuarto superior derecho. **El WebP que sirve R2 está
   bien** —se subió antes de que el archivo se dañara— así que producción no
   está afectada y no hay nada que rehacer. Ojo si alguien vuelve a convertir
   las zonas desde esa carpeta: hay que pedir el archivo de nuevo primero.

### Puntos de vista: la misma toma de día y de noche

Entrega del 23/08 en `FASES/RENDERS SECTORES/`, 24 archivos:

| Archivo entregado | Significado | Clave en R2 |
|---|---|---|
| `Z1-3.1.jpg` | Zona 1, punto de vista 3, de día | `urbanization/viewpoints/zone-1/3.day.webp` |
| `Z1-3.2.jpg` | El mismo punto, de noche | `urbanization/viewpoints/zone-1/3.night.webp` |

Son 3 zonas × 4 puntos × 2 horas, que casa exactamente con los marcadores ya
colocados en `viewpoints.ts`. El número del archivo es el `order` del punto: es
un emparejamiento por posición, así que reordenar los marcadores reordena las
fotos.

**Cuál es la de día no se dedujo del nombre**: se midió el brillo medio de las
doce parejas —el `.1` sale entre 96 y 139, el `.2` entre 45 y 115— y se
comprobó a ojo en la más ajustada (`Z3-4`, donde el `.2` es un atardecer y no
noche cerrada). En las doce, el `.1` es el de día.

Las dos tomas de cada punto comparten **encuadre exacto**: las mismas personas
en el mismo sitio, el mismo coche, el mismo perro. De eso vive el comparador de
cortina (`ViewpointCompare`), que descubre una sobre otra sin que nada se mueva.
Si alguna pareja llegara desalineada, el efecto se rompe y no se puede corregir
desde el código.

```bash
cwebp -q 82 -m 6 -mt -resize 3840 2160 "FASES/RENDERS SECTORES/Z1-3.1.jpg" -o 3.day.webp
```

De 181 MB en JPG a 52 MB en WebP (PSNR 36–41 dB).

### Torres: qué es cada archivo

| Archivo entregado | Significado | Clave en R2 |
|---|---|---|
| `ABC.png` | Toma cenital con las tres torres | `urbanization/towers/overview.webp` |
| `A1.png` … `A6.png` | Plantas de los pisos 1 a 6 de la Torre A | `urbanization/towers/tower-a/floors/{1…6}.webp` |
| `ABC-A5.mp4` | Acercamiento de la toma general a la Torre A | `urbanization/towers/tower-a/entry.mp4` |

Lo mismo para B y C. Tres cosas que conviene no perder de vista:

1. **El número del video no es el de la torre, es el del piso en el que
   aterriza.** `ABC-A5.mp4` termina exactamente en el fotograma de `A5.png`, y
   por eso al acabar el video se muestra esa planta y el corte no se ve. Ese
   piso se declara en `entryLevel` (`towers.ts`), no se deduce del nombre del
   archivo: si mañana llega un `ABC-A3.mp4`, se cambia el número y ya está.
2. **Solo hay video para ENTRAR desde la toma general.** Pasar de una torre a
   la de al lado no tiene animación y conserva el piso actual
   (ver `01-NAVEGACION.md` §7).
3. Las tres torres tienen **6 pisos**, confirmado por los archivos (A1…A6).
   `FLOORS_PER_TOWER` ya no es un valor provisional.

Todas estas rutas se construyen con helpers en
`src/data/urbanization/assets.ts` — no se escriben a mano en ningún componente.

> **Por qué la zona cuelga directo de la fase y no de una carpeta `zones/`.**
> La API de Cloudflare rechaza cualquier clave R2 que contenga el segmento
> `zones` — colisiona con su propia API de Zones y responde
> `The specified bucket does not exist`. Comprobado: `zone/`, `zones2/` y
> `xzonesx/` suben sin problema; `zones/` y `Zones/` fallan siempre. Como el
> id de zona ya viene prefijado (`zone-1`), la carpeta agrupadora no aportaba
> nada y se eliminó. Si algún día hace falta subir a una ruta con `zones`,
> habría que usar el endpoint S3 de R2 en vez de `wrangler r2 object put`.

---

## 3. Reglas heredadas del proyecto (siguen vigentes)

- **Nunca** rutas locales ni URLs absolutas en componentes: siempre
  `getAssetUrl(clave)` de `src/utils/assets.ts`.
- Los archivos de `src/data/urbanization/*` guardan **claves relativas**, no
  URLs. El dominio del bucket lo pone `getAssetUrl()` al renderizar.
- Los **videos** se sirven por el proxy same-origin `/api/r2/...` (lo resuelve
  `getAssetUrl()` solo): R2 público no manda cabeceras CORS para todos los
  orígenes y el navegador no puede hacer *range requests*.
- Las imágenes en R2 **no se ven en desarrollo local**; hay que verificar contra
  el sitio desplegado.
- Cloudflare Pages rechaza cualquier asset de más de 25 MiB en `public/`: los
  videos van a R2, nunca al repositorio.

---

## 4. Conversión recomendada al subir

Los archivos llegan en PNG a 3840×2160 (11–19 MB cada uno). Antes de subir:

- Convertir a **WebP** (las claves del código ya asumen `.webp`).
- Mantener 3840×2160 para la versión de escritorio; considerar una variante
  reducida para móvil si el peso lo pide.
- Los originales entregados están en `FASES/` en la raíz del repositorio. Esa
  carpeta es el **drop de origen**, no se sirve desde ahí.

Los 6 archivos de la Fase 1 ya están subidos. Se convirtieron con:

```bash
cwebp -q 82 -m 6 -resize 3840 2160 "FASES/nuevas imagenes/ZONA 1.jpg" -o zone-1.webp
```

y se subieron con `wrangler r2 object put <bucket>/<clave> --file=… --content-type=image/webp --remote`.
El lote completo pasó de 86 MB en PNG a 6,6 MB en WebP, manteniendo 3840×2160
(PSNR 39–44 dB). Para las Fases 2, 3 y 4, y para las Zonas 2–4, repetir lo mismo.

Las 19 tomas de las torres (`ABC` + 18 plantas) llegaron a **5760×3240** y se
redujeron a 3840×2160 en la misma pasada:

```bash
cwebp -q 82 -m 6 -mt -resize 3840 2160 "3. PLANTAS EL EDIFICIO/A1.png" -o A1.webp
```

De 430 MB en PNG a 13 MB en WebP. Los tres videos de acercamiento
(1920×1080, ~2,2 s, ~3 MB) se subieron tal cual, sin recomprimir.

---

## Romper la caché al reemplazar un asset

Las claves de R2 son estables: `urbanization/phases/phase-1/zone-1.webp` sigue
llamándose igual después de que el cliente mande una toma nueva. La URL no
cambia, así que el navegador del visitante sigue sirviendo la copia anterior.

`getAssetUrl()` añade a cada URL un sufijo `?v=<versión>`. Al subir esa versión,
todas las URLs cambian y el navegador vuelve a pedir el archivo.

```bash
npm run assets:bump
```

**Cuándo se corre:** después de reemplazar el contenido de una clave que ya
existía en el bucket.

**Cuándo NO hace falta:** si solo se subieron claves nuevas — nadie las tenía
cacheadas.

La versión es **global**: al subirla se revalida todo el media, no solo lo que
cambió. Es el precio de tener un solo número, y por eso conviene agrupar los
reemplazos de una entrega y hacer un solo bump al final.

`NEXT_PUBLIC_ASSET_VERSION` pisa el valor desde el entorno, para romper la
caché en un despliegue sin tocar código.

> Nunca edites `DEFAULT_ASSET_VERSION` a mano en `src/utils/assets.ts`: ese es
> exactamente el paso que se olvida, y el fallo que produce —el cliente ve la
> imagen anterior— no se distingue de un problema de caché suyo.
