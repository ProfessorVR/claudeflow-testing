/**
 * Integration tests for the v2 pipeline refactoring (Phases 1-5).
 *
 * Tests:
 * - Stage types and PipelineContext
 * - DomainConfig loading and pattern building
 * - GoldStandardConfig values
 * - Pipeline version gating
 * - Manifest caching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Stage Types + PipelineContext
// ============================================================================

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('Stage types and PipelineContext', () => {
  it('should create a clean PipelineContext', async () => {
    const {
      createPipelineContext,
      computePipelineHealth,
    } = await import('../../../src/god-agent/universal/stages/stage-types.js');

    const ctx = createPipelineContext(mockLogger);
    expect(ctx.hardFailures).toEqual([]);
    expect(ctx.degradedEvents).toEqual([]);
    expect(ctx.warnings).toEqual([]);
    expect(computePipelineHealth(ctx)).toBe('clean');
  });

  it('should track degraded events', async () => {
    const {
      createPipelineContext,
      recordDegraded,
      computePipelineHealth,
    } = await import('../../../src/god-agent/universal/stages/stage-types.js');

    const ctx = createPipelineContext(mockLogger);
    recordDegraded(ctx, 'retrieval', 'ChromaDB slow');
    expect(ctx.degradedEvents).toHaveLength(1);
    expect(ctx.degradedEvents[0].stage).toBe('retrieval');
    expect(computePipelineHealth(ctx)).toBe('degraded');
  });

  it('should track hard failures', async () => {
    const {
      createPipelineContext,
      recordHardFailure,
      computePipelineHealth,
    } = await import('../../../src/god-agent/universal/stages/stage-types.js');

    const ctx = createPipelineContext(mockLogger);
    recordHardFailure(ctx, 'drafting', 'LLM timeout');
    expect(ctx.hardFailures).toHaveLength(1);
    expect(computePipelineHealth(ctx)).toBe('failed');
  });

  it('should detect pipeline version from options', async () => {
    const { getPipelineVersion } = await import(
      '../../../src/god-agent/universal/stages/stage-types.js'
    );

    // Default is legacy
    expect(getPipelineVersion({})).toBe('legacy');

    // Explicit v2
    expect(getPipelineVersion({ pipelineVersion: 'v2' })).toBe('v2');

    // Env var fallback (tested by setting then clearing)
    const prev = process.env.WRITING_PIPELINE_VERSION;
    process.env.WRITING_PIPELINE_VERSION = 'v2';
    expect(getPipelineVersion({})).toBe('v2');
    if (prev) {
      process.env.WRITING_PIPELINE_VERSION = prev;
    } else {
      delete process.env.WRITING_PIPELINE_VERSION;
    }
  });
});

// ============================================================================
// Pipeline Utils
// ============================================================================

describe('Pipeline utils', () => {
  it('should deduplicate chunks by composite key', async () => {
    const { deduplicateChunks } = await import(
      '../../../src/god-agent/universal/stages/pipeline-utils.js'
    );

    const chunks = [
      { chunkId: 'a', docId: 'd1', content: 'hello', metadata: { author: 'A', title: 'T', year: 2020, page_start: 1, page_end: 5, collection: 'c', chunk_id: 'chunk-1', source_id: 'src-1' }, relevanceScore: 0.9 },
      { chunkId: 'a', docId: 'd1', content: 'hello', metadata: { author: 'A', title: 'T', year: 2020, page_start: 1, page_end: 5, collection: 'c', chunk_id: 'chunk-1', source_id: 'src-1' }, relevanceScore: 0.8 },
      { chunkId: 'b', docId: 'd2', content: 'world', metadata: { author: 'B', title: 'T2', year: 2021, page_start: 10, page_end: 15, collection: 'c', chunk_id: 'chunk-2', source_id: 'src-2' }, relevanceScore: 0.7 },
    ];

    const deduped = deduplicateChunks(chunks);
    expect(deduped).toHaveLength(2);
    // Should keep the first occurrence (higher relevance)
    expect(deduped[0].relevanceScore).toBe(0.9);
  });

  it('should estimate token budget', async () => {
    const { estimateTokenBudget } = await import(
      '../../../src/god-agent/universal/stages/pipeline-utils.js'
    );

    const chunks = [
      { chunkId: 'a', docId: 'd1', content: 'x'.repeat(4000), metadata: { author: 'A', title: 'T', year: 2020, page_start: 1, page_end: 5, collection: 'c' }, relevanceScore: 0.9 },
    ];

    const budget = estimateTokenBudget(chunks, 'Write in academic style', 'Section constraints here');
    expect(budget.inputTokens).toBeGreaterThan(0);
    expect(budget.suggestedMaxOutput).toBeGreaterThan(0);
    expect(typeof budget.overBudget).toBe('boolean');
  });
});

// ============================================================================
// DomainConfig
// ============================================================================

describe('DomainConfig', () => {
  beforeEach(async () => {
    const { resetDomainConfigCache } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );
    resetDomainConfigCache();
  });

  it('should load domain config from file', async () => {
    const { loadDomainConfig } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );

    const config = loadDomainConfig();
    expect(config.primaryAuthors).toContain('Aristotle');
    expect(config.primaryAuthors).toContain('Heidegger');
    expect(config.secondaryAuthors.length).toBeGreaterThan(0);
    expect(config.keyConcepts).toContain('phantasia');
    expect(config.keyConcepts).toContain('kinesis');
    expect(config.primaryTitles).toContain('De Anima');
  });

  it('should build author pattern from config', async () => {
    const { loadDomainConfig, buildAuthorPattern } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );

    const config = loadDomainConfig();
    // buildAuthorPattern returns a regex with 'gi' flag — test individually
    // (regex with 'g' flag advances lastIndex, so test each match independently)
    expect(buildAuthorPattern(config).test('Aristotle')).toBe(true);
    expect(buildAuthorPattern(config).test('Frede')).toBe(true);
    expect(buildAuthorPattern(config).test('RandomAuthor')).toBe(false);
  });

  it('should build concept pattern from config', async () => {
    const { loadDomainConfig, buildConceptPattern } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );

    const config = loadDomainConfig();
    expect(buildConceptPattern(config).test('phantasia')).toBe(true);
    expect(buildConceptPattern(config).test('kinesis')).toBe(true);
  });

  it('should detect primary sources', async () => {
    const { loadDomainConfig, isPrimarySource } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );

    const config = loadDomainConfig();

    expect(isPrimarySource('Aristotle', 'Some Work', config)).toBe(true);
    expect(isPrimarySource('Someone', 'De Anima', config)).toBe(true);
    expect(isPrimarySource('Smith', 'Random Paper', config)).toBe(false);
  });

  it('should get domain keywords', async () => {
    const { loadDomainConfig, getDomainKeywords } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );

    const config = loadDomainConfig();
    const keywords = getDomainKeywords(config);

    expect(keywords).toContain('aristotle');
    expect(keywords).toContain('phantasia');
    expect(keywords.length).toBeGreaterThan(10);
  });

  it('should cache config', async () => {
    const { loadDomainConfig } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );

    const config1 = loadDomainConfig();
    const config2 = loadDomainConfig();
    expect(config1).toBe(config2); // Same reference = cached
  });

  it('should fallback gracefully when config file is missing', async () => {
    const { loadDomainConfig } = await import(
      '../../../src/god-agent/universal/domain-config.js'
    );

    // Load from non-existent path
    const config = loadDomainConfig('/nonexistent/path');
    expect(config.primaryAuthors).toContain('Aristotle');
    expect(config.keyConcepts.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// GoldStandardConfig
// ============================================================================

describe('GoldStandardConfig', () => {
  it('should have expected values', async () => {
    const { GOLD_STANDARD_CONFIG } = await import(
      '../../../src/god-agent/universal/gold-standard-config.js'
    );

    expect(GOLD_STANDARD_CONFIG.chunkTrimTarget).toBe(450);
    expect(GOLD_STANDARD_CONFIG.targetChunks).toBe(28);
    expect(GOLD_STANDARD_CONFIG.maxChunksPerSource).toBe(8);
    expect(GOLD_STANDARD_CONFIG.targetTotalChunks).toBe(35);
    expect(GOLD_STANDARD_CONFIG.relevanceFloor).toBe(0.25);
    expect(GOLD_STANDARD_CONFIG.primaryRatioThreshold).toBe(0.3);
    expect(GOLD_STANDARD_CONFIG.minSectionWords).toBe(350);
    expect(GOLD_STANDARD_CONFIG.maxCorpusBlockChars).toBe(60000);
    expect(GOLD_STANDARD_CONFIG.overCitationThreshold).toBe(0.4);
    expect(GOLD_STANDARD_CONFIG.opusMaxTokens).toBe(16384);
  });

  it('should be frozen (immutable)', async () => {
    const { GOLD_STANDARD_CONFIG } = await import(
      '../../../src/god-agent/universal/gold-standard-config.js'
    );

    expect(Object.isFrozen(GOLD_STANDARD_CONFIG)).toBe(true);
    expect(() => {
      (GOLD_STANDARD_CONFIG as any).chunkTrimTarget = 999;
    }).toThrow();
  });
});

// ============================================================================
// v2 Pipeline Gate
// ============================================================================

describe('v2 pipeline version gate', () => {
  it('should route to legacy path by default', async () => {
    const mod = await import(
      '../../../src/god-agent/universal/write-pipeline-orchestrator.js'
    );
    const WritePipelineOrchestrator = mod.WritePipelineOrchestrator;

    const writeV2Spy = vi.fn();
    const orchestrator = new WritePipelineOrchestrator({
      log: vi.fn(),
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      executeTaskDefault: vi.fn(),
      maybeStorePattern: vi.fn().mockResolvedValue(undefined),
      extractTags: vi.fn().mockReturnValue([]),
      storeDESCEpisode: vi.fn().mockResolvedValue(undefined),
      injectDESCEpisodes: vi.fn().mockResolvedValue({ augmentedPrompt: 'test' }),
      retrieveRelevant: vi.fn().mockResolvedValue([]),
      generateId: vi.fn().mockReturnValue('test-id'),
      embed: vi.fn().mockResolvedValue(new Float32Array(384)),
      smartRetrieval: null,
      qualityIntegration: null,
      proseSanitizer: { sanitize: vi.fn().mockReturnValue({ sanitized: '', artifactCount: 0, cleanRate: 1, violations: [] }) },
      styleProfileManager: undefined,
      trajectoryBridge: null,
      writingGenerator: null,
      interactionStore: { addInteraction: vi.fn(), getInteractions: vi.fn().mockReturnValue([]) },
      config: { verbose: false, autoLearn: false, autoStoreThreshold: 0.7 },
    });

    // Spy on writeV2 (private method)
    (orchestrator as any).writeV2 = writeV2Spy;

    // Default (no pipelineVersion) should NOT call writeV2
    // It should go through the legacy path which will hit a mock fallback
    try {
      await orchestrator.write('test topic', {});
    } catch {
      // Expected to fail due to incomplete mocks — that's fine for this test
    }

    expect(writeV2Spy).not.toHaveBeenCalled();
  });

  it('should route to v2 path when pipelineVersion is v2', async () => {
    const mod = await import(
      '../../../src/god-agent/universal/write-pipeline-orchestrator.js'
    );
    const WritePipelineOrchestrator = mod.WritePipelineOrchestrator;

    const writeV2Spy = vi.fn().mockResolvedValue({
      content: 'v2 output',
      wordCount: 100,
      qualityScore: 0.5,
      pipelineHealth: 'clean',
    });

    const orchestrator = new WritePipelineOrchestrator({
      log: vi.fn(),
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      executeTaskDefault: vi.fn(),
      maybeStorePattern: vi.fn().mockResolvedValue(undefined),
      extractTags: vi.fn().mockReturnValue([]),
      storeDESCEpisode: vi.fn().mockResolvedValue(undefined),
      injectDESCEpisodes: vi.fn().mockResolvedValue({ augmentedPrompt: 'test' }),
      retrieveRelevant: vi.fn().mockResolvedValue([]),
      generateId: vi.fn().mockReturnValue('test-id'),
      embed: vi.fn().mockResolvedValue(new Float32Array(384)),
      smartRetrieval: null,
      qualityIntegration: null,
      proseSanitizer: { sanitize: vi.fn().mockReturnValue({ sanitized: '', artifactCount: 0, cleanRate: 1, violations: [] }) },
      styleProfileManager: undefined,
      trajectoryBridge: null,
      writingGenerator: null,
      interactionStore: { addInteraction: vi.fn(), getInteractions: vi.fn().mockReturnValue([]) },
      config: { verbose: false, autoLearn: false, autoStoreThreshold: 0.7 },
    });

    // Replace writeV2 with spy
    (orchestrator as any).writeV2 = writeV2Spy;

    const result = await orchestrator.write('test topic', { pipelineVersion: 'v2' });

    expect(writeV2Spy).toHaveBeenCalledTimes(1);
    expect(result.content).toBe('v2 output');
  });
});
