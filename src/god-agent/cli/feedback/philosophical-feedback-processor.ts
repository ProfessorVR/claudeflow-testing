/**
 * PhilosophicalFeedbackProcessor - Specialized feedback processing for philosophical writing
 * Handles domain-specific issues like terminology usage, argument structure, and interpretive claims
 */

import type { StyleIssue, IssueType } from './paragraph-feedback-capture.js';
import type { PatternDiff, PatternCategory } from './incremental-style-updater.js';

/**
 * Philosophical issue types (extends base IssueType)
 */
export type PhilosophicalIssueType =
  | 'terminology_inconsistency'      // Greek/technical term usage inconsistencies
  | 'argument_structure'             // Syllogistic, dialectical structure issues
  | 'interpretive_claim'             // Exegetical claims without support
  | 'phenomenological_description'   // Issues with phenomenological analysis
  | 'dialectical_move'               // Problems with thesis-antithesis-synthesis
  | 'textual_evidence'               // Missing or weak textual evidence
  | 'hedging_balance'                // Over/under hedging in claims
  | 'greek_transliteration'          // Inconsistent Greek term handling
  | 'author_voice'                   // Confusion between author voice and source interpretation
  | 'anachronism';                   // Anachronistic terminology or concepts

/**
 * Detailed philosophical issue
 */
export interface PhilosophicalIssue extends StyleIssue {
  philosophicalType: PhilosophicalIssueType;
  severity: 'critical' | 'major' | 'minor';
  context: {
    term?: string;
    expectedUsage?: string;
    actualUsage?: string;
    sourceAuthor?: string;
    passageReference?: string;
  };
  suggestedRevision?: string;
}

/**
 * Philosophical feedback analysis result
 */
export interface PhilosophicalFeedbackAnalysis {
  originalText: string;
  correctedText: string;
  philosophicalIssues: PhilosophicalIssue[];
  terminologyChanges: TerminologyChange[];
  argumentChanges: ArgumentChange[];
  citationChanges: CitationChange[];
  overallAssessment: {
    terminologyScore: number;
    argumentScore: number;
    evidenceScore: number;
    voiceScore: number;
  };
}

/**
 * A terminology change detected in corrections
 */
export interface TerminologyChange {
  term: string;
  originalUsage: string;
  correctedUsage: string;
  isGreek: boolean;
  transliteration?: {
    original: string;
    corrected: string;
  };
  context: string;
}

/**
 * An argument structure change
 */
export interface ArgumentChange {
  type: 'strengthened' | 'weakened' | 'restructured' | 'added' | 'removed';
  component: 'premise' | 'conclusion' | 'evidence' | 'warrant' | 'qualifier';
  originalStructure?: string;
  correctedStructure: string;
  reason?: string;
}

/**
 * A citation/evidence change
 */
export interface CitationChange {
  type: 'added' | 'removed' | 'modified' | 'repositioned';
  sourceAuthor?: string;
  originalReference?: string;
  correctedReference?: string;
  integrationStyle?: 'author-prominent' | 'info-prominent' | 'quotation';
}

/**
 * Greek term patterns for detection
 */
const GREEK_TERM_PATTERNS = {
  // Aristotelian terms
  aristotelian: [
    /\b(phantasia|φαντασία)\b/gi,
    /\b(nous|νοῦς)\b/gi,
    /\b(psyche|ψυχή)\b/gi,
    /\b(aisthesis|αἴσθησις)\b/gi,
    /\b(phainomena|φαινόμενα)\b/gi,
    /\b(eidos|εἶδος)\b/gi,
    /\b(hyle|ὕλη)\b/gi,
    /\b(energeia|ἐνέργεια)\b/gi,
    /\b(dynamis|δύναμις)\b/gi,
    /\b(ousia|οὐσία)\b/gi,
    /\b(telos|τέλος)\b/gi,
    /\b(logos|λόγος)\b/gi,
    /\b(pathos|πάθος)\b/gi,
    /\b(praxis|πρᾶξις)\b/gi,
    /\b(theoria|θεωρία)\b/gi,
    /\b(phronesis|φρόνησις)\b/gi,
  ],
  // Heideggerian terms (German transliterated)
  heideggerian: [
    /\b(Dasein)\b/gi,
    /\b(Sein|Being)\b/gi,
    /\b(Seiendes?|beings?)\b/gi,
    /\b(Zuhandenheit|ready-to-hand)\b/gi,
    /\b(Vorhandenheit|present-at-hand)\b/gi,
    /\b(In-der-Welt-sein|Being-in-the-world)\b/gi,
    /\b(Mitsein|Being-with)\b/gi,
    /\b(Sorge|care)\b/gi,
    /\b(Angst|anxiety)\b/gi,
    /\b(Geworfenheit|thrownness)\b/gi,
    /\b(Entwurf|projection)\b/gi,
    /\b(Verfallenheit|fallenness)\b/gi,
    /\b(Eigentlichkeit|authenticity)\b/gi,
    /\b(Uneigentlichkeit|inauthenticity)\b/gi,
    /\b(Zeitlichkeit|temporality)\b/gi,
    /\b(Geschichtlichkeit|historicality)\b/gi,
    /\b(Lichtung|clearing)\b/gi,
  ],
};

/**
 * Argument structure patterns
 */
const ARGUMENT_PATTERNS = {
  premise: [
    /\b(since|because|given that|as|for|inasmuch as)\b/gi,
    /\b(the fact that|considering that|in view of)\b/gi,
  ],
  conclusion: [
    /\b(therefore|thus|hence|consequently|it follows that)\b/gi,
    /\b(we can conclude|this shows|this demonstrates)\b/gi,
  ],
  evidence: [
    /\b(according to|as .+ argues|.+ writes|.+ claims)\b/gi,
    /\b(the passage|this text|in .+'s account)\b/gi,
    /\bat .+\d+[a-z]?\d*\b/gi,  // Bekker notation for Aristotle
  ],
  warrant: [
    /\b(this is because|the reason is|this follows from)\b/gi,
    /\b(insofar as|to the extent that|on the grounds that)\b/gi,
  ],
  qualifier: [
    /\b(perhaps|possibly|likely|probably|might|may|could)\b/gi,
    /\b(it seems|appears to|suggests|indicates)\b/gi,
    /\b(in some sense|to some degree|in certain respects)\b/gi,
  ],
};

/**
 * Hedging patterns
 */
const HEDGING_PATTERNS = {
  weak: [
    /\b(seems to|appears to|suggests|indicates)\b/gi,
    /\b(might|may|could|possibly|perhaps)\b/gi,
    /\b(in some sense|to some extent|in certain respects)\b/gi,
  ],
  strong: [
    /\b(clearly|obviously|certainly|undoubtedly|definitely)\b/gi,
    /\b(must|necessarily|inevitably|always)\b/gi,
    /\b(proves|demonstrates conclusively|establishes beyond doubt)\b/gi,
  ],
  balanced: [
    /\b(I argue that|I contend|the evidence suggests)\b/gi,
    /\b(plausibly|reasonably|on balance)\b/gi,
    /\b(the most compelling reading|a defensible interpretation)\b/gi,
  ],
};

/**
 * PhilosophicalFeedbackProcessor class
 */
export class PhilosophicalFeedbackProcessor {
  /**
   * Analyze philosophical feedback from a correction
   */
  analyzeCorrection(
    originalText: string,
    correctedText: string
  ): PhilosophicalFeedbackAnalysis {
    const terminologyChanges = this.detectTerminologyChanges(originalText, correctedText);
    const argumentChanges = this.detectArgumentChanges(originalText, correctedText);
    const citationChanges = this.detectCitationChanges(originalText, correctedText);
    const philosophicalIssues = this.identifyPhilosophicalIssues(
      originalText,
      correctedText,
      terminologyChanges,
      argumentChanges,
      citationChanges
    );

    const overallAssessment = this.calculateAssessment(
      terminologyChanges,
      argumentChanges,
      citationChanges,
      philosophicalIssues
    );

    return {
      originalText,
      correctedText,
      philosophicalIssues,
      terminologyChanges,
      argumentChanges,
      citationChanges,
      overallAssessment,
    };
  }

  /**
   * Convert philosophical issues to standard StyleIssue format
   */
  toStyleIssues(philosophicalIssues: PhilosophicalIssue[]): StyleIssue[] {
    return philosophicalIssues.map(pi => ({
      type: this.mapToBaseIssueType(pi.philosophicalType),
      description: pi.description,
      originalSnippet: pi.originalSnippet,
      correctedSnippet: pi.correctedSnippet,
    }));
  }

  /**
   * Generate learning patterns from philosophical feedback
   */
  generateLearningPatterns(
    analysis: PhilosophicalFeedbackAnalysis
  ): PatternDiff[] {
    const patterns: PatternDiff[] = [];

    // Learn from terminology changes
    for (const change of analysis.terminologyChanges) {
      if (change.originalUsage !== change.correctedUsage) {
        patterns.push({
          type: 'modified',
          category: 'word' as PatternCategory,
          original: change.originalUsage,
          corrected: change.correctedUsage,
          frequency: 1,
          weight: change.isGreek ? 0.8 : 0.6,  // Greek terms are more important
        });
      }
    }

    // Learn from argument structure changes
    for (const change of analysis.argumentChanges) {
      if (change.type === 'strengthened' || change.type === 'added') {
        patterns.push({
          type: 'added',
          category: 'structure' as PatternCategory,
          original: '',
          corrected: change.correctedStructure,
          frequency: 1,
          weight: 0.7,
        });
      } else if (change.type === 'removed' && change.originalStructure) {
        patterns.push({
          type: 'removed',
          category: 'structure' as PatternCategory,
          original: change.originalStructure,
          corrected: '',
          frequency: 1,
          weight: 0.5,
        });
      }
    }

    // Learn from citation changes
    for (const change of analysis.citationChanges) {
      if (change.type === 'modified' && change.originalReference && change.correctedReference) {
        patterns.push({
          type: 'modified',
          category: 'citation' as PatternCategory,
          original: change.originalReference,
          corrected: change.correctedReference,
          frequency: 1,
          weight: 0.6,
        });
      }
    }

    return patterns;
  }

  /**
   * Generate enhanced prompt section from philosophical feedback
   */
  generatePromptEnhancement(
    analyses: PhilosophicalFeedbackAnalysis[]
  ): string {
    const lines: string[] = [
      '## PHILOSOPHICAL WRITING GUIDANCE (from user corrections)',
      '',
    ];

    // Collect terminology preferences
    const termPreferences = new Map<string, { preferred: string; count: number }>();
    for (const analysis of analyses) {
      for (const change of analysis.terminologyChanges) {
        const key = change.term.toLowerCase();
        const existing = termPreferences.get(key);
        if (existing) {
          existing.count++;
          existing.preferred = change.correctedUsage;
        } else {
          termPreferences.set(key, { preferred: change.correctedUsage, count: 1 });
        }
      }
    }

    if (termPreferences.size > 0) {
      lines.push('### Terminology Preferences');
      for (const [term, data] of Array.from(termPreferences.entries())) {
        if (data.count >= 1) {
          lines.push(`- **${term}**: Use "${data.preferred}"`);
        }
      }
      lines.push('');
    }

    // Collect argument structure preferences
    const structureIssues = analyses
      .flatMap(a => a.philosophicalIssues)
      .filter(i => ['argument_structure', 'dialectical_move', 'interpretive_claim'].includes(i.philosophicalType));

    if (structureIssues.length > 0) {
      lines.push('### Argument Structure Guidance');
      const uniqueGuidance = new Set<string>();
      for (const issue of structureIssues) {
        if (issue.suggestedRevision && !uniqueGuidance.has(issue.suggestedRevision)) {
          uniqueGuidance.add(issue.suggestedRevision);
          lines.push(`- ${issue.suggestedRevision}`);
        }
      }
      lines.push('');
    }

    // Collect hedging preferences
    const hedgingIssues = analyses
      .flatMap(a => a.philosophicalIssues)
      .filter(i => i.philosophicalType === 'hedging_balance');

    if (hedgingIssues.length > 0) {
      const overHedged = hedgingIssues.filter(i => i.description.includes('over-hedged')).length;
      const underHedged = hedgingIssues.filter(i => i.description.includes('under-hedged')).length;

      lines.push('### Hedging Calibration');
      if (overHedged > underHedged) {
        lines.push('- User prefers more assertive claims; reduce excessive hedging');
        lines.push('- Use "I argue that..." rather than "It might seem that..."');
      } else if (underHedged > overHedged) {
        lines.push('- User prefers more cautious claims; add appropriate hedging');
        lines.push('- Use "suggests" or "indicates" rather than "proves" or "demonstrates"');
      }
      lines.push('');
    }

    // Collect Greek term handling preferences
    const greekIssues = analyses
      .flatMap(a => a.philosophicalIssues)
      .filter(i => i.philosophicalType === 'greek_transliteration');

    if (greekIssues.length > 0) {
      lines.push('### Greek Term Handling');
      const italicized = greekIssues.filter(i => i.context.actualUsage?.includes('*')).length;
      const parenthetical = greekIssues.filter(i => i.context.actualUsage?.includes('(')).length;

      if (italicized > parenthetical) {
        lines.push('- Italicize Greek terms: *phantasia*, *nous*');
      } else {
        lines.push('- Use parenthetical Greek: imagination (phantasia), mind (nous)');
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private detectTerminologyChanges(
    originalText: string,
    correctedText: string
  ): TerminologyChange[] {
    const changes: TerminologyChange[] = [];

    // Check Greek terms
    for (const patterns of Object.values(GREEK_TERM_PATTERNS)) {
      for (const pattern of patterns) {
        const origMatches = Array.from(originalText.matchAll(pattern));
        const corrMatches = Array.from(correctedText.matchAll(pattern));

        // Look for changes in how terms are used
        for (const origMatch of origMatches) {
          const term = origMatch[0].toLowerCase();
          const origContext = this.extractContext(originalText, origMatch.index || 0, 50);
          const corrContext = this.findSimilarContext(correctedText, term, 50);

          if (corrContext && origContext !== corrContext) {
            changes.push({
              term,
              originalUsage: origContext,
              correctedUsage: corrContext,
              isGreek: true,
              context: origContext,
            });
          }
        }
      }
    }

    return changes;
  }

  private detectArgumentChanges(
    originalText: string,
    correctedText: string
  ): ArgumentChange[] {
    const changes: ArgumentChange[] = [];

    // Check each argument component
    for (const [component, patterns] of Object.entries(ARGUMENT_PATTERNS)) {
      let origCount = 0;
      let corrCount = 0;

      for (const pattern of patterns) {
        origCount += (originalText.match(pattern) || []).length;
        corrCount += (correctedText.match(pattern) || []).length;
      }

      if (corrCount > origCount) {
        changes.push({
          type: 'added',
          component: component as ArgumentChange['component'],
          correctedStructure: `Added ${component} markers`,
          reason: 'Strengthened argument structure',
        });
      } else if (corrCount < origCount) {
        changes.push({
          type: 'removed',
          component: component as ArgumentChange['component'],
          originalStructure: `Removed ${component} markers`,
          correctedStructure: 'Simplified structure',
          reason: 'Streamlined argument',
        });
      }
    }

    return changes;
  }

  private detectCitationChanges(
    originalText: string,
    correctedText: string
  ): CitationChange[] {
    const changes: CitationChange[] = [];

    // Detect Bekker notation changes
    const bekkerPattern = /\b(\d+[a-z]?\d*[-–]\d+)\b/g;
    const origBekker = Array.from(originalText.matchAll(bekkerPattern));
    const corrBekker = Array.from(correctedText.matchAll(bekkerPattern));

    if (corrBekker.length > origBekker.length) {
      changes.push({
        type: 'added',
        integrationStyle: 'info-prominent',
      });
    }

    // Detect author-prominent citation patterns
    const authorPattern = /(?:as|according to)\s+[A-Z][a-z]+\s+(?:argues|claims|suggests)/g;
    const origAuthor = (originalText.match(authorPattern) || []).length;
    const corrAuthor = (correctedText.match(authorPattern) || []).length;

    if (corrAuthor > origAuthor) {
      changes.push({
        type: 'added',
        integrationStyle: 'author-prominent',
      });
    } else if (corrAuthor < origAuthor) {
      changes.push({
        type: 'removed',
        integrationStyle: 'author-prominent',
      });
    }

    return changes;
  }

  private identifyPhilosophicalIssues(
    originalText: string,
    correctedText: string,
    terminologyChanges: TerminologyChange[],
    argumentChanges: ArgumentChange[],
    citationChanges: CitationChange[]
  ): PhilosophicalIssue[] {
    const issues: PhilosophicalIssue[] = [];

    // Terminology inconsistencies
    for (const change of terminologyChanges) {
      issues.push({
        type: 'word_choice',
        philosophicalType: change.isGreek ? 'greek_transliteration' : 'terminology_inconsistency',
        severity: change.isGreek ? 'major' : 'minor',
        description: `Terminology change: "${change.originalUsage}" -> "${change.correctedUsage}"`,
        originalSnippet: change.originalUsage,
        correctedSnippet: change.correctedUsage,
        context: {
          term: change.term,
          expectedUsage: change.correctedUsage,
          actualUsage: change.originalUsage,
        },
        suggestedRevision: `Use "${change.correctedUsage}" consistently`,
      });
    }

    // Argument structure issues
    for (const change of argumentChanges) {
      if (change.type === 'added') {
        issues.push({
          type: 'argument_style',
          philosophicalType: 'argument_structure',
          severity: change.component === 'evidence' ? 'major' : 'minor',
          description: `Missing ${change.component} in argument structure`,
          originalSnippet: originalText.substring(0, 100),
          correctedSnippet: change.correctedStructure,
          context: {},
          suggestedRevision: `Include explicit ${change.component} markers`,
        });
      }
    }

    // Hedging analysis
    const origWeakHedge = this.countPatterns(originalText, HEDGING_PATTERNS.weak);
    const corrWeakHedge = this.countPatterns(correctedText, HEDGING_PATTERNS.weak);
    const origStrongHedge = this.countPatterns(originalText, HEDGING_PATTERNS.strong);
    const corrStrongHedge = this.countPatterns(correctedText, HEDGING_PATTERNS.strong);

    if (corrWeakHedge < origWeakHedge && corrStrongHedge >= origStrongHedge) {
      issues.push({
        type: 'tone',
        philosophicalType: 'hedging_balance',
        severity: 'minor',
        description: 'Text was over-hedged; user prefers more assertive claims',
        originalSnippet: 'Multiple hedging markers',
        correctedSnippet: 'Reduced hedging',
        context: {},
        suggestedRevision: 'Reduce excessive hedging; use more direct claims',
      });
    } else if (corrWeakHedge > origWeakHedge || corrStrongHedge < origStrongHedge) {
      issues.push({
        type: 'tone',
        philosophicalType: 'hedging_balance',
        severity: 'minor',
        description: 'Text was under-hedged; user prefers more cautious claims',
        originalSnippet: 'Strong claims without qualification',
        correctedSnippet: 'Added hedging',
        context: {},
        suggestedRevision: 'Add appropriate hedging to interpretive claims',
      });
    }

    // Citation integration issues
    for (const change of citationChanges) {
      if (change.type === 'added' && change.integrationStyle) {
        issues.push({
          type: 'citation_style',
          philosophicalType: 'textual_evidence',
          severity: 'major',
          description: `Missing ${change.integrationStyle} citation`,
          originalSnippet: 'No citation',
          correctedSnippet: `Added ${change.integrationStyle} citation`,
          context: {},
          suggestedRevision: `Include ${change.integrationStyle} citations for claims`,
        });
      }
    }

    return issues;
  }

  private calculateAssessment(
    terminologyChanges: TerminologyChange[],
    argumentChanges: ArgumentChange[],
    citationChanges: CitationChange[],
    issues: PhilosophicalIssue[]
  ): PhilosophicalFeedbackAnalysis['overallAssessment'] {
    // Scores start at 1.0 and decrease based on issues
    let terminologyScore = 1.0;
    let argumentScore = 1.0;
    let evidenceScore = 1.0;
    let voiceScore = 1.0;

    // Penalize for terminology issues
    terminologyScore -= terminologyChanges.length * 0.1;
    terminologyScore = Math.max(0, terminologyScore);

    // Penalize for argument structure issues
    const argIssues = argumentChanges.filter(c => c.type === 'added').length;
    argumentScore -= argIssues * 0.15;
    argumentScore = Math.max(0, argumentScore);

    // Penalize for citation/evidence issues
    const citationIssues = citationChanges.filter(c => c.type === 'added').length;
    evidenceScore -= citationIssues * 0.2;
    evidenceScore = Math.max(0, evidenceScore);

    // Penalize for voice issues (hedging, author voice confusion)
    const voiceIssues = issues.filter(i =>
      ['hedging_balance', 'author_voice'].includes(i.philosophicalType)
    ).length;
    voiceScore -= voiceIssues * 0.15;
    voiceScore = Math.max(0, voiceScore);

    return {
      terminologyScore,
      argumentScore,
      evidenceScore,
      voiceScore,
    };
  }

  private mapToBaseIssueType(philosophicalType: PhilosophicalIssueType): IssueType {
    const mapping: Record<PhilosophicalIssueType, IssueType> = {
      terminology_inconsistency: 'word_choice',
      argument_structure: 'argument_style',
      interpretive_claim: 'argument_style',
      phenomenological_description: 'argument_style',
      dialectical_move: 'argument_style',
      textual_evidence: 'citation_style',
      hedging_balance: 'tone',
      greek_transliteration: 'word_choice',
      author_voice: 'tone',
      anachronism: 'word_choice',
    };
    return mapping[philosophicalType];
  }

  private extractContext(text: string, index: number, radius: number): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.substring(start, end).trim();
  }

  private findSimilarContext(text: string, term: string, radius: number): string | null {
    const pattern = new RegExp(`\\b${term}\\b`, 'gi');
    const match = pattern.exec(text);
    if (match) {
      return this.extractContext(text, match.index, radius);
    }
    return null;
  }

  private countPatterns(text: string, patterns: RegExp[]): number {
    let count = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      count += matches ? matches.length : 0;
    }
    return count;
  }
}
