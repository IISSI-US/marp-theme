# marp-theme

Tema Marp `dr-iissi` para las transparencias de IISSI.

## Estructura

```text
css/
  dr-iissi.css
  us-footer.png
  us-title-bg.png
  us-default-bg.png
fonts/
scripts/
  marp-engine.js
  install-local-fonts.sh
templates/
  templates.md
```

## Uso

Con Marp CLI:

```bash
marp --theme-set ./css/dr-iissi.css --engine ./scripts/marp-engine.js slide.md --pdf
```

## Desarrollo

- El CSS del tema es `css/dr-iissi.css`.
- Los assets visuales y las fuentes viven en este repositorio.
- Las plantillas de referencia están en `templates/`.
