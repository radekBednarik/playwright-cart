import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import type { HonoEnv } from './types.js'
import { signToken, verifyPassword } from './utils.js'

export const authRouter = new Hono<HonoEnv>()

authRouter.post('/login', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>()

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await signToken({ userId: user.id })

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
    path: '/',
  })

  return c.json({ ok: true })
})

authRouter.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ ok: true })
})

authRouter.get('/me', (c) => {
  const authUser = c.get('authUser')
  if (authUser.type === 'apikey') {
    return c.json({ error: 'Forbidden' }, 403)
  }
  return c.json({
    id: authUser.id,
    username: authUser.username,
    role: authUser.role,
    theme: authUser.theme,
  })
})
