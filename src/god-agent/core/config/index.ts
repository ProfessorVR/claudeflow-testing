/**
 * Configuration Module
 * TIER-1.3 - Production Hardening
 *
 * Exports configuration management utilities:
 * - config: Singleton configuration manager
 * - getConfig: Get config value by path
 * - initConfig: Initialize configuration
 * - getFullConfig: Get complete configuration
 *
 * @module god-agent/core/config
 */

export {
  // Types
  type ServiceConfig,
  type ServicesConfig,
  type VectorConfig,
  type TimeoutsConfig,
  type RetryConfig,
  type LearningConfig,
  type LoggingConfig,
  type StorageConfig,
  type GodAgentConfig,

  // Constants
  DEFAULT_CONFIG,

  // Singleton
  config,

  // Functions
  getConfig,
  initConfig,
  getFullConfig,
} from './config-manager.js';
