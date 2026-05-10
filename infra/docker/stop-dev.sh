#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Compose still interpolates ${VAR:?...} on `down`; without `.env`, supply non-empty dummy values
# so teardown works (containers are removed — credentials are not used).
if [[ -f .env ]]; then
  exec docker compose --env-file .env down
fi

exec env \
  POSTGRES_USER=__teardown__ \
  POSTGRES_PASSWORD=__teardown__ \
  REDIS_PASSWORD=__teardown__ \
  BITCOIN_RPC_USER=__teardown__ \
  BITCOIN_RPC_PASSWORD=__teardown__ \
  docker compose down
