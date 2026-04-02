# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all packages in watch mode)
pnpm dev

# Build all packages
pnpm build

# Lint (Biome)
pnpm lint

# Format (Biome)
pnpm format

# Type-check all packages
pnpm typecheck

# Run full stack with Docker
docker-compose up
```

Individual package commands (from root with `--filter`):
```bash
pnpm --filter @playwright-cart/server dev    # tsx watch mode
pnpm --filter @playwright-cart/web dev       # Vite dev server
pnpm --filter @playwright-cart/reporter dev  # tsc watch mode
```

## Architecture

A monorepo for collecting and viewing Playwright test reports in a centralized dashboard. Uses **pnpm workspaces** + **Turbo** for orchestration, **Biome** for linting/formatting.

### Packages

**`packages/reporter`** — Playwright custom reporter (`Reporter` interface from `@playwright/test`)
- Implements `onBegin`, `onTestEnd`, `onEnd` lifecycle hooks
- Collects test metadata and results during a run
- On completion: zips the `playwright-report/` directory and POSTs it (multipart: zip + JSON metadata) to the server
- Published as an npm package for consumers to add to their `playwright.config.ts`

**`packages/server`** — Node.js REST API using [Hono](https://hono.dev) + `@hono/node-server`
- `POST /api/reports` — receives multipart upload (zip + metadata), extracts zip, stores in `/app/data/`
- `GET /api/reports` — returns list of report metadata
- `GET /reports/*` — serves extracted static report files with headers required for Playwright trace viewer (COOP/COEP)
- Reports stored in `/app/data/{reportId}/` on the filesystem

**`packages/web`** — React 19 + Vite frontend
- Lists uploaded reports with project name, upload time, and test status
- Opens report in new tab (requires HTTP not HTTPS for service worker)
- In dev: Vite proxies `/api` and `/reports` to server on port 3001
- In production: Nginx serves static files and proxies to server

### Docker

- Server: port 3001, mounts shared volume at `/app/data`
- Web: port 80 via Nginx, proxies to server container
- `docker-compose up` starts the full stack

### TypeScript config

Root `tsconfig.json` defines base settings; each package extends it and uses project references. Strict mode enabled.

### Code style

Biome enforces single quotes and 100-character line width across the entire monorepo.
