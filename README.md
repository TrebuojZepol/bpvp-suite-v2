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

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Dev entry (`scripts/dev.sh`) |
| `pnpm run audit` | TruffleHog (Docker), `pnpm audit`, `govulncheck` (`scripts/security-audit.sh`) |
| `pnpm run ci` | Local CI helper (`scripts/ci-check.sh`) |

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
