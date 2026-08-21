/**
 * Pipeline Abort Mechanism -- Two-Layer Design
 *
 * Layer 1: File sentinel (touch .god-agent/abort-pipeline) -- triggered from Stream Deck
 * Layer 2: fs.watch + AbortController -- instant TCP connection severance
 *
 * The watcher monitors the DIRECTORY (.god-agent/), not the file directly.
 * Reasons:
 * 1. The sentinel file doesn't exist yet -- watching it throws ENOENT
 * 2. `touch` across Windows->WSL boundary replaces the inode, breaking file watchers
 */

import { existsSync, statSync, unlinkSync, watch, type FSWatcher } from 'fs';
import * as path from 'path';

const SENTINEL_FILE = 'abort-pipeline';
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export class PipelineAbortController {
  private controller: AbortController;
  private watcher: FSWatcher | null = null;
  private sentinelDir: string;
  private sentinelPath: string;
  private log: (msg: string) => void;

  constructor(godAgentDir: string, log?: (msg: string) => void) {
    this.controller = new AbortController();
    this.sentinelDir = path.join(godAgentDir, '.god-agent');
    this.sentinelPath = path.join(this.sentinelDir, SENTINEL_FILE);
    this.log = log || ((msg: string) => process.stderr.write(`[Abort] ${msg}\n`));
  }

  /**
   * Get the AbortSignal to pass to fetch() calls.
   * Compose with per-request timeout using AbortSignal.any():
   *   signal: AbortSignal.any([AbortSignal.timeout(timeoutMs), abort.signal])
   */
  get signal(): AbortSignal {
    return this.controller.signal;
  }

  /** Whether abort has been triggered */
  get aborted(): boolean {
    return this.controller.signal.aborted;
  }

  /**
   * Start watching for the abort sentinel file.
   * Call this at pipeline start. Cleans stale sentinels.
   */
  start(): void {
    // Clean stale sentinel (older than 5 minutes)
    if (existsSync(this.sentinelPath)) {
      try {
        const age = Date.now() - statSync(this.sentinelPath).mtimeMs;
        if (age > STALE_THRESHOLD_MS) {
          unlinkSync(this.sentinelPath);
          this.log(`Cleaned stale abort sentinel (${Math.round(age / 1000)}s old)`);
        } else {
          // Fresh sentinel exists -- abort immediately
          this.log('Active abort sentinel found -- aborting pipeline');
          this.controller.abort('Pre-existing abort sentinel');
          try { unlinkSync(this.sentinelPath); } catch { /* ok */ }
          return;
        }
      } catch { /* stat/unlink failed, proceed */ }
    }

    // Watch the DIRECTORY, not the file
    try {
      this.watcher = watch(this.sentinelDir, (eventType, filename) => {
        if (filename === SENTINEL_FILE && !this.controller.signal.aborted) {
          this.log('Abort signal received -- severing LLM connections');
          this.controller.abort('Triggered via Stream Deck sentinel');
          this.cleanup();
        }
      });

      // Prevent watcher from keeping the process alive
      this.watcher.unref();
    } catch (err) {
      // If .god-agent/ doesn't exist, watcher can't start -- that's OK
      this.log(`Warning: Could not watch ${this.sentinelDir}: ${err}`);
    }
  }

  /**
   * Check abort signal synchronously -- use between CPU-bound stages
   * where the event loop is blocked and fs.watch can't fire.
   * Throws if aborted.
   */
  checkSync(): void {
    if (this.controller.signal.aborted) {
      throw new PipelineAbortError('Pipeline aborted by user');
    }
    // Also check file directly (backup for blocked event loop)
    if (existsSync(this.sentinelPath)) {
      this.log('Abort sentinel detected (sync check)');
      this.controller.abort('Sentinel detected via sync check');
      this.cleanup();
      throw new PipelineAbortError('Pipeline aborted by user');
    }
  }

  /**
   * Clean up watcher and sentinel file. Call in finally block.
   */
  cleanup(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    try { unlinkSync(this.sentinelPath); } catch { /* already cleaned or doesn't exist */ }
  }

  /**
   * Stop watching without triggering abort. Call on normal pipeline completion.
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

/**
 * Custom error for pipeline abort -- distinguishable from crashes/timeouts.
 */
export class PipelineAbortError extends Error {
  constructor(message: string = 'Pipeline aborted by user') {
    super(message);
    this.name = 'PipelineAbortError';
  }
}
