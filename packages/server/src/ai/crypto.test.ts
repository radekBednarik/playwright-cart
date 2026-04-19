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
