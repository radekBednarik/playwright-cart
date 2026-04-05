# Deployment Guide: Reporter Distribution + Hetzner Cloud + Coolify

> **Purpose:** Reference guide for distributing the `@playwright-cart/reporter` package via GitHub Packages, and for deploying the full playwright-cart stack (server + web + PostgreSQL + file storage) on Hetzner Cloud managed by Coolify.

---

## Part 1 — Distributing the Reporter Package

Two options are available. Choose based on your access model:

| | Option A: GitHub Packages | Option B: npm pack + Release Asset |
|---|---|---|
| Auth required to install | Yes — PAT with `read:packages` | No (public repos) |
| `.npmrc` config | Yes | No |
| Package name constraint | Must match GitHub username scope | Any name |
| Best for | Internal teams already using GitHub tokens | Zero-friction distribution |

---

### Option A: GitHub Packages (Private npm Registry)

GitHub Packages hosts a private npm registry scoped to your GitHub account. Consumers install the package exactly like any other npm package — no public npm registry involved.

### 1.A.1 Prepare the Reporter Package

**File:** `packages/reporter/package.json`

Make three changes:

1. Remove `"private": true` (this field blocks publishing entirely)
2. Add `publishConfig` to redirect publishing to GitHub Packages
3. Add a `repository` field — GitHub Packages requires it to link the package to the repo

> **Important:** The package `name` scope must match your GitHub username (all lowercase). For username `radekBednarik` the scope is `@radekbednarik`.

```json
{
  "name": "@radekbednarik/playwright-cart-reporter",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": {
    "type": "git",
    "url": "https://github.com/radekBednarik/playwright-cart.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "scripts": { "...": "unchanged" },
  "dependencies": { "...": "unchanged" },
  "devDependencies": { "...": "unchanged" }
}
```

### 1.A.2 Add `.npmrc` in the Reporter Package

**File:** `packages/reporter/.npmrc`

```ini
@radekbednarik:registry=https://npm.pkg.github.com
```

This tells pnpm/npm that all `@radekbednarik/` scoped packages resolve from GitHub Packages.

### 1.A.3 GitHub Actions Workflow for Automated Publishing

Create a workflow triggered on GitHub Release creation.

**File:** `.github/workflows/publish-reporter.yml`

```yaml
name: Publish Reporter to GitHub Packages

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@radekbednarik'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build reporter
        run: pnpm --filter @radekbednarik/playwright-cart-reporter build

      - name: Publish
        run: pnpm --filter @radekbednarik/playwright-cart-reporter publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`GITHUB_TOKEN` is provided automatically by GitHub Actions — no extra secrets needed. The `setup-node` action generates a temporary `.npmrc` with credentials scoped to the publish step.

### 1.A.4 Publishing Manually (First Time or Ad-hoc)

```bash
# Create a Personal Access Token (classic) at:
# GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# Required scopes: write:packages, read:packages

# Authenticate once
npm login --scope=@radekbednarik --auth-type=legacy --registry=https://npm.pkg.github.com
# Enter: GitHub username, PAT as password, your email

# Build then publish
pnpm --filter @radekbednarik/playwright-cart-reporter build
cd packages/reporter && pnpm publish --no-git-checks
```

### 1.A.5 Consumer Setup (e2e Test Project)

In the project consuming the reporter, add `.npmrc` at the project root:

**File:** `.npmrc`

```ini
@radekbednarik:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set `GITHUB_TOKEN` to a PAT with `read:packages` scope. In GitHub Actions this is available automatically as `${{ secrets.GITHUB_TOKEN }}`.

Install the package:

```bash
npm install @radekbednarik/playwright-cart-reporter
# or
pnpm add @radekbednarik/playwright-cart-reporter
```

Configure in `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: [
    ['html'],
    ['@radekbednarik/playwright-cart-reporter', {
      serverUrl: 'https://your-domain.example.com',
      project: 'my-app',
      branch: process.env.BRANCH,
      commitSha: process.env.COMMIT_SHA,
      apiKey: process.env.PLAYWRIGHT_CART_API_KEY,
    }],
  ],
})
```

---

### Option B: npm pack + GitHub Release Asset

This option produces a `.tgz` tarball using `npm pack` and uploads it as a binary asset attached to a GitHub Release. Consumers install directly from the download URL — no registry, no `.npmrc`, no authentication token needed (for public repos).

**How `npm pack` works:**
`npm pack` bundles the compiled package into a self-contained tarball. The `"private": true` flag in `package.json` does **not** block `npm pack` — it only blocks `npm publish` to a registry. No changes to `package.json` are required to use this option.

**Tarball filename convention:**
npm derives the filename from the package name by stripping the `@` and replacing `/` with `-`:

```
@playwright-cart/reporter  →  playwright-cart-reporter-0.1.0.tgz
```

### 1.B.1 (Recommended) Add a `files` Field to Trim the Tarball

Without a `files` field, `npm pack` includes source files, test files, TypeScript config, and Turbo cache artifacts. Add this to `packages/reporter/package.json` to ship only the compiled output:

```json
"files": ["dist"]
```

This is optional but strongly recommended — it keeps the tarball small and avoids shipping test code to consumers.

### 1.B.2 GitHub Actions Workflow for Automated Release

Create the following file. The workflow triggers whenever a GitHub Release is published, builds the reporter, packs it, and uploads the `.tgz` as a release asset.

**File:** `.github/workflows/release-reporter.yml`

```yaml
name: Release Reporter Tarball

on:
  release:
    types: [published]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write   # required to upload release assets

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build reporter
        run: pnpm --filter @playwright-cart/reporter build

      - name: Pack reporter
        id: pack
        working-directory: packages/reporter
        run: |
          FILENAME=$(npm pack --json | jq -r '.[0].filename')
          echo "filename=$FILENAME" >> "$GITHUB_OUTPUT"

      - name: Upload release asset
        uses: softprops/action-gh-release@v2
        with:
          files: packages/reporter/${{ steps.pack.outputs.filename }}
```

**Key notes:**
- `permissions: contents: write` is the only permission needed — no `packages: write` required.
- `GITHUB_TOKEN` is provided automatically by GitHub Actions — no extra secrets needed.
- `jq` is pre-installed on `ubuntu-latest` GitHub-hosted runners.
- `npm pack --json` outputs a JSON array; `.[0].filename` extracts the tarball name. This is necessary because npm derives the filename from the scoped package name using a non-obvious transformation, making it unsafe to hardcode.
- `softprops/action-gh-release@v2` discovers the release from `GITHUB_REF` automatically — the asset attaches to the correct release without extra configuration.

### 1.B.3 Publishing Manually (Ad-hoc)

```bash
# From the repo root — build the reporter
pnpm --filter @playwright-cart/reporter build

# Pack it (run from the reporter package directory)
cd packages/reporter
npm pack
# Produces: playwright-cart-reporter-0.1.0.tgz in the current directory

# Verify contents
tar -tzf playwright-cart-reporter-0.1.0.tgz

# Attach to an existing release using the GitHub CLI:
gh release upload <tag> playwright-cart-reporter-0.1.0.tgz
```

### 1.B.4 Consumer Setup (e2e Test Project)

No `.npmrc`, no registry configuration, and no authentication token are required.

**Install URL pattern:**

```
https://github.com/radekBednarik/playwright-cart/releases/download/<tag>/playwright-cart-reporter-<version>.tgz
```

Example for release tag `v0.1.0`:

```bash
npm install https://github.com/radekBednarik/playwright-cart/releases/download/v0.1.0/playwright-cart-reporter-0.1.0.tgz
# or with pnpm
pnpm add https://github.com/radekBednarik/playwright-cart/releases/download/v0.1.0/playwright-cart-reporter-0.1.0.tgz
```

**To pin to a specific release in `package.json`:**

```json
{
  "dependencies": {
    "@playwright-cart/reporter": "https://github.com/radekBednarik/playwright-cart/releases/download/v0.1.0/playwright-cart-reporter-0.1.0.tgz"
  }
}
```

The package installs under the name declared inside the tarball (`@playwright-cart/reporter`), regardless of the key used in `dependencies`.

**Configure in `playwright.config.ts`:**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: [
    ['html'],
    ['@playwright-cart/reporter', {
      serverUrl: 'https://your-domain.example.com',
      project: 'my-app',
      branch: process.env.BRANCH,
      commitSha: process.env.COMMIT_SHA,
      apiKey: process.env.PLAYWRIGHT_CART_API_KEY,
    }],
  ],
})
```

> **No `.npmrc` needed.** The package is installed from a direct URL, not a registry — npm/pnpm resolve it without any auth config. The `@playwright-cart/reporter` name in `playwright.config.ts` comes from the `name` field inside the tarball itself.

**Using the reporter in a GitHub Actions CI workflow (consumer side):**

```yaml
- name: Install dependencies
  run: npm install
  # No GITHUB_TOKEN or NODE_AUTH_TOKEN needed.
  # GitHub release assets on public repos are publicly accessible.
```

> **Note on repository visibility:** If the `playwright-cart` repository is **private**, release asset URLs are not publicly accessible. A GitHub token with `repo` scope is required, but no `.npmrc` registry config is needed — still simpler than Option A.

---

## Part 2 — Hetzner Cloud + Coolify Deployment

### Architecture

```
Hetzner CX22 (~€4/mo)
  ├── Ubuntu 24.04
  ├── Coolify (self-hosted PaaS, port 8000)
  │     └── manages: Docker Engine, Traefik proxy, SSL, deployments, env vars
  ├── Hetzner Volume (20 GB+ ext4, resizable up to 10 TB)
  │     ├── /mnt/data/db        → PostgreSQL data
  │     └── /mnt/data/reports   → screenshots, traces, HTML reports
  └── Application deployed from GitHub repo via Coolify
```

Coolify installs and manages Docker Engine and Traefik (its reverse proxy). It handles GitHub integration, automatic deployments on push, SSL via Let's Encrypt, and environment variable injection.

### 2.1 Create the Server in Hetzner Cloud Console

1. Go to [console.hetzner.cloud](https://console.hetzner.cloud) → **Create Server**
2. **Location:** Choose nearest to you/your users (e.g., `Falkenstein (fsn1)` or `Helsinki (hel1)`)
3. **Image:** Ubuntu 24.04
4. **Type:** `CX22` (2 vCPU, 4 GB RAM, 40 GB SSD root disk)
5. **SSH Keys:** Add your public SSH key
   ```bash
   # If you don't have a key: ssh-keygen -t ed25519 -C "your@email.com"
   cat ~/.ssh/id_ed25519.pub   # paste this into Hetzner
   ```
6. **Firewall:** Create a firewall with these inbound rules:

   | Rule | Protocol | Port | Notes |
   |------|----------|------|-------|
   | SSH | TCP | 22 | Optionally restrict to your IP |
   | HTTP | TCP | 80 | Needed for Let's Encrypt + app |
   | HTTPS | TCP | 443 | App traffic |
   | Coolify UI | TCP | 8000 | Can restrict to your IP |

7. **Volume:** Click **Add Volume** → size: `20 GB` → name: `playwright-cart-data` → **Format: ext4** (let Hetzner format it) → **Auto-mount** if offered
8. **Name:** `playwright-cart`
9. Click **Create & Buy**

### 2.2 Connect and Mount the Volume

```bash
# SSH into the server
ssh root@<server-ip>

# Find the volume device path (full scsi ID, e.g. scsi-0HC_Volume_12345678)
ls -la /dev/disk/by-id/ | grep HC_Volume

# Create mount point
mkdir -p /mnt/data

# Mount the volume (Hetzner formats it on creation if you chose ext4 + auto-mount)
mount -o discard,defaults /dev/disk/by-id/scsi-0HC_Volume_<ID> /mnt/data

# Persist mount across reboots
echo "/dev/disk/by-id/scsi-0HC_Volume_<ID> /mnt/data ext4 discard,nofail,defaults 0 0" >> /etc/fstab

# Create subdirectories for app data
mkdir -p /mnt/data/db /mnt/data/reports

# Verify
df -h /mnt/data
```

> Replace `<ID>` with the full numeric ID shown in the `ls` output. The `nofail` option prevents boot failure if the volume is temporarily detached.

### 2.3 Install Coolify

```bash
# Still on the server via SSH:
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

This installs Docker Engine, Docker Compose plugin, and Coolify itself (~1–3 min).

After it completes:

1. Open `http://<server-ip>:8000` in your browser **immediately**
2. Register your admin account on the first-visit screen
   > Do this right away — whoever registers first gets full control of the server
3. Log in with your new credentials

### 2.4 Connect GitHub to Coolify

In the Coolify UI:

1. **Settings → Source** → **Add a new Source** → **GitHub App**
2. Follow the OAuth flow to authorize Coolify to access your repositories
3. Install the GitHub App on your `playwright-cart` repository

This lets Coolify pull code and configure webhooks for automatic deployments on `git push`.

### 2.5 How Traefik + Nginx Port Conflict is Solved

Coolify runs **Traefik** as its reverse proxy — it owns ports `80` and `443` on the host. The `web` container runs Nginx on port `80` *inside the container*. A naive `ports: - "80:80"` binding would collide.

**The solution: remove all `ports:` from the production compose file.**

Traefik discovers services through Docker's internal network and routes to them by their *container-internal* port — no host port binding required. The routing is configured in the Coolify UI by assigning a domain to the `web` service. Coolify tells Traefik: "traffic for `your-domain.com` → route to the `web` container on its internal port `80`."

The `server` container never needs an external port either — the existing `nginx.conf` already proxies `/api`, `/api/events`, and `/reports` to `server:3001` within the shared Docker network.

```
Internet
    │ HTTPS (443)
    ▼
 Traefik  ◄── managed by Coolify, owns host ports 80 & 443
    │ internal Docker network, port 80
    ▼
  web (Nginx) ── /api/* ──────► server:3001
                └─ /api/events ─► server:3001 (SSE, no buffering)
                └─ /reports/* ──► server:3001
                └─ /* ──────────► static SPA files
```

### 2.6 The Production Docker Compose File

The file `docker-compose.prod.yml` at the repo root is ready to use. See [Part 3](#part-3--docker-composeprodymll-ready-to-use) for the full content.

Key differences from `docker-compose.yml`:

| Concern | `docker-compose.yml` (dev) | `docker-compose.prod.yml` (prod) |
|---------|--------------------------|----------------------------------|
| Ports | `server: 3001:3001`, `web: 80:80` | **None** — Traefik routes internally |
| Volumes | Named Docker volumes | Bind mounts to `/mnt/data/` |
| Env vars | Defaults / `.env` file | `${VAR}` from Coolify UI, no defaults for secrets |
| NODE_ENV | unset | `production` |

The two files are **independent** — not override/merge. Coolify is pointed at `docker-compose.prod.yml` directly.

### 2.7 Create the Application in Coolify

In the Coolify UI:

1. **Projects** → **New Project** → name: `playwright-cart`
2. Inside the project → **New Resource** → **Application**
3. **Source:** select your GitHub source → pick the `playwright-cart` repo
4. **Branch:** `main`
5. **Build Pack:** change from Nixpacks to **Docker Compose**
6. **Docker Compose Location:** `docker-compose.prod.yml`
7. **Base Directory:** `/`
8. Click **Save**

### 2.8 Configure Environment Variables in Coolify

In the application's **Environment Variables** tab, add:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | output of `openssl rand -hex 32` |
| `ADMIN_USERNAME` | `admin` (or preferred) |
| `ADMIN_PASSWORD` | a strong password |

Generate the JWT secret:
```bash
openssl rand -hex 32
```

These are injected at deploy time into the `${VAR}` placeholders in `docker-compose.prod.yml`.

### 2.9 Configure the Domain and SSL

In the Coolify application settings → **Domains** tab:

1. Add your domain (e.g., `playwright-cart.example.com`)
2. Point the domain to the `web` service on internal port `80`
3. Ensure your domain's DNS `A` record points to the Hetzner server IP
4. Coolify automatically provisions and renews Let's Encrypt SSL — no manual cert work needed

### 2.10 Deploy

Click **Deploy** in Coolify. It will:

1. Clone the repo from GitHub
2. Build Docker images using the Dockerfiles
3. Start containers with your injected environment variables
4. Apply bind mounts to `/mnt/data/db` and `/mnt/data/reports`
5. Configure Traefik routing for your domain

Subsequent deploys trigger automatically on every push to `main` via webhook, or manually from the Coolify UI.

### 2.11 Verify the Deployment

```bash
curl https://your-domain.example.com/api/health
# Expected: {"status":"ok"}
```

In Coolify UI: **Logs** tab shows real-time container output.

### 2.12 Resizing the Volume (When Storage Grows)

No downtime required:

1. Hetzner Console → **Volumes** → `playwright-cart-data` → **Resize** → pick new size → confirm
2. SSH into the server and expand the filesystem:
   ```bash
   resize2fs /dev/disk/by-id/scsi-0HC_Volume_<ID>
   df -h /mnt/data  # verify new size
   ```

---

## Part 3 — `docker-compose.prod.yml` (ready to use)

The file lives at `docker-compose.prod.yml` in the repo root. It is standalone — not an override of `docker-compose.yml`.

```yaml
# docker-compose.prod.yml
# Production deployment via Coolify on Hetzner Cloud.
#
# Key differences from docker-compose.yml (local dev):
#   - No `ports:` bindings — Coolify's Traefik proxy handles external access
#   - Volumes bind-mount to /mnt/data/ on the Hetzner Volume
#   - Secrets (JWT_SECRET, ADMIN_PASSWORD) come from Coolify UI, no insecure defaults
#   - NODE_ENV=production enables secure cookies in the server

services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: playwright_cart
      POSTGRES_PASSWORD: playwright_cart
      POSTGRES_DB: playwright_cart
    volumes:
      - /mnt/data/db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U playwright_cart"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    # No ports: — server is internal only.
    # Nginx in the web container proxies /api/* and /reports/* to server:3001
    # within the shared Docker network.
    volumes:
      - /mnt/data/reports:/app/data
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      PORT: "3001"
      NODE_ENV: production
      DATA_DIR: /app/data
      DATABASE_URL: postgresql://playwright_cart:playwright_cart@postgres:5432/playwright_cart
      ADMIN_USERNAME: "${ADMIN_USERNAME}"
      ADMIN_PASSWORD: "${ADMIN_PASSWORD}"
      JWT_SECRET: "${JWT_SECRET}"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: packages/web/Dockerfile
    # No ports: — Coolify's Traefik proxy routes your domain to this container
    # on its internal port 80. Configure the domain in the Coolify UI.
    depends_on:
      server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    restart: unless-stopped
```

---

## Summary Checklist

### Reporter — Option A: GitHub Packages
- [ ] Update `packages/reporter/package.json`: remove `"private": true`, rename to `@radekbednarik/playwright-cart-reporter`, add `publishConfig` + `repository`
- [ ] Create `packages/reporter/.npmrc`
- [ ] Create `.github/workflows/publish-reporter.yml`
- [ ] Push changes, create a GitHub Release → verify package appears under GitHub profile → Packages

### Reporter — Option B: npm pack + GitHub Release Asset
- [ ] (Recommended) Add `"files": ["dist"]` to `packages/reporter/package.json`
- [ ] Create `.github/workflows/release-reporter.yml`
- [ ] Create a GitHub Release → workflow runs automatically → verify `.tgz` appears in the release Assets section
- [ ] Test consumer install: `npm install https://github.com/radekBednarik/playwright-cart/releases/download/<tag>/playwright-cart-reporter-<version>.tgz`
- [ ] Configure `playwright.config.ts` with `'@playwright-cart/reporter'`

### Hetzner + Coolify (Server)
- [ ] Create Hetzner CX22 with Ubuntu 24.04 + SSH key + firewall (22, 80, 443, 8000) + Volume (20 GB, ext4)
- [ ] SSH in → mount volume to `/mnt/data` → add to `/etc/fstab` → `mkdir -p /mnt/data/db /mnt/data/reports`
- [ ] Install Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash`
- [ ] Visit `http://<ip>:8000` immediately → create admin account
- [ ] Connect GitHub (Settings → Source → GitHub App)
- [ ] Confirm `docker-compose.prod.yml` is committed to repo root
- [ ] In Coolify: New Project → New Application → GitHub source → Docker Compose → `docker-compose.prod.yml`
- [ ] Add env vars in Coolify UI: `JWT_SECRET` (openssl rand -hex 32), `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- [ ] Add domain in Coolify → point `web` service to internal port 80 → DNS A record → SSL auto-provisioned
- [ ] Click Deploy → verify `GET https://your-domain/api/health` returns 200

---

*Sources: [GitHub Packages npm docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry), [GitHub Actions: Publishing Node.js packages](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages), [softprops/action-gh-release](https://github.com/softprops/action-gh-release), [Coolify Installation](https://coolify.io/docs/get-started/installation), [Coolify Docker Compose](https://coolify.io/docs/applications/build-packs/docker-compose), [Coolify Traefik overview](https://coolify.io/docs/knowledge-base/proxy/traefik/overview), [Docker Compose multiple files](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/), [Hetzner Volume mounting](https://docs.hetzner.com/cloud/volumes/getting-started/creating-a-volume/)*
