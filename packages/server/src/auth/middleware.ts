import { eq } from 'drizzle-orm'
import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import { db } from '../db/client.js'
import { apiKeys, users } from '../db/schema.js'
import type { HonoEnv } from './types.js'
import { hashApiKey, verifyToken } from './utils.js'

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const token = getCookie(c, 'auth_token')

  if (token) {
    const result = await verifyToken(token)
    if (result) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, result.userId))
        .limit(1)
      if (user) {
        c.set('authUser', {
          type: 'user',
          id: user.id,
          username: user.username,
          role: user.role,
          theme: user.theme,
        })
        return next()
      }
    }
  }

  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7)
    const keyHash = hashApiKey(key)
    const [row] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1)
    if (row) {
      c.set('authUser', { type: 'apikey', keyId: row.id })
      return next()
    }
  }

  return c.json({ error: 'Unauthorized' }, 401)
}

export const adminMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authUser = c.get('authUser')
  if (authUser.type !== 'user' || authUser.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }
  return next()
}
