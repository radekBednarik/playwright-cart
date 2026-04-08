# Settings Cache Sync on Save

**Date:** 2026-04-08
**Status:** Approved

## Context

When an admin changes the data retention value in Admin Settings, the "Expires In" values in the Runs table do not update until the user manually reloads the page. This is because `DataRetentionSection` in `SettingsPage.tsx` saves the new value via `updateSettings()` and updates its own local state, but never notifies the React Query cache (`['settings']`). The `useSettings()` hook used by `RunsPage` has a 5-minute `staleTime`, so it stays stale and `ExpiryChip` continues showing values calculated from the old retention period.

## Goal

Immediately reflect the new retention value in all `ExpiryChip` displays the moment the admin saves, with no page reload and no extra network request.

## Approach: setQueryData after save

After a successful `updateSettings()` call, write the returned `AppSettings` object directly into the React Query cache with `queryClient.setQueryData(['settings'], updated)`. React Query synchronously notifies all subscribers (`useSettings()` in `RunsPage`), which re-renders with the new `retentionDays` — flowing down to `RunsTable` → `ExpiryChip`.

This avoids a redundant GET request: the PATCH response already returns the authoritative new value.

## Change

**File:** `packages/web/src/pages/SettingsPage.tsx` — `DataRetentionSection` component

1. Import `useQueryClient` from `@tanstack/react-query` (already imported in the file, check if `useQueryClient` needs adding)
2. Call `const queryClient = useQueryClient()` inside the component
3. Add one line after the successful save:

```ts
const updated = await updateSettings({ data_retention_days: days })
queryClient.setQueryData(['settings'], updated)   // ← new
setDays(updated.data_retention_days)
setStatus('ok')
```

No other files change. The downstream data path is already correct.

## Verification

1. Open the Runs page — note current "Expires In" values
2. Navigate to Admin Settings and change data retention days
3. Save — without reloading, switch back to the Runs page
4. Confirm "Expires In" values have updated to reflect the new retention period immediately
