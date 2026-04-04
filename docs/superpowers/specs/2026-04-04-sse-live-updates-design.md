# SSE Live Updates Design

**Date:** 2026-04-04  
**Status:** Approved

## Problem

The web dashboard requires a manual page refresh to see new test runs. The runs list uses a 30-second stale time with no polling, so new runs from a CI pipeline or other clients are invisible until the user acts. The run detail page polls every 5 seconds while a run is active, but this is wasteful and doesn't scale.

## Goal

Push updates to connected clients in real time so:
- New runs appear in the runs list automatically
- Run status and test results update on the detail page without polling

## Approach: SSE with in-memory event emitter

A typed Node.js `EventEmitter` singleton acts as an internal broadcast bus. Route handlers emit events on it when runs are mutated. A Hono `streamSSE` endpoint streams those events to all connected clients. The frontend holds one persistent `EventSource` connection per session and invalidates React Query cache when events arrive.

## Event Types

```ts
type RunEvent =
  | { type: 'run:created'; runId: string }
  | { type: 'run:updated'; runId: string }
```

## Server Changes

### New file: `packages/server/src/events.ts`

Exports a singleton `runEmitter: EventEmitter` and the `RunEvent` type. Routes and the SSE endpoint both import from here.

### Modified: `packages/server/src/runs/routes.ts`

Emit events at four mutation points:

| Route | Event |
|---|---|
| `POST /api/runs` | `run:created` |
| `POST /api/runs/:runId/tests` | `run:updated` |
| `POST /api/runs/:runId/complete` | `run:updated` |
| `POST /api/runs/:runId/report` | `run:updated` |

### Modified: `packages/server/src/index.ts`

Add SSE route using Hono's `streamSSE` from `hono/streaming`:

```ts
app.get('/api/events', (c) =>
  streamSSE(c, async (stream) => {
    const send = (e: RunEvent) =>
      stream.writeSSE({ event: e.type, data: JSON.stringify(e) })
    runEmitter.on('event', send)
    stream.onAbort(() => runEmitter.off('event', send))
    await stream.sleep(Infinity)
  })
)
```

The existing `app.use('/api/*', cors())` middleware already covers this endpoint.

## Frontend Changes

### New file: `packages/web/src/hooks/useServerEvents.ts`

Creates one `EventSource('/api/events')` per session. On events:

- `run:created` → `queryClient.invalidateQueries({ queryKey: ['runs'] })`
- `run:updated` → invalidate `['run', runId]` + `['runs']`
- `open` (reconnect) → invalidate `['runs']` to catch any missed events

Cleanup: `es.close()` on unmount.

### Modified: `packages/web/src/components/Layout.tsx`

Call `useServerEvents()` here — it wraps all routes so the connection is established once for the whole session.

### Modified: `packages/web/src/hooks/useRun.ts`

Remove `refetchInterval`. SSE events now trigger refetches when a run changes.

### No change: `packages/web/src/hooks/useRuns.ts`

`staleTime: 30_000` remains as a reasonable cache hint for initial page load.

## Production: nginx

SSE requires response buffering to be disabled. Add a dedicated location block **before** the generic `/api/` block (nginx uses longest-prefix matching so `/api/events` wins, but explicit ordering is clearer):

```nginx
location /api/events {
  proxy_pass http://server:3001;
  proxy_http_version 1.1;
  proxy_set_header Connection '';
  proxy_buffering off;
  proxy_cache off;
}
```

File: `packages/web/nginx.conf`

## Dev Proxy

No changes to `packages/web/vite.config.ts`. Vite's `http-proxy` forwards long-lived SSE connections transparently with the existing `changeOrigin: true` setting.

## Error Handling

- `EventSource` reconnects automatically on connection drop (browser native behaviour)
- On reconnect, the `open` event fires and invalidates `['runs']` to catch any missed events
- No server-side event persistence needed — missed events during a dropped connection are recovered via a fresh fetch on reconnect

## Testing

1. Start full stack: `pnpm dev`
2. Open the dashboard at `http://localhost:5173`
3. In a separate terminal, post a new run to the server:
   ```sh
   curl -X POST http://localhost:3001/api/runs \
     -H 'Content-Type: application/json' \
     -d '{"project":"demo","startedAt":"2026-04-04T10:00:00Z"}'
   ```
4. Verify the new run appears in the dashboard **without** a manual refresh
5. Post a complete event to the same runId and verify the status updates on the detail page
6. Run unit tests: `pnpm --filter @playwright-cart/server test`
