/**
 * Defense Preparation Generator
 *
 * Generates comprehensive defense preparation materials including:
 * - Anticipated questions with response strategies
 * - Summary slide decks with speaker notes
 * - Opening and closing statements
 * - Key points cheat sheets
 * - Timing guides
 *
 * All operations work offline without external API calls.
 */

import { CommitteeSimulator, CommitteeQuestion, CommitteeRole } from './committee-simulator.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Response strategy types
 */
export type ResponseStrategy =
  | 'direct_answer'       // Answer the question directly
  | 'acknowledge_limitation' // Acknowledge a limitation then respond
  | 'future_research'     // Frame as future research direction
  | 'reframe';            // Reframe the question constructively

/**
 * A slide in the defense presentation
 */
export interface Slide {
  /** Slide number (1-indexed) */
  number: number;
  /** Slide title */
  title: string;
  /** Main bullet points */
  bulletPoints: string[];
  /** Speaker notes for the presenter */
  speakerNotes: string;
  /** Suggested duration in minutes */
  duration: number;
  /** Section this slide belongs to */
  section?: string;
}

/**
 * Complete slide deck
 */
export interface SlideDeck {
  /** Presentation title */
  title: string;
  /** All slides */
  slides: Slide[];
  /** Total duration in minutes */
  totalDuration: number;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Question response strategy
 */
export interface QuestionResponseStrategy {
  /** The original question */
  question: CommitteeQuestion;
  /** Recommended response strategy */
  strategy: ResponseStrategy;
  /** Key points to include in response */
  keyPoints: string[];
  /** Supporting evidence/citations to reference */
  supportingEvidence: string[];
  /** Things to avoid in the response */
  thingsToAvoid?: string[];
}

/**
 * Complete defense preparation package
 */
export interface DefensePreparation {
  /** All anticipated questions */
  anticipatedQuestions: CommitteeQuestion[];
  /** Summary slides */
  summarySlides: SlideDeck;
  /** Opening statement */
  openingStatement: string;
  /** Closing statement */
  closingStatement: string;
  /** Timeline/pacing notes */
  timelineNotes: string;
  /** Quick reference cheat sheet */
  keyPointsCheatSheet: string;
  /** Response strategies for key questions */
  responseStrategies: QuestionResponseStrategy[];
  /** Generation timestamp */
  generatedAt: Date;
}

/**
 * Defense preparation configuration
 */
export interface DefenseConfig {
  /** Defense date (optional) */
  defenseDate?: Date;
  /** Total presentation time in minutes */
  totalTime: number;
  /** Time allocated for Q&A in minutes */
  questionTime: number;
  /** Include challenging questions */
  includeChallenging?: boolean;
}

// ============================================================================
// Slide Templates
// ============================================================================

/**
 * Standard slide structure for dissertation defense
 */
const SLIDE_TEMPLATES: Array<{ title: string; section: string; contentGuide: string[] }> = [
  {
    title: 'Title Slide',
    section: 'intro',
    contentGuide: ['Dissertation title', 'Your name', 'Date', 'Committee members']
  },
  {
    title: 'Overview / Agenda',
    section: 'intro',
    contentGuide: ['Presentation structure', 'Time allocation', 'Key sections']
  },
  {
    title: 'Problem Statement',
    section: 'introduction',
    contentGuide: ['The problem addressed', 'Why it matters', 'Scope']
  },
  {
    title: 'Research Questions',
    section: 'introduction',
    contentGuide: ['Primary research question', 'Sub-questions', 'Hypotheses (if applicable)']
  },
  {
    title: 'Literature Review Highlights',
    section: 'background',
    contentGuide: ['Key theories', 'Major studies', 'Identified gap']
  },
  {
    title: 'Theoretical Framework',
    section: 'background',
    contentGuide: ['Framework overview', 'Key constructs', 'How it guides the study']
  },
  {
    title: 'Research Design',
    section: 'methodology',
    contentGuide: ['Methodology type', 'Design rationale', 'Overview of approach']
  },
  {
    title: 'Data Collection',
    section: 'methodology',
    contentGuide: ['Data sources', 'Sampling strategy', 'Collection procedures']
  },
  {
    title: 'Data Analysis',
    section: 'methodology',
    contentGuide: ['Analysis methods', 'Tools used', 'Validity measures']
  },
  {
    title: 'Key Finding 1',
    section: 'findings',
    contentGuide: ['Major finding', 'Supporting data', 'Significance']
  },
  {
    title: 'Key Finding 2',
    section: 'findings',
    contentGuide: ['Major finding', 'Supporting data', 'Significance']
  },
  {
    title: 'Key Finding 3',
    section: 'findings',
    contentGuide: ['Major finding', 'Supporting data', 'Significance']
  },
  {
    title: 'Discussion',
    section: 'discussion',
    contentGuide: ['Interpretation', 'Connection to literature', 'Theoretical implications']
  },
  {
    title: 'Limitations',
    section: 'discussion',
    contentGuide: ['Key limitations', 'How addressed', 'Impact on conclusions']
  },
  {
    title: 'Implications',
    section: 'conclusion',
    contentGuide: ['Practical implications', 'Theoretical contributions', 'Policy recommendations']
  },
  {
    title: 'Future Research',
    section: 'conclusion',
    contentGuide: ['Immediate next steps', 'Longer-term directions', 'Open questions']
  },
  {
    title: 'Conclusion',
    section: 'conclusion',
    contentGuide: ['Summary of contribution', 'Key takeaways', 'Final thoughts']
  },
  {
    title: 'Questions',
    section: 'closing',
    contentGuide: ['Thank committee', 'Invite questions']
  }
];

// ============================================================================
// Response Strategy Patterns
// ============================================================================

/**
 * Patterns for determining response strategy based on question characteristics
 */
interface StrategyPattern {
  indicators: RegExp[];
  strategy: ResponseStrategy;
  genericKeyPoints: string[];
}

const STRATEGY_PATTERNS: StrategyPattern[] = [
  {
    indicators: [/limitation/i, /weakness/i, /could not/i, /did not/i],
    strategy: 'acknowledge_limitation',
    genericKeyPoints: [
      'Acknowledge the limitation directly',
      'Explain why this decision was made',
      'Describe how you mitigated the impact',
      'Note how this limitation affects interpretation'
    ]
  },
  {
    indicators: [/future/i, /next step/i, /what.*would/i, /if you could/i],
    strategy: 'future_research',
    genericKeyPoints: [
      'Connect to your research agenda',
      'Identify specific directions',
      'Explain why these directions are promising',
      'Show awareness of resource requirements'
    ]
  },
  {
    indicators: [/why not/i, /alternative/i, /different/i, /instead/i],
    strategy: 'reframe',
    genericKeyPoints: [
      'Acknowledge the alternative approach',
      'Explain your rationale',
      'Show you considered alternatives systematically',
      'Connect your choice to research questions'
    ]
  },
  {
    indicators: [/what is/i, /how do/i, /describe/i, /explain/i, /tell us/i],
    strategy: 'direct_answer',
    genericKeyPoints: [
      'Answer the question directly first',
      'Provide supporting evidence',
      'Connect to your findings',
      'Be concise but thorough'
    ]
  }
];

// ============================================================================
// Defense Preparation Generator Class
// ============================================================================

/**
 * Generates comprehensive defense preparation materials
 */
export class DefensePreparationGenerator {
  private committeeSimulator: CommitteeSimulator;

  /**
   * Create a new defense preparation generator
   * @param simulator - Committee simulator instance (or creates a new one)
   */
  constructor(simulator?: CommitteeSimulator) {
    this.committeeSimulator = simulator || new CommitteeSimulator();
  }

  /**
   * Generate a complete defense preparation package
   * @param dissertationChapters - Map of chapter numbers to text content
   * @param config - Defense configuration
   */
  async generateDefensePackage(
    dissertationChapters: Map<number, string>,
    config: DefenseConfig
  ): Promise<DefensePreparation> {
    // Ensure committee is set up
    if (this.committeeSimulator.getCommittee().length === 0) {
      this.committeeSimulator.addDefaultRoles();
    }

    // Generate all anticipated questions
    const anticipatedQuestions = this.generateAllQuestions(dissertationChapters, config);

    // Store in simulator for later use
    this.committeeSimulator.storeQuestions(anticipatedQuestions);

    // Generate response strategies for challenging questions
    const challengingQuestions = anticipatedQuestions.filter(
      q => q.difficulty === 'challenging' || q.difficulty === 'moderate'
    );
    const responseStrategies = this.generateResponseStrategies(challengingQuestions);

    // Generate slide deck
    const presentationTime = config.totalTime - config.questionTime;
    const summarySlides = this.generateSummarySlides(dissertationChapters, presentationTime);

    // Get abstract and conclusions for statements
    const abstract = dissertationChapters.get(1)?.slice(0, 2000) || '';
    const conclusions = dissertationChapters.get(5)?.slice(-2000) ||
      dissertationChapters.get(dissertationChapters.size)?.slice(-2000) || '';

    // Generate statements
    const openingStatement = this.generateOpeningStatement(abstract);
    const closingStatement = this.generateClosingStatement(conclusions);

    // Generate supporting materials
    const timelineNotes = this.generateTimingGuide(summarySlides);
    const keyPointsCheatSheet = this.generateCheatSheet(dissertationChapters);

    return {
      anticipatedQuestions,
      summarySlides,
      openingStatement,
      closingStatement,
      timelineNotes,
      keyPointsCheatSheet,
      responseStrategies,
      generatedAt: new Date()
    };
  }

  /**
   * Generate opening statement for the defense
   * @param abstract - Abstract or introduction text
   */
  generateOpeningStatement(abstract: string): string {
    const lines: string[] = [];

    lines.push('# Opening Statement');
    lines.push('');
    lines.push('## Suggested Script (2-3 minutes)');
    lines.push('');
    lines.push('Good [morning/afternoon], committee members. Thank you for being here today');
    lines.push('and for your guidance throughout this journey.');
    lines.push('');
    lines.push('Today I will present my dissertation titled "[YOUR TITLE]."');
    lines.push('');
    lines.push('### The Problem');
    lines.push('');
    lines.push('[CUSTOMIZE: 2-3 sentences describing the problem]');
    lines.push('');

    // Extract key phrases from abstract if available
    if (abstract) {
      const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 20);
      if (sentences.length > 0) {
        lines.push('### From Your Abstract');
        lines.push('');
        lines.push('*Consider adapting these key points:*');
        lines.push('');
        for (const sentence of sentences.slice(0, 3)) {
          lines.push(`- ${sentence.trim()}`);
        }
        lines.push('');
      }
    }

    lines.push('### The Research');
    lines.push('');
    lines.push('[CUSTOMIZE: 2-3 sentences describing your approach]');
    lines.push('');
    lines.push('### What You Will Hear Today');
    lines.push('');
    lines.push('In the next [X] minutes, I will:');
    lines.push('');
    lines.push('1. Provide context for this research');
    lines.push('2. Describe my methodology');
    lines.push('3. Present my key findings');
    lines.push('4. Discuss implications and future directions');
    lines.push('');
    lines.push('I look forward to your questions and discussion.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Tips');
    lines.push('');
    lines.push('- Make eye contact with all committee members');
    lines.push('- Speak slowly and clearly');
    lines.push('- Show enthusiasm for your work');
    lines.push('- Avoid reading directly from notes');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate closing statement for the defense
   * @param conclusions - Conclusions chapter text
   */
  generateClosingStatement(conclusions: string): string {
    const lines: string[] = [];

    lines.push('# Closing Statement');
    lines.push('');
    lines.push('## Suggested Script (1-2 minutes)');
    lines.push('');
    lines.push('### Summary');
    lines.push('');
    lines.push('In summary, this dissertation has:');
    lines.push('');
    lines.push('1. [Key contribution #1]');
    lines.push('2. [Key contribution #2]');
    lines.push('3. [Key contribution #3]');
    lines.push('');

    // Extract potential contributions from conclusions
    if (conclusions) {
      const contributionPatterns = [
        /contribut\w*/gi,
        /find\w*/gi,
        /demonstrat\w*/gi,
        /show\w*/gi,
        /reveal\w*/gi
      ];

      const sentences = conclusions.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const relevantSentences = sentences.filter(s =>
        contributionPatterns.some(p => p.test(s))
      );

      if (relevantSentences.length > 0) {
        lines.push('### Key Points from Your Conclusions');
        lines.push('');
        lines.push('*Consider adapting these:*');
        lines.push('');
        for (const sentence of relevantSentences.slice(0, 3)) {
          lines.push(`- ${sentence.trim()}`);
        }
        lines.push('');
      }
    }

    lines.push('### Significance');
    lines.push('');
    lines.push('This research matters because [CUSTOMIZE].');
    lines.push('');
    lines.push('### Future Directions');
    lines.push('');
    lines.push('Moving forward, I plan to [CUSTOMIZE next steps].');
    lines.push('');
    lines.push('### Thank You');
    lines.push('');
    lines.push('I want to thank:');
    lines.push('');
    lines.push('- My advisor, [NAME], for their guidance');
    lines.push('- My committee members for their invaluable feedback');
    lines.push('- [Others: family, participants, funders, etc.]');
    lines.push('');
    lines.push('I am now happy to answer your questions.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Tips');
    lines.push('');
    lines.push('- End on a confident note');
    lines.push('- Maintain composure even if questions were difficult');
    lines.push('- Express genuine gratitude');
    lines.push('- Invite questions enthusiastically');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate summary slide deck
   * @param chapters - Chapter content map
   * @param duration - Total presentation time in minutes
   */
  generateSummarySlides(chapters: Map<number, string>, duration: number): SlideDeck {
    const slides: Slide[] = [];

    // Calculate time per section
    const sectionCount = 6; // intro, background, methodology, findings, discussion, conclusion
    const baseTimePerSlide = duration / SLIDE_TEMPLATES.length;

    let slideNumber = 1;

    for (const template of SLIDE_TEMPLATES) {
      const slide: Slide = {
        number: slideNumber++,
        title: template.title,
        bulletPoints: this.generateBulletPoints(template, chapters),
        speakerNotes: this.generateSpeakerNotes(template, chapters),
        duration: Math.round(baseTimePerSlide * 10) / 10,
        section: template.section
      };

      slides.push(slide);
    }

    // Adjust timing for findings section (typically needs more time)
    const findingsSlides = slides.filter(s => s.section === 'findings');
    const introSlides = slides.filter(s => s.section === 'intro');

    for (const slide of findingsSlides) {
      slide.duration *= 1.5; // 50% more time for findings
    }

    for (const slide of introSlides) {
      slide.duration *= 0.7; // Less time for intro
    }

    // Normalize to total duration
    const currentTotal = slides.reduce((sum, s) => sum + s.duration, 0);
    const scaleFactor = duration / currentTotal;

    for (const slide of slides) {
      slide.duration = Math.round(slide.duration * scaleFactor * 10) / 10;
    }

    return {
      title: 'Dissertation Defense',
      slides,
      totalDuration: duration,
      createdAt: new Date()
    };
  }

  /**
   * Generate a cheat sheet with key points
   * @param chapters - Chapter content map
   */
  generateCheatSheet(chapters: Map<number, string>): string {
    const lines: string[] = [];

    lines.push('# Defense Cheat Sheet');
    lines.push('');
    lines.push('*Quick reference for key points during your defense*');
    lines.push('');

    lines.push('## Research Question');
    lines.push('');
    lines.push('[YOUR RESEARCH QUESTION]');
    lines.push('');

    lines.push('## Key Terms to Remember');
    lines.push('');
    lines.push('| Term | Definition |');
    lines.push('|------|------------|');
    lines.push('| [Term 1] | [Brief definition] |');
    lines.push('| [Term 2] | [Brief definition] |');
    lines.push('| [Term 3] | [Brief definition] |');
    lines.push('');

    lines.push('## Methodology Summary');
    lines.push('');
    lines.push('- **Design**: [Your design]');
    lines.push('- **Sample**: [Sample description]');
    lines.push('- **Data Collection**: [Methods]');
    lines.push('- **Analysis**: [Approach]');
    lines.push('');

    lines.push('## 3 Key Findings');
    lines.push('');
    lines.push('1. **Finding 1**: [One sentence summary]');
    lines.push('2. **Finding 2**: [One sentence summary]');
    lines.push('3. **Finding 3**: [One sentence summary]');
    lines.push('');

    lines.push('## Contributions');
    lines.push('');
    lines.push('- **Theoretical**: [Contribution to theory]');
    lines.push('- **Practical**: [Practical implication]');
    lines.push('- **Methodological**: [If applicable]');
    lines.push('');

    lines.push('## Key Statistics (if quantitative)');
    lines.push('');
    lines.push('| Statistic | Value | Interpretation |');
    lines.push('|-----------|-------|----------------|');
    lines.push('| n | [value] | Sample size |');
    lines.push('| p-value | [value] | Significance |');
    lines.push('| Effect size | [value] | Practical significance |');
    lines.push('');

    lines.push('## Limitations (Be Ready to Discuss)');
    lines.push('');
    lines.push('1. [Limitation 1]: *How you addressed it*');
    lines.push('2. [Limitation 2]: *How you addressed it*');
    lines.push('3. [Limitation 3]: *How you addressed it*');
    lines.push('');

    lines.push('## Anticipated Tough Questions');
    lines.push('');
    lines.push('1. Q: [Question]');
    lines.push('   A: [Key points for response]');
    lines.push('');
    lines.push('2. Q: [Question]');
    lines.push('   A: [Key points for response]');
    lines.push('');

    lines.push('## Key Citations to Reference');
    lines.push('');
    lines.push('- [Author] ([Year]): [Why important]');
    lines.push('- [Author] ([Year]): [Why important]');
    lines.push('- [Author] ([Year]): [Why important]');
    lines.push('');

    lines.push('## Emergency Phrases');
    lines.push('');
    lines.push('- "That is an excellent question. Let me think about that for a moment..."');
    lines.push('- "That\'s outside the scope of this study, but it would make an excellent future research direction."');
    lines.push('- "I acknowledge that limitation. In this study, I addressed it by..."');
    lines.push('- "Could you clarify what aspect of [topic] you\'d like me to address?"');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate response strategies for questions
   * @param questions - Questions to generate strategies for
   */
  generateResponseStrategies(questions: CommitteeQuestion[]): QuestionResponseStrategy[] {
    return questions.map(question => this.determineStrategy(question));
  }

  /**
   * Generate timing guide for the slide deck
   * @param slides - Slide deck
   */
  generateTimingGuide(slides: SlideDeck): string {
    const lines: string[] = [];

    lines.push('# Defense Timing Guide');
    lines.push('');
    lines.push(`**Total Presentation Time**: ${slides.totalDuration} minutes`);
    lines.push('');
    lines.push('## Slide-by-Slide Timing');
    lines.push('');
    lines.push('| Slide | Title | Duration | Cumulative |');
    lines.push('|-------|-------|----------|------------|');

    let cumulative = 0;
    for (const slide of slides.slides) {
      cumulative += slide.duration;
      lines.push(
        `| ${slide.number} | ${slide.title} | ${slide.duration} min | ${cumulative.toFixed(1)} min |`
      );
    }

    lines.push('');
    lines.push('## Section Breakdown');
    lines.push('');

    const sectionTimes = new Map<string, number>();
    for (const slide of slides.slides) {
      const section = slide.section || 'other';
      sectionTimes.set(section, (sectionTimes.get(section) || 0) + slide.duration);
    }

    lines.push('| Section | Time | % of Total |');
    lines.push('|---------|------|------------|');

    for (const [section, time] of Array.from(sectionTimes.entries())) {
      const percentage = Math.round((time / slides.totalDuration) * 100);
      lines.push(`| ${section} | ${time.toFixed(1)} min | ${percentage}% |`);
    }

    lines.push('');
    lines.push('## Pacing Tips');
    lines.push('');
    lines.push('- **Practice**: Run through at least 3 times before the defense');
    lines.push('- **Time Markers**: Note cumulative time at key points');
    lines.push('- **Buffer**: Leave 2-3 minutes buffer before Q&A');
    lines.push('- **Flexibility**: Be ready to skip details if running long');
    lines.push('- **Watch Signals**: Note if committee seems restless');
    lines.push('');
    lines.push('## Checkpoints');
    lines.push('');

    const checkpoints = [0.25, 0.5, 0.75];
    for (const checkpoint of checkpoints) {
      const targetTime = Math.round(slides.totalDuration * checkpoint);
      const targetSlide = slides.slides.find((_, i) => {
        const cumulativeToHere = slides.slides
          .slice(0, i + 1)
          .reduce((sum, s) => sum + s.duration, 0);
        return cumulativeToHere >= targetTime;
      });

      if (targetSlide) {
        lines.push(
          `- **${Math.round(checkpoint * 100)}% mark** (~${targetTime} min): ` +
          `Should be at or near "${targetSlide.title}"`
        );
      }
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get the committee simulator instance
   */
  getCommitteeSimulator(): CommitteeSimulator {
    return this.committeeSimulator;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateAllQuestions(
    chapters: Map<number, string>,
    config: DefenseConfig
  ): CommitteeQuestion[] {
    const allQuestions: CommitteeQuestion[] = [];

    // Generate questions for each chapter
    for (const [chapterNum, content] of Array.from(chapters.entries())) {
      const chapterQuestions = this.committeeSimulator.generateQuestions(
        content,
        chapterNum,
        5
      );
      allQuestions.push(...chapterQuestions);
    }

    // Add methodology-specific questions if Chapter 3 exists
    if (chapters.has(3)) {
      const methodQuestions = this.committeeSimulator.generateMethodologistQuestions(
        chapters.get(3)!
      );
      allQuestions.push(...methodQuestions);
    }

    // Add theory-specific questions if Chapter 2 exists
    if (chapters.has(2)) {
      const theoryQuestions = this.committeeSimulator.generateTheoristQuestions(
        chapters.get(2)!
      );
      allQuestions.push(...theoryQuestions);
    }

    // Add critical questions if requested
    if (config.includeChallenging !== false) {
      const criticalQuestions = this.committeeSimulator.generateCriticalQuestions();
      allQuestions.push(...criticalQuestions);
    }

    // Add general defense questions
    const fullText = Array.from(chapters.values()).join('\n\n');
    const defenseQuestions = this.committeeSimulator.generateDefenseQuestions(
      fullText,
      10
    );
    allQuestions.push(...defenseQuestions);

    // Deduplicate
    const seen = new Set<string>();
    return allQuestions.filter(q => {
      const key = q.question.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private generateBulletPoints(
    template: typeof SLIDE_TEMPLATES[0],
    chapters: Map<number, string>
  ): string[] {
    // Use content guide as bullet points, customized where possible
    const bullets = [...template.contentGuide];

    // Add placeholder markers
    return bullets.map(b => `[${b}]`);
  }

  private generateSpeakerNotes(
    template: typeof SLIDE_TEMPLATES[0],
    chapters: Map<number, string>
  ): string {
    const notes: string[] = [];

    notes.push(`**Slide: ${template.title}**`);
    notes.push('');
    notes.push('Key points to cover:');

    for (const point of template.contentGuide) {
      notes.push(`- ${point}`);
    }

    notes.push('');

    // Add section-specific tips
    switch (template.section) {
      case 'intro':
        notes.push('*Tips: Make eye contact, set the tone, show enthusiasm*');
        break;
      case 'methodology':
        notes.push('*Tips: Be precise, anticipate methods questions, show rigor*');
        break;
      case 'findings':
        notes.push('*Tips: Highlight significance, connect to research questions*');
        break;
      case 'conclusion':
        notes.push('*Tips: Be confident about contributions, show future vision*');
        break;
    }

    return notes.join('\n');
  }

  private determineStrategy(question: CommitteeQuestion): QuestionResponseStrategy {
    // Check patterns to determine strategy
    for (const pattern of STRATEGY_PATTERNS) {
      if (pattern.indicators.some(r => r.test(question.question))) {
        return {
          question,
          strategy: pattern.strategy,
          keyPoints: [...pattern.genericKeyPoints],
          supportingEvidence: this.getSupportingEvidence(question),
          thingsToAvoid: this.getThingsToAvoid(pattern.strategy)
        };
      }
    }

    // Default to direct answer
    return {
      question,
      strategy: 'direct_answer',
      keyPoints: [
        'Answer the question directly first',
        'Provide supporting evidence',
        'Connect to your findings',
        'Be concise but thorough'
      ],
      supportingEvidence: this.getSupportingEvidence(question),
      thingsToAvoid: this.getThingsToAvoid('direct_answer')
    };
  }

  private getSupportingEvidence(question: CommitteeQuestion): string[] {
    const evidence: string[] = [];

    switch (question.category) {
      case 'methodology':
        evidence.push('Reference your methodology chapter');
        evidence.push('Cite methods literature that supports your choices');
        evidence.push('Reference specific procedures you used');
        break;
      case 'theory':
        evidence.push('Reference key theoretical works');
        evidence.push('Point to your conceptual framework');
        evidence.push('Connect to established constructs');
        break;
      case 'findings':
        evidence.push('Reference specific data points');
        evidence.push('Point to tables or figures');
        evidence.push('Quote participant responses (if qualitative)');
        break;
      case 'literature':
        evidence.push('Reference seminal works');
        evidence.push('Point to recent studies');
        evidence.push('Highlight how you built on prior work');
        break;
      default:
        evidence.push('Reference relevant chapter');
        evidence.push('Point to specific data or analysis');
    }

    return evidence;
  }

  private getThingsToAvoid(strategy: ResponseStrategy): string[] {
    const avoidances: Record<ResponseStrategy, string[]> = {
      'direct_answer': [
        'Rambling or going off-topic',
        'Being defensive',
        'Oversimplifying complex issues'
      ],
      'acknowledge_limitation': [
        'Being overly apologetic',
        'Dismissing the limitation',
        'Failing to show you considered it'
      ],
      'future_research': [
        'Making it seem like the dissertation is incomplete',
        'Being vague about next steps',
        'Over-promising'
      ],
      'reframe': [
        'Appearing evasive',
        'Dismissing the alternative outright',
        'Being defensive about your choices'
      ]
    };

    return avoidances[strategy];
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Export defense preparation as formatted markdown
 */
export function exportDefensePreparation(prep: DefensePreparation): string {
  const lines: string[] = [];

  lines.push('# Dissertation Defense Preparation Package');
  lines.push('');
  lines.push(`*Generated: ${prep.generatedAt.toLocaleDateString()}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Opening statement
  lines.push(prep.openingStatement);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Slides overview
  lines.push('# Slide Deck Summary');
  lines.push('');
  lines.push(`Total slides: ${prep.summarySlides.slides.length}`);
  lines.push(`Total duration: ${prep.summarySlides.totalDuration} minutes`);
  lines.push('');

  for (const slide of prep.summarySlides.slides) {
    lines.push(`## Slide ${slide.number}: ${slide.title}`);
    lines.push(`*Duration: ${slide.duration} minutes*`);
    lines.push('');
    for (const bullet of slide.bulletPoints) {
      lines.push(`- ${bullet}`);
    }
    lines.push('');
    lines.push('**Speaker Notes:**');
    lines.push(slide.speakerNotes);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Cheat sheet
  lines.push(prep.keyPointsCheatSheet);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Timing guide
  lines.push(prep.timelineNotes);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Anticipated questions
  lines.push('# Anticipated Questions');
  lines.push('');

  const byCategory = new Map<string, CommitteeQuestion[]>();
  for (const q of prep.anticipatedQuestions) {
    const category = q.category;
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(q);
  }

  for (const [category, questions] of Array.from(byCategory.entries())) {
    lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Questions`);
    lines.push('');

    for (const q of questions) {
      lines.push(`### ${q.question}`);
      lines.push('');
      lines.push(`- **From**: ${q.askedBy} (${q.role})`);
      lines.push(`- **Difficulty**: ${q.difficulty}`);
      lines.push(`- **Suggested approach**: ${q.suggestedResponse}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');

  // Closing statement
  lines.push(prep.closingStatement);

  return lines.join('\n');
}

// ============================================================================
// Exports
// ============================================================================

export default DefensePreparationGenerator;
