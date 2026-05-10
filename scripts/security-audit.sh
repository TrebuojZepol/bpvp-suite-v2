#!/usr/bin/env bash
# Run from repo root: ./scripts/security-audit.sh
# TruffleHog: do not use `npx trufflehog` — it resolves to an unrelated npm package.
# Prefer: docker run ... trufflesecurity/trufflehog:latest filesystem /work --only-verified
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

failures=0

echo "[audit] TruffleHog (verified secrets only)"
if command -v docker >/dev/null 2>&1; then
	docker run --rm -v "$ROOT:/work" -w /work trufflesecurity/trufflehog:latest \
		filesystem /work --only-verified || failures=$((failures + 1))
else
	echo "[audit] Docker not found. Install TruffleHog CLI or Docker image: https://github.com/trufflesecurity/trufflehog"
	failures=$((failures + 1))
fi

echo "[audit] pnpm audit (apps/dashboard, moderate+)"
if command -v pnpm >/dev/null 2>&1; then
	(cd "$ROOT/apps/dashboard" && pnpm audit --audit-level=moderate) || failures=$((failures + 1))
else
	echo "[audit] pnpm not on PATH"
	failures=$((failures + 1))
fi

echo "[audit] govulncheck (services/engine)"
GVC=""
if command -v govulncheck >/dev/null 2>&1; then
	GVC="govulncheck"
elif [[ -x "$(go env GOPATH)/bin/govulncheck" ]]; then
	GVC="$(go env GOPATH)/bin/govulncheck"
fi
if [[ -n "$GVC" ]]; then
	(cd "$ROOT/services/engine" && "$GVC" ./...) || failures=$((failures + 1))
else
	echo "[audit] govulncheck not found. Install: go install golang.org/x/vuln/cmd/govulncheck@latest"
	failures=$((failures + 1))
fi

if [[ "$failures" -gt 0 ]]; then
	echo "[audit] Finished with $failures failing step(s)."
	exit 1
fi
echo "[audit] All steps passed."
