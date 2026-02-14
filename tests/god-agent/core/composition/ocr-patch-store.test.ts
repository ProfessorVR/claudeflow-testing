/**
 * Tests for OCR Patch Store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  OCRPatchStore,
  classifyPatchDelta,
} from '../../../../src/god-agent/core/composition/ocr-patch-store.js';
import {
  DEFAULT_SEMANTIC_DELTA_POLICY,
  type OCRPatch,
} from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

let tmpDir: string;

function makePatch(overrides: Partial<OCRPatch> = {}): OCRPatch {
  return {
    patch_id: 'p1',
    doc_id: 'doc1',
    page: 1,
    before_range: [10, 15],
    after_range: [10, 14],
    before_hash: 'bh1',
    after_hash: 'ah1',
    before_text: 'ﬁrst',
    after_text: 'first',
    reason_tag: 'ligature',
    timestamp: new Date().toISOString(),
    author: 'user',
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('OCR Patch Store', () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-patch-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('recordPatch + getPatches', () => {
    it('should record and retrieve patches', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });
      const patch = makePatch();

      store.recordPatch(patch);
      const patches = store.getPatches('doc1');

      expect(patches.length).toBe(1);
      expect(patches[0].patch_id).toBe('p1');
      expect(patches[0].before_text).toBe('ﬁrst');
      expect(patches[0].after_text).toBe('first');
    });

    it('should append multiple patches', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });

      store.recordPatch(makePatch({ patch_id: 'p1' }));
      store.recordPatch(makePatch({ patch_id: 'p2', before_range: [20, 25], after_range: [20, 24] }));

      const patches = store.getPatches('doc1');
      expect(patches.length).toBe(2);
    });

    it('should return empty array for non-existent doc', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });
      const patches = store.getPatches('nonexistent');
      expect(patches.length).toBe(0);
    });
  });

  describe('applyPatches', () => {
    it('should apply a simple ligature patch', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });
      const rawOcr = 'The ﬁrst chapter discusses phantasia.';
      const patch = makePatch({
        before_range: [4, 9],
        after_range: [4, 9],
        before_text: 'ﬁrst',
        after_text: 'first',
      });

      const cleanText = store.applyPatches(rawOcr, [patch]);
      expect(cleanText).toBe('The first chapter discusses phantasia.');
    });

    it('should apply multiple patches sequentially', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });
      const rawOcr = 'The ﬁrst ﬂight was remarkable.';

      const patches = [
        makePatch({
          patch_id: 'p1',
          before_range: [4, 9],
          before_text: 'ﬁrst',
          after_text: 'first',
        }),
        makePatch({
          patch_id: 'p2',
          before_range: [10, 16],
          before_text: 'ﬂight',
          after_text: 'flight',
        }),
      ];

      const cleanText = store.applyPatches(rawOcr, patches);
      expect(cleanText).toContain('first');
      expect(cleanText).toContain('flight');
    });

    it('should be deterministic (same input → same output)', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });
      const rawOcr = 'Test ﬁrst text';
      const patch = makePatch({
        before_range: [5, 10],
        before_text: 'ﬁrst',
        after_text: 'first',
      });

      const result1 = store.applyPatches(rawOcr, [patch]);
      const result2 = store.applyPatches(rawOcr, [patch]);
      expect(result1).toBe(result2);
    });
  });

  describe('checkpoint', () => {
    it('should write and read checkpoints', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir, checkpointInterval: 2 });

      store.writeCheckpoint('doc1', 2, 'clean text at epoch 2', []);

      const checkpoint = store.getLatestCheckpoint('doc1');
      expect(checkpoint).not.toBeNull();
      expect(checkpoint!.epoch).toBe(2);
      expect(checkpoint!.clean_text_snapshot).toBe('clean text at epoch 2');
    });

    it('should return latest checkpoint', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });

      store.writeCheckpoint('doc1', 10, 'epoch 10', []);
      store.writeCheckpoint('doc1', 20, 'epoch 20', []);

      const checkpoint = store.getLatestCheckpoint('doc1');
      expect(checkpoint!.epoch).toBe(20);
    });

    it('should apply patches with checkpoint optimization', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir, checkpointInterval: 2 });

      // Record some patches
      store.recordPatch(makePatch({
        patch_id: 'p1',
        before_range: [4, 9],
        before_text: 'ﬁrst',
        after_text: 'first',
      }));

      // Write checkpoint
      store.writeCheckpoint('doc1', 1, 'The first chapter', []);

      // Record more patches
      store.recordPatch(makePatch({
        patch_id: 'p2',
        before_range: [4, 9],
        before_text: 'first',
        after_text: 'FIRST',
      }));

      // Apply with checkpoint — should only replay patch p2 from checkpoint
      const result = store.applyPatchesWithCheckpoint('doc1', 'The ﬁrst chapter');
      expect(result).toContain('FIRST');
    });
  });

  describe('buildIntervalMap', () => {
    it('should create interval edits from patches', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });
      const patches = [
        makePatch({ before_range: [10, 15], after_text: 'first' }),
        makePatch({ patch_id: 'p2', before_range: [20, 30], after_text: 'replaced' }),
      ];

      const map = store.buildIntervalMap(patches);
      expect(map.length).toBe(2);
      expect(map[0].epoch).toBe(1);
      expect(map[1].epoch).toBe(2);
    });
  });

  describe('document-first patches (test 12p)', () => {
    it('should apply patches deterministically even with no quotes existing', () => {
      const store = new OCRPatchStore({ baseDir: tmpDir });
      const rawOcr = 'The ﬁrst text.';
      const patch = makePatch({
        before_range: [4, 9],
        before_text: 'ﬁrst',
        after_text: 'first',
      });

      // No quotes registered anywhere
      store.recordPatch(patch);
      const result = store.applyPatches(rawOcr, [patch]);
      expect(result).toBe('The first text.');
    });
  });
});

describe('SemanticDeltaPolicy classification', () => {

  it('should classify whitespace-only changes as cosmetic', () => {
    const result = classifyPatchDelta('hello  world', 'hello world');
    expect(result).toBe('cosmetic');
  });

  it('should classify ligature normalization as cosmetic', () => {
    // Token-level the words are the same after normalization
    const result = classifyPatchDelta('ﬁrst', 'first');
    expect(result).toBe('cosmetic');
  });

  it('should classify word substitution as semantic', () => {
    const result = classifyPatchDelta('The cat sat', 'The dog sat');
    expect(result).toBe('semantic');
  });

  it('should classify large deletions as semantic', () => {
    const result = classifyPatchDelta(
      'This is a long sentence with many words that should trigger semantic change.',
      'This is short.',
    );
    expect(result).toBe('semantic');
  });
});
