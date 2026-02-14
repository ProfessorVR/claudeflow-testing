/**
 * ICP Provider Factory — Unified construction of ICP pipeline dependencies
 *
 * Creates a shared ModelRouter and wires all concrete providers:
 *   - LLMDecompositionProviderImpl (WS2)
 *   - LLMGenerationProviderImpl (WS3)
 *   - AutoVerifier with OCR repair (WS4)
 *
 * Detects available backends (Anthropic, vLLM) and configures
 * cost-tier routing accordingly.
 *
 * @module icp-provider-factory
 */

import { readFileSync, existsSync } from 'fs';
import { ModelRouter, type ModelRouterConfig } from './model-router.js';
import { LLMDecompositionProviderImpl } from './llm-decomposition-provider.js';
import { LLMGenerationProviderImpl } from './llm-generation-provider.js';
import type { AutoVerifierConfig } from './auto-verifier.js';
import type { ICPDependencies, ICPOrchestratorConfig } from './icp-orchestrator.js';
import type { SmartRetrievalLayer } from '../../retrieval/smart-retrieval-layer.js';

// =============================================================================
// FACTORY CONFIG
// =============================================================================

export interface ICPFactoryConfig {
  /** Anthropic API key (reads from ANTHROPIC_API_KEY env if not provided) */
  anthropicApiKey?: string;
  /** vLLM base URL (default: http://localhost:8002/v1) */
  vllmBaseUrl?: string;
  /** vLLM model name */
  vllmModel?: string;
  /** Anthropic model name */
  anthropicModel?: string;
  /** Style profile ID for generation */
  styleProfileId?: string;
  /** Style prompt provider function */
  stylePromptProvider?: (profileId?: string) => string | null;
  /** Collections for corpus retrieval */
  collections?: string[];
  /** Minimum relevance threshold */
  minRelevance?: number;
  /** Enable OCR repair via vLLM (default: true if vLLM available) */
  enableOCRRepair?: boolean;
  /** OCR risk threshold for repair (default: 0.2) */
  ocrRepairThreshold?: number;
}

// =============================================================================
// FACTORY RESULT
// =============================================================================

export interface ICPFactoryResult {
  /** Dependencies for ICPOrchestrator constructor */
  deps: ICPDependencies;
  /** Orchestrator config with auto-verifier wired */
  orchestratorConfig: ICPOrchestratorConfig;
  /** Shared ModelRouter (for direct use or diagnostics) */
  router: ModelRouter;
  /** Available backends detected */
  availableBackends: ('anthropic' | 'vllm')[];
}

// =============================================================================
// FACTORY
// =============================================================================

export class ICPProviderFactory {
  /**
   * Create all ICP pipeline dependencies from a shared ModelRouter.
   *
   * @param retrieval - SmartRetrievalLayer instance (must be pre-configured)
   * @param config - Factory configuration
   * @returns ICPFactoryResult with deps, orchestrator config, and router
   */
  static async create(
    retrieval: SmartRetrievalLayer,
    config: ICPFactoryConfig = {},
  ): Promise<ICPFactoryResult> {
    // 1. Build shared ModelRouter
    const routerConfig: ModelRouterConfig = {
      anthropicApiKey: config.anthropicApiKey,
      vllmBaseUrl: config.vllmBaseUrl ?? 'http://localhost:8002/v1',
      vllmModel: config.vllmModel,
      anthropicModel: config.anthropicModel,
    };
    const router = new ModelRouter(routerConfig);

    // 2. Detect available backends
    const availableBackends = await router.getAvailableBackends();

    // 3. Build LLM providers (all share the same router)
    const llmDecomposer = new LLMDecompositionProviderImpl(router);
    const generationProvider = new LLMGenerationProviderImpl(router);

    // 4. Build auto-verifier config with OCR repair
    const enableRepair = config.enableOCRRepair ?? availableBackends.includes('vllm');
    const autoVerifierConfig: AutoVerifierConfig = enableRepair
      ? {
          ocrRepairRouter: router,
          ocrRepairThreshold: config.ocrRepairThreshold ?? 0.2,
        }
      : {};

    // 5. Build style prompt provider (uses config override or auto-loads from profile store)
    const stylePromptProvider = config.stylePromptProvider ?? ((profileId?: string) => {
      try {
        const profilePath = '.agentdb/universal/style-profiles.json';
        if (!existsSync(profilePath)) return null;
        const profiles = JSON.parse(readFileSync(profilePath, 'utf-8'));
        const id = profileId ?? config.styleProfileId ?? profiles.activeProfile;
        const profile = profiles.profiles?.[id];
        if (!profile) return null;

        const chars = profile.characteristics;
        const parts: string[] = [];
        if (chars?.sentences?.averageLength) {
          parts.push(`Sentence length: avg ${chars.sentences.averageLength.toFixed(1)} words`);
        }
        if (chars?.tone?.formalityScore) {
          parts.push(`Tone: ${chars.tone.formalityScore > 0.6 ? 'formal' : 'casual'}`);
        }
        if (chars?.commonTransitions?.length > 0) {
          parts.push(`Transitions: ${chars.commonTransitions.slice(0, 5).join(', ')}`);
        }
        return parts.length > 0 ? `Style Profile "${id}":\n${parts.map(p => `- ${p}`).join('\n')}` : null;
      } catch {
        return null;
      }
    });

    // 6. Assemble ICPDependencies
    const deps: ICPDependencies = {
      retrieval,
      llmDecomposer,
      generationProvider,
      stylePromptProvider,
    };

    // 7. Build orchestrator config
    const orchestratorConfig: ICPOrchestratorConfig = {
      styleProfileId: config.styleProfileId,
      autoVerifierConfig,
    };

    return {
      deps,
      orchestratorConfig,
      router,
      availableBackends,
    };
  }
}
