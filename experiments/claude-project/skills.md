---
name: pixel-quest-scenes
description: Hacer escenas cortas en pixel art para la serie Pixel Quest Adventure (vertical 9:16, 1080x1920, solo efectos de sonido, frase final en fuente pixel). Úsala cuando el autor pida una escena nueva con sus personajes, ajustes a una escena existente o una escena 2.5D con profundidad.
---

# Pixel Quest: cómo hacer una escena

Contexto del proyecto, personajes y preferencias: `CONTEXTO.md`. Esta skill es el procedimiento.

## Skills en las que se apoya

- **motion-kit** (`~/.claude/skills/motion-kit/SKILL.md`): pipeline de video en HTML/JS → MP4. Leer
  `00-agent-brief.md`, `15-pixel-retro.md`, `09-audio-sync.md` y `12-render-qa.md`; `11-threejs.md` para 2.5D.
- **pixelbolt-pixel-art** (`.claude/skills/pixelbolt-pixel-art/SKILL.md`): sprites y efectos sueltos desde recetas
  JSON (`npx -y pixelbolt@0.14.0 ...`). Útil para assets reutilizables; las escenas suelen dibujar sus sprites por código.

## Reglas fijas

1. **Formato:** 1080×1920, 30 fps. Render interno 180×320, escalado ×6 nearest. Sin antialias ni degradados suaves:
   todo color sale de una paleta fija (cuantizar en el shader si hay 3D).
2. **Sonido:** solo efectos (viento, fuego, pasos, golpes, campanas, destellos, rugidos…). Nunca música de fondo.
   Entregar el MP4 con los efectos y la pista `.wav` aparte.
3. **Frase final** (si la hay): español, fuente pixel 5×7 con tildes, escala 2, centrada, con contorno oscuro de
   1 px y sombra, escrita letra a letra en 2–3 tiempos sobre la escena oscurecida con tramado. Líneas de máximo
   ~14 caracteres para que no se corten (180 px de ancho). Mantener la cita exacta; corregir solo ortografía y avisar.
4. **Personajes:** respetar el canon de `CONTEXTO.md` (colores de pelo, armaduras, armas). Si el autor manda un
   boceto, extraer sus rasgos y listarlos al entregar.
5. **Aislamiento:** escenas nuevas en `experiments/` (2.5D en `experiments/spike-25d/<escena>.html`). No tocar
   Aseprite ni la skill de Pixelbolt.
6. **Determinismo:** la página expone `window.__meta = {W, H, FPS, DURATION}`, `window.__draw(t)`,
   `window.__ready = true` y `window.__renderAudio()`; nada de `Math.random` sin semilla.

## Procedimiento

1. **Plan como datos primero:** constantes al inicio del archivo con tiempos (`T = {...}`), planos (`SHOTS`),
   posiciones y profundidades (`LAYERS`), luz y paleta. Mostrar el plan antes del código si el autor lo pide.
2. **Escenario por capas** de atrás a adelante (cielo dinámico → fondo lejano → escenario medio → suelo → personajes
   → primer plano). Cielo, fuego, humo, nieve y auroras se redibujan por cuadro con ruido de valor + tramado.
3. **Sprites por código** sobre buffers indexados (clase `Pix`: `p`, `r`, `line`, `disc`, `shade`, `outline`, `flush`).
   Orden de trabajo: silueta → bloques de color → acentos → poses. Contorno de 1 px oscuro. Para primeros planos,
   versión HD de doble densidad (ampliar el diseño ×2, añadir detalle, nuevo contorno).
4. **Narrativa en 3 momentos** (≈20–24 s): establecer el lugar → acción/primer plano → consecuencia o frase.
   Cortes con destello (relámpago), fundido tramado o zoom; temblor de cámara por píxeles enteros en los impactos.
5. **Profundidad 2.5D** (si se pide o ayuda): billboards con `rotation.set(-pitch, yaw, 0, 'YXZ')`, cámara ortográfica
   16 px/unidad ajustada a la rejilla, órbita lenta de cámara para parallax, sombras planas por cizalla, suelo de
   baja frecuencia, zoom solo en pasos enteros (×2 con sprite HD; 135×240 ×8 para un plano algo más cercano).
   Partir de `experiments/spike-25d/throne.html` o `aurora.html`: ya traen todo el andamiaje. Para escenas 2D
   con el grupo, partir de `experiments/pixel-quest/` (los sprites de los cinco están en `journey.js`).
6. **Efectos de sonido** en `sfx(ac, out)` con OfflineAudioContext: ruido filtrado (viento, fuego, pasos, truenos),
   osciladores (campanas, destellos, golpes graves), sierra distorsionada (rugidos). Sincronizar con `T`.
7. **Revisión:** capturas fijas en momentos clave, luego exportar
   `node capture.cjs --page <escena>.html --out out/<escena>.mp4`, hoja de contactos con
   `bash ~/.claude/skills/motion-kit/render/contact-sheet.sh out/<escena>.mp4 hoja.png`, mirarla y corregir por timecode
   (encuadres cortados, elementos tapados, sincronía de causa y efecto, texto que se sale).
8. **Entrega:** MP4, pista de efectos `.wav` (`ffmpeg -i x.mp4 -vn -c:a pcm_s16le x-sfx.wav`) y hoja de contactos;
   resumen breve de qué pasa en cada tramo, decisiones tomadas y límites. Actualizar el README del experimento,
   commit y push a la rama de trabajo.

## Errores ya cometidos (no repetir)

- Inclinación de billboard `−(90° − pitch)`: incorrecta; usar `−pitch`.
- Fondos que tapan el cielo: comprobar en qué filas del cielo cae la ventana/el encuadre antes de colocar luna,
  auroras o estrellas fugaces.
- Consecuencia antes que la causa (la aldea ardía antes de que llegaran los orcos): sincronizar llegadas y eventos.
- Texto que se sale del ancho: partir líneas largas.
- Zoom no entero en planos fijos: deforma los píxeles.
- Rostros: no pintar toda la cara de un color de pelo; pelo y piel por separado.
