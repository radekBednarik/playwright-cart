import { sql } from 'drizzle-orm'
import { db } from './client.js'

/**
 * Truncate all application tables in dependency order.
 * Call in beforeEach to get a clean slate between tests.
 */
export async function resetDb(): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE runs RESTART IDENTITY CASCADE`,
  )
}
