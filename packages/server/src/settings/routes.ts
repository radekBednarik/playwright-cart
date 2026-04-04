import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { adminMiddleware } from '../auth/middleware.js'
import type { HonoEnv } from '../auth/types.js'
import { db } from '../db/client.js'
import { appSettings } from '../db/schema.js'

export const settingsRouter = new Hono<HonoEnv>()

settingsRouter.get('/', async (c) => {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, 'data_retention_days'))
    .limit(1)

  const data_retention_days = row ? Number.parseInt(row.value, 10) : 30
  return c.json({ data_retention_days })
})

settingsRouter.patch('/', adminMiddleware, async (c) => {
  const body = await c.req.json<{ data_retention_days?: unknown }>()

  const days = body.data_retention_days
  if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 180) {
    return c.json({ error: 'data_retention_days must be an integer between 1 and 180' }, 400)
  }

  await db
    .update(appSettings)
    .set({ value: String(days) })
    .where(eq(appSettings.key, 'data_retention_days'))

  return c.json({ data_retention_days: days })
})
