# BPVP Suite v2

Institutional monorepo — Bitcoin-native DeFi platform (**v0.1.0 scaffold**).

**Repository:** [github.com/TrebuojZepol/bpvp-suite-v2](https://github.com/TrebuojZepol/bpvp-suite-v2)

## Contents

| Area | Path | Stack |
|------|------|--------|
| Web dashboard | `apps/dashboard` | Next.js 15, React 19, Tailwind |
| Desktop wallet | `apps/wallet` | Electron, Vite |
| Auth / API engine | `services/engine` | Go 1.23 (Gin, JWT RS256, Argon2id, TOTP, Redis rate limits) |
| Indexer / watcher | `services/indexer`, `services/watcher` | Go stubs |
| Local infra | `infra/docker` | PostgreSQL, Redis, Bitcoin Core (signet), NATS |
| CI | `.github/workflows/ci.yml` | Go tests (`-race`), `govulncheck`, pnpm/turbo |

## Requirements

- **Node** ≥ 20.12, **pnpm** ≥ 9  
- **Go** 1.23+  
- **Docker** (optional: local stack + TruffleHog in `scripts/security-audit.sh`)

## Quick start

```bash
pnpm install
pnpm run build    # turbo build
pnpm run test     # turbo test
```

Go workspace:

```bash
go work sync
go test ./... -C services/engine -race
```

Local Docker stack (needs `infra/docker/.env` from `.env.example` with non-empty secrets):

```bash
cd infra/docker && docker compose up -d
```

### Dashboard login (local)

The dashboard proxies auth to the Go engine (`BPVP_ENGINE_URL`, default `http://127.0.0.1:8080`). You need Postgres + Redis + the auth binary running with the env vars from `services/engine` config (`BPVP_DATABASE_URL`, `BPVP_REDIS_URL`, JWT keys, `BPVP_ADMIN_STEPUP_TOKEN`, etc.).

Seed a **password-only** dev user (default role `trader`; admins require TOTP in this codebase):

```bash
export BPVP_DATABASE_URL='postgres://USER:PASS@127.0.0.1:5432/bpvp_suite'
export BPVP_SEED_USERNAME=trebuoj
export BPVP_SEED_PASSWORD='your-password'   # use single quotes if it contains $ or !
chmod +x scripts/seed-dev-user.sh
./scripts/seed-dev-user.sh
```

Then start the engine and the dashboard (`apps/dashboard`: `pnpm run dev`) and sign in with that username/password (leave MFA off unless the user has TOTP enrolled).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Dev entry (`scripts/dev.sh`) |
| `pnpm run audit` | TruffleHog (Docker), `pnpm audit`, `govulncheck` (`scripts/security-audit.sh`) |
| `pnpm run ci` | Local CI helper (`scripts/ci-check.sh`) |
| `./scripts/seed-dev-user.sh` | Upsert dev user into Postgres (`cmd/seed`) |

## Documentation

- [CHANGELOG.md](./CHANGELOG.md)  
- [CONTRIBUTING.md](./CONTRIBUTING.md)  
- [SECURITY.md](./SECURITY.md)  
- [LICENSE](./LICENSE)  
- [VALIDATION_REPORT.md](./VALIDATION_REPORT.md)  
- `docs/architecture`, `docs/security`

## Security

Report vulnerabilities privately — see [SECURITY.md](./SECURITY.md).

## License

MIT — see [LICENSE](./LICENSE).
