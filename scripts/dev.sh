#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# TODO: start docker compose (infra/docker), then turbo dev or per-app dev servers.
# TODO: document required env files (.env.example) for each app/service.

echo "[dev] Scaffold only — wire docker compose, turbo, and per-service processes after implementation."
echo "[dev] Intended: pnpm exec turbo run dev (after pnpm install)."
