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
| `capture.cjs` | Exporta la animación de 12 s fotograma a fotograma y la codifica en MP4, con Three.js servido en local |

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
