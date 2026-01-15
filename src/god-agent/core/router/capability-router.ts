/**
 * Capability Router for Intelligent Model Router
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Routes tasks to appropriate models based on:
 * - Task type and complexity
 * - Model capabilities and availability
 * - Cost and quality considerations
 * - User overrides
 *
 * Performance target: <10ms per routing decision
 */

import type {
  ILLMProvider,
  ProviderType,
  TaskClassification,
  RoutingDecision,
  RoutingRule,
  RouterConfig,
  RouterEvent,
  RouterEventHandler,
  ModelCapability,
  Complexity,
} from './router-types.js';
import {
  NoSuitableModelError,
  TaskBlockedError,
} from './router-types.js';
import { TaskClassifier, getTaskClassifier } from './task-classifier.js';
import type { ClassificationContext } from './task-classifier.js';

// ===== CAPABILITY ROUTER =====

/**
 * Configuration for CapabilityRouter
 */
export interface CapabilityRouterConfig {
  /** Router configuration */
  routerConfig: RouterConfig;
  /** Whether to enable adaptive routing */
  adaptiveRouting?: boolean;
  /** Minimum quality score for adaptive routing */
  minQualityScore?: number;
}

/**
 * Routes tasks to appropriate LLM providers
 */
export class CapabilityRouter {
  private readonly config: RouterConfig;
  private readonly providers: Map<string, ILLMProvider> = new Map();
  private readonly eventHandlers: Set<RouterEventHandler> = new Set();
  private readonly classifier: TaskClassifier;
  private readonly adaptiveRouting: boolean;
  private readonly minQualityScore: number;

  /** Session-level override model */
  private sessionOverride: string | null = null;

  constructor(config: CapabilityRouterConfig) {
    this.config = config.routerConfig;
    this.adaptiveRouting = config.adaptiveRouting ?? false;
    this.minQualityScore = config.minQualityScore ?? 0.7;
    this.classifier = getTaskClassifier();
  }

  /**
   * Register an LLM provider
   */
  registerProvider(provider: ILLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(id: string): void {
    this.providers.delete(id);
  }

  /**
   * Get a registered provider
   */
  getProvider(id: string): ILLMProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ILLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Set session-level model override
   */
  setSessionOverride(modelId: string | null): void {
    this.sessionOverride = modelId;
    if (modelId) {
      this.emit({
        type: 'routing_decision',
        timestamp: new Date(),
        data: { sessionOverride: modelId },
      });
    }
  }

  /**
   * Get current session override
   */
  getSessionOverride(): string | null {
    return this.sessionOverride;
  }

  /**
   * Route a task to an appropriate model
   */
  async route(
    prompt: string,
    options?: RouteOptions
  ): Promise<RoutingDecision> {
    const startTime = Date.now();

    // Handle manual override
    if (options?.modelOverride) {
      return this.handleOverride(prompt, options.modelOverride, options);
    }

    // Handle session override
    if (this.sessionOverride) {
      return this.handleOverride(prompt, this.sessionOverride, options);
    }

    // Classify the task
    const classification = this.classifier.classify(prompt, options?.context);

    // Find matching routing rule
    const rule = this.findMatchingRule(classification);

    // Get fallback chain
    const fallbackChain = rule?.route ?? this.getDefaultFallbackChain(classification);

    // Try each model in the chain
    for (const modelId of fallbackChain) {
      const provider = this.providers.get(modelId);

      if (!provider) {
        continue;
      }

      // Check if provider can handle this task
      if (!this.canProviderHandle(provider, classification)) {
        continue;
      }

      // Check availability
      const available = await provider.isAvailable();
      if (!available) {
        this.emit({
          type: 'provider_unavailable',
          timestamp: new Date(),
          data: { modelId, classification },
        });
        continue;
      }

      // Found a suitable model
      const decision: RoutingDecision = {
        selectedModel: modelId,
        selectedProvider: provider.provider,
        reason: this.formatReason(classification, modelId, 'capability_match'),
        fallbackChain: fallbackChain.slice(fallbackChain.indexOf(modelId) + 1),
        wasOverride: false,
        blocked: false,
        classification,
        timestamp: new Date(),
      };

      this.emit({
        type: 'routing_decision',
        timestamp: new Date(),
        data: { decision, latencyMs: Date.now() - startTime },
      });

      return decision;
    }

    // No suitable model found
    if (rule?.blockIfUnavailable) {
      const decision: RoutingDecision = {
        selectedModel: '',
        selectedProvider: 'custom' as ProviderType,
        reason: 'Task blocked: no suitable model available for this complexity',
        fallbackChain: [],
        wasOverride: false,
        blocked: true,
        blockReason: `No model available for ${classification.complexity} ${classification.type} task`,
        classification,
        timestamp: new Date(),
      };

      this.emit({
        type: 'routing_decision',
        timestamp: new Date(),
        data: { decision, blocked: true },
      });

      throw new TaskBlockedError(decision.blockReason!);
    }

    throw new NoSuitableModelError(classification.type, classification.complexity);
  }

  /**
   * Route with a specific model (bypass routing logic)
   */
  async routeToModel(
    prompt: string,
    modelId: string,
    options?: RouteOptions
  ): Promise<RoutingDecision> {
    return this.handleOverride(prompt, modelId, options);
  }

  /**
   * Check if a model can handle a task
   */
  canModelHandle(modelId: string, classification: TaskClassification): boolean {
    const provider = this.providers.get(modelId);
    if (!provider) {
      return false;
    }
    return this.canProviderHandle(provider, classification);
  }

  /**
   * Get available models for a task
   */
  async getAvailableModels(
    classification: TaskClassification
  ): Promise<string[]> {
    const available: string[] = [];

    for (const [id, provider] of this.providers) {
      if (this.canProviderHandle(provider, classification)) {
        if (await provider.isAvailable()) {
          available.push(id);
        }
      }
    }

    return available;
  }

  /**
   * Subscribe to router events
   */
  on(handler: RouterEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Handle manual model override
   */
  private async handleOverride(
    prompt: string,
    modelId: string,
    options?: RouteOptions
  ): Promise<RoutingDecision> {
    const provider = this.providers.get(modelId);

    if (!provider) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const classification = this.classifier.classify(prompt, options?.context);

    // Check availability
    const available = await provider.isAvailable();
    if (!available) {
      throw new Error(`Model ${modelId} is not available`);
    }

    // Warn if model may not be suitable (but allow anyway with override)
    const suitable = this.canProviderHandle(provider, classification);

    const decision: RoutingDecision = {
      selectedModel: modelId,
      selectedProvider: provider.provider,
      reason: this.formatReason(
        classification,
        modelId,
        'manual_override',
        !suitable ? 'WARNING: Model may not be optimal for this task' : undefined
      ),
      fallbackChain: [],
      wasOverride: true,
      blocked: false,
      classification,
      timestamp: new Date(),
    };

    this.emit({
      type: 'routing_decision',
      timestamp: new Date(),
      data: { decision, override: true, suitable },
    });

    return decision;
  }

  /**
   * Find matching routing rule for a classification
   */
  private findMatchingRule(classification: TaskClassification): RoutingRule | undefined {
    for (const rule of this.config.routingRules) {
      // Check task type match
      if (rule.task && rule.task !== classification.type) {
        continue;
      }

      // Check complexity match
      if (rule.complexity && rule.complexity !== classification.complexity) {
        continue;
      }

      // Check risk level match
      if (rule.riskLevel && rule.riskLevel !== classification.riskLevel) {
        continue;
      }

      return rule;
    }

    return undefined;
  }

  /**
   * Get default fallback chain based on classification
   */
  private getDefaultFallbackChain(classification: TaskClassification): string[] {
    // Get all providers that can handle this task
    const suitable: Array<{ id: string; priority: number }> = [];

    for (const [id, provider] of this.providers) {
      if (this.canProviderHandle(provider, classification)) {
        const config = this.config.models[id];
        suitable.push({
          id,
          priority: config?.priority ?? 99,
        });
      }
    }

    // Sort by priority (lower = preferred)
    suitable.sort((a, b) => a.priority - b.priority);

    return suitable.map(s => s.id);
  }

  /**
   * Check if a provider can handle a task classification
   */
  private canProviderHandle(
    provider: ILLMProvider,
    classification: TaskClassification
  ): boolean {
    // Check capability
    const requiredCapability = this.taskTypeToCapability(classification.type);
    if (requiredCapability && !provider.capabilities.includes(requiredCapability)) {
      return false;
    }

    // Check complexity
    const complexityOrder: Complexity[] = ['simple', 'medium', 'complex'];
    const taskComplexity = complexityOrder.indexOf(classification.complexity);
    const maxComplexity = complexityOrder.indexOf(provider.maxComplexity);

    if (taskComplexity > maxComplexity) {
      return false;
    }

    return true;
  }

  /**
   * Map task type to capability
   */
  private taskTypeToCapability(taskType: string): ModelCapability | undefined {
    const mapping: Record<string, ModelCapability> = {
      code_edit: 'code',
      reasoning: 'reasoning',
      writing: 'writing',
      refactor: 'refactor',
      research: 'research',
      debug: 'debug',
      test: 'test',
    };
    return mapping[taskType];
  }

  /**
   * Format routing reason string
   */
  private formatReason(
    classification: TaskClassification,
    modelId: string,
    type: 'capability_match' | 'manual_override' | 'fallback',
    warning?: string
  ): string {
    const base = `${classification.complexity} ${classification.type} task → ${modelId}`;

    switch (type) {
      case 'capability_match':
        return `${base} (capability match, ${Math.round(classification.confidence * 100)}% confidence)`;
      case 'manual_override':
        return warning ? `${base} (manual override - ${warning})` : `${base} (manual override)`;
      case 'fallback':
        return `${base} (fallback after primary unavailable)`;
      default:
        return base;
    }
  }

  /**
   * Emit a router event
   */
  private emit(event: RouterEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }
}

/**
 * Options for routing
 */
export interface RouteOptions {
  /** Manual model override */
  modelOverride?: string;
  /** Classification context */
  context?: ClassificationContext;
  /** Force routing even if model may not be suitable */
  force?: boolean;
}

// ===== SINGLETON =====

let routerInstance: CapabilityRouter | null = null;

/**
 * Get or create the singleton CapabilityRouter instance
 */
export function getCapabilityRouter(config?: CapabilityRouterConfig): CapabilityRouter {
  if (!routerInstance && config) {
    routerInstance = new CapabilityRouter(config);
  }
  if (!routerInstance) {
    throw new Error('CapabilityRouter not initialized. Call with config first.');
  }
  return routerInstance;
}

/**
 * Initialize the router with configuration
 */
export function initializeRouter(config: CapabilityRouterConfig): CapabilityRouter {
  routerInstance = new CapabilityRouter(config);
  return routerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetCapabilityRouter(): void {
  routerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a simple routing decision
 */
export function createRoutingDecision(
  modelId: string,
  provider: ProviderType,
  classification: TaskClassification,
  options?: Partial<RoutingDecision>
): RoutingDecision {
  return {
    selectedModel: modelId,
    selectedProvider: provider,
    reason: options?.reason ?? 'direct selection',
    fallbackChain: options?.fallbackChain ?? [],
    wasOverride: options?.wasOverride ?? false,
    blocked: options?.blocked ?? false,
    blockReason: options?.blockReason,
    classification,
    timestamp: options?.timestamp ?? new Date(),
  };
}

/**
 * Check if a routing decision was successful
 */
export function isRoutingSuccessful(decision: RoutingDecision): boolean {
  return !decision.blocked && decision.selectedModel !== '';
}

/**
 * Get routing decision summary
 */
export function getRoutingDecisionSummary(decision: RoutingDecision): string {
  if (decision.blocked) {
    return `Blocked: ${decision.blockReason}`;
  }
  return `${decision.selectedModel} (${decision.selectedProvider}) - ${decision.reason}`;
}
