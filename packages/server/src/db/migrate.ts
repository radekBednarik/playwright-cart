import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString: url })
  const db = drizzle(pool)
  try {
    await migrate(db, { migrationsFolder: join(__dirname, 'migrations') })
    console.log('[playwright-cart/server] DB migrations applied')
  } finally {
    await pool.end()
  }
}
