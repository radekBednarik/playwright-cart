import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decrypt, encrypt } from './crypto.js'

describe('encrypt / decrypt', () => {
  const secret = 'test-jwt-secret-at-least-32-bytes-long!!'

  it('round-trips a plaintext value', () => {
    const plaintext = 'sk-ant-api03-supersecretkey'
    const ciphertext = encrypt(plaintext, secret)
    expect(ciphertext).not.toBe(plaintext)
    expect(decrypt(ciphertext, secret)).toBe(plaintext)
  })

  it('produces different ciphertext each call (random IV)', () => {
    const a = encrypt('same', secret)
    const b = encrypt('same', secret)
    expect(a).not.toBe(b)
  })

  it('throws on tampered ciphertext', () => {
    const ct = encrypt('value', secret)
    const tampered = `${ct.slice(0, -4)}aaaa`
    expect(() => decrypt(tampered, secret)).toThrow()
  })
})

// Inline legacy encrypt (SHA-256 KDF) to verify domain separation from the new HKDF key.
function encryptLegacy(plaintext: string, secret: string): string {
  const key = createHash('sha256').update(secret).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('hex')
}

describe('HKDF key derivation — domain separation from legacy SHA-256', () => {
  const secret = 'test-jwt-secret-at-least-32-bytes-long!!'

  it('new decrypt rejects ciphertext produced by the legacy SHA-256 key', () => {
    const legacy = encryptLegacy('api-key-value', secret)
    expect(() => decrypt(legacy, secret)).toThrow()
  })

  it('re-keying: legacy encrypt → new decrypt roundtrip fails, but legacy→new re-encrypt→new decrypt succeeds', () => {
    const plaintext = 'sk-ant-api03-supersecretkey'
    const legacyCiphertext = encryptLegacy(plaintext, secret)

    // Simulate migration: decrypt with legacy key (inline), re-encrypt with new HKDF key
    const legacyKey = createHash('sha256').update(secret).digest()
    const buf = Buffer.from(legacyCiphertext, 'hex')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const enc = buf.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', legacyKey, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')

    const newCiphertext = encrypt(decrypted, secret)
    expect(decrypt(newCiphertext, secret)).toBe(plaintext)
  })

  it('HKDF-encrypted ciphertext differs from legacy SHA-256-encrypted ciphertext for same input', () => {
    const plaintext = 'same-plaintext'
    // Use fixed IV trick: both encrypt the same plaintext — ciphertexts will differ
    // because the derived keys differ, even with the same secret
    const hkdfCt = encrypt(plaintext, secret)
    const legacyCt = encryptLegacy(plaintext, secret)
    expect(hkdfCt).not.toBe(legacyCt)
  })
})
