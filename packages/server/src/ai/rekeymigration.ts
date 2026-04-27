import { createDecipheriv, createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { appSettings, llmProviderConfigs } from '../db/schema.js'
import { decrypt, encrypt } from './crypto.js'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16
const MIGRATION_FLAG = 'apikey_rekeyed_v1'

function deriveKeyLegacy(secret: string): Buffer {
  return createHash('sha256').update(secret).digest()
}

function decryptLegacy(ciphertext: string, secret: string): string {
  const key = deriveKeyLegacy(secret)
  const buf = Buffer.from(ciphertext, 'hex')
  const iv = buf.subarray(0, IV_BYTES)
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const encrypted = buf.subarray(IV_BYTES + TAG_BYTES)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export async function runRekeyMigration(secret: string): Promise<void> {
  const [flag] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, MIGRATION_FLAG))
    .limit(1)

  if (flag) return

  const rows = await db.select().from(llmProviderConfigs)

  await db.transaction(async (tx) => {
    for (const row of rows) {
      try {
        const plaintext = decryptLegacy(row.apiKey, secret)
        await tx
          .update(llmProviderConfigs)
          .set({ apiKey: encrypt(plaintext, secret) })
          .where(eq(llmProviderConfigs.provider, row.provider))
      } catch {
        // Row may already be HKDF-encrypted from a partial previous run — verify before deleting
        try {
          decrypt(row.apiKey, secret)
        } catch {
          console.error(
            `[rekey] Cannot decrypt provider "${row.provider}" with either key — deleting row`,
          )
          await tx.delete(llmProviderConfigs).where(eq(llmProviderConfigs.provider, row.provider))
        }
      }
    }
    await tx
      .insert(appSettings)
      .values({ key: MIGRATION_FLAG, value: 'done' })
      .onConflictDoNothing()
  })
}
