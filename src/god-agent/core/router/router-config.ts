/**
 * Router Configuration Management
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Provides:
 * - Configuration loading from YAML files
 * - Environment variable overrides
 * - Configuration validation
 * - Default configuration values
 */

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type {
  RouterConfig,
  ProviderConfig,
  RoutingRule,
  CostTrackingConfig,
  ModelCapability,
  Complexity,
  ProviderType,
} from './router-types.js';

// ===== DEFAULT CONFIGURATION =====

/**
 * Default router configuration
 */
export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  models: {},
  routingRules: [],
  defaultModel: undefined,
  adaptiveRouting: false,
  costTracking: {
    enabled: false,
    budgets: undefined,
    alerts: undefined,
  },
};

/**
 * Default model configurations
 * Priority: lower = higher priority (0 = highest)
 * Local models (vLLM) have highest priority for cost savings
 */
export const DEFAULT_MODEL_CONFIGS: Record<string, Partial<ProviderConfig>> = {
  // === LOCAL MODELS (HIGHEST PRIORITY - FREE) ===
  // ID must match vllm-provider.ts VLLM_MODELS key
  'qwen2.5-coder-32b': {
    provider: 'vllm' as ProviderType,
    model: 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
    capabilities: ['code', 'reasoning', 'writing', 'refactor', 'debug', 'test'],
    maxComplexity: 'complex',
    priority: 0, // Highest priority - use first
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    timeout: 120000,
    enabled: true,
  },
  'deepseek-coder': {
    provider: 'ollama',
    model: 'deepseek-coder-v2:33b',
    capabilities: ['code', 'writing'],
    maxComplexity: 'simple',
    priority: 1, // Second priority local
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    timeout: 60000,
    enabled: true,
  },
  // === CLOUD MODELS (FALLBACK ONLY) ===
  'claude-sonnet': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'],
    maxComplexity: 'complex',
    priority: 10, // Only use when local unavailable
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    timeout: 60000,
    enabled: true,
  },
  'claude-opus': {
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'],
    maxComplexity: 'complex',
    priority: 11, // Expensive - last resort for complex
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    timeout: 120000,
    enabled: true,
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    capabilities: ['code', 'reasoning', 'writing', 'refactor'],
    maxComplexity: 'medium',
    priority: 12,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    timeout: 60000,
    enabled: true,
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    capabilities: ['code', 'writing'],
    maxComplexity: 'simple',
    priority: 13,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    timeout: 30000,
    enabled: true,
  },
  'o1': {
    provider: 'openai',
    model: 'o1',
    capabilities: ['reasoning', 'code'],
    maxComplexity: 'complex',
    priority: 14,
    inputCostPer1M: 15.0,
    outputCostPer1M: 60.0,
    timeout: 180000,
    enabled: true,
  },
};

/**
 * Default routing rules
 * LOCAL FIRST: Always try vLLM/Qwen before cloud providers
 * Cloud models are fallback only when local unavailable
 */
export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  // === CODE TASKS - LOCAL FIRST ===
  {
    task: 'code_edit',
    complexity: 'simple',
    route: ['qwen2.5-coder-32b', 'deepseek-coder', 'gpt-4o-mini', 'claude-sonnet'],
  },
  {
    task: 'code_edit',
    complexity: 'medium',
    route: ['qwen2.5-coder-32b', 'deepseek-coder', 'gpt-4o', 'claude-sonnet'],
  },
  {
    task: 'code_edit',
    complexity: 'complex',
    route: ['qwen2.5-coder-32b', 'claude-sonnet', 'gpt-4o'],
  },
  // === REASONING - LOCAL FIRST ===
  {
    task: 'reasoning',
    route: ['qwen2.5-coder-32b', 'o1', 'claude-sonnet', 'gpt-4o'],
  },
  // === RESEARCH - LOCAL FIRST ===
  {
    task: 'research',
    route: ['qwen2.5-coder-32b', 'claude-sonnet', 'gpt-4o'],
  },
  // === WRITING - LOCAL FIRST ===
  {
    task: 'writing',
    route: ['qwen2.5-coder-32b', 'deepseek-coder', 'gpt-4o', 'claude-sonnet'],
  },
  // === REFACTORING - LOCAL FIRST ===
  {
    task: 'refactor',
    complexity: 'simple',
    route: ['qwen2.5-coder-32b', 'deepseek-coder', 'gpt-4o', 'claude-sonnet'],
  },
  {
    task: 'refactor',
    complexity: 'medium',
    route: ['qwen2.5-coder-32b', 'gpt-4o', 'claude-sonnet'],
  },
  {
    task: 'refactor',
    complexity: 'complex',
    route: ['qwen2.5-coder-32b', 'claude-sonnet', 'gpt-4o'],
  },
  // === DEBUG - LOCAL FIRST ===
  {
    task: 'debug',
    route: ['qwen2.5-coder-32b', 'claude-sonnet', 'gpt-4o'],
  },
  // === TEST - LOCAL FIRST ===
  {
    task: 'test',
    route: ['qwen2.5-coder-32b', 'deepseek-coder', 'claude-sonnet', 'gpt-4o'],
  },
];

// ===== CONFIGURATION LOADER =====

/**
 * Configuration file paths
 */
export const CONFIG_PATHS = {
  user: join(homedir(), '.god-agent', 'router-config.yaml'),
  project: join(process.cwd(), '.god-agent', 'router-config.yaml'),
};

/**
 * Environment variable mappings
 */
const ENV_MAPPINGS: Record<string, string> = {
  GOD_ROUTER_DEFAULT_MODEL: 'defaultModel',
  GOD_ROUTER_ADAPTIVE: 'adaptiveRouting',
  GOD_COST_TRACKING_ENABLED: 'costTracking.enabled',
  GOD_BUDGET_DAILY: 'costTracking.budgets.daily',
  GOD_BUDGET_WEEKLY: 'costTracking.budgets.weekly',
  GOD_BUDGET_MONTHLY: 'costTracking.budgets.monthly',
  ANTHROPIC_API_KEY: 'models.claude-sonnet.apiKey',
  OPENAI_API_KEY: 'models.gpt-4o.apiKey',
  OLLAMA_BASE_URL: 'models.deepseek-coder.baseUrl',
};

/**
 * Load router configuration from files and environment
 */
export function loadRouterConfig(): RouterConfig {
  let config: RouterConfig = { ...DEFAULT_ROUTER_CONFIG };

  // Load from project config
  if (existsSync(CONFIG_PATHS.project)) {
    const projectConfig = loadConfigFile(CONFIG_PATHS.project);
    config = mergeConfig(config, projectConfig);
  }

  // Load from user config (higher priority)
  if (existsSync(CONFIG_PATHS.user)) {
    const userConfig = loadConfigFile(CONFIG_PATHS.user);
    config = mergeConfig(config, userConfig);
  }

  // Apply environment overrides
  config = applyEnvOverrides(config);

  // Apply default models if none configured
  if (Object.keys(config.models).length === 0) {
    config.models = { ...DEFAULT_MODEL_CONFIGS } as Record<string, ProviderConfig>;
  }

  // Apply default routing rules if none configured
  if (config.routingRules.length === 0) {
    config.routingRules = [...DEFAULT_ROUTING_RULES];
  }

  // Validate configuration
  validateRouterConfig(config);

  return config;
}

/**
 * Load configuration from a YAML file
 */
function loadConfigFile(path: string): Partial<RouterConfig> {
  try {
    const content = readFileSync(path, 'utf-8');
    // Simple YAML parsing (for basic configs)
    // In production, use a proper YAML parser like js-yaml
    return parseSimpleYaml(content);
  } catch {
    return {};
  }
}

/**
 * Simple YAML parser for basic configurations
 * Note: This is a simplified implementation. Use js-yaml for full YAML support.
 */
function parseSimpleYaml(content: string): Partial<RouterConfig> {
  const result: Record<string, unknown> = {};
  const lines = content.split('\n');
  let currentPath: string[] = [];
  let currentIndent = 0;

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }

    // Calculate indentation
    const indent = line.search(/\S/);
    const content_1 = line.trim();

    // Handle key-value pairs
    const match = content_1.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;

      // Adjust current path based on indentation
      while (currentPath.length > 0 && indent <= currentIndent) {
        currentPath.pop();
        currentIndent -= 2;
      }

      if (value === '' || value.startsWith('#')) {
        // This is a parent key
        currentPath.push(key.trim());
        currentIndent = indent;
      } else {
        // This is a leaf value
        const fullPath = [...currentPath, key.trim()];
        setNestedValue(result, fullPath, parseValue(value));
      }
    }
  }

  return result as Partial<RouterConfig>;
}

/**
 * Parse a YAML value
 */
function parseValue(value: string): unknown {
  const trimmed = value.trim().replace(/#.*$/, '').trim();

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    return Number(trimmed);
  }

  // Array (simple format)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map(s => parseValue(s.trim()));
  }

  // String (remove quotes if present)
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * Set a nested value in an object
 */
function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

/**
 * Get a nested value from an object
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Merge two configurations
 */
function mergeConfig(base: RouterConfig, override: Partial<RouterConfig>): RouterConfig {
  const result = { ...base };

  if (override.models) {
    result.models = { ...base.models, ...override.models };
  }

  if (override.routingRules) {
    result.routingRules = override.routingRules;
  }

  if (override.defaultModel !== undefined) {
    result.defaultModel = override.defaultModel;
  }

  if (override.adaptiveRouting !== undefined) {
    result.adaptiveRouting = override.adaptiveRouting;
  }

  if (override.costTracking) {
    result.costTracking = {
      ...base.costTracking,
      ...override.costTracking,
    };
  }

  return result;
}

/**
 * Apply environment variable overrides
 */
function applyEnvOverrides(config: RouterConfig): RouterConfig {
  const result = JSON.parse(JSON.stringify(config)) as RouterConfig;

  for (const [envVar, configPath] of Object.entries(ENV_MAPPINGS)) {
    const envValue = process.env[envVar];
    if (envValue !== undefined) {
      const parsed = parseValue(envValue);
      setNestedValue(result as unknown as Record<string, unknown>, configPath.split('.'), parsed);
    }
  }

  return result;
}

// ===== CONFIGURATION VALIDATION =====

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate router configuration
 */
export function validateRouterConfig(config: RouterConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate models
  for (const [id, modelConfig] of Object.entries(config.models)) {
    const modelErrors = validateModelConfig(id, modelConfig);
    errors.push(...modelErrors);
  }

  // Validate routing rules
  for (const rule of config.routingRules) {
    const ruleErrors = validateRoutingRule(rule, config.models);
    errors.push(...ruleErrors);
  }

  // Validate default model
  if (config.defaultModel && !config.models[config.defaultModel]) {
    errors.push(`Default model '${config.defaultModel}' is not configured`);
  }

  // Validate cost tracking
  if (config.costTracking?.enabled) {
    if (!config.costTracking.budgets) {
      warnings.push('Cost tracking enabled but no budgets configured');
    }
  }

  // Check for API keys
  for (const [id, modelConfig] of Object.entries(config.models)) {
    if (modelConfig.provider !== 'ollama' && !modelConfig.apiKey) {
      warnings.push(`Model '${id}' has no API key configured`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Router configuration invalid:\n${errors.join('\n')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a model configuration
 */
function validateModelConfig(id: string, config: ProviderConfig): string[] {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push(`Model '${id}': provider is required`);
  } else if (!isValidProvider(config.provider)) {
    errors.push(`Model '${id}': invalid provider '${config.provider}'`);
  }

  if (!config.model) {
    errors.push(`Model '${id}': model name is required`);
  }

  if (!config.capabilities || config.capabilities.length === 0) {
    errors.push(`Model '${id}': at least one capability is required`);
  } else {
    for (const cap of config.capabilities) {
      if (!isValidCapability(cap)) {
        errors.push(`Model '${id}': invalid capability '${cap}'`);
      }
    }
  }

  if (!config.maxComplexity) {
    errors.push(`Model '${id}': maxComplexity is required`);
  } else if (!isValidComplexity(config.maxComplexity)) {
    errors.push(`Model '${id}': invalid maxComplexity '${config.maxComplexity}'`);
  }

  if (config.priority === undefined || config.priority < 0) {
    errors.push(`Model '${id}': priority must be a non-negative number`);
  }

  return errors;
}

/**
 * Validate a routing rule
 */
function validateRoutingRule(
  rule: RoutingRule,
  models: Record<string, ProviderConfig>
): string[] {
  const errors: string[] = [];

  if (!rule.route || rule.route.length === 0) {
    errors.push('Routing rule: route array is required');
  } else {
    for (const modelId of rule.route) {
      if (!models[modelId]) {
        errors.push(`Routing rule: model '${modelId}' is not configured`);
      }
    }
  }

  return errors;
}

/**
 * Check if a provider type is valid
 */
function isValidProvider(provider: string): provider is ProviderType {
  return ['anthropic', 'openai', 'ollama', 'vllm', 'custom'].includes(provider);
}

/**
 * Check if a capability is valid
 */
function isValidCapability(capability: string): capability is ModelCapability {
  return ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'].includes(capability);
}

/**
 * Check if a complexity is valid
 */
function isValidComplexity(complexity: string): complexity is Complexity {
  return ['simple', 'medium', 'complex'].includes(complexity);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a minimal configuration
 */
export function createMinimalConfig(): RouterConfig {
  return {
    models: {},
    routingRules: [],
  };
}

/**
 * Create a configuration with defaults
 */
export function createDefaultConfig(): RouterConfig {
  return {
    models: { ...DEFAULT_MODEL_CONFIGS } as Record<string, ProviderConfig>,
    routingRules: [...DEFAULT_ROUTING_RULES],
    adaptiveRouting: false,
    costTracking: {
      enabled: true,
      budgets: {
        daily: 10,
        weekly: 50,
        monthly: 150,
      },
      alerts: [
        { at: 80, action: 'warn' },
        { at: 100, action: 'fallback_to_local' },
      ],
    },
  };
}

/**
 * Get model configuration by ID
 */
export function getModelConfig(
  config: RouterConfig,
  modelId: string
): ProviderConfig | undefined {
  return config.models[modelId];
}

/**
 * List all configured model IDs
 */
export function listModelIds(config: RouterConfig): string[] {
  return Object.keys(config.models);
}
