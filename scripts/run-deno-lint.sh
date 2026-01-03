#!/bin/sh

set -e

if ! command -v deno >/dev/null 2>&1; then
  echo "Deno not found; skipping 'deno lint'." >&2
  exit 0
fi

exec deno lint "$@"
