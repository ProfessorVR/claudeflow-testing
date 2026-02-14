/**
 * Proposition Extractor — Rule-Based Predicate Filter with Severity Tiers
 *
 * MVP (Phase 1): Rule-based predicate filter — deterministic, no training data.
 *
 * Algorithm:
 *   1. Extract propositions containing claim-bearing predicates
 *   2. Filter out allowlisted rhetorical moves
 *   3. Assign severity tiers: OK / WARN / BLOCK
 *
 * BLOCK is restricted to high-precision template matches only.
 * Everything uncertain → WARN, never BLOCK.
 *
 * @module proposition-extractor
 */

import type {
  ExtractedProposition,
  ReverseCheckVerdict,
  DomainLexicon,
} from './icp-types.js';

// =============================================================================
// CORE ENGLISH RULE SET (built-in)
// =============================================================================

/** Definitional copula patterns — BLOCK when unmapped */
const DEFINITIONAL_PATTERNS: RegExp[] = [
  /\b(\w+)\s+is\s+defined\s+as\b/i,
  /\b(\w+)\s+defines?\s+(\w+)\s+as\b/i,
  /\bby\s+['"]?\w+['"]?\s+I\s+mean\b/i,
  /\b(\w+)\s+denotes?\b/i,
  /\b(\w+)\s+refers?\s+to\b/i,
  /\bthe\s+definition\s+of\s+(\w+)\s+is\b/i,
];

/** Causal/inferential connectives — BLOCK when unmapped (inter-clause only) */
const CAUSAL_PATTERNS: RegExp[] = [
  /\btherefore\b/i,
  /\bbecause\b(?!\s+of\b)/i, // Not "because of" (prepositional phrase)
  /\bimplies?\b/i,
  /\bentails?\b/i,
  /\bit\s+follows\s+that\b/i,
  /\bconsequently\b/i,
];

/** Strong universals — BLOCK when unmapped (main-clause operators) */
const UNIVERSAL_PATTERNS: RegExp[] = [
  /\bmust\b(?!\s+be\s+(noted|acknowledged|emphasized))/i,
  /\bcannot\b/i,
  /\balways\b/i,
  /\bnever\b/i,
];

/** Attribution with commitment (WARN) */
const ATTRIBUTION_PATTERNS: RegExp[] = [
  /\b(\w+)\s+(argues?|claims?|maintains?|contends?|insists?)\s+that\b/i,
  /\baccording\s+to\s+(\w+),?\s+/i,
];

/** Rhetorical glue — allowlisted (OK) */
const RHETORICAL_GLUE_PATTERNS: RegExp[] = [
  /\bhowever\b/i,
  /\bin\s+what\s+follows\b/i,
  /\bthis\s+section\s+(examines?|explores?|considers?|discusses?)\b/i,
  /\bit\s+is\s+worth\s+noting\b/i,
  /\bmoreover\b/i,
  /\bfurthermore\b/i,
  /\bin\s+other\s+words\b/i,
  /\bthat\s+is\s+to\s+say\b/i,
  /\bto\s+put\s+it\s+differently\b/i,
  /\bas\s+we\s+have\s+seen\b/i,
  /\bas\s+noted\s+above\b/i,
  /\bthe\s+foregoing\s+(analysis|discussion)\b/i,
  /\bto\s+summarize\b/i,
  /\bin\s+summary\b/i,
  /\bturning\s+now\s+to\b/i,
  /\bhaving\s+established\b/i,
];

// =============================================================================
// PROPOSITION EXTRACTOR
// =============================================================================

export class PropositionExtractor {
  private readonly domainLexicon?: DomainLexicon;
  private readonly additionalGluePatterns: RegExp[];

  constructor(domainLexicon?: DomainLexicon) {
    this.domainLexicon = domainLexicon;
    this.additionalGluePatterns = domainLexicon
      ? domainLexicon.rhetorical_glue_additions.map(
          g => new RegExp(`\\b${this.escapeRegex(g)}\\b`, 'i'),
        )
      : [];
  }

  /**
   * Extract propositions from sentences and classify severity.
   *
   * For each sentence, check:
   *   1. Is it allowlisted rhetorical glue? → OK
   *   2. Does it match BLOCK patterns? → BLOCK (high-precision only)
   *   3. Does it match WARN patterns? → WARN
   *   4. Does it match domain lexicon? → appropriate severity
   *   5. No match → OK
   */
  extractPropositions(
    sentences: Array<{ sentence_id: string; text: string }>,
    mappedAtomIds: Map<string, string[]>,
  ): ExtractedProposition[] {
    const results: ExtractedProposition[] = [];

    for (const sentence of sentences) {
      const atomIds = mappedAtomIds.get(sentence.sentence_id) ?? [];

      // Check for claim-bearing predicates
      const propositions = this.findPredicates(sentence.text, sentence.sentence_id);

      for (const prop of propositions) {
        // If the sentence already maps to atoms, this proposition is covered
        if (atomIds.length > 0 && prop.severity !== 'BLOCK') {
          prop.severity = 'OK';
        }

        // Only flag propositions without atom mapping
        if (atomIds.length === 0 || prop.severity === 'BLOCK') {
          results.push(prop);
        }
      }
    }

    return results;
  }

  /**
   * Find claim-bearing predicates in a sentence.
   */
  private findPredicates(
    text: string,
    sentenceId: string,
  ): ExtractedProposition[] {
    const results: ExtractedProposition[] = [];

    // Step 1: Check rhetorical glue (allowlisted → skip)
    if (this.isRhetoricalGlue(text)) {
      return [];
    }

    // Step 2: Check BLOCK patterns (high-precision definitional/causal/universal)
    for (const pattern of DEFINITIONAL_PATTERNS) {
      if (pattern.test(text)) {
        results.push({
          text,
          sentence_id: sentenceId,
          predicate_type: 'definitional',
          matched_pattern: pattern.source,
          severity: 'BLOCK',
        });
      }
    }

    for (const pattern of CAUSAL_PATTERNS) {
      if (pattern.test(text)) {
        // Check if inside a hedge
        if (this.isInsideHedge(text, pattern)) {
          results.push({
            text,
            sentence_id: sentenceId,
            predicate_type: 'causal',
            matched_pattern: pattern.source,
            severity: 'WARN',
          });
        } else {
          results.push({
            text,
            sentence_id: sentenceId,
            predicate_type: 'causal',
            matched_pattern: pattern.source,
            severity: 'BLOCK',
          });
        }
      }
    }

    for (const pattern of UNIVERSAL_PATTERNS) {
      if (pattern.test(text)) {
        results.push({
          text,
          sentence_id: sentenceId,
          predicate_type: 'quantified',
          matched_pattern: pattern.source,
          severity: 'BLOCK',
        });
      }
    }

    // Step 3: Check WARN patterns (attribution)
    for (const pattern of ATTRIBUTION_PATTERNS) {
      if (pattern.test(text)) {
        results.push({
          text,
          sentence_id: sentenceId,
          predicate_type: 'attributed',
          matched_pattern: pattern.source,
          severity: 'WARN',
        });
      }
    }

    // Step 4: Check domain lexicon patterns
    if (this.domainLexicon) {
      for (const marker of this.domainLexicon.definition_markers) {
        if (text.includes(marker)) {
          results.push({
            text,
            sentence_id: sentenceId,
            predicate_type: 'definitional',
            matched_pattern: `domain:${marker}`,
            severity: 'BLOCK',
          });
        }
      }

      for (const marker of this.domainLexicon.causal_markers) {
        if (text.includes(marker)) {
          results.push({
            text,
            sentence_id: sentenceId,
            predicate_type: 'causal',
            matched_pattern: `domain:${marker}`,
            severity: 'WARN', // Domain markers are WARN by default
          });
        }
      }

      for (const verb of this.domainLexicon.attribution_verbs) {
        if (text.includes(verb)) {
          results.push({
            text,
            sentence_id: sentenceId,
            predicate_type: 'attributed',
            matched_pattern: `domain:${verb}`,
            severity: 'WARN',
          });
        }
      }
    }

    // Deduplicate by predicate_type (keep highest severity)
    return this.deduplicateResults(results);
  }

  /**
   * Check if text is allowlisted rhetorical glue.
   */
  private isRhetoricalGlue(text: string): boolean {
    for (const pattern of RHETORICAL_GLUE_PATTERNS) {
      if (pattern.test(text)) {
        // Must be primarily rhetorical (no other claim-bearing predicates)
        const stripped = text.replace(pattern, '');
        const hasOtherPredicates = [
          ...DEFINITIONAL_PATTERNS,
          ...CAUSAL_PATTERNS,
          ...UNIVERSAL_PATTERNS,
        ].some(p => p.test(stripped));
        if (!hasOtherPredicates) return true;
      }
    }

    // Check domain-specific glue
    for (const pattern of this.additionalGluePatterns) {
      if (pattern.test(text)) return true;
    }

    return false;
  }

  /**
   * Check if a pattern match is inside a hedge (e.g., "perhaps because").
   */
  private isInsideHedge(text: string, _pattern: RegExp): boolean {
    const hedgeMarkers = /\b(perhaps|possibly|maybe|might|it\s+seems|arguably|presumably)\b/i;
    return hedgeMarkers.test(text);
  }

  /**
   * Deduplicate results, keeping highest severity per predicate type.
   */
  private deduplicateResults(results: ExtractedProposition[]): ExtractedProposition[] {
    const byType = new Map<string, ExtractedProposition>();
    const severityOrder: Record<ReverseCheckVerdict, number> = {
      OK: 0,
      WARN: 1,
      BLOCK: 2,
    };

    for (const result of results) {
      const key = `${result.sentence_id}:${result.predicate_type}`;
      const existing = byType.get(key);
      if (!existing || severityOrder[result.severity] > severityOrder[existing.severity]) {
        byType.set(key, result);
      }
    }

    return [...byType.values()];
  }

  /**
   * Escape special regex characters in a string.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
