#!/usr/bin/env bash
# Upsert a local dev user (see services/engine/cmd/seed).
# Requires: Postgres reachable, table users (run auth service once or apply same schema as cmd/auth).
#
# Example (password has '$' — use single quotes in bash):
#   export BPVP_DATABASE_URL='postgres://bpvp:YOUR_PG_PASS@127.0.0.1:5432/bpvp_suite'
#   export BPVP_SEED_USERNAME=trebuoj
#   export BPVP_SEED_PASSWORD='your-password'
#   ./scripts/seed-dev-user.sh
#
# Default role is trader (password-only). Admin requires TOTP in this codebase.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/services/engine"

if [[ -z "${BPVP_DATABASE_URL:-}" ]]; then
	echo "error: set BPVP_DATABASE_URL" >&2
	exit 1
fi
if [[ -z "${BPVP_SEED_PASSWORD:-}" ]]; then
	echo "error: set BPVP_SEED_PASSWORD" >&2
	exit 1
fi

export BPVP_SEED_USERNAME="${BPVP_SEED_USERNAME:-trebuoj}"
export BPVP_SEED_ROLE="${BPVP_SEED_ROLE:-trader}"

exec go run ./cmd/seed
