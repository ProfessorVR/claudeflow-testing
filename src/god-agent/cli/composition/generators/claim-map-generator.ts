/**
 * Claim Map Generator - Extract Toulmin structures from text
 *
 * This module generates claim maps from text by identifying claims,
 * grounds, warrants, and other Toulmin components.
 *
 * @module claim-map-generator
 */

import type {
  ToulminClaim,
  ClaimMap,
  ClaimHierarchy,
  ClaimSection,
  CitationAnchor,
  ClaimLocation,
  ClaimMapMetadata,
  ValidationStatus
} from '../sir/claim-map.js';

import {
  calculateToulminCompleteness,
  calculateWarrantGenerality,
  calculateClaimQuality,
  validateClaimMap
} from '../sir/claim-map.js';

/**
 * Options for claim map generation
 */
export interface ClaimMapGeneratorOptions {
  /** Source text to analyze */
  text: string;

  /** Document structure (sections) */
  sections?: ParsedSectionStructure[];

  /** Existing citations to link */
  citations?: CitationAnchor[];

  /** Minimum completeness score required */
  minCompletenessScore?: number;

  /** Minimum warrant generality required */
  minWarrantGenerality?: number;
}

/**
 * Section structure for organizing claims
 */
export interface ParsedSectionStructure {
  /** Section ID */
  id: string;

  /** Section title */
  title: string;

  /** Subsections (recursive) */
  subsections?: ParsedSectionStructure[];

  /** Start line in document */
  startLine: number;

  /** End line in document */
  endLine: number;
}

/**
 * Result of claim map generation
 */
export interface ClaimMapGenerationResult {
  /** Generated claim map */
  claimMap: ClaimMap;

  /** Validation status */
  validation: ValidationStatus;

  /** Generation metadata */
  metadata: ClaimMapGenerationMetadata;
}

/**
 * Generation metadata
 */
export interface ClaimMapGenerationMetadata {
  /** Number of claims extracted */
  claimsExtracted: number;

  /** Number of complete claims (C+D+W) */
  completeClaims: number;

  /** Average completeness score */
  averageCompleteness: number;

  /** Extraction confidence (0-1) */
  extractionConfidence: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * ClaimMapGenerator - Main generator class
 */
export class ClaimMapGenerator {
  private options: Required<ClaimMapGeneratorOptions>;

  constructor(options: ClaimMapGeneratorOptions) {
    this.options = {
      ...options,
      sections: options.sections || [],
      citations: options.citations || [],
      minCompletenessScore: options.minCompletenessScore || 0.70,
      minWarrantGenerality: options.minWarrantGenerality || 0.60
    };
  }

  /**
   * Generate claim map from text
   */
  async generate(): Promise<ClaimMapGenerationResult> {
    const startTime = Date.now();

    // Step 1: Extract claim candidates
    const claimCandidates = this.extractClaimCandidates(this.options.text);

    // Step 2: Identify Toulmin components for each claim
    const claims = await this.buildToulminStructures(claimCandidates);

    // Step 3: Build dependency graph
    const dependencies = this.buildDependencies(claims);

    // Step 4: Organize into hierarchy
    const hierarchy = this.buildHierarchy(claims);

    // Step 5: Calculate metadata
    const metadata = this.calculateMetadata(claims);

    // Build claim map
    const claimMap: ClaimMap = {
      claims,
      dependencies,
      hierarchy,
      metadata
    };

    // Validate
    const validation = validateClaimMap(claimMap);

    const processingTime = Date.now() - startTime;

    return {
      claimMap,
      validation,
      metadata: {
        claimsExtracted: claims.length,
        completeClaims: claims.filter(c => c.completenessScore >= 0.70).length,
        averageCompleteness: metadata.averageCompletenessScore,
        extractionConfidence: this.calculateExtractionConfidence(claims),
        processingTime
      }
    };
  }

  /**
   * Extract claim candidates from text
   */
  private extractClaimCandidates(text: string): ClaimCandidate[] {
    const candidates: ClaimCandidate[] = [];
    const lines = text.split('\n');

    let currentSection = '1';
    let paragraphIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect section headers
      if (this.isSectionHeader(line)) {
        currentSection = this.extractSectionId(line);
        paragraphIndex = 0;
        continue;
      }

      // Identify claims (sentences with assertive statements)
      if (this.looksLikeClaim(line)) {
        candidates.push({
          text: line,
          location: {
            sectionId: currentSection,
            paragraphIndex,
            sentenceIndex: 0
          },
          confidence: this.estimateClaimConfidence(line)
        });
      }

      paragraphIndex++;
    }

    return candidates;
  }

  /**
   * Check if line is section header
   */
  private isSectionHeader(line: string): boolean {
    // Simple heuristic: starts with # or contains "Section" or "Chapter"
    return /^#+\s/.test(line) || /^(Section|Chapter)\s+\d+/.test(line);
  }

  /**
   * Extract section ID from header
   */
  private extractSectionId(line: string): string {
    const match = line.match(/(\d+(\.\d+)*)/);
    return match ? match[1] : '1';
  }

  /**
   * Check if line looks like a claim
   */
  private looksLikeClaim(line: string): boolean {
    // Heuristics for claims:
    // - Contains assertive verbs (is, are, demonstrates, shows)
    // - Not a question
    // - Not too short (< 10 words)
    // - Not a citation line

    if (line.endsWith('?')) return false;
    if (line.split(/\s+/).length < 10) return false;
    if (/^\d+\./.test(line)) return false; // Numbered list
    if (/^[•\-\*]/.test(line)) return false; // Bullet point

    const assertiveVerbs = /\b(is|are|was|were|demonstrates?|shows?|proves?|establishes?|argues?|claims?)\b/i;
    return assertiveVerbs.test(line);
  }

  /**
   * Estimate confidence that line is a claim
   */
  private estimateClaimConfidence(line: string): number {
    let confidence = 0.5;

    // Boost for assertive language
    if (/\b(is|are|demonstrates?|shows?)\b/i.test(line)) confidence += 0.2;

    // Boost for causal language
    if (/\b(because|therefore|thus|hence)\b/i.test(line)) confidence += 0.1;

    // Penalty for hedging (might be evidence, not claim)
    if (/\b(might|may|could|possibly)\b/i.test(line)) confidence -= 0.1;

    return Math.min(1.0, Math.max(0, confidence));
  }

  /**
   * Build Toulmin structures for claim candidates
   */
  private async buildToulminStructures(
    candidates: ClaimCandidate[]
  ): Promise<ToulminClaim[]> {
    const claims: ToulminClaim[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];

      // Extract grounds (evidence following claim)
      const grounds = this.extractGrounds(candidate, i, candidates);

      // Extract warrant (reasoning)
      const warrant = this.extractWarrant(candidate, grounds);

      // Extract backing (if present)
      const backing = this.extractBacking(candidate);

      // Extract qualification (if present)
      const qualification = this.extractQualification(candidate);

      // Extract rebuttal (if present)
      const rebuttal = this.extractRebuttal(candidate);

      // Link citations
      const citations = this.linkCitations(candidate.text);

      // Calculate scores
      const warrantGenerality = calculateWarrantGenerality(candidate.text, warrant);
      const completenessScore = calculateToulminCompleteness({
        claim: candidate.text,
        grounds,
        warrant,
        backing,
        qualification,
        rebuttal
      });

      const claim: ToulminClaim = {
        id: `C${i + 1}`,
        claim: candidate.text,
        grounds,
        warrant,
        backing,
        qualification,
        rebuttal,
        warrantGenerality,
        completenessScore,
        citations,
        location: candidate.location,
        quality: {
          toulminCompleteness: 0,
          warrantQuality: 0,
          evidenceStrength: 0,
          counterArgumentHandling: 0,
          overallScore: 0
        }
      };

      // Calculate quality metrics
      claim.quality = calculateClaimQuality(claim);

      claims.push(claim);
    }

    return claims;
  }

  /**
   * Extract grounds (evidence) for claim
   */
  private extractGrounds(
    claim: ClaimCandidate,
    claimIndex: number,
    allCandidates: ClaimCandidate[]
  ): string[] {
    const grounds: string[] = [];

    // Look for evidence markers in surrounding text
    const evidenceMarkers = /\b(as|because|since|given that|evidence shows|studies indicate)\b/i;

    // Check if claim text contains embedded evidence
    if (evidenceMarkers.test(claim.text)) {
      // Extract evidence clause
      const parts = claim.text.split(evidenceMarkers);
      if (parts.length > 1) {
        grounds.push(parts[1].trim());
      }
    }

    // Look for citations in claim text (these are grounds)
    const citationPattern = /\([^)]+\d{4}[^)]*\)/g;
    const citations = claim.text.match(citationPattern);
    if (citations) {
      for (const citation of citations) {
        grounds.push(`Citation: ${citation}`);
      }
    }

    // If no grounds found, use heuristic: assume previous sentence might be evidence
    if (grounds.length === 0 && claimIndex > 0) {
      const previousCandidate = allCandidates[claimIndex - 1];
      if (this.looksLikeEvidence(previousCandidate.text)) {
        grounds.push(previousCandidate.text);
      }
    }

    return grounds;
  }

  /**
   * Check if text looks like evidence
   */
  private looksLikeEvidence(text: string): boolean {
    const evidenceMarkers = /\b(data|evidence|study|research|found|showed|demonstrated)\b/i;
    const hasCitation = /\([^)]+\d{4}[^)]*\)/.test(text);
    return evidenceMarkers.test(text) || hasCitation;
  }

  /**
   * Extract warrant (reasoning)
   */
  private extractWarrant(claim: ClaimCandidate, grounds: string[]): string {
    // Heuristic: warrant explains why grounds support claim
    // Often contains words like "because", "since", "therefore"

    const warrantMarkers = /\b(because|since|therefore|thus|hence|given that)\b/i;

    // Check if claim contains warrant marker
    const match = claim.text.match(warrantMarkers);
    if (match) {
      const parts = claim.text.split(warrantMarkers);
      if (parts.length > 1) {
        return `${match[0]} ${parts[1].trim()}`;
      }
    }

    // Default: construct warrant from claim and grounds
    if (grounds.length > 0) {
      return `When ${grounds[0]}, it follows that ${claim.text}`;
    }

    // Fallback: generic warrant
    return `This claim is supported by the evidence provided`;
  }

  /**
   * Extract backing (support for warrant)
   */
  private extractBacking(claim: ClaimCandidate): string | undefined {
    // Backing often references general principles or theories
    const backingMarkers = /\b(general principle|theory|framework|as established|according to)\b/i;

    if (backingMarkers.test(claim.text)) {
      return 'Supported by established principles in the field';
    }

    return undefined;
  }

  /**
   * Extract qualification (degree of certainty)
   */
  private extractQualification(claim: ClaimCandidate): string | undefined {
    const qualifiers = /\b(probably|likely|most|many|some|typically|generally|usually)\b/i;
    const match = claim.text.match(qualifiers);

    return match ? match[0] : undefined;
  }

  /**
   * Extract rebuttal (counter-arguments addressed)
   */
  private extractRebuttal(claim: ClaimCandidate): string | undefined {
    const rebuttalMarkers = /\b(however|although|while|despite|critics|objection)\b/i;

    if (rebuttalMarkers.test(claim.text)) {
      return 'Addresses potential counter-arguments';
    }

    return undefined;
  }

  /**
   * Link citations from text
   */
  private linkCitations(text: string): CitationAnchor[] {
    const citations: CitationAnchor[] = [];
    const citationPattern = /\(([^)]+),?\s*(\d{4})[^)]*\)/g;

    let match;
    while ((match = citationPattern.exec(text)) !== null) {
      citations.push({
        key: `${match[1]}${match[2]}`,
        author: match[1],
        year: parseInt(match[2]),
        fullCitation: match[0],
        isPrimary: true
      });
    }

    return citations;
  }

  /**
   * Build dependencies between claims
   */
  private buildDependencies(claims: ToulminClaim[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    for (const claim of claims) {
      const deps: string[] = [];

      // Check if grounds reference other claims
      for (const ground of claim.grounds) {
        for (const otherClaim of claims) {
          if (otherClaim.id !== claim.id &&
              ground.toLowerCase().includes(otherClaim.claim.toLowerCase().substring(0, 30))) {
            deps.push(otherClaim.id);
          }
        }
      }

      if (deps.length > 0) {
        dependencies.set(claim.id, deps);
      }
    }

    return dependencies;
  }

  /**
   * Build claim hierarchy
   */
  private buildHierarchy(claims: ToulminClaim[]): ClaimHierarchy {
    // Identify thesis (first claim or most central claim)
    const thesis = claims[0] || this.createDefaultThesis();

    // Organize claims by section
    const sectionsMap = new Map<string, ToulminClaim[]>();
    for (const claim of claims) {
      const sectionId = claim.location.sectionId;
      if (!sectionsMap.has(sectionId)) {
        sectionsMap.set(sectionId, []);
      }
      sectionsMap.get(sectionId)!.push(claim);
    }

    const sections: ClaimSection[] = [];
    for (const [sectionId, sectionClaims] of sectionsMap) {
      sections.push({
        sectionId,
        title: `Section ${sectionId}`,
        claims: sectionClaims
      });
    }

    return {
      thesis,
      sections
    };
  }

  /**
   * Create default thesis if none found
   */
  private createDefaultThesis(): ToulminClaim {
    return {
      id: 'C0',
      claim: 'Thesis claim',
      grounds: [],
      warrant: 'Default warrant',
      warrantGenerality: 0.5,
      completenessScore: 0.5,
      citations: [],
      location: {
        sectionId: '0',
        paragraphIndex: 0
      },
      quality: {
        toulminCompleteness: 0.5,
        warrantQuality: 0.5,
        evidenceStrength: 0,
        counterArgumentHandling: 0.5,
        overallScore: 0.5
      }
    };
  }

  /**
   * Calculate claim map metadata
   */
  private calculateMetadata(claims: ToulminClaim[]): ClaimMapMetadata {
    const totalClaims = claims.length;
    const completeClaims = claims.filter(c =>
      c.claim && c.grounds.length > 0 && c.warrant
    ).length;
    const claimsWithRebuttals = claims.filter(c => c.rebuttal).length;

    const avgWarrantGenerality = claims.length > 0
      ? claims.reduce((sum, c) => sum + c.warrantGenerality, 0) / claims.length
      : 0;

    const avgCompleteness = claims.length > 0
      ? claims.reduce((sum, c) => sum + c.completenessScore, 0) / claims.length
      : 0;

    const avgQuality = claims.length > 0
      ? claims.reduce((sum, c) => sum + c.quality.overallScore, 0) / claims.length
      : 0;

    return {
      totalClaims,
      completeClaims,
      claimsWithRebuttals,
      averageWarrantGenerality: avgWarrantGenerality,
      averageCompletenessScore: avgCompleteness,
      averageQuality: avgQuality,
      validationStatus: {
        passed: false,
        score: 0,
        issues: []
      }
    };
  }

  /**
   * Calculate extraction confidence
   */
  private calculateExtractionConfidence(claims: ToulminClaim[]): number {
    if (claims.length === 0) return 0;

    // Confidence based on completeness scores
    const avgCompleteness = claims.reduce((sum, c) => sum + c.completenessScore, 0) / claims.length;

    // Confidence based on warrant quality
    const avgWarrantQuality = claims.reduce((sum, c) => sum + c.warrantGenerality, 0) / claims.length;

    return (avgCompleteness * 0.6 + avgWarrantQuality * 0.4);
  }
}

/**
 * Claim candidate (intermediate representation)
 */
interface ClaimCandidate {
  text: string;
  location: ClaimLocation;
  confidence: number;
}
