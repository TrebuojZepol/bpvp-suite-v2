# Contributing to BPVP Suite v2

This monorepo uses **pnpm** workspaces and **Go** modules. Development targets **Node 20+** and **Go 1.23+**.

## Getting started

```bash
cd ~/Developer/bpvp-suite-v2   # or your clone path
corepack enable                 # if needed
pnpm install
bash scripts/setup.sh           # if documented for your environment
```

Run checks locally before opening a PR:

```bash
pnpm run lint
pnpm run test
pnpm run ci                     # scripts/ci-check.sh when applicable
cd services/engine && go test ./... -race
```

Security scripts (require Docker / tooling on PATH):

```bash
pnpm run audit                  # scripts/security-audit.sh
```

## Pull requests

1. Branch from `main` with a clear name (`feat/…`, `fix/…`, `chore/…`).  
2. Keep changes focused; reference issues when applicable.  
3. Update **CHANGELOG.md** under `[Unreleased]` or the target release section for user-visible changes.  
4. Ensure CI-green: tests, lint, and builds for touched packages.

## Code layout

| Area | Path |
|------|------|
| Web dashboard | `apps/dashboard/` |
| Desktop wallet | `apps/wallet/` |
| Auth / API engine | `services/engine/` |
| Indexer / watcher | `services/indexer/`, `services/watcher/` |
| Infra | `infra/docker/`, `infra/terraform/` |

## Commits

Prefer [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.).

## Questions

Open a discussion or contact maintainers via the address in **SECURITY.md** for sensitive topics.
