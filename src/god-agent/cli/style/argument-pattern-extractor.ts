/**
 * ArgumentPatternExtractor - Extracts argument structure patterns from academic writing
 * Based on the Toulmin model of argumentation: claim, evidence, warrant, backing, qualifier, rebuttal
 */

/**
 * Patterns for making claims
 */
export interface ClaimStructure {
  /** Phrases that introduce claims */
  claimMarkers: string[];
  /** Hedging patterns that soften claims */
  hedgingPatterns: string[];
  /** Strong assertion markers */
  strengthIndicators: string[];
  /** Preferred claim strength: strong, moderate, or cautious */
  claimStrength: 'strong' | 'moderate' | 'cautious';
  /** Confidence in detection (0-1) */
  confidence: number;
}

/**
 * Patterns for integrating evidence
 */
export interface EvidenceIntegration {
  /** Phrases that introduce evidence */
  evidenceIntroducers: string[];
  /** Markers for examples */
  exampleMarkers: string[];
  /** References to data visualizations */
  dataReferences: string[];
  /** Types of evidence commonly used */
  evidenceTypes: string[];
  /** Confidence in detection (0-1) */
  confidence: number;
}

/**
 * Patterns for connecting evidence to claims (warrants)
 */
export interface WarrantConnection {
  /** "Because" patterns for explaining reasoning */
  becausePatterns: string[];
  /** "Therefore" patterns for drawing conclusions */
  thereforePatterns: string[];
  /** Phrases indicating implications */
  implicationMarkers: string[];
  /** Explicit reasoning patterns */
  reasoningConnectors: string[];
  /** Confidence in detection (0-1) */
  confidence: number;
}

/**
 * Patterns for handling counterarguments
 */
export interface CounterargumentHandling {
  /** Phrases introducing objections */
  objectionIntroducers: string[];
  /** Concession patterns */
  concessionPatterns: string[];
  /** Refutation patterns */
  refutationPatterns: string[];
  /** Where counterarguments appear in relation to claims */
  style: 'before_claim' | 'after_claim' | 'integrated';
  /** How often counterarguments are addressed */
  frequency: 'frequent' | 'occasional' | 'rare';
  /** Confidence in detection (0-1) */
  confidence: number;
}

/**
 * A detected argument block in the text
 */
export interface ArgumentBlock {
  /** The type of argument component */
  type: 'claim' | 'evidence' | 'warrant' | 'counterargument' | 'rebuttal';
  /** The text content */
  text: string;
  /** Starting position in original text */
  startIndex: number;
  /** Ending position in original text */
  endIndex: number;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Complete argument pattern profile
 */
export interface ArgumentPatterns {
  claimStructure: ClaimStructure;
  evidenceIntegration: EvidenceIntegration;
  warrantConnection: WarrantConnection;
  counterargument: CounterargumentHandling;
  /** Overall confidence in analysis */
  overallConfidence: number;
  /** Number of argument blocks detected */
  argumentBlocksDetected: number;
}

// Claim markers
const CLAIM_MARKER_PATTERNS = [
  /^(i\s+argue\s+that)/i,
  /^(we\s+argue\s+that)/i,
  /^(this\s+(paper|study|research|dissertation|thesis)\s+(argues?|contends?|proposes?|demonstrates?)\s+that)/i,
  /^(my\s+(argument|thesis|contention|claim)\s+is\s+that)/i,
  /^(the\s+(central|main|key|primary)\s+(argument|thesis|claim)\s+(is\s+that|of\s+this))/i,
  /^(it\s+is\s+(argued|claimed|contended)\s+(?:here\s+)?that)/i,
  /(this\s+suggests\s+that)/i,
  /(the\s+evidence\s+(indicates?|suggests?|demonstrates?)\s+that)/i,
  /(i\s+contend\s+that)/i,
  /(it\s+can\s+be\s+(argued|claimed|concluded)\s+that)/i,
];

// Hedging patterns
const HEDGING_PATTERNS = [
  /^(it\s+(appears?|seems?)\s+that)/i,
  /^(this\s+(may|might|could)\s+(suggest|indicate|imply))/i,
  /(perhaps)/i,
  /(possibly)/i,
  /(it\s+is\s+(possible|plausible|likely)\s+that)/i,
  /(one\s+(could|might)\s+argue\s+that)/i,
  /(to\s+some\s+extent)/i,
  /(in\s+some\s+cases)/i,
  /(there\s+is\s+reason\s+to\s+believe)/i,
  /(tentatively)/i,
  /(preliminary\s+evidence\s+suggests)/i,
];

// Strength indicators
const STRENGTH_INDICATOR_PATTERNS = [
  /(clearly)/i,
  /(undoubtedly)/i,
  /(certainly)/i,
  /(obviously)/i,
  /(without\s+doubt)/i,
  /(definitively)/i,
  /(unquestionably)/i,
  /(conclusively)/i,
  /(it\s+is\s+(clear|evident|obvious)\s+that)/i,
  /(there\s+is\s+no\s+doubt\s+that)/i,
  /(the\s+evidence\s+(clearly|conclusively)\s+shows)/i,
];

// Evidence introducers
const EVIDENCE_INTRODUCER_PATTERNS = [
  /^(evidence\s+for\s+this\s+(includes?|comes?\s+from))/i,
  /^(this\s+is\s+(supported|demonstrated|shown)\s+by)/i,
  /^(support\s+for\s+this\s+(claim|argument|position)\s+(comes?\s+from|is\s+found\s+in))/i,
  /^(empirical\s+(evidence|data|findings?)\s+(suggests?|indicates?|shows?))/i,
  /^(the\s+(data|evidence|findings?|results?)\s+(show|demonstrate|indicate|reveal|suggest))/i,
  /^(research\s+(has\s+)?(shown|demonstrated|found|revealed)\s+that)/i,
  /^(studies\s+(have\s+)?(shown|demonstrated|found|indicated)\s+that)/i,
  /^(as\s+(demonstrated|shown|evidenced)\s+by)/i,
];

// Example markers
const EXAMPLE_MARKER_PATTERNS = [
  /^(for\s+(example|instance))/i,
  /^(consider\s+(the\s+)?case\s+of)/i,
  /^(a\s+(notable|clear|good|prime)\s+example\s+(is|of\s+this))/i,
  /^(to\s+illustrate)/i,
  /^(this\s+can\s+be\s+(seen|observed)\s+in)/i,
  /^(take,?\s+for\s+(example|instance))/i,
  /^(one\s+(such|clear)\s+example)/i,
  /^(specifically)/i,
  /^(in\s+particular)/i,
  /^(notably)/i,
];

// Data reference patterns
const DATA_REFERENCE_PATTERNS = [
  /(as\s+shown\s+in\s+(Figure|Table|Chart|Graph)\s+\d+)/i,
  /((Figure|Table|Chart|Graph)\s+\d+\s+(shows|demonstrates|illustrates|presents))/i,
  /(see\s+(Figure|Table|Chart|Graph)\s+\d+)/i,
  /(the\s+(data|results?|findings?)\s+in\s+(Figure|Table)\s+\d+)/i,
  /(as\s+(illustrated|depicted|presented)\s+in)/i,
  /(\(see\s+(Figure|Table|Appendix)\s+\w+\))/i,
];

// Because patterns (warrant connectors)
const BECAUSE_PATTERNS = [
  /^(because)/i,
  /^(since)/i,
  /^(given\s+that)/i,
  /^(as)/i,
  /^(due\s+to(\s+the\s+fact\s+that)?)/i,
  /^(owing\s+to)/i,
  /^(in\s+light\s+of)/i,
  /^(on\s+the\s+grounds\s+that)/i,
  /^(the\s+reason\s+(is|being)\s+that)/i,
  /^(this\s+is\s+because)/i,
];

// Therefore patterns (conclusion markers)
const THEREFORE_PATTERNS = [
  /^(therefore)/i,
  /^(thus)/i,
  /^(hence)/i,
  /^(consequently)/i,
  /^(as\s+a\s+result)/i,
  /^(it\s+follows\s+that)/i,
  /^(accordingly)/i,
  /^(for\s+this\s+reason)/i,
  /^(we\s+can\s+(conclude|infer)\s+that)/i,
  /^(this\s+(leads|points)\s+to\s+the\s+conclusion)/i,
];

// Implication markers
const IMPLICATION_MARKER_PATTERNS = [
  /^(this\s+(implies?|means?|suggests?)\s+that)/i,
  /^(the\s+implication\s+(is|of\s+this))/i,
  /^(this\s+has\s+implications\s+for)/i,
  /^(what\s+this\s+(means|suggests)\s+is)/i,
  /^(in\s+other\s+words)/i,
  /^(put\s+(simply|differently))/i,
  /^(essentially)/i,
  /^(this\s+points\s+to)/i,
];

// Objection introducers
const OBJECTION_INTRODUCER_PATTERNS = [
  /^(one\s+(might|could|may)\s+object\s+that)/i,
  /^(critics\s+(argue|claim|contend|might\s+argue)\s+that)/i,
  /^(it\s+(might|could|may)\s+be\s+(argued|objected|claimed)\s+that)/i,
  /^(some\s+(scholars?|researchers?|critics?)\s+(have\s+)?(argued|claimed|suggested)\s+that)/i,
  /^(a\s+(common|potential|possible)\s+(objection|criticism|critique)\s+is)/i,
  /^(opponents?\s+(of\s+this\s+view\s+)?(argue|claim|contend))/i,
  /^(skeptics?\s+(might|may|could)\s+(argue|point\s+out))/i,
];

// Concession patterns
const CONCESSION_PATTERNS = [
  /^(while\s+it\s+is\s+true\s+that)/i,
  /^(granted)/i,
  /^(admittedly)/i,
  /^(it\s+must\s+be\s+(acknowledged|admitted|conceded)\s+that)/i,
  /^(to\s+be\s+(sure|fair))/i,
  /^(certainly)/i,
  /^(of\s+course)/i,
  /^(although)/i,
  /^(even\s+though)/i,
  /^(despite\s+(the\s+fact\s+that|this))/i,
  /^(notwithstanding)/i,
  /^(i\s+(acknowledge|concede|admit)\s+that)/i,
];

// Refutation patterns
const REFUTATION_PATTERNS = [
  /^(however,?\s+this\s+(overlooks?|ignores?|fails?\s+to\s+consider))/i,
  /^(nevertheless)/i,
  /^(yet)/i,
  /^(but)/i,
  /^(this\s+(objection|criticism|argument)\s+(fails?|does\s+not\s+hold|is\s+flawed))/i,
  /^(this\s+(view|position|argument)\s+(is\s+)?(untenable|problematic|mistaken))/i,
  /^(upon\s+closer\s+(examination|inspection))/i,
  /^(this\s+reasoning\s+(is\s+)?flawed\s+because)/i,
  /^(in\s+response)/i,
  /^(while\s+this\s+(may\s+seem|appears?)\s+(valid|plausible),?\s+(it|this))/i,
];

/**
 * Extracts argument structure patterns from academic text
 */
export class ArgumentPatternExtractor {
  private minTextLength = 100;

  /**
   * Extract argument patterns from text
   * @param text - Academic text to analyze
   * @returns Argument patterns profile
   */
  extractFromText(text: string): ArgumentPatterns {
    if (!text || text.length < this.minTextLength) {
      return this.createEmptyPatterns();
    }

    const sentences = this.extractSentences(text);
    const paragraphs = this.extractParagraphs(text);

    const claimStructure = this.analyzeClaimStructure(sentences, text);
    const evidenceIntegration = this.analyzeEvidenceIntegration(sentences, text);
    const warrantConnection = this.analyzeWarrantConnection(sentences, text);
    const counterargument = this.analyzeCounterargument(sentences, paragraphs, text);

    const argumentBlocks = this.identifyArgumentBlocks(text);
    const overallConfidence = this.calculateOverallConfidence(
      claimStructure,
      evidenceIntegration,
      warrantConnection,
      counterargument
    );

    return {
      claimStructure,
      evidenceIntegration,
      warrantConnection,
      counterargument,
      overallConfidence,
      argumentBlocksDetected: argumentBlocks.length,
    };
  }

  /**
   * Identify distinct argument blocks in text
   * @param text - Text to analyze
   * @returns Array of argument blocks
   */
  identifyArgumentBlocks(text: string): ArgumentBlock[] {
    const blocks: ArgumentBlock[] = [];
    const sentences = this.extractSentencesWithPositions(text);

    for (const { sentence, start, end } of sentences) {
      // Check for claims
      for (const pattern of CLAIM_MARKER_PATTERNS) {
        if (pattern.test(sentence)) {
          blocks.push({
            type: 'claim',
            text: sentence,
            startIndex: start,
            endIndex: end,
            confidence: 0.7,
          });
          break;
        }
      }

      // Check for evidence
      const isEvidence =
        EVIDENCE_INTRODUCER_PATTERNS.some(p => p.test(sentence)) ||
        EXAMPLE_MARKER_PATTERNS.some(p => p.test(sentence)) ||
        DATA_REFERENCE_PATTERNS.some(p => p.test(sentence));

      if (isEvidence) {
        blocks.push({
          type: 'evidence',
          text: sentence,
          startIndex: start,
          endIndex: end,
          confidence: 0.7,
        });
      }

      // Check for warrants
      const isWarrant =
        BECAUSE_PATTERNS.some(p => p.test(sentence)) ||
        THEREFORE_PATTERNS.some(p => p.test(sentence)) ||
        IMPLICATION_MARKER_PATTERNS.some(p => p.test(sentence));

      if (isWarrant && !isEvidence) {
        blocks.push({
          type: 'warrant',
          text: sentence,
          startIndex: start,
          endIndex: end,
          confidence: 0.6,
        });
      }

      // Check for counterarguments
      const isCounterargument =
        OBJECTION_INTRODUCER_PATTERNS.some(p => p.test(sentence)) ||
        CONCESSION_PATTERNS.some(p => p.test(sentence));

      if (isCounterargument) {
        blocks.push({
          type: 'counterargument',
          text: sentence,
          startIndex: start,
          endIndex: end,
          confidence: 0.7,
        });
      }

      // Check for rebuttals
      if (REFUTATION_PATTERNS.some(p => p.test(sentence))) {
        blocks.push({
          type: 'rebuttal',
          text: sentence,
          startIndex: start,
          endIndex: end,
          confidence: 0.7,
        });
      }
    }

    return blocks;
  }

  /**
   * Merge multiple argument pattern analyses
   * @param patterns - Array of patterns to merge
   * @returns Merged patterns
   */
  mergePatterns(patterns: ArgumentPatterns[]): ArgumentPatterns {
    if (patterns.length === 0) {
      return this.createEmptyPatterns();
    }

    if (patterns.length === 1) {
      return patterns[0];
    }

    return {
      claimStructure: this.mergeClaimStructures(patterns.map(p => p.claimStructure)),
      evidenceIntegration: this.mergeEvidenceIntegration(patterns.map(p => p.evidenceIntegration)),
      warrantConnection: this.mergeWarrantConnection(patterns.map(p => p.warrantConnection)),
      counterargument: this.mergeCounterargument(patterns.map(p => p.counterargument)),
      overallConfidence: this.average(patterns.map(p => p.overallConfidence)),
      argumentBlocksDetected: patterns.reduce((sum, p) => sum + p.argumentBlocksDetected, 0),
    };
  }

  /**
   * Generate a prompt section for argument patterns
   * @param patterns - Argument patterns
   * @returns Formatted prompt string
   */
  generatePromptSection(patterns: ArgumentPatterns): string {
    const parts: string[] = [];

    parts.push('Argument Structure Patterns:');

    // Claim structure
    if (patterns.claimStructure.confidence > 0.3) {
      parts.push('\n  Claim Construction:');
      parts.push(`    - Claim strength: ${patterns.claimStructure.claimStrength}`);
      if (patterns.claimStructure.claimMarkers.length > 0) {
        parts.push(`    - Claim introducers: ${patterns.claimStructure.claimMarkers.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.claimStructure.hedgingPatterns.length > 0 && patterns.claimStructure.claimStrength !== 'strong') {
        parts.push(`    - Hedging: ${patterns.claimStructure.hedgingPatterns.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.claimStructure.strengthIndicators.length > 0 && patterns.claimStructure.claimStrength !== 'cautious') {
        parts.push(`    - Strength markers: ${patterns.claimStructure.strengthIndicators.slice(0, 3).join(', ')}`);
      }
    }

    // Evidence integration
    if (patterns.evidenceIntegration.confidence > 0.3) {
      parts.push('\n  Evidence Integration:');
      if (patterns.evidenceIntegration.evidenceIntroducers.length > 0) {
        parts.push(`    - Evidence introducers: ${patterns.evidenceIntegration.evidenceIntroducers.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.evidenceIntegration.exampleMarkers.length > 0) {
        parts.push(`    - Example markers: ${patterns.evidenceIntegration.exampleMarkers.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.evidenceIntegration.dataReferences.length > 0) {
        parts.push(`    - Data references: ${patterns.evidenceIntegration.dataReferences.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    // Warrant/reasoning patterns
    if (patterns.warrantConnection.confidence > 0.3) {
      parts.push('\n  Reasoning Connections:');
      if (patterns.warrantConnection.becausePatterns.length > 0) {
        parts.push(`    - Causal connectors: ${patterns.warrantConnection.becausePatterns.slice(0, 3).join(', ')}`);
      }
      if (patterns.warrantConnection.thereforePatterns.length > 0) {
        parts.push(`    - Conclusion markers: ${patterns.warrantConnection.thereforePatterns.slice(0, 3).join(', ')}`);
      }
      if (patterns.warrantConnection.implicationMarkers.length > 0) {
        parts.push(`    - Implication phrases: ${patterns.warrantConnection.implicationMarkers.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    // Counterargument handling
    if (patterns.counterargument.confidence > 0.3) {
      parts.push('\n  Counterargument Handling:');
      parts.push(`    - Style: ${patterns.counterargument.style.replace('_', ' ')}`);
      parts.push(`    - Frequency: ${patterns.counterargument.frequency}`);
      if (patterns.counterargument.objectionIntroducers.length > 0) {
        parts.push(`    - Objection phrases: ${patterns.counterargument.objectionIntroducers.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.counterargument.concessionPatterns.length > 0) {
        parts.push(`    - Concession markers: ${patterns.counterargument.concessionPatterns.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.counterargument.refutationPatterns.length > 0) {
        parts.push(`    - Refutation patterns: ${patterns.counterargument.refutationPatterns.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  // Private analysis methods

  private analyzeClaimStructure(sentences: string[], text: string): ClaimStructure {
    const claimMarkers: string[] = [];
    const hedgingPatterns: string[] = [];
    const strengthIndicators: string[] = [];

    // Extract claim markers
    for (const sentence of sentences) {
      for (const pattern of CLAIM_MARKER_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!claimMarkers.includes(extracted)) {
            claimMarkers.push(extracted);
          }
        }
      }
    }

    // Extract hedging patterns
    for (const pattern of HEDGING_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        const extracted = this.cleanPattern(match[0]);
        if (!hedgingPatterns.includes(extracted)) {
          hedgingPatterns.push(extracted);
        }
      }
    }

    // Extract strength indicators
    for (const pattern of STRENGTH_INDICATOR_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        const extracted = this.cleanPattern(match[0]);
        if (!strengthIndicators.includes(extracted)) {
          strengthIndicators.push(extracted);
        }
      }
    }

    // Determine claim strength
    const hedgingScore = hedgingPatterns.length;
    const strengthScore = strengthIndicators.length;

    let claimStrength: 'strong' | 'moderate' | 'cautious' = 'moderate';
    if (strengthScore > hedgingScore * 2) {
      claimStrength = 'strong';
    } else if (hedgingScore > strengthScore * 2) {
      claimStrength = 'cautious';
    }

    const totalFound = claimMarkers.length + hedgingPatterns.length + strengthIndicators.length;
    const confidence = Math.min(1, totalFound / 15);

    return {
      claimMarkers: claimMarkers.slice(0, 15),
      hedgingPatterns: hedgingPatterns.slice(0, 15),
      strengthIndicators: strengthIndicators.slice(0, 10),
      claimStrength,
      confidence,
    };
  }

  private analyzeEvidenceIntegration(sentences: string[], text: string): EvidenceIntegration {
    const evidenceIntroducers: string[] = [];
    const exampleMarkers: string[] = [];
    const dataReferences: string[] = [];
    const evidenceTypes: string[] = [];

    // Extract evidence introducers
    for (const sentence of sentences) {
      for (const pattern of EVIDENCE_INTRODUCER_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!evidenceIntroducers.includes(extracted)) {
            evidenceIntroducers.push(extracted);
          }
        }
      }
    }

    // Extract example markers
    for (const sentence of sentences) {
      for (const pattern of EXAMPLE_MARKER_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!exampleMarkers.includes(extracted)) {
            exampleMarkers.push(extracted);
          }
        }
      }
    }

    // Extract data references
    for (const pattern of DATA_REFERENCE_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        const extracted = this.cleanPattern(match[0]);
        if (!dataReferences.includes(extracted)) {
          dataReferences.push(extracted);
        }
      }
    }

    // Detect evidence types used
    if (dataReferences.length > 0) {
      if (text.match(/table\s+\d+/i)) evidenceTypes.push('tables');
      if (text.match(/figure\s+\d+/i)) evidenceTypes.push('figures');
      if (text.match(/chart|graph/i)) evidenceTypes.push('charts');
    }
    if (text.match(/interview|participant|respondent/i)) evidenceTypes.push('qualitative');
    if (text.match(/survey|questionnaire|sample\s+size|n\s*=\s*\d+/i)) evidenceTypes.push('quantitative');
    if (text.match(/case\s+study/i)) evidenceTypes.push('case studies');
    if (text.match(/archival|historical\s+record/i)) evidenceTypes.push('archival');

    const totalFound = evidenceIntroducers.length + exampleMarkers.length + dataReferences.length;
    const confidence = Math.min(1, totalFound / 10);

    return {
      evidenceIntroducers: evidenceIntroducers.slice(0, 15),
      exampleMarkers: exampleMarkers.slice(0, 10),
      dataReferences: dataReferences.slice(0, 10),
      evidenceTypes,
      confidence,
    };
  }

  private analyzeWarrantConnection(sentences: string[], text: string): WarrantConnection {
    const becausePatterns: string[] = [];
    const thereforePatterns: string[] = [];
    const implicationMarkers: string[] = [];
    const reasoningConnectors: string[] = [];

    // Extract because patterns
    for (const sentence of sentences) {
      for (const pattern of BECAUSE_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!becausePatterns.includes(extracted)) {
            becausePatterns.push(extracted);
          }
        }
      }
    }

    // Extract therefore patterns
    for (const sentence of sentences) {
      for (const pattern of THEREFORE_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!thereforePatterns.includes(extracted)) {
            thereforePatterns.push(extracted);
          }
        }
      }
    }

    // Extract implication markers
    for (const sentence of sentences) {
      for (const pattern of IMPLICATION_MARKER_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!implicationMarkers.includes(extracted)) {
            implicationMarkers.push(extracted);
          }
        }
      }
    }

    // Extract reasoning connectors from text
    const connectorWords = ['because', 'since', 'therefore', 'thus', 'hence', 'consequently', 'accordingly', 'as a result'];
    for (const connector of connectorWords) {
      const pattern = new RegExp(`\\b${connector}\\b`, 'gi');
      if (pattern.test(text)) {
        reasoningConnectors.push(connector);
      }
    }

    const totalFound = becausePatterns.length + thereforePatterns.length + implicationMarkers.length;
    const confidence = Math.min(1, totalFound / 10);

    return {
      becausePatterns: becausePatterns.slice(0, 10),
      thereforePatterns: thereforePatterns.slice(0, 10),
      implicationMarkers: implicationMarkers.slice(0, 10),
      reasoningConnectors: reasoningConnectors.slice(0, 10),
      confidence,
    };
  }

  private analyzeCounterargument(sentences: string[], paragraphs: string[], text: string): CounterargumentHandling {
    const objectionIntroducers: string[] = [];
    const concessionPatterns: string[] = [];
    const refutationPatterns: string[] = [];

    // Track positions for style detection
    let objectionPositions: number[] = [];
    let claimPositions: number[] = [];

    // Extract objection introducers
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      for (const pattern of OBJECTION_INTRODUCER_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!objectionIntroducers.includes(extracted)) {
            objectionIntroducers.push(extracted);
            objectionPositions.push(i);
          }
        }
      }
    }

    // Extract concession patterns
    for (const sentence of sentences) {
      for (const pattern of CONCESSION_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!concessionPatterns.includes(extracted)) {
            concessionPatterns.push(extracted);
          }
        }
      }
    }

    // Extract refutation patterns
    for (const sentence of sentences) {
      for (const pattern of REFUTATION_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!refutationPatterns.includes(extracted)) {
            refutationPatterns.push(extracted);
          }
        }
      }
    }

    // Find claim positions
    for (let i = 0; i < sentences.length; i++) {
      if (CLAIM_MARKER_PATTERNS.some(p => p.test(sentences[i]))) {
        claimPositions.push(i);
      }
    }

    // Determine counterargument style
    let style: 'before_claim' | 'after_claim' | 'integrated' = 'integrated';
    if (objectionPositions.length > 0 && claimPositions.length > 0) {
      const avgObjPos = objectionPositions.reduce((a, b) => a + b, 0) / objectionPositions.length;
      const avgClaimPos = claimPositions.reduce((a, b) => a + b, 0) / claimPositions.length;

      if (avgObjPos < avgClaimPos * 0.8) {
        style = 'before_claim';
      } else if (avgObjPos > avgClaimPos * 1.2) {
        style = 'after_claim';
      }
    }

    // Determine frequency
    const totalCounterarg = objectionIntroducers.length + concessionPatterns.length;
    let frequency: 'frequent' | 'occasional' | 'rare' = 'rare';
    const sentenceRatio = totalCounterarg / sentences.length;
    if (sentenceRatio > 0.05) {
      frequency = 'frequent';
    } else if (sentenceRatio > 0.02) {
      frequency = 'occasional';
    }

    const confidence = Math.min(1, totalCounterarg / 8);

    return {
      objectionIntroducers: objectionIntroducers.slice(0, 10),
      concessionPatterns: concessionPatterns.slice(0, 10),
      refutationPatterns: refutationPatterns.slice(0, 10),
      style,
      frequency,
      confidence,
    };
  }

  // Helper methods

  private extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  private extractSentencesWithPositions(text: string): Array<{ sentence: string; start: number; end: number }> {
    const results: Array<{ sentence: string; start: number; end: number }> = [];
    const sentences = text.split(/([.!?])\s+/);
    let position = 0;

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '');
      if (sentence.trim().length > 10) {
        results.push({
          sentence: sentence.trim(),
          start: position,
          end: position + sentence.length,
        });
      }
      position += sentence.length + 1;
    }

    return results;
  }

  private extractParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
  }

  private cleanPattern(pattern: string): string {
    return pattern
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private calculateOverallConfidence(
    claim: ClaimStructure,
    evidence: EvidenceIntegration,
    warrant: WarrantConnection,
    counter: CounterargumentHandling
  ): number {
    return (claim.confidence + evidence.confidence + warrant.confidence + counter.confidence) / 4;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private mergeClaimStructures(structures: ClaimStructure[]): ClaimStructure {
    // Count claim strengths
    const strengthCounts = { strong: 0, moderate: 0, cautious: 0 };
    for (const s of structures) {
      strengthCounts[s.claimStrength]++;
    }

    let claimStrength: 'strong' | 'moderate' | 'cautious' = 'moderate';
    if (strengthCounts.strong > strengthCounts.moderate && strengthCounts.strong > strengthCounts.cautious) {
      claimStrength = 'strong';
    } else if (strengthCounts.cautious > strengthCounts.moderate && strengthCounts.cautious > strengthCounts.strong) {
      claimStrength = 'cautious';
    }

    return {
      claimMarkers: this.mergeArrays(structures.map(s => s.claimMarkers), 20),
      hedgingPatterns: this.mergeArrays(structures.map(s => s.hedgingPatterns), 20),
      strengthIndicators: this.mergeArrays(structures.map(s => s.strengthIndicators), 15),
      claimStrength,
      confidence: this.average(structures.map(s => s.confidence)),
    };
  }

  private mergeEvidenceIntegration(integrations: EvidenceIntegration[]): EvidenceIntegration {
    return {
      evidenceIntroducers: this.mergeArrays(integrations.map(i => i.evidenceIntroducers), 20),
      exampleMarkers: this.mergeArrays(integrations.map(i => i.exampleMarkers), 15),
      dataReferences: this.mergeArrays(integrations.map(i => i.dataReferences), 15),
      evidenceTypes: this.mergeArrays(integrations.map(i => i.evidenceTypes), 10),
      confidence: this.average(integrations.map(i => i.confidence)),
    };
  }

  private mergeWarrantConnection(connections: WarrantConnection[]): WarrantConnection {
    return {
      becausePatterns: this.mergeArrays(connections.map(c => c.becausePatterns), 15),
      thereforePatterns: this.mergeArrays(connections.map(c => c.thereforePatterns), 15),
      implicationMarkers: this.mergeArrays(connections.map(c => c.implicationMarkers), 15),
      reasoningConnectors: this.mergeArrays(connections.map(c => c.reasoningConnectors), 15),
      confidence: this.average(connections.map(c => c.confidence)),
    };
  }

  private mergeCounterargument(handlers: CounterargumentHandling[]): CounterargumentHandling {
    // Most common style
    const styleCounts = { before_claim: 0, after_claim: 0, integrated: 0 };
    for (const h of handlers) {
      styleCounts[h.style]++;
    }

    let style: 'before_claim' | 'after_claim' | 'integrated' = 'integrated';
    if (styleCounts.before_claim > styleCounts.after_claim && styleCounts.before_claim > styleCounts.integrated) {
      style = 'before_claim';
    } else if (styleCounts.after_claim > styleCounts.before_claim && styleCounts.after_claim > styleCounts.integrated) {
      style = 'after_claim';
    }

    // Most common frequency
    const freqCounts = { frequent: 0, occasional: 0, rare: 0 };
    for (const h of handlers) {
      freqCounts[h.frequency]++;
    }

    let frequency: 'frequent' | 'occasional' | 'rare' = 'rare';
    if (freqCounts.frequent > freqCounts.occasional && freqCounts.frequent > freqCounts.rare) {
      frequency = 'frequent';
    } else if (freqCounts.occasional > freqCounts.rare) {
      frequency = 'occasional';
    }

    return {
      objectionIntroducers: this.mergeArrays(handlers.map(h => h.objectionIntroducers), 15),
      concessionPatterns: this.mergeArrays(handlers.map(h => h.concessionPatterns), 15),
      refutationPatterns: this.mergeArrays(handlers.map(h => h.refutationPatterns), 15),
      style,
      frequency,
      confidence: this.average(handlers.map(h => h.confidence)),
    };
  }

  private mergeArrays(arrays: string[][], limit: number): string[] {
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

  private createEmptyPatterns(): ArgumentPatterns {
    return {
      claimStructure: {
        claimMarkers: [],
        hedgingPatterns: [],
        strengthIndicators: [],
        claimStrength: 'moderate',
        confidence: 0,
      },
      evidenceIntegration: {
        evidenceIntroducers: [],
        exampleMarkers: [],
        dataReferences: [],
        evidenceTypes: [],
        confidence: 0,
      },
      warrantConnection: {
        becausePatterns: [],
        thereforePatterns: [],
        implicationMarkers: [],
        reasoningConnectors: [],
        confidence: 0,
      },
      counterargument: {
        objectionIntroducers: [],
        concessionPatterns: [],
        refutationPatterns: [],
        style: 'integrated',
        frequency: 'rare',
        confidence: 0,
      },
      overallConfidence: 0,
      argumentBlocksDetected: 0,
    };
  }
}
