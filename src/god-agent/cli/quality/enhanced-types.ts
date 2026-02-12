/**
 * Enhanced Quality Types with Location Tracking
 *
 * All quality issues now include exact locations for easy fixing.
 * These types extend the base quality types to provide granular
 * location information including line numbers, character positions,
 * and excerpts.
 *
 * Part of Priority 2: Granular Quality Reporting with Location Tracking
 */

import type { QualityIssueType, QualityIssueSeverity, QualityStageResult } from './quality-stage.js';

// ============================================================================
// Enhanced Location Types
// ============================================================================

/**
 * Location information for precise issue identification.
 * Provides multiple reference points for navigating to issues.
 */
export interface IssueLocation {
  /** 0-indexed paragraph number within the document */
  paragraphIndex: number;

  /** 1-indexed line number where the issue starts */
  lineStart: number;

  /** 1-indexed line number where the issue ends */
  lineEnd: number;

  /** Character offset from document start (0-indexed) */
  charStart: number;

  /** Character offset end (exclusive, 0-indexed) */
  charEnd: number;

  /** 50-100 character context around the issue */
  excerpt: string;

  /** Section title if identifiable (e.g., from markdown headers) */
  sectionTitle?: string;

  /** Chapter ID if applicable (1-indexed) */
  chapterId?: number;
}

// ============================================================================
// Enhanced Quality Issue
// ============================================================================

/**
 * Enhanced quality issue with precise location tracking.
 * Extends base issue with detailed location data and fix guidance.
 */
export interface EnhancedQualityIssue {
  /** Unique issue ID (e.g., "citation-completeness_citation_0_lxyz123") */
  id: string;

  /** Which quality stage found this issue */
  stage: string;

  /** Issue severity level */
  severity: QualityIssueSeverity;

  /** Issue category matching QualityIssueType */
  category: QualityIssueType | string;

  /** Human-readable description of the issue */
  message: string;

  /** Precise location data (required for enhanced issues) */
  location: IssueLocation;

  /** How to fix the issue */
  suggestion: string;

  /** Whether this issue can be automatically fixed */
  autoFixable: boolean;

  /** Replacement text if auto-fixable */
  autoFixCode?: string;

  /** IDs of related issues (e.g., multiple instances of same problem) */
  relatedIssues?: string[];

  /** Relevant style guide or documentation references */
  references?: string[];

  /** Confidence score for the issue detection (0-1) */
  confidence?: number;
}

// ============================================================================
// Enhanced Stage Result
// ============================================================================

/**
 * Quality stage result with enhanced issues and metrics.
 */
export interface EnhancedQualityStageResult {
  /** Name of the quality stage */
  stageName: string;

  /** Whether the content passed this stage */
  passed: boolean;

  /** Quality score (0-1 scale) */
  score: number;

  /** Weight of this stage in overall scoring */
  weight: number;

  /** Pass threshold for this stage */
  threshold: number;

  /** All issues found by this stage */
  issues: EnhancedQualityIssue[];

  /** Stage-specific metrics */
  metrics: {
    /** Issues grouped by severity */
    issuesBySeverity: {
      critical: number;
      major: number;
      minor: number;
    };
    /** Count of issues that can be auto-fixed */
    autoFixableCount: number;
    /** Time taken for this stage in milliseconds */
    processingTimeMs: number;
    /** Additional stage-specific metrics */
    [key: string]: unknown;
  };
}

// ============================================================================
// Enhanced Quality Report
// ============================================================================

/**
 * Complete quality report with all enhanced information.
 */
export interface EnhancedQualityReport {
  /** Unique identifier for this report run */
  runId: string;

  /** ISO timestamp when the report was generated */
  timestamp: string;

  /** Whether the content passed overall quality checks */
  passed: boolean;

  /** Weighted overall quality score (0-1) */
  overallScore: number;

  /** Results from each quality stage */
  stageResults: EnhancedQualityStageResult[];

  /** All issues aggregated from all stages */
  allIssues: EnhancedQualityIssue[];

  /** Only critical issues for quick access */
  criticalIssues: EnhancedQualityIssue[];

  /** Summary statistics */
  summary: {
    totalIssues: number;
    criticalCount: number;
    majorCount: number;
    minorCount: number;
    autoFixableCount: number;
    stagesPassed: number;
    totalStages: number;
  };

  /** Whether revision is needed to meet quality standards */
  revisionRequired: boolean;

  /** Specific guidance for revision */
  revisionGuidance: string;

  /** Issue locations organized for quick navigation */
  issueLocations: IssueLocationIndex;
}

/**
 * Index for quick issue lookup by location.
 * Uses string keys for JSON serialization compatibility.
 */
export interface IssueLocationIndex {
  /** Issues indexed by line number (key is line number as string) */
  byLine: Record<string, EnhancedQualityIssue[]>;

  /** Issues indexed by paragraph number (key is paragraph index as string) */
  byParagraph: Record<string, EnhancedQualityIssue[]>;

  /** Issues indexed by section title */
  bySection: Record<string, EnhancedQualityIssue[]>;
}

// ============================================================================
// Paragraph Parsing Types
// ============================================================================

/**
 * Information about a parsed paragraph including its location.
 */
export interface ParagraphInfo {
  /** 0-indexed paragraph number */
  index: number;

  /** 1-indexed line number where the paragraph starts */
  lineStart: number;

  /** 1-indexed line number where the paragraph ends */
  lineEnd: number;

  /** Character offset from document start where paragraph begins */
  charStart: number;

  /** Character offset from document start where paragraph ends */
  charEnd: number;

  /** The paragraph content */
  content: string;

  /** Section title if this paragraph is under a header */
  sectionTitle?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse content into paragraphs with detailed location information.
 *
 * @param content - The full document content
 * @returns Array of paragraph info objects with location data
 *
 * @example
 * ```typescript
 * const content = "# Section 1\n\nFirst paragraph.\n\nSecond paragraph.";
 * const paragraphs = parseContentIntoParagraphs(content);
 * // Returns paragraphs with line numbers, char offsets, and section context
 * ```
 */
export function parseContentIntoParagraphs(content: string): ParagraphInfo[] {
  const paragraphs: ParagraphInfo[] = [];
  const lines = content.split('\n');

  let currentParagraph: string[] = [];
  let paragraphStartLine = 1;
  let charOffset = 0;
  let paragraphCharStart = 0;
  let currentSection: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect section headers (markdown-style)
    if (line.startsWith('## ') || line.startsWith('### ') || line.startsWith('# ')) {
      currentSection = line.replace(/^#+\s*/, '').trim();
    }

    // Empty line indicates paragraph break
    if (line.trim() === '') {
      if (currentParagraph.length > 0) {
        paragraphs.push({
          index: paragraphs.length,
          lineStart: paragraphStartLine,
          lineEnd: lineNum - 1,
          charStart: paragraphCharStart,
          charEnd: charOffset - 1,
          content: currentParagraph.join('\n'),
          sectionTitle: currentSection,
        });
        currentParagraph = [];
      }
      paragraphStartLine = lineNum + 1;
      paragraphCharStart = charOffset + line.length + 1;
    } else {
      if (currentParagraph.length === 0) {
        paragraphStartLine = lineNum;
        paragraphCharStart = charOffset;
      }
      currentParagraph.push(line);
    }

    charOffset += line.length + 1; // +1 for newline
  }

  // Handle last paragraph if content doesn't end with newline
  if (currentParagraph.length > 0) {
    paragraphs.push({
      index: paragraphs.length,
      lineStart: paragraphStartLine,
      lineEnd: lines.length,
      charStart: paragraphCharStart,
      charEnd: charOffset,
      content: currentParagraph.join('\n'),
      sectionTitle: currentSection,
    });
  }

  return paragraphs;
}

/**
 * Find location for a text match within the content.
 *
 * @param content - The full document content
 * @param matchText - The text to find
 * @param paragraphs - Pre-parsed paragraphs (for efficiency)
 * @param startFrom - Character offset to start searching from (default 0)
 * @returns Location information or null if not found
 *
 * @example
 * ```typescript
 * const content = "Line 1\n\nProblem text here.\n\nLine 3";
 * const paragraphs = parseContentIntoParagraphs(content);
 * const location = findLocationForMatch(content, "Problem text", paragraphs);
 * // Returns { lineStart: 3, charStart: 8, excerpt: "Problem text here.", ... }
 * ```
 */
export function findLocationForMatch(
  content: string,
  matchText: string,
  paragraphs: ParagraphInfo[],
  startFrom: number = 0
): IssueLocation | null {
  const matchIndex = content.indexOf(matchText, startFrom);
  if (matchIndex === -1) return null;

  // Find which line this is on
  const contentUpToMatch = content.substring(0, matchIndex);
  const lineNumber = (contentUpToMatch.match(/\n/g) || []).length + 1;

  // Count newlines in the match itself for lineEnd
  const matchNewlines = (matchText.match(/\n/g) || []).length;

  // Find which paragraph contains this match
  const paragraph = paragraphs.find(
    (p) => p.charStart <= matchIndex && matchIndex < p.charEnd
  );

  // Generate excerpt (surrounding context)
  const excerptStart = Math.max(0, matchIndex - 30);
  const excerptEnd = Math.min(content.length, matchIndex + matchText.length + 30);
  let excerpt = content.substring(excerptStart, excerptEnd);

  // Clean up excerpt: replace newlines with spaces and trim
  excerpt = excerpt.replace(/\n/g, ' ').trim();

  // Add ellipsis if we truncated
  if (excerptStart > 0) excerpt = '...' + excerpt;
  if (excerptEnd < content.length) excerpt = excerpt + '...';

  return {
    paragraphIndex: paragraph?.index ?? 0,
    lineStart: lineNumber,
    lineEnd: lineNumber + matchNewlines,
    charStart: matchIndex,
    charEnd: matchIndex + matchText.length,
    excerpt: excerpt,
    sectionTitle: paragraph?.sectionTitle,
  };
}

/**
 * Find all locations for a regex pattern match.
 *
 * @param content - The full document content
 * @param pattern - Regex pattern (should have global flag)
 * @param paragraphs - Pre-parsed paragraphs
 * @returns Array of locations for all matches
 */
export function findAllMatchLocations(
  content: string,
  pattern: RegExp,
  paragraphs: ParagraphInfo[]
): IssueLocation[] {
  const locations: IssueLocation[] = [];

  // Ensure global flag is set
  const globalPattern = pattern.global
    ? pattern
    : new RegExp(pattern.source, pattern.flags + 'g');

  let match: RegExpExecArray | null;
  while ((match = globalPattern.exec(content)) !== null) {
    const location = findLocationForMatch(content, match[0], paragraphs, match.index);
    if (location) {
      locations.push(location);
    }
  }

  return locations;
}

/**
 * Build an issue location index for quick navigation.
 *
 * @param issues - Array of enhanced quality issues
 * @returns Index organized by line, paragraph, and section
 */
export function buildIssueLocationIndex(
  issues: EnhancedQualityIssue[]
): IssueLocationIndex {
  const byLine: Record<string, EnhancedQualityIssue[]> = {};
  const byParagraph: Record<string, EnhancedQualityIssue[]> = {};
  const bySection: Record<string, EnhancedQualityIssue[]> = {};

  for (const issue of issues) {
    // Index by line
    const lineKey = String(issue.location.lineStart);
    if (!byLine[lineKey]) byLine[lineKey] = [];
    byLine[lineKey].push(issue);

    // Index by paragraph
    const paragraphKey = String(issue.location.paragraphIndex);
    if (!byParagraph[paragraphKey]) byParagraph[paragraphKey] = [];
    byParagraph[paragraphKey].push(issue);

    // Index by section
    if (issue.location.sectionTitle) {
      const sectionKey = issue.location.sectionTitle;
      if (!bySection[sectionKey]) bySection[sectionKey] = [];
      bySection[sectionKey].push(issue);
    }
  }

  return { byLine, byParagraph, bySection };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate a markdown report with navigable issue locations.
 *
 * @param issues - Array of enhanced quality issues
 * @param options - Report generation options
 * @returns Formatted markdown report string
 *
 * @example
 * ```typescript
 * const report = generateLocationReport(issues, { includeAutoFix: true });
 * console.log(report);
 * ```
 */
export function generateLocationReport(
  issues: EnhancedQualityIssue[],
  options: {
    includeAutoFix?: boolean;
    maxIssuesPerSeverity?: number;
    includeExcerpts?: boolean;
  } = {}
): string {
  const {
    includeAutoFix = true,
    maxIssuesPerSeverity = 20,
    includeExcerpts = true,
  } = options;

  if (issues.length === 0) {
    return '## Quality Report\n\nNo issues found.\n';
  }

  const lines: string[] = [
    '## Quality Issues Report',
    '',
    `**Total Issues**: ${issues.length}`,
    `- Critical: ${issues.filter((i) => i.severity === 'critical').length}`,
    `- Major: ${issues.filter((i) => i.severity === 'major').length}`,
    `- Minor: ${issues.filter((i) => i.severity === 'minor').length}`,
    '',
    '---',
    '',
  ];

  // Group by severity
  const bySeverity: Record<QualityIssueSeverity, EnhancedQualityIssue[]> = {
    critical: issues.filter((i) => i.severity === 'critical'),
    major: issues.filter((i) => i.severity === 'major'),
    minor: issues.filter((i) => i.severity === 'minor'),
  };

  for (const [severity, sevIssues] of Object.entries(bySeverity) as [
    QualityIssueSeverity,
    EnhancedQualityIssue[]
  ][]) {
    if (sevIssues.length === 0) continue;

    lines.push(`### ${severity.toUpperCase()} Issues`);
    lines.push('');

    const issuesToShow = sevIssues.slice(0, maxIssuesPerSeverity);

    for (const issue of issuesToShow) {
      lines.push(`#### ${issue.id}: ${issue.message}`);
      lines.push('');

      // Location info
      const lineRange =
        issue.location.lineEnd !== issue.location.lineStart
          ? `${issue.location.lineStart}-${issue.location.lineEnd}`
          : String(issue.location.lineStart);
      lines.push(`**Location**: Line ${lineRange}, Paragraph ${issue.location.paragraphIndex + 1}`);

      if (issue.location.sectionTitle) {
        lines.push(`**Section**: ${issue.location.sectionTitle}`);
      }

      lines.push(`**Category**: ${issue.category}`);
      lines.push(`**Stage**: ${issue.stage}`);
      lines.push('');

      // Excerpt
      if (includeExcerpts && issue.location.excerpt) {
        lines.push('**Context**:');
        lines.push('```');
        lines.push(issue.location.excerpt);
        lines.push('```');
        lines.push('');
      }

      // Suggestion
      lines.push(`**Suggestion**: ${issue.suggestion}`);

      // Auto-fix
      if (includeAutoFix && issue.autoFixable) {
        lines.push('');
        lines.push('**Auto-fix available**');
        if (issue.autoFixCode) {
          lines.push('```');
          lines.push(issue.autoFixCode);
          lines.push('```');
        }
      }

      // References
      if (issue.references && issue.references.length > 0) {
        lines.push('');
        lines.push('**References**:');
        for (const ref of issue.references) {
          lines.push(`- ${ref}`);
        }
      }

      lines.push('');
      lines.push('---');
      lines.push('');
    }

    if (sevIssues.length > maxIssuesPerSeverity) {
      lines.push(
        `*... and ${sevIssues.length - maxIssuesPerSeverity} more ${severity} issues*`
      );
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate a compact summary of issues by location.
 *
 * @param index - Issue location index
 * @returns Compact summary string
 */
export function generateLocationSummary(index: IssueLocationIndex): string {
  const lines: string[] = ['## Issues by Location', ''];

  // By section
  const sectionNames = Object.keys(index.bySection);
  if (sectionNames.length > 0) {
    lines.push('### By Section');
    for (const section of sectionNames) {
      const count = index.bySection[section].length;
      const criticalCount = index.bySection[section].filter(
        (i) => i.severity === 'critical'
      ).length;
      const label = criticalCount > 0 ? ` (${criticalCount} critical)` : '';
      lines.push(`- **${section}**: ${count} issues${label}`);
    }
    lines.push('');
  }

  // Top problematic lines
  const lineEntries = Object.entries(index.byLine)
    .map(([line, issues]) => ({ line: parseInt(line), count: issues.length, issues }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (lineEntries.length > 0) {
    lines.push('### Top Problematic Lines');
    for (const { line, count, issues } of lineEntries) {
      const severities = issues.map((i) => i.severity[0]).join('');
      lines.push(`- Line ${line}: ${count} issues [${severities}]`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert a standard QualityStageResult to an EnhancedQualityStageResult.
 * Attempts to extract or generate location information for each issue.
 *
 * @param result - Standard quality stage result
 * @param content - The original content (for location extraction)
 * @returns Enhanced stage result with location tracking
 */
export function enhanceStageResult(
  result: QualityStageResult,
  content: string
): EnhancedQualityStageResult {
  const paragraphs = parseContentIntoParagraphs(content);

  const enhancedIssues: EnhancedQualityIssue[] = result.issues.map((issue) => {
    // Try to find location from contextSnippet or generate from paragraph info
    let location: IssueLocation;

    if (issue.contextSnippet) {
      const found = findLocationForMatch(content, issue.contextSnippet, paragraphs);
      if (found) {
        location = found;
      } else {
        // Fallback: use paragraph info if available
        location = createLocationFromParagraph(
          issue.location.paragraphIndex ?? 0,
          paragraphs,
          issue.contextSnippet
        );
      }
    } else if (issue.location.paragraphIndex !== undefined) {
      location = createLocationFromParagraph(
        issue.location.paragraphIndex,
        paragraphs,
        undefined
      );
    } else {
      // Default location at document start
      location = {
        paragraphIndex: 0,
        lineStart: 1,
        lineEnd: 1,
        charStart: 0,
        charEnd: 0,
        excerpt: '',
      };
    }

    // Add chapter ID if present
    if (issue.location.chapterId) {
      location.chapterId = issue.location.chapterId;
    }

    return {
      id: issue.id,
      stage: result.stageName,
      severity: issue.severity,
      category: issue.type,
      message: issue.description,
      location,
      suggestion: issue.suggestion,
      autoFixable: issue.autoFixable,
      confidence: issue.confidence,
    };
  });

  const issuesBySeverity = {
    critical: enhancedIssues.filter((i) => i.severity === 'critical').length,
    major: enhancedIssues.filter((i) => i.severity === 'major').length,
    minor: enhancedIssues.filter((i) => i.severity === 'minor').length,
  };

  return {
    stageName: result.stageName,
    passed: result.passed,
    score: result.score,
    weight: 0.25, // Default weight; should be provided by stage
    threshold: 0.75, // Default threshold; should be provided by stage
    issues: enhancedIssues,
    metrics: {
      issuesBySeverity,
      autoFixableCount: enhancedIssues.filter((i) => i.autoFixable).length,
      processingTimeMs: result.evaluationTimeMs ?? 0,
      ...result.metrics,
    },
  };
}

/**
 * Create an IssueLocation from paragraph information.
 */
function createLocationFromParagraph(
  paragraphIndex: number,
  paragraphs: ParagraphInfo[],
  excerptText?: string
): IssueLocation {
  const paragraph = paragraphs[paragraphIndex];

  if (!paragraph) {
    return {
      paragraphIndex,
      lineStart: 1,
      lineEnd: 1,
      charStart: 0,
      charEnd: 0,
      excerpt: excerptText ?? '',
    };
  }

  // Generate excerpt from paragraph content if not provided
  const excerpt =
    excerptText ??
    paragraph.content.substring(0, 100).replace(/\n/g, ' ').trim() +
      (paragraph.content.length > 100 ? '...' : '');

  return {
    paragraphIndex,
    lineStart: paragraph.lineStart,
    lineEnd: paragraph.lineEnd,
    charStart: paragraph.charStart,
    charEnd: paragraph.charEnd,
    excerpt,
    sectionTitle: paragraph.sectionTitle,
  };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  QualityIssueType,
  QualityIssueSeverity,
} from './quality-stage.js';
