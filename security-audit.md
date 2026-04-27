# Security Audit — 2026-04-27

## Overall Score: 9.4 / 10  (Grade: A-)

Penalties: 0 Critical · 0 High · 0 Medium · 6 Low × 0.1 = 0.6 · 1 Info = 0

## Executive Summary

Strong improvement since the 2026-04-11 audit (6.7/10 C → 9.4/10 A-). SA-008 (test metadata
validation), SA-NEW-1 (API key in git), and SA-007 (nginx security headers) have been resolved.
Authentication foundations remain solid: bcrypt, httpOnly/SameSite:strict cookies, JTI
revocation, rate-limited login, CORS restricted to an explicit origin. No Medium-or-higher
findings remain. Six Low findings remain as infrastructure hygiene items (credential templating,
logger redaction, upload guards). SA-012 is reclassified from Medium to Low: CVSS 3.5 falls in
the Low range; the label in the previous report was incorrect.

---

## Findings

### Critical  (CVSS 9.0–10.0)

*No Critical findings.*

---

### High  (CVSS 7.0–8.9)

*No High findings.*

---

### Medium  (CVSS 4.0–6.9)

*No Medium findings.*

---

### Low  (CVSS 0.1–3.9)

#### [SA-010] Hardcoded Postgres credentials in production compose
- **Severity:** Low (CVSS 3.7) — unfixed from 2026-04-11
- **Location:** `docker-compose.prod.yml:14-16`
- **Description:** `POSTGRES_PASSWORD: playwright_cart` is a literal string in the prod
  compose file, checked into source control. The DB port is not externally exposed, but
  defence-in-depth requires unique credentials.
- **Fix:**

```yaml
# docker-compose.prod.yml
POSTGRES_USER: "${POSTGRES_USER}"
POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"
POSTGRES_DB: "${POSTGRES_DB:-playwright_cart}"
```

Also add `POSTGRES_USER=` and `POSTGRES_PASSWORD=` to `.env.example`.

---

#### [SA-011] Dev compose JWT_SECRET has a weak, known fallback
- **Severity:** Low (CVSS 3.1) — unfixed from 2026-04-11
- **Location:** `docker-compose.yml:39`
- **Description:** `JWT_SECRET: "${JWT_SECRET:-change-this-secret-in-production}"` — the
  fallback is a publicly known string. If an operator accidentally runs dev compose in a
  reachable environment, all tokens are signed with a guessable secret.
- **Fix:**

```yaml
# docker-compose.yml
JWT_SECRET: "${JWT_SECRET:?JWT_SECRET must be set}"
```

---

#### [SA-012] No Content-Type / magic-byte validation on zip upload
- **Severity:** Low (CVSS 3.5) — unfixed from 2026-04-11 *(reclassified from Medium; CVSS 3.5
  is in the Low range — the previous label was incorrect)*
- **Location:** `packages/server/src/runs/routes.ts:121-122`
- **Description:** `POST /:runId/report` accepts any file as the `report` multipart field
  with no MIME type or magic-byte check. Defence-in-depth after the SA-001 zip-slip fix.
- **Fix:**

```typescript
// packages/server/src/runs/routes.ts — after reading zipBuf
// Check zip magic bytes: PK\x03\x04
if (zipBuf[0] !== 0x50 || zipBuf[1] !== 0x4b || zipBuf[2] !== 0x03 || zipBuf[3] !== 0x04) {
  return c.json({ error: 'Not a valid zip file' }, 400)
}
```

---

#### [SA-NEW-2] Server logger emits Authorization headers in plaintext
- **Severity:** Low (CVSS 3.5) — unfixed from 2026-04-11
- **Location:** `packages/server/src/app.ts:20`
- **Description:** `app.use('*', logger())` — Hono's default logger logs full request
  headers, including `Authorization: Bearer <raw-api-key>`. Anyone with access to server
  logs (CI output, log aggregators, sysadmins) can extract raw API keys.
- **Fix:**

```typescript
// packages/server/src/app.ts
app.use('*', logger((str, ...rest) => {
  console.log(
    str.replace(/Authorization:\s*Bearer\s+[a-f0-9]{64}/gi, 'Authorization: Bearer [REDACTED]'),
    ...rest,
  )
}))
```

---

#### [SA-NEW-4] No per-file size limit on attachment uploads
- **Severity:** Low (CVSS 2.5) — new finding
- **Location:** `packages/server/src/runs/routes.ts:99-106`
- **Description:** The attachment upload loop calls `file.arrayBuffer()` with no per-file
  size guard. Nginx enforces a 100 MB `client_max_body_size` per request, but a single
  large file within that limit fully materialises in memory before being written to disk.
  Accumulated across many test uploads, this creates a DoS surface.
- **Impact:** Memory pressure during upload of large attachments; disk exhaustion with many
  runs.
- **Fix:**

```typescript
// packages/server/src/runs/routes.ts — inside the attachment loop
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 MB

for (let i = 0; ; i++) {
  const file = body[`attachment_${i}`]
  if (!file) break
  if (file instanceof File) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return c.json({ error: `Attachment ${i} exceeds 10 MB limit` }, 400)
    }
    const buf = Buffer.from(await file.arrayBuffer())
    writeFileSync(join(attachmentsDir, basename(file.name)), buf)
  }
}
```

---

#### [SA-NEW-5] No rate limiting on reporter upload endpoints
- **Severity:** Low (CVSS 3.2) — new finding
- **Location:** `packages/server/src/runs/routes.ts` — `POST /:runId/tests` (line 91),
  `POST /:runId/report` (line 113)
- **Description:** Only `POST /api/auth/login` is rate-limited. A compromised or leaked API
  key can drive unlimited uploads — exhausting disk, CPU, and Postgres row limits — with no
  throttle. API keys are revocable but revocation requires manual admin intervention.
- **Impact:** DoS via disk/DB exhaustion using a single leaked API key; no automated
  backpressure to signal abuse.
- **Fix:**

```typescript
// packages/server/src/app.ts — add alongside the login rate-limiter
app.use(
  '/api/runs/:runId/tests',
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    keyGenerator: (c) =>
      c.req.header('x-real-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown',
  }),
)
app.use(
  '/api/runs/:runId/report',
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    keyGenerator: (c) =>
      c.req.header('x-real-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown',
  }),
)
```

---

### Info

#### [SA-005] JWT_SECRET dual-used for three distinct cryptographic operations
- **Severity:** Info — won't fix (reclassified from High after threat-model review on
  2026-04-11; see that audit for full rationale)
- **Location:** `packages/server/src/app.ts`, `packages/server/src/auth/middleware.ts`
- Key separation is sound cryptographic hygiene but is over-engineering for a CI test
  reporting dashboard. Won't fix.

---

#### [SA-014] Stack traces rendered to UI
- **Severity:** Info (CVSS 0.0)
- **Location:** `packages/web/src/components/ErrorBlock.tsx:9-14`
- **Description:** `{error.stack}` rendered unconditionally. No XSS risk (React text node),
  but leaks file paths and library versions to end users in production.
- **Fix:** Guard with `import.meta.env.DEV && error.stack`.

---

## Dependency Audit

```
pnpm audit: 1 vulnerability found — Severity: 1 moderate
```

Unchanged from 2026-04-11 audit.

| Package | Via | Vulnerable | Patched | Advisory |
|---------|-----|-----------|---------|---------|
| `esbuild <=0.24.2` | `drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils` | <=0.24.2 | >=0.25.0 | GHSA-67mh-4wv8-2f99 |

Dev-only dependency (used for Drizzle migrations, not bundled into production). Risk is low.
Update `drizzle-kit` when an upstream release pulls in esbuild ≥0.25.0.

---

## What Was Fixed (since 2026-04-11)

| Finding | Fix |
|---------|-----|
| SA-008 No schema validation on test metadata JSON | `packages/server/src/runs/routes.ts` now uses `zod` runtime validation plus `JSON.parse` error handling; malformed or wrong-shape metadata returns `400`, covered by route tests |
| SA-NEW-1 Raw API key committed to git | `packages/e2e/.env` no longer tracked by git |
| SA-007 Nginx ships with no security response headers | `packages/web/nginx.conf` now sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and a SPA-only CSP while leaving `/reports/` CSP-free |

Previously fixed items (SA-001–004, SA-006, SA-009) remain verified fixed.

### Reclassified

| Finding | Previous | Revised | Reason |
|---------|----------|---------|--------|
| SA-005 JWT_SECRET dual-use | High (CVSS 7.5) | Info — won't fix | Threat model unchanged; see 2026-04-11 rationale |
| SA-NEW-1 API key in git | Low — git hygiene | Fixed | File no longer tracked by git |
| SA-012 zip magic-byte check | Medium (CVSS 3.5) | Low (CVSS 3.5) | CVSS 3.5 is in the Low range; previous label was incorrect |

---

## Recommendations Summary

Work through in this order:

1. **[SA-NEW-2]** Redact Authorization headers from logger — one wrapper, prevents key leakage in logs
2. **[SA-NEW-5]** Rate-limit reporter upload endpoints — backpressure against compromised API keys
3. **[SA-011]** Remove weak JWT_SECRET fallback from dev compose — use `:?` to force explicit value
4. **[SA-010]** Template Postgres credentials in prod compose — use env vars, document in .env.example
5. **[SA-012]** Add magic-byte check on zip upload — defence-in-depth for zip processing
6. **[SA-NEW-4]** Add per-file size cap on attachment uploads — prevents memory spike on large files
7. **[SA-014]** Guard stack traces from UI in production — `import.meta.env.DEV &&`

Won't fix: SA-005 (JWT_SECRET dual-use — not warranted for this threat model)
