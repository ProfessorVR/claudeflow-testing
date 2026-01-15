/**
 * LLM Providers Module
 *
 * Implements TIER-2.1: Intelligent Model Router - Provider Layer
 *
 * Exports all provider implementations and factory utilities:
 * - AnthropicProvider: Claude models (Opus 4.5, Sonnet 4, Haiku)
 * - OpenAIProvider: GPT models (GPT-5.2, GPT-5, GPT-4o, o3, o1)
 * - OllamaProvider: Local models (DeepSeek, Qwen, Llama, Mistral)
 * - LLMProviderFactory: Provider management and fallback chains
 */

// ===== ANTHROPIC PROVIDER =====

export {
  AnthropicProvider,
  createAnthropicProvider,
  createAllAnthropicProviders,
  isAnthropicConfigured,
  listAnthropicModels,
  ANTHROPIC_MODELS,
} from './anthropic-provider.js';

export type {
  AnthropicProviderConfig,
  AnthropicModelKey,
} from './anthropic-provider.js';

// ===== OPENAI PROVIDER =====

export {
  OpenAIProvider,
  createOpenAIProvider,
  createAllOpenAIProviders,
  isOpenAIConfigured,
  listOpenAIModels,
  getBestReasoningModel,
  getBestCodeModel,
  getCostEffectiveModel,
  OPENAI_MODELS,
} from './openai-provider.js';

export type {
  OpenAIProviderConfig,
  OpenAIModelKey,
} from './openai-provider.js';

// ===== OLLAMA PROVIDER =====

export {
  OllamaProvider,
  createOllamaProvider,
  createAllOllamaProviders,
  isOllamaConfigured,
  listOllamaModels,
  getBestLocalCodeModel,
  getEfficientLocalModel,
  isModelPulled,
  OLLAMA_MODELS,
} from './ollama-provider.js';

export type {
  OllamaProviderConfig,
  OllamaModelKey,
} from './ollama-provider.js';

// ===== PROVIDER FACTORY =====

export {
  LLMProviderFactory,
  getProviderFactory,
  initializeProviderFactory,
  resetProviderFactory,
  createProviderById,
  getProviderType,
  listAllModelIds,
  getModelInfo,
  getConfiguredProviders,
} from './provider-factory.js';

export type {
  ProviderFactoryConfig,
} from './provider-factory.js';
