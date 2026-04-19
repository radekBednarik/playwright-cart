import { EventEmitter } from 'node:events'

export type RunEvent =
  | { type: 'run:created'; runId: string }
  | { type: 'run:updated'; runId: string }

export type SummaryEvent =
  | { type: 'summary_test_start'; runId: string; testId: string }
  | { type: 'summary_test_done'; runId: string; testId: string }
  | { type: 'summary_test_error'; runId: string; testId: string; error: string }
  | { type: 'summary_run_start'; runId: string }
  | { type: 'summary_run_done'; runId: string }
  | { type: 'summary_run_error'; runId: string; error: string }

export type AppEvent = RunEvent | SummaryEvent

class RunEventEmitter extends EventEmitter {}

export const runEmitter = new RunEventEmitter().setMaxListeners(0)
