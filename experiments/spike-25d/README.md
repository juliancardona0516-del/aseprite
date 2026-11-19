# Spike 2.5D pixel art (aislado)

Prueba de viabilidad: sprites pixel art como *billboards* dentro de una escena 3D con cámara ortográfica alta,
sol direccional y sombras, renderizado a baja resolución y escalado *nearest-neighbor*.

Es un experimento aislado. No toca Aseprite (`src/`, `laf/`, CMake) ni la skill de Pixelbolt
(`.claude/skills/pixelbolt-pixel-art/`), y no añade dependencias al repo.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | El spike completo: escena, controles y la función determinista `window.__draw(t)` |
| `capture.cjs` | Opcional: renderiza la animación de 12 s fotograma a fotograma a PNG (base para un exportador de video) |

## Cómo ejecutarlo

Necesita un navegador con WebGL2 y conexión a internet: `three@0.160.0` se carga desde jsDelivr mediante un import map.

```bash
cd experiments/spike-25d
python3 -m http.server 8000
# abrir http://localhost:8000/
```

También funciona abriendo `index.html` directamente.

**Controles:** animación automática (cámara y sol), sliders de giro e inclinación de cámara y de azimut y altura del sol,
tipo de sombra, filtro del shadow map, corrección vertical de los sprites, ajuste de cámara a la rejilla de píxel
y resolución interna.

**Teclas:** ←/→ gira la cámara, ↑/↓ la inclina, A/D mueve el sol y espacio pausa la animación.

**Parámetros por URL** para comparar modos: `?shadowMode=planar|sun|billboard`, `&shadowType=basic|pcf`,
`&correct=tilt|stretch|none`, `&snap=0`, `&res=6|4|3`. Con `?render` se ocultan los controles y la escena
solo avanza cuando se llama a `window.__draw(t)`.

**Capturar fotogramas** (requiere Node y Playwright, que no son dependencias del repo):

```bash
node capture.cjs out/frames 30
ffmpeg -framerate 30 -i out/frames/%04d.png -c:v libx264 -pix_fmt yuv420p preview.mp4
```

Sin internet, define `THREE_JS=/ruta/three.module.min.js` (la misma versión 0.160.0, por ejemplo de `npm pack three@0.160.0`)
y el script la sirve en lugar del CDN.

## Cómo está hecho

- **Resolución interna:** WebGL a 180×320, sin antialias y con `pixelRatio` 1. Cada fotograma se copia a un canvas
  de salida de 1080×1920 con `imageSmoothingEnabled = false`, así que el escalado es exacto ×6.
- **Densidad de píxel:** cámara ortográfica a 16 px de pantalla por unidad de mundo, igual que la densidad de los
  sprites (16 texels por unidad), para que un texel ocupe un píxel. Las texturas usan `NearestFilter` y no tienen mipmaps.
- **Sprites:** se generan en memoria desde cuadrículas de texto con la misma paleta que las escenas anteriores
  (personaje, árbol, roca). Cada uno es un quad con el pivote en los pies, `alphaTest` 0.5 para el recorte,
  y gira en el eje Y hacia la cámara.
- **Sombras**, tres modos para comparar:
  - `planar` (por defecto): el sprite, orientado hacia el sol, se aplasta sobre el suelo con una matriz de
    proyección a lo largo del rayo del sol. Se dibuja en un color sólido con el alpha del propio sprite.
  - `sun`: shadow map de la luz direccional, proyectado por un quad invisible orientado al sol. El recorte usa
    `customDepthMaterial` con `alphaTest`, así que la sombra tiene la silueta del sprite y no la del rectángulo.
  - `billboard`: shadow map proyectado por el mismo quad que mira a la cámara. Lo dejé para mostrar por qué no sirve.
- **Corrección vertical:** con la cámara a 50° un quad vertical se ve aplastado (alto × sen 50° ≈ 0.77).
  - `tilt` inclina el quad hasta quedar paralelo a la pantalla, de modo que un texel ocupa exactamente un píxel.
  - `stretch` lo estira 1/sen.
  - `none` lo deja vertical.

## Evaluación

**Qué funcionó bien**
- **Sprites nítidos al rotar** con `tilt` y el ajuste a rejilla: en fotogramas consecutivos de una rotación rápida
  el personaje conserva cada píxel. Solo se desplaza en saltos de 1 px.
- **Sombras planas:** limpias, con la silueta exacta del sprite y bordes duros. Siguen al sol sin parpadear y
  no dependen de la cámara. Encajan con la estética: un color sólido de la paleta, sin degradados.
- **Recorte por alpha** en el shadow map (`customDepthMaterial` + `alphaTest`): no salen sombras rectangulares.
- **Escalado ×6 nearest:** sin antialias en ningún punto de la cadena.
- **Listo para exportar:** el render es una función pura del tiempo (`__draw(t)`), así que el mismo enfoque de
  captura de las escenas anteriores funciona. `capture.cjs` lo demuestra.

**Problemas visuales detectados**
1. **El suelo "hierve" al rotar la cámara.** La textura de hierba, muestreada con nearest bajo un ángulo
   arbitrario, cambia de patrón en cada fotograma. Los bordes del camino salen en escalones con píxeles
   de 1 y 2 de ancho mezclados. Es la mayor pérdida de estética "dibujada a mano".
2. **Sombras de shadow map (`sun`)** más débiles y algo difusas que las planas. Con `pcf` se emborronan;
   con `basic` el escalonado de los texels no se alinea con la rejilla de pantalla.
3. **Shadow map desde el billboard (`billboard`):** cuando la cámara mira de lado respecto al sol, la sombra
   se vuelve una línea casi invisible. Cambia de forma al girar la cámara: no sirve.
4. **Sin corrección (`none`)** los sprites salen achatados verticalmente y con filas de píxel desiguales.
   `stretch` los alarga y además alarga el área que tapan.
5. **La sombra plana** también se deforma en diagonal (shear), así que sus píxeles no siempre son cuadrados.
   No se proyecta sobre otros sprites, y dos sombras que se cruzan no se oscurecen más: queda un solo tono.
6. **Bordes del mundo:** al girar la cámara aparecen las esquinas del suelo y el fondo.

**Ajustes recomendados antes de exportar video**
1. **Rotación de cámara en saltos discretos** (8 u 16 direcciones con un corte o un fundido corto) en lugar de
   una rotación continua. Alternativa: rotación solo en cámara lenta durante transiciones. Es lo que más reduce
   el "hervor" del suelo.
2. **Suelo menos ruidoso:** tiles con menos detalle de alta frecuencia (manchas grandes en vez de dither fino),
   o dibujar el suelo como capa 2D de tiles alineada a pantalla cuando la cámara no gira.
3. **Paso de paleta al final:** cuantizar el fotograma a la paleta (un shader de pantalla completa o una
   tabla al copiar al canvas de salida). Así la iluminación Lambert y el sol no meten colores fuera de paleta.
   La versión de Pixelbolt `Pixel.post` hace exactamente esto.
4. **Sombras planas por defecto,** con color de paleta fijo, y shadow map solo si hace falta que la sombra caiga
   sobre otros objetos. En ese caso, sombras duras (`basic`) con el shadow map alineado a la rejilla del suelo.
5. **`tilt` como corrección por defecto,** fijando el orden de dibujo por profundidad en pies (y-sort) si dos
   sprites inclinados se cruzan.
6. **Exportador de video:** reutilizar `__draw(t)` y la captura por CDP del renderer de motion-kit, con Three.js
   servido localmente (con versión fija, sin CDN) para que el render no dependa de la red.
7. **Assets reales:** cargar los PNG que exporta Pixelbolt (`render`) como texturas, con `NearestFilter`,
   en lugar de las cuadrículas de texto del spike.
