/**
 * Concept Ledger Builder - Build concept ledger from definitions
 *
 * This module builds concept ledgers by extracting term definitions,
 * tracking usage, and detecting drift.
 *
 * @module concept-ledger-builder
 */

import type {
  ConceptEntry,
  ConceptLedger,
  ConceptIntroduction,
  ConceptConstraints,
  ConceptUsage,
  DriftDetection,
  ConceptMetadata,
  ConceptRelationships,
  LedgerMetadata,
  UsageLocation
} from '../sir/concept-ledger.js';

import {
  detectMeaningDrift,
  assessConceptConsistency,
  validateConceptLedger
} from '../sir/concept-ledger.js';

/**
 * Options for concept ledger building
 */
export interface ConceptLedgerBuilderOptions {
  /** Source text to analyze */
  text: string;

  /** Known primitives (terms not requiring definition) */
  primitives?: string[];

  /** Disallowed synonyms per term */
  disallowedSynonyms?: Map<string, string[]>;

  /** Minimum consistency rate required */
  minConsistencyRate?: number;
}

/**
 * Result of concept ledger building
 */
export interface ConceptLedgerBuildResult {
  /** Built concept ledger */
  ledger: ConceptLedger;

  /** Build metadata */
  metadata: BuildMetadata;
}

/**
 * Build metadata
 */
export interface BuildMetadata {
  /** Concepts extracted */
  conceptsExtracted: number;

  /** Definitions found */
  definitionsFound: number;

  /** Drift instances detected */
  driftInstancesDetected: number;

  /** Overall consistency rate */
  consistencyRate: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * ConceptLedgerBuilder - Main builder class
 */
export class ConceptLedgerBuilder {
  private options: Required<ConceptLedgerBuilderOptions>;
  private concepts: Map<string, ConceptEntry>;
  private primitives: Set<string>;

  constructor(options: ConceptLedgerBuilderOptions) {
    this.options = {
      ...options,
      primitives: options.primitives || ['being', 'existence', 'world', 'truth'],
      disallowedSynonyms: options.disallowedSynonyms || new Map(),
      minConsistencyRate: options.minConsistencyRate || 0.85
    };

    this.concepts = new Map();
    this.primitives = new Set(this.options.primitives);
  }

  /**
   * Build concept ledger from text
   */
  async build(): Promise<ConceptLedgerBuildResult> {
    const startTime = Date.now();

    // Step 1: Extract defined concepts
    const definedConcepts = this.extractDefinitions(this.options.text);

    // Step 2: Track concept usages
    for (const [term, entry] of definedConcepts) {
      const usages = this.trackUsages(term, entry.definition, this.options.text);
      entry.usages = usages;

      // Assess consistency
      const metadata = this.calculateConceptMetadata(entry);
      entry.metadata = metadata;

      // Detect drift
      const drifts = detectMeaningDrift(entry);
      entry.driftDetections = drifts;

      this.concepts.set(term, entry);
    }

    // Step 3: Build relationships
    const relationships = this.buildRelationships(this.concepts);

    // Step 4: Calculate ledger metadata
    const ledgerMetadata = this.calculateLedgerMetadata();

    const ledger: ConceptLedger = {
      concepts: this.concepts,
      primitives: this.primitives,
      relationships,
      metadata: ledgerMetadata
    };

    const processingTime = Date.now() - startTime;

    return {
      ledger,
      metadata: {
        conceptsExtracted: this.concepts.size,
        definitionsFound: [...this.concepts.values()].filter(c => c.definition).length,
        driftInstancesDetected: [...this.concepts.values()]
          .reduce((sum, c) => sum + c.driftDetections.length, 0),
        consistencyRate: ledgerMetadata.overallConsistencyRate,
        processingTime
      }
    };
  }

  /**
   * Extract concept definitions from text
   */
  private extractDefinitions(text: string): Map<string, ConceptEntry> {
    const concepts = new Map<string, ConceptEntry>();
    const lines = text.split('\n');

    let sectionId = '1';
    let paragraphIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Update section tracking
      if (this.isSectionHeader(line)) {
        sectionId = this.extractSectionId(line);
        paragraphIndex = 0;
        continue;
      }

      // Look for definition patterns
      const definition = this.extractDefinitionFromLine(line);
      if (definition) {
        const { term, definitionText, type } = definition;

        if (!concepts.has(term)) {
          concepts.set(term, {
            term,
            definition: definitionText,
            introducedAt: {
              sectionId,
              paragraphIndex,
              context: line.substring(0, 200),
              introductionType: type
            },
            constraints: this.createConstraints(term),
            usages: [],
            driftDetections: [],
            metadata: {
              totalUsages: 0,
              consistentUsages: 0,
              inconsistentUsages: 0,
              consistencyRate: 1.0,
              isPrimitive: this.primitives.has(term),
              importance: 'secondary'
            }
          });
        }
      }

      paragraphIndex++;
    }

    return concepts;
  }

  /**
   * Extract definition from line if present
   */
  private extractDefinitionFromLine(line: string): {
    term: string;
    definitionText: string;
    type: 'formal-definition' | 'implicit-definition' | 'example-based';
  } | null {
    // Pattern 1: "X is defined as Y"
    const formalPattern = /(\w+)\s+is\s+defined\s+as\s+(.+)/i;
    let match = line.match(formalPattern);
    if (match) {
      return {
        term: match[1],
        definitionText: match[2].trim(),
        type: 'formal-definition'
      };
    }

    // Pattern 2: "X: Y" (definition format)
    const colonPattern = /(\w+):\s+([^.]+)/;
    match = line.match(colonPattern);
    if (match && match[2].length > 20) {
      return {
        term: match[1],
        definitionText: match[2].trim(),
        type: 'formal-definition'
      };
    }

    // Pattern 3: "X is/are Y"
    const implicitPattern = /(\w+)\s+(is|are)\s+([^,.]+)/i;
    match = line.match(implicitPattern);
    if (match && match[3].length > 10 && !this.isVaguePredicate(match[3])) {
      return {
        term: match[1],
        definitionText: match[3].trim(),
        type: 'implicit-definition'
      };
    }

    return null;
  }

  /**
   * Check if predicate is too vague for definition
   */
  private isVaguePredicate(predicate: string): boolean {
    const vagueTerms = ['important', 'interesting', 'significant', 'relevant', 'good', 'bad'];
    return vagueTerms.some(term => predicate.toLowerCase().includes(term));
  }

  /**
   * Create constraints for term
   */
  private createConstraints(term: string): ConceptConstraints {
    const disallowedSynonyms = this.options.disallowedSynonyms.get(term) || [];

    return {
      allowedMeanings: [], // Will be populated from usage analysis
      disallowedSynonyms,
      scope: 'global'
    };
  }

  /**
   * Track usages of concept in text
   */
  private trackUsages(
    term: string,
    definition: string,
    text: string
  ): ConceptUsage[] {
    const usages: ConceptUsage[] = [];
    const pattern = new RegExp(`\\b${term}\\b`, 'gi');
    const lines = text.split('\n');

    let sectionId = '1';
    let paragraphIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (this.isSectionHeader(line)) {
        sectionId = this.extractSectionId(line);
        paragraphIndex = 0;
        continue;
      }

      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        const context = this.extractContext(line, match.index!);
        const meaning = this.inferMeaning(term, context);
        const isConsistent = this.checkConsistency(meaning, definition);

        usages.push({
          location: {
            sectionId,
            paragraphIndex,
            sentenceIndex: 0
          },
          context,
          meaning,
          isConsistent,
          consistencyConfidence: isConsistent ? 0.9 : 0.3
        });
      }

      paragraphIndex++;
    }

    return usages;
  }

  /**
   * Extract context around term usage
   */
  private extractContext(line: string, matchIndex: number): string {
    const start = Math.max(0, matchIndex - 100);
    const end = Math.min(line.length, matchIndex + 100);
    return line.substring(start, end);
  }

  /**
   * Infer meaning from context
   */
  private inferMeaning(term: string, context: string): string {
    // Simple heuristic: extract clause containing term
    const sentences = context.split(/[.!?]/);
    for (const sentence of sentences) {
      if (sentence.includes(term)) {
        return sentence.trim();
      }
    }
    return context;
  }

  /**
   * Check if usage is consistent with definition
   */
  private checkConsistency(meaning: string, definition: string): boolean {
    // Simple heuristic: check for overlapping key terms
    const meaningTerms = new Set(
      meaning.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    );
    const definitionTerms = new Set(
      definition.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    );

    const overlap = [...meaningTerms].filter(t => definitionTerms.has(t)).length;
    const minOverlap = Math.min(meaningTerms.size, definitionTerms.size) * 0.2;

    return overlap >= minOverlap;
  }

  /**
   * Calculate concept metadata
   */
  private calculateConceptMetadata(entry: ConceptEntry): ConceptMetadata {
    const totalUsages = entry.usages.length;
    const consistentUsages = entry.usages.filter(u => u.isConsistent).length;
    const inconsistentUsages = totalUsages - consistentUsages;
    const consistencyRate = totalUsages > 0 ? consistentUsages / totalUsages : 1.0;

    let importance: 'primary' | 'secondary' | 'tertiary';
    if (totalUsages >= 10) importance = 'primary';
    else if (totalUsages >= 5) importance = 'secondary';
    else importance = 'tertiary';

    return {
      totalUsages,
      consistentUsages,
      inconsistentUsages,
      consistencyRate,
      isPrimitive: this.primitives.has(entry.term),
      importance
    };
  }

  /**
   * Build relationships between concepts
   */
  private buildRelationships(concepts: Map<string, ConceptEntry>): ConceptRelationships {
    const synonyms = new Map<string, string[]>();
    const antonyms = new Map<string, string[]>();
    const hierarchies = new Map<string, string>();
    const coOccurrences = new Map<string, string[]>();

    // Build hierarchies by analyzing definitions
    for (const [term, entry] of concepts) {
      // Check if definition references another concept
      for (const [otherTerm] of concepts) {
        if (otherTerm !== term && entry.definition.includes(otherTerm)) {
          hierarchies.set(term, otherTerm); // term is child of otherTerm
        }
      }
    }

    return {
      synonyms,
      antonyms,
      hierarchies,
      coOccurrences
    };
  }

  /**
   * Calculate ledger metadata
   */
  private calculateLedgerMetadata(): LedgerMetadata {
    const totalConcepts = this.concepts.size;
    const primitivesCount = this.primitives.size;
    const definedCount = [...this.concepts.values()].filter(c => c.definition).length;
    const totalDriftInstances = [...this.concepts.values()]
      .reduce((sum, c) => sum + c.driftDetections.length, 0);

    const overallConsistencyRate = this.concepts.size > 0
      ? [...this.concepts.values()]
          .reduce((sum, c) => sum + c.metadata.consistencyRate, 0) / this.concepts.size
      : 1.0;

    const validationStatus = validateConceptLedger({
      concepts: this.concepts,
      primitives: this.primitives,
      relationships: {
        synonyms: new Map(),
        antonyms: new Map(),
        hierarchies: new Map(),
        coOccurrences: new Map()
      },
      metadata: {} as any // Will be filled after validation
    });

    return {
      totalConcepts,
      primitivesCount,
      definedCount,
      totalDriftInstances,
      overallConsistencyRate,
      validationStatus
    };
  }

  /**
   * Check if line is section header
   */
  private isSectionHeader(line: string): boolean {
    return /^#+\s/.test(line) || /^(Section|Chapter)\s+\d+/.test(line);
  }

  /**
   * Extract section ID from header
   */
  private extractSectionId(line: string): string {
    const match = line.match(/(\d+(\.\d+)*)/);
    return match ? match[1] : '1';
  }
}
