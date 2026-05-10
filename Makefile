.PHONY: setup dev build test lint audit clean ci help

help:
	@echo "Targets: setup | dev | build | test | lint | ci | audit | clean"

setup:
	@bash scripts/setup.sh

dev:
	@bash scripts/dev.sh

build:
	@pnpm exec turbo run build

test:
	@pnpm exec turbo run test

lint:
	@pnpm exec turbo run lint

audit:
	@bash scripts/security-audit.sh

clean:
	@pnpm exec turbo run clean 2>/dev/null || true

ci:
	@bash scripts/ci-check.sh
