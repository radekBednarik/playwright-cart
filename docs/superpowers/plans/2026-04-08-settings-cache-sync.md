# Settings Cache Sync on Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an admin saves a new data retention value, the "Expires In" column in the Runs table updates immediately without a page reload.

**Architecture:** After a successful `updateSettings()` call in `DataRetentionSection`, write the returned `AppSettings` object directly into the React Query cache via `queryClient.setQueryData(['settings'], updated)`. All subscribers to `useSettings()` (currently `RunsPage`) re-render synchronously with the new value, flowing down to `RunsTable` → `ExpiryChip`.

**Tech Stack:** React 19, TanStack React Query v5, TypeScript

---

### Task 1: Wire `useQueryClient` into `DataRetentionSection` and sync cache on save

**Files:**
- Modify: `packages/web/src/pages/SettingsPage.tsx:658-685` (`DataRetentionSection` component)

`useQueryClient` is already imported at line 1 of this file. The only changes are inside `DataRetentionSection`.

- [ ] **Step 1: Add `queryClient` to `DataRetentionSection`**

Open `packages/web/src/pages/SettingsPage.tsx`. Find `DataRetentionSection` (line 658). Add `const queryClient = useQueryClient()` as the first line of the function body:

```ts
function DataRetentionSection() {
  const queryClient = useQueryClient()           // ← add this line
  const [days, setDays] = useState<number>(30)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')
  const [errMsg, setErrMsg] = useState('')
```

- [ ] **Step 2: Call `setQueryData` after successful save**

In the same file, find `handleSubmit` inside `DataRetentionSection` (around line 675). Add `queryClient.setQueryData` call immediately after `updateSettings` resolves, before updating local state:

```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setStatus('saving')
  setErrMsg('')
  try {
    const updated = await updateSettings({ data_retention_days: days })
    queryClient.setQueryData(['settings'], updated)   // ← add this line
    setDays(updated.data_retention_days)
    setStatus('ok')
  } catch (err) {
    setErrMsg(err instanceof Error ? err.message : 'Failed to save settings')
    setStatus('err')
  }
}
```

- [ ] **Step 3: Verify type-check passes**

```bash
pnpm --filter @playwright-cart/web typecheck
```

Expected: no errors.

- [ ] **Step 4: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 5: Manual smoke test**

1. Run `pnpm dev` (or ensure the dev stack is running)
2. Open the app, navigate to the Runs page — note the current "Expires In" values
3. Navigate to Admin Settings → Data Retention — change the number of days and save
4. Navigate back to Runs page (or stay if already open in another tab)
5. Confirm "Expires In" values reflect the new retention period immediately, without a page reload

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/pages/SettingsPage.tsx
git commit -m "fix: sync settings cache on save so ExpiryChip updates immediately"
```
