#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/fonts/source-sans-3"
DST_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/fonts/source-sans-3"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "No se encontró: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$DST_DIR"

# Copiamos solo ttf (variable + estáticas)
find "$SRC_DIR" -type f -name '*.ttf' -print0 | while IFS= read -r -d '' f; do
  cp -f "$f" "$DST_DIR/"
done

if command -v fc-cache >/dev/null 2>&1; then
  fc-cache -f "$DST_DIR"
  echo "Fuentes instaladas en $DST_DIR y caché actualizada."
else
  echo "Fuentes copiadas en $DST_DIR. 'fc-cache' no está disponible en PATH." >&2
fi

echo "Prueba rápida:"
echo "  fc-list | rg -i 'source sans 3|sourcesans3'"
