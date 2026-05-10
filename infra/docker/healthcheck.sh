#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "[healthcheck] Missing infra/docker/.env — cannot inspect stack." >&2
  exit 1
fi

echo "[healthcheck] docker compose ps"
docker compose --env-file .env ps

services=(postgres redis bitcoin-core nats)
failures=()

for svc in "${services[@]}"; do
  cid="$(docker compose --env-file .env ps -q "$svc" 2>/dev/null | head -n1 || true)"
  if [[ -z "${cid}" ]]; then
    failures+=("${svc}: no container id (is the stack up?)")
    continue
  fi
  state=$(docker inspect -f '{{.State.Status}}' "$cid")
  if [[ "${state}" != "running" ]]; then
    failures+=("${svc}: state=${state}")
    continue
  fi
  health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$cid")
  if [[ -z "${health}" ]]; then
    continue
  fi
  if [[ "${health}" != "healthy" ]]; then
    failures+=("${svc}: health=${health}")
  fi
done

if [[ "${#failures[@]}" -gt 0 ]]; then
  echo "[healthcheck] One or more services failed checks:" >&2
  for f in "${failures[@]}"; do
    echo "  - ${f}" >&2
  done
  exit 1
fi

echo "[healthcheck] OK — all services are running and report healthy (when a healthcheck exists)."
