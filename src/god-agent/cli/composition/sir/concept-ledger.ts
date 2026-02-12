/**
 * Concept Ledger - Term definition and consistency tracking
 *
 * This module provides data structures for tracking concept definitions,
 * detecting term drift, and ensuring consistent terminology usage throughout
 * a document.
 *
 * @module concept-ledger
 */

/**
 * ConceptEntry - Single concept with definition and usage tracking
 */
export interface ConceptEntry {
  /** Canonical term */
  term: string;

  /** Definition as introduced */
  definition: string;

  /** Where first introduced */
  introducedAt: ConceptIntroduction;

  /** Usage constraints */
  constraints: ConceptConstraints;

  /** All usages throughout document */
  usages: ConceptUsage[];

  /** Detected drift instances */
  driftDetections: DriftDetection[];

  /** Concept metadata */
  metadata: ConceptMetadata;
}

/**
 * Where and how concept was introduced
 */
export interface ConceptIntroduction {
  /** Section identifier */
  sectionId: string;

  /** Subsection identifier (optional) */
  subsectionId?: string;

  /** Paragraph index */
  paragraphIndex: number;

  /** 200-character context snippet */
  context: string;

  /** How introduced (formal definition, implicit, example) */
  introductionType: 'formal-definition' | 'implicit-definition' | 'example-based';
}

/**
 * Usage constraints for concept
 */
export interface ConceptConstraints {
  /** Allowed meanings/senses (e.g., "only as faculty, not as medium") */
  allowedMeanings: string[];

  /** Disallowed synonyms to prevent drift */
  disallowedSynonyms: string[];

  /** Scope (global, section-local, subsection-local) */
  scope: 'global' | 'section' | 'subsection';

  /** Related concepts (co-occurrence constraints) */
  relatedConcepts?: string[];

  /** Required qualifiers when used (e.g., "always use with 'pre-cognitive'") */
  requiredQualifiers?: string[];
}

/**
 * Single usage of concept
 */
export interface ConceptUsage {
  /** Location of usage */
  location: UsageLocation;

  /** 200-character context snippet */
  context: string;

  /** How term is used in this context */
  meaning: string;

  /** Whether meaning matches canonical definition */
  isConsistent: boolean;

  /** Confidence in consistency assessment (0-1) */
  consistencyConfidence: number;
}

/**
 * Location of concept usage
 */
export interface UsageLocation {
  /** Section identifier */
  sectionId: string;

  /** Subsection identifier (optional) */
  subsectionId?: string;

  /** Paragraph index */
  paragraphIndex: number;

  /** Sentence index (optional) */
  sentenceIndex?: number;
}

/**
 * Detected drift in concept usage
 */
export interface DriftDetection {
  /** Location of drift */
  location: UsageLocation;

  /** Description of drift issue */
  issue: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Original meaning (canonical) */
  originalMeaning: string;

  /** Drifted meaning (observed) */
  driftedMeaning: string;

  /** Context showing drift */
  context: string;

  /** Suggested fix */
  suggestedFix: string;
}

/**
 * Concept metadata
 */
export interface ConceptMetadata {
  /** Total number of usages */
  totalUsages: number;

  /** Consistent usages */
  consistentUsages: number;

  /** Inconsistent usages (drift) */
  inconsistentUsages: number;

  /** Consistency rate (0-1) */
  consistencyRate: number;

  /** Whether concept is primitive (not defined) */
  isPrimitive: boolean;

  /** Concept importance (based on frequency) */
  importance: 'primary' | 'secondary' | 'tertiary';
}

/**
 * ConceptLedger - Collection of all tracked concepts
 */
export interface ConceptLedger {
  /** All tracked concepts */
  concepts: Map<string, ConceptEntry>;

  /** Primitive concepts (introduced without definition) */
  primitives: Set<string>;

  /** Concept relationships */
  relationships: ConceptRelationships;

  /** Ledger metadata */
  metadata: LedgerMetadata;
}

/**
 * Relationships between concepts
 */
export interface ConceptRelationships {
  /** Allowed synonyms (term -> [synonyms]) */
  synonyms: Map<string, string[]>;

  /** Antonyms (term -> [antonyms]) */
  antonyms: Map<string, string[]>;

  /** Hierarchies (child -> parent) */
  hierarchies: Map<string, string>;

  /** Co-occurrence patterns (terms that appear together) */
  coOccurrences: Map<string, string[]>;
}

/**
 * Ledger-level metadata
 */
export interface LedgerMetadata {
  /** Total concepts tracked */
  totalConcepts: number;

  /** Primitive concepts count */
  primitivesCount: number;

  /** Defined concepts count */
  definedCount: number;

  /** Total drift instances */
  totalDriftInstances: number;

  /** Overall consistency rate (0-1) */
  overallConsistencyRate: number;

  /** Validation status */
  validationStatus: LedgerValidationStatus;
}

/**
 * Validation status for concept ledger
 */
export interface LedgerValidationStatus {
  /** Whether validation passed */
  passed: boolean;

  /** Overall validation score (0-1) */
  score: number;

  /** Validation issues */
  issues: LedgerValidationIssue[];
}

/**
 * Validation issue in ledger
 */
export interface LedgerValidationIssue {
  /** Issue type */
  type: 'term-drift' | 'undefined-term' | 'synonym-violation' |
        'scope-violation' | 'inconsistent-definition';

  /** Term with issue */
  term: string;

  /** Description */
  description: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Suggested fix */
  suggestedFix: string;

  /** Locations affected */
  locations: UsageLocation[];
}

/**
 * Detect meaning drift for a concept
 *
 * @param entry - The concept entry to check
 * @returns Detected drift instances
 */
export function detectMeaningDrift(entry: ConceptEntry): DriftDetection[] {
  const drifts: DriftDetection[] = [];

  // Get canonical meaning from definition
  const canonicalMeaning = entry.definition;

  for (const usage of entry.usages) {
    if (!usage.isConsistent) {
      // Analyze why inconsistent
      const driftType = analyzeDriftType(
        canonicalMeaning,
        usage.meaning,
        entry.constraints.allowedMeanings
      );

      drifts.push({
        location: usage.location,
        issue: driftType.description,
        severity: driftType.severity,
        originalMeaning: canonicalMeaning,
        driftedMeaning: usage.meaning,
        context: usage.context,
        suggestedFix: driftType.suggestedFix
      });
    }
  }

  return drifts;
}

/**
 * Analyze type of drift
 */
function analyzeDriftType(
  canonical: string,
  observed: string,
  allowedMeanings: string[]
): {
  description: string;
  severity: 'critical' | 'major' | 'minor';
  suggestedFix: string;
} {
  // Check if observed meaning matches any allowed meanings
  const matchesAllowed = allowedMeanings.some(allowed =>
    observed.toLowerCase().includes(allowed.toLowerCase())
  );

  if (matchesAllowed) {
    return {
      description: 'Usage within allowed meanings but differs from canonical',
      severity: 'minor',
      suggestedFix: 'Consider aligning with canonical definition for consistency'
    };
  }

  // Check for common drift patterns
  if (isCategoryMismatch(canonical, observed)) {
    return {
      description: 'Category drift (e.g., faculty → medium, process → object)',
      severity: 'critical',
      suggestedFix: 'Use canonical category or introduce new term for different category'
    };
  }

  if (isScopeShift(canonical, observed)) {
    return {
      description: 'Scope shift (term applied more broadly or narrowly)',
      severity: 'major',
      suggestedFix: 'Clarify scope boundaries or use qualified term'
    };
  }

  // Default: general drift
  return {
    description: 'Meaning drift from canonical definition',
    severity: 'major',
    suggestedFix: 'Align usage with canonical definition or redefine term'
  };
}

/**
 * Check for category mismatch (faculty vs medium, process vs object)
 */
function isCategoryMismatch(canonical: string, observed: string): boolean {
  const categoryPairs = [
    ['faculty', 'medium'],
    ['process', 'object'],
    ['state', 'action'],
    ['attribute', 'substance']
  ];

  for (const [cat1, cat2] of categoryPairs) {
    const canonicalHasCat1 = canonical.toLowerCase().includes(cat1);
    const observedHasCat2 = observed.toLowerCase().includes(cat2);

    if ((canonicalHasCat1 && observedHasCat2) ||
        (canonical.toLowerCase().includes(cat2) && observed.toLowerCase().includes(cat1))) {
      return true;
    }
  }

  return false;
}

/**
 * Check for scope shift
 */
function isScopeShift(canonical: string, observed: string): boolean {
  const broadeningMarkers = ['all', 'every', 'any', 'general'];
  const narrowingMarkers = ['specific', 'particular', 'certain'];

  const canonicalBroad = broadeningMarkers.some(m => canonical.toLowerCase().includes(m));
  const observedBroad = broadeningMarkers.some(m => observed.toLowerCase().includes(m));
  const canonicalNarrow = narrowingMarkers.some(m => canonical.toLowerCase().includes(m));
  const observedNarrow = narrowingMarkers.some(m => observed.toLowerCase().includes(m));

  return (canonicalBroad && observedNarrow) || (canonicalNarrow && observedBroad);
}

/**
 * Detect synonym violations
 *
 * @param entry - The concept entry
 * @param documentText - Full document text (optional for context)
 * @returns Detected violations
 */
export function detectSynonymViolations(
  entry: ConceptEntry,
  documentText?: string
): DriftDetection[] {
  const violations: DriftDetection[] = [];

  if (!documentText) return violations;

  // Check for disallowed synonyms in usages
  for (const disallowedSynonym of entry.constraints.disallowedSynonyms) {
    const regex = new RegExp(`\\b${disallowedSynonym}\\b`, 'gi');
    const matches = documentText.matchAll(regex);

    for (const match of matches) {
      // Find location in document (simplified - would need proper parsing)
      violations.push({
        location: {
          sectionId: 'unknown', // Would need document structure
          paragraphIndex: 0
        },
        issue: `Disallowed synonym "${disallowedSynonym}" used instead of "${entry.term}"`,
        severity: 'major',
        originalMeaning: entry.definition,
        driftedMeaning: `Using disallowed synonym: ${disallowedSynonym}`,
        context: documentText.substring(
          Math.max(0, match.index! - 100),
          Math.min(documentText.length, match.index! + 100)
        ),
        suggestedFix: `Replace "${disallowedSynonym}" with "${entry.term}"`
      });
    }
  }

  return violations;
}

/**
 * Assess concept consistency
 *
 * @param entry - The concept entry
 * @returns Consistency metrics
 */
export function assessConceptConsistency(entry: ConceptEntry): {
  consistencyRate: number;
  driftCount: number;
  recommendation: string;
} {
  const totalUsages = entry.usages.length;
  const consistentUsages = entry.usages.filter(u => u.isConsistent).length;
  const consistencyRate = totalUsages > 0 ? consistentUsages / totalUsages : 1.0;

  const driftCount = entry.driftDetections.length;

  let recommendation: string;
  if (consistencyRate >= 0.95) {
    recommendation = 'Excellent consistency';
  } else if (consistencyRate >= 0.85) {
    recommendation = 'Good consistency, minor drift detected';
  } else if (consistencyRate >= 0.70) {
    recommendation = 'Moderate drift - review usages and clarify definition';
  } else {
    recommendation = 'Significant drift - redefine term or introduce distinct terms';
  }

  return {
    consistencyRate,
    driftCount,
    recommendation
  };
}

/**
 * Validate concept ledger
 *
 * @param ledger - The concept ledger to validate
 * @returns Validation status
 */
export function validateConceptLedger(ledger: ConceptLedger): LedgerValidationStatus {
  const issues: LedgerValidationIssue[] = [];

  for (const [term, entry] of ledger.concepts) {
    // Check for term drift
    const drifts = entry.driftDetections;
    if (drifts.length > 0) {
      const criticalDrifts = drifts.filter(d => d.severity === 'critical');
      if (criticalDrifts.length > 0) {
        issues.push({
          type: 'term-drift',
          term,
          description: `Critical term drift detected (${criticalDrifts.length} instances)`,
          severity: 'critical',
          suggestedFix: 'Align all usages with canonical definition',
          locations: criticalDrifts.map(d => d.location)
        });
      }
    }

    // Check for undefined terms (non-primitives without definitions)
    if (!entry.metadata.isPrimitive && !entry.definition) {
      issues.push({
        type: 'undefined-term',
        term,
        description: 'Term used without definition',
        severity: 'major',
        suggestedFix: 'Provide formal definition or mark as primitive',
        locations: [entry.introducedAt]
      });
    }

    // Check consistency rate
    const consistency = assessConceptConsistency(entry);
    if (consistency.consistencyRate < 0.85) {
      issues.push({
        type: 'inconsistent-definition',
        term,
        description: `Low consistency rate: ${(consistency.consistencyRate * 100).toFixed(1)}%`,
        severity: consistency.consistencyRate < 0.70 ? 'major' : 'minor',
        suggestedFix: consistency.recommendation,
        locations: entry.usages.filter(u => !u.isConsistent).map(u => u.location)
      });
    }
  }

  // Calculate validation score
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const majorIssues = issues.filter(i => i.severity === 'major').length;
  const minorIssues = issues.filter(i => i.severity === 'minor').length;

  const score = Math.max(0, 1.0 - (
    criticalIssues * 0.25 +
    majorIssues * 0.10 +
    minorIssues * 0.05
  ));

  const passed = score >= 0.85 && criticalIssues === 0;

  return {
    passed,
    score,
    issues
  };
}
