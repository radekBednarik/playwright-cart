import { afterEach, describe, expect, it, vi } from 'vitest'
import { type RunEvent, runEmitter } from './events.js'

afterEach(() => {
  runEmitter.removeAllListeners()
})

describe('runEmitter', () => {
  it('delivers run:created events to listeners', () => {
    const handler = vi.fn()
    runEmitter.on('event', handler)
    const event: RunEvent = { type: 'run:created', runId: 'run-1' }
    runEmitter.emit('event', event)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('delivers run:updated events to listeners', () => {
    const handler = vi.fn()
    runEmitter.on('event', handler)
    const event: RunEvent = { type: 'run:updated', runId: 'run-2' }
    runEmitter.emit('event', event)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('does not deliver events to removed listeners', () => {
    const handler = vi.fn()
    runEmitter.on('event', handler)
    runEmitter.off('event', handler)
    runEmitter.emit('event', { type: 'run:created', runId: 'run-3' })
    expect(handler).not.toHaveBeenCalled()
  })
})
