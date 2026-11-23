# Pixel Quest Adventure: escenas 2D

Escenas en pixel art de la serie, verticales 9:16 (1080×1920), dibujadas con código en Canvas 2D. Están aisladas
de Aseprite y no tienen dependencias: cada página es HTML más JavaScript clásico y se abre directamente en el navegador.

| Página | Escena | Qué pasa | Sonido |
|---|---|---|---|
| `journey.html` | The Journey | Los 5 viajeros cruzan prado, bosque, montaña, puente, campamento y castillo | Música chiptune + SFX |
| `twist.html` | A Quiet Evening | El caballero y el mago ven el atardecer; giro: la villa arde | — |
| `dance.html` | The Bamboo Dance | El caballero mira bailar a la aventurera de pelo rosa en el bambú; frase sobre el amor | — |
| `fish.html` | The Big Catch | El héroe de pelo rojo pesca un pez gigantesco | Solo SFX |
| `moon.html` | Memories in the Moon | El mago mira la luna; recuerdos de una palabra; cita de Eduardo Galeano | Solo SFX |
| `tavern.html` | Tavern Lyrics | Mago y caballero en la taberna, letra a 74 BPM («How do you say tomorrow in Spanish?») | Para la pista del autor |
| `refl.html` | The Reflection | El héroe de pelo rojo se mira en la cascada; cita de Tony Robbins | Solo SFX |
| `turtle.html` | The Turtle | Los 5 en la fogata de una cueva que resulta ser una tortuga gigante dorada | Solo SFX |
| `pendant.html` | El colgante | Flashback del rōnin: de niño en un patio de Kioto con cerezos, su madre en kimono le canta y le da un colgante azul; en el presente lo mira brillar; cita de García Márquez | Solo SFX |
| `sheet.html` | Hoja de personajes | Todos los viajeros con sus fotogramas de caminar | — |

## Archivos compartidos

- `journey.js`: paleta, sprites de los cinco viajeros (`buildParty`, `SPR`), cielo y escenarios comunes. Todas las
  escenas lo cargan.
- `pixel.js` y `chip.js`: runtime de [motion-kit](https://github.com/kiselas/every-frame-is-code) (pantalla de
  píxeles con paleta y tramado; síntesis chiptune y efectos). Son copias sin modificar, bajo licencia MIT
  (`LICENSE-motion-kit-runtime`).

Cada escena expone `window.__meta`, `window.__draw(t)` (determinista), `window.__ready` y `window.__renderAudio()`
(efectos de sonido en WAV). Sin `?render`, al hacer clic reproduce la escena con sonido.

## Exportar a MP4

Con el capturador del spike (sirve cualquier página del repo):

```bash
cd experiments/spike-25d
node capture.cjs --page ../pixel-quest/moon.html --out out/moon.mp4
ffmpeg -i out/moon.mp4 -vn -c:a pcm_s16le out/moon-sfx.wav   # la pista de efectos aparte
```

O con motion-kit: `node ~/.claude/skills/motion-kit/render/render.mjs experiments/pixel-quest/moon.html out/moon.mp4`.

Las escenas 2.5D (Wakayama, la ventana, el trono) están en `experiments/spike-25d/`.
