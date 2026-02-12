#!/usr/bin/env npx tsx
/**
 * UCM Daemon CLI - Start/Stop the Universal Context Management daemon server
 *
 * PRD: PRD-GOD-AGENT-001
 * Task: TASK-UCM-DAEMON-CLI
 *
 * Usage:
 *   npx tsx src/god-agent/core/ucm/daemon/ucm-cli.ts start
 *   npx tsx src/god-agent/core/ucm/daemon/ucm-cli.ts stop
 *   npx tsx src/god-agent/core/ucm/daemon/ucm-cli.ts status
 *
 * @module src/god-agent/core/ucm/daemon/ucm-cli
 */

import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import * as net from 'net';
import { DaemonServer } from './daemon-server.js';
import { DEFAULT_UCM_CONFIG } from '../config.js';
import { createServiceLogger } from '../../observability/logger.js';

const PID_FILE = '/tmp/godagent-ucm.pid';
const SOCKET_PATH = DEFAULT_UCM_CONFIG.daemon.socketPath;

// Enable daemon logging mode
process.env.GOD_DAEMON_MODE = 'true';

// Service logger for UCM daemon
const log = createServiceLogger('ucm-cli');

async function startDaemon(): Promise<void> {
  log.info('Starting UCM daemon...');

  // Check if already running
  if (existsSync(PID_FILE)) {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
    try {
      process.kill(pid, 0); // Check if process exists
      log.warn('UCM daemon already running', { pid });
      return;
    } catch {
      // INTENTIONAL: Process not running, clean up stale PID file
      unlinkSync(PID_FILE);
    }
  }

  // Clean up stale socket if exists
  if (existsSync(SOCKET_PATH)) {
    unlinkSync(SOCKET_PATH);
  }

  // Create and start daemon server
  const server = new DaemonServer();

  // Start the server
  await server.start();

  // Write PID file
  writeFileSync(PID_FILE, process.pid.toString());

  log.info('UCM daemon started', {
    socketPath: SOCKET_PATH,
    pid: process.pid,
    services: ['health', 'desc', 'context', 'recovery'],
  });

  // Handle shutdown
  const shutdown = async () => {
    log.info('Shutting down...');
    await server.stop();
    if (existsSync(PID_FILE)) {
      unlinkSync(PID_FILE);
    }
    log.info('UCM daemon stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Neutralize tsx's internal ESM loader handles to prevent CPU spin.
  // tsx creates IPC pipes for module resolution that stay active in processes
  // with large module trees, causing libuv to poll them at 100% CPU.
  process.stdin.pause();
  if (typeof process.stdin.unref === 'function') {
    process.stdin.unref();
  }
  const activeHandles = (process as any)._getActiveHandles?.();
  if (Array.isArray(activeHandles)) {
    for (const handle of activeHandles) {
      if (handle instanceof net.Server) continue; // Keep daemon socket alive
      if (typeof handle.unref === 'function') {
        handle.unref();
      }
    }
  }

  // Keep process alive
  await new Promise(() => {}); // Never resolves
}

async function stopDaemon(): Promise<void> {
  if (!existsSync(PID_FILE)) {
    log.info('UCM daemon not running');
    return;
  }

  const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);

  try {
    process.kill(pid, 'SIGTERM');
    log.info('Sent SIGTERM to UCM daemon', { pid });

    // Wait for process to exit
    let attempts = 0;
    while (attempts < 10) {
      try {
        process.kill(pid, 0);
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      } catch {
        // INTENTIONAL: Process exited - break loop to continue cleanup
        break;
      }
    }

    // Clean up
    if (existsSync(PID_FILE)) {
      unlinkSync(PID_FILE);
    }
    if (existsSync(SOCKET_PATH)) {
      unlinkSync(SOCKET_PATH);
    }

    log.info('UCM daemon stopped');
  } catch (error) {
    log.error('Failed to stop UCM daemon', error);
    // Clean up anyway
    if (existsSync(PID_FILE)) {
      unlinkSync(PID_FILE);
    }
  }
}

function statusDaemon(): void {
  console.log('\n=== UCM Daemon Status ===\n');

  // Check PID file
  if (existsSync(PID_FILE)) {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
    console.log(`PID File: exists`);
    console.log(`  PID: ${pid}`);

    try {
      process.kill(pid, 0);
      console.log(`  Process: RUNNING`);
    } catch {
      // INTENTIONAL: Process not found - stale PID file detected
      console.log(`  Process: NOT RUNNING (stale PID file)`);
    }
  } else {
    console.log('PID File: not found');
  }

  // Check socket
  console.log(`\nSocket: ${SOCKET_PATH}`);
  if (existsSync(SOCKET_PATH)) {
    console.log('  Status: EXISTS');
  } else {
    console.log('  Status: NOT FOUND');
  }

  console.log('');
}

// Main
const command = process.argv[2];

switch (command) {
  case 'start':
    startDaemon().catch((error) => {
      log.fatal('Failed to start', error);
      process.exit(1);
    });
    break;
  case 'stop':
    stopDaemon().catch((error) => {
      log.fatal('Failed to stop', error);
      process.exit(1);
    });
    break;
  case 'status':
    statusDaemon();
    break;
  default:
    log.error('Invalid command', undefined, { usage: 'ucm-cli.ts <start|stop|status>' });
    process.exit(1);
}
