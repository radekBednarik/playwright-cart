import { afterEach, describe, expect, it } from 'vitest'
import { app } from './app.js'
import { runEmitter } from './events.js'

afterEach(() => {
  runEmitter.removeAllListeners()
})

async function readNextChunk(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    if (text) return text
  }
  return ''
}

describe('GET /api/events', () => {
  it('responds with 200 and text/event-stream content type', async () => {
    const res = await app.request('/api/events')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/event-stream')
    await res.body?.cancel()
  })

  it('streams a run:created event to the client', async () => {
    const res = await app.request('/api/events')
    const reader = res.body!.getReader()

    const textPromise = readNextChunk(reader)

    setTimeout(() => {
      runEmitter.emit('event', { type: 'run:created', runId: 'run-42' })
    }, 10)

    const text = await textPromise

    expect(text).toContain('event: run:created')
    expect(text).toContain('"runId":"run-42"')

    await reader.cancel()
  })

  it('streams a run:updated event to the client', async () => {
    const res = await app.request('/api/events')
    const reader = res.body!.getReader()

    const textPromise = readNextChunk(reader)

    setTimeout(() => {
      runEmitter.emit('event', { type: 'run:updated', runId: 'run-99' })
    }, 10)

    const text = await textPromise

    expect(text).toContain('event: run:updated')
    expect(text).toContain('"runId":"run-99"')

    await reader.cancel()
  })
})
