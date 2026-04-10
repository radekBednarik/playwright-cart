# Security Audit Checklist

Detailed checks per category. Read the relevant section when auditing that area.

---

## Authentication & Sessions

- [ ] JWT cookie has `httpOnly: true` — prevents JS access
- [ ] JWT cookie has `sameSite: 'strict'` or `'lax'` — CSRF protection
- [ ] JWT cookie has `secure: true` in production — HTTPS only
- [ ] JWT expiry is reasonable (8h is fine; indefinite is not)
- [ ] JWT secret is long (≥32 random bytes), not a guessable default
- [ ] JWT secret is required at startup — server should refuse to start without it
- [ ] Token is not invalidated on logout (no denylist) — note as Low if expiry is short
- [ ] Login endpoint returns identical error messages for wrong username vs wrong password (no enumeration)
- [ ] No rate limiting on login — flag as Medium if none exists
- [ ] bcrypt cost factor is at least 10 (12 is good)
- [ ] Password change requires current password verification
- [ ] Admin bootstrap uses env vars, not hardcoded defaults
- [ ] Default credentials documented in .env.example are clearly marked as insecure

## API Keys

- [ ] Raw key is never stored — only a hash (HMAC-SHA256 or similar)
- [ ] Raw key is shown only once, at creation time
- [ ] Key hash uses a secret (not just `sha256(key)`)
- [ ] Key revocation path exists and works
- [ ] Keys are scoped (if no scoping, note as Info)

## CORS

- [ ] `cors()` is not called with no arguments (wildcard origin)
- [ ] If wildcard CORS is used with cookie auth, explain that `SameSite=Strict` partially mitigates but cross-origin requests without credentials still leak info
- [ ] CORS config matches the actual deployment origin(s)
- [ ] `/reports/*` CORS policy considered — served HTML from uploads runs in the same origin as the API

## Input Validation

- [ ] All JSON bodies from untrusted callers are validated against a schema (Zod, Valibot, etc.) — not just `JSON.parse(...) as Type`
- [ ] Integer path params are parsed with `parseInt`/`Number()` and checked for `isNaN`/`isFinite`
- [ ] Enum fields (role, status, theme) are validated against an allowlist
- [ ] File metadata from multipart uploads (filenames, content-types) is treated as untrusted
- [ ] Large or deeply-nested payloads have size limits

## File Upload & Path Construction

- [ ] Zip extraction: entries are validated against the target directory before extraction to prevent zip-slip
  - Pattern to check: `zip.extractAllTo(dir, true)` with no pre-validation of entry paths
  - Safe pattern: iterate entries, check `path.resolve(targetDir, entry.entryName).startsWith(path.resolve(targetDir))`
- [ ] Attachment filenames: `path.join(baseDir, file.name)` is safe only if `file.name` is sanitised first
  - Safe pattern: strip all path separators and `..` components, or use `path.basename(file.name)` as a minimum
- [ ] `testId` / `runId` used in path construction: validate against an allowlist pattern (e.g. `^[a-z0-9-]+$`) server-side
- [ ] Upload size limits are enforced server-side (not just at the proxy)
- [ ] Extracted files are served from a non-executable directory

## Response Headers

Add these on all HTML responses (can be applied globally in Hono or Nginx):

- `Content-Security-Policy` — especially important for the `/reports/*` route where arbitrary HTML is served
- `X-Frame-Options: DENY` or `SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)
- `Referrer-Policy: strict-origin-when-cross-origin`

Note: Serving user-uploaded HTML under the same origin as the API (no CSP) is a stored-XSS risk even if cookies are HttpOnly, because the report can exfiltrate data via `fetch()`.

## Secrets Management

- [ ] JWT_SECRET has no insecure default (or at minimum prints a loud warning)
- [ ] `docker-compose.yml` dev fallbacks like `${VAR:-insecure_default}` are clearly documented
- [ ] Production compose does not hardcode secrets
- [ ] Database password is not hardcoded in production compose
- [ ] A single secret is not used for multiple cryptographic purposes (e.g., JWT signing + HMAC for API keys)
  - If dual-use: flag as Low, suggest adding `API_KEY_SECRET` and `TOKEN_SECRET` env vars

## Rate Limiting & DoS

- [ ] Public endpoints (login, health) have rate limiting or are protected by upstream (Nginx/CDN)
- [ ] File upload endpoint has upload size limits enforced server-side
- [ ] SSE (`/api/events`) has connection limits or backpressure — many open SSE connections can exhaust file descriptors

## Dependency Vulnerabilities

Run `pnpm audit` and categorise results:
- Critical / High: should be fixed before production deployment
- Moderate: assess exploitability in context
- Low / Info: acceptable with explanation

Check for:
- `adm-zip` — known for zip-slip in older versions; verify version ≥ 0.5.x with path checking
- Any packages with known prototype pollution issues
- Outdated major versions of auth libraries (jsonwebtoken, bcrypt)

## Nginx / Reverse Proxy

- [ ] `client_max_body_size` is set appropriately
- [ ] Direct access to the backend port (3001) is blocked in production
- [ ] Security headers are set in Nginx if not set by the application
- [ ] No directory listing enabled
- [ ] HTTPS redirect is configured (production)

## Frontend (React)

- [ ] `dangerouslySetInnerHTML` is not used with untrusted data
- [ ] Error components do not render raw `error.stack` or internal paths to users
- [ ] Sensitive data (tokens, secrets) is not stored in `localStorage` (prefer httpOnly cookies)
- [ ] API error responses don't leak internal implementation details to the UI

## Docker & Infrastructure

- [ ] Backend port (3001) is not exposed in production compose
- [ ] No secrets in environment variable defaults in production compose
- [ ] Images are from official sources and reasonably up-to-date
- [ ] Health check is present (allows orchestrator to detect startup failures)
- [ ] Node process does not run as root inside the container
