---
name: security-audit
description: >
  Conducts a structured security audit of this repository's codebase and produces
  a scored report with prioritised findings and concrete code-fix suggestions.
  Covers the Node.js API server, React frontend, npm reporter package, Docker/Compose
  configs, and npm dependency vulnerabilities (via pnpm audit).

  Use this skill whenever the user asks to audit security, check for vulnerabilities,
  do a security review, find security issues, run a security scan, or asks whether
  the codebase is secure — even if they phrase it casually like "are we safe to
  deploy?" or "anything I should fix before going live?" or "can you check the
  auth code?" or "is there anything security-related I should look at?". If there
  is any security angle at all, load this skill.
---

# Security Audit Skill

You are performing a structured security audit of this monorepo. Your goal is to
produce an honest, actionable report: not a list of nitpicks, but a prioritised
diagnosis a developer can act on immediately.

## What to audit

Cover all four surfaces:

1. **Server** (`packages/server/src/`) — auth, routes, file upload, DB queries, secrets handling
2. **Web** (`packages/web/`) — XSS surfaces, error rendering, nginx config
3. **Reporter** (`packages/reporter/src/`) — credential handling, outbound upload safety
4. **Infrastructure** (`docker-compose.yml`, `docker-compose.prod.yml`, `.env.example`) — secret hygiene, port exposure

Also run `pnpm audit` from the repo root for dependency CVEs and include the results.

## How to approach the audit

Read the relevant source files. For each area, think like an attacker:
- What inputs arrive from outside the trust boundary?
- How are those inputs validated, sanitised, and escaped before use?
- What can go wrong if a malicious value slips through?
- Are secrets handled correctly — never logged, never hardcoded, never reused across purposes?
- Is access control applied consistently across all code paths, not just the happy path?

Key areas to always check for this codebase:

- **File upload** — three distinct risks to check separately:
  - *Zip-slip*: `AdmZip.extractAllTo(dir, true)` extracts without validating that entry paths stay inside `dir`. A crafted zip can write anywhere on the server.
  - *Attachment filename traversal*: `file.name` from multipart form data goes straight to `writeFileSync(join(attachmentsDir, file.name), buf)`. A filename like `../../etc/cron.d/evil` escapes the directory. Fix with `path.basename(file.name)`.
  - *`testId` path traversal*: `testId` comes from the reporter's JSON body (not generated server-side like `runId`). It flows into `getAttachmentsDir(runId, metadata.testId)` → `join(dataDir, runId, 'attachments', testId)` without server-side sanitisation. A `testId` of `../../sensitive` escapes the attachments directory. Fix by validating `testId` against `/^[a-z0-9_\-.:]+$/i` server-side before use.
- **Auth** — cookie security flags, JWT secret strength, API key storage, brute-force protection on login, logout token invalidation
- **CORS** — origin restrictions and their interaction with cookie-based auth
- **Input validation** — JSON parse safety, schema enforcement, unsafe TypeScript `as` casts on untrusted data
- **Response headers** — CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy
- **Secrets management** — default credentials, env var fallbacks in docker-compose, dual-use keys (e.g. same `JWT_SECRET` used for both JWT signing and HMAC-hashing API keys)
- **Rate limiting** — especially the public login endpoint
- **Path construction** — any `join(base, userInput)` without sanitisation

For deeper checklists per category, read `references/checklist.md`.

## Scoring

Calculate an overall security score out of 10. Start at 10.0 and subtract penalties:

| Severity | CVSS range | Penalty per finding |
|----------|------------|---------------------|
| Critical | 9.0–10.0   | −3.0                |
| High     | 7.0–8.9    | −1.5                |
| Medium   | 4.0–6.9    | −0.5                |
| Low      | 0.1–3.9    | −0.1                |
| Info     | 0.0        | 0                   |

Clamp the result to 0.0–10.0. Convert to a letter grade:
- A: 9.0–10.0
- B: 7.0–8.9
- C: 5.0–6.9
- D: 3.0–4.9
- F: below 3.0

Be calibrated about severity. A real Critical means an attacker could exploit it to
compromise data or gain unauthorised access with no other preconditions. Don't inflate
findings to seem thorough — one well-described High is more useful than five vague Lows.

## Report output

Save the full report to `security-audit.md` at the repo root, then print a short
inline summary to the chat.

### Full report structure

```
# Security Audit — <ISO date>

## Overall Score: X.X / 10  (Grade: X)

## Executive Summary
<2–3 sentences: overall posture, most important risk, what's already working well>

## Findings

### Critical  (CVSS 9.0–10.0)
### High      (CVSS 7.0–8.9)
### Medium    (CVSS 4.0–6.9)
### Low       (CVSS 0.1–3.9)
### Info

Each finding uses this template:

#### [SA-NNN] Title
- **Severity:** Critical / High / Medium / Low / Info (CVSS X.X)
- **Location:** `path/to/file.ts:line`
- **Description:** What the vulnerability is and why it matters
- **Impact:** What an attacker can do if they exploit this
- **Fix:**

(code block showing the concrete change)

Brief explanation of why this fix addresses the root cause.

---

## Dependency Audit

<pnpm audit summary: counts by severity, notable vulnerable packages>

## Recommendations Summary

Ordered by priority — the order a developer should work through them:
1. ...
2. ...
```

### Inline chat summary

After saving the file, print this to the chat:

```
Security audit complete. Score: X.X/10 (Grade: X)

Findings: X Critical, X High, X Medium, X Low, X Info
Dependency CVEs: X critical, X high, X moderate

Top issues to fix first:
1. [SA-NNN] Title — file:line
2. ...

Full report: security-audit.md
```

## Writing style for findings

- Be direct. If something is a real vulnerability, say so. Don't soften it.
- Acknowledge good practices briefly in the Executive Summary — it helps the reader understand what they can stop worrying about.
- Code fix examples should be minimal and real. Show the exact diff or the exact lines to change. Prefer real code over pseudocode.
- If a fix spans multiple files (e.g., add a sanitise helper and call it from two routes), show both sides.
- Each finding should stand alone — a developer should be able to read it, understand the problem, and apply the fix without re-reading the whole report.

## Notes on this codebase

Key entry points:
- Server middleware and routing: `packages/server/src/app.ts`
- File upload handling: `packages/server/src/runs/routes.ts`
- Auth implementation: `packages/server/src/auth/`
- DB schema: `packages/server/src/db/schema.ts`
- Nginx config: `packages/web/nginx.conf`
- Infrastructure secrets: `.env.example`, `docker-compose.yml`, `docker-compose.prod.yml`
