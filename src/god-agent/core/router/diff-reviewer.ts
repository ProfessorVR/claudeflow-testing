/**
 * Diff Reviewer
 *
 * Implements TIER-2.1: Intelligent Model Router - Phase 5.3
 *
 * Provides Claude-powered review of code diffs with:
 * - Structured review format
 * - Configurable review criteria
 * - Multi-pass review support
 * - Issue severity classification
 */

import type { CompletionOptions, LLMResponse, ProviderType } from './router-types.js';

// ===== TYPES =====

/**
 * Severity levels for issues found during review
 */
export type IssueSeverity = 'critical' | 'major' | 'minor' | 'suggestion';

/**
 * Categories of issues that can be found
 */
export type IssueCategory =
  | 'security'
  | 'correctness'
  | 'performance'
  | 'style'
  | 'maintainability'
  | 'documentation'
  | 'testing'
  | 'other';

/**
 * Individual issue found during review
 */
export interface ReviewIssue {
  /** Unique identifier */
  id: string;
  /** Issue severity */
  severity: IssueSeverity;
  /** Issue category */
  category: IssueCategory;
  /** Issue description */
  description: string;
  /** Line number or range where issue was found */
  location?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Result of a diff review
 */
export interface DiffReviewResult {
  /** Whether the diff is approved */
  approved: boolean;
  /** Overall review feedback */
  feedback: string;
  /** Confidence in the review (0-1) */
  confidence: number;
  /** Issues found during review */
  issues: ReviewIssue[];
  /** General suggestions for improvement */
  suggestions: string[];
  /** What's good about the code */
  strengths: string[];
  /** Time taken for review in ms */
  reviewTimeMs: number;
  /** Which pass this is (for multi-pass review) */
  passNumber: number;
}

/**
 * Context for the review
 */
export interface ReviewContext {
  /** Original request/prompt */
  originalPrompt?: string;
  /** Programming language */
  language?: string;
  /** Project context */
  projectContext?: string;
  /** Specific areas to focus on */
  focusAreas?: IssueCategory[];
  /** Severity threshold for rejection */
  rejectThreshold?: IssueSeverity;
}

/**
 * Review options
 */
export interface DiffReviewOptions {
  /** Context for the review */
  context?: ReviewContext;
  /** Number of review passes */
  passes?: number;
  /** Whether to auto-approve if no issues found */
  autoApprove?: boolean;
  /** Minimum confidence to approve */
  minConfidence?: number;
  /** Completion options for the LLM */
  completionOptions?: CompletionOptions;
}

/**
 * Provider interface for diff reviewer
 */
export interface DiffReviewProvider {
  /** Generate completion */
  complete(prompt: string, options?: CompletionOptions): Promise<LLMResponse>;
  /** Provider type */
  readonly provider: ProviderType;
  /** Model identifier */
  readonly model: string;
}

/**
 * Configuration for DiffReviewer
 */
export interface DiffReviewerConfig {
  /** LLM provider for reviews */
  provider?: DiffReviewProvider;
  /** Default review options */
  defaultOptions?: Partial<DiffReviewOptions>;
}

// ===== DIFF REVIEWER =====

/**
 * Internal type for resolved options
 */
type ResolvedReviewOptions = {
  context: ReviewContext;
  passes: number;
  autoApprove: boolean;
  minConfidence: number;
  completionOptions: CompletionOptions | undefined;
};

/**
 * Reviews code diffs using Claude
 */
export class DiffReviewer {
  private readonly config: Required<DiffReviewerConfig>;
  private readonly defaultOptions: ResolvedReviewOptions;

  constructor(config: DiffReviewerConfig = {}) {
    this.config = {
      provider: config.provider ?? (null as unknown as DiffReviewProvider),
      defaultOptions: config.defaultOptions ?? {},
    };

    this.defaultOptions = {
      context: {},
      passes: 1,
      autoApprove: true,
      minConfidence: 0.7,
      completionOptions: undefined,
      ...this.config.defaultOptions,
    };
  }

  /**
   * Review a diff
   */
  async review(
    original: string,
    modified: string,
    options: DiffReviewOptions = {}
  ): Promise<DiffReviewResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    if (!this.config.provider) {
      return this.createAutoApproveResult(startTime);
    }

    // Generate diff
    const diff = this.generateDiff(original, modified);

    // Perform reviews
    let lastResult: DiffReviewResult | null = null;
    for (let pass = 1; pass <= (opts.passes ?? 1); pass++) {
      lastResult = await this.performReviewPass(diff, opts, pass, startTime, lastResult);

      // If rejected on earlier pass, no need to continue
      if (!lastResult.approved) {
        break;
      }
    }

    return lastResult ?? this.createAutoApproveResult(startTime);
  }

  /**
   * Review pre-generated diff
   */
  async reviewDiff(diff: string, options: DiffReviewOptions = {}): Promise<DiffReviewResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    if (!this.config.provider) {
      return this.createAutoApproveResult(startTime);
    }

    let lastResult: DiffReviewResult | null = null;
    for (let pass = 1; pass <= (opts.passes ?? 1); pass++) {
      lastResult = await this.performReviewPass(diff, opts, pass, startTime, lastResult);
      if (!lastResult.approved) break;
    }

    return lastResult ?? this.createAutoApproveResult(startTime);
  }

  /**
   * Perform a single review pass
   */
  private async performReviewPass(
    diff: string,
    opts: ResolvedReviewOptions,
    pass: number,
    startTime: number,
    previousResult: DiffReviewResult | null
  ): Promise<DiffReviewResult> {
    const prompt = this.buildReviewPrompt(diff, opts.context ?? {}, pass, previousResult);

    try {
      const response = await this.config.provider.complete(prompt, opts.completionOptions);
      return this.parseReviewResponse(response.content, pass, startTime, opts);
    } catch (error) {
      // On error, auto-approve with low confidence
      return {
        approved: opts.autoApprove ?? true,
        feedback: `Review failed: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0.3,
        issues: [],
        suggestions: [],
        strengths: [],
        reviewTimeMs: Date.now() - startTime,
        passNumber: pass,
      };
    }
  }

  /**
   * Build the review prompt
   */
  private buildReviewPrompt(
    diff: string,
    context: ReviewContext,
    pass: number,
    previousResult: DiffReviewResult | null
  ): string {
    const parts: string[] = [
      'You are a senior code reviewer. Review the following diff carefully.',
      '',
    ];

    if (context.originalPrompt) {
      parts.push(`## Original Request\n${context.originalPrompt}\n`);
    }

    if (context.language) {
      parts.push(`## Language\n${context.language}\n`);
    }

    if (context.projectContext) {
      parts.push(`## Project Context\n${context.projectContext}\n`);
    }

    if (context.focusAreas && context.focusAreas.length > 0) {
      parts.push(`## Focus Areas\nPay special attention to: ${context.focusAreas.join(', ')}\n`);
    }

    parts.push(`## Diff to Review\n\`\`\`diff\n${diff}\n\`\`\`\n`);

    if (pass > 1 && previousResult) {
      parts.push(`## Previous Review (Pass ${pass - 1})`);
      parts.push(`Approved: ${previousResult.approved}`);
      parts.push(`Feedback: ${previousResult.feedback}`);
      if (previousResult.issues.length > 0) {
        parts.push(`Issues found: ${previousResult.issues.map(i => i.description).join('; ')}`);
      }
      parts.push('');
      parts.push('Please provide a deeper review, looking for issues that may have been missed.');
      parts.push('');
    }

    parts.push(`## Response Format
Respond in this exact format:

APPROVED: [yes/no]
CONFIDENCE: [0.0-1.0]
FEEDBACK: [overall assessment in 1-2 sentences]

STRENGTHS:
- [good thing 1]
- [good thing 2]
(or "none" if no notable strengths)

ISSUES:
- [SEVERITY:CATEGORY] description | location | suggestion
(format each issue as above, or "none" if no issues)
(SEVERITY: critical/major/minor/suggestion)
(CATEGORY: security/correctness/performance/style/maintainability/documentation/testing/other)

SUGGESTIONS:
- [general improvement 1]
- [general improvement 2]
(or "none" if no suggestions)`);

    return parts.join('\n');
  }

  /**
   * Parse the review response
   */
  private parseReviewResponse(
    response: string,
    pass: number,
    startTime: number,
    opts: ResolvedReviewOptions
  ): DiffReviewResult {
    const approvedMatch = response.match(/APPROVED:\s*(yes|no)/i);
    const confidenceMatch = response.match(/CONFIDENCE:\s*([\d.]+)/);
    const feedbackMatch = response.match(/FEEDBACK:\s*(.+?)(?=\n\n|\nSTRENGTHS|\nISSUES|$)/s);

    const approved = approvedMatch?.[1]?.toLowerCase() === 'yes';
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    const feedback = feedbackMatch?.[1]?.trim() ?? 'No feedback provided';

    // Parse strengths
    const strengthsSection = response.match(/STRENGTHS:\s*\n([\s\S]*?)(?=\n\nISSUES|\nISSUES|$)/);
    const strengths = this.parseListSection(strengthsSection?.[1]);

    // Parse issues
    const issuesSection = response.match(/ISSUES:\s*\n([\s\S]*?)(?=\n\nSUGGESTIONS|\nSUGGESTIONS|$)/);
    const issues = this.parseIssuesSection(issuesSection?.[1]);

    // Parse suggestions
    const suggestionsSection = response.match(/SUGGESTIONS:\s*\n([\s\S]*?)$/);
    const suggestions = this.parseListSection(suggestionsSection?.[1]);

    // Determine if approved based on issues and confidence
    const hasBlockingIssue = issues.some(
      (i) => i.severity === 'critical' || i.severity === 'major'
    );
    const meetsConfidence = confidence >= (opts.minConfidence ?? 0.7);
    const finalApproved = approved && !hasBlockingIssue && meetsConfidence;

    return {
      approved: finalApproved,
      feedback,
      confidence,
      issues,
      suggestions,
      strengths,
      reviewTimeMs: Date.now() - startTime,
      passNumber: pass,
    };
  }

  /**
   * Parse a list section (strengths or suggestions)
   */
  private parseListSection(section: string | undefined): string[] {
    if (!section) return [];
    const trimmed = section.trim();
    if (trimmed.toLowerCase() === 'none') return [];

    return trimmed
      .split('\n')
      .map((line) => line.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }

  /**
   * Parse issues section
   */
  private parseIssuesSection(section: string | undefined): ReviewIssue[] {
    if (!section) return [];
    const trimmed = section.trim();
    if (trimmed.toLowerCase() === 'none') return [];

    const issues: ReviewIssue[] = [];
    const lines = trimmed.split('\n').filter((line) => line.trim().startsWith('-'));

    for (const line of lines) {
      const content = line.replace(/^[-*]\s*/, '').trim();
      const issue = this.parseIssueLine(content, issues.length);
      if (issue) issues.push(issue);
    }

    return issues;
  }

  /**
   * Parse a single issue line
   */
  private parseIssueLine(line: string, index: number): ReviewIssue | null {
    // Format: [SEVERITY:CATEGORY] description | location | suggestion
    const match = line.match(/^\[([^:]+):([^\]]+)\]\s*(.+)/);

    if (match) {
      const [, severityStr, categoryStr, rest] = match;
      const parts = rest.split('|').map((p) => p.trim());

      return {
        id: `issue-${index + 1}`,
        severity: this.parseSeverity(severityStr),
        category: this.parseCategory(categoryStr),
        description: parts[0] ?? 'No description',
        location: parts[1] !== 'none' ? parts[1] : undefined,
        suggestion: parts[2] !== 'none' ? parts[2] : undefined,
      };
    }

    // Fallback: treat as minor/other
    return {
      id: `issue-${index + 1}`,
      severity: 'minor',
      category: 'other',
      description: line,
    };
  }

  /**
   * Parse severity string
   */
  private parseSeverity(str: string): IssueSeverity {
    const normalized = str.toLowerCase().trim();
    if (normalized === 'critical') return 'critical';
    if (normalized === 'major') return 'major';
    if (normalized === 'minor') return 'minor';
    return 'suggestion';
  }

  /**
   * Parse category string
   */
  private parseCategory(str: string): IssueCategory {
    const normalized = str.toLowerCase().trim();
    const validCategories: IssueCategory[] = [
      'security',
      'correctness',
      'performance',
      'style',
      'maintainability',
      'documentation',
      'testing',
    ];
    return (validCategories.includes(normalized as IssueCategory)
      ? normalized
      : 'other') as IssueCategory;
  }

  /**
   * Generate diff between original and modified
   */
  private generateDiff(original: string, modified: string): string {
    if (!original) return `+++ New content\n${modified}`;
    if (!modified) return `--- Removed content\n${original}`;

    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const diff: string[] = [];

    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i];
      const modLine = modifiedLines[i];

      if (origLine === modLine) {
        diff.push(`  ${origLine ?? ''}`);
      } else if (origLine === undefined) {
        diff.push(`+ ${modLine}`);
      } else if (modLine === undefined) {
        diff.push(`- ${origLine}`);
      } else {
        diff.push(`- ${origLine}`);
        diff.push(`+ ${modLine}`);
      }
    }

    return diff.join('\n');
  }

  /**
   * Create auto-approve result when no provider
   */
  private createAutoApproveResult(startTime: number): DiffReviewResult {
    return {
      approved: true,
      feedback: 'Auto-approved (no reviewer configured)',
      confidence: 0.5,
      issues: [],
      suggestions: [],
      strengths: [],
      reviewTimeMs: Date.now() - startTime,
      passNumber: 1,
    };
  }

  /**
   * Set provider
   */
  setProvider(provider: DiffReviewProvider): void {
    (this.config as { provider: DiffReviewProvider }).provider = provider;
  }

  /**
   * Check if provider is configured
   */
  hasProvider(): boolean {
    return !!this.config.provider;
  }
}

// ===== SINGLETON =====

let reviewerInstance: DiffReviewer | null = null;

/**
 * Get or create the singleton DiffReviewer instance
 */
export function getDiffReviewer(config?: DiffReviewerConfig): DiffReviewer {
  if (!reviewerInstance || config) {
    reviewerInstance = new DiffReviewer(config);
  }
  return reviewerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetDiffReviewer(): void {
  reviewerInstance = null;
}

/**
 * Initialize the reviewer with configuration
 */
export function initializeDiffReviewer(config: DiffReviewerConfig): DiffReviewer {
  reviewerInstance = new DiffReviewer(config);
  return reviewerInstance;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Quick review without creating instance
 */
export async function reviewDiff(
  original: string,
  modified: string,
  options?: DiffReviewOptions,
  config?: DiffReviewerConfig
): Promise<DiffReviewResult> {
  const reviewer = config ? new DiffReviewer(config) : getDiffReviewer();
  return reviewer.review(original, modified, options);
}

/**
 * Get human-readable review summary
 */
export function summarizeReview(result: DiffReviewResult): string {
  const status = result.approved ? '✓ Approved' : '✗ Rejected';
  const confidence = Math.round(result.confidence * 100);
  const issueCount = result.issues.length;

  let summary = `${status} (${confidence}% confidence)`;

  if (issueCount > 0) {
    const critical = result.issues.filter((i) => i.severity === 'critical').length;
    const major = result.issues.filter((i) => i.severity === 'major').length;
    const minor = result.issues.filter((i) => i.severity === 'minor').length;

    const parts: string[] = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (major > 0) parts.push(`${major} major`);
    if (minor > 0) parts.push(`${minor} minor`);

    summary += ` - ${parts.join(', ')} issues`;
  }

  return summary;
}

/**
 * Format issues for display
 */
export function formatIssues(issues: ReviewIssue[]): string {
  if (issues.length === 0) return 'No issues found';

  return issues
    .map((issue) => {
      let line = `[${issue.severity.toUpperCase()}/${issue.category}] ${issue.description}`;
      if (issue.location) line += ` (${issue.location})`;
      if (issue.suggestion) line += `\n  → ${issue.suggestion}`;
      return line;
    })
    .join('\n\n');
}

/**
 * Check if result has blocking issues
 */
export function hasBlockingIssues(result: DiffReviewResult): boolean {
  return result.issues.some(
    (i) => i.severity === 'critical' || i.severity === 'major'
  );
}

/**
 * Get issues by severity
 */
export function getIssuesBySeverity(
  result: DiffReviewResult,
  severity: IssueSeverity
): ReviewIssue[] {
  return result.issues.filter((i) => i.severity === severity);
}
