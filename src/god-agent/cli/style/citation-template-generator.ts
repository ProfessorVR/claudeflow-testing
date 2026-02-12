/**
 * CitationTemplateGenerator - Generates author-prominent and info-prominent citation templates
 *
 * Part of MEDIUM-IMPACT #3 from phd-pipeline-improvement-proposal.md:
 * - Create citation integration templates based on detected style
 * - Support author-prominent patterns: "Smith (2020) argues..."
 * - Support info-prominent patterns: "Studies show... (Smith, 2020)"
 * - Generate context-aware templates for different academic registers
 */

import type { CitationIntegrationStyle, CitationIntroductionPatterns } from './citation-integration-analyzer.js';

// ============================================================================
// Types
// ============================================================================

export interface CitationTemplate {
  /** Template type */
  type: 'author-prominent' | 'info-prominent' | 'synthesis' | 'quotation';
  /** Template pattern with placeholders */
  pattern: string;
  /** Description of when to use this template */
  usage: string;
  /** Example instantiation */
  example: string;
  /** Academic register: formal, standard, accessible */
  register: 'formal' | 'standard' | 'accessible';
  /** Rhetorical function */
  rhetoricalFunction: string;
}

export interface CitationTemplateSet {
  /** Author-prominent templates */
  authorProminent: CitationTemplate[];
  /** Information-prominent templates */
  informationProminent: CitationTemplate[];
  /** Synthesis templates (combining multiple sources) */
  synthesis: CitationTemplate[];
  /** Quotation templates (introducing quotes) */
  quotation: CitationTemplate[];
  /** Recommended ratio of author-prominent to info-prominent */
  recommendedRatio: number;
  /** Style-specific notes */
  styleNotes: string[];
}

// ============================================================================
// Template Definitions
// ============================================================================

const AUTHOR_PROMINENT_TEMPLATES: CitationTemplate[] = [
  // Assertive verbs
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) argues that {claim}.',
    usage: 'Strong author assertion, positions author as making a direct claim',
    example: 'Aristotle (350 BCE) argues that phantasia serves as a mediating faculty between perception and thought.',
    register: 'standard',
    rhetoricalFunction: 'assertion',
  },
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) contends that {claim}.',
    usage: 'Author taking a position, often in debate or contrast',
    example: 'Schofield (1978) contends that phantasia cannot be reduced to mere imagination.',
    register: 'formal',
    rhetoricalFunction: 'argumentation',
  },
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) maintains that {claim}.',
    usage: 'Author holding a consistent position over time',
    example: 'Nussbaum (1978) maintains that the emotions involve cognitive appraisals.',
    register: 'formal',
    rhetoricalFunction: 'position-holding',
  },

  // Observational verbs
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) observes that {observation}.',
    usage: 'Author making a descriptive observation',
    example: 'Wedin (1988) observes that Aristotle uses phantasia in multiple senses.',
    register: 'standard',
    rhetoricalFunction: 'observation',
  },
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) notes that {point}.',
    usage: 'Drawing attention to a specific point',
    example: 'Caston (1996) notes that phantasia involves a distinctive kind of awareness.',
    register: 'standard',
    rhetoricalFunction: 'emphasis',
  },

  // Analytical verbs
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) demonstrates that {finding}.',
    usage: 'Author providing evidence or proof',
    example: 'Modrak (1987) demonstrates that phantasia involves propositional content.',
    register: 'formal',
    rhetoricalFunction: 'evidence',
  },
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) shows that {result}.',
    usage: 'Author presenting results or outcomes',
    example: 'Frede (1992) shows that phantasia plays a role in practical reasoning.',
    register: 'standard',
    rhetoricalFunction: 'demonstration',
  },

  // Interpretive verbs
  {
    type: 'author-prominent',
    pattern: '{Author} ({Year}) interprets {text} as {interpretation}.',
    usage: 'Author offering an interpretation of a text or phenomenon',
    example: 'Nussbaum (1978) interprets De Anima III.3 as distinguishing phantasia from perception.',
    register: 'formal',
    rhetoricalFunction: 'interpretation',
  },
  {
    type: 'author-prominent',
    pattern: 'For {Author} ({Year}), {concept} represents {meaning}.',
    usage: 'Presenting an author\'s conceptual understanding',
    example: 'For Heidegger (1927), Dasein represents the being that questions its own being.',
    register: 'formal',
    rhetoricalFunction: 'conceptualization',
  },

  // According to patterns
  {
    type: 'author-prominent',
    pattern: 'According to {Author} ({Year}), {claim}.',
    usage: 'Neutral attribution, distancing writer from claim',
    example: 'According to Rorty (1992), emotions are best understood as judgments.',
    register: 'standard',
    rhetoricalFunction: 'attribution',
  },
  {
    type: 'author-prominent',
    pattern: 'As {Author} ({Year}) points out, {point}.',
    usage: 'Drawing attention to author\'s insight',
    example: 'As Watson (1988) points out, rhetoric and philosophy share common concerns.',
    register: 'standard',
    rhetoricalFunction: 'highlighting',
  },

  // View/perspective patterns
  {
    type: 'author-prominent',
    pattern: 'In {Author}\'s ({Year}) view, {view}.',
    usage: 'Presenting author\'s perspective or viewpoint',
    example: 'In Schofield\'s (1978) view, phantasia is best translated as "imagination."',
    register: 'standard',
    rhetoricalFunction: 'perspective',
  },
  {
    type: 'author-prominent',
    pattern: '{Author}\'s ({Year}) analysis reveals that {finding}.',
    usage: 'Presenting results of author\'s analysis',
    example: 'Caston\'s (1996) analysis reveals the complexity of Aristotle\'s account.',
    register: 'formal',
    rhetoricalFunction: 'analysis',
  },
];

const INFO_PROMINENT_TEMPLATES: CitationTemplate[] = [
  // Research/studies patterns
  {
    type: 'info-prominent',
    pattern: 'Research suggests that {finding} ({Author}, {Year}).',
    usage: 'General research finding, source cited parenthetically',
    example: 'Research suggests that VR can elicit genuine emotional responses (Slater, 2009).',
    register: 'standard',
    rhetoricalFunction: 'evidence-citing',
  },
  {
    type: 'info-prominent',
    pattern: 'Studies have shown that {finding} ({Author}, {Year}).',
    usage: 'Established research finding',
    example: 'Studies have shown that presence correlates with emotional engagement (Sanchez-Vives, 2005).',
    register: 'standard',
    rhetoricalFunction: 'established-finding',
  },
  {
    type: 'info-prominent',
    pattern: 'Evidence indicates that {finding} ({Author}, {Year}).',
    usage: 'Empirical evidence supporting a claim',
    example: 'Evidence indicates that embodied cognition affects emotional processing (Barsalou, 2008).',
    register: 'formal',
    rhetoricalFunction: 'empirical-support',
  },

  // Claim-first patterns
  {
    type: 'info-prominent',
    pattern: '{Claim statement} ({Author}, {Year}).',
    usage: 'Straightforward claim with citation',
    example: 'Phantasia mediates between perception and thought (Aristotle, De Anima III.3).',
    register: 'standard',
    rhetoricalFunction: 'supported-claim',
  },
  {
    type: 'info-prominent',
    pattern: 'It has been argued that {claim} ({Author}, {Year}).',
    usage: 'Distanced claim attribution',
    example: 'It has been argued that emotions are cognitive appraisals (Lazarus, 1991).',
    register: 'formal',
    rhetoricalFunction: 'distanced-attribution',
  },
  {
    type: 'info-prominent',
    pattern: 'This suggests that {implication} ({Author}, {Year}).',
    usage: 'Drawing implications from previous point',
    example: 'This suggests that virtual environments can function as rhetorical spaces (Murray, 1997).',
    register: 'standard',
    rhetoricalFunction: 'implication',
  },

  // Definition patterns
  {
    type: 'info-prominent',
    pattern: '{Term} can be defined as {definition} ({Author}, {Year}).',
    usage: 'Introducing a definition',
    example: 'Presence can be defined as "the sense of being there" (Lombard & Ditton, 1997).',
    register: 'standard',
    rhetoricalFunction: 'definition',
  },
  {
    type: 'info-prominent',
    pattern: 'The concept of {concept} refers to {meaning} ({Author}, {Year}).',
    usage: 'Explaining a conceptual term',
    example: 'The concept of phantasia refers to the capacity for mental imagery (Schofield, 1978).',
    register: 'formal',
    rhetoricalFunction: 'conceptual-explanation',
  },

  // Historical/philosophical claims
  {
    type: 'info-prominent',
    pattern: 'Traditionally, {tradition} has been understood as {understanding} ({Author}, {Year}).',
    usage: 'Presenting traditional understanding',
    example: 'Traditionally, rhetoric has been understood as the art of persuasion (Kennedy, 1991).',
    register: 'formal',
    rhetoricalFunction: 'tradition',
  },
  {
    type: 'info-prominent',
    pattern: 'The {Greek term} ({translation}) denotes {meaning} ({Author}, {Year}).',
    usage: 'Explaining Greek terminology',
    example: 'The phantasia (imagination) denotes a faculty that produces appearances (Caston, 1996).',
    register: 'formal',
    rhetoricalFunction: 'terminology',
  },
];

const SYNTHESIS_TEMPLATES: CitationTemplate[] = [
  // Agreement patterns
  {
    type: 'synthesis',
    pattern: 'Both {Author1} ({Year1}) and {Author2} ({Year2}) agree that {shared view}.',
    usage: 'Two authors sharing a view',
    example: 'Both Nussbaum (1978) and Modrak (1987) agree that phantasia involves propositional content.',
    register: 'standard',
    rhetoricalFunction: 'consensus',
  },
  {
    type: 'synthesis',
    pattern: 'Several scholars ({Author1}, {Year1}; {Author2}, {Year2}) have argued that {shared claim}.',
    usage: 'Multiple sources supporting a position',
    example: 'Several scholars (Schofield, 1978; Wedin, 1988) have argued that phantasia is complex.',
    register: 'formal',
    rhetoricalFunction: 'scholarly-consensus',
  },

  // Contrast patterns
  {
    type: 'synthesis',
    pattern: 'While {Author1} ({Year1}) argues that {view1}, {Author2} ({Year2}) contends that {view2}.',
    usage: 'Contrasting two positions',
    example: 'While Schofield (1978) argues for a narrow reading, Nussbaum (1978) contends for a broader interpretation.',
    register: 'standard',
    rhetoricalFunction: 'contrast',
  },
  {
    type: 'synthesis',
    pattern: 'Unlike {Author1} ({Year1}), who {position1}, {Author2} ({Year2}) {position2}.',
    usage: 'Explicit disagreement between authors',
    example: 'Unlike Caston (1996), who emphasizes intentionality, Modrak (1987) focuses on propositional content.',
    register: 'formal',
    rhetoricalFunction: 'disagreement',
  },
  {
    type: 'synthesis',
    pattern: 'In contrast to {Author1}\'s ({Year1}) view that {view1}, {Author2} ({Year2}) suggests that {view2}.',
    usage: 'Positioning contrasting interpretations',
    example: 'In contrast to Wedin\'s (1988) view that phantasia is unified, Caston (1996) suggests multiple senses.',
    register: 'formal',
    rhetoricalFunction: 'contrasting-positions',
  },

  // Building patterns
  {
    type: 'synthesis',
    pattern: 'Building on {Author1}\'s ({Year1}) work, {Author2} ({Year2}) extends this to {extension}.',
    usage: 'Showing intellectual development',
    example: 'Building on Nussbaum\'s (1978) work, Frede (1992) extends this to practical reasoning.',
    register: 'formal',
    rhetoricalFunction: 'intellectual-development',
  },
  {
    type: 'synthesis',
    pattern: '{Author2} ({Year2}) draws on {Author1}\'s ({Year1}) insight that {insight} to argue that {conclusion}.',
    usage: 'One author using another\'s work',
    example: 'Caston (1996) draws on Frede\'s (1992) insight that phantasia is intentional to argue for a robust account.',
    register: 'formal',
    rhetoricalFunction: 'building-on',
  },

  // Collective patterns
  {
    type: 'synthesis',
    pattern: 'Taken together, these accounts ({Author1}, {Year1}; {Author2}, {Year2}; {Author3}, {Year3}) suggest that {synthesis}.',
    usage: 'Synthesizing multiple sources into unified insight',
    example: 'Taken together, these accounts (Schofield, 1978; Nussbaum, 1978; Wedin, 1988) suggest that phantasia is multifaceted.',
    register: 'formal',
    rhetoricalFunction: 'synthesis',
  },
];

const QUOTATION_TEMPLATES: CitationTemplate[] = [
  // Quote sandwich patterns
  {
    type: 'quotation',
    pattern: '{Author} ({Year}) {verb} that "{quote}" (p. {page}). {Analysis}.',
    usage: 'Full quote sandwich: introduction, quote, analysis',
    example: 'Aristotle (De Anima III.3) argues that "phantasia is different from both perception and thought" (428a1). This distinction establishes phantasia as a unique faculty.',
    register: 'formal',
    rhetoricalFunction: 'full-integration',
  },
  {
    type: 'quotation',
    pattern: 'As {Author} writes, "{quote}" ({Year}, p. {page}).',
    usage: 'Quote introduction with "as X writes"',
    example: 'As Heidegger writes, "Dasein is an entity which does not just occur among other entities" (1927, p. 32).',
    register: 'standard',
    rhetoricalFunction: 'direct-attribution',
  },
  {
    type: 'quotation',
    pattern: 'In {Author}\'s words, "{quote}" ({Year}, p. {page}).',
    usage: 'Emphasizing the author\'s exact phrasing',
    example: 'In Nussbaum\'s words, "emotions are forms of evaluative judgment" (1978, p. 92).',
    register: 'formal',
    rhetoricalFunction: 'emphasis-on-phrasing',
  },

  // Embedded quote patterns
  {
    type: 'quotation',
    pattern: '{Author} ({Year}) describes this as "{embedded quote}" (p. {page}).',
    usage: 'Embedding a shorter quote in sentence',
    example: 'Schofield (1978) describes this as "the image-making faculty" (p. 103).',
    register: 'standard',
    rhetoricalFunction: 'embedded-citation',
  },
  {
    type: 'quotation',
    pattern: 'What {Author} ({Year}) calls "{term}" refers to {explanation}.',
    usage: 'Introducing a technical term with quote',
    example: 'What Caston (1996) calls "intentional content" refers to what the phantasia represents.',
    register: 'formal',
    rhetoricalFunction: 'term-introduction',
  },

  // Block quote introduction
  {
    type: 'quotation',
    pattern: '{Author} ({Year}) provides a crucial formulation:\n\n> {blockquote}\n\n{Analysis}.',
    usage: 'Introducing a block quotation',
    example: 'Aristotle (De Anima III.3) provides a crucial formulation:\n\n> If phantasia is that in virtue of which an image occurs to us, then it is the faculty in virtue of which we judge and err.\n\nThis passage establishes the cognitive role of phantasia.',
    register: 'formal',
    rhetoricalFunction: 'extended-citation',
  },

  // Greek/translation patterns
  {
    type: 'quotation',
    pattern: 'The Greek term {Greek} ({translation}) is defined by {Author} ({Year}) as "{definition}".',
    usage: 'Introducing Greek terminology with quotation',
    example: 'The Greek term phantasia (imagination) is defined by Schofield (1978) as "the faculty of mental imagery."',
    register: 'formal',
    rhetoricalFunction: 'terminology-definition',
  },
];

// ============================================================================
// CitationTemplateGenerator Class
// ============================================================================

/**
 * Generates citation templates based on detected style patterns
 */
export class CitationTemplateGenerator {
  /**
   * Generate templates based on citation integration style
   */
  generateTemplates(style: CitationIntegrationStyle): CitationTemplateSet {
    const authorProminent = this.selectAuthorProminentTemplates(style);
    const informationProminent = this.selectInfoProminentTemplates(style);
    const synthesis = this.selectSynthesisTemplates(style);
    const quotation = this.selectQuotationTemplates(style);

    return {
      authorProminent,
      informationProminent,
      synthesis,
      quotation,
      recommendedRatio: style.introductionPatterns.authorProminentRatio,
      styleNotes: this.generateStyleNotes(style),
    };
  }

  /**
   * Generate a prompt section with citation templates for style injection
   */
  generatePromptSection(style: CitationIntegrationStyle): string {
    const templates = this.generateTemplates(style);
    const parts: string[] = [];

    parts.push('### Citation Integration Templates');
    parts.push('');

    // Ratio guidance
    const ratioPercent = Math.round(templates.recommendedRatio * 100);
    parts.push(`**Recommended balance**: ${ratioPercent}% author-prominent, ${100 - ratioPercent}% information-prominent`);
    parts.push('');

    // Author-prominent templates
    if (templates.authorProminent.length > 0) {
      parts.push('**Author-Prominent Patterns** (emphasizes the scholar):');
      for (const t of templates.authorProminent.slice(0, 4)) {
        parts.push(`- ${t.pattern}`);
        parts.push(`  *Use for*: ${t.usage}`);
      }
      parts.push('');
    }

    // Info-prominent templates
    if (templates.informationProminent.length > 0) {
      parts.push('**Information-Prominent Patterns** (emphasizes the finding):');
      for (const t of templates.informationProminent.slice(0, 4)) {
        parts.push(`- ${t.pattern}`);
        parts.push(`  *Use for*: ${t.usage}`);
      }
      parts.push('');
    }

    // Synthesis templates
    if (templates.synthesis.length > 0) {
      parts.push('**Multi-Source Synthesis Patterns**:');
      for (const t of templates.synthesis.slice(0, 3)) {
        parts.push(`- ${t.pattern}`);
      }
      parts.push('');
    }

    // Quotation templates
    if (templates.quotation.length > 0) {
      parts.push('**Quotation Integration Patterns**:');
      for (const t of templates.quotation.slice(0, 3)) {
        parts.push(`- ${t.pattern}`);
      }
      parts.push('');
    }

    // Style notes
    if (templates.styleNotes.length > 0) {
      parts.push('**Style Notes**:');
      for (const note of templates.styleNotes) {
        parts.push(`- ${note}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): CitationTemplateSet {
    return {
      authorProminent: AUTHOR_PROMINENT_TEMPLATES,
      informationProminent: INFO_PROMINENT_TEMPLATES,
      synthesis: SYNTHESIS_TEMPLATES,
      quotation: QUOTATION_TEMPLATES,
      recommendedRatio: 0.5,
      styleNotes: [],
    };
  }

  /**
   * Get templates for a specific register
   */
  getTemplatesByRegister(register: 'formal' | 'standard' | 'accessible'): CitationTemplateSet {
    return {
      authorProminent: AUTHOR_PROMINENT_TEMPLATES.filter(t => t.register === register),
      informationProminent: INFO_PROMINENT_TEMPLATES.filter(t => t.register === register),
      synthesis: SYNTHESIS_TEMPLATES.filter(t => t.register === register),
      quotation: QUOTATION_TEMPLATES.filter(t => t.register === register),
      recommendedRatio: 0.5,
      styleNotes: [`Templates selected for ${register} register`],
    };
  }

  /**
   * Select author-prominent templates based on style
   */
  private selectAuthorProminentTemplates(style: CitationIntegrationStyle): CitationTemplate[] {
    const detected = style.introductionPatterns.authorProminent;
    const selected: CitationTemplate[] = [];

    // Match detected patterns to templates
    for (const pattern of detected) {
      const lower = pattern.toLowerCase();

      // Find templates that match detected verbs
      if (lower.includes('argues') || lower.includes('contends')) {
        selected.push(...AUTHOR_PROMINENT_TEMPLATES.filter(t =>
          t.pattern.includes('argues') || t.pattern.includes('contends')
        ));
      }
      if (lower.includes('notes') || lower.includes('observes')) {
        selected.push(...AUTHOR_PROMINENT_TEMPLATES.filter(t =>
          t.pattern.includes('notes') || t.pattern.includes('observes')
        ));
      }
      if (lower.includes('according to')) {
        selected.push(...AUTHOR_PROMINENT_TEMPLATES.filter(t =>
          t.pattern.includes('According to')
        ));
      }
    }

    // If no matches, return default selection based on register
    if (selected.length === 0) {
      return AUTHOR_PROMINENT_TEMPLATES.filter(t => t.register === 'standard').slice(0, 5);
    }

    // Deduplicate
    const unique = Array.from(new Map(selected.map(t => [t.pattern, t])).values());
    return unique.slice(0, 6);
  }

  /**
   * Select info-prominent templates based on style
   */
  private selectInfoProminentTemplates(style: CitationIntegrationStyle): CitationTemplate[] {
    const detected = style.introductionPatterns.informationProminent;
    const selected: CitationTemplate[] = [];

    for (const pattern of detected) {
      const lower = pattern.toLowerCase();

      if (lower.includes('research') || lower.includes('studies')) {
        selected.push(...INFO_PROMINENT_TEMPLATES.filter(t =>
          t.pattern.includes('Research') || t.pattern.includes('Studies')
        ));
      }
      if (lower.includes('evidence')) {
        selected.push(...INFO_PROMINENT_TEMPLATES.filter(t =>
          t.pattern.includes('Evidence')
        ));
      }
    }

    if (selected.length === 0) {
      return INFO_PROMINENT_TEMPLATES.filter(t => t.register === 'standard').slice(0, 5);
    }

    const unique = Array.from(new Map(selected.map(t => [t.pattern, t])).values());
    return unique.slice(0, 6);
  }

  /**
   * Select synthesis templates based on style
   */
  private selectSynthesisTemplates(style: CitationIntegrationStyle): CitationTemplate[] {
    const ratio = style.synthesisPatterns.synthesisRatio;

    // If high synthesis ratio, include more contrastive patterns
    if (ratio > 0.3) {
      return SYNTHESIS_TEMPLATES.filter(t =>
        t.rhetoricalFunction === 'contrast' ||
        t.rhetoricalFunction === 'disagreement' ||
        t.rhetoricalFunction === 'synthesis'
      );
    }

    // Default selection
    return SYNTHESIS_TEMPLATES.filter(t => t.register === 'standard');
  }

  /**
   * Select quotation templates based on style
   */
  private selectQuotationTemplates(style: CitationIntegrationStyle): CitationTemplate[] {
    const { quotationStyle } = style;

    // If quote sandwich usage detected
    if (quotationStyle.quoteSandwichUsage) {
      return QUOTATION_TEMPLATES.filter(t =>
        t.rhetoricalFunction === 'full-integration' ||
        t.rhetoricalFunction === 'extended-citation'
      );
    }

    // If embedded quotes preferred
    if (quotationStyle.embeddedVsBlock === 'embedded') {
      return QUOTATION_TEMPLATES.filter(t =>
        t.rhetoricalFunction === 'embedded-citation' ||
        t.rhetoricalFunction === 'term-introduction'
      );
    }

    // Default selection
    return QUOTATION_TEMPLATES.filter(t => t.register === 'standard');
  }

  /**
   * Generate style-specific notes
   */
  private generateStyleNotes(style: CitationIntegrationStyle): string[] {
    const notes: string[] = [];
    const ratio = style.introductionPatterns.authorProminentRatio;

    if (ratio > 0.7) {
      notes.push('Strong preference for author-prominent citations - emphasize scholar names');
    } else if (ratio < 0.3) {
      notes.push('Strong preference for information-prominent citations - emphasize findings');
    } else {
      notes.push('Balanced citation style - vary between author-prominent and info-prominent');
    }

    if (style.quotationStyle.quoteSandwichUsage) {
      notes.push('Use quote sandwich pattern: introduce quote, present quote, analyze quote');
    }

    if (style.quotationStyle.embeddedVsBlock === 'embedded') {
      notes.push('Prefer embedded (inline) quotations over block quotes');
    } else if (style.quotationStyle.embeddedVsBlock === 'block') {
      notes.push('Use block quotations for extended passages (40+ words)');
    }

    if (style.synthesisPatterns.synthesisRatio > 0.3) {
      notes.push('Actively synthesize multiple sources rather than citing serially');
    }

    if (style.detectedFormat !== 'unknown') {
      notes.push(`Use ${style.detectedFormat.toUpperCase()} citation format consistently`);
    }

    return notes;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get default citation templates for philosophical writing
 */
export function getPhilosophicalTemplates(): CitationTemplateSet {
  return {
    authorProminent: AUTHOR_PROMINENT_TEMPLATES.filter(t =>
      ['assertion', 'interpretation', 'perspective', 'analysis'].includes(t.rhetoricalFunction)
    ),
    informationProminent: INFO_PROMINENT_TEMPLATES.filter(t =>
      ['terminology', 'definition', 'conceptual-explanation'].includes(t.rhetoricalFunction)
    ),
    synthesis: SYNTHESIS_TEMPLATES.filter(t =>
      ['contrast', 'disagreement', 'intellectual-development'].includes(t.rhetoricalFunction)
    ),
    quotation: QUOTATION_TEMPLATES.filter(t =>
      ['full-integration', 'terminology-definition', 'emphasis-on-phrasing'].includes(t.rhetoricalFunction)
    ),
    recommendedRatio: 0.6, // Slightly author-prominent for philosophy
    styleNotes: [
      'Philosophical writing typically emphasizes author positions',
      'Use author-prominent for interpretive claims',
      'Use info-prominent for established definitions',
      'Include Greek/Latin terms with parenthetical translation',
    ],
  };
}

/**
 * Get default citation templates for empirical writing
 */
export function getEmpiricalTemplates(): CitationTemplateSet {
  return {
    authorProminent: AUTHOR_PROMINENT_TEMPLATES.filter(t =>
      ['evidence', 'demonstration', 'observation'].includes(t.rhetoricalFunction)
    ),
    informationProminent: INFO_PROMINENT_TEMPLATES.filter(t =>
      ['evidence-citing', 'established-finding', 'empirical-support'].includes(t.rhetoricalFunction)
    ),
    synthesis: SYNTHESIS_TEMPLATES.filter(t =>
      ['consensus', 'scholarly-consensus'].includes(t.rhetoricalFunction)
    ),
    quotation: QUOTATION_TEMPLATES.filter(t =>
      ['embedded-citation', 'term-introduction'].includes(t.rhetoricalFunction)
    ),
    recommendedRatio: 0.3, // More info-prominent for empirical
    styleNotes: [
      'Empirical writing emphasizes findings over authors',
      'Use info-prominent for research findings',
      'Use author-prominent when methodology matters',
      'Keep quotations brief; paraphrase when possible',
    ],
  };
}
