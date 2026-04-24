import { eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { encrypt } from '../ai/crypto.js'
import { listProviders } from '../ai/providers/index.js'
import { adminMiddleware } from '../auth/middleware.js'
import type { HonoEnv } from '../auth/types.js'
import { db } from '../db/client.js'
import { appSettings, llmProviderConfigs } from '../db/schema.js'
import { type AppEvent, runEmitter } from '../events.js'

export const settingsRouter = new Hono<HonoEnv>()

settingsRouter.get('/', async (c) => {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, 'data_retention_days'))
    .limit(1)

  const data_retention_days = row ? Number.parseInt(row.value, 10) : 90
  return c.json({ data_retention_days })
})

settingsRouter.patch('/', adminMiddleware, async (c) => {
  const body = await c.req.json<{ data_retention_days?: unknown }>()

  const days = body.data_retention_days
  if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 180) {
    return c.json({ error: 'data_retention_days must be an integer between 1 and 180' }, 400)
  }

  await db
    .insert(appSettings)
    .values({ key: 'data_retention_days', value: String(days) })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: String(days) } })

  return c.json({ data_retention_days: days })
})

settingsRouter.get('/llm', async (c) => {
  const settingsRows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, ['llm_enabled', 'llm_provider']))
  const map = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]))

  const configRows = await db.select().from(llmProviderConfigs)
  const configByProvider = Object.fromEntries(configRows.map((r) => [r.provider, r]))

  const activeProvider = map.llm_provider ?? 'anthropic'

  const providers = listProviders().map((p) => {
    const cfg = configByProvider[p.name]
    return {
      ...p,
      isConfigured: !!cfg,
      model: cfg?.model ?? p.models[0]?.id ?? '',
    }
  })

  return c.json({
    enabled: map.llm_enabled === 'true',
    provider: activeProvider,
    providers,
  })
})

settingsRouter.patch('/llm', adminMiddleware, async (c) => {
  const body = await c.req.json<{
    enabled?: boolean
    provider?: string
    model?: string
    apiKey?: string
  }>()

  const hasEnabled = typeof body.enabled === 'boolean'
  const hasProvider = typeof body.provider === 'string'
  const hasApiKey = typeof body.apiKey === 'string' && body.apiKey.length > 0
  const hasModel = typeof body.model === 'string' && body.model.length > 0

  if (!hasEnabled && !hasProvider && !hasApiKey && !hasModel) {
    return c.json({ error: 'No fields to update' }, 400)
  }
  if (hasApiKey && !hasProvider) {
    return c.json({ error: 'provider is required when updating apiKey' }, 400)
  }

  const jwtSecret = process.env.JWT_SECRET ?? ''
  const encryptedKey = hasApiKey ? encrypt(body.apiKey as string, jwtSecret) : null
  const targetProvider = hasProvider ? (body.provider as string) : null
  let enabledValue: boolean | null = null

  await db.transaction(async (tx) => {
    if (hasApiKey && targetProvider) {
      const model = hasModel ? (body.model as string) : null
      let resolvedModel = model
      if (!resolvedModel) {
        const [existing] = await tx
          .select({ model: llmProviderConfigs.model })
          .from(llmProviderConfigs)
          .where(eq(llmProviderConfigs.provider, targetProvider))
          .limit(1)
        resolvedModel = existing?.model ?? ''
      }
      await tx
        .insert(llmProviderConfigs)
        .values({ provider: targetProvider, apiKey: encryptedKey as string, model: resolvedModel })
        .onConflictDoUpdate({
          target: llmProviderConfigs.provider,
          set: { apiKey: encryptedKey as string, model: resolvedModel, updatedAt: new Date() },
        })
    } else if (hasModel && targetProvider) {
      await tx
        .update(llmProviderConfigs)
        .set({ model: body.model as string, updatedAt: new Date() })
        .where(eq(llmProviderConfigs.provider, targetProvider))
    }

    if (hasEnabled && body.enabled === true) {
      if (!hasApiKey) {
        const checkProvider =
          targetProvider ??
          (
            await tx
              .select({ value: appSettings.value })
              .from(appSettings)
              .where(eq(appSettings.key, 'llm_provider'))
              .limit(1)
          ).at(0)?.value
        if (!checkProvider)
          throw Object.assign(new Error('Cannot enable without a provider selected'), {
            status: 400,
          })
        const [existing] = await tx
          .select()
          .from(llmProviderConfigs)
          .where(eq(llmProviderConfigs.provider, checkProvider))
          .limit(1)
        if (!existing)
          throw Object.assign(new Error('Cannot enable without an API key configured'), {
            status: 400,
          })
      }
    }

    if (hasEnabled) {
      enabledValue = body.enabled as boolean
      await tx
        .insert(appSettings)
        .values({ key: 'llm_enabled', value: String(body.enabled) })
        .onConflictDoUpdate({ target: appSettings.key, set: { value: String(body.enabled) } })
    }
    if (hasProvider) {
      await tx
        .insert(appSettings)
        .values({ key: 'llm_provider', value: body.provider as string })
        .onConflictDoUpdate({ target: appSettings.key, set: { value: body.provider as string } })
    }
  })

  if (enabledValue !== null) {
    runEmitter.emit('event', {
      type: 'settings:llm_updated',
      enabled: enabledValue,
    } satisfies AppEvent)
  }

  return c.json({ ok: true })
})
