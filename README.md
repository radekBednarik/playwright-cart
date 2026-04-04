# playwright-cart

A self-hosted dashboard for collecting and viewing Playwright test reports from any CI/CD pipeline.

## Features

- Custom Playwright reporter that uploads test results in real-time
- Centralised dashboard listing all runs with pass/fail stats
- Per-run test detail with errors, annotations, and attachments
- Integrated Playwright trace viewer (served with correct range-request headers)
- Simple Docker deployment — one `docker compose up`

## Architecture

```
playwright tests
      │
      │  @playwright-cart/reporter (npm package)
      │  streams results during test run
      ▼
┌─────────────┐        ┌─────────────┐
│   server    │◄───────│     web     │
│  (Hono API) │  /api  │ (React SPA) │
│  port 3001  │        │   port 80   │
└─────────────┘        └─────────────┘
      │                      
  PostgreSQL         data volume
  (run + test        (attachments,
   metadata)          report files)
```

The **server** stores run and test metadata in PostgreSQL via Drizzle ORM. Binary files — test attachments (screenshots, traces) and extracted HTML reports — are stored on disk in `DATA_DIR`. The **web** frontend is a static React SPA served by Nginx; Nginx proxies `/api` and `/reports` to the server container. The **reporter** npm package is installed in the project under test — not deployed here.

## Quick Start

**Prerequisites:** Docker + Docker Compose

```bash
git clone https://github.com/radekBednarik/playwright-cart.git
cd playwright-cart
docker compose up --build
```

Open `http://localhost` in your browser.

To run in the background:
```bash
docker compose up --build -d
```

## Reporter Setup

Install the reporter in your Playwright project:

```bash
npm install --save-dev @playwright-cart/reporter
# or
pnpm add -D @playwright-cart/reporter
```

Add it to `playwright.config.ts` alongside the HTML reporter:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: [
    ['html'],
    ['@playwright-cart/reporter', {
      serverUrl: 'http://localhost:3001', // URL of the playwright-cart server
      project: 'my-app',                 // logical project name
      branch: process.env.BRANCH,        // optional: branch name
      commitSha: process.env.COMMIT_SHA, // optional: commit SHA
    }],
  ],
})
```

The reporter uploads test results during the run and zips + uploads the HTML report on completion.

## Configuration

Environment variables for the server (set in `.env` or your CI environment):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the server listens on |
| `DATABASE_URL` | *(required)* | PostgreSQL connection string. In Docker Compose this is set automatically. For local dev, copy `.env.example` to `.env` and point at your local instance. |
| `DATA_DIR` | `/app/data` | Directory for binary files: test attachments and extracted HTML reports |

> **Note:** `DATABASE_URL` is automatically set when using `docker compose up`. For local development without Docker, you need a running PostgreSQL instance and `DATABASE_URL` set in your environment or `.env`.

Copy `.env.example` to `.env` to customise:

```bash
cp .env.example .env
```

## Development

**Prerequisites:** Node.js ≥ 20, pnpm

```bash
# Install all dependencies
pnpm install

# Start all packages in watch mode (reporter tsc, server tsx, web vite)
pnpm dev
```

The web dev server runs on `http://localhost:5173` and proxies `/api` and `/reports` to the server on port 3001.

Individual packages:

```bash
pnpm --filter @playwright-cart/server dev    # tsx watch — server on :3001
pnpm --filter @playwright-cart/web dev       # Vite dev server on :5173
pnpm --filter @playwright-cart/reporter dev  # tsc watch
```

Build all:

```bash
pnpm build
```

Lint and format (Biome):

```bash
pnpm lint
pnpm format
```

Type-check:

```bash
pnpm typecheck
```

## Running Tests

```bash
# Reporter
pnpm --filter @playwright-cart/reporter test
pnpm --filter @playwright-cart/reporter test:watch

# Server
pnpm --filter @playwright-cart/server test
pnpm --filter @playwright-cart/server test:watch
```

## Manual E2E Testing

A self-contained E2E test suite lives in `packages/e2e`. It uses `@playwright-cart/reporter` directly from the monorepo (no npm publish needed) and runs Playwright tests against a tiny static Todo demo app. Use this to manually verify the full reporter → server → dashboard pipeline.

### Prerequisites

- Docker + Docker Compose (to run the server and web dashboard)
- Node.js ≥ 20 + pnpm (already required for development)
- Playwright browsers installed once:
  ```bash
  pnpm --filter @playwright-cart/e2e exec playwright install chromium
  ```

### Running the E2E tests

**1. Start the stack:**

```bash
docker compose up --build -d
```

Wait until both services are healthy:

```bash
docker compose ps   # server and web should show "healthy"
```

**2. Run the tests** (reporter is built automatically via `pretest`):

```bash
pnpm --filter @playwright-cart/e2e test
```

Expect 4 passing tests and 1 intentional failure — the failing test exists to verify that the dashboard correctly displays error states and attached traces.

**3. Open the dashboard:**

Open `http://localhost` in your browser.

### What to verify

| Check | Where |
|-------|-------|
| New run appears with project `e2e-demo` | Runs list |
| Shows 4 passed, 1 failed | Run summary |
| Each test has a trace attachment | Test detail view |
| Failing test shows a timeout error message | Test detail view |
| Trace viewer opens for a test | Click the trace attachment |
| HTML report link is present | Run detail |

### Tear down

```bash
docker compose down          # stop containers, preserve data volume
docker compose down -v       # stop containers AND delete all run data
```

## API Reference

All endpoints are under the server (default: `http://localhost:3001`).

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/runs` | Create a new run — returns `{ runId }` |
| `GET` | `/api/runs` | List all runs, newest first |
| `GET` | `/api/runs/:runId` | Run record with all test results |
| `GET` | `/api/runs/:runId/tests/:testId` | Fetch a single test result |
| `POST` | `/api/runs/:runId/tests` | Upload a single test result (multipart) |
| `POST` | `/api/runs/:runId/report` | Upload zipped HTML report |
| `POST` | `/api/runs/:runId/complete` | Mark run complete (no HTML report) |
| `GET` | `/reports/*` | Serve extracted static report files |

## Docker Details

The stack uses three containers:

- **postgres** — PostgreSQL 17 Alpine, stores all run and test metadata
- **server** — Node.js Alpine, built from `packages/server/Dockerfile`; runs DB migrations at startup then starts the Hono API
- **web** — Nginx Alpine serving the Vite build, proxying to server

Both server and web use multi-stage Docker builds. Two named volumes persist data across restarts: `db_data` for the PostgreSQL database, `reports_data` for binary attachments and extracted HTML reports.

```bash
# Rebuild after code changes
docker compose up --build

# View logs
docker compose logs -f

# Check health status
docker compose ps

# Stop and remove containers (volumes preserved)
docker compose down

# Stop and remove containers AND all data (DB + reports)
docker compose down -v
```
