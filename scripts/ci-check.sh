#!/usr/bin/env bash
# Verificación local / CI-friendly: Go (servicios del go.work) + tests JS vía Turbo.
# Uso: bash scripts/ci-check.sh
#      SKIP_WALLET_BUILD=1  — omite el build del wallet (más rápido; útil en Linux sin deps de Electron).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

prepend_pnpm_to_path() {
  local d
  for d in "${PNPM_HOME:-}" "$HOME/Library/pnpm" "$HOME/.local/share/pnpm"; do
    [[ -z "$d" || ! -d "$d" ]] && continue
    if [[ -x "$d/pnpm" ]]; then
      export PNPM_HOME="$d"
      export PATH="$d:$PATH"
      return 0
    fi
  done
  return 1
}

if ! command -v pnpm >/dev/null 2>&1; then
  prepend_pnpm_to_path || true
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[ci-check] ERROR: pnpm no está en PATH. Añade PNPM_HOME a ~/.zshrc o usa: corepack prepare pnpm@9.15.0 --activate"
  exit 1
fi

if ! command -v go >/dev/null 2>&1; then
  echo "[ci-check] ERROR: go no está instalado."
  exit 1
fi

echo "[ci-check] go work sync"
go work sync

echo "[ci-check] Go test (-race) por módulo en go.work"
while IFS= read -r line; do
  [[ "$line" =~ ^[[:space:]]*\./(.*)[[:space:]]*$ ]] || continue
  rel="${BASH_REMATCH[1]}"
  [[ -z "$rel" ]] && continue
  mod="$ROOT/$rel"
  [[ -f "$mod/go.mod" ]] || continue
  echo "[ci-check] go test $rel"
  (cd "$mod" && go test ./... -race -count=1)
done < <(grep -E '^\s*\./' go.work)

echo "[ci-check] pnpm install (frozen si hay lockfile)"
if [[ -f pnpm-lock.yaml ]]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi

echo "[ci-check] Turbo: tests dashboard (+ wallet no-op test si existe)"
pnpm exec turbo run test --filter=@bpvp/dashboard --filter=@bpvp/wallet

if [[ "${SKIP_WALLET_BUILD:-}" == "1" ]]; then
  echo "[ci-check] SKIP_WALLET_BUILD=1 — omitiendo build del wallet"
else
  echo "[ci-check] Turbo: build wallet (export SKIP_WALLET_BUILD=1 para omitir)"
  pnpm exec turbo run build --filter=@bpvp/wallet
fi

echo "[ci-check] OK"
