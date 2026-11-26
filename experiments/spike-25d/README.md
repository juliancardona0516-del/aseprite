# Spike 2.5D pixel art (aislado)

Prueba de viabilidad: sprites pixel art como *billboards* dentro de una escena 3D con cámara ortográfica alta,
sol direccional y sombras, renderizado a baja resolución y escalado *nearest-neighbor*.

Es un experimento aislado. No toca Aseprite (`src/`, `laf/`, CMake) ni la skill de Pixelbolt
(`.claude/skills/pixelbolt-pixel-art/`), y no añade dependencias al repo. De Pixelbolt solo usa su salida:
los PNG que exporta.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | El spike: escena, pase final de paleta y fundido, controles y la función determinista `window.__draw(t)` |
| `assets/sprites.js`, `assets/*.png` | Sprites exportados por Pixelbolt 0.14.0 (caballero con idle de 4 fotogramas, roca `shale`), 3.5 KB en total |
| `build-assets.cjs` | Regenera `assets/` ejecutando el CLI de Pixelbolt sobre las fuentes |
| `assets-src/knight.poses.json` | Fuente del caballero: el rig `hero` de los ejemplos de Pixelbolt, recoloreado |
| `capture.cjs` | Exporta cualquier página del spike (`--page`) fotograma a fotograma y la codifica en MP4, con Three.js servido en local |
| `wakayama.html` | Escena narrativa: el rōnin y el dragón ante la pagoda y la cascada de Nachi (ver más abajo) |

## Cómo ejecutarlo

Necesita un navegador con WebGL2 y conexión a internet: `three@0.160.0` se carga desde jsDelivr mediante un import map.

```bash
cd experiments/spike-25d
python3 -m http.server 8000
# abrir http://localhost:8000/
```

También funciona abriendo `index.html` directamente, porque los sprites van en un script clásico con PNG en data URI.

**Controles del panel:**
- Animación automática.
- Cámara: giro, inclinación, rotación en 8 o 16 direcciones o continua, y ajuste a la rejilla de píxel.
- Sol: azimut y altura.
- Sombras: plana o shadow map, y su filtro.
- Estética: cuantización a paleta, tramado, suelo nuevo o anterior, sprites de Pixelbolt o del spike,
  corrección vertical, sprites iluminados o no, y resolución interna.

**Teclas:** ←/→ gira un paso de cámara, ↑/↓ inclina, A/D mueve el sol y espacio pausa.

**Parámetros por URL** (para comparar o exportar):

| Parámetro | Valores |
|---|---|
| `camMode` | `d8`, `d16`, `cont` |
| `fade` | segundos de fundido; `0` = corte seco |
| `shadowMode` | `planar`, `sun`, `billboard` |
| `shadowType` | `basic`, `pcf` |
| `quant` | `0` / `1` |
| `spread` | 0–12 |
| `ground` | `soft`, `fine` |
| `sprites` | `pixelbolt`, `grid` |
| `correct` | `tilt`, `stretch`, `none` |
| `lit` | `0` / `1` |
| `snap` | `0` / `1` |
| `res` | `6`, `4`, `3` |
| `render` | oculta el panel; la escena solo avanza con `window.__draw(t)` |

### Exportar video

Requiere Node, Playwright con Chromium y ffmpeg (ninguno es dependencia del repo):

```bash
node capture.cjs                                # -> out/preview.mp4 (y out/frames/*.png)
node capture.cjs --query "fade=0" --out out/cortes.mp4
```

Three.js se sirve siempre en local, nunca desde el CDN. Usa `THREE_JS=/ruta/three.module.min.js` si está definido;
si no, descarga una vez `three@0.160.0` con `npm pack` en `.cache/`, que está ignorado por git.

### Regenerar los sprites de Pixelbolt

```bash
node build-assets.cjs                           # usa npx -y pixelbolt@0.14.0
PIXELBOLT="node /ruta/Pixelbolt/bin/pixelbolt.js" node build-assets.cjs
```

## Cómo está hecho

- **Pipeline:** escena → render target de 180×320 (sin antialias) → pase final en un shader → canvas → copia ×6
  nearest a 1080×1920. El pase final hace dos cosas:
  - Un **fundido tramado** (Bayer 4×4) entre dos vistas, para los cambios de dirección de cámara.
  - **Cuantiza** cada píxel al color de paleta más cercano. La paleta se arma sola al cargar, con todos los
    colores de los sprites y del suelo, más el fondo y la sombra; hay tramado opcional.
- **Cámara:** ortográfica a 16 px de pantalla por unidad de mundo, la misma densidad que los sprites y el suelo,
  así que un texel ocupa un píxel.
  - Por defecto gira en **8 direcciones** (pasos de 45°) con un fundido de 0.35 s. La rotación continua sigue
    disponible para comparar.
  - La inclinación es fija en la animación.
  - El paneo se ajusta a píxeles enteros.
- **Suelo:** textura de 128×128 texels hecha con manchas grandes de ruido de baja frecuencia, bordes duros y
  sin tramado fino. Es periódica, así que no hay juntas visibles.
- **Sprites:**
  - Caballero y roca vienen de Pixelbolt, con el pivote en los pies tomado del atlas exportado (`anchorPx`).
    El caballero reproduce su idle con la duración de cada fotograma del atlas.
  - El árbol sigue siendo una cuadrícula del spike: Pixelbolt no trae un árbol entre sus ejemplos.
  - Son quads que miran a la cámara, inclinados hasta quedar paralelos a la pantalla (1 texel = 1 píxel), con
    `alphaTest` para el recorte.
  - **Sin iluminar**, para no sombrear dos veces un arte que ya viene sombreado.
  - **Ordenados por la profundidad de los pies** y sin escribir profundidad entre ellos, para que dos sprites
    inclinados nunca se corten.
- **Sombras**, por defecto **planas**: el sprite, orientado al sol, se aplasta sobre el suelo con la matriz del
  rayo del sol, en un color sólido de la paleta.
  - Los modos de shadow map (`sun`, `billboard`) siguen disponibles. El shadow map tiene 16 texels por unidad,
    igual que el suelo, y recorta por alpha.
  - En esos modos el suelo pasa a material iluminado, porque necesita recibir la sombra.

## Resultados

**Medición:** porcentaje de píxeles internos que cambian entre fotogramas seguidos de la animación de 12 s
(360 fotogramas, 30 fps).

| Versión | Media | Mediana | Percentil 90 | Fotogramas casi idénticos al anterior (<1 %) |
|---|---|---|---|---|
| Primera (rotación continua, suelo fino) | 48 % | 44 % | 71 % | 0 de 359 |
| Con los ajustes | 4.3 % | 0.3 % | 10 % | 204 de 359 |

Fuera de las transiciones el suelo ya no "hierve". Solo cambian los píxeles de lo que se mueve: el caballero que
respira, la sombra que sigue al sol y los pasos de 1 px del paneo.

**Qué queda por resolver:**
1. **El fundido entre direcciones** es legible pero ruidoso a mitad de camino, porque mezcla dos ángulos con un
   tramado. Con `fade=0` es un corte seco limpio. Conviene decidir según el ritmo del video. Otra opción es una
   transición más gráfica (barrido, iris o pixelado) como las de las escenas anteriores.
2. **La sombra plana** se deforma en diagonal según el sol, así que sus píxeles no siempre son cuadrados.
   No cae sobre otros sprites.
3. **Los modos de shadow map** oscurecen todo el suelo al pasar a material iluminado, y tras cuantizar el
   verde salta de tono según la altura del sol. Si se necesitan, hay que tratar la iluminación en el pase de
   paleta (rampas por material) en lugar de dejarla a Lambert.
4. **Árbol:** sigue siendo una cuadrícula del spike; falta un árbol hecho con Pixelbolt.
5. **Bordes del mundo:** el suelo mide 40×40 unidades. Para paneos largos hace falta un suelo en mosaico que
   siga a la cámara.
6. **Rotar en 8 direcciones** implica que todos los sprites se ven igual desde cualquier lado. Para personajes
   que deben mostrar espalda o perfil hace falta un sprite por dirección (los `views` de Pixelbolt).

## Escena narrativa: Wakayama (`wakayama.html`)

Una escena corta de 20.4 s con efectos de sonido, sobre el mismo pipeline: 180×320 internos, ×6 nearest, sin
antialias, paleta fija de 34 colores cuantizada en el shader, sombras planas y `window.__draw(t)` determinista.
Todo el arte se dibuja en memoria. No toca `index.html`.

```bash
python3 -m http.server 8000                      # abrir http://localhost:8000/wakayama.html (muda en el navegador)
node capture.cjs --page wakayama.html --out out/wakayama.mp4    # MP4 con los efectos de sonido mezclados
```

El panel tiene una barra de tiempo, pausa y botones para saltar a cada momento. Con `?render&t=7.0` se ve un
fotograma suelto. `capture.cjs` mezcla el audio solo si la página define `window.__renderAudio`; la preview de
`index.html` sigue saliendo muda, como antes.

**Elenco y escenario**
- **Rōnin**, con dos vistas:
  - **De espaldas** (encarando al dragón y marchándose): kasa de paja, pelo azul corto con cuello y orejas en
    tono piel, túnica blanca con nubes doradas, obi rojo, espada roja y hatillo azul en un palo.
  - **De frente** (plano de reacción): cara con piel, ojos y boca, flequillo y mechones azules, el cordón del
    kasa, cuello cruzado del kimono y la empuñadura roja. Camina, sonríe y asiente con los ojos cerrados.
- **Dragón**, redibujado en cada fotograma (192×232 texels; unas 6 veces la altura del rōnin).
  Tiene cuerpo serpentino con escamas, vientre dorado, aletas dorsales rojas, tres patas con garras doradas,
  cabeza de frente con astas, melena roja, bigotes largos, barba, y una boca que ruge.
- **Diorama:** un fondo vertical con cielo, montes, bosque de cedros, la pagoda bermellón de tres niveles y el
  acantilado con la cascada animada. Una franja de arbustos y bruma tapa la unión con la pradera. Delante, la
  pradera con manchas grandes, el camino de tierra que rodea el estanque y el propio estanque. Hay cedros,
  faroles de piedra y arces como billboards con sombra plana.

**Los tres momentos** (tiempos en `T` al principio del script)

| Momento | Tiempo | Qué pasa |
|---|---|---|
| 1 · El encuentro | 0–6.2 s | Plano de la pagoda y la cascada; la cámara baja hasta el rōnin. El dragón emerge del estanque y ruge, con una sombra enorme y oscura. Primer plano ×2 del rōnin desenvainando (4.4–6.2 s) |
| 2 · La derrota | 6.2–10.9 s | El sol sube y las sombras se acortan; la del dragón pasa a verde oscuro. El dragón se lanza en picado y el rōnin salta. Primer plano ×2 del golpe: arco rojo y blanco, destello tramado, congelación de 0.16 s y temblor en píxeles enteros. El dragón parpadea en rojo, retrocede y cae al estanque disolviéndose. El rōnin enfunda |
| 3 · La partida | 10.9–20.4 s | Primer plano ×2 (10.9–13.9 s): vuelve de frente hacia la cámara, recoge el hatillo, sonríe y asiente, y se da la vuelta. Plano general: se aleja por el camino hacia la pagoda, con la cámara siguiéndolo en pasos de píxel |

**Sonido** (solo efectos, para mezclar con tu música):
- **Ambiente:** cascada todo el tiempo y pájaros.
- **Momento 1:** retumbo y estallido de agua al emerger el dragón, dos rugidos, la espada al desenvainar.
- **Momento 2:** el picado, el salto, el corte, el impacto con un tañido metálico, el grito del dragón, la caída
  al estanque con burbujas, una escala descendente al desaparecer y los dos clics al enfundar.
- **Momento 3:** pasos de vuelta, el hatillo, una nota suave al asentir, pasos al marcharse y un acorde final.

El pico queda en unos −4 dB.

**Decisiones técnicas**
- **Primeros planos con zoom ×2 entero:** cada texel pasa a ser un bloque de 2×2 píxeles. Siguen nítidos,
  alineados a la rejilla, y el suelo no hierve.
- **Sin rotación de cámara:** solo paneos ajustados a la rejilla y cortes secos entre planos.
- **Emerger y hundirse se hacen en el espacio de la textura** del dragón (la imagen se desplaza dentro de su
  lienzo), así que la sombra plana siempre corresponde a la parte visible.
- **El sol se anima** (`SUN.climb`) y todas las sombras planas se recalculan cada fotograma.
- **El destello y el corte no proyectan sombra:** van en un billboard de efectos aparte.

**Ajustes aplicados tras la primera versión**
1. **Legibilidad del rōnin:** más tiempo en ×2 (5.4 s en vez de 3) y una vista de frente con cara para el plano de
   reacción. De espaldas ya no se lee como "cara azul": el pelo queda arriba y debajo se ven cuello y orejas.
2. **Sombra del dragón:** el sol sube de 52° a 64° al empezar la pelea, y la sombra del dragón pasa de casi negro
   a verde oscuro.
3. **La unión del diorama:** una franja de arbustos con algo de bruma la tapa.
4. **Plano de reacción:** el rōnin de frente al recoger el hatillo.
5. **Audio:** efectos de sonido, mezclados por `capture.cjs`.

**Sprite HD del rōnin para los primeros planos**

En los planos ×2 la cámara da 32 px de pantalla por unidad de mundo, así que se usa un rōnin de 68×104 texels
(el doble de densidad, mismo tamaño en el mundo) que cae a exactamente 1 texel = 1 píxel. Sale de ampliar el
diseño normal y añadirle detalle fino:
- **Kasa:** trenzado de paja.
- **Cara:** ojos con iris azul y brillo, cejas, nariz, sonrisa y mejillas; ojos cerrados al asentir.
- **Pelo:** mechones, y puntas en la nuca.
- **Ropa:** pliegues en la túnica, destellos en el oro, pliegues del hakama y correas de las sandalias.
- **Espada y hatillo:** trenzado blanco en la empuñadura y estampado en el hatillo.
- **Contorno:** de 1 píxel en vez de 2.

En los planos generales se usa el sprite normal de 34×52. El precio es mezclar densidades en los primeros
planos: el rōnin tiene píxeles más finos que el escenario, que allí se ve en bloques de 2×2.

**Siguientes pasos posibles**
- No hay una vista de perfil: el giro de frente a espaldas es un corte, no una animación de vuelta.

## Escena «La ventana» (`aurora.html`)

Pixel Quest Adventure: el arquero rubio sentado en la ventana mira una montaña nevada bajo auroras boreales; pasa una
estrella fugaz y cierra la frase *«Vivir es un instante, la obra maestra permanece, admírala mientras puedas»*.
22 s, 1080×1920, solo efectos de sonido (viento, vela, estrella, campanillas del texto); sin música.

Lo que aporta del spike para dar profundidad:
- **Capas a distintas profundidades** (pared z=9, nieve que cae z=5.5, pinos y cabaña z −6…−27, montaña z=−30, cielo z=−44)
  con una **órbita lenta de cámara** (yaw −5°→+5°): el marco de la ventana se desliza contra el paisaje (parallax real).
- **Sombras planas de la luna** de pinos y cabaña sobre la nieve; suelo de baja frecuencia (sin hervor).
- **Zoom ×2 entero** (4.6–7.6 s) con el **sprite HD** del arquero (doble densidad, `ppu: 32`).
- Cielo dinámico por cuadro: estrellas que titilan, luna, dos cortinas de aurora con tramado Bayer y la estrella fugaz.
- Atenuación final tramada en el shader y texto en fuente pixel 5×7 (con «í») escrito a máquina en tres tiempos.

Exportar: `node capture.cjs --page aurora.html --out out/aurora.mp4`

## Corrección: inclinación de los billboards

La rotación correcta para que un billboard quede paralelo a la pantalla es `rotation.x = −pitch` (orden `'YXZ'`).
La fórmula anterior `−(90° − pitch)` solo coincidía cerca de 45°; se corrigió en `index.html` y `wakayama.html`.

## Escena «El trono» (`throne.html`)

El villano del boceto (demonio rojo de pelo negro, cuernos, ojos azules brillantes, cicatrices en X, guanteletes de pelaje
negro con garras, armadura con púas y hacha) en su castillo negro. 24 s, 1080×1920, solo efectos de sonido.

1. 0–6 s: la montaña sombría con el castillo recortado contra una luna roja; tormenta y relámpagos; zoom continuo hasta la
   ventana del salón del trono; un relámpago blanco corta hacia dentro.
2. 6–16.5 s: el salón (pared con vitral, estandartes, columnas en primer y segundo plano, braseros, alfombra). Primer plano ×2
   con el sprite HD: el demonio levanta el hacha y ruge (sacudida de cámara, relámpago); los orcos azules alzan las armas y
   salen corriendo.
3. 16.5–24 s: de vuelta afuera, una fila de antorchas baja por el sendero de la montaña hasta la aldea, que arde casa por
   casa con humo; fundido tramado a negro.

Dos mundos three.js (exterior / salón) con la misma cámara ortográfica; el cielo se dibuja una vez por cuadro y lo
comparten la vista exterior y el vitral. El plano general del salón se encuadra más cerca sin romper la rejilla: se renderiza a
135×240 y se escala ×8 (en vez de 180×320 ×6), así 1 texel sigue siendo 1 píxel. Exportar: `node capture.cjs --page throne.html --out out/throne.mp4`

## Escena «La canción de Lyra» (`lyra.html`)

Playa al atardecer, 15 s en bucle, 1080×1920, solo efectos de sonido. Lyra Sakuraen (la aventurera de pelo rosa) canta
en la orilla; «Ley Multiversal #1: Ama aquellos lugares que sacan lo mejor de ti» se escribe al ritmo del canto.

- Capas (z): cielo ámbar con nubes doradas −30 · banda de nubes carbón con borde dorado −26 · mar −14 · sol y rayos
  crepusculares −12 (delante del mar para caer sobre él) · arena mojada con espuma −4 · Lyra 0. Órbita de ±5° de yaw.
- Lyra es su sprite canónico de `pixel-quest/journey.js`; las poses nuevas (mano en el pecho cantando, brazos abiertos,
  respiración) se añaden con un gancho como en `dance.js`, y el viento mueve su pelo y el bajo del vestido (4 cuadros).
  Se muestra a doble detalle (`hdLayer`: cada texel 2×2, mechones, pliegues, brillos y contorno nuevo), ~90 px de alto;
  el aura no se dibuja sobre su silueta.
- La magia va en tonos fríos sobre el fondo cálido: aura rosa/cian, notas que se deshacen en chispas, motas que suben de
  la arena, destello radial en la nota alta (8.3 s) con los rayos al máximo.
- Todo lo periódico (olas y espuma cada 5 s, nubes, cámara, viento) cierra ciclos enteros en 15 s: el final enlaza con el inicio.

Exportar: `node capture.cjs --page lyra.html --out out/lyra-song.mp4`
