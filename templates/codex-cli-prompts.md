# Prompts para Codex CLI (Marp + CSS columnas)

## Uso rápido

### Interactivo (recomendado)

```bash
codex -C /home/druiz/pptx2md
```

### No interactivo con prompt inline

```bash
codex exec -C /home/druiz/pptx2md "Tu prompt aquí"
```

### No interactivo con prompt largo (stdin)

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Tu prompt largo aquí...
PROMPT
```

### Adjuntar capturas para bugs visuales

```bash
codex exec -C /home/druiz/pptx2md \
  -i /ruta/captura1.png -i /ruta/captura2.png \
  "Analiza y corrige el fallo visual descrito en las imágenes."
```

## 1) Diagnóstico rápido de layout roto

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Revisa el layout de columnas en css/dr-iissi.css.
Contexto: en iissi-1/templates/templates.md fallan visualmente las slides [K,L,M,N].
Objetivo: localizar reglas conflictivas entre .two-col, .two-col-3-7, .two-col-7-3
(grid-auto-flow, align-items, márgenes de hijos directos, p:has(img), pre).
Haz:
1) análisis de causa raíz con líneas exactas,
2) parche mínimo (sin reglas ad-hoc por test),
3) impacto esperado en tests A-N.
No toques colores ni tipografías.
PROMPT
```

## 2) Corrección conservadora (sin rediseño)

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Aplica una corrección conservadora al CSS:
- Mantener bloques de código en fit-content.
- Evitar solapes de imagen/texto en layouts de 2 columnas.
- Mantener comportamiento existente en slides que ya están bien.

Archivos:
- css/dr-iissi.css
- iissi-1/templates/templates.md (solo si hace falta ajustar tests)

Entrega:
1) patch aplicado,
2) reglas añadidas/eliminadas,
3) riesgos residuales.
PROMPT
```

## 3) Refactor base de columnas (mantenible)

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Refactoriza el CSS de columnas para eliminar duplicidad.
Quiero una base única para:
- .two-col
- .two-col-3-7
- .two-col-7-3
Y que solo cambie grid-template-columns.

Mantén:
- separador por <hr/> para pasar de columna 1 a 2,
- h1 en ancho completo,
- p:has(img) con caja + object-fit: contain,
- pre mr/sql con fit-content.

Añade comentarios cortos y no cambies estilos visuales fuera de layout.
PROMPT
```

## 4) Validación por matriz de casos

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Valida la matriz de casos en iissi-1/templates/templates.md (tests A-N).
Para cada test indica:
- OK / NOK
- síntoma
- regla CSS implicada
- ajuste propuesto

Después aplica solo los cambios con mayor impacto y menor riesgo.
PROMPT
```

## 5) Añadir tests de regresión

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Añade tests de regresión al final de "Test de columnas: imágenes + texto"
en iissi-1/templates/templates.md.
Cobertura:
1) two-col 50/50 con imagen+texto arriba/abajo en ambas columnas,
2) two-col-3-7 con código izq + imagen der (texto arriba y abajo),
3) two-col-7-3 inverso,
4) listas y blockquote junto a imagen.

No cambies CSS en este paso.
PROMPT
```

## 6) Rollback limpio

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Algo empeoró el render.
Haz rollback selectivo de los últimos cambios SOLO en css/dr-iissi.css.
Mantén intacto el resto.
Después reaplica una solución mínima y verificable.
Muestra exactamente qué reglas se revierten y cuáles se mantienen.
PROMPT
```

## 7) Modo iterativo (parches pequeños)

```bash
cat <<'PROMPT' | codex exec -C /home/druiz/pptx2md -
Trabaja en modo iterativo:
1) no cambies nada hasta exponer hipótesis (máx 5 líneas),
2) aplica solo 1 parche pequeño,
3) indica qué test debería mejorar (A-N),
4) detente para validación visual antes del siguiente parche.
PROMPT
```
