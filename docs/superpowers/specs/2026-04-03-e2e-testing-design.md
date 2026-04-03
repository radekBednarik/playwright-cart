# E2E Testing Design

**Date:** 2026-04-03  
**Status:** Approved

## Context

The playwright-cart monorepo has unit tests (Vitest) for all packages but no end-to-end test coverage of the full pipeline: reporter → server → web dashboard. The `@playwright-cart/reporter` package also cannot be tested as a real consumer would use it without publishing to npm. This design establishes a local manual E2E testing workflow that exercises the entire pipeline without requiring an npm publish.

## Goal

Create a `packages/e2e` workspace package that:
1. Uses `@playwright-cart/reporter` directly from the monorepo (no npm publish)
2. Runs Playwright tests against a tiny bundled demo app
3. Uploads results (including traces) to the locally running server
4. Lets the developer manually verify the dashboard at `http://localhost`

## Architecture

```
packages/e2e/
├── package.json           # @playwright-cart/e2e (private workspace package)
├── tsconfig.json          # extends root tsconfig
├── playwright.config.ts   # reporter + webServer + trace: 'on'
├── demo-app/
│   └── index.html         # static Todo app (add / complete / delete items)
└── tests/
    ├── todo.spec.ts        # ~3 passing tests
    └── failing.spec.ts     # 1 intentional failure to verify failure reporting
```

## Key Decisions

### Reporter linking
`@playwright-cart/reporter: workspace:*` in `package.json`. pnpm resolves it from the local monorepo. No `file:` hacks or symlinks needed.

### Build step
A `pretest` script in `packages/e2e/package.json` runs `pnpm --filter @playwright-cart/reporter build` before every test run. This ensures `dist/` is always up to date with source changes.

### Demo app
A single `demo-app/index.html` — a minimal Todo app with add, complete, and delete interactions. Served by a local static server (`serve` package) via Playwright's `webServer` option on port 5500. No build step required.

### Playwright config
```ts
reporter: [
  ['html', { open: 'never' }],
  ['@playwright-cart/reporter', {
    serverUrl: 'http://localhost:3001',
    project: 'e2e-demo',
    branch: process.env.BRANCH ?? 'local',
    commitSha: process.env.COMMIT_SHA ?? 'manual',
  }],
],
use: {
  baseURL: 'http://localhost:5500',
  trace: 'on',
},
webServer: {
  command: 'npx serve demo-app -l 5500',
  url: 'http://localhost:5500',
  reuseExistingServer: true,
},
```

`trace: 'on'` ensures every test generates a trace, which exercises the reporter's multipart attachment upload path on every run.

### Test content
- `todo.spec.ts`: load page, add a todo, complete a todo (~3 tests, all passing)
- `failing.spec.ts`: one test that intentionally fails (asserts a non-existent element) — verifies the dashboard correctly shows failed test states

## E2E Workflow

```bash
# 1. Start the stack
docker-compose up -d

# 2. Run E2E tests (auto-builds reporter first)
pnpm --filter @playwright-cart/e2e test

# 3. Open dashboard and verify
open http://localhost        # or http://localhost on Linux
```

What to check in the dashboard:
- A new run appears in the runs list with the correct project name (`e2e-demo`)
- Run shows correct pass/fail counts
- Clicking into the run shows individual test results
- Failing test is marked red with a failure message
- Trace viewer opens for tests that have traces

## Files to Create

| File | Purpose |
|------|---------|
| `packages/e2e/package.json` | Workspace package, pretest build, playwright test script |
| `packages/e2e/tsconfig.json` | TypeScript config extending root |
| `packages/e2e/playwright.config.ts` | Full Playwright + reporter config |
| `packages/e2e/demo-app/index.html` | Static Todo demo app |
| `packages/e2e/tests/todo.spec.ts` | Passing test suite |
| `packages/e2e/tests/failing.spec.ts` | Intentional failure test |

## README Update

Add a **Manual E2E Testing** section to `README.md` documenting:
1. Prerequisites (Docker, pnpm, built reporter via pretest)
2. The 3-step workflow above
3. What to verify in the dashboard
4. How to tear down (`docker-compose down`)
