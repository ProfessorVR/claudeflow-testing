/**
 * Smoke tests for CCV Tier 1 activation precedence rules.
 *
 * Tests the three-knob activation system:
 * 1. Environment variable CCV_TIER1_ACTIVE (false/0 disables)
 * 2. Config enableCcvTier1 (explicit true/false)
 * 3. Default (enabled)
 *
 * Precedence: env disable > config > default
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InlineValidationOrchestrator,
  createInlineValidationOrchestrator,
} from '../../../../src/god-agent/core/writing/inline-validation-orchestrator.js';

// Minimal stubs for construction — we only care about the Tier 1 gate init
const stubGenerateFn = async () => '';
const stubRetriever = async () => [];
const stubChunks: any[] = [];
const stubSources: any[] = [];

describe('CCV Tier 1 Activation Precedence', () => {
  let savedEnv: string | undefined;

  beforeEach(() => {
    savedEnv = process.env.CCV_TIER1_ACTIVE;
  });

  afterEach(() => {
    if (savedEnv === undefined) {
      delete process.env.CCV_TIER1_ACTIVE;
    } else {
      process.env.CCV_TIER1_ACTIVE = savedEnv;
    }
  });

  // =========================================================================
  // ENV VAR PARSING
  // =========================================================================

  describe('env var parsing', () => {
    it('should disable Tier 1 when env=false (lowercase)', () => {
      process.env.CCV_TIER1_ACTIVE = 'false';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      // Access private field via any — this is a smoke test, not a unit test
      expect((orc as any).ccvTier1Gate).toBeNull();
    });

    it('should disable Tier 1 when env=False (mixed case)', () => {
      process.env.CCV_TIER1_ACTIVE = 'False';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      expect((orc as any).ccvTier1Gate).toBeNull();
    });

    it('should disable Tier 1 when env=FALSE (uppercase)', () => {
      process.env.CCV_TIER1_ACTIVE = 'FALSE';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      expect((orc as any).ccvTier1Gate).toBeNull();
    });

    it('should disable Tier 1 when env=0', () => {
      process.env.CCV_TIER1_ACTIVE = '0';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      expect((orc as any).ccvTier1Gate).toBeNull();
    });

    it('should enable Tier 1 when env is empty string (treated as unset)', () => {
      process.env.CCV_TIER1_ACTIVE = '';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      expect((orc as any).ccvTier1Gate).not.toBeNull();
    });

    it('should enable Tier 1 when env is unset', () => {
      delete process.env.CCV_TIER1_ACTIVE;
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      expect((orc as any).ccvTier1Gate).not.toBeNull();
    });

    it('should enable Tier 1 when env=true', () => {
      process.env.CCV_TIER1_ACTIVE = 'true';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      expect((orc as any).ccvTier1Gate).not.toBeNull();
    });
  });

  // =========================================================================
  // PRECEDENCE: ENV DISABLE > CONFIG ENABLE
  // =========================================================================

  describe('precedence: env disable overrides config enable', () => {
    it('should disable Tier 1 when env=false even if config says true', () => {
      process.env.CCV_TIER1_ACTIVE = 'false';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {
        enableCcvTier1: true,
      });
      expect((orc as any).ccvTier1Gate).toBeNull();
    });

    it('should disable Tier 1 when env=0 even if config says true', () => {
      process.env.CCV_TIER1_ACTIVE = '0';
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {
        enableCcvTier1: true,
      });
      expect((orc as any).ccvTier1Gate).toBeNull();
    });
  });

  // =========================================================================
  // PRECEDENCE: CONFIG DISABLE > DEFAULT ENABLE
  // =========================================================================

  describe('precedence: config disable overrides default', () => {
    it('should disable Tier 1 when config says false (env unset)', () => {
      delete process.env.CCV_TIER1_ACTIVE;
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {
        enableCcvTier1: false,
      });
      expect((orc as any).ccvTier1Gate).toBeNull();
    });
  });

  // =========================================================================
  // DEFAULT BEHAVIOR
  // =========================================================================

  describe('default behavior', () => {
    it('should enable Tier 1 by default (no env, no config)', () => {
      delete process.env.CCV_TIER1_ACTIVE;
      const orc = createInlineValidationOrchestrator(stubGenerateFn, stubRetriever, stubChunks, stubSources, {});
      expect((orc as any).ccvTier1Gate).not.toBeNull();
    });
  });
});

describe('Inline Validation Auto-Enable Precedence', () => {
  // These test the shouldUseInlineValidation logic conceptually.
  // The actual gate is in universal-agent.ts, but we test the logic pattern here.

  const MIN_CHUNKS = 3;

  function shouldUseInline(
    userOption: boolean | undefined,
    chunkCount: number,
    minChunks: number = MIN_CHUNKS,
  ): boolean {
    const hasUsableCorpus = chunkCount >= minChunks;
    const shouldUse = userOption ?? hasUsableCorpus;
    return shouldUse && hasUsableCorpus;
  }

  it('should auto-enable when chunks >= 3', () => {
    expect(shouldUseInline(undefined, 5)).toBe(true);
  });

  it('should NOT auto-enable when chunks < 3', () => {
    expect(shouldUseInline(undefined, 2)).toBe(false);
    expect(shouldUseInline(undefined, 0)).toBe(false);
  });

  it('should disable when user explicitly sets false even with chunks', () => {
    expect(shouldUseInline(false, 10)).toBe(false);
  });

  it('should NOT enable when user sets true but chunks insufficient', () => {
    // User wants inline but corpus is empty — can't succeed
    expect(shouldUseInline(true, 1)).toBe(false);
  });

  it('should enable when user sets true and chunks sufficient', () => {
    expect(shouldUseInline(true, 5)).toBe(true);
  });

  it('should respect custom minChunks threshold', () => {
    expect(shouldUseInline(undefined, 4, 5)).toBe(false);
    expect(shouldUseInline(undefined, 5, 5)).toBe(true);
    expect(shouldUseInline(undefined, 1, 1)).toBe(true);
  });
});
