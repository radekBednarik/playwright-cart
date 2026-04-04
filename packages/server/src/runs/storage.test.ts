import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { closeDb } from '../db/client.js'
import { runMigrations } from '../db/migrate.js'
import { resetDb } from '../db/test-utils.js'
import * as storage from './storage.js'

let testDir: string

beforeAll(async () => {
  await runMigrations()
})

beforeEach(async () => {
  testDir = join(tmpdir(), `pct-test-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  storage.storageConfig.dataDir = testDir
  await resetDb()
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
})

afterAll(async () => {
  await closeDb()
})

describe('createRun / getRun', () => {
  it('persists and retrieves a run record', async () => {
    const run: storage.RunRecord = {
      runId: 'my-project-123',
      project: 'my-project',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'running',
    }
    await storage.createRun(run)
    expect(await storage.getRun('my-project-123')).toEqual(run)
  })

  it('returns null for a missing run', async () => {
    expect(await storage.getRun('not-exist')).toBeNull()
  })
})

describe('updateRun', () => {
  it('merges partial updates into the existing record', async () => {
    await storage.createRun({
      runId: 'run-1',
      project: 'p',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'running',
    })
    await storage.updateRun('run-1', { status: 'passed', completedAt: '2026-04-02T10:01:00.000Z' })
    const run = await storage.getRun('run-1')
    expect(run?.status).toBe('passed')
    expect(run?.completedAt).toBe('2026-04-02T10:01:00.000Z')
    expect(run?.project).toBe('p')
  })
})

describe('listRuns', () => {
  it('returns an empty array when no runs exist', async () => {
    expect(await storage.listRuns()).toEqual([])
  })

  it('returns runs sorted by startedAt descending', async () => {
    await storage.createRun({
      runId: 'a',
      project: 'p',
      startedAt: '2026-04-02T09:00:00.000Z',
      status: 'running',
    })
    await storage.createRun({
      runId: 'b',
      project: 'p',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'running',
    })
    const runs = await storage.listRuns()
    expect(runs[0].runId).toBe('b')
    expect(runs[1].runId).toBe('a')
  })
})

describe('writeTestResult / getTestResults', () => {
  it('stores and retrieves test results including nested arrays', async () => {
    await storage.createRun({
      runId: 'run-1',
      project: 'p',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'running',
    })
    const test: storage.TestRecord = {
      testId: 'suite--my-test',
      title: 'my test',
      titlePath: ['suite', 'my test'],
      location: { file: 'test.spec.ts', line: 10, column: 1 },
      status: 'passed',
      duration: 500,
      errors: [],
      retry: 0,
      annotations: [],
      attachments: [],
    }
    await storage.writeTestResult('run-1', test)
    expect(await storage.getTestResults('run-1')).toEqual([test])
  })

  it('preserves errors, annotations, and attachments', async () => {
    await storage.createRun({
      runId: 'run-1',
      project: 'p',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'running',
    })
    const test: storage.TestRecord = {
      testId: 'failing-test',
      title: 'failing test',
      titlePath: ['suite', 'failing test'],
      location: { file: 'test.spec.ts', line: 20, column: 1 },
      status: 'failed',
      duration: 1000,
      errors: [{ message: 'Expected true to be false', stack: 'Error at line 20' }],
      retry: 1,
      annotations: [{ type: '@bug', description: 'known issue' }],
      attachments: [{ name: 'screenshot', contentType: 'image/png', filename: 'shot.png' }],
    }
    await storage.writeTestResult('run-1', test)
    const results = await storage.getTestResults('run-1')
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(test)
  })
})

describe('getTestResult', () => {
  it('returns null for a missing test', async () => {
    await storage.createRun({
      runId: 'run-1',
      project: 'p',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'running',
    })
    expect(await storage.getTestResult('run-1', 'no-such-test')).toBeNull()
  })

  it('returns the specific test by runId + testId', async () => {
    await storage.createRun({
      runId: 'run-1',
      project: 'p',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'running',
    })
    const test: storage.TestRecord = {
      testId: 'my-test',
      title: 'my test',
      titlePath: ['my test'],
      location: { file: 'a.spec.ts', line: 1, column: 1 },
      status: 'passed',
      duration: 100,
      errors: [],
      retry: 0,
      annotations: [],
      attachments: [],
    }
    await storage.writeTestResult('run-1', test)
    expect(await storage.getTestResult('run-1', 'my-test')).toEqual(test)
  })
})
