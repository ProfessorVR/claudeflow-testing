/**
 * Institutional Compliance Checker
 *
 * Validates dissertations against institution-specific requirements including:
 * - Citation style validation
 * - Formatting compliance
 * - Structure validation
 * - Word count limits
 * - Deadline tracking
 *
 * All operations work offline with configurable rule templates.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Supported degree types
 */
export type DegreeType = 'phd' | 'edd' | 'dba' | 'other';

/**
 * Supported citation styles
 */
export type CitationStyle = 'apa7' | 'chicago' | 'mla' | 'turabian' | 'custom';

/**
 * Page margin configuration (in inches)
 */
export interface MarginConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Page numbering position
 */
export type PageNumberPosition = 'top-right' | 'bottom-center' | 'bottom-right';

/**
 * Formatting requirements
 */
export interface FormattingRequirements {
  /** Required font (e.g., "Times New Roman") */
  font: string;
  /** Font size in points */
  fontSize: number;
  /** Line spacing (e.g., 2.0 for double-spaced) */
  lineSpacing: number;
  /** Page margins */
  margins: MarginConfig;
  /** Page number position */
  pageNumbering: PageNumberPosition;
  /** Additional formatting notes */
  notes?: string[];
}

/**
 * Structure requirements
 */
export interface StructureRequirements {
  /** Required sections (must be present) */
  requiredSections: string[];
  /** Optional sections */
  optionalSections: string[];
  /** Expected chapter order */
  chapterOrder: string[];
  /** Front matter order */
  frontMatterOrder: string[];
  /** Back matter order */
  backMatterOrder: string[];
}

/**
 * Word/page limits
 */
export interface LimitRequirements {
  /** Abstract word limit */
  abstractWordLimit: number;
  /** Total page limit (if any) */
  totalPageLimit?: number;
  /** Per-chapter limits */
  chapterLimits?: Record<string, { min?: number; max?: number }>;
}

/**
 * Complete institutional requirements
 */
export interface InstitutionalRequirements {
  /** Institution name */
  institution: string;
  /** Degree type */
  degree: DegreeType;
  /** Citation style */
  citationStyle: CitationStyle;
  /** Formatting requirements */
  formatting: FormattingRequirements;
  /** Structure requirements */
  structure: StructureRequirements;
  /** Word/page limits */
  limits: LimitRequirements;
  /** Signature requirements */
  signatureRequirements: string[];
  /** Key deadlines */
  deadlines: Record<string, Date>;
  /** Additional notes */
  notes?: string[];
}

/**
 * Compliance issue types
 */
export type IssueType = 'formatting' | 'structure' | 'citation' | 'limit' | 'deadline';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * A compliance issue
 */
export interface ComplianceIssue {
  /** Issue type */
  type: IssueType;
  /** Severity level */
  severity: IssueSeverity;
  /** Location of the issue */
  location: string;
  /** Description of the issue */
  description: string;
  /** Suggested fix */
  fix: string;
  /** Reference to requirement */
  requirementRef?: string;
}

/**
 * Checklist item status
 */
export type ChecklistStatus = 'pass' | 'fail' | 'warning' | 'not_checked';

/**
 * A checklist item
 */
export interface ChecklistItem {
  /** Requirement description */
  requirement: string;
  /** Status */
  status: ChecklistStatus;
  /** Additional notes */
  notes?: string;
  /** Category */
  category?: string;
}

/**
 * Complete compliance report
 */
export interface ComplianceReport {
  /** Whether all requirements passed */
  passed: boolean;
  /** Overall compliance score (0-100) */
  score: number;
  /** List of issues found */
  issues: ComplianceIssue[];
  /** Checklist with status */
  checklist: ChecklistItem[];
  /** Generation timestamp */
  generatedAt: Date;
  /** Institution checked against */
  institution: string;
}

/**
 * Upcoming deadline information
 */
export interface UpcomingDeadline {
  /** Deadline name */
  name: string;
  /** Deadline date */
  date: Date;
  /** Days remaining */
  daysRemaining: number;
  /** Whether overdue */
  isOverdue: boolean;
}

// ============================================================================
// Institution Templates
// ============================================================================

/**
 * Pre-defined institution templates
 */
export const INSTITUTION_TEMPLATES: Record<string, Partial<InstitutionalRequirements>> = {
  'generic-us-doctoral': {
    institution: 'Generic US Doctoral Institution',
    degree: 'phd',
    citationStyle: 'apa7',
    formatting: {
      font: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 2.0,
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      pageNumbering: 'bottom-center'
    },
    structure: {
      requiredSections: [
        'Title Page',
        'Abstract',
        'Table of Contents',
        'Introduction',
        'Literature Review',
        'Methodology',
        'Results',
        'Discussion',
        'References'
      ],
      optionalSections: [
        'Dedication',
        'Acknowledgments',
        'List of Tables',
        'List of Figures',
        'Appendices'
      ],
      chapterOrder: ['Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion'],
      frontMatterOrder: ['Title Page', 'Copyright Page', 'Abstract', 'Dedication', 'Acknowledgments', 'Table of Contents', 'List of Tables', 'List of Figures'],
      backMatterOrder: ['References', 'Appendices']
    },
    limits: {
      abstractWordLimit: 350,
      chapterLimits: {
        'Abstract': { max: 350 },
        'Introduction': { min: 2000, max: 10000 },
        'Literature Review': { min: 8000, max: 25000 },
        'Methodology': { min: 3000, max: 15000 },
        'Results': { min: 3000, max: 20000 },
        'Discussion': { min: 3000, max: 15000 }
      }
    },
    signatureRequirements: [
      'Student signature',
      'Advisor signature',
      'Committee member signatures',
      'Department chair approval',
      'Graduate school approval'
    ]
  },

  'apa-dissertation': {
    institution: 'APA Style Dissertation',
    degree: 'phd',
    citationStyle: 'apa7',
    formatting: {
      font: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 2.0,
      margins: { top: 1, bottom: 1, left: 1, right: 1 },
      pageNumbering: 'top-right',
      notes: [
        'Use 1-inch margins on all sides',
        'Double-space throughout',
        'Use running head on each page',
        'Page numbers in header, flush right'
      ]
    },
    structure: {
      requiredSections: [
        'Title Page',
        'Abstract',
        'Table of Contents',
        'Chapter 1: Introduction',
        'Chapter 2: Literature Review',
        'Chapter 3: Method',
        'Chapter 4: Results',
        'Chapter 5: Discussion',
        'References'
      ],
      optionalSections: [
        'List of Tables',
        'List of Figures',
        'Appendices'
      ],
      chapterOrder: ['Introduction', 'Literature Review', 'Method', 'Results', 'Discussion'],
      frontMatterOrder: ['Title Page', 'Abstract', 'Table of Contents', 'List of Tables', 'List of Figures'],
      backMatterOrder: ['References', 'Appendices']
    },
    limits: {
      abstractWordLimit: 250,
      chapterLimits: {
        'Abstract': { max: 250 }
      }
    },
    signatureRequirements: [
      'Student signature',
      'Committee signatures'
    ]
  },

  'chicago-dissertation': {
    institution: 'Chicago Style Dissertation',
    degree: 'phd',
    citationStyle: 'chicago',
    formatting: {
      font: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 2.0,
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      pageNumbering: 'bottom-center',
      notes: [
        'Use footnotes for citations (Notes-Bibliography style)',
        'Or use author-date citations (Author-Date style)',
        'Block quotes should be single-spaced and indented'
      ]
    },
    structure: {
      requiredSections: [
        'Title Page',
        'Abstract',
        'Table of Contents',
        'Introduction',
        'Body Chapters',
        'Conclusion',
        'Bibliography'
      ],
      optionalSections: [
        'Preface',
        'Acknowledgments',
        'List of Abbreviations',
        'Appendices'
      ],
      chapterOrder: ['Introduction', 'Body Chapters', 'Conclusion'],
      frontMatterOrder: ['Title Page', 'Abstract', 'Preface', 'Acknowledgments', 'Table of Contents'],
      backMatterOrder: ['Bibliography', 'Appendices']
    },
    limits: {
      abstractWordLimit: 350
    },
    signatureRequirements: [
      'Student signature',
      'Advisor signature',
      'Reader signatures'
    ]
  },

  'turabian-dissertation': {
    institution: 'Turabian Style Dissertation',
    degree: 'phd',
    citationStyle: 'turabian',
    formatting: {
      font: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 2.0,
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      pageNumbering: 'bottom-center',
      notes: [
        'Based on Chicago Manual of Style',
        'Adapted for academic papers and theses',
        'Use either footnotes or author-date citations'
      ]
    },
    structure: {
      requiredSections: [
        'Title Page',
        'Abstract',
        'Table of Contents',
        'Introduction',
        'Chapters',
        'Conclusion',
        'Bibliography'
      ],
      optionalSections: [
        'Acknowledgments',
        'List of Tables',
        'List of Figures',
        'Appendices'
      ],
      chapterOrder: ['Introduction', 'Chapters', 'Conclusion'],
      frontMatterOrder: ['Title Page', 'Abstract', 'Acknowledgments', 'Table of Contents'],
      backMatterOrder: ['Bibliography', 'Appendices']
    },
    limits: {
      abstractWordLimit: 350
    },
    signatureRequirements: [
      'Student signature',
      'Committee signatures'
    ]
  }
};

// ============================================================================
// Citation Patterns
// ============================================================================

/**
 * Citation patterns for validation
 */
const CITATION_PATTERNS: Record<CitationStyle, RegExp[]> = {
  'apa7': [
    // In-text: (Author, Year) or Author (Year)
    /\([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)*,\s*\d{4}[a-z]?\)/,
    /[A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)*\s*\(\d{4}[a-z]?\)/,
    // References: Author, A. A. (Year).
    /^[A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.\s*\(\d{4}\)\./m
  ],
  'chicago': [
    // Footnotes: 1. Author, Title
    /^\d+\.\s+[A-Z][a-z]+,\s+/m,
    // Author-date: (Author Year)
    /\([A-Z][a-z]+\s+\d{4}\)/
  ],
  'mla': [
    // In-text: (Author Page)
    /\([A-Z][a-z]+\s+\d+\)/,
    // Works Cited entry
    /^[A-Z][a-z]+,\s+[A-Z][a-z]+\./m
  ],
  'turabian': [
    // Same as Chicago (Turabian is based on Chicago)
    /^\d+\.\s+[A-Z][a-z]+,\s+/m,
    /\([A-Z][a-z]+\s+\d{4}\)/
  ],
  'custom': []
};

// ============================================================================
// Compliance Checker Class
// ============================================================================

/**
 * Validates dissertations against institutional requirements
 */
export class InstitutionalComplianceChecker {
  private requirements: InstitutionalRequirements;

  /**
   * Create a new compliance checker
   * @param requirements - Institutional requirements to check against
   */
  constructor(requirements: InstitutionalRequirements) {
    this.requirements = requirements;
  }

  /**
   * Load predefined institution requirements
   * @param name - Institution template name
   */
  static loadInstitution(name: string): InstitutionalRequirements {
    const template = INSTITUTION_TEMPLATES[name];
    if (!template) {
      throw new Error(`Unknown institution template: ${name}. Available: ${Object.keys(INSTITUTION_TEMPLATES).join(', ')}`);
    }

    // Merge with defaults
    return {
      institution: template.institution || name,
      degree: template.degree || 'phd',
      citationStyle: template.citationStyle || 'apa7',
      formatting: template.formatting || {
        font: 'Times New Roman',
        fontSize: 12,
        lineSpacing: 2.0,
        margins: { top: 1, bottom: 1, left: 1, right: 1 },
        pageNumbering: 'bottom-center'
      },
      structure: template.structure || {
        requiredSections: [],
        optionalSections: [],
        chapterOrder: [],
        frontMatterOrder: [],
        backMatterOrder: []
      },
      limits: template.limits || {
        abstractWordLimit: 350
      },
      signatureRequirements: template.signatureRequirements || [],
      deadlines: template.deadlines || {}
    } as InstitutionalRequirements;
  }

  /**
   * List available institution templates
   */
  static listAvailableInstitutions(): string[] {
    return Object.keys(INSTITUTION_TEMPLATES);
  }

  /**
   * Validate a complete dissertation
   * @param chapters - Map of chapter numbers to content
   * @param frontMatter - Map of front matter section names to content
   * @param backMatter - Map of back matter section names to content
   */
  validateDissertation(
    chapters: Map<number, string>,
    frontMatter: Map<string, string>,
    backMatter: Map<string, string>
  ): ComplianceReport {
    const issues: ComplianceIssue[] = [];
    const checklist: ChecklistItem[] = [];

    // Combine all text for formatting validation
    const allText = [
      ...Array.from(frontMatter.values()),
      ...Array.from(chapters.values()),
      ...Array.from(backMatter.values())
    ].join('\n\n');

    // Run validations
    issues.push(...this.validateFormatting(allText));
    issues.push(...this.validateStructure([
      ...Array.from(frontMatter.keys()),
      ...Array.from(chapters.keys()).map(n => `Chapter ${n}`),
      ...Array.from(backMatter.keys())
    ]));
    issues.push(...this.validateCitations(allText));
    issues.push(...this.validateWordCounts(chapters));

    // Build checklist
    checklist.push(...this.buildChecklist(issues, frontMatter, backMatter));

    // Calculate score
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 3));

    return {
      passed: errorCount === 0,
      score,
      issues,
      checklist,
      generatedAt: new Date(),
      institution: this.requirements.institution
    };
  }

  /**
   * Validate formatting requirements
   * @param text - Full dissertation text
   */
  validateFormatting(text: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const req = this.requirements.formatting;

    // Check for common formatting issues

    // Check for consistent paragraph spacing
    const doubleNewlines = (text.match(/\n\n/g) || []).length;
    const tripleNewlines = (text.match(/\n\n\n/g) || []).length;

    if (tripleNewlines > doubleNewlines * 0.2) {
      issues.push({
        type: 'formatting',
        severity: 'warning',
        location: 'Document-wide',
        description: 'Inconsistent paragraph spacing detected',
        fix: 'Use consistent double-spacing between paragraphs',
        requirementRef: 'Line spacing requirements'
      });
    }

    // Check for potential font issues (can only detect limited issues in plain text)
    // This is a proxy check - real font validation would need document format parsing

    // Check line length (proxy for margin compliance)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const longLines = lines.filter(l => l.length > 100).length;

    if (longLines > lines.length * 0.1) {
      issues.push({
        type: 'formatting',
        severity: 'info',
        location: 'Document-wide',
        description: 'Some lines appear longer than typical for standard margins',
        fix: `Ensure margins are set to: top ${req.margins.top}", bottom ${req.margins.bottom}", left ${req.margins.left}", right ${req.margins.right}"`,
        requirementRef: 'Margin requirements'
      });
    }

    // Check for proper heading structure
    const headingPatterns = [
      /^#{1,6}\s+/gm,  // Markdown headings
      /^[A-Z][A-Z\s]+$/gm,  // ALL CAPS headings
      /^Chapter\s+\d+/gim  // Chapter headings
    ];

    let hasHeadings = false;
    for (const pattern of headingPatterns) {
      if (pattern.test(text)) {
        hasHeadings = true;
        break;
      }
    }

    if (!hasHeadings) {
      issues.push({
        type: 'formatting',
        severity: 'warning',
        location: 'Document structure',
        description: 'No clear heading structure detected',
        fix: 'Ensure chapters and sections have proper headings'
      });
    }

    return issues;
  }

  /**
   * Validate document structure
   * @param sections - List of section names present
   */
  validateStructure(sections: string[]): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const req = this.requirements.structure;

    const normalizedSections = sections.map(s => s.toLowerCase().trim());

    // Check for required sections
    for (const required of req.requiredSections) {
      const normalizedRequired = required.toLowerCase();
      const found = normalizedSections.some(s =>
        s.includes(normalizedRequired) || normalizedRequired.includes(s)
      );

      if (!found) {
        issues.push({
          type: 'structure',
          severity: 'error',
          location: 'Document structure',
          description: `Missing required section: ${required}`,
          fix: `Add the required "${required}" section`,
          requirementRef: 'Required sections'
        });
      }
    }

    // Check chapter order
    const chapterSections = sections.filter(s => /chapter/i.test(s));
    if (chapterSections.length > 0 && req.chapterOrder.length > 0) {
      // Basic order check
      let lastIndex = -1;
      for (const chapter of chapterSections) {
        const expectedIndex = req.chapterOrder.findIndex(c =>
          chapter.toLowerCase().includes(c.toLowerCase())
        );

        if (expectedIndex !== -1 && expectedIndex < lastIndex) {
          issues.push({
            type: 'structure',
            severity: 'warning',
            location: chapter,
            description: 'Chapter appears to be out of expected order',
            fix: `Expected order: ${req.chapterOrder.join(' -> ')}`,
            requirementRef: 'Chapter order'
          });
        }

        if (expectedIndex !== -1) {
          lastIndex = expectedIndex;
        }
      }
    }

    return issues;
  }

  /**
   * Validate citation format
   * @param text - Text to validate
   */
  validateCitations(text: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const style = this.requirements.citationStyle;
    const patterns = CITATION_PATTERNS[style];

    if (!patterns || patterns.length === 0) {
      return issues;
    }

    // Check for presence of any citations
    let hasCitations = false;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        hasCitations = true;
        break;
      }
    }

    if (!hasCitations) {
      issues.push({
        type: 'citation',
        severity: 'error',
        location: 'Document-wide',
        description: `No ${style.toUpperCase()} format citations detected`,
        fix: `Use proper ${style.toUpperCase()} citation format`,
        requirementRef: `Citation style: ${style}`
      });
    }

    // Check for common citation errors
    const wrongStylePatterns: Array<{ pattern: RegExp; wrongStyle: string }> = [
      { pattern: /\[\d+\]/, wrongStyle: 'numeric (IEEE-style)' },
      { pattern: /\(\d{4},\s*p\.\s*\d+\)/, wrongStyle: 'mixed format' }
    ];

    for (const { pattern, wrongStyle } of wrongStylePatterns) {
      if (pattern.test(text) && style !== 'custom') {
        issues.push({
          type: 'citation',
          severity: 'warning',
          location: 'Document-wide',
          description: `Detected potential ${wrongStyle} citations mixed with ${style.toUpperCase()}`,
          fix: `Ensure consistent use of ${style.toUpperCase()} citation format`,
          requirementRef: `Citation style: ${style}`
        });
      }
    }

    // Check for "et al." usage
    if (style === 'apa7') {
      const etAlPattern = /[A-Z][a-z]+\s+et\s+al\./;
      const properEtAl = /[A-Z][a-z]+\s+et\s+al\.\s*\(\d{4}\)/;

      const etAlMatches = text.match(etAlPattern);
      const properEtAlMatches = text.match(properEtAl);

      if (etAlMatches && (!properEtAlMatches || etAlMatches.length > (properEtAlMatches?.length || 0) * 2)) {
        issues.push({
          type: 'citation',
          severity: 'info',
          location: 'In-text citations',
          description: 'Check "et al." usage follows APA 7 rules (3+ authors)',
          fix: 'Use "et al." starting from the first citation for works with 3+ authors',
          requirementRef: 'APA 7 et al. rules'
        });
      }
    }

    return issues;
  }

  /**
   * Validate word counts against limits
   * @param chapters - Map of chapter numbers to content
   */
  validateWordCounts(chapters: Map<number, string>): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const limits = this.requirements.limits;

    for (const [chapterNum, content] of Array.from(chapters.entries())) {
      const wordCount = this.countWords(content);

      // Check abstract (usually in front matter, but might be chapter-like)
      if (chapterNum === 0 || content.toLowerCase().includes('abstract')) {
        if (wordCount > limits.abstractWordLimit) {
          issues.push({
            type: 'limit',
            severity: 'error',
            location: `Abstract`,
            description: `Abstract exceeds word limit: ${wordCount} / ${limits.abstractWordLimit} words`,
            fix: `Reduce abstract to ${limits.abstractWordLimit} words or fewer`,
            requirementRef: 'Abstract word limit'
          });
        }
      }

      // Check chapter-specific limits
      if (limits.chapterLimits) {
        for (const [chapterName, limit] of Object.entries(limits.chapterLimits)) {
          // Try to match chapter by number or name
          const chapterContent = content.toLowerCase();
          const chapterNameLower = chapterName.toLowerCase();

          if (chapterContent.includes(chapterNameLower) ||
              chapterName.includes(String(chapterNum))) {

            if (limit.min && wordCount < limit.min) {
              issues.push({
                type: 'limit',
                severity: 'warning',
                location: `Chapter ${chapterNum}: ${chapterName}`,
                description: `Chapter may be too short: ${wordCount} words (minimum: ${limit.min})`,
                fix: `Consider expanding this chapter to at least ${limit.min} words`,
                requirementRef: `Chapter limits: ${chapterName}`
              });
            }

            if (limit.max && wordCount > limit.max) {
              issues.push({
                type: 'limit',
                severity: 'warning',
                location: `Chapter ${chapterNum}: ${chapterName}`,
                description: `Chapter may be too long: ${wordCount} words (maximum: ${limit.max})`,
                fix: `Consider reducing this chapter to ${limit.max} words or fewer`,
                requirementRef: `Chapter limits: ${chapterName}`
              });
            }
          }
        }
      }
    }

    // Check total page limit if specified
    if (limits.totalPageLimit) {
      const totalWords = Array.from(chapters.values())
        .reduce((sum, content) => sum + this.countWords(content), 0);
      const estimatedPages = Math.ceil(totalWords / 250); // ~250 words per page

      if (estimatedPages > limits.totalPageLimit) {
        issues.push({
          type: 'limit',
          severity: 'warning',
          location: 'Document-wide',
          description: `Estimated page count (${estimatedPages}) exceeds limit (${limits.totalPageLimit})`,
          fix: `Consider reducing content to meet the ${limits.totalPageLimit} page limit`,
          requirementRef: 'Total page limit'
        });
      }
    }

    return issues;
  }

  /**
   * Get upcoming deadlines
   */
  getUpcomingDeadlines(): UpcomingDeadline[] {
    const now = new Date();
    const deadlines: UpcomingDeadline[] = [];

    for (const [name, date] of Object.entries(this.requirements.deadlines)) {
      const deadlineDate = new Date(date);
      const msRemaining = deadlineDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

      deadlines.push({
        name,
        date: deadlineDate,
        daysRemaining,
        isOverdue: daysRemaining < 0
      });
    }

    // Sort by date
    deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

    return deadlines;
  }

  /**
   * Generate a submission checklist
   */
  generateSubmissionChecklist(): string {
    const lines: string[] = [];
    const req = this.requirements;

    lines.push('# Dissertation Submission Checklist');
    lines.push('');
    lines.push(`**Institution**: ${req.institution}`);
    lines.push(`**Degree**: ${req.degree.toUpperCase()}`);
    lines.push(`**Citation Style**: ${req.citationStyle.toUpperCase()}`);
    lines.push('');

    // Formatting checklist
    lines.push('## Formatting');
    lines.push('');
    lines.push(`- [ ] Font: ${req.formatting.font}, ${req.formatting.fontSize}pt`);
    lines.push(`- [ ] Line spacing: ${req.formatting.lineSpacing}`);
    lines.push(`- [ ] Margins: Top ${req.formatting.margins.top}", Bottom ${req.formatting.margins.bottom}", Left ${req.formatting.margins.left}", Right ${req.formatting.margins.right}"`);
    lines.push(`- [ ] Page numbers: ${req.formatting.pageNumbering}`);

    if (req.formatting.notes) {
      for (const note of req.formatting.notes) {
        lines.push(`- [ ] ${note}`);
      }
    }
    lines.push('');

    // Structure checklist
    lines.push('## Required Sections');
    lines.push('');

    for (const section of req.structure.requiredSections) {
      lines.push(`- [ ] ${section}`);
    }
    lines.push('');

    // Optional sections
    if (req.structure.optionalSections.length > 0) {
      lines.push('## Optional Sections');
      lines.push('');
      for (const section of req.structure.optionalSections) {
        lines.push(`- [ ] ${section} (if applicable)`);
      }
      lines.push('');
    }

    // Citation checklist
    lines.push('## Citations and References');
    lines.push('');
    lines.push(`- [ ] All citations in ${req.citationStyle.toUpperCase()} format`);
    lines.push('- [ ] All references properly formatted');
    lines.push('- [ ] Every citation has a matching reference');
    lines.push('- [ ] Every reference is cited in the text');
    lines.push('');

    // Word limits
    lines.push('## Word/Page Limits');
    lines.push('');
    lines.push(`- [ ] Abstract: ${req.limits.abstractWordLimit} words or fewer`);

    if (req.limits.totalPageLimit) {
      lines.push(`- [ ] Total pages: ${req.limits.totalPageLimit} or fewer`);
    }

    if (req.limits.chapterLimits) {
      for (const [chapter, limit] of Object.entries(req.limits.chapterLimits)) {
        const limitStr = limit.min && limit.max
          ? `${limit.min}-${limit.max} words`
          : limit.min
            ? `at least ${limit.min} words`
            : `${limit.max} words or fewer`;
        lines.push(`- [ ] ${chapter}: ${limitStr}`);
      }
    }
    lines.push('');

    // Signatures
    if (req.signatureRequirements.length > 0) {
      lines.push('## Signatures and Approvals');
      lines.push('');
      for (const sig of req.signatureRequirements) {
        lines.push(`- [ ] ${sig}`);
      }
      lines.push('');
    }

    // Deadlines
    const deadlines = this.getUpcomingDeadlines();
    if (deadlines.length > 0) {
      lines.push('## Deadlines');
      lines.push('');
      for (const deadline of deadlines) {
        const status = deadline.isOverdue
          ? `OVERDUE by ${Math.abs(deadline.daysRemaining)} days`
          : `${deadline.daysRemaining} days remaining`;
        lines.push(`- [ ] ${deadline.name}: ${deadline.date.toLocaleDateString()} (${status})`);
      }
      lines.push('');
    }

    // Final checks
    lines.push('## Final Checks');
    lines.push('');
    lines.push('- [ ] Spell check completed');
    lines.push('- [ ] Grammar check completed');
    lines.push('- [ ] All figures/tables numbered and captioned');
    lines.push('- [ ] Table of contents accurate');
    lines.push('- [ ] Page numbers correct');
    lines.push('- [ ] PDF/document properly formatted');
    lines.push('- [ ] Committee approval obtained');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Export compliance report as formatted text
   * @param report - Compliance report to export
   */
  exportComplianceReport(report: ComplianceReport): string {
    const lines: string[] = [];

    lines.push('# Dissertation Compliance Report');
    lines.push('');
    lines.push(`**Institution**: ${report.institution}`);
    lines.push(`**Generated**: ${report.generatedAt.toLocaleDateString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`**Status**: ${report.passed ? 'PASSED' : 'NEEDS ATTENTION'}`);
    lines.push(`**Compliance Score**: ${report.score}/100`);
    lines.push('');

    const errorCount = report.issues.filter(i => i.severity === 'error').length;
    const warningCount = report.issues.filter(i => i.severity === 'warning').length;
    const infoCount = report.issues.filter(i => i.severity === 'info').length;

    lines.push(`- Errors: ${errorCount}`);
    lines.push(`- Warnings: ${warningCount}`);
    lines.push(`- Info: ${infoCount}`);
    lines.push('');

    // Issues by severity
    if (errorCount > 0) {
      lines.push('## Errors (Must Fix)');
      lines.push('');
      for (const issue of report.issues.filter(i => i.severity === 'error')) {
        lines.push(`### ${issue.location}`);
        lines.push(`**Issue**: ${issue.description}`);
        lines.push(`**Fix**: ${issue.fix}`);
        if (issue.requirementRef) {
          lines.push(`*Reference: ${issue.requirementRef}*`);
        }
        lines.push('');
      }
    }

    if (warningCount > 0) {
      lines.push('## Warnings (Should Fix)');
      lines.push('');
      for (const issue of report.issues.filter(i => i.severity === 'warning')) {
        lines.push(`### ${issue.location}`);
        lines.push(`**Issue**: ${issue.description}`);
        lines.push(`**Fix**: ${issue.fix}`);
        if (issue.requirementRef) {
          lines.push(`*Reference: ${issue.requirementRef}*`);
        }
        lines.push('');
      }
    }

    if (infoCount > 0) {
      lines.push('## Information');
      lines.push('');
      for (const issue of report.issues.filter(i => i.severity === 'info')) {
        lines.push(`- **${issue.location}**: ${issue.description}`);
      }
      lines.push('');
    }

    // Checklist
    lines.push('## Checklist');
    lines.push('');

    for (const item of report.checklist) {
      const icon = item.status === 'pass' ? '[x]' :
        item.status === 'fail' ? '[ ]' :
        item.status === 'warning' ? '[!]' : '[?]';

      lines.push(`${icon} ${item.requirement}`);
      if (item.notes) {
        lines.push(`    *${item.notes}*`);
      }
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get the current requirements
   */
  getRequirements(): InstitutionalRequirements {
    return { ...this.requirements };
  }

  /**
   * Update requirements
   * @param updates - Partial updates to apply
   */
  updateRequirements(updates: Partial<InstitutionalRequirements>): void {
    this.requirements = {
      ...this.requirements,
      ...updates,
      formatting: {
        ...this.requirements.formatting,
        ...updates.formatting
      },
      structure: {
        ...this.requirements.structure,
        ...updates.structure
      },
      limits: {
        ...this.requirements.limits,
        ...updates.limits
      }
    } as InstitutionalRequirements;
  }

  /**
   * Add a deadline
   * @param name - Deadline name
   * @param date - Deadline date
   */
  addDeadline(name: string, date: Date): void {
    this.requirements.deadlines[name] = date;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private buildChecklist(
    issues: ComplianceIssue[],
    frontMatter: Map<string, string>,
    backMatter: Map<string, string>
  ): ChecklistItem[] {
    const checklist: ChecklistItem[] = [];
    const req = this.requirements;

    // Formatting checks
    const formattingIssues = issues.filter(i => i.type === 'formatting');
    checklist.push({
      requirement: `Font: ${req.formatting.font}, ${req.formatting.fontSize}pt`,
      status: formattingIssues.length === 0 ? 'pass' : 'warning',
      category: 'formatting'
    });

    checklist.push({
      requirement: `Line spacing: ${req.formatting.lineSpacing}`,
      status: 'not_checked',
      notes: 'Verify in document editor',
      category: 'formatting'
    });

    checklist.push({
      requirement: `Margins: ${req.formatting.margins.top}/${req.formatting.margins.bottom}/${req.formatting.margins.left}/${req.formatting.margins.right}`,
      status: 'not_checked',
      notes: 'Verify in document editor',
      category: 'formatting'
    });

    // Structure checks
    for (const section of req.structure.requiredSections) {
      const found = issues.every(i =>
        !(i.type === 'structure' && i.description.includes(section))
      );

      checklist.push({
        requirement: `Section present: ${section}`,
        status: found ? 'pass' : 'fail',
        category: 'structure'
      });
    }

    // Citation checks
    const citationIssues = issues.filter(i => i.type === 'citation');
    checklist.push({
      requirement: `Citations in ${req.citationStyle.toUpperCase()} format`,
      status: citationIssues.filter(i => i.severity === 'error').length === 0 ? 'pass' : 'fail',
      notes: citationIssues.length > 0 ? `${citationIssues.length} issues found` : undefined,
      category: 'citation'
    });

    // Word limit checks
    const limitIssues = issues.filter(i => i.type === 'limit');
    checklist.push({
      requirement: `Abstract within ${req.limits.abstractWordLimit} words`,
      status: limitIssues.some(i => i.location.toLowerCase().includes('abstract')) ? 'fail' : 'pass',
      category: 'limits'
    });

    // Signature requirements
    for (const sig of req.signatureRequirements) {
      checklist.push({
        requirement: sig,
        status: 'not_checked',
        notes: 'Verify signatures collected',
        category: 'signatures'
      });
    }

    return checklist;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a compliance checker for a known institution
 * @param institutionName - Institution template name
 */
export function createComplianceChecker(institutionName: string): InstitutionalComplianceChecker {
  const requirements = InstitutionalComplianceChecker.loadInstitution(institutionName);
  return new InstitutionalComplianceChecker(requirements);
}

/**
 * Create a compliance checker with custom requirements
 * @param requirements - Custom requirements
 */
export function createCustomComplianceChecker(
  requirements: InstitutionalRequirements
): InstitutionalComplianceChecker {
  return new InstitutionalComplianceChecker(requirements);
}

// ============================================================================
// Exports
// ============================================================================

export default InstitutionalComplianceChecker;
