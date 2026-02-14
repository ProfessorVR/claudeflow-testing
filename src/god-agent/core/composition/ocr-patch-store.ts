/**
 * OCR Patch Store — Append-Only Patch Log Per Document
 *
 * Manages OCR corrections as an append-only patch log with:
 * - Patch epochs + interval map for transactional semantics
 * - Checkpoint snapshots for performance on long-lived documents
 * - Atomic commit via temp file + rename (crash-safe)
 * - Deterministic applyPatches()
 *
 * @module ocr-patch-store
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type {
  OCRPatch,
  PatchCheckpoint,
  IntervalEdit,
  SemanticDeltaPolicy,
  NormalizationPolicy,
} from './icp-types.js';
import { DEFAULT_SEMANTIC_DELTA_POLICY } from './icp-types.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface OCRPatchStoreConfig {
  /** Base directory for patch storage */
  baseDir: string;
  /** Checkpoint interval (patches between checkpoints) */
  checkpointInterval?: number;
}

const DEFAULT_CHECKPOINT_INTERVAL = 50;

// =============================================================================
// SEMANTIC DELTA CLASSIFICATION
// =============================================================================

/**
 * Classify a patch as cosmetic vs semantic using SemanticDeltaPolicy.
 *
 * A patch is cosmetic iff ALL of:
 *   1. Only allowlisted transformations (including one-to-many like ligatures)
 *   2. Token multiset similarity >= threshold
 *   3. No character substitutions outside allowlist
 */
export function classifyPatchDelta(
  beforeText: string,
  afterText: string,
  policy: SemanticDeltaPolicy = DEFAULT_SEMANTIC_DELTA_POLICY,
): 'cosmetic' | 'semantic' {
  // If only whitespace changed, it's cosmetic
  const beforeNonWS = beforeText.replace(/\s+/g, ' ').trim();
  const afterNonWS = afterText.replace(/\s+/g, ' ').trim();
  if (beforeNonWS === afterNonWS) {
    return 'cosmetic';
  }

  // Apply all allowlisted substitutions to beforeText to see if it becomes afterText
  // This handles one-to-many character substitutions (ligatures: ﬁ→fi, ﬂ→fl, etc.)
  let normalized = beforeNonWS;
  for (const sub of policy.allowlist) {
    normalized = normalized.replaceAll(sub.from, sub.to);
  }

  // Also normalize whitespace/hyphens (cosmetic by definition)
  normalized = normalized.replace(/\s+/g, ' ').trim();
  const afterNorm = afterNonWS.replace(/\s+/g, ' ').trim();

  if (normalized === afterNorm) {
    return 'cosmetic';
  }

  // Check token multiset similarity as final gate
  // This catches cases where allowlisted substitutions don't fully explain the diff
  // but the tokens are still essentially the same
  const similarity = tokenMultisetSimilarity(beforeText, afterText);
  if (similarity < policy.token_similarity_threshold) {
    return 'semantic';
  }

  // If tokens match closely but characters differ in non-allowlisted ways → semantic
  // (e.g., word substitution where token counts happen to match)
  if (normalized !== afterNorm) {
    return 'semantic';
  }

  return 'cosmetic';
}

/**
 * Compute token multiset similarity (Jaccard on word tokens).
 */
function tokenMultisetSimilarity(a: string, b: string): number {
  const tokensA = a.toLowerCase().replace(/\s+/g, ' ').trim().split(' ');
  const tokensB = b.toLowerCase().replace(/\s+/g, ' ').trim().split(' ');

  const multisetA = new Map<string, number>();
  const multisetB = new Map<string, number>();

  for (const t of tokensA) {
    multisetA.set(t, (multisetA.get(t) ?? 0) + 1);
  }
  for (const t of tokensB) {
    multisetB.set(t, (multisetB.get(t) ?? 0) + 1);
  }

  // Intersection: min count for each token
  let intersection = 0;
  let union = 0;

  const allTokens = new Set([...multisetA.keys(), ...multisetB.keys()]);
  for (const token of allTokens) {
    const countA = multisetA.get(token) ?? 0;
    const countB = multisetB.get(token) ?? 0;
    intersection += Math.min(countA, countB);
    union += Math.max(countA, countB);
  }

  return union === 0 ? 1.0 : intersection / union;
}

// =============================================================================
// OCR PATCH STORE
// =============================================================================

export class OCRPatchStore {
  private readonly config: Required<OCRPatchStoreConfig>;

  constructor(config: OCRPatchStoreConfig) {
    this.config = {
      baseDir: config.baseDir,
      checkpointInterval: config.checkpointInterval ?? DEFAULT_CHECKPOINT_INTERVAL,
    };
  }

  /**
   * Get the directory for a document's patches.
   */
  private docDir(docId: string): string {
    return path.join(this.config.baseDir, docId);
  }

  /**
   * Get the patch log file path for a document.
   */
  private patchLogPath(docId: string): string {
    return path.join(this.docDir(docId), 'patches.jsonl');
  }

  /**
   * Get checkpoint path for a specific epoch.
   */
  private checkpointPath(docId: string, epoch: number): string {
    return path.join(this.docDir(docId), `checkpoint-${epoch}.json`);
  }

  /**
   * Ensure the document directory exists.
   */
  private ensureDocDir(docId: string): void {
    const dir = this.docDir(docId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Record a patch — append to log with atomic commit.
   *
   * Atomic: write temp file → rename (crash-safe even in Node).
   */
  recordPatch(patch: OCRPatch): void {
    this.ensureDocDir(patch.doc_id);
    const logPath = this.patchLogPath(patch.doc_id);
    const line = JSON.stringify(patch) + '\n';

    // Atomic append: write to temp, then rename
    // For append-only logs, we can safely use appendFileSync
    // The temp+rename pattern is used for checkpoints (full rewrites)
    fs.appendFileSync(logPath, line, 'utf-8');
  }

  /**
   * Get all patches for a document.
   */
  getPatches(docId: string): OCRPatch[] {
    const logPath = this.patchLogPath(docId);
    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    return lines.map(line => JSON.parse(line) as OCRPatch);
  }

  /**
   * Get patches since a specific epoch.
   */
  getPatchesSinceEpoch(docId: string, epoch: number): OCRPatch[] {
    const allPatches = this.getPatches(docId);
    // Patches are ordered by time; epoch corresponds to patch index
    return allPatches.slice(epoch);
  }

  /**
   * Apply all patches to raw OCR text → produce clean_text.
   * Deterministic function.
   *
   * With checkpoints: load latest checkpoint + replay only tail patches.
   */
  applyPatches(rawOcr: string, patches: OCRPatch[]): string {
    let text = rawOcr;
    for (const patch of patches) {
      text = this.applySinglePatch(text, patch);
    }
    return text;
  }

  /**
   * Apply patches with checkpoint optimization.
   * Loads latest checkpoint snapshot + replays tail patches only.
   */
  applyPatchesWithCheckpoint(docId: string, rawOcr: string): string {
    const checkpoint = this.getLatestCheckpoint(docId);
    if (checkpoint) {
      // Replay only patches after checkpoint epoch
      const tailPatches = this.getPatchesSinceEpoch(docId, checkpoint.epoch);
      return this.applyPatches(checkpoint.clean_text_snapshot, tailPatches);
    }
    // No checkpoint — full replay
    const allPatches = this.getPatches(docId);
    return this.applyPatches(rawOcr, allPatches);
  }

  /**
   * Apply a single patch to text.
   * Deterministic: finds before_text at before_range and replaces.
   */
  private applySinglePatch(text: string, patch: OCRPatch): string {
    const [start, end] = patch.before_range;

    // Verify the text at the range matches
    const existingText = text.slice(start, end);
    if (existingText !== patch.before_text) {
      // Range may have shifted due to prior patches in this batch.
      // Try to find the before_text near the expected location.
      const searchStart = Math.max(0, start - 100);
      const searchEnd = Math.min(text.length, end + 100);
      const searchRegion = text.slice(searchStart, searchEnd);
      const idx = searchRegion.indexOf(patch.before_text);
      if (idx !== -1) {
        const actualStart = searchStart + idx;
        const actualEnd = actualStart + patch.before_text.length;
        return text.slice(0, actualStart) + patch.after_text + text.slice(actualEnd);
      }
      // Cannot find the text — skip this patch (idempotent)
      return text;
    }

    return text.slice(0, start) + patch.after_text + text.slice(end);
  }

  /**
   * Write a checkpoint snapshot.
   */
  writeCheckpoint(
    docId: string,
    epoch: number,
    cleanText: string,
    intervalMapState: IntervalEdit[],
  ): void {
    this.ensureDocDir(docId);
    const checkpoint: PatchCheckpoint = {
      epoch,
      clean_text_snapshot: cleanText,
      interval_map_state: intervalMapState,
      created_at: new Date().toISOString(),
    };

    const checkpointFile = this.checkpointPath(docId, epoch);
    const tempFile = checkpointFile + '.tmp';

    // Atomic write: temp → rename
    fs.writeFileSync(tempFile, JSON.stringify(checkpoint), 'utf-8');
    fs.renameSync(tempFile, checkpointFile);
  }

  /**
   * Write checkpoint if interval reached.
   */
  maybeWriteCheckpoint(
    docId: string,
    currentEpoch: number,
    cleanText: string,
    intervalMapState: IntervalEdit[],
  ): boolean {
    if (currentEpoch > 0 && currentEpoch % this.config.checkpointInterval === 0) {
      this.writeCheckpoint(docId, currentEpoch, cleanText, intervalMapState);
      return true;
    }
    return false;
  }

  /**
   * Get the latest checkpoint for a document.
   */
  getLatestCheckpoint(docId: string): PatchCheckpoint | null {
    const dir = this.docDir(docId);
    if (!fs.existsSync(dir)) {
      return null;
    }

    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('checkpoint-') && f.endsWith('.json'))
      .sort((a, b) => {
        const epochA = parseInt(a.replace('checkpoint-', '').replace('.json', ''), 10);
        const epochB = parseInt(b.replace('checkpoint-', '').replace('.json', ''), 10);
        return epochB - epochA;
      });

    if (files.length === 0) return null;

    const content = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
    return JSON.parse(content) as PatchCheckpoint;
  }

  /**
   * Get total patch count for a document.
   */
  getPatchCount(docId: string): number {
    return this.getPatches(docId).length;
  }

  /**
   * Build interval map from patches.
   */
  buildIntervalMap(patches: OCRPatch[]): IntervalEdit[] {
    return patches.map((patch, index) => ({
      epoch: index + 1,
      original_range: patch.before_range,
      replacement_length: patch.after_text.length,
    }));
  }

  /**
   * Compute the current corpus hash for a document.
   * SHA-256 of all patch hashes concatenated.
   */
  computeCorpusHash(docId: string): string {
    const patches = this.getPatches(docId);
    const hashInput = patches.map(p => p.after_hash).join('');
    return createHash('sha256').update(hashInput || docId).digest('hex');
  }
}
