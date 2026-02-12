/**
 * FactualAccuracyAuditor - Quality stage for evaluating factual accuracy
 *
 * Checks for:
 * - Internal consistency (dates, numbers, names)
 * - Cross-reference accuracy
 * - Term definition consistency
 * - Statistical claim verification
 * - Provenance tracking (claims linked to sources)
 *
 * Uses pattern matching and heuristics - no external AI calls.
 */

import {
  BaseQualityStage,
  type QualityStageResult,
  type QualityIssue,
  type QualityEvaluationContext,
  countIssuesBySeverity,
} from '../quality-stage.js';

// ============================================================================
// Pattern Constants
// ============================================================================

// Date patterns
const DATE_PATTERNS = {
  fullYear: /\b(1[89]\d{2}|20[0-2]\d)\b/g,
  dateRange: /\b(1[89]\d{2}|20[0-2]\d)\s*[-–—]\s*(1[89]\d{2}|20[0-2]\d)\b/g,
  monthYear: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(1[89]\d{2}|20[0-2]\d)\b/gi,
  relativeDate: /\b(in\s+recent\s+years|recently|currently|today|now)\b/gi,
};

// Number patterns
const NUMBER_PATTERNS = {
  percentage: /\b(\d+(?:\.\d+)?)\s*%/g,
  magnitude: /\b(\d+(?:\.\d+)?)\s*(million|billion|trillion|thousand)/gi,
  currency: /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(million|billion|trillion)?/gi,
  fraction: /\b(\d+)\s*(?:out\s+of|\/)\s*(\d+)\b/gi,
  decimal: /\b(\d+\.\d+)\b/g,
  largeNumber: /\b(\d{1,3}(?:,\d{3})+|\d{4,})\b/g,
};

// Named entity patterns
const ENTITY_PATTERNS = {
  // Person names (simplified - looks for capitalized word sequences)
  personName: /\b([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)\b/g,
  // Organizations
  organization: /\b([A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\s+(?:University|Institute|Foundation|Organization|Corporation|Company|Association|Agency|Department|Ministry|Committee|Council|Board|Center|Centre))\b/g,
  // Acronyms
  acronym: /\b([A-Z]{2,6})\b/g,
};

// Definition patterns
const DEFINITION_PATTERNS = [
  /\b(\w+(?:\s+\w+)?)\s+is\s+defined\s+as\s+"?([^".\n]+)"?/gi,
  /\b(\w+(?:\s+\w+)?)\s+refers?\s+to\s+"?([^".\n]+)"?/gi,
  /\b(\w+(?:\s+\w+)?),?\s+meaning\s+"?([^".\n]+)"?/gi,
  /\bthe\s+term\s+"?(\w+(?:\s+\w+)?)"?\s+(?:denotes?|means?|signifies?)\s+"?([^".\n]+)"?/gi,
];

// Cross-reference patterns
const CROSS_REFERENCE_PATTERNS = {
  chapter: /\b(Chapter|Ch\.?)\s+(\d+)\b/gi,
  section: /\b(Section|Sec\.?)\s+(\d+(?:\.\d+)*)\b/gi,
  figure: /\b(Figure|Fig\.?)\s+(\d+(?:\.\d+)?)\b/gi,
  table: /\b(Table)\s+(\d+(?:\.\d+)?)\b/gi,
  equation: /\b(Equation|Eq\.?)\s+\(?(\d+(?:\.\d+)?)\)?/gi,
  page: /\b(?:see\s+)?(?:p\.?|page)\s+(\d+(?:\s*-\s*\d+)?)\b/gi,
  above: /\b(as\s+(?:mentioned|discussed|noted|shown|demonstrated)\s+(?:above|earlier|previously))\b/gi,
  below: /\b(as\s+(?:will\s+be\s+)?(?:discussed|shown|demonstrated)\s+(?:below|later))\b/gi,
};

// Statistical claim patterns
const STATISTICAL_PATTERNS = {
  pValue: /\bp\s*[<>=]\s*(\d+(?:\.\d+)?)\b/gi,
  correlation: /\b(?:r|R)\s*=\s*(\d+(?:\.\d+)?)\b/gi,
  sampleSize: /\b[nN]\s*=\s*(\d+)\b/g,
  confidence: /\b(\d+(?:\.\d+)?)\s*%\s*(?:confidence|CI)\b/gi,
  meanSD: /\b(?:mean|M|SD|standard\s+deviation)\s*[=:]\s*(\d+(?:\.\d+)?)/gi,
};

// ============================================================================
// Extracted Data Types
// ============================================================================

interface ExtractedDate {
  value: string;
  type: 'year' | 'range' | 'monthYear' | 'relative';
  position: number;
  paragraphIndex: number;
}

interface ExtractedNumber {
  raw: string;
  value: number;
  type: 'percentage' | 'magnitude' | 'currency' | 'fraction' | 'decimal' | 'count';
  unit?: string;
  position: number;
  paragraphIndex: number;
}

interface ExtractedDefinition {
  term: string;
  definition: string;
  position: number;
  paragraphIndex: number;
}

interface ExtractedReference {
  type: 'chapter' | 'section' | 'figure' | 'table' | 'equation' | 'page' | 'above' | 'below';
  target: string;
  position: number;
  paragraphIndex: number;
}

interface ExtractedEntity {
  text: string;
  type: 'person' | 'organization' | 'acronym';
  position: number;
  paragraphIndex: number;
}

// ============================================================================
// FactualAccuracyAuditor Class
// ============================================================================

/**
 * Quality stage that evaluates factual accuracy and internal consistency
 */
export class FactualAccuracyAuditor extends BaseQualityStage {
  readonly name = 'factual-accuracy';
  readonly weight = 0.13; // Adjusted for 7-stage gauntlet
  readonly threshold = 0.85;

  /**
   * Evaluate chapter text for factual accuracy
   */
  async evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const startTime = Date.now();
    const issues: QualityIssue[] = [];
    const metrics: Record<string, number> = {};
    const suggestions: string[] = [];

    const paragraphs = this.extractParagraphs(chapterText);

    // Extract all relevant data
    const dates = this.extractDates(chapterText, paragraphs);
    const numbers = this.extractNumbers(chapterText, paragraphs);
    const definitions = this.extractDefinitions(chapterText, paragraphs);
    const references = this.extractReferences(chapterText, paragraphs);
    const entities = this.extractEntities(chapterText, paragraphs);

    // Store extraction metrics
    metrics['dateCount'] = dates.length;
    metrics['numberCount'] = numbers.length;
    metrics['definitionCount'] = definitions.length;
    metrics['referenceCount'] = references.length;
    metrics['entityCount'] = entities.length;

    // Check date consistency
    const dateIssues = this.checkDateConsistency(dates, chapterId);
    issues.push(...dateIssues);

    // Check number consistency
    const numberIssues = this.checkNumberConsistency(numbers, chapterId);
    issues.push(...numberIssues);

    // Check definition consistency
    const definitionIssues = this.checkDefinitionConsistency(definitions, chapterId);
    issues.push(...definitionIssues);

    // Check cross-references
    const referenceIssues = this.checkReferenceValidity(references, chapterText, chapterId);
    issues.push(...referenceIssues);

    // Check entity consistency
    const entityIssues = this.checkEntityConsistency(entities, chapterId);
    issues.push(...entityIssues);

    // Check statistical claims
    const statIssues = this.checkStatisticalClaims(chapterText, chapterId);
    issues.push(...statIssues);

    // Check provenance (if knowledge base available)
    if (context?.provenanceLedger) {
      const provenanceIssues = this.checkProvenance(
        chapterText,
        chapterId,
        context
      );
      issues.push(...provenanceIssues);
    }

    // Generate suggestions
    if (dates.filter(d => d.type === 'relative').length > 3) {
      suggestions.push(
        'Consider replacing relative date references ("recently", "currently") with specific dates ' +
        'for long-term relevance of your dissertation.'
      );
    }

    if (definitions.length === 0 && this.wordCount(chapterText) > 1000) {
      suggestions.push(
        'Consider adding explicit definitions for key terms used in this chapter.'
      );
    }

    // Calculate score
    const { critical, major, minor } = countIssuesBySeverity(issues);
    const totalElements = dates.length + numbers.length + definitions.length + references.length;
    const score = this.calculateScore(critical, major, minor, Math.max(totalElements, 10));

    const passed = score >= this.threshold;

    return {
      stageName: this.name,
      passed,
      score,
      issues,
      metrics,
      suggestions,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Check if an issue can be auto-fixed
   */
  canAutoFix(_issue: QualityIssue): boolean {
    // Factual accuracy issues generally cannot be auto-fixed
    return false;
  }

  /**
   * Auto-fix (not supported for factual issues)
   */
  autoFix(text: string, _issue: QualityIssue): string {
    return text;
  }

  // ============================================================================
  // Extraction Methods
  // ============================================================================

  /**
   * Extract dates from text
   */
  private extractDates(text: string, paragraphs: string[]): ExtractedDate[] {
    const dates: ExtractedDate[] = [];

    // Find paragraph positions
    const paragraphPositions = this.findParagraphPositions(text, paragraphs);

    // Extract full years
    let match;
    while ((match = DATE_PATTERNS.fullYear.exec(text)) !== null) {
      dates.push({
        value: match[1],
        type: 'year',
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    // Extract date ranges
    DATE_PATTERNS.dateRange.lastIndex = 0;
    while ((match = DATE_PATTERNS.dateRange.exec(text)) !== null) {
      dates.push({
        value: match[0],
        type: 'range',
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    // Extract month-year dates
    DATE_PATTERNS.monthYear.lastIndex = 0;
    while ((match = DATE_PATTERNS.monthYear.exec(text)) !== null) {
      dates.push({
        value: match[0],
        type: 'monthYear',
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    // Extract relative dates
    DATE_PATTERNS.relativeDate.lastIndex = 0;
    while ((match = DATE_PATTERNS.relativeDate.exec(text)) !== null) {
      dates.push({
        value: match[0],
        type: 'relative',
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    return dates;
  }

  /**
   * Extract numbers from text
   */
  private extractNumbers(text: string, paragraphs: string[]): ExtractedNumber[] {
    const numbers: ExtractedNumber[] = [];
    const paragraphPositions = this.findParagraphPositions(text, paragraphs);

    // Extract percentages
    let match;
    while ((match = NUMBER_PATTERNS.percentage.exec(text)) !== null) {
      numbers.push({
        raw: match[0],
        value: parseFloat(match[1]),
        type: 'percentage',
        unit: '%',
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    // Extract magnitudes (million, billion, etc.)
    NUMBER_PATTERNS.magnitude.lastIndex = 0;
    while ((match = NUMBER_PATTERNS.magnitude.exec(text)) !== null) {
      const multipliers: Record<string, number> = {
        thousand: 1000,
        million: 1000000,
        billion: 1000000000,
        trillion: 1000000000000,
      };
      const multiplier = multipliers[match[2].toLowerCase()] || 1;

      numbers.push({
        raw: match[0],
        value: parseFloat(match[1]) * multiplier,
        type: 'magnitude',
        unit: match[2].toLowerCase(),
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    // Extract currency
    NUMBER_PATTERNS.currency.lastIndex = 0;
    while ((match = NUMBER_PATTERNS.currency.exec(text)) !== null) {
      let value = parseFloat(match[1].replace(/,/g, ''));
      if (match[2]) {
        const multipliers: Record<string, number> = {
          million: 1000000,
          billion: 1000000000,
          trillion: 1000000000000,
        };
        value *= multipliers[match[2].toLowerCase()] || 1;
      }

      numbers.push({
        raw: match[0],
        value,
        type: 'currency',
        unit: 'USD',
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    return numbers;
  }

  /**
   * Extract definitions from text
   */
  private extractDefinitions(text: string, paragraphs: string[]): ExtractedDefinition[] {
    const definitions: ExtractedDefinition[] = [];
    const paragraphPositions = this.findParagraphPositions(text, paragraphs);

    for (const pattern of DEFINITION_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        definitions.push({
          term: match[1].trim().toLowerCase(),
          definition: match[2].trim(),
          position: match.index,
          paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
        });
      }
    }

    return definitions;
  }

  /**
   * Extract cross-references from text
   */
  private extractReferences(text: string, paragraphs: string[]): ExtractedReference[] {
    const references: ExtractedReference[] = [];
    const paragraphPositions = this.findParagraphPositions(text, paragraphs);

    for (const [type, pattern] of Object.entries(CROSS_REFERENCE_PATTERNS)) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        references.push({
          type: type as ExtractedReference['type'],
          target: match[2] || match[1] || match[0],
          position: match.index,
          paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
        });
      }
    }

    return references;
  }

  /**
   * Extract named entities from text
   */
  private extractEntities(text: string, paragraphs: string[]): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const paragraphPositions = this.findParagraphPositions(text, paragraphs);

    // Extract person names
    let match;
    while ((match = ENTITY_PATTERNS.personName.exec(text)) !== null) {
      // Filter out common false positives
      const name = match[1];
      if (this.isLikelyPersonName(name)) {
        entities.push({
          text: name,
          type: 'person',
          position: match.index,
          paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
        });
      }
    }

    // Extract organizations
    ENTITY_PATTERNS.organization.lastIndex = 0;
    while ((match = ENTITY_PATTERNS.organization.exec(text)) !== null) {
      entities.push({
        text: match[1],
        type: 'organization',
        position: match.index,
        paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
      });
    }

    // Extract acronyms (with first occurrence definition check)
    ENTITY_PATTERNS.acronym.lastIndex = 0;
    while ((match = ENTITY_PATTERNS.acronym.exec(text)) !== null) {
      // Filter out common abbreviations
      const acronym = match[1];
      if (this.isLikelyAcronym(acronym)) {
        entities.push({
          text: acronym,
          type: 'acronym',
          position: match.index,
          paragraphIndex: this.findParagraphIndex(match.index, paragraphPositions),
        });
      }
    }

    return entities;
  }

  // ============================================================================
  // Consistency Check Methods
  // ============================================================================

  /**
   * Check date consistency
   */
  private checkDateConsistency(dates: ExtractedDate[], chapterId: number): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const currentYear = new Date().getFullYear();

    // Check for future dates (likely errors)
    for (const date of dates) {
      if (date.type === 'year') {
        const year = parseInt(date.value, 10);
        if (year > currentYear + 1) {
          issues.push({
            id: this.generateIssueId('factual', issueIndex++),
            type: 'factual',
            severity: 'critical',
            location: {
              chapterId,
              paragraphIndex: date.paragraphIndex,
            },
            description: `Future date detected: ${year}`,
            suggestion: 'Verify and correct this date reference',
            autoFixable: false,
            contextSnippet: date.value,
          });
        }
      }

      // Check date ranges for logical consistency
      if (date.type === 'range') {
        const years = date.value.match(/\d{4}/g);
        if (years && years.length >= 2) {
          const startYear = parseInt(years[0], 10);
          const endYear = parseInt(years[1], 10);

          if (startYear > endYear) {
            issues.push({
              id: this.generateIssueId('factual', issueIndex++),
              type: 'factual',
              severity: 'major',
              location: {
                chapterId,
                paragraphIndex: date.paragraphIndex,
              },
              description: `Invalid date range: ${date.value} (start year after end year)`,
              suggestion: 'Correct the date range order',
              autoFixable: false,
              contextSnippet: date.value,
            });
          }
        }
      }
    }

    // Check for chronological inconsistencies within narrative
    const yearSequence = dates
      .filter(d => d.type === 'year')
      .map(d => ({
        year: parseInt(d.value, 10),
        paragraphIndex: d.paragraphIndex,
      }))
      .filter(d => !isNaN(d.year));

    // Look for significant jumps backwards in time within close paragraphs
    for (let i = 1; i < yearSequence.length; i++) {
      const prev = yearSequence[i - 1];
      const curr = yearSequence[i];

      if (
        curr.paragraphIndex - prev.paragraphIndex <= 1 &&
        prev.year - curr.year > 50
      ) {
        issues.push({
          id: this.generateIssueId('factual', issueIndex++),
          type: 'factual',
          severity: 'minor',
          location: {
            chapterId,
            paragraphIndex: curr.paragraphIndex,
          },
          description: `Large chronological jump backward (${prev.year} to ${curr.year})`,
          suggestion: 'Verify this temporal sequence is intentional',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Check number consistency
   */
  private checkNumberConsistency(numbers: ExtractedNumber[], chapterId: number): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check for impossible percentages
    for (const num of numbers) {
      if (num.type === 'percentage') {
        if (num.value < 0 || num.value > 100) {
          issues.push({
            id: this.generateIssueId('factual', issueIndex++),
            type: 'factual',
            severity: 'critical',
            location: {
              chapterId,
              paragraphIndex: num.paragraphIndex,
            },
            description: `Invalid percentage: ${num.raw}`,
            suggestion: 'Verify and correct this percentage value',
            autoFixable: false,
            contextSnippet: num.raw,
          });
        }
      }
    }

    // Check for conflicting numbers referring to same thing
    // Group by approximate position and look for inconsistencies
    const percentagesByParagraph = new Map<number, ExtractedNumber[]>();
    for (const num of numbers.filter(n => n.type === 'percentage')) {
      const existing = percentagesByParagraph.get(num.paragraphIndex) || [];
      existing.push(num);
      percentagesByParagraph.set(num.paragraphIndex, existing);
    }

    // Check if percentages in same paragraph should sum to 100
    for (const [paragraphIndex, percentages] of percentagesByParagraph) {
      if (percentages.length >= 2) {
        const sum = percentages.reduce((s, p) => s + p.value, 0);
        // If they look like parts of a whole (between 80-120%)
        if (sum > 80 && sum < 120 && Math.abs(sum - 100) > 5) {
          issues.push({
            id: this.generateIssueId('factual', issueIndex++),
            type: 'factual',
            severity: 'minor',
            location: {
              chapterId,
              paragraphIndex,
            },
            description: `Percentages in paragraph sum to ${sum.toFixed(1)}%, not 100%`,
            suggestion: 'If these represent parts of a whole, verify they sum correctly',
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check definition consistency
   */
  private checkDefinitionConsistency(
    definitions: ExtractedDefinition[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Group definitions by term
    const definitionsByTerm = new Map<string, ExtractedDefinition[]>();
    for (const def of definitions) {
      const existing = definitionsByTerm.get(def.term) || [];
      existing.push(def);
      definitionsByTerm.set(def.term, existing);
    }

    // Check for conflicting definitions
    for (const [term, defs] of definitionsByTerm) {
      if (defs.length > 1) {
        // Check if definitions are similar enough
        const definitions = defs.map(d => d.definition.toLowerCase());
        const firstDef = definitions[0];

        for (let i = 1; i < definitions.length; i++) {
          const similarity = this.calculateStringSimilarity(firstDef, definitions[i]);

          if (similarity < 0.7) {
            issues.push({
              id: this.generateIssueId('factual', issueIndex++),
              type: 'factual',
              severity: 'major',
              location: {
                chapterId,
                paragraphIndex: defs[i].paragraphIndex,
              },
              description: `Potentially conflicting definitions for "${term}"`,
              suggestion: 'Ensure consistent definition of this term throughout',
              autoFixable: false,
              contextSnippet: `Def 1: "${defs[0].definition.substring(0, 50)}..." vs Def 2: "${defs[i].definition.substring(0, 50)}..."`,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check cross-reference validity
   */
  private checkReferenceValidity(
    references: ExtractedReference[],
    text: string,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check for forward references that might not be fulfilled
    const aboveRefs = references.filter(r => r.type === 'above');
    const belowRefs = references.filter(r => r.type === 'below');

    // "As discussed above" should have earlier content
    for (const ref of aboveRefs) {
      if (ref.paragraphIndex < 2) {
        issues.push({
          id: this.generateIssueId('factual', issueIndex++),
          type: 'factual',
          severity: 'minor',
          location: {
            chapterId,
            paragraphIndex: ref.paragraphIndex,
          },
          description: '"Above" reference appears very early in chapter',
          suggestion: 'Verify there is actually preceding relevant content',
          autoFixable: false,
        });
      }
    }

    // Check figure/table references exist
    const figureRefs = references.filter(r => r.type === 'figure');
    const tableRefs = references.filter(r => r.type === 'table');

    const figurePattern = /!\[.*?\]\(.*?\)|<figure|Figure\s+\d+(?:\.\d+)?\s*[.:]/gi;
    const tablePattern = /<table|Table\s+\d+(?:\.\d+)?\s*[.:]/gi;

    const hasFigures = figurePattern.test(text);
    const hasTables = tablePattern.test(text);

    if (figureRefs.length > 0 && !hasFigures) {
      issues.push({
        id: this.generateIssueId('factual', issueIndex++),
        type: 'factual',
        severity: 'major',
        location: { chapterId },
        description: `${figureRefs.length} figure reference(s) but no figures detected`,
        suggestion: 'Add the referenced figures or correct the references',
        autoFixable: false,
      });
    }

    if (tableRefs.length > 0 && !hasTables) {
      issues.push({
        id: this.generateIssueId('factual', issueIndex++),
        type: 'factual',
        severity: 'major',
        location: { chapterId },
        description: `${tableRefs.length} table reference(s) but no tables detected`,
        suggestion: 'Add the referenced tables or correct the references',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check entity consistency
   */
  private checkEntityConsistency(entities: ExtractedEntity[], chapterId: number): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check acronyms are defined on first use
    const acronymUsage = new Map<string, number[]>();
    for (const entity of entities.filter(e => e.type === 'acronym')) {
      const existing = acronymUsage.get(entity.text) || [];
      existing.push(entity.paragraphIndex);
      acronymUsage.set(entity.text, existing);
    }

    // TODO: Check if acronym is defined near first usage
    // This would require more sophisticated parsing of the definition context

    // Check for variant spellings of names
    const personNames = entities.filter(e => e.type === 'person');
    const nameVariants = this.findNameVariants(personNames);

    for (const [canonical, variants] of nameVariants) {
      if (variants.size > 1) {
        issues.push({
          id: this.generateIssueId('factual', issueIndex++),
          type: 'factual',
          severity: 'minor',
          location: { chapterId },
          description: `Possible name variants detected: ${Array.from(variants).join(', ')}`,
          suggestion: 'Use consistent spelling/formatting for names',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Check statistical claims
   */
  private checkStatisticalClaims(text: string, chapterId: number): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check p-values
    let match;
    while ((match = STATISTICAL_PATTERNS.pValue.exec(text)) !== null) {
      const pValue = parseFloat(match[1]);

      // Check for impossible p-values
      if (pValue < 0 || pValue > 1) {
        issues.push({
          id: this.generateIssueId('factual', issueIndex++),
          type: 'factual',
          severity: 'critical',
          location: { chapterId },
          description: `Invalid p-value: ${pValue}`,
          suggestion: 'P-values must be between 0 and 1',
          autoFixable: false,
          contextSnippet: match[0],
        });
      }

      // Check for suspiciously exact p-values
      if (pValue === 0.05 || pValue === 0.01 || pValue === 0.001) {
        issues.push({
          id: this.generateIssueId('factual', issueIndex++),
          type: 'factual',
          severity: 'minor',
          location: { chapterId },
          description: `Suspiciously round p-value: ${pValue}`,
          suggestion: 'Report exact p-values rather than threshold values',
          autoFixable: false,
          contextSnippet: match[0],
        });
      }
    }

    // Check correlation coefficients
    STATISTICAL_PATTERNS.correlation.lastIndex = 0;
    while ((match = STATISTICAL_PATTERNS.correlation.exec(text)) !== null) {
      const r = parseFloat(match[1]);

      // Correlation must be between -1 and 1
      if (r < -1 || r > 1) {
        issues.push({
          id: this.generateIssueId('factual', issueIndex++),
          type: 'factual',
          severity: 'critical',
          location: { chapterId },
          description: `Invalid correlation coefficient: ${r}`,
          suggestion: 'Correlation coefficients must be between -1 and 1',
          autoFixable: false,
          contextSnippet: match[0],
        });
      }
    }

    return issues;
  }

  /**
   * Check provenance of claims against knowledge base
   */
  private checkProvenance(
    _text: string,
    chapterId: number,
    _context: QualityEvaluationContext
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    // This would integrate with the ProvenanceLedger if available
    // For now, this is a placeholder for future integration
    return issues;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private findParagraphPositions(text: string, paragraphs: string[]): number[] {
    const positions: number[] = [];
    let searchPos = 0;

    for (const para of paragraphs) {
      const pos = text.indexOf(para, searchPos);
      positions.push(pos);
      searchPos = pos + para.length;
    }

    return positions;
  }

  private findParagraphIndex(position: number, paragraphPositions: number[]): number {
    for (let i = paragraphPositions.length - 1; i >= 0; i--) {
      if (position >= paragraphPositions[i]) {
        return i;
      }
    }
    return 0;
  }

  private isLikelyPersonName(name: string): boolean {
    // Filter out common false positives
    const falsePositives = new Set([
      'The', 'In', 'This', 'These', 'However', 'Therefore', 'Furthermore',
      'Although', 'While', 'Chapter', 'Section', 'Figure', 'Table',
    ]);

    const words = name.split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    if (falsePositives.has(words[0])) return false;

    return true;
  }

  private isLikelyAcronym(acronym: string): boolean {
    // Filter out common non-acronym capital letter sequences
    const commonWords = new Set([
      'A', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'AM', 'PM', 'AD', 'BC', 'CE', 'BCE', 'OK', 'TV',
    ]);

    if (commonWords.has(acronym)) return false;
    if (acronym.length < 2 || acronym.length > 6) return false;

    return true;
  }

  private findNameVariants(entities: ExtractedEntity[]): Map<string, Set<string>> {
    const variants = new Map<string, Set<string>>();

    for (const entity of entities) {
      const normalized = entity.text.toLowerCase().replace(/\s+/g, ' ').trim();
      const lastName = normalized.split(' ').pop() || '';

      if (!variants.has(lastName)) {
        variants.set(lastName, new Set());
      }
      variants.get(lastName)!.add(entity.text);
    }

    return variants;
  }

  private calculateStringSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Simple word overlap similarity
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
