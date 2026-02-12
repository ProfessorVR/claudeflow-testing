/**
 * ProvenanceLedger - Track claim-source relationships for academic integrity
 *
 * The provenance ledger maintains a record of:
 * - Where claims originated (local corpus, external, inferred)
 * - Citation linkages for each factual claim
 * - Verification status of claims
 * - Source utilization metrics
 *
 * This supports:
 * - Ensuring all claims are properly grounded
 * - Auditing source usage across the dissertation
 * - Identifying over-reliance on single sources
 * - Detecting ungrounded or weakly grounded claims
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Provenance Types
// ============================================================================

/**
 * Source type classification
 */
export type ProvenanceSourceType =
  | 'local_ku'      // Knowledge Unit from local corpus
  | 'local_chunk'   // Chunk from local document
  | 'external'      // External source (web, API)
  | 'inferred'      // Inferred/synthesized by the system
  | 'ungrounded';   // No source identified

/**
 * A single provenance entry linking a claim to its source
 */
export interface ProvenanceEntry {
  /** Unique claim identifier */
  claimId: string;

  /** The actual claim text */
  claimText: string;

  /** Chapter where the claim appears */
  chapterId: number;

  /** Paragraph index within the chapter */
  paragraphIndex: number;

  /** Source classification */
  sourceType: ProvenanceSourceType;

  /** Source identifier (KU ID, chunk ID, URL, etc.) */
  sourceId: string;

  /** Human-readable source reference (citation text) */
  sourceReference: string;

  /** Confidence in the claim-source linkage (0-1) */
  confidence: number;

  /** Whether the claim has been manually verified */
  verified: boolean;

  /** Additional metadata */
  metadata?: {
    /** Extraction timestamp */
    extractedAt: string;
    /** Verification timestamp */
    verifiedAt?: string;
    /** Verifier ID */
    verifiedBy?: string;
    /** Notes */
    notes?: string;
  };

  /** Endnote information (if generated) */
  endnote?: {
    /** Endnote number */
    number: number;
    /** Supporting quotations from corpus */
    supportingQuotations: Array<{
      text: string;
      source: string;
      relevance: number;
    }>;
    /** Whether endnote was included in output */
    included: boolean;
    /** Generation timestamp */
    generatedAt: string;
  };

  /** Source title (for citation formatting) */
  sourceTitle?: string;
}

/**
 * Source utilization report
 */
export interface SourceUtilization {
  localKUCount: number;
  localChunkCount: number;
  externalCount: number;
  inferredCount: number;
  ungroundedCount: number;
  totalCount: number;
  localRatio: number;
  groundedRatio: number;
}

/**
 * Provenance validation result
 */
export interface ProvenanceValidation {
  valid: boolean;
  ungroundedClaims: ProvenanceEntry[];
  weaklyGroundedClaims: ProvenanceEntry[];  // confidence < 0.5
  overUsedSources: Array<{ sourceId: string; count: number }>;
  verificationStats: {
    total: number;
    verified: number;
    unverified: number;
  };
}

/**
 * Claim detection result from text analysis
 */
export interface DetectedClaim {
  text: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  type: 'factual' | 'statistical' | 'attributive' | 'definitional';
  needsCitation: boolean;
}

// ============================================================================
// ProvenanceLedger Class
// ============================================================================

/**
 * Tracks claim-source relationships across the dissertation
 */
export class ProvenanceLedger {
  private entries: Map<string, ProvenanceEntry>;
  private chapterIndex: Map<number, Set<string>>;
  private sourceIndex: Map<string, Set<string>>;

  constructor() {
    this.entries = new Map();
    this.chapterIndex = new Map();
    this.sourceIndex = new Map();
  }

  // ============================================================================
  // Entry Management
  // ============================================================================

  /**
   * Add a new provenance entry
   *
   * @param entry - Entry data (claimId will be generated)
   * @returns Generated claim ID
   */
  addEntry(entry: Omit<ProvenanceEntry, 'claimId'>): string {
    const claimId = `claim_${uuidv4().substring(0, 8)}`;

    const fullEntry: ProvenanceEntry = {
      ...entry,
      claimId,
      metadata: {
        ...entry.metadata,
        extractedAt: new Date().toISOString(),
      },
    };

    this.entries.set(claimId, fullEntry);
    this.updateIndices(fullEntry);

    return claimId;
  }

  /**
   * Update an existing entry
   *
   * @param claimId - Claim to update
   * @param updates - Fields to update
   */
  updateEntry(claimId: string, updates: Partial<ProvenanceEntry>): void {
    const existing = this.entries.get(claimId);
    if (!existing) {
      throw new Error(`Claim ${claimId} not found`);
    }

    // Remove from old indices
    this.removeFromIndices(existing);

    // Apply updates
    const updated: ProvenanceEntry = {
      ...existing,
      ...updates,
      claimId, // Preserve original ID
    };

    this.entries.set(claimId, updated);
    this.updateIndices(updated);
  }

  /**
   * Get an entry by claim ID
   */
  getEntry(claimId: string): ProvenanceEntry | undefined {
    return this.entries.get(claimId);
  }

  /**
   * Delete an entry
   */
  deleteEntry(claimId: string): boolean {
    const entry = this.entries.get(claimId);
    if (!entry) return false;

    this.removeFromIndices(entry);
    this.entries.delete(claimId);
    return true;
  }

  /**
   * Mark an entry as verified
   */
  verifyEntry(claimId: string, verifiedBy?: string, notes?: string): void {
    const entry = this.entries.get(claimId);
    if (!entry) {
      throw new Error(`Claim ${claimId} not found`);
    }

    this.updateEntry(claimId, {
      verified: true,
      metadata: {
        ...entry.metadata,
        extractedAt: entry.metadata?.extractedAt || new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        verifiedBy,
        notes,
      },
    });
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get all entries for a chapter
   */
  getChapterEntries(chapterId: number): ProvenanceEntry[] {
    const claimIds = this.chapterIndex.get(chapterId);
    if (!claimIds) return [];

    return Array.from(claimIds)
      .map(id => this.entries.get(id))
      .filter((e): e is ProvenanceEntry => e !== undefined);
  }

  /**
   * Get all entries using a specific source
   */
  getEntriesBySource(sourceId: string): ProvenanceEntry[] {
    const claimIds = this.sourceIndex.get(sourceId);
    if (!claimIds) return [];

    return Array.from(claimIds)
      .map(id => this.entries.get(id))
      .filter((e): e is ProvenanceEntry => e !== undefined);
  }

  /**
   * Get all entries of a specific source type
   */
  getEntriesBySourceType(sourceType: ProvenanceSourceType): ProvenanceEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.sourceType === sourceType);
  }

  /**
   * Get ungrounded claims (no source identified)
   */
  getUngroundedClaims(): ProvenanceEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.sourceType === 'ungrounded');
  }

  /**
   * Get weakly grounded claims (low confidence)
   */
  getWeaklyGroundedClaims(threshold: number = 0.5): ProvenanceEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.sourceType !== 'ungrounded' && e.confidence < threshold);
  }

  /**
   * Get unverified claims
   */
  getUnverifiedClaims(): ProvenanceEntry[] {
    return Array.from(this.entries.values())
      .filter(e => !e.verified);
  }

  /**
   * Get all entries
   */
  getAllEntries(): ProvenanceEntry[] {
    return Array.from(this.entries.values());
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  /**
   * Get source utilization statistics
   */
  getSourceUtilization(): SourceUtilization {
    const entries = Array.from(this.entries.values());
    const total = entries.length;

    const localKUCount = entries.filter(e => e.sourceType === 'local_ku').length;
    const localChunkCount = entries.filter(e => e.sourceType === 'local_chunk').length;
    const externalCount = entries.filter(e => e.sourceType === 'external').length;
    const inferredCount = entries.filter(e => e.sourceType === 'inferred').length;
    const ungroundedCount = entries.filter(e => e.sourceType === 'ungrounded').length;

    const localTotal = localKUCount + localChunkCount;
    const groundedTotal = total - ungroundedCount;

    return {
      localKUCount,
      localChunkCount,
      externalCount,
      inferredCount,
      ungroundedCount,
      totalCount: total,
      localRatio: total > 0 ? localTotal / total : 0,
      groundedRatio: total > 0 ? groundedTotal / total : 0,
    };
  }

  /**
   * Validate provenance coverage
   */
  validateProvenance(): ProvenanceValidation {
    const entries = Array.from(this.entries.values());

    const ungroundedClaims = entries.filter(e => e.sourceType === 'ungrounded');
    const weaklyGroundedClaims = entries.filter(
      e => e.sourceType !== 'ungrounded' && e.confidence < 0.5
    );

    // Find over-used sources
    const sourceCounts = new Map<string, number>();
    for (const entry of entries) {
      if (entry.sourceType !== 'ungrounded') {
        sourceCounts.set(
          entry.sourceId,
          (sourceCounts.get(entry.sourceId) || 0) + 1
        );
      }
    }

    const threshold = Math.max(5, entries.length * 0.2);
    const overUsedSources = Array.from(sourceCounts.entries())
      .filter(([_, count]) => count > threshold)
      .map(([sourceId, count]) => ({ sourceId, count }))
      .sort((a, b) => b.count - a.count);

    // Verification stats
    const verified = entries.filter(e => e.verified).length;
    const unverified = entries.filter(e => !e.verified).length;

    const valid =
      ungroundedClaims.length === 0 &&
      weaklyGroundedClaims.length < entries.length * 0.1;

    return {
      valid,
      ungroundedClaims,
      weaklyGroundedClaims,
      overUsedSources,
      verificationStats: {
        total: entries.length,
        verified,
        unverified,
      },
    };
  }

  /**
   * Generate a human-readable audit report
   */
  generateAuditReport(): string {
    const sections: string[] = [];
    const utilization = this.getSourceUtilization();
    const validation = this.validateProvenance();

    sections.push('# PROVENANCE AUDIT REPORT');
    sections.push('');
    sections.push(`Generated: ${new Date().toISOString()}`);
    sections.push('');

    // Summary
    sections.push('## SUMMARY');
    sections.push('');
    sections.push(`Total Claims: ${utilization.totalCount}`);
    sections.push(`Grounded: ${utilization.totalCount - utilization.ungroundedCount} (${(utilization.groundedRatio * 100).toFixed(1)}%)`);
    sections.push(`Local Sources: ${utilization.localKUCount + utilization.localChunkCount} (${(utilization.localRatio * 100).toFixed(1)}%)`);
    sections.push(`Verified: ${validation.verificationStats.verified} (${utilization.totalCount > 0 ? ((validation.verificationStats.verified / utilization.totalCount) * 100).toFixed(1) : 0}%)`);
    sections.push('');

    // Source breakdown
    sections.push('## SOURCE BREAKDOWN');
    sections.push('');
    sections.push(`| Source Type | Count | Percentage |`);
    sections.push(`|-------------|-------|------------|`);
    sections.push(`| Local KU | ${utilization.localKUCount} | ${this.pct(utilization.localKUCount, utilization.totalCount)} |`);
    sections.push(`| Local Chunk | ${utilization.localChunkCount} | ${this.pct(utilization.localChunkCount, utilization.totalCount)} |`);
    sections.push(`| External | ${utilization.externalCount} | ${this.pct(utilization.externalCount, utilization.totalCount)} |`);
    sections.push(`| Inferred | ${utilization.inferredCount} | ${this.pct(utilization.inferredCount, utilization.totalCount)} |`);
    sections.push(`| Ungrounded | ${utilization.ungroundedCount} | ${this.pct(utilization.ungroundedCount, utilization.totalCount)} |`);
    sections.push('');

    // Issues
    if (!validation.valid) {
      sections.push('## ISSUES REQUIRING ATTENTION');
      sections.push('');

      if (validation.ungroundedClaims.length > 0) {
        sections.push('### Ungrounded Claims');
        sections.push('');
        for (const claim of validation.ungroundedClaims.slice(0, 10)) {
          sections.push(`- Chapter ${claim.chapterId}, Para ${claim.paragraphIndex + 1}: "${claim.claimText.substring(0, 80)}..."`);
        }
        if (validation.ungroundedClaims.length > 10) {
          sections.push(`... and ${validation.ungroundedClaims.length - 10} more`);
        }
        sections.push('');
      }

      if (validation.weaklyGroundedClaims.length > 0) {
        sections.push('### Weakly Grounded Claims (confidence < 50%)');
        sections.push('');
        for (const claim of validation.weaklyGroundedClaims.slice(0, 10)) {
          sections.push(`- Chapter ${claim.chapterId}: "${claim.claimText.substring(0, 60)}..." (${(claim.confidence * 100).toFixed(0)}%)`);
        }
        if (validation.weaklyGroundedClaims.length > 10) {
          sections.push(`... and ${validation.weaklyGroundedClaims.length - 10} more`);
        }
        sections.push('');
      }

      if (validation.overUsedSources.length > 0) {
        sections.push('### Over-Relied Sources');
        sections.push('');
        for (const source of validation.overUsedSources) {
          sections.push(`- ${source.sourceId}: ${source.count} claims`);
        }
        sections.push('');
      }
    } else {
      sections.push('## STATUS: VALID');
      sections.push('');
      sections.push('All claims are properly grounded and source diversity is acceptable.');
      sections.push('');
    }

    // Chapter breakdown
    sections.push('## CHAPTER BREAKDOWN');
    sections.push('');

    const chapterIds = Array.from(this.chapterIndex.keys()).sort((a, b) => a - b);
    for (const chapterId of chapterIds) {
      const chapterEntries = this.getChapterEntries(chapterId);
      const ungrounded = chapterEntries.filter(e => e.sourceType === 'ungrounded').length;
      const verified = chapterEntries.filter(e => e.verified).length;

      sections.push(`### Chapter ${chapterId}`);
      sections.push(`- Total claims: ${chapterEntries.length}`);
      sections.push(`- Ungrounded: ${ungrounded}`);
      sections.push(`- Verified: ${verified}/${chapterEntries.length}`);
      sections.push('');
    }

    return sections.join('\n');
  }

  // ============================================================================
  // Claim Detection (Heuristic)
  // ============================================================================

  /**
   * Detect claims in text that need provenance tracking
   */
  detectClaims(text: string): DetectedClaim[] {
    const claims: DetectedClaim[] = [];
    const paragraphs = text.split(/\n\s*\n/);

    // Patterns for different claim types
    const factualPatterns = [
      /\b\d+(\.\d+)?%\s+(of|percent)/i,
      /\b(studies|research|evidence|data)\s+(shows?|indicates?|suggests?|reveals?)/i,
      /\b(was|were)\s+(discovered|invented|developed|established)\s+(in|by)/i,
      /\b(is|are)\s+(known|believed|considered|regarded)\s+(to\s+be|as)/i,
    ];

    const statisticalPatterns = [
      /\bp\s*[<>=]\s*\d+\.\d+/i,
      /\b[nN]\s*=\s*\d+/,
      /\b\d+(?:\.\d+)?\s*%/,
      /\b(mean|median|average|standard\s+deviation)/i,
    ];

    const attributivePatterns = [
      /\b(\w+)\s+(argued?|claimed?|stated?|proposed?|suggested?|contended?)\s+that/i,
      /\b(according\s+to)\s+/i,
      /\b(\w+)\s+et\s+al\.?\s*\(\d{4}\)/i,
    ];

    const definitionalPatterns = [
      /\b(\w+)\s+is\s+defined\s+as/i,
      /\b(\w+)\s+refers?\s+to/i,
      /\bthe\s+term\s+"?\w+"?\s+(means?|denotes?|signifies?)/i,
    ];

    paragraphs.forEach((paragraph, pIndex) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let offset = 0;

      for (const sentence of sentences) {
        // Check factual claims
        if (factualPatterns.some(p => p.test(sentence))) {
          claims.push({
            text: sentence,
            paragraphIndex: pIndex,
            startOffset: offset,
            endOffset: offset + sentence.length,
            type: 'factual',
            needsCitation: true,
          });
        }
        // Check statistical claims
        else if (statisticalPatterns.some(p => p.test(sentence))) {
          claims.push({
            text: sentence,
            paragraphIndex: pIndex,
            startOffset: offset,
            endOffset: offset + sentence.length,
            type: 'statistical',
            needsCitation: true,
          });
        }
        // Check attributive claims
        else if (attributivePatterns.some(p => p.test(sentence))) {
          claims.push({
            text: sentence,
            paragraphIndex: pIndex,
            startOffset: offset,
            endOffset: offset + sentence.length,
            type: 'attributive',
            needsCitation: true,
          });
        }
        // Check definitional claims
        else if (definitionalPatterns.some(p => p.test(sentence))) {
          claims.push({
            text: sentence,
            paragraphIndex: pIndex,
            startOffset: offset,
            endOffset: offset + sentence.length,
            type: 'definitional',
            needsCitation: false, // Definitions often don't need citation
          });
        }

        offset += sentence.length + 1;
      }
    });

    return claims;
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Save ledger to file
   */
  async save(filePath: string): Promise<void> {
    const data = {
      version: 1,
      savedAt: new Date().toISOString(),
      entries: Array.from(this.entries.values()),
    };

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load ledger from file
   */
  async load(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Clear existing data
      this.entries.clear();
      this.chapterIndex.clear();
      this.sourceIndex.clear();

      // Load entries
      for (const entry of data.entries) {
        this.entries.set(entry.claimId, entry);
        this.updateIndices(entry);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, start fresh
        return;
      }
      throw error;
    }
  }

  /**
   * Merge another ledger into this one
   */
  merge(other: ProvenanceLedger): void {
    for (const entry of other.getAllEntries()) {
      // Check for duplicate claims (same text in same location)
      const existing = this.findDuplicateClaim(entry);
      if (existing) {
        // Update if newer entry has higher confidence
        if (entry.confidence > existing.confidence) {
          this.updateEntry(existing.claimId, entry);
        }
      } else {
        this.addEntry(entry);
      }
    }
  }

  /**
   * Get entry count
   */
  getEntryCount(): number {
    return this.entries.size;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
    this.chapterIndex.clear();
    this.sourceIndex.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private updateIndices(entry: ProvenanceEntry): void {
    // Chapter index
    if (!this.chapterIndex.has(entry.chapterId)) {
      this.chapterIndex.set(entry.chapterId, new Set());
    }
    this.chapterIndex.get(entry.chapterId)!.add(entry.claimId);

    // Source index
    if (entry.sourceType !== 'ungrounded') {
      if (!this.sourceIndex.has(entry.sourceId)) {
        this.sourceIndex.set(entry.sourceId, new Set());
      }
      this.sourceIndex.get(entry.sourceId)!.add(entry.claimId);
    }
  }

  private removeFromIndices(entry: ProvenanceEntry): void {
    // Chapter index
    this.chapterIndex.get(entry.chapterId)?.delete(entry.claimId);

    // Source index
    if (entry.sourceType !== 'ungrounded') {
      this.sourceIndex.get(entry.sourceId)?.delete(entry.claimId);
    }
  }

  private findDuplicateClaim(entry: ProvenanceEntry): ProvenanceEntry | undefined {
    const chapterEntries = this.getChapterEntries(entry.chapterId);
    return chapterEntries.find(
      e =>
        e.paragraphIndex === entry.paragraphIndex &&
        e.claimText === entry.claimText
    );
  }

  private pct(count: number, total: number): string {
    if (total === 0) return '0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new provenance ledger
 */
export function createProvenanceLedger(): ProvenanceLedger {
  return new ProvenanceLedger();
}

/**
 * Load provenance ledger from file
 */
export async function loadProvenanceLedger(filePath: string): Promise<ProvenanceLedger> {
  const ledger = new ProvenanceLedger();
  await ledger.load(filePath);
  return ledger;
}
