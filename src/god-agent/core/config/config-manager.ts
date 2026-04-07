/**
 * Configuration Manager
 * TIER-1.3 - Production Hardening
 *
 * Centralizes all configuration with:
 * - YAML/JSON config file loading
 * - Environment variable overrides
 * - Validation with defaults
 * - Type-safe configuration access
 *
 * Configuration precedence (highest to lowest):
 * 1. Environment variables (GOD_*)
 * 2. User config (~/.god-agent/config.yaml)
 * 3. Project config (.god-agent/config.yaml)
 * 4. Default values
 *
 * @module god-agent/core/config/config-manager
 */

import * as fs from 'fs';
import * as path from 'path';
import { createServiceLogger } from '../observability/logger.js';

// Note: Using built-in simple YAML parser to avoid external dependencies
// For full YAML support, install 'yaml' package and update parser

/**
 * Simple YAML-like parser for basic key: value files
 * Only handles flat structures and simple nested objects
 */
function simpleYamlParse(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split('\n');
  const stack: { obj: Record<string, unknown>; indent: number }[] = [{ obj: result, indent: -1 }];

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // Calculate indentation
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Parse key: value
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value: unknown = trimmed.substring(colonIndex + 1).trim();

    // Pop stack for dedents
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].obj;

    if (value === '' || value === null) {
      // Nested object
      const nested: Record<string, unknown> = {};
      current[key] = nested;
      stack.push({ obj: nested, indent });
    } else {
      // Parse value
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'null') value = null;
      else if (/^-?\d+$/.test(value as string)) value = parseInt(value as string, 10);
      else if (/^-?\d+\.\d+$/.test(value as string)) value = parseFloat(value as string);
      else if ((value as string).startsWith('"') && (value as string).endsWith('"')) {
        value = (value as string).slice(1, -1);
      } else if ((value as string).startsWith("'") && (value as string).endsWith("'")) {
        value = (value as string).slice(1, -1);
      }
      current[key] = value;
    }
  }

  return result;
}

/**
 * Simple object to YAML-like string
 */
function simpleYamlStringify(obj: unknown, indent = 0): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return String(obj);

  const lines: string[] = [];
  const spaces = '  '.repeat(indent);

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${spaces}${key}:`);
      lines.push(simpleYamlStringify(value, indent + 1));
    } else {
      lines.push(`${spaces}${key}: ${JSON.stringify(value)}`);
    }
  }

  return lines.join('\n');
}

// Service logger
const log = createServiceLogger('config-manager');

// ==================== Types ====================

/**
 * Service configuration
 */
export interface ServiceConfig {
  /** Service port (for HTTP services) */
  port?: number;
  /** Service socket path (for Unix socket services) */
  socketPath?: string;
  /** Service host */
  host?: string;
  /** Whether the service is enabled */
  enabled?: boolean;
}

/**
 * Services configuration
 */
export interface ServicesConfig {
  /** Embedding server configuration */
  embedding: ServiceConfig & {
    /** Embedding model name */
    model?: string;
    /** API endpoint for external embedding */
    endpoint?: string;
  };
  /** Observability dashboard configuration */
  observe: ServiceConfig;
  /** Core daemon configuration */
  daemon: ServiceConfig;
  /** UCM daemon configuration */
  ucm: ServiceConfig;
  /** Memory server configuration */
  memory: ServiceConfig & {
    /** Path to AgentDB storage */
    agentDbPath?: string;
  };
}

/**
 * Vector database configuration
 */
export interface VectorConfig {
  /** Vector dimensions (default: 1536) */
  dimension: number;
  /** HNSW M parameter */
  hnswM?: number;
  /** HNSW ef construction parameter */
  hnswEfConstruction?: number;
  /** Backend type: 'hnsw' | 'fallback' */
  backend?: string;
}

/**
 * Timeout configuration (all in milliseconds)
 */
export interface TimeoutsConfig {
  /** Embedding API timeout */
  embedding: number;
  /** Health check timeout */
  healthCheck: number;
  /** Socket connection timeout */
  socket: number;
  /** Keep-alive timeout for daemon connections */
  keepAlive: number;
  /** Graceful shutdown timeout */
  shutdown: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}

/**
 * Learning system configuration
 */
export interface LearningConfig {
  /** Quality threshold for pattern promotion */
  qualityThreshold: number;
  /** Minimum trajectory steps for quality calculation */
  minSteps: number;
  /** Fisher Information Matrix max entries */
  fisherMaxEntries: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level: 'debug' | 'info' | 'warn' | 'error' */
  level: string;
  /** Log format: 'json' | 'pretty' */
  format?: string;
  /** Log directory for file output */
  directory?: string;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

/**
 * Storage paths configuration
 */
export interface StorageConfig {
  /** Base storage directory */
  baseDir: string;
  /** AgentDB directory */
  agentDb: string;
  /** Learning database path */
  learningDb: string;
  /** DESC database path */
  descDb: string;
  /** Graph data directory */
  graphData: string;
  /** Logs directory */
  logs: string;
}

/**
 * Complete God Agent configuration
 */
export interface GodAgentConfig {
  /** Configuration version */
  version: string;
  /** Services configuration */
  services: ServicesConfig;
  /** Vector database configuration */
  vectors: VectorConfig;
  /** Timeout configuration */
  timeouts: TimeoutsConfig;
  /** Retry configuration */
  retry: RetryConfig;
  /** Learning system configuration */
  learning: LearningConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Storage paths configuration */
  storage: StorageConfig;
}

// ==================== Default Configuration ====================

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: GodAgentConfig = {
  version: '2.1.0',

  services: {
    embedding: {
      port: 8000,
      host: '127.0.0.1',
      enabled: true,
      model: 'gte-Qwen2-1.5B-instruct',
      endpoint: 'http://127.0.0.1:8000/embed',
    },
    observe: {
      port: 3847,
      host: '::',
      enabled: true,
    },
    daemon: {
      socketPath: '/tmp/godagent-db.sock',
      enabled: true,
    },
    ucm: {
      socketPath: '/tmp/godagent-ucm.sock',
      enabled: true,
    },
    memory: {
      socketPath: '/tmp/god-agent-memory.sock',
      agentDbPath: '.agentdb',
      enabled: true,
    },
  },

  vectors: {
    dimension: 1536,
    hnswM: 16,
    hnswEfConstruction: 200,
    backend: 'hnsw',
  },

  timeouts: {
    embedding: 30000,
    healthCheck: 5000,
    socket: 10000,
    keepAlive: 30000,
    shutdown: 5000,
  },

  retry: {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  },

  learning: {
    qualityThreshold: 0.5,
    minSteps: 2,
    fisherMaxEntries: 10000,
  },

  logging: {
    level: 'info',
    format: 'json',
    verbose: false,
  },

  storage: {
    baseDir: '.god-agent',
    agentDb: '.agentdb',
    learningDb: '.god-agent/learning.db',
    descDb: '.god-agent/desc.db',
    graphData: '.agentdb/graphs',
    logs: '.god-agent/logs',
  },
};

// ==================== Environment Variable Mapping ====================

/**
 * Environment variable to config path mapping
 */
const ENV_MAPPINGS: Record<string, string> = {
  // Services
  'GOD_EMBEDDING_PORT': 'services.embedding.port',
  'GOD_EMBEDDING_HOST': 'services.embedding.host',
  'GOD_EMBEDDING_MODEL': 'services.embedding.model',
  'GOD_EMBEDDING_ENDPOINT': 'services.embedding.endpoint',
  'GOD_OBSERVE_PORT': 'services.observe.port',
  'GOD_OBSERVE_HOST': 'services.observe.host',
  'GOD_DAEMON_SOCKET': 'services.daemon.socketPath',
  'GOD_UCM_SOCKET': 'services.ucm.socketPath',
  'GOD_MEMORY_SOCKET': 'services.memory.socketPath',
  'GOD_AGENTDB_PATH': 'services.memory.agentDbPath',

  // Vectors
  'GOD_VECTOR_DIM': 'vectors.dimension',
  'GOD_VECTOR_DIMENSION': 'vectors.dimension',

  // Timeouts
  'GOD_TIMEOUT_EMBEDDING': 'timeouts.embedding',
  'GOD_TIMEOUT_HEALTH_CHECK': 'timeouts.healthCheck',
  'GOD_TIMEOUT_SOCKET': 'timeouts.socket',
  'GOD_TIMEOUT_KEEPALIVE': 'timeouts.keepAlive',
  'GOD_TIMEOUT_SHUTDOWN': 'timeouts.shutdown',

  // Retry
  'GOD_RETRY_MAX_ATTEMPTS': 'retry.maxAttempts',
  'GOD_RETRY_INITIAL_DELAY': 'retry.initialDelayMs',
  'GOD_RETRY_MAX_DELAY': 'retry.maxDelayMs',

  // Learning
  'GOD_QUALITY_THRESHOLD': 'learning.qualityThreshold',

  // Logging
  'GOD_LOG_LEVEL': 'logging.level',
  'LOG_LEVEL': 'logging.level',
  'GOD_LOG_FORMAT': 'logging.format',
  'GOD_VERBOSE': 'logging.verbose',

  // Storage
  'GOD_STORAGE_DIR': 'storage.baseDir',
  'GOD_LEARNING_DB': 'storage.learningDb',
  'GOD_DESC_DB': 'storage.descDb',
};

// ==================== Configuration Manager ====================

/**
 * Singleton configuration manager
 */
class ConfigManager {
  private config: GodAgentConfig;
  private configPath: string | null = null;
  private initialized = false;

  constructor() {
    this.config = this.deepClone(DEFAULT_CONFIG);
  }

  /**
   * Initialize configuration from files and environment
   *
   * @param projectDir - Project root directory (default: process.cwd())
   */
  initialize(projectDir: string = process.cwd()): void {
    if (this.initialized) {
      return;
    }

    // Start with defaults
    this.config = this.deepClone(DEFAULT_CONFIG);

    // Load project config if exists
    const projectConfigPath = path.join(projectDir, '.god-agent', 'config.yaml');
    if (fs.existsSync(projectConfigPath)) {
      this.loadConfigFile(projectConfigPath);
      log.debug('Loaded project config', { path: projectConfigPath });
    }

    // Load user config if exists (overrides project config)
    const userConfigPath = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.god-agent',
      'config.yaml'
    );
    if (fs.existsSync(userConfigPath)) {
      this.loadConfigFile(userConfigPath);
      this.configPath = userConfigPath;
      log.debug('Loaded user config', { path: userConfigPath });
    }

    // Apply environment variable overrides
    this.applyEnvironmentOverrides();

    this.initialized = true;
    log.info('Configuration initialized', {
      configPath: this.configPath,
      version: this.config.version,
    });
  }

  /**
   * Load configuration from a YAML or JSON file
   */
  private loadConfigFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let parsed: unknown;

      if (filePath.endsWith('.json')) {
        parsed = JSON.parse(content);
      } else {
        // Use simple YAML parser for .yaml/.yml files
        parsed = simpleYamlParse(content);
      }

      if (parsed && typeof parsed === 'object') {
        this.mergeConfig(parsed as Record<string, unknown>);
      }
    } catch (error) {
      log.warn('Failed to load config file', {
        path: filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Deep merge parsed config into current config
   */
  private mergeConfig(parsed: Record<string, unknown>): void {
    this.deepMerge(this.config as unknown as Record<string, unknown>, parsed);
  }

  /**
   * Deep merge source into target
   */
  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else if (sourceValue !== undefined) {
        target[key] = sourceValue;
      }
    }
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(): void {
    for (const [envVar, configPath] of Object.entries(ENV_MAPPINGS)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        this.setConfigValue(configPath, this.parseEnvValue(value));
        log.debug('Applied env override', { envVar, configPath, value });
      }
    }
  }

  /**
   * Parse environment variable value to appropriate type
   */
  private parseEnvValue(value: string): unknown {
    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Number
    const num = parseFloat(value);
    if (!isNaN(num) && value.match(/^-?\d+(\.\d+)?$/)) {
      return num;
    }

    // String
    return value;
  }

  /**
   * Set a config value by dot-notation path
   */
  private setConfigValue(path: string, value: unknown): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = this.config as unknown as Record<string, unknown>;

    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Get a config value by dot-notation path
   */
  private getConfigValue(path: string): unknown {
    const parts = path.split('.');
    let current: unknown = this.config;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // ==================== Public API ====================

  /**
   * Get the full configuration
   */
  get(): GodAgentConfig {
    if (!this.initialized) {
      this.initialize();
    }
    return this.deepClone(this.config);
  }

  /**
   * Get services configuration
   */
  getServices(): ServicesConfig {
    return this.get().services;
  }

  /**
   * Get vector configuration
   */
  getVectors(): VectorConfig {
    return this.get().vectors;
  }

  /**
   * Get timeout configuration
   */
  getTimeouts(): TimeoutsConfig {
    return this.get().timeouts;
  }

  /**
   * Get retry configuration
   */
  getRetry(): RetryConfig {
    return this.get().retry;
  }

  /**
   * Get learning configuration
   */
  getLearning(): LearningConfig {
    return this.get().learning;
  }

  /**
   * Get logging configuration
   */
  getLogging(): LoggingConfig {
    return this.get().logging;
  }

  /**
   * Get storage configuration
   */
  getStorage(): StorageConfig {
    return this.get().storage;
  }

  /**
   * Get a specific config value by path
   */
  getValue<T>(path: string, defaultValue?: T): T {
    if (!this.initialized) {
      this.initialize();
    }
    const value = this.getConfigValue(path);
    return (value !== undefined ? value : defaultValue) as T;
  }

  /**
   * Get the active config file path
   */
  getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Check if configuration is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset configuration to defaults (for testing)
   */
  reset(): void {
    this.config = this.deepClone(DEFAULT_CONFIG);
    this.configPath = null;
    this.initialized = false;
  }

  /**
   * Validate configuration and return issues
   */
  validate(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Validate ports
    if (this.config.services.embedding.port) {
      if (this.config.services.embedding.port < 1 || this.config.services.embedding.port > 65535) {
        issues.push(`Invalid embedding port: ${this.config.services.embedding.port}`);
      }
    }

    if (this.config.services.observe.port) {
      if (this.config.services.observe.port < 1 || this.config.services.observe.port > 65535) {
        issues.push(`Invalid observe port: ${this.config.services.observe.port}`);
      }
    }

    // Validate vector dimension
    if (this.config.vectors.dimension < 1) {
      issues.push(`Invalid vector dimension: ${this.config.vectors.dimension}`);
    }

    // Validate timeouts
    for (const [key, value] of Object.entries(this.config.timeouts)) {
      if (typeof value === 'number' && value < 0) {
        issues.push(`Invalid timeout for ${key}: ${value}`);
      }
    }

    // Validate retry config
    if (this.config.retry.maxAttempts < 1) {
      issues.push(`Invalid retry maxAttempts: ${this.config.retry.maxAttempts}`);
    }

    // Validate learning thresholds
    if (this.config.learning.qualityThreshold < 0 || this.config.learning.qualityThreshold > 1) {
      issues.push(`Invalid quality threshold: ${this.config.learning.qualityThreshold}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Export configuration as YAML string
   */
  toYaml(): string {
    return simpleYamlStringify(this.get());
  }

  /**
   * Export configuration as JSON string
   */
  toJson(pretty = true): string {
    return JSON.stringify(this.get(), null, pretty ? 2 : 0);
  }
}

// ==================== Singleton Instance ====================

/**
 * Global configuration manager instance
 */
export const config = new ConfigManager();

// ==================== Convenience Functions ====================

/**
 * Get a configuration value by path
 */
export function getConfig<T>(path: string, defaultValue?: T): T {
  return config.getValue(path, defaultValue);
}

/**
 * Initialize configuration (call once at startup)
 */
export function initConfig(projectDir?: string): void {
  config.initialize(projectDir);
}

/**
 * Get the full configuration
 */
export function getFullConfig(): GodAgentConfig {
  return config.get();
}
