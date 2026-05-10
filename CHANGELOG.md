# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- _(nothing yet)_

## [0.1.0] — 2026-05-10

### Added

- Monorepo scaffold: dashboard (Next.js), wallet (Electron), Go services (`engine`, `indexer`, `watcher`).
- Auth service foundation in Go: Argon2id passwords, RS256 JWT, TOTP, RBAC, Redis-backed rate limiting.
- Dashboard routes and UI scaffolding (market, lending, OTC, admin, etc.).
- Wallet core: vault (AES-GCM), seed/sign flows (scaffold).
- Docker-based local stack (`infra/docker`) with RPC not exposed on host for Bitcoin Core.
- CI workflow: Go tests with `-race`, turbo tests/build for dashboard and wallet.
- CI security steps: `govulncheck` on `services/engine`, `pnpm audit` on dashboard after install.
- Scripts: `scripts/security-audit.sh` (TruffleHog via Docker, audit, govulncheck).
- Documentation: `docs/`, `VALIDATION_REPORT.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`.
- Cursor rule for canonical repo path (`.cursor/rules/`).

### Notes

- Matching engine / on-chain AMM **logic** beyond placeholders remains roadmap work; UI components may preview behavior.
- Full dynamic application security testing (DAST) against a deployed environment is not yet automated in CI.

[0.1.0]: https://github.com/trebuojzepol/bpvp-suite-v2/releases/tag/v0.1.0
