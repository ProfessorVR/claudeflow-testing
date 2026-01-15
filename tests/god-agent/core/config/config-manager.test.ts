/**
 * Unit Tests for Configuration Manager
 * TIER-1.3 - Production Hardening
 *
 * Tests config loading, environment overrides, and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  config,
  getConfig,
  initConfig,
  getFullConfig,
  DEFAULT_CONFIG,
  type GodAgentConfig,
} from '../../../../src/god-agent/core/config/config-manager.js';

// Mock fs module for config file tests
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe('Configuration Manager', () => {
  beforeEach(() => {
    // Reset config state before each test
    config.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GOD_EMBEDDING_PORT;
    delete process.env.GOD_LOG_LEVEL;
    delete process.env.GOD_VERBOSE;
    delete process.env.GOD_DAEMON_SOCKET;
  });

  // ==================== Default Configuration ====================

  describe('DEFAULT_CONFIG', () => {
    it('should have correct version', () => {
      expect(DEFAULT_CONFIG.version).toBe('2.1.0');
    });

    it('should have embedding service config', () => {
      expect(DEFAULT_CONFIG.services.embedding.port).toBe(8000);
      expect(DEFAULT_CONFIG.services.embedding.host).toBe('127.0.0.1');
      expect(DEFAULT_CONFIG.services.embedding.model).toBe('gte-Qwen2-1.5B-instruct');
    });

    it('should have observe service config', () => {
      expect(DEFAULT_CONFIG.services.observe.port).toBe(3847);
    });

    it('should have daemon socket paths', () => {
      expect(DEFAULT_CONFIG.services.daemon.socketPath).toBe('/tmp/godagent-db.sock');
      expect(DEFAULT_CONFIG.services.ucm.socketPath).toBe('/tmp/godagent-ucm.sock');
      expect(DEFAULT_CONFIG.services.memory.socketPath).toBe('/tmp/god-agent-memory.sock');
    });

    it('should have vector config', () => {
      expect(DEFAULT_CONFIG.vectors.dimension).toBe(1536);
      expect(DEFAULT_CONFIG.vectors.hnswM).toBe(16);
    });

    it('should have timeout config', () => {
      expect(DEFAULT_CONFIG.timeouts.embedding).toBe(30000);
      expect(DEFAULT_CONFIG.timeouts.healthCheck).toBe(5000);
      expect(DEFAULT_CONFIG.timeouts.socket).toBe(10000);
    });

    it('should have retry config', () => {
      expect(DEFAULT_CONFIG.retry.maxAttempts).toBe(3);
      expect(DEFAULT_CONFIG.retry.initialDelayMs).toBe(500);
      expect(DEFAULT_CONFIG.retry.backoffMultiplier).toBe(2);
    });

    it('should have learning config', () => {
      expect(DEFAULT_CONFIG.learning.qualityThreshold).toBe(0.5);
      expect(DEFAULT_CONFIG.learning.minSteps).toBe(2);
    });

    it('should have storage paths', () => {
      expect(DEFAULT_CONFIG.storage.baseDir).toBe('.god-agent');
      expect(DEFAULT_CONFIG.storage.agentDb).toBe('.agentdb');
    });
  });

  // ==================== Config Initialization ====================

  describe('initialize', () => {
    it('should initialize with defaults when no config files exist', () => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      config.initialize();

      const fullConfig = config.get();
      expect(fullConfig.version).toBe(DEFAULT_CONFIG.version);
      expect(fullConfig.services.embedding.port).toBe(8000);
    });

    it('should only initialize once', () => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      config.initialize();
      config.initialize(); // Second call should be no-op

      expect(config.isInitialized()).toBe(true);
    });
  });

  // ==================== getConfig Function ====================

  describe('getConfig', () => {
    beforeEach(() => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
    });

    it('should get nested config values by path', () => {
      const port = getConfig<number>('services.embedding.port');
      expect(port).toBe(8000);
    });

    it('should return default value for missing paths', () => {
      const value = getConfig<string>('nonexistent.path', 'default');
      expect(value).toBe('default');
    });

    it('should get timeout values', () => {
      const timeout = getConfig<number>('timeouts.embedding');
      expect(timeout).toBe(30000);
    });

    it('should get storage paths', () => {
      const baseDir = getConfig<string>('storage.baseDir');
      expect(baseDir).toBe('.god-agent');
    });
  });

  // ==================== Environment Variable Overrides ====================

  describe('environment variable overrides', () => {
    beforeEach(() => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
    });

    it('should override embedding port from env', () => {
      process.env.GOD_EMBEDDING_PORT = '9000';
      config.reset();
      config.initialize();

      const port = config.get().services.embedding.port;
      expect(port).toBe(9000);
    });

    it('should override log level from env', () => {
      process.env.GOD_LOG_LEVEL = 'debug';
      config.reset();
      config.initialize();

      const level = config.get().logging.level;
      expect(level).toBe('debug');
    });

    it('should parse boolean env values', () => {
      process.env.GOD_VERBOSE = 'true';
      config.reset();
      config.initialize();

      const verbose = config.get().logging.verbose;
      expect(verbose).toBe(true);
    });

    it('should override socket path from env', () => {
      process.env.GOD_DAEMON_SOCKET = '/custom/path.sock';
      config.reset();
      config.initialize();

      const socketPath = config.get().services.daemon.socketPath;
      expect(socketPath).toBe('/custom/path.sock');
    });
  });

  // ==================== Config Validation ====================

  describe('validate', () => {
    beforeEach(() => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      config.initialize();
    });

    it('should pass validation for default config', () => {
      const { valid, issues } = config.validate();
      expect(valid).toBe(true);
      expect(issues).toHaveLength(0);
    });
  });

  // ==================== Config Export ====================

  describe('export', () => {
    beforeEach(() => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      config.initialize();
    });

    it('should export config as JSON', () => {
      const json = config.toJson();
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('2.1.0');
      expect(parsed.services.embedding.port).toBe(8000);
    });

    it('should export config as YAML', () => {
      const yaml = config.toYaml();

      expect(yaml).toContain('version');
      expect(yaml).toContain('services');
      expect(yaml).toContain('embedding');
    });
  });

  // ==================== Convenience Functions ====================

  describe('convenience functions', () => {
    beforeEach(() => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
    });

    it('getFullConfig should return complete config', () => {
      const fullConfig = getFullConfig();

      expect(fullConfig).toHaveProperty('version');
      expect(fullConfig).toHaveProperty('services');
      expect(fullConfig).toHaveProperty('vectors');
      expect(fullConfig).toHaveProperty('timeouts');
    });

    it('initConfig should initialize configuration', () => {
      initConfig();
      expect(config.isInitialized()).toBe(true);
    });
  });

  // ==================== Section Getters ====================

  describe('section getters', () => {
    beforeEach(() => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      config.initialize();
    });

    it('getServices should return services config', () => {
      const services = config.getServices();

      expect(services.embedding.port).toBe(8000);
      expect(services.observe.port).toBe(3847);
      expect(services.daemon.socketPath).toBe('/tmp/godagent-db.sock');
    });

    it('getVectors should return vector config', () => {
      const vectors = config.getVectors();

      expect(vectors.dimension).toBe(1536);
      expect(vectors.hnswM).toBe(16);
    });

    it('getTimeouts should return timeout config', () => {
      const timeouts = config.getTimeouts();

      expect(timeouts.embedding).toBe(30000);
      expect(timeouts.healthCheck).toBe(5000);
    });

    it('getRetry should return retry config', () => {
      const retry = config.getRetry();

      expect(retry.maxAttempts).toBe(3);
      expect(retry.initialDelayMs).toBe(500);
    });

    it('getLearning should return learning config', () => {
      const learning = config.getLearning();

      expect(learning.qualityThreshold).toBe(0.5);
      expect(learning.minSteps).toBe(2);
    });

    it('getLogging should return logging config', () => {
      const logging = config.getLogging();

      expect(logging.level).toBe('info');
      expect(logging.format).toBe('json');
    });

    it('getStorage should return storage config', () => {
      const storage = config.getStorage();

      expect(storage.baseDir).toBe('.god-agent');
      expect(storage.agentDb).toBe('.agentdb');
    });
  });
});
