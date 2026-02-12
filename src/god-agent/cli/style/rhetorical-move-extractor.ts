/**
 * RhetoricalMoveExtractor - Extracts CARS (Create A Research Space) model patterns
 * Implements deep rhetorical pattern extraction for academic writing style analysis
 *
 * The CARS model (Swales, 1990) identifies three key moves in academic introductions:
 * - Movement 1: Establishing territory (topic introduction, general claims)
 * - Movement 2: Establishing niche (identifying gaps, raising questions)
 * - Movement 3: Occupying niche (purpose statements, previews)
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Patterns for establishing research territory (Move 1)
 */
export interface EstablishingTerritoryPatterns {
  /** Phrases that introduce the research topic */
  topicIntroducers: string[];
  /** Patterns for making general claims about the field */
  generalClaimPatterns: string[];
  /** Phrases for positioning work within a field */
  fieldPositioning: string[];
  /** Confidence score for pattern detection (0-1) */
  confidence: number;
}

/**
 * Patterns for establishing research niche (Move 2)
 */
export interface EstablishingNichePatterns {
  /** Phrases indicating gaps in existing research */
  gapIndicators: string[];
  /** Patterns for raising research questions */
  questionRaisers: string[];
  /** Markers for contrasting with previous work */
  contrastMarkers: string[];
  /** Confidence score for pattern detection (0-1) */
  confidence: number;
}

/**
 * Patterns for occupying the research niche (Move 3)
 */
export interface OccupyingNichePatterns {
  /** Statements declaring research purpose */
  purposeStatements: string[];
  /** Previews of methodology or approach */
  methodPreviews: string[];
  /** Claims about research contributions */
  contributionClaims: string[];
  /** Confidence score for pattern detection (0-1) */
  confidence: number;
}

/**
 * Complete rhetorical move patterns following CARS model
 */
export interface RhetoricalMovePatterns {
  establishingTerritory: EstablishingTerritoryPatterns;
  establishingNiche: EstablishingNichePatterns;
  occupyingNiche: OccupyingNichePatterns;
  /** Overall confidence in pattern extraction */
  overallConfidence: number;
  /** Number of text segments analyzed */
  segmentsAnalyzed: number;
}

// Move 1: Establishing Territory - Pattern templates
const TOPIC_INTRODUCER_PATTERNS = [
  /^(this\s+(study|research|paper|dissertation|thesis|investigation|analysis|work)\s+(examines?|investigates?|explores?|analyzes?|focuses\s+on|addresses|considers))/i,
  /^(research\s+on\s+\w+\s+has\s+(shown|demonstrated|revealed|indicated|established))/i,
  /^(the\s+(study|field|area|domain|discipline)\s+of\s+\w+)/i,
  /^(in\s+recent\s+(years|decades?|times?),?\s+\w+\s+has)/i,
  /^(scholars?\s+(have\s+long|increasingly)\s+(recognized|acknowledged|noted))/i,
  /^(the\s+(importance|significance|role|impact)\s+of\s+\w+)/i,
  /^(\w+\s+is\s+(widely|generally|commonly|increasingly)\s+(recognized|acknowledged|understood))/i,
  /^(over\s+the\s+past\s+\w+,?\s+\w+\s+has)/i,
  /^(a\s+(growing|considerable|substantial)\s+(body\s+of|amount\s+of)\s+(research|literature|evidence))/i,
];

const GENERAL_CLAIM_PATTERNS = [
  /^(it\s+is\s+(widely|generally|commonly)\s+(accepted|recognized|acknowledged)\s+that)/i,
  /^(there\s+is\s+(considerable|growing|mounting)\s+evidence\s+that)/i,
  /^(previous\s+(research|studies|work)\s+(has\s+)?(shown|demonstrated|established))/i,
  /^(the\s+literature\s+(suggests?|indicates?|demonstrates?))/i,
  /^(much\s+(attention|research|effort)\s+has\s+been\s+(devoted|given|paid)\s+to)/i,
  /^(numerous\s+(studies|researchers?|scholars?)\s+have)/i,
  /^(\w+\s+(plays?|has)\s+(an?\s+)?(important|crucial|critical|significant|key|vital)\s+role)/i,
];

const FIELD_POSITIONING_PATTERNS = [
  /(within\s+the\s+(field|context|framework|domain)\s+of)/i,
  /(in\s+the\s+(context|area|domain|realm)\s+of)/i,
  /(from\s+(a|an|the)\s+\w+\s+perspective)/i,
  /(drawing\s+(on|upon)\s+\w+\s+(theory|literature|research))/i,
  /(situated\s+(within|in)\s+the\s+\w+\s+tradition)/i,
  /(building\s+on\s+(the\s+)?(work|research|findings)\s+of)/i,
  /(following\s+(\w+\s+)+approach)/i,
];

// Move 2: Establishing Niche - Pattern templates
const GAP_INDICATOR_PATTERNS = [
  /^(however,?\s+(little|few|no)\s+(is\s+known|research\s+exists?|attention\s+has\s+been))/i,
  /^(yet,?\s+(the|this)\s+(question|issue|problem|aspect)\s+(remains?|has\s+not\s+been))/i,
  /^(despite\s+(this|these)\s+(advances?|developments?|efforts?),?\s+\w+\s+remains?)/i,
  /^(while\s+(much|considerable)\s+(attention|research)\s+has\s+been\s+\w+,?\s+(little|less))/i,
  /^(to\s+date,?\s+(no|few|little)\s+(studies?|research|work)\s+has)/i,
  /^(there\s+(remains?|is)\s+(a\s+)?(significant|notable|considerable)\s+(gap|lack|need))/i,
  /^(what\s+(remains?|is)\s+(unclear|unknown|unexplored|understudied))/i,
  /^(a\s+(critical|key|fundamental|important)\s+(gap|limitation)\s+(in|exists?))/i,
  /^(one\s+(limitation|gap|weakness)\s+(of|in)\s+(existing|prior|previous))/i,
];

const QUESTION_RAISER_PATTERNS = [
  /^(what\s+remains\s+(unclear|unknown)\s+is)/i,
  /^(the\s+question\s+(remains|arises|emerges)\s+(as\s+to\s+)?(whether|how|why|what))/i,
  /^(this\s+raises\s+(the\s+)?(question|issue)\s+of)/i,
  /^(an?\s+(important|key|central|fundamental)\s+question\s+is)/i,
  /^(it\s+is\s+(not\s+clear|unclear|uncertain)\s+(whether|how|why))/i,
  /^(we\s+do\s+not\s+(yet\s+)?(know|understand)\s+(whether|how|why))/i,
  /^(little\s+is\s+(known|understood)\s+about\s+(how|why|whether))/i,
];

const CONTRAST_MARKER_PATTERNS = [
  /^(in\s+contrast\s+to\s+(previous|prior|existing|earlier))/i,
  /^(unlike\s+(previous|prior|existing|earlier)\s+(research|studies|work))/i,
  /^(contrary\s+to\s+(the|these|such)\s+(findings?|claims?|assumptions?))/i,
  /^(while\s+(others?|some|many)\s+have\s+(argued|claimed|suggested))/i,
  /^(in\s+opposition\s+to)/i,
  /^(different\s+from\s+(the|these)\s+approaches?)/i,
  /^(rather\s+than\s+(focusing|examining|investigating))/i,
];

// Move 3: Occupying Niche - Pattern templates
const PURPOSE_STATEMENT_PATTERNS = [
  /^(this\s+(dissertation|thesis|study|paper|research|work|investigation)\s+(argues?|contends?|demonstrates?|shows?|proposes?|examines?|investigates?))/i,
  /^(i\s+(argue|contend|demonstrate|show|propose)\s+that)/i,
  /^(we\s+(argue|contend|demonstrate|show|propose)\s+that)/i,
  /^(the\s+(purpose|aim|goal|objective)\s+of\s+this\s+(study|research|dissertation|thesis|work)\s+is\s+to)/i,
  /^(this\s+(article|paper|study)\s+(seeks|aims|attempts)\s+to)/i,
  /^(the\s+(central|main|primary|key)\s+(argument|claim|thesis)\s+(of\s+this|is\s+that))/i,
  /^(in\s+this\s+(dissertation|thesis|study|paper),?\s+(i|we)\s+(argue|contend|propose|examine))/i,
  /^(my\s+(argument|thesis|contention|claim)\s+is\s+that)/i,
  /^(specifically,?\s+this\s+(study|research|work)\s+(examines?|investigates?|explores?))/i,
];

const METHOD_PREVIEW_PATTERNS = [
  /^(to\s+(address|examine|investigate|explore|answer)\s+this\s+(question|issue|problem),?\s+(i|we|this\s+study))/i,
  /^(using\s+(a|an|the)\s+\w+\s+(approach|method|methodology|framework))/i,
  /^(through\s+(a|an)\s+\w+\s+(analysis|examination|investigation))/i,
  /^(this\s+(study|research)\s+(employs?|uses?|utilizes?|applies?)\s+(a|an|the))/i,
  /^(drawing\s+on\s+\w+\s+(methods?|methodology|techniques?))/i,
  /^(by\s+(examining|analyzing|investigating|exploring)\s+\w+)/i,
  /^(the\s+(methodology|approach|method)\s+(employed|used|adopted)\s+(here|in\s+this))/i,
];

const CONTRIBUTION_CLAIM_PATTERNS = [
  /^(this\s+(study|research|work|dissertation|thesis)\s+(contributes?|adds?|offers?)\s+to)/i,
  /^(the\s+(contribution|significance|importance)\s+of\s+this\s+(study|work|research))/i,
  /^(this\s+(research|work|study)\s+(makes?|provides?)\s+(a|an|several)\s+\w+\s+contribution)/i,
  /^(in\s+doing\s+so,?\s+this\s+(study|research|work)\s+(contributes?|advances?))/i,
  /^(this\s+(analysis|examination|investigation)\s+(advances?|extends?|enriches?))/i,
  /^(the\s+(findings?|results?)\s+(of\s+this\s+study\s+)?(will\s+)?(contribute|add)\s+to)/i,
  /^(by\s+\w+,?\s+this\s+(study|research)\s+(fills?|addresses?)\s+(a|the)\s+gap)/i,
];

/**
 * Extracts CARS model rhetorical patterns from academic text
 */
export class RhetoricalMoveExtractor {
  private minTextLength = 100;

  /**
   * Extract rhetorical move patterns from text
   * @param text - Academic text to analyze
   * @returns Extracted rhetorical patterns with confidence scores
   */
  extractFromText(text: string): RhetoricalMovePatterns {
    if (!text || text.length < this.minTextLength) {
      return this.createEmptyPatterns();
    }

    const sentences = this.extractSentences(text);
    const paragraphs = this.extractParagraphs(text);

    const establishingTerritory = this.extractTerritoryPatterns(sentences, paragraphs);
    const establishingNiche = this.extractNichePatterns(sentences, paragraphs);
    const occupyingNiche = this.extractOccupyingPatterns(sentences, paragraphs);

    const overallConfidence = this.calculateOverallConfidence(
      establishingTerritory,
      establishingNiche,
      occupyingNiche
    );

    return {
      establishingTerritory,
      establishingNiche,
      occupyingNiche,
      overallConfidence,
      segmentsAnalyzed: sentences.length,
    };
  }

  /**
   * Extract rhetorical patterns from a PDF file
   * @param pdfPath - Path to the PDF file
   * @returns Promise resolving to extracted patterns
   */
  async extractFromPDF(pdfPath: string): Promise<RhetoricalMovePatterns> {
    // Read PDF content - for now, assume text extraction is done externally
    // In a full implementation, this would use a PDF parsing library
    const absolutePath = path.resolve(pdfPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`PDF file not found: ${absolutePath}`);
    }

    // For text-based extraction, we check if there's a corresponding .txt file
    const txtPath = absolutePath.replace(/\.pdf$/i, '.txt');
    if (fs.existsSync(txtPath)) {
      const text = fs.readFileSync(txtPath, 'utf-8');
      return this.extractFromText(text);
    }

    // Return empty patterns if no text available
    // Production would integrate with pdf-parse or similar
    console.warn(`No text extraction available for PDF: ${pdfPath}`);
    return this.createEmptyPatterns();
  }

  /**
   * Merge multiple pattern analyses into a composite profile
   * @param patterns - Array of patterns to merge
   * @returns Merged pattern set
   */
  mergePatterns(patterns: RhetoricalMovePatterns[]): RhetoricalMovePatterns {
    if (patterns.length === 0) {
      return this.createEmptyPatterns();
    }

    if (patterns.length === 1) {
      return patterns[0];
    }

    return {
      establishingTerritory: this.mergeTerritoryPatterns(
        patterns.map(p => p.establishingTerritory)
      ),
      establishingNiche: this.mergeNichePatterns(
        patterns.map(p => p.establishingNiche)
      ),
      occupyingNiche: this.mergeOccupyingPatterns(
        patterns.map(p => p.occupyingNiche)
      ),
      overallConfidence: this.averageConfidence(patterns.map(p => p.overallConfidence)),
      segmentsAnalyzed: patterns.reduce((sum, p) => sum + p.segmentsAnalyzed, 0),
    };
  }

  /**
   * Generate a style prompt section for rhetorical moves
   * @param patterns - Extracted rhetorical patterns
   * @returns Formatted prompt string
   */
  generatePromptSection(patterns: RhetoricalMovePatterns): string {
    const parts: string[] = [];

    parts.push('Rhetorical Move Patterns (CARS Model):');

    // Move 1: Establishing Territory
    if (patterns.establishingTerritory.confidence > 0.3) {
      parts.push('\n  Move 1 - Establishing Territory:');
      if (patterns.establishingTerritory.topicIntroducers.length > 0) {
        parts.push(`    - Topic introducers: ${patterns.establishingTerritory.topicIntroducers.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.establishingTerritory.generalClaimPatterns.length > 0) {
        parts.push(`    - General claims: ${patterns.establishingTerritory.generalClaimPatterns.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.establishingTerritory.fieldPositioning.length > 0) {
        parts.push(`    - Field positioning: ${patterns.establishingTerritory.fieldPositioning.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    // Move 2: Establishing Niche
    if (patterns.establishingNiche.confidence > 0.3) {
      parts.push('\n  Move 2 - Establishing Niche:');
      if (patterns.establishingNiche.gapIndicators.length > 0) {
        parts.push(`    - Gap indicators: ${patterns.establishingNiche.gapIndicators.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.establishingNiche.questionRaisers.length > 0) {
        parts.push(`    - Question raisers: ${patterns.establishingNiche.questionRaisers.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.establishingNiche.contrastMarkers.length > 0) {
        parts.push(`    - Contrast markers: ${patterns.establishingNiche.contrastMarkers.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    // Move 3: Occupying Niche
    if (patterns.occupyingNiche.confidence > 0.3) {
      parts.push('\n  Move 3 - Occupying Niche:');
      if (patterns.occupyingNiche.purposeStatements.length > 0) {
        parts.push(`    - Purpose statements: ${patterns.occupyingNiche.purposeStatements.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.occupyingNiche.methodPreviews.length > 0) {
        parts.push(`    - Method previews: ${patterns.occupyingNiche.methodPreviews.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.occupyingNiche.contributionClaims.length > 0) {
        parts.push(`    - Contribution claims: ${patterns.occupyingNiche.contributionClaims.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    if (patterns.overallConfidence < 0.3) {
      parts.push('\n  Note: Low confidence in rhetorical pattern detection. Use general academic patterns.');
    }

    return parts.join('\n');
  }

  // Private extraction methods

  private extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  private extractParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
  }

  private extractTerritoryPatterns(sentences: string[], paragraphs: string[]): EstablishingTerritoryPatterns {
    const topicIntroducers: string[] = [];
    const generalClaimPatterns: string[] = [];
    const fieldPositioning: string[] = [];

    // Analyze first paragraphs and sentences (territory is typically established early)
    const earlyText = paragraphs.slice(0, 5).concat(sentences.slice(0, 20));

    for (const segment of earlyText) {
      // Check topic introducers
      for (const pattern of TOPIC_INTRODUCER_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!topicIntroducers.includes(extracted)) {
            topicIntroducers.push(extracted);
          }
        }
      }

      // Check general claims
      for (const pattern of GENERAL_CLAIM_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!generalClaimPatterns.includes(extracted)) {
            generalClaimPatterns.push(extracted);
          }
        }
      }

      // Check field positioning
      for (const pattern of FIELD_POSITIONING_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!fieldPositioning.includes(extracted)) {
            fieldPositioning.push(extracted);
          }
        }
      }
    }

    const totalFound = topicIntroducers.length + generalClaimPatterns.length + fieldPositioning.length;
    const confidence = Math.min(1, totalFound / 10);

    return {
      topicIntroducers: topicIntroducers.slice(0, 10),
      generalClaimPatterns: generalClaimPatterns.slice(0, 10),
      fieldPositioning: fieldPositioning.slice(0, 5),
      confidence,
    };
  }

  private extractNichePatterns(sentences: string[], paragraphs: string[]): EstablishingNichePatterns {
    const gapIndicators: string[] = [];
    const questionRaisers: string[] = [];
    const contrastMarkers: string[] = [];

    // Niche establishment often appears after territory (middle of intro)
    const middleText = sentences.slice(5, 40);

    for (const segment of middleText) {
      // Check gap indicators
      for (const pattern of GAP_INDICATOR_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!gapIndicators.includes(extracted)) {
            gapIndicators.push(extracted);
          }
        }
      }

      // Check question raisers
      for (const pattern of QUESTION_RAISER_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!questionRaisers.includes(extracted)) {
            questionRaisers.push(extracted);
          }
        }
      }

      // Check contrast markers
      for (const pattern of CONTRAST_MARKER_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!contrastMarkers.includes(extracted)) {
            contrastMarkers.push(extracted);
          }
        }
      }
    }

    const totalFound = gapIndicators.length + questionRaisers.length + contrastMarkers.length;
    const confidence = Math.min(1, totalFound / 8);

    return {
      gapIndicators: gapIndicators.slice(0, 10),
      questionRaisers: questionRaisers.slice(0, 5),
      contrastMarkers: contrastMarkers.slice(0, 5),
      confidence,
    };
  }

  private extractOccupyingPatterns(sentences: string[], paragraphs: string[]): OccupyingNichePatterns {
    const purposeStatements: string[] = [];
    const methodPreviews: string[] = [];
    const contributionClaims: string[] = [];

    // Occupying niche appears in the latter part of introduction and methodology
    const allText = sentences;

    for (const segment of allText) {
      // Check purpose statements
      for (const pattern of PURPOSE_STATEMENT_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!purposeStatements.includes(extracted)) {
            purposeStatements.push(extracted);
          }
        }
      }

      // Check method previews
      for (const pattern of METHOD_PREVIEW_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!methodPreviews.includes(extracted)) {
            methodPreviews.push(extracted);
          }
        }
      }

      // Check contribution claims
      for (const pattern of CONTRIBUTION_CLAIM_PATTERNS) {
        const match = segment.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!contributionClaims.includes(extracted)) {
            contributionClaims.push(extracted);
          }
        }
      }
    }

    const totalFound = purposeStatements.length + methodPreviews.length + contributionClaims.length;
    const confidence = Math.min(1, totalFound / 8);

    return {
      purposeStatements: purposeStatements.slice(0, 10),
      methodPreviews: methodPreviews.slice(0, 5),
      contributionClaims: contributionClaims.slice(0, 5),
      confidence,
    };
  }

  // Helper methods

  private cleanPattern(pattern: string): string {
    return pattern
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private calculateOverallConfidence(
    territory: EstablishingTerritoryPatterns,
    niche: EstablishingNichePatterns,
    occupying: OccupyingNichePatterns
  ): number {
    // Weighted average - all three moves are equally important
    return (territory.confidence + niche.confidence + occupying.confidence) / 3;
  }

  private averageConfidence(confidences: number[]): number {
    if (confidences.length === 0) return 0;
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }

  private mergeTerritoryPatterns(patterns: EstablishingTerritoryPatterns[]): EstablishingTerritoryPatterns {
    return {
      topicIntroducers: this.mergeAndDedupe(patterns.map(p => p.topicIntroducers), 15),
      generalClaimPatterns: this.mergeAndDedupe(patterns.map(p => p.generalClaimPatterns), 15),
      fieldPositioning: this.mergeAndDedupe(patterns.map(p => p.fieldPositioning), 10),
      confidence: this.averageConfidence(patterns.map(p => p.confidence)),
    };
  }

  private mergeNichePatterns(patterns: EstablishingNichePatterns[]): EstablishingNichePatterns {
    return {
      gapIndicators: this.mergeAndDedupe(patterns.map(p => p.gapIndicators), 15),
      questionRaisers: this.mergeAndDedupe(patterns.map(p => p.questionRaisers), 10),
      contrastMarkers: this.mergeAndDedupe(patterns.map(p => p.contrastMarkers), 10),
      confidence: this.averageConfidence(patterns.map(p => p.confidence)),
    };
  }

  private mergeOccupyingPatterns(patterns: OccupyingNichePatterns[]): OccupyingNichePatterns {
    return {
      purposeStatements: this.mergeAndDedupe(patterns.map(p => p.purposeStatements), 15),
      methodPreviews: this.mergeAndDedupe(patterns.map(p => p.methodPreviews), 10),
      contributionClaims: this.mergeAndDedupe(patterns.map(p => p.contributionClaims), 10),
      confidence: this.averageConfidence(patterns.map(p => p.confidence)),
    };
  }

  private mergeAndDedupe(arrays: string[][], limit: number): string[] {
    const counts = new Map<string, number>();
    for (const arr of arrays) {
      for (const item of arr) {
        counts.set(item, (counts.get(item) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  private createEmptyPatterns(): RhetoricalMovePatterns {
    return {
      establishingTerritory: {
        topicIntroducers: [],
        generalClaimPatterns: [],
        fieldPositioning: [],
        confidence: 0,
      },
      establishingNiche: {
        gapIndicators: [],
        questionRaisers: [],
        contrastMarkers: [],
        confidence: 0,
      },
      occupyingNiche: {
        purposeStatements: [],
        methodPreviews: [],
        contributionClaims: [],
        confidence: 0,
      },
      overallConfidence: 0,
      segmentsAnalyzed: 0,
    };
  }
}
