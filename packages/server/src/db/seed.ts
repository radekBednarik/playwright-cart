import * as bcrypt from 'bcrypt'
import { db } from './client.js'
import { appSettings, users } from './schema.js'

export async function runSeed(): Promise<void> {
  try {
    // Bootstrap admin user if env vars are set
    const username = process.env.ADMIN_USERNAME
    const password = process.env.ADMIN_PASSWORD
    if (username && password) {
      const passwordHash = await bcrypt.hash(password, 12)
      const result = await db
        .insert(users)
        .values({ username, passwordHash, role: 'admin' })
        .onConflictDoNothing()
      if (result.rowCount && result.rowCount > 0) {
        console.log('[seed] created admin user')
      } else {
        console.log('[seed] admin user already exists — skipping')
      }
    } else {
      console.log('[seed] ADMIN_USERNAME/ADMIN_PASSWORD not set — skipping admin bootstrap')
    }

    // Seed default data_retention_days if not present
    const result = await db
      .insert(appSettings)
      .values({ key: 'data_retention_days', value: '90' })
      .onConflictDoNothing()
    if (result.rowCount && result.rowCount > 0) {
      console.log('[seed] seeded app_settings: data_retention_days=90')
    }
  } catch (err) {
    throw new Error(`[seed] fatal: ${err instanceof Error ? err.message : String(err)}`)
  }
}
