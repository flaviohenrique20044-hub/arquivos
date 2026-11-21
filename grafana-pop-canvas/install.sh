#!/bin/sh
set -eu

if [ "$#" -ne 1 ] || [ ! -d "$1" ]; then
  printf 'Uso: sh install.sh /caminho/do/diretorio/de/plugins\n' >&2
  exit 2
fi

base=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
plugin=poplab-popcanvas-panel
dest=$1/$plugin

if ! mkdir -- "$dest"; then
  printf 'Instalacao interrompida. Verifique o acesso ou se o POP Canvas ja esta instalado.\n' >&2
  exit 1
fi

if ! cp -- "$base/plugins/$plugin/plugin.json" "$base/plugins/$plugin/module.js" "$base/plugins/$plugin/icon.svg" "$dest/"; then
  rm -f -- "$dest/plugin.json" "$dest/module.js" "$dest/icon.svg"
  rmdir -- "$dest"
  exit 1
fi

printf 'POP Canvas instalado em %s\n' "$dest"
printf 'Acrescente %s a allow_loading_unsigned_plugins e reinicie o Grafana.\n' "$plugin"
