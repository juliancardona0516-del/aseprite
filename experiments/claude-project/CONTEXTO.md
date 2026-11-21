# Pixel Quest Adventure: contexto del espacio de trabajo

Resumen para cargar en un proyecto de Claude. Cubre quién es el proyecto, qué se ha hecho, cómo se hace y qué
preferencias hay que respetar. Las instrucciones de trabajo detalladas están en `skills.md`.

## 1. El proyecto

**Pixel Quest Adventure** es una serie de cortos en pixel art que el autor publica en sus redes (formato vertical
9:16, pensados como Shorts/Reels/TikTok). Cada corto es una escena breve de un grupo de aventureros en un mundo
de fantasía medieval, que suele cerrar con una frase o cita en pantalla. El autor pone la música después en su
editor; los cortos llevan solo efectos de sonido.

**Repositorio:** `juliancardona0516-del/aseprite` (un fork de Aseprite). Rama de trabajo:
`claude/pixelbolt-skill-install-l0711a`. El código de Aseprite (`src/`, `laf/`, CMake) no se toca nunca; todo el
trabajo de video vive aparte, en `experiments/` y `.claude/skills/`.

## 2. Personajes (canon visual)

| Personaje | Rasgos fijos |
|---|---|
| **El caballero** | Armadura, el más sereno del grupo; aparece con el mago y con la aventurera |
| **El mago** | Túnica y sombrero; protagonista de la escena de la luna y los recuerdos |
| **La aventurera de pelo rosa** | Bailarina; aparece bailando en el bosque de bambú |
| **El héroe de pelo rojo** | Armadura azul y espada esmeralda; pescador (el pez gigante), se mira en la cascada |
| **El arquero rubio** | Pelo rubio con coleta, oreja de elfo, capa verde, carcaj; la escena de la ventana y las auroras |
| **El villano (demonio rojo)** | Piel roja muy musculosa, pelo negro largo, cuernos curvos, ojos azules brillantes con destellos, cicatrices en X en pecho y hombro, guanteletes negros de pelaje con garras, cinturón con placa y escarcelas en chevrón, rodilleras y grebas con púas, gran hacha oscura. Boceto original del autor |
| **Los orcos azules** | Más pequeños que el villano, piel azul, colmillos, garrotes, lanzas y antorchas; su ejército |
| **La tortuga gigante** | Dorado opaco, con barba; se traga a los cinco aventureros |

Los cinco aventureros juntos son "el grupo" (escena de la fogata y la tortuga, escena del viaje).

## 3. Escenas hechas (en orden)

| # | Escena | Qué pasa | Cierre |
|---|---|---|---|
| 1 | Historia de los relojes | Película de 20 s estilo grabado, 1080p, con música (prueba inicial de motion-kit) | — |
| 2 | El viaje | Los 5 viajeros estilo anime atraviesan varios escenarios de fantasía medieval, 20 s, 9:16 con música | — |
| 3 | El atardecer (plot twist) | El caballero y el mago miran el atardecer; giro: la villa arde | — |
| 4 | El baile en el bambú | El caballero sentado mira bailar a la aventurera de pelo rosa; libro | «Mil misiones, una aventura, muchos tesoros, pero nada se compara a la verdadera esencia de amar» |
| 5 | La gran pesca | El héroe de pelo rojo pesca un pez gigantesco | Solo SFX |
| 6 | Recuerdos en la luna | El mago mira la luna; los recuerdos aparecen con **una sola palabra** cada uno (p. ej. «Amor»); libro | «Recordar es volver a pasar por el corazón» — Eduardo Galeano |
| 7 | La taberna (letra) | Diálogo mago/caballero con letra en pantalla a 74 BPM; el audio del short empieza justo en «Spanish» | Letra sincronizada |
| 8 | El reflejo | El héroe de pelo rojo se mira en una cascada (armadura azul, espada esmeralda) | «Fijarse metas es el secreto para un futuro grandioso» — Tony Robbins |
| 9 | La tortuga | Los 5 en una fogata dentro de una cueva; es una tortuga gigante dorada con barba; abre la boca y caen; bosque y aldea estilo Japón | — |
| 10 | Spike 2.5D | Prueba técnica: sprites como billboards en una escena 3D ortográfica | — |
| 11 | Wakayama | El rōnin (pelo azul, con rostro) y el dragón ante la pagoda y la cascada de Nachi; 3 momentos | — |
| 12 | La ventana (auroras) | El arquero rubio sentado en una ventana: montaña nevada, auroras boreales, estrella fugaz | «Vivir es un instante, la obra maestra permanece, admírala mientras puedas» |
| 13 | El trono | Castillo negro bajo luna roja, zoom a la ventana del trono; el demonio ruge y ordena a los orcos azules destruir la aldea; la aldea arde | Solo SFX |

Las escenas 10–13 están en el repo (`experiments/spike-25d/`). Las escenas 3–9 se hicieron en el espacio temporal
de la sesión (`journey/*.html` + `*.js`) y **no están en el repo**; si se quieren conservar hay que copiarlas.

## 4. Preferencias del autor (respetar siempre)

- **Formato:** vertical 9:16, 1080×1920, 30 fps. Pixel art real: resolución interna 180×320 escalada ×6 sin suavizado.
- **Sonido:** sin música de fondo («de eso me encargo yo»). Solo efectos de sonido prácticos estilo pixel/8-bit.
  Entregar siempre la pista de efectos también por separado (`.wav`).
- **Frases finales:** en español, con fuente pixel 5×7 (con tildes), escritas a máquina en pantalla, con contorno.
  Si la cita tiene autor, se pone. Se corrige la ortografía (p. ej. «admírala» con tilde) y se avisa.
- **Proceso:** mostrar primero el plan como datos (estilo, tiempos, planos, eventos), luego el código, luego renderizar
  y revisar la hoja de contactos antes de entregar. Corregir por timecode.
- **Idioma:** el autor escribe en español; responder en español.
- **No romper nada:** no tocar Aseprite ni la skill de Pixelbolt; los experimentos van aislados en `experiments/`.
- **Commits:** en la rama de trabajo; no abrir PR salvo que lo pida.

## 5. Herramientas instaladas

| Herramienta | Para qué | Dónde |
|---|---|---|
| **Pixelbolt 0.14.0** (skill `pixelbolt-pixel-art`) | Sprites, tiles, efectos (fuego, humo, agua) y animaciones cortas desde recetas JSON; exporta PNG/GIF/APNG | `.claude/skills/pixelbolt-pixel-art/` (en el repo); `npx -y pixelbolt@0.14.0 ...` |
| **motion-kit** (skill) | Videos dibujados con código en HTML/JS → MP4: pipeline, pixel/retro, chiptune, Three.js, hoja de contactos | `~/.claude/skills/motion-kit/` (clon de `kiselas/every-frame-is-code`) |
| **Playwright + Chromium** | Renderizar fotogramas de las páginas | preinstalado |
| **ffmpeg** | Codificar MP4, mezclar audio, extraer la pista de SFX | sistema |
| **three.js 0.160.0** | Escenas 2.5D | import map de jsDelivr; `capture.cjs` lo sirve en local |

## 6. Hallazgos técnicos del spike 2.5D (lo que funciona)

- **Billboards:** cada sprite es un plano paralelo a la pantalla, `rotation.set(-pitch, yaw, 0, 'YXZ')`. La fórmula
  vieja `−(90° − pitch)` estaba mal (se corrigió en todas las páginas).
- **Cámara ortográfica** a 16 px por unidad, ajustada a la rejilla de píxel en cada cuadro (sin temblor).
- **Profundidad:** capas a distinta z (cielo, montañas, escenario, primer plano) y una órbita lenta de la cámara
  (±4–7° de yaw) → parallax real.
- **Sombras planas:** el sprite proyectado sobre el suelo con una matriz de cizalla, en un color sólido de la paleta.
- **Suelo de baja frecuencia** (manchas grandes): con detalle fino "hierve" al mover la cámara.
- **Paleta cuantizada en shader** + tramado Bayer 4×4 para fundidos, destellos y oscurecidos.
- **Zoom sin romper el pixel art:** solo pasos enteros (×2) con un **sprite HD de doble densidad** (`ppu: 32`).
  Para un plano "un poco más cerca", renderizar a 135×240 y escalar ×8 (1 texel sigue siendo 1 píxel).
- **Determinismo:** `window.__draw(t)` dibuja cualquier instante; nada aleatorio sin semilla. El audio sale de
  `window.__renderAudio()` (OfflineAudioContext → WAV) y `capture.cjs` lo mezcla.
- Comando de exportación: `node capture.cjs --page <escena>.html --out out/<escena>.mp4`.
