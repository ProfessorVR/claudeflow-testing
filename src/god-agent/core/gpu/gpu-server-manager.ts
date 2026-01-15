/**
 * GPU Server Manager
 *
 * Manages GPU resources by switching between:
 * 1. vLLM AWQ Model (Qwen2.5-Coder-32B-Instruct-AWQ) - for code generation
 * 2. Embedding Server (gte-Qwen2-1.5B-instruct) - for document ingestion
 *
 * Since both services require GPU memory and can't run simultaneously on 32GB VRAM,
 * this manager handles the switching logic:
 * - Default: AWQ model running for code generation
 * - During ingest: Switch to embedding server
 * - After ingest: Switch back to AWQ model
 */

import { spawn, execSync, ChildProcess } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createServiceLogger } from '../observability/logger.js';

const log = createServiceLogger('gpu-server-manager');

// ==================== Types ====================

export type ServerMode = 'awq' | 'embedding' | 'none';

export interface GPUServerConfig {
  /** vLLM base URL (default: http://localhost:8002) */
  vllmBaseUrl?: string;
  /** vLLM port (default: 8002) */
  vllmPort?: number;
  /** Embedding API port (default: 8000) */
  embeddingPort?: number;
  /** ChromaDB port (default: 8001) */
  chromaPort?: number;
  /** Project root directory */
  projectRoot?: string;
  /** AWQ model ID */
  awqModel?: string;
  /** GPU memory utilization for AWQ (default: 0.85) */
  gpuMemoryUtilization?: number;
  /** Max model length for AWQ (default: 16384) */
  maxModelLen?: number;
  /** Health check timeout in ms (default: 5000) */
  healthCheckTimeout?: number;
  /** Server startup timeout in ms (default: 120000) */
  startupTimeout?: number;
}

export interface ServerStatus {
  mode: ServerMode;
  awq: {
    running: boolean;
    port: number;
    model?: string;
    gpuMemoryUsed?: number;
  };
  embedding: {
    running: boolean;
    port: number;
    chromaRunning: boolean;
    chromaPort: number;
  };
}

// ==================== GPU Server Manager ====================

/**
 * Singleton manager for GPU server switching
 */
export class GPUServerManager {
  private static instance: GPUServerManager | null = null;

  private readonly config: Required<GPUServerConfig>;
  private currentMode: ServerMode = 'none';
  private awqProcess: ChildProcess | null = null;
  private stateFile: string;

  private constructor(config: GPUServerConfig = {}) {
    const projectRoot = config.projectRoot ?? process.cwd();

    this.config = {
      vllmBaseUrl: config.vllmBaseUrl ?? 'http://localhost:8002',
      vllmPort: config.vllmPort ?? 8002,
      embeddingPort: config.embeddingPort ?? 8000,
      chromaPort: config.chromaPort ?? 8001,
      projectRoot,
      awqModel: config.awqModel ?? 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
      gpuMemoryUtilization: config.gpuMemoryUtilization ?? 0.85,
      maxModelLen: config.maxModelLen ?? 16384,
      healthCheckTimeout: config.healthCheckTimeout ?? 5000,
      startupTimeout: config.startupTimeout ?? 120000,
    };

    // State file to persist current mode across restarts
    const runDir = join(projectRoot, '.run');
    if (!existsSync(runDir)) {
      mkdirSync(runDir, { recursive: true });
    }
    this.stateFile = join(runDir, 'gpu-server-mode.json');

    // Load persisted state
    this.loadState();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: GPUServerConfig): GPUServerManager {
    if (!GPUServerManager.instance) {
      GPUServerManager.instance = new GPUServerManager(config);
    }
    return GPUServerManager.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static reset(): void {
    GPUServerManager.instance = null;
  }

  // ==================== State Management ====================

  private loadState(): void {
    try {
      if (existsSync(this.stateFile)) {
        const data = JSON.parse(readFileSync(this.stateFile, 'utf-8'));
        this.currentMode = data.mode ?? 'none';
        log.info('Loaded GPU server state', { mode: this.currentMode });
      }
    } catch (error) {
      log.warn('Failed to load GPU server state', { error });
      this.currentMode = 'none';
    }
  }

  private saveState(): void {
    try {
      writeFileSync(this.stateFile, JSON.stringify({
        mode: this.currentMode,
        timestamp: new Date().toISOString(),
      }, null, 2));
    } catch (error) {
      log.warn('Failed to save GPU server state', { error });
    }
  }

  // ==================== Health Checks ====================

  /**
   * Check if vLLM AWQ server is running
   */
  async isAwqRunning(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheckTimeout);

      const response = await fetch(`${this.config.vllmBaseUrl}/v1/models`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if embedding API server is running
   */
  async isEmbeddingRunning(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheckTimeout);

      const response = await fetch(`http://localhost:${this.config.embeddingPort}/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if ChromaDB is running
   */
  async isChromaRunning(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheckTimeout);

      const response = await fetch(`http://localhost:${this.config.chromaPort}/api/v1/heartbeat`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get comprehensive server status
   */
  async getStatus(): Promise<ServerStatus> {
    const [awqRunning, embeddingRunning, chromaRunning] = await Promise.all([
      this.isAwqRunning(),
      this.isEmbeddingRunning(),
      this.isChromaRunning(),
    ]);

    // Detect actual mode from running services
    let detectedMode: ServerMode = 'none';
    if (awqRunning && !embeddingRunning) {
      detectedMode = 'awq';
    } else if (embeddingRunning && !awqRunning) {
      detectedMode = 'embedding';
    }

    // Update current mode if it differs
    if (detectedMode !== 'none' && detectedMode !== this.currentMode) {
      this.currentMode = detectedMode;
      this.saveState();
    }

    return {
      mode: this.currentMode,
      awq: {
        running: awqRunning,
        port: this.config.vllmPort,
        model: awqRunning ? this.config.awqModel : undefined,
      },
      embedding: {
        running: embeddingRunning,
        port: this.config.embeddingPort,
        chromaRunning,
        chromaPort: this.config.chromaPort,
      },
    };
  }

  // ==================== Server Control ====================

  /**
   * Stop vLLM AWQ server
   */
  async stopAwq(): Promise<void> {
    log.info('Stopping vLLM AWQ server...');

    try {
      // Kill any existing vLLM processes
      execSync('pkill -f "vllm serve" 2>/dev/null || true', { stdio: 'ignore' });

      // Wait for process to terminate
      await this.waitForServerDown(this.config.vllmPort, 10000);

      this.awqProcess = null;
      log.info('vLLM AWQ server stopped');
    } catch (error) {
      log.warn('Error stopping vLLM AWQ server', { error });
    }
  }

  /**
   * Start vLLM AWQ server
   */
  async startAwq(): Promise<boolean> {
    log.info('Starting vLLM AWQ server...', { model: this.config.awqModel });

    // Set environment variables
    const env = {
      ...process.env,
      PYTORCH_ALLOC_CONF: 'expandable_segments:True',
      NCCL_CUMEM_ENABLE: '0',
    };

    // Build command
    const args = [
      'serve',
      this.config.awqModel,
      '--port', String(this.config.vllmPort),
      '--quantization', 'awq',
      '--enforce-eager',
      '--gpu-memory-utilization', String(this.config.gpuMemoryUtilization),
      '--max-model-len', String(this.config.maxModelLen),
    ];

    // Start vLLM in background
    this.awqProcess = spawn('vllm', args, {
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Don't let the parent wait for this process
    this.awqProcess.unref();

    // Log output for debugging
    this.awqProcess.stdout?.on('data', (data) => {
      log.debug('vLLM stdout', { data: data.toString().trim() });
    });

    this.awqProcess.stderr?.on('data', (data) => {
      log.debug('vLLM stderr', { data: data.toString().trim() });
    });

    // Wait for server to be ready
    const ready = await this.waitForServerUp(
      `${this.config.vllmBaseUrl}/v1/models`,
      this.config.startupTimeout
    );

    if (ready) {
      this.currentMode = 'awq';
      this.saveState();
      log.info('vLLM AWQ server started successfully');
    } else {
      log.error('vLLM AWQ server failed to start within timeout');
    }

    return ready;
  }

  /**
   * Stop embedding server (and ChromaDB)
   */
  async stopEmbedding(): Promise<void> {
    log.info('Stopping embedding server...');

    const script = join(this.config.projectRoot, 'embedding-api', 'api-embed.sh');

    if (existsSync(script)) {
      try {
        execSync(`bash "${script}" stop`, {
          stdio: 'inherit',
          cwd: this.config.projectRoot,
        });
        log.info('Embedding server stopped via script');
      } catch (error) {
        log.warn('Error stopping embedding server via script', { error });
        // Fallback: kill processes directly
        execSync('pkill -f "api_embedder.py" 2>/dev/null || true', { stdio: 'ignore' });
        execSync('pkill -f "chroma run" 2>/dev/null || true', { stdio: 'ignore' });
      }
    } else {
      // Fallback: kill processes directly
      execSync('pkill -f "api_embedder.py" 2>/dev/null || true', { stdio: 'ignore' });
      execSync('pkill -f "chroma run" 2>/dev/null || true', { stdio: 'ignore' });
    }

    // Wait for processes to terminate
    await this.waitForServerDown(this.config.embeddingPort, 10000);
    log.info('Embedding server stopped');
  }

  /**
   * Start embedding server (and ChromaDB)
   */
  async startEmbedding(): Promise<boolean> {
    log.info('Starting embedding server...');

    const script = join(this.config.projectRoot, 'embedding-api', 'api-embed.sh');

    if (!existsSync(script)) {
      log.error('Embedding server script not found', { script });
      return false;
    }

    try {
      execSync(`bash "${script}" start`, {
        stdio: 'inherit',
        cwd: this.config.projectRoot,
      });

      // Verify server is running
      const ready = await this.waitForServerUp(
        `http://localhost:${this.config.embeddingPort}/`,
        60000 // Embedding model takes time to load
      );

      if (ready) {
        this.currentMode = 'embedding';
        this.saveState();
        log.info('Embedding server started successfully');
      } else {
        log.error('Embedding server failed to start within timeout');
      }

      return ready;
    } catch (error) {
      log.error('Failed to start embedding server', { error });
      return false;
    }
  }

  // ==================== Mode Switching ====================

  /**
   * Switch to AWQ mode (stop embedding, start AWQ)
   */
  async switchToAwq(): Promise<boolean> {
    const status = await this.getStatus();

    if (status.awq.running) {
      log.info('AWQ server already running');
      return true;
    }

    // Stop embedding if running
    if (status.embedding.running) {
      await this.stopEmbedding();
      // Wait for GPU memory to be freed
      await this.sleep(3000);
    }

    // Clear any GPU memory
    await this.clearGpuMemory();

    // Start AWQ
    return this.startAwq();
  }

  /**
   * Switch to embedding mode (stop AWQ, start embedding)
   */
  async switchToEmbedding(): Promise<boolean> {
    const status = await this.getStatus();

    if (status.embedding.running) {
      log.info('Embedding server already running');
      return true;
    }

    // Stop AWQ if running
    if (status.awq.running) {
      await this.stopAwq();
      // Wait for GPU memory to be freed
      await this.sleep(3000);
    }

    // Clear any GPU memory
    await this.clearGpuMemory();

    // Start embedding
    return this.startEmbedding();
  }

  /**
   * Get current mode
   */
  getCurrentMode(): ServerMode {
    return this.currentMode;
  }

  // ==================== Utilities ====================

  private async clearGpuMemory(): Promise<void> {
    try {
      // Force Python garbage collection by running a minimal CUDA script
      execSync(`python3 -c "import torch; torch.cuda.empty_cache()" 2>/dev/null || true`, {
        stdio: 'ignore',
      });
    } catch {
      // Ignore errors - this is best-effort
    }
  }

  private async waitForServerUp(url: string, timeout: number): Promise<boolean> {
    const start = Date.now();
    const checkInterval = 2000;

    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          return true;
        }
      } catch {
        // Server not ready yet
      }
      await this.sleep(checkInterval);
    }

    return false;
  }

  private async waitForServerDown(port: number, timeout: number): Promise<boolean> {
    const start = Date.now();
    const checkInterval = 500;

    while (Date.now() - start < timeout) {
      try {
        await fetch(`http://localhost:${port}/`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000),
        });
        // Server still running
      } catch {
        // Server is down
        return true;
      }
      await this.sleep(checkInterval);
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Convenience Functions ====================

/**
 * Get the GPU server manager instance
 */
export function getGPUServerManager(config?: GPUServerConfig): GPUServerManager {
  return GPUServerManager.getInstance(config);
}

/**
 * Switch to AWQ mode for code generation
 */
export async function activateAwqMode(): Promise<boolean> {
  const manager = getGPUServerManager();
  return manager.switchToAwq();
}

/**
 * Switch to embedding mode for document ingestion
 */
export async function activateEmbeddingMode(): Promise<boolean> {
  const manager = getGPUServerManager();
  return manager.switchToEmbedding();
}

/**
 * Get current GPU server status
 */
export async function getGPUStatus(): Promise<ServerStatus> {
  const manager = getGPUServerManager();
  return manager.getStatus();
}

/**
 * Wrapper for ingest operations - switches to embedding, runs callback, switches back to AWQ
 */
export async function withEmbeddingMode<T>(callback: () => Promise<T>): Promise<T> {
  const manager = getGPUServerManager();
  const previousMode = manager.getCurrentMode();

  try {
    // Switch to embedding mode
    const switched = await manager.switchToEmbedding();
    if (!switched) {
      throw new Error('Failed to switch to embedding mode');
    }

    // Run the ingest operation
    const result = await callback();

    return result;
  } finally {
    // Always switch back to AWQ mode (if that was the previous mode or default)
    if (previousMode === 'awq' || previousMode === 'none') {
      await manager.switchToAwq();
    }
  }
}
