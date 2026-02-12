/**
 * Committee Simulator
 *
 * Simulates committee member perspectives and generates anticipated questions
 * for dissertation defense preparation. Uses pattern matching on dissertation
 * content to generate role-appropriate questions.
 *
 * All operations work offline without external API calls.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Committee member roles
 */
export type CommitteeRole =
  | 'chair'
  | 'advisor'
  | 'methodologist'
  | 'theorist'
  | 'external'
  | 'reader';

/**
 * Question styles for committee members
 */
export type QuestionStyle =
  | 'probing'       // Deep, detailed questions
  | 'supportive'    // Helpful, clarifying questions
  | 'challenging'   // Critical, testing questions
  | 'technical';    // Methodology/method focused questions

/**
 * Question categories
 */
export type QuestionCategory =
  | 'methodology'
  | 'theory'
  | 'literature'
  | 'findings'
  | 'implications'
  | 'limitations'
  | 'defense';

/**
 * Question difficulty levels
 */
export type QuestionDifficulty = 'easy' | 'moderate' | 'challenging';

/**
 * Committee member definition
 */
export interface CommitteeMember {
  /** Member name */
  name: string;
  /** Role on committee */
  role: CommitteeRole;
  /** Areas of expertise */
  expertise: string[];
  /** Focus areas for questions */
  focusAreas: string[];
  /** Question style */
  questionStyle: QuestionStyle;
  /** Personality traits affecting questions */
  personalityTraits: string[];
}

/**
 * A generated committee question
 */
export interface CommitteeQuestion {
  /** Unique question identifier */
  id: string;
  /** Name of committee member asking */
  askedBy: string;
  /** Role of the questioner */
  role: CommitteeRole;
  /** The question text */
  question: string;
  /** Question category */
  category: QuestionCategory;
  /** Difficulty level */
  difficulty: QuestionDifficulty;
  /** Suggested response approach */
  suggestedResponse: string;
  /** Related chapter number (if applicable) */
  relatedChapter?: number;
  /** Related concepts/terms */
  relatedConcepts: string[];
  /** Context that triggered this question */
  triggerContext?: string;
}

/**
 * Overall committee review assessment
 */
export type ReviewAssessment =
  | 'approve'
  | 'minor_revisions'
  | 'major_revisions'
  | 'revise_and_resubmit';

/**
 * Individual committee member feedback
 */
export interface MemberFeedback {
  /** Committee member name */
  member: string;
  /** Member role */
  role: CommitteeRole;
  /** Identified strengths */
  strengths: string[];
  /** Concerns raised */
  concerns: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * Complete committee review result
 */
export interface CommitteeReview {
  /** Overall assessment */
  overallAssessment: ReviewAssessment;
  /** Feedback from each member */
  memberFeedback: MemberFeedback[];
  /** Common themes across feedback */
  commonThemes: string[];
  /** Critical issues that must be addressed */
  criticalIssues: string[];
  /** Prioritized revision list */
  revisionPriorities: string[];
  /** Generated timestamp */
  generatedAt: Date;
}

// ============================================================================
// Question Pattern Definitions
// ============================================================================

/**
 * Pattern-based question templates for each category
 */
interface QuestionPattern {
  category: QuestionCategory;
  triggers: RegExp[];  // Patterns that trigger this question type
  templates: Array<{
    question: string;
    difficulty: QuestionDifficulty;
    responseHint: string;
    roleAffinity: CommitteeRole[];
  }>;
}

/**
 * Question patterns for methodology-related content
 */
const METHODOLOGY_PATTERNS: QuestionPattern = {
  category: 'methodology',
  triggers: [
    /method(ology)?/i,
    /research design/i,
    /data collection/i,
    /sampling/i,
    /participant/i,
    /interview/i,
    /survey/i,
    /experiment/i,
    /qualitative/i,
    /quantitative/i,
    /mixed.method/i,
    /triangulation/i,
    /validity/i,
    /reliability/i
  ],
  templates: [
    {
      question: 'Why did you choose this particular research design over alternative approaches?',
      difficulty: 'moderate',
      responseHint: 'Explain the alignment between research questions and methodology',
      roleAffinity: ['methodologist', 'advisor']
    },
    {
      question: 'How do you address potential threats to validity in your study?',
      difficulty: 'challenging',
      responseHint: 'Discuss specific validity strategies implemented',
      roleAffinity: ['methodologist']
    },
    {
      question: 'Can you justify your sample size and sampling strategy?',
      difficulty: 'moderate',
      responseHint: 'Reference power analysis or saturation principles',
      roleAffinity: ['methodologist', 'external']
    },
    {
      question: 'What limitations does your methodological approach introduce?',
      difficulty: 'easy',
      responseHint: 'Be honest about limitations while showing awareness',
      roleAffinity: ['advisor', 'reader']
    },
    {
      question: 'How would you replicate this study?',
      difficulty: 'moderate',
      responseHint: 'Provide clear replication protocol',
      roleAffinity: ['methodologist', 'external']
    },
    {
      question: 'What alternative methods did you consider and why were they rejected?',
      difficulty: 'challenging',
      responseHint: 'Show you considered alternatives systematically',
      roleAffinity: ['methodologist', 'chair']
    }
  ]
};

/**
 * Question patterns for theoretical content
 */
const THEORY_PATTERNS: QuestionPattern = {
  category: 'theory',
  triggers: [
    /theory|theoretical/i,
    /framework/i,
    /conceptual/i,
    /model/i,
    /paradigm/i,
    /lens/i,
    /construct/i,
    /variable/i,
    /hypothesis/i
  ],
  templates: [
    {
      question: 'How does your theoretical framework inform your research design?',
      difficulty: 'moderate',
      responseHint: 'Connect theory directly to methodology choices',
      roleAffinity: ['theorist', 'advisor']
    },
    {
      question: 'What are the boundaries of your theoretical framework?',
      difficulty: 'challenging',
      responseHint: 'Acknowledge what the framework does not explain',
      roleAffinity: ['theorist']
    },
    {
      question: 'How does your work extend or challenge existing theory?',
      difficulty: 'challenging',
      responseHint: 'Articulate your theoretical contribution clearly',
      roleAffinity: ['theorist', 'chair']
    },
    {
      question: 'Could an alternative theoretical lens yield different insights?',
      difficulty: 'challenging',
      responseHint: 'Show awareness of other frameworks while defending your choice',
      roleAffinity: ['theorist', 'external']
    },
    {
      question: 'How do you operationalize the key constructs from your framework?',
      difficulty: 'moderate',
      responseHint: 'Explain the translation from theory to measurement',
      roleAffinity: ['methodologist', 'theorist']
    }
  ]
};

/**
 * Question patterns for literature review content
 */
const LITERATURE_PATTERNS: QuestionPattern = {
  category: 'literature',
  triggers: [
    /literature/i,
    /previous (research|studies|work)/i,
    /scholars/i,
    /prior (research|studies)/i,
    /existing research/i,
    /gap/i,
    /contribution/i,
    /seminal/i,
    /foundational/i
  ],
  templates: [
    {
      question: 'How does your work address the gap you identified in the literature?',
      difficulty: 'moderate',
      responseHint: 'Directly connect your contribution to the identified gap',
      roleAffinity: ['advisor', 'theorist']
    },
    {
      question: 'Are there any important works that are missing from your literature review?',
      difficulty: 'easy',
      responseHint: 'Be prepared to discuss scope decisions',
      roleAffinity: ['reader', 'external']
    },
    {
      question: 'How do you position your work relative to conflicting findings in the literature?',
      difficulty: 'challenging',
      responseHint: 'Show nuanced understanding of debates in the field',
      roleAffinity: ['theorist', 'advisor']
    },
    {
      question: 'What criteria did you use to select sources for your review?',
      difficulty: 'easy',
      responseHint: 'Explain your systematic approach to literature selection',
      roleAffinity: ['methodologist', 'reader']
    }
  ]
};

/**
 * Question patterns for findings/results content
 */
const FINDINGS_PATTERNS: QuestionPattern = {
  category: 'findings',
  triggers: [
    /finding/i,
    /result/i,
    /data|datum/i,
    /analysis/i,
    /theme/i,
    /pattern/i,
    /significant/i,
    /correlation/i,
    /regression/i,
    /p.value/i,
    /effect.size/i
  ],
  templates: [
    {
      question: 'Which finding surprised you most and why?',
      difficulty: 'easy',
      responseHint: 'Share genuine reflection on unexpected results',
      roleAffinity: ['advisor', 'chair']
    },
    {
      question: 'How do you account for the unexpected findings in your study?',
      difficulty: 'challenging',
      responseHint: 'Offer theoretically grounded explanations',
      roleAffinity: ['theorist', 'methodologist']
    },
    {
      question: 'Could your findings be explained by alternative interpretations?',
      difficulty: 'challenging',
      responseHint: 'Acknowledge alternatives while defending your interpretation',
      roleAffinity: ['external', 'theorist']
    },
    {
      question: 'How confident are you in the generalizability of these findings?',
      difficulty: 'moderate',
      responseHint: 'Be realistic about scope of claims',
      roleAffinity: ['methodologist', 'external']
    },
    {
      question: 'What would constitute a disconfirmation of your findings?',
      difficulty: 'challenging',
      responseHint: 'Show you understand falsifiability',
      roleAffinity: ['methodologist', 'theorist']
    }
  ]
};

/**
 * Question patterns for implications content
 */
const IMPLICATIONS_PATTERNS: QuestionPattern = {
  category: 'implications',
  triggers: [
    /implication/i,
    /significance/i,
    /contribution/i,
    /practical/i,
    /application/i,
    /policy/i,
    /practice/i,
    /impact/i,
    /relevance/i
  ],
  templates: [
    {
      question: 'Who are the primary audiences for your research and why should they care?',
      difficulty: 'moderate',
      responseHint: 'Identify specific stakeholder groups',
      roleAffinity: ['advisor', 'external']
    },
    {
      question: 'What are the practical implications of your findings?',
      difficulty: 'easy',
      responseHint: 'Translate findings into actionable insights',
      roleAffinity: ['external', 'reader']
    },
    {
      question: 'How might your findings inform policy or practice?',
      difficulty: 'moderate',
      responseHint: 'Be specific about policy/practice recommendations',
      roleAffinity: ['external', 'chair']
    },
    {
      question: 'What is the most significant contribution of your dissertation?',
      difficulty: 'easy',
      responseHint: 'Articulate your unique contribution clearly',
      roleAffinity: ['chair', 'advisor']
    }
  ]
};

/**
 * Question patterns for limitations content
 */
const LIMITATIONS_PATTERNS: QuestionPattern = {
  category: 'limitations',
  triggers: [
    /limitation/i,
    /weakness/i,
    /constraint/i,
    /boundary/i,
    /scope/i,
    /delimitation/i,
    /assumption/i
  ],
  templates: [
    {
      question: 'What is the most significant limitation of your study?',
      difficulty: 'easy',
      responseHint: 'Be candid while showing it was considered',
      roleAffinity: ['advisor', 'reader']
    },
    {
      question: 'How might the limitations affect the interpretation of your findings?',
      difficulty: 'moderate',
      responseHint: 'Connect limitations to claims made',
      roleAffinity: ['methodologist', 'external']
    },
    {
      question: 'If you could do this study again, what would you do differently?',
      difficulty: 'moderate',
      responseHint: 'Show growth and reflexivity',
      roleAffinity: ['advisor', 'chair']
    },
    {
      question: 'Are there any assumptions underlying your work that should be questioned?',
      difficulty: 'challenging',
      responseHint: 'Demonstrate awareness of foundational assumptions',
      roleAffinity: ['theorist', 'external']
    }
  ]
};

/**
 * General defense questions (always applicable)
 */
const DEFENSE_PATTERNS: QuestionPattern = {
  category: 'defense',
  triggers: [], // No triggers - these are general questions
  templates: [
    {
      question: 'In one sentence, what is the main argument of your dissertation?',
      difficulty: 'easy',
      responseHint: 'Have a clear, concise thesis statement ready',
      roleAffinity: ['chair', 'advisor']
    },
    {
      question: 'What is your dissertation\'s original contribution to knowledge?',
      difficulty: 'moderate',
      responseHint: 'Articulate novelty clearly and specifically',
      roleAffinity: ['chair', 'external']
    },
    {
      question: 'How has your thinking evolved over the course of this research?',
      difficulty: 'moderate',
      responseHint: 'Show intellectual growth and reflexivity',
      roleAffinity: ['advisor', 'reader']
    },
    {
      question: 'What are the next steps for this line of research?',
      difficulty: 'easy',
      responseHint: 'Demonstrate you see a research agenda beyond the dissertation',
      roleAffinity: ['advisor', 'theorist']
    },
    {
      question: 'Why does this research matter?',
      difficulty: 'moderate',
      responseHint: 'Connect to broader significance',
      roleAffinity: ['chair', 'external']
    },
    {
      question: 'What would you tell someone who disagreed with your conclusions?',
      difficulty: 'challenging',
      responseHint: 'Show you can engage with criticism constructively',
      roleAffinity: ['external', 'theorist']
    },
    {
      question: 'How does this dissertation prepare you for your future career?',
      difficulty: 'easy',
      responseHint: 'Connect research to professional development',
      roleAffinity: ['advisor', 'chair']
    }
  ]
};

/**
 * All question patterns
 */
const ALL_PATTERNS: QuestionPattern[] = [
  METHODOLOGY_PATTERNS,
  THEORY_PATTERNS,
  LITERATURE_PATTERNS,
  FINDINGS_PATTERNS,
  IMPLICATIONS_PATTERNS,
  LIMITATIONS_PATTERNS,
  DEFENSE_PATTERNS
];

// ============================================================================
// Default Committee Roles
// ============================================================================

/**
 * Default committee member configurations by role
 */
const DEFAULT_COMMITTEE_TEMPLATES: Record<CommitteeRole, Omit<CommitteeMember, 'name'>> = {
  chair: {
    role: 'chair',
    expertise: ['dissertation process', 'academic standards'],
    focusAreas: ['overall quality', 'contribution', 'completeness'],
    questionStyle: 'probing',
    personalityTraits: ['big-picture', 'procedural']
  },
  advisor: {
    role: 'advisor',
    expertise: ['subject area', 'research methods'],
    focusAreas: ['research design', 'contribution', 'growth'],
    questionStyle: 'supportive',
    personalityTraits: ['mentoring', 'constructive']
  },
  methodologist: {
    role: 'methodologist',
    expertise: ['research methods', 'statistics', 'validity'],
    focusAreas: ['methodology', 'data analysis', 'rigor'],
    questionStyle: 'technical',
    personalityTraits: ['detail-oriented', 'systematic']
  },
  theorist: {
    role: 'theorist',
    expertise: ['theoretical frameworks', 'conceptual models'],
    focusAreas: ['theory', 'conceptualization', 'contribution to theory'],
    questionStyle: 'challenging',
    personalityTraits: ['analytical', 'abstract-thinking']
  },
  external: {
    role: 'external',
    expertise: ['related field', 'broader context'],
    focusAreas: ['external validity', 'implications', 'interdisciplinary connections'],
    questionStyle: 'challenging',
    personalityTraits: ['outsider perspective', 'critical']
  },
  reader: {
    role: 'reader',
    expertise: ['subject area', 'writing quality'],
    focusAreas: ['clarity', 'organization', 'completeness'],
    questionStyle: 'supportive',
    personalityTraits: ['thorough', 'attentive']
  }
};

// ============================================================================
// Committee Simulator Class
// ============================================================================

/**
 * Simulates committee member perspectives and generates anticipated questions
 * for dissertation defense preparation.
 */
export class CommitteeSimulator {
  private committee: CommitteeMember[] = [];
  private questionBank: CommitteeQuestion[] = [];

  /**
   * Setup committee with provided members
   * @param members - Array of committee member definitions
   */
  setupCommittee(members: CommitteeMember[]): void {
    this.committee = [...members];
  }

  /**
   * Add default committee roles with typical personas
   */
  addDefaultRoles(): void {
    const defaultNames: Record<CommitteeRole, string> = {
      chair: 'Dr. Committee Chair',
      advisor: 'Dr. Dissertation Advisor',
      methodologist: 'Dr. Methods Expert',
      theorist: 'Dr. Theory Specialist',
      external: 'Dr. External Reviewer',
      reader: 'Dr. Faculty Reader'
    };

    const roles: CommitteeRole[] = ['chair', 'advisor', 'methodologist', 'theorist', 'external'];

    for (const role of roles) {
      if (!this.committee.find(m => m.role === role)) {
        this.committee.push({
          name: defaultNames[role],
          ...DEFAULT_COMMITTEE_TEMPLATES[role]
        });
      }
    }
  }

  /**
   * Add a committee member
   * @param member - Committee member to add
   */
  addMember(member: CommitteeMember): void {
    this.committee.push(member);
  }

  /**
   * Get current committee
   */
  getCommittee(): CommitteeMember[] {
    return [...this.committee];
  }

  /**
   * Generate questions based on chapter text content
   * @param chapterText - Text content of the chapter
   * @param chapterId - Chapter number
   * @param count - Maximum number of questions to generate
   */
  generateQuestions(
    chapterText: string,
    chapterId: number,
    count: number = 10
  ): CommitteeQuestion[] {
    const questions: CommitteeQuestion[] = [];

    // Find matching patterns in the text
    for (const pattern of ALL_PATTERNS) {
      for (const trigger of pattern.triggers) {
        if (trigger.test(chapterText)) {
          // Generate questions from matching templates
          for (const template of pattern.templates) {
            // Find a committee member appropriate for this question
            const member = this.findMemberForQuestion(template.roleAffinity);
            if (!member) continue;

            const question = this.createQuestion(
              template.question,
              member,
              pattern.category,
              template.difficulty,
              template.responseHint,
              chapterId
            );

            questions.push(question);

            if (questions.length >= count * 2) break;
          }
        }
        if (questions.length >= count * 2) break;
      }
      if (questions.length >= count * 2) break;
    }

    // Add some defense questions regardless of content
    const defenseQuestions = this.generateDefenseQuestions(chapterText, 3);
    questions.push(...defenseQuestions);

    // Dedupe and limit
    const uniqueQuestions = this.deduplicateQuestions(questions);
    return uniqueQuestions.slice(0, count);
  }

  /**
   * Generate methodologist-specific questions
   * @param methodologySection - Methodology section text
   */
  generateMethodologistQuestions(methodologySection: string): CommitteeQuestion[] {
    const methodologist = this.committee.find(m => m.role === 'methodologist')
      || { name: 'Dr. Methods Expert', ...DEFAULT_COMMITTEE_TEMPLATES.methodologist };

    const questions: CommitteeQuestion[] = [];

    for (const template of METHODOLOGY_PATTERNS.templates) {
      questions.push(this.createQuestion(
        template.question,
        methodologist,
        'methodology',
        template.difficulty,
        template.responseHint,
        3 // Typically chapter 3
      ));
    }

    // Add context-specific questions based on methodology keywords
    if (/qualitative/i.test(methodologySection)) {
      questions.push(this.createQuestion(
        'How did you achieve trustworthiness in your qualitative research?',
        methodologist,
        'methodology',
        'moderate',
        'Discuss credibility, transferability, dependability, and confirmability',
        3
      ));
    }

    if (/quantitative/i.test(methodologySection)) {
      questions.push(this.createQuestion(
        'Walk me through your statistical analysis approach.',
        methodologist,
        'methodology',
        'moderate',
        'Explain analysis choices and assumptions checked',
        3
      ));
    }

    if (/mixed.method/i.test(methodologySection)) {
      questions.push(this.createQuestion(
        'How did you integrate your qualitative and quantitative findings?',
        methodologist,
        'methodology',
        'challenging',
        'Explain the integration strategy and any tensions between methods',
        3
      ));
    }

    return questions;
  }

  /**
   * Generate theorist-specific questions
   * @param theoreticalFramework - Theoretical framework text
   */
  generateTheoristQuestions(theoreticalFramework: string): CommitteeQuestion[] {
    const theorist = this.committee.find(m => m.role === 'theorist')
      || { name: 'Dr. Theory Specialist', ...DEFAULT_COMMITTEE_TEMPLATES.theorist };

    const questions: CommitteeQuestion[] = [];

    for (const template of THEORY_PATTERNS.templates) {
      questions.push(this.createQuestion(
        template.question,
        theorist,
        'theory',
        template.difficulty,
        template.responseHint,
        2 // Typically chapter 2
      ));
    }

    return questions;
  }

  /**
   * Simulate a full committee review of the dissertation
   * @param dissertationChapters - Map of chapter numbers to text content
   */
  simulateCommitteeReview(dissertationChapters: Map<number, string>): CommitteeReview {
    if (this.committee.length === 0) {
      this.addDefaultRoles();
    }

    const memberFeedback: MemberFeedback[] = [];

    // Generate feedback from each committee member
    for (const member of this.committee) {
      const feedback = this.generateMemberFeedback(member, dissertationChapters);
      memberFeedback.push(feedback);
    }

    // Analyze common themes
    const commonThemes = this.findCommonThemes(memberFeedback);

    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(memberFeedback);

    // Determine overall assessment
    const overallAssessment = this.determineOverallAssessment(memberFeedback);

    // Prioritize revisions
    const revisionPriorities = this.prioritizeRevisions(memberFeedback, criticalIssues);

    return {
      overallAssessment,
      memberFeedback,
      commonThemes,
      criticalIssues,
      revisionPriorities,
      generatedAt: new Date()
    };
  }

  /**
   * Generate defense questions from full dissertation
   * @param fullDissertation - Complete dissertation text or joined chapters
   * @param count - Number of questions to generate
   */
  generateDefenseQuestions(fullDissertation: string, count: number = 20): CommitteeQuestion[] {
    if (this.committee.length === 0) {
      this.addDefaultRoles();
    }

    const questions: CommitteeQuestion[] = [];

    // Generate questions from all patterns
    for (const pattern of ALL_PATTERNS) {
      // Check if pattern is relevant to content
      const isRelevant = pattern.triggers.length === 0 ||
        pattern.triggers.some(t => t.test(fullDissertation));

      if (isRelevant) {
        for (const template of pattern.templates) {
          const member = this.findMemberForQuestion(template.roleAffinity);
          if (!member) continue;

          questions.push(this.createQuestion(
            template.question,
            member,
            pattern.category,
            template.difficulty,
            template.responseHint
          ));
        }
      }
    }

    // Shuffle and limit
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Generate the most challenging anticipated questions
   */
  generateCriticalQuestions(): CommitteeQuestion[] {
    if (this.committee.length === 0) {
      this.addDefaultRoles();
    }

    const criticalQuestions: CommitteeQuestion[] = [];

    // Collect all challenging questions
    for (const pattern of ALL_PATTERNS) {
      for (const template of pattern.templates) {
        if (template.difficulty === 'challenging') {
          const member = this.findMemberForQuestion(template.roleAffinity);
          if (!member) continue;

          criticalQuestions.push(this.createQuestion(
            template.question,
            member,
            pattern.category,
            'challenging',
            template.responseHint
          ));
        }
      }
    }

    return criticalQuestions;
  }

  /**
   * Build question bank organized by category
   */
  buildQuestionBankByCategory(): Record<QuestionCategory, CommitteeQuestion[]> {
    const bank: Record<QuestionCategory, CommitteeQuestion[]> = {
      methodology: [],
      theory: [],
      literature: [],
      findings: [],
      implications: [],
      limitations: [],
      defense: []
    };

    for (const q of this.questionBank) {
      bank[q.category].push(q);
    }

    return bank;
  }

  /**
   * Export the question bank as formatted text
   */
  exportQuestionBank(): string {
    const lines: string[] = [];

    lines.push('# Anticipated Committee Questions');
    lines.push('');
    lines.push(`*Generated: ${new Date().toLocaleDateString()}*`);
    lines.push('');

    const categoryTitles: Record<QuestionCategory, string> = {
      methodology: 'Methodology Questions',
      theory: 'Theoretical Framework Questions',
      literature: 'Literature Review Questions',
      findings: 'Results/Findings Questions',
      implications: 'Implications Questions',
      limitations: 'Limitations Questions',
      defense: 'General Defense Questions'
    };

    const byCategory = this.buildQuestionBankByCategory();

    for (const [category, title] of Object.entries(categoryTitles)) {
      const questions = byCategory[category as QuestionCategory];
      if (questions.length === 0) continue;

      lines.push(`## ${title}`);
      lines.push('');

      for (const q of questions) {
        const difficultyLabel = q.difficulty === 'challenging' ? ' [CHALLENGING]' :
          q.difficulty === 'moderate' ? ' [MODERATE]' : '';

        lines.push(`### Q: ${q.question}${difficultyLabel}`);
        lines.push('');
        lines.push(`**Asked by**: ${q.askedBy} (${q.role})`);
        if (q.relatedChapter) {
          lines.push(`**Related Chapter**: ${q.relatedChapter}`);
        }
        lines.push('');
        lines.push(`**Suggested Response Approach**: ${q.suggestedResponse}`);
        lines.push('');
        if (q.relatedConcepts.length > 0) {
          lines.push(`**Related Concepts**: ${q.relatedConcepts.join(', ')}`);
          lines.push('');
        }
        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Store questions in the internal question bank
   * @param questions - Questions to store
   */
  storeQuestions(questions: CommitteeQuestion[]): void {
    this.questionBank.push(...questions);
  }

  /**
   * Clear the question bank
   */
  clearQuestionBank(): void {
    this.questionBank = [];
  }

  /**
   * Get all stored questions
   */
  getQuestionBank(): CommitteeQuestion[] {
    return [...this.questionBank];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createQuestion(
    questionText: string,
    member: CommitteeMember,
    category: QuestionCategory,
    difficulty: QuestionDifficulty,
    responseHint: string,
    relatedChapter?: number
  ): CommitteeQuestion {
    return {
      id: uuidv4(),
      askedBy: member.name,
      role: member.role,
      question: questionText,
      category,
      difficulty,
      suggestedResponse: responseHint,
      relatedChapter,
      relatedConcepts: this.extractConcepts(questionText)
    };
  }

  private findMemberForQuestion(roleAffinity: CommitteeRole[]): CommitteeMember | undefined {
    // Try to find a committee member with matching role
    for (const role of roleAffinity) {
      const member = this.committee.find(m => m.role === role);
      if (member) return member;
    }

    // Fall back to any committee member
    return this.committee[Math.floor(Math.random() * this.committee.length)];
  }

  private extractConcepts(text: string): string[] {
    const concepts: string[] = [];
    const keywords = [
      'methodology', 'theory', 'framework', 'validity', 'reliability',
      'findings', 'results', 'implications', 'limitations', 'contribution',
      'sample', 'data', 'analysis', 'literature', 'gap'
    ];

    const textLower = text.toLowerCase();
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        concepts.push(keyword);
      }
    }

    return concepts;
  }

  private deduplicateQuestions(questions: CommitteeQuestion[]): CommitteeQuestion[] {
    const seen = new Set<string>();
    return questions.filter(q => {
      const key = q.question.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private generateMemberFeedback(
    member: CommitteeMember,
    chapters: Map<number, string>
  ): MemberFeedback {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];

    // Role-specific feedback generation
    switch (member.role) {
      case 'methodologist':
        if (chapters.has(3)) {
          const ch3 = chapters.get(3)!;
          if (ch3.length > 5000) strengths.push('Thorough methodology section');
          if (!/validity/i.test(ch3)) concerns.push('Validity discussion could be strengthened');
          suggestions.push('Consider adding a table summarizing your methodological choices');
        }
        break;

      case 'theorist':
        if (chapters.has(2)) {
          const ch2 = chapters.get(2)!;
          if (/framework/i.test(ch2)) strengths.push('Clear theoretical framework presented');
          suggestions.push('Strengthen the connection between theory and findings');
        }
        break;

      case 'advisor':
        strengths.push('Student has shown growth throughout the process');
        if (chapters.size >= 5) strengths.push('All chapters are complete');
        suggestions.push('Polish the writing for final submission');
        break;

      case 'chair':
        if (chapters.size >= 5) strengths.push('Dissertation is complete');
        suggestions.push('Ensure all formatting guidelines are met');
        break;

      case 'external':
        strengths.push('Research addresses an important topic');
        concerns.push('Consider how findings apply beyond immediate context');
        suggestions.push('Strengthen the implications section');
        break;

      case 'reader':
        strengths.push('Writing is generally clear');
        suggestions.push('Check for consistency in terminology throughout');
        break;
    }

    return {
      member: member.name,
      role: member.role,
      strengths,
      concerns,
      suggestions
    };
  }

  private findCommonThemes(feedback: MemberFeedback[]): string[] {
    const allConcerns = feedback.flatMap(f => f.concerns);
    const allSuggestions = feedback.flatMap(f => f.suggestions);

    // Simple frequency analysis
    const themeCount = new Map<string, number>();
    for (const item of [...allConcerns, ...allSuggestions]) {
      const normalized = item.toLowerCase();
      for (const theme of ['methodology', 'theory', 'writing', 'validity', 'implications']) {
        if (normalized.includes(theme)) {
          themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
        }
      }
    }

    return Array.from(themeCount.entries())
      .filter(([, count]) => count >= 2)
      .map(([theme]) => theme);
  }

  private identifyCriticalIssues(feedback: MemberFeedback[]): string[] {
    const critical: string[] = [];

    for (const f of feedback) {
      // Concerns from methodologist or external are often critical
      if (f.role === 'methodologist' || f.role === 'external') {
        critical.push(...f.concerns);
      }
    }

    return Array.from(new Set(critical));
  }

  private determineOverallAssessment(feedback: MemberFeedback[]): ReviewAssessment {
    const totalConcerns = feedback.reduce((sum, f) => sum + f.concerns.length, 0);
    const totalStrengths = feedback.reduce((sum, f) => sum + f.strengths.length, 0);

    if (totalConcerns === 0 && totalStrengths >= feedback.length) {
      return 'approve';
    } else if (totalConcerns <= 3) {
      return 'minor_revisions';
    } else if (totalConcerns <= 6) {
      return 'major_revisions';
    } else {
      return 'revise_and_resubmit';
    }
  }

  private prioritizeRevisions(
    feedback: MemberFeedback[],
    criticalIssues: string[]
  ): string[] {
    const priorities: string[] = [];

    // Critical issues first
    priorities.push(...criticalIssues.map(i => `[CRITICAL] ${i}`));

    // Then suggestions from advisor/chair
    for (const f of feedback) {
      if (f.role === 'advisor' || f.role === 'chair') {
        priorities.push(...f.suggestions.map(s => `[RECOMMENDED] ${s}`));
      }
    }

    // Then other suggestions
    for (const f of feedback) {
      if (f.role !== 'advisor' && f.role !== 'chair') {
        priorities.push(...f.suggestions.map(s => `[SUGGESTED] ${s}`));
      }
    }

    return priorities;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default CommitteeSimulator;
