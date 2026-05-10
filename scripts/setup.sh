#!/usr/bin/env bash
# One-shot local bootstrap: tooling versions, pnpm, lefthook, env files.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[setup] Raíz: $ROOT"

need_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "[setup] ERROR: Docker no está instalado."
    echo "         macOS: https://docs.docker.com/desktop/  o: brew install --cask docker"
    exit 1
  fi
}

need_go_123() {
  if ! command -v go >/dev/null 2>&1; then
    echo "[setup] ERROR: Go no está instalado."
    echo "         Instala Go 1.23+: https://go.dev/dl/  o: brew install go@1.23"
    exit 1
  fi
  local ver major minor rest
  ver="$(go version | awk '{print $3}' | sed 's/^go//')"
  # go1.26.3 → 1.23+ OK; go2.x → OK
  major="${ver%%.*}"
  rest="${ver#*.}"
  minor="${rest%%.*}"
  if [[ ! "$major" =~ ^[0-9]+$ ]] || [[ ! "$minor" =~ ^[0-9]+$ ]]; then
    echo "[setup] ERROR: No pude interpretar la versión de Go: go${ver}"
    exit 1
  fi
  if [[ "$major" -gt 1 ]] || [[ "$major" -eq 1 && "$minor" -ge 23 ]]; then
    echo "[setup] Go ok: go${ver}"
    return 0
  fi
  echo "[setup] ERROR: Se requiere Go 1.23+. Versión actual: go${ver}"
  exit 1
}

need_docker
need_go_123

# pnpm: PATH → corepack (si puede escribir en /usr/local/bin) → instalador en $HOME
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

ensure_pnpm() {
  prepend_pnpm_to_path || true
  if command -v pnpm >/dev/null 2>&1; then
    echo "[setup] pnpm ok: $(pnpm --version) ($(command -v pnpm))"
    return 0
  fi

  if command -v corepack >/dev/null 2>&1 && corepack enable 2>/dev/null; then
    corepack prepare pnpm@9.15.0 --activate
    if command -v pnpm >/dev/null 2>&1; then
      echo "[setup] pnpm vía corepack: $(pnpm --version)"
      return 0
    fi
  else
    echo "[setup] corepack enable no disponible o sin permiso (EACCES en /usr/local/bin es normal)."
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "[setup] ERROR: hace falta curl o pnpm ya instalado."
    echo "         Prueba: brew install pnpm   o   sudo corepack enable"
    exit 1
  fi

  echo "[setup] Instalando pnpm 9.15.0 en tu cuenta (get.pnpm.io)..."
  export PNPM_VERSION=9.15.0
  # shellcheck disable=SC2016
  curl -fsSL https://get.pnpm.io/install.sh | sh -

  prepend_pnpm_to_path || true
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "[setup] ERROR: pnpm sigue sin estar en PATH."
    echo "         Abre una terminal nueva, o ejecuta:"
    echo "           export PNPM_HOME=\"\$HOME/Library/pnpm\""
    echo "           export PATH=\"\$PNPM_HOME:\$PATH\""
    exit 1
  fi
  echo "[setup] pnpm ok: $(pnpm --version)"
}

ensure_pnpm

if [[ ! -f "$ROOT/pnpm-lock.yaml" ]]; then
  echo "[setup] No hay pnpm-lock.yaml — ejecutando pnpm install (genera lockfile)..."
  pnpm install
else
  pnpm install --frozen-lockfile
fi

# Lefthook solo si hay repositorio git (evita ELIFECYCLE en carpetas sin .git)
if git rev-parse --git-dir >/dev/null 2>&1; then
  pnpm exec lefthook install
else
  echo "[setup] Sin .git — lefthook no instalado. Tras git init o clone: pnpm exec lefthook install"
fi

# Dashboard local env
DASH_ENV_EX="$ROOT/apps/dashboard/.env.example"
DASH_ENV_LOCAL="$ROOT/apps/dashboard/.env.local"
if [[ -f "$DASH_ENV_EX" ]] && [[ ! -f "$DASH_ENV_LOCAL" ]]; then
  cp "$DASH_ENV_EX" "$DASH_ENV_LOCAL"
  echo "[setup] Creado $DASH_ENV_LOCAL desde .env.example"
fi

echo "[setup] Listo."
echo "         Infra: copia infra/docker/.env.example → infra/docker/.env y: bash scripts/dev.sh"

# pnpm instalado vía get.pnpm.io vive en ~/Library/pnpm; setup.sh solo exporta PATH en esta sesión.
if [[ "$(command -v pnpm 2>/dev/null)" == "$HOME/Library/pnpm/pnpm" ]]; then
  echo ""
  echo "[setup] Aviso: en una terminal nueva, \`pnpm\` no estará en PATH hasta que añadas a ~/.zshrc (o ~/.bash_profile):"
  echo "         export PNPM_HOME=\"\$HOME/Library/pnpm\""
  echo "         export PATH=\"\$PNPM_HOME:\$PATH\""
  echo "         Luego: source ~/.zshrc   (o abre una terminal nueva)"
fi
