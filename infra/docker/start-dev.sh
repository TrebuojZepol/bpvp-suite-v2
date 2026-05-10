#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "[start-dev] Missing infra/docker/.env — copy .env.example to .env and set all required variables." >&2
  exit 1
fi

exec docker compose --env-file .env up -d
