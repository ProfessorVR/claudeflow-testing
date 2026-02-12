/**
 * Location Tracker Helper
 *
 * Provides location tracking utilities for quality stages to create
 * enhanced quality issues with precise location information.
 *
 * Part of Priority 2: Granular Quality Reporting with Location Tracking
 */

import {
  type IssueLocation,
  type ParagraphInfo,
  type EnhancedQualityIssue,
  parseContentIntoParagraphs,
  findLocationForMatch,
  findAllMatchLocations,
} from '../enhanced-types.js';
import type { QualityIssue, QualityIssueSeverity, QualityIssueType } from '../quality-stage.js';

// ============================================================================
// Location Tracker Class
// ============================================================================

/**
 * Helper class for tracking locations within a document.
 * Pre-parses content for efficient repeated lookups.
 */
export class LocationTracker {
  private content: string;
  private paragraphs: ParagraphInfo[];
  private lines: string[];
  private lineOffsets: number[];

  /**
   * Create a new LocationTracker for the given content.
   *
   * @param content - The full document content to track
   */
  constructor(content: string) {
    this.content = content;
    this.paragraphs = parseContentIntoParagraphs(content);
    this.lines = content.split('\n');

    // Pre-compute line offsets for fast line number lookups
    this.lineOffsets = [];
    let offset = 0;
    for (const line of this.lines) {
      this.lineOffsets.push(offset);
      offset += line.length + 1; // +1 for newline
    }
  }

  /**
   * Get the parsed paragraphs.
   */
  getParagraphs(): ParagraphInfo[] {
    return this.paragraphs;
  }

  /**
   * Get paragraph by index.
   */
  getParagraph(index: number): ParagraphInfo | undefined {
    return this.paragraphs[index];
  }

  /**
   * Get the line number (1-indexed) for a character offset.
   */
  getLineNumber(charOffset: number): number {
    for (let i = this.lineOffsets.length - 1; i >= 0; i--) {
      if (charOffset >= this.lineOffsets[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Get the character offset for a line number (1-indexed).
   */
  getLineOffset(lineNumber: number): number {
    const index = lineNumber - 1;
    if (index < 0) return 0;
    if (index >= this.lineOffsets.length) return this.content.length;
    return this.lineOffsets[index];
  }

  /**
   * Find the location of a text match.
   */
  findMatch(text: string, startFrom: number = 0): IssueLocation | null {
    return findLocationForMatch(this.content, text, this.paragraphs, startFrom);
  }

  /**
   * Find all locations matching a regex pattern.
   */
  findAllMatches(pattern: RegExp): IssueLocation[] {
    return findAllMatchLocations(this.content, pattern, this.paragraphs);
  }

  /**
   * Create an IssueLocation for a paragraph.
   */
  createParagraphLocation(paragraphIndex: number, excerpt?: string): IssueLocation {
    const paragraph = this.paragraphs[paragraphIndex];

    if (!paragraph) {
      return {
        paragraphIndex,
        lineStart: 1,
        lineEnd: 1,
        charStart: 0,
        charEnd: 0,
        excerpt: excerpt ?? '',
      };
    }

    return {
      paragraphIndex,
      lineStart: paragraph.lineStart,
      lineEnd: paragraph.lineEnd,
      charStart: paragraph.charStart,
      charEnd: paragraph.charEnd,
      excerpt: excerpt ?? this.generateExcerpt(paragraph.charStart, 100),
      sectionTitle: paragraph.sectionTitle,
    };
  }

  /**
   * Create an IssueLocation for a character range.
   */
  createRangeLocation(charStart: number, charEnd: number): IssueLocation {
    const lineStart = this.getLineNumber(charStart);
    const lineEnd = this.getLineNumber(charEnd);

    // Find which paragraph
    const paragraph = this.paragraphs.find(
      (p) => p.charStart <= charStart && charStart < p.charEnd
    );

    return {
      paragraphIndex: paragraph?.index ?? 0,
      lineStart,
      lineEnd,
      charStart,
      charEnd,
      excerpt: this.generateExcerpt(charStart, charEnd - charStart),
      sectionTitle: paragraph?.sectionTitle,
    };
  }

  /**
   * Create an IssueLocation for a line range.
   */
  createLineLocation(lineStart: number, lineEnd?: number): IssueLocation {
    const actualLineEnd = lineEnd ?? lineStart;
    const charStart = this.getLineOffset(lineStart);
    const charEnd =
      actualLineEnd < this.lines.length
        ? this.getLineOffset(actualLineEnd + 1) - 1
        : this.content.length;

    // Find which paragraph
    const paragraph = this.paragraphs.find(
      (p) => p.lineStart <= lineStart && lineStart <= p.lineEnd
    );

    return {
      paragraphIndex: paragraph?.index ?? 0,
      lineStart,
      lineEnd: actualLineEnd,
      charStart,
      charEnd,
      excerpt: this.generateExcerpt(charStart, Math.min(100, charEnd - charStart)),
      sectionTitle: paragraph?.sectionTitle,
    };
  }

  /**
   * Generate an excerpt around a position.
   */
  generateExcerpt(position: number, length: number = 100): string {
    const halfWindow = Math.floor(length / 2);
    const start = Math.max(0, position - halfWindow);
    const end = Math.min(this.content.length, position + halfWindow);

    let excerpt = this.content.substring(start, end).replace(/\n/g, ' ').trim();

    if (start > 0) excerpt = '...' + excerpt;
    if (end < this.content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Upgrade a basic QualityIssue to an EnhancedQualityIssue.
   */
  upgradeIssue(
    issue: QualityIssue,
    stageName: string,
    options?: {
      autoFixCode?: string;
      references?: string[];
      relatedIssues?: string[];
    }
  ): EnhancedQualityIssue {
    let location: IssueLocation;

    // Try to find location from context snippet
    if (issue.contextSnippet) {
      const found = this.findMatch(issue.contextSnippet);
      if (found) {
        location = found;
      } else {
        // Fall back to paragraph location
        location = this.createParagraphLocation(
          issue.location.paragraphIndex ?? 0,
          issue.contextSnippet
        );
      }
    } else if (issue.location.paragraphIndex !== undefined) {
      location = this.createParagraphLocation(issue.location.paragraphIndex);
    } else if (issue.location.startOffset !== undefined) {
      location = this.createRangeLocation(
        issue.location.startOffset,
        issue.location.endOffset ?? issue.location.startOffset + 1
      );
    } else {
      // Default to document start
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
      stage: stageName,
      severity: issue.severity,
      category: issue.type,
      message: issue.description,
      location,
      suggestion: issue.suggestion,
      autoFixable: issue.autoFixable,
      autoFixCode: options?.autoFixCode,
      references: options?.references,
      relatedIssues: options?.relatedIssues,
      confidence: issue.confidence,
    };
  }
}

// ============================================================================
// Issue Builder
// ============================================================================

/**
 * Fluent builder for creating EnhancedQualityIssue objects.
 */
export class IssueBuilder {
  private issue: Partial<EnhancedQualityIssue> = {};
  private tracker: LocationTracker;
  private idCounter: number;
  private stageName: string;

  constructor(tracker: LocationTracker, stageName: string, startId: number = 0) {
    this.tracker = tracker;
    this.stageName = stageName;
    this.idCounter = startId;
  }

  /**
   * Start a new issue with an auto-generated ID.
   */
  create(category: QualityIssueType | string): this {
    this.issue = {
      id: `${this.stageName}_${category}_${this.idCounter++}_${Date.now().toString(36)}`,
      stage: this.stageName,
      category,
      autoFixable: false,
    };
    return this;
  }

  /**
   * Set the severity level.
   */
  severity(level: QualityIssueSeverity): this {
    this.issue.severity = level;
    return this;
  }

  /**
   * Set the message (description).
   */
  message(text: string): this {
    this.issue.message = text;
    return this;
  }

  /**
   * Set the suggestion.
   */
  suggestion(text: string): this {
    this.issue.suggestion = text;
    return this;
  }

  /**
   * Set location by finding text match.
   */
  atMatch(text: string): this {
    const location = this.tracker.findMatch(text);
    if (location) {
      this.issue.location = location;
    }
    return this;
  }

  /**
   * Set location by paragraph index.
   */
  atParagraph(index: number, excerpt?: string): this {
    this.issue.location = this.tracker.createParagraphLocation(index, excerpt);
    return this;
  }

  /**
   * Set location by line number.
   */
  atLine(lineStart: number, lineEnd?: number): this {
    this.issue.location = this.tracker.createLineLocation(lineStart, lineEnd);
    return this;
  }

  /**
   * Set location by character range.
   */
  atRange(charStart: number, charEnd: number): this {
    this.issue.location = this.tracker.createRangeLocation(charStart, charEnd);
    return this;
  }

  /**
   * Set explicit location.
   */
  at(location: IssueLocation): this {
    this.issue.location = location;
    return this;
  }

  /**
   * Mark as auto-fixable with optional fix code.
   */
  autoFix(code?: string): this {
    this.issue.autoFixable = true;
    if (code) {
      this.issue.autoFixCode = code;
    }
    return this;
  }

  /**
   * Add references.
   */
  references(...refs: string[]): this {
    this.issue.references = refs;
    return this;
  }

  /**
   * Add related issue IDs.
   */
  relatedTo(...issueIds: string[]): this {
    this.issue.relatedIssues = issueIds;
    return this;
  }

  /**
   * Set confidence score.
   */
  confidence(score: number): this {
    this.issue.confidence = score;
    return this;
  }

  /**
   * Build the EnhancedQualityIssue.
   */
  build(): EnhancedQualityIssue {
    // Validate required fields
    if (!this.issue.id) {
      throw new Error('Issue ID is required');
    }
    if (!this.issue.severity) {
      throw new Error('Issue severity is required');
    }
    if (!this.issue.message) {
      throw new Error('Issue message is required');
    }
    if (!this.issue.location) {
      throw new Error('Issue location is required');
    }

    return {
      id: this.issue.id,
      stage: this.issue.stage ?? this.stageName,
      severity: this.issue.severity,
      category: this.issue.category ?? 'argument',
      message: this.issue.message,
      location: this.issue.location,
      suggestion: this.issue.suggestion ?? '',
      autoFixable: this.issue.autoFixable ?? false,
      autoFixCode: this.issue.autoFixCode,
      references: this.issue.references,
      relatedIssues: this.issue.relatedIssues,
      confidence: this.issue.confidence,
    };
  }

  /**
   * Get the current ID counter value.
   */
  getIdCounter(): number {
    return this.idCounter;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a LocationTracker for the given content.
 */
export function createLocationTracker(content: string): LocationTracker {
  return new LocationTracker(content);
}

/**
 * Create an IssueBuilder for the given tracker and stage.
 */
export function createIssueBuilder(
  tracker: LocationTracker,
  stageName: string,
  startId: number = 0
): IssueBuilder {
  return new IssueBuilder(tracker, stageName, startId);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Upgrade multiple QualityIssues to EnhancedQualityIssues.
 */
export function upgradeIssues(
  issues: QualityIssue[],
  content: string,
  stageName: string
): EnhancedQualityIssue[] {
  const tracker = new LocationTracker(content);
  return issues.map((issue) => tracker.upgradeIssue(issue, stageName));
}

/**
 * Find the section title for a position in the content.
 */
export function findSectionAtPosition(
  content: string,
  position: number
): string | undefined {
  const tracker = new LocationTracker(content);
  const paragraphs = tracker.getParagraphs();

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const paragraph = paragraphs[i];
    if (paragraph.charStart <= position && paragraph.sectionTitle) {
      return paragraph.sectionTitle;
    }
  }

  return undefined;
}
