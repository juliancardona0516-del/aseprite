# Personajes de Pixel Quest Adventure: renders en solitario

Cada personaje diseñado para la serie, exportado solo y con fondo transparente desde el código de su escena,
sin copias del dibujo: si se cambia un personaje en su escena, basta con volver a exportar.

```bash
node experiments/characters/export.cjs     # regenera png/
```

## Contenido de `png/`

- `elenco.png`: los personajes en su pose principal, a la misma escala (×4).
- `criaturas.png`: el dragón, el pez gigante y la tortuga gigante (×2).
- Una carpeta por personaje:
  - `ficha.png`: todas sus poses juntas, a la misma escala.
  - `<pose>.png`: tamaño nativo (1 píxel = 1 píxel), recortado con 2 px de margen. Es el que sirve para un juego o un editor como Aseprite.
  - `<pose>-xN.png`: la misma pose ampliada N veces sin suavizado, para ver o publicar.
  - Las poses `-HD` son las versiones de doble detalle usadas en los primeros planos.

| Carpeta | Personaje | Escena de origen | Poses |
|---|---|---|---|
| `01-heroe-pelo-rojo` | Héroe de pelo rojo | pixel-quest/journey | de pie, festejo, caminar ×4 |
| `02-mago` | Mago | pixel-quest/journey, tavern | de pie, caminar ×4, túnica estrellada |
| `03-arquero-rubio` | Arquero rubio | journey, spike-25d/aurora | de pie, caminar ×4, sentado de espaldas, mirando arriba, señalando (+HD) |
| `04-caballero` | Caballero | journey | de pie, caminar ×4 |
| `05-aventurera-pelo-rosa` | Aventurera de pelo rosa | journey, dance | de pie, caminar ×4, tres pasos de baile ×4 |
| `06-ronin` | Rōnin | spike-25d/wakayama | espalda, frente, saludo, en guardia, golpe, remate, caminar… (+HD) |
| `07-dragon` | Dragón | spike-25d/wakayama | rugido |
| `08-demonio` | El villano (demonio rojo) | spike-25d/throne | sentado, mirada, rugido (+HD) |
| `09-orco-azul` | Orco azul | spike-25d/throne | de pie (de espaldas), grito ×2, carrera ×2; con garrote, lanza o antorcha |
| `10-pez-gigante` | Pez gigante | pixel-quest/fish | boca cerrada, boca abierta, derrotado |
| `11-tortuga-gigante` | Tortuga gigante | pixel-quest/turtle | dormida, despierta, boca abierta |
| `12-mascota` | Mascota (recuerdo del mago) | pixel-quest/moon | normal, aplastada |

Los colores de las escenas 2D son los de la paleta base de día; en las escenas los tiñe la luz (atardecer, noche).
Las páginas 2.5D exponen sus sprites con `window.__cast()`, un acceso de solo lectura que no cambia la escena.
