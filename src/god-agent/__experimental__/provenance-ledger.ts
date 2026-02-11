/** @deprecated Test-only / experimental module. Do not import in production. */

/**
 * Provenance Ledger - Citation source tracking and claim mapping
 *
 * Tracks the provenance of claims and citations in generated content:
 * - Citation source tracking
 * - Claim-to-source mapping
 * - Provenance chain for statements
 * - Verification trail
 *
 * Reference: PhD pipeline provenance tracking
 *
 * Integration Points:
 * - QualityGauntlet - Verify citation completeness
 * - UniversalAgent - Track sources during research/write
 *
 * Usage:
 * ```typescript
 * const ledger = new ProvenanceLedger();
 * ledger.addClaim('AI can process language', 'research-paper-123');
 * const provenance = ledger.getClaimProvenance(claimId);
 * ```
 */

import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';

const logger = createComponentLogger('ProvenanceLedger', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Citation source
 */
export interface CitationSource {
  /** Source ID */
  id: string;

  /** Source type */
  type: 'research' | 'knowledge-base' | 'web' | 'document' | 'user-provided';

  /** Source title/name */
  title: string;

  /** Source URL or path */
  url?: string;

  /** Authors */
  authors?: string[];

  /** Publication date */
  publicationDate?: string;

  /** Access date */
  accessDate: string;

  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Claim in generated content
 */
export interface Claim {
  /** Claim ID */
  id: string;

  /** Claim text */
  text: string;

  /** Location in content (paragraph, sentence) */
  location: {
    paragraph: number;
    sentence?: number;
    startChar: number;
    endChar: number;
  };

  /** Source IDs supporting this claim */
  sourceIds: string[];

  /** Claim type */
  type: 'fact' | 'opinion' | 'analysis' | 'synthesis';

  /** Verification status */
  verified: boolean;

  /** Timestamp */
  timestamp: string;
}

/**
 * Provenance chain entry
 */
export interface ProvenanceEntry {
  /** Claim ID */
  claimId: string;

  /** Source ID */
  sourceId: string;

  /** Relationship type */
  relationship: 'directly-cited' | 'synthesized-from' | 'inferred-from' | 'background';

  /** Confidence in this link (0-1) */
  confidence: number;

  /** Timestamp */
  timestamp: string;
}

/**
 * Provenance report for a claim
 */
export interface ClaimProvenance {
  /** Claim details */
  claim: Claim;

  /** Sources supporting this claim */
  sources: CitationSource[];

  /** Provenance chain */
  chain: ProvenanceEntry[];

  /** Overall provenance score (0-1) */
  score: number;

  /** Verification notes */
  notes?: string;
}

// ============================================================================
// Provenance Ledger Class
// ============================================================================

/**
 * Tracks provenance of claims and citations
 */
export class ProvenanceLedger {
  private sources: Map<string, CitationSource> = new Map();
  private claims: Map<string, Claim> = new Map();
  private provenanceChain: ProvenanceEntry[] = [];
  private claimCounter = 0;
  private sourceCounter = 0;

  /**
   * Add a citation source
   */
  addSource(source: Omit<CitationSource, 'id'>): string {
    const id = `source-${++this.sourceCounter}`;
    const fullSource: CitationSource = { ...source, id };
    this.sources.set(id, fullSource);

    logger.log(LogLevel.DEBUG, `Added source: ${id} (${source.title})`);

    return id;
  }

  /**
   * Add a claim with sources
   */
  addClaim(
    text: string,
    location: Claim['location'],
    sourceIds: string[],
    type: Claim['type'] = 'fact'
  ): string {
    const id = `claim-${++this.claimCounter}`;

    // Verify sources exist
    const validSourceIds = sourceIds.filter(sid => this.sources.has(sid));
    if (validSourceIds.length < sourceIds.length) {
      logger.log(LogLevel.WARNING, `Some sources not found for claim: ${id}`);
    }

    const claim: Claim = {
      id,
      text,
      location,
      sourceIds: validSourceIds,
      type,
      verified: validSourceIds.length > 0,
      timestamp: new Date().toISOString(),
    };

    this.claims.set(id, claim);

    // Create provenance entries
    for (const sourceId of validSourceIds) {
      this.provenanceChain.push({
        claimId: id,
        sourceId,
        relationship: 'directly-cited',
        confidence: this.sources.get(sourceId)?.confidence ?? 0.5,
        timestamp: new Date().toISOString(),
      });
    }

    logger.log(LogLevel.DEBUG, `Added claim: ${id} with ${validSourceIds.length} sources`);

    return id;
  }

  /**
   * Link a claim to a source with relationship
   */
  linkClaimToSource(
    claimId: string,
    sourceId: string,
    relationship: ProvenanceEntry['relationship'],
    confidence: number = 0.8
  ): void {
    const claim = this.claims.get(claimId);
    const source = this.sources.get(sourceId);

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Add source to claim
    if (!claim.sourceIds.includes(sourceId)) {
      claim.sourceIds.push(sourceId);
      claim.verified = true;
    }

    // Add provenance entry
    this.provenanceChain.push({
      claimId,
      sourceId,
      relationship,
      confidence,
      timestamp: new Date().toISOString(),
    });

    logger.log(LogLevel.DEBUG, `Linked claim ${claimId} to source ${sourceId} (${relationship})`);
  }

  /**
   * Get provenance for a claim
   */
  getClaimProvenance(claimId: string): ClaimProvenance | undefined {
    const claim = this.claims.get(claimId);
    if (!claim) {
      return undefined;
    }

    // Get all provenance entries for this claim
    const chain = this.provenanceChain.filter(e => e.claimId === claimId);

    // Get sources
    const sources = claim.sourceIds
      .map(sid => this.sources.get(sid))
      .filter(s => s !== undefined) as CitationSource[];

    // Calculate overall provenance score
    const score = this.calculateProvenanceScore(claim, sources, chain);

    return {
      claim,
      sources,
      chain,
      score,
    };
  }

  /**
   * Get all uncited claims
   */
  getUncitedClaims(): Claim[] {
    return Array.from(this.claims.values()).filter(c => c.sourceIds.length === 0);
  }

  /**
   * Get all claims
   */
  getAllClaims(): Claim[] {
    return Array.from(this.claims.values());
  }

  /**
   * Get all sources
   */
  getAllSources(): CitationSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get citation completeness score
   */
  getCitationCompleteness(): number {
    const totalClaims = this.claims.size;
    if (totalClaims === 0) return 1.0;

    const citedClaims = Array.from(this.claims.values()).filter(c => c.sourceIds.length > 0).length;
    return citedClaims / totalClaims;
  }

  /**
   * Generate provenance report
   */
  generateReport(): string {
    const lines = [
      '',
      '='.repeat(80),
      'PROVENANCE LEDGER REPORT',
      '='.repeat(80),
      `Total Claims: ${this.claims.size}`,
      `Total Sources: ${this.sources.size}`,
      `Citation Completeness: ${(this.getCitationCompleteness() * 100).toFixed(1)}%`,
      `Uncited Claims: ${this.getUncitedClaims().length}`,
      '',
    ];

    // Show uncited claims
    const uncited = this.getUncitedClaims();
    if (uncited.length > 0) {
      lines.push('⚠️  Uncited Claims:');
      for (const claim of uncited.slice(0, 5)) {
        lines.push(`  - ${claim.text.slice(0, 100)}...`);
      }
      if (uncited.length > 5) {
        lines.push(`  ... and ${uncited.length - 5} more`);
      }
      lines.push('');
    }

    // Show sources
    lines.push('Sources:');
    for (const source of Array.from(this.sources.values()).slice(0, 10)) {
      lines.push(`  ${source.id}: ${source.title} (${source.type})`);
    }
    if (this.sources.size > 10) {
      lines.push(`  ... and ${this.sources.size - 10} more`);
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Export ledger data
   */
  exportData(): {
    sources: CitationSource[];
    claims: Claim[];
    provenanceChain: ProvenanceEntry[];
  } {
    return {
      sources: Array.from(this.sources.values()),
      claims: Array.from(this.claims.values()),
      provenanceChain: this.provenanceChain,
    };
  }

  /**
   * Import ledger data
   */
  importData(data: {
    sources: CitationSource[];
    claims: Claim[];
    provenanceChain: ProvenanceEntry[];
  }): void {
    this.sources.clear();
    this.claims.clear();
    this.provenanceChain = [];

    for (const source of data.sources) {
      this.sources.set(source.id, source);
    }

    for (const claim of data.claims) {
      this.claims.set(claim.id, claim);
    }

    this.provenanceChain = [...data.provenanceChain];

    logger.log(
      LogLevel.INFO,
      `Imported ${data.sources.length} sources, ${data.claims.length} claims`
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Calculate provenance score for a claim
   */
  private calculateProvenanceScore(
    claim: Claim,
    sources: CitationSource[],
    chain: ProvenanceEntry[]
  ): number {
    if (sources.length === 0) {
      return 0;
    }

    // Base score from source count
    const sourceScore = Math.min(sources.length / 3, 1.0) * 0.4;

    // Source confidence average
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
    const confidenceScore = avgConfidence * 0.3;

    // Chain strength (direct citations are better)
    const directCitations = chain.filter(e => e.relationship === 'directly-cited').length;
    const chainScore = Math.min(directCitations / sources.length, 1.0) * 0.3;

    return sourceScore + confidenceScore + chainScore;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a provenance ledger
 */
export function createProvenanceLedger(): ProvenanceLedger {
  return new ProvenanceLedger();
}
