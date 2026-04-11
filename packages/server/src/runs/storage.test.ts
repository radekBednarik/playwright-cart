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
  it('returns empty result when no runs exist', async () => {
    const result = await storage.listRuns({ page: 1, pageSize: 10 })
    expect(result).toEqual({ runs: [], total: 0, totalPassed: 0, totalFailed: 0 })
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
    const result = await storage.listRuns({ page: 1, pageSize: 10 })
    expect(result.runs[0].runId).toBe('b')
    expect(result.runs[1].runId).toBe('a')
  })

  it('respects pageSize and page offset', async () => {
    for (let i = 0; i < 5; i++) {
      await storage.createRun({
        runId: `run-${i}`,
        project: 'p',
        startedAt: new Date(Date.now() + i * 1000).toISOString(),
        status: 'passed',
      })
    }
    const page1 = await storage.listRuns({ page: 1, pageSize: 3 })
    const page2 = await storage.listRuns({ page: 2, pageSize: 3 })
    expect(page1.runs).toHaveLength(3)
    expect(page1.total).toBe(5)
    expect(page2.runs).toHaveLength(2)
  })

  it('filters by project', async () => {
    await storage.createRun({
      runId: 'r1',
      project: 'alpha',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'passed',
    })
    await storage.createRun({
      runId: 'r2',
      project: 'beta',
      startedAt: '2026-04-02T11:00:00.000Z',
      status: 'failed',
    })
    const result = await storage.listRuns({ page: 1, pageSize: 10, project: 'alpha' })
    expect(result.runs).toHaveLength(1)
    expect(result.runs[0].runId).toBe('r1')
    expect(result.total).toBe(1)
  })

  it('filters by status', async () => {
    await storage.createRun({
      runId: 'r1',
      project: 'p',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'passed',
    })
    await storage.createRun({
      runId: 'r2',
      project: 'p',
      startedAt: '2026-04-02T11:00:00.000Z',
      status: 'failed',
    })
    const result = await storage.listRuns({ page: 1, pageSize: 10, status: 'failed' })
    expect(result.runs).toHaveLength(1)
    expect(result.runs[0].runId).toBe('r2')
  })

  it('returns aggregate stats scoped to the active filter', async () => {
    await storage.createRun({
      runId: 'r1',
      project: 'alpha',
      startedAt: '2026-04-02T09:00:00.000Z',
      status: 'passed',
    })
    await storage.createRun({
      runId: 'r2',
      project: 'alpha',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'failed',
    })
    await storage.createRun({
      runId: 'r3',
      project: 'beta',
      startedAt: '2026-04-02T11:00:00.000Z',
      status: 'passed',
    })
    const result = await storage.listRuns({ page: 1, pageSize: 10, project: 'alpha' })
    expect(result.total).toBe(2)
    expect(result.totalPassed).toBe(1)
    expect(result.totalFailed).toBe(1)
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
