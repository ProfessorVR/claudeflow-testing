/**
 * Tests for Enhanced Quality Types with Location Tracking
 *
 * Priority 2: Granular Quality Reporting with Location Tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseContentIntoParagraphs,
  findLocationForMatch,
  findAllMatchLocations,
  buildIssueLocationIndex,
  generateLocationReport,
  generateLocationSummary,
  enhanceStageResult,
  type ParagraphInfo,
  type IssueLocation,
  type EnhancedQualityIssue,
  type IssueLocationIndex,
} from '../../../../src/god-agent/cli/quality/enhanced-types.js';
import {
  LocationTracker,
  IssueBuilder,
  createLocationTracker,
  createIssueBuilder,
  upgradeIssues,
} from '../../../../src/god-agent/cli/quality/helpers/location-tracker.js';
import type { QualityIssue, QualityStageResult } from '../../../../src/god-agent/cli/quality/quality-stage.js';

describe('Enhanced Types - Paragraph Parsing', () => {
  const sampleContent = `# Introduction

This is the first paragraph with some content.

## Method

This is the method section paragraph.
It spans multiple lines.

### Subsection

Another paragraph here.

Final paragraph.`;

  it('should parse content into paragraphs with correct line numbers', () => {
    const paragraphs = parseContentIntoParagraphs(sampleContent);

    expect(paragraphs.length).toBeGreaterThan(0);
    expect(paragraphs[0].lineStart).toBe(1);
    expect(paragraphs[0].sectionTitle).toBe('Introduction');
  });

  it('should track section titles from headers', () => {
    const paragraphs = parseContentIntoParagraphs(sampleContent);

    // Find paragraph under "Method" section
    const methodParagraph = paragraphs.find((p) =>
      p.content.includes('method section')
    );

    expect(methodParagraph).toBeDefined();
    expect(methodParagraph?.sectionTitle).toBe('Method');
  });

  it('should calculate correct character offsets', () => {
    const content = 'Line 1\n\nParagraph 2\n\nParagraph 3';
    const paragraphs = parseContentIntoParagraphs(content);

    expect(paragraphs.length).toBe(3);

    // Verify first paragraph
    expect(paragraphs[0].charStart).toBe(0);
    expect(paragraphs[0].content).toBe('Line 1');

    // Verify character positions match actual content
    for (const para of paragraphs) {
      const extracted = content.substring(para.charStart, para.charEnd);
      expect(extracted.trim()).toBe(para.content.trim());
    }
  });

  it('should handle multi-line paragraphs', () => {
    const content = 'First line\nSecond line\nThird line\n\nNew paragraph';
    const paragraphs = parseContentIntoParagraphs(content);

    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].lineStart).toBe(1);
    expect(paragraphs[0].lineEnd).toBe(3);
    expect(paragraphs[0].content).toContain('Second line');
  });
});

describe('Enhanced Types - Location Finding', () => {
  const content = `# Section One

This paragraph contains a specific phrase to find.

## Section Two

Another paragraph with different content.
It has multiple lines.

Third paragraph for testing.`;

  let paragraphs: ParagraphInfo[];

  beforeEach(() => {
    paragraphs = parseContentIntoParagraphs(content);
  });

  it('should find location of text match', () => {
    const location = findLocationForMatch(
      content,
      'specific phrase',
      paragraphs
    );

    expect(location).not.toBeNull();
    expect(location?.lineStart).toBeGreaterThan(0);
    expect(location?.excerpt).toContain('specific phrase');
    expect(location?.sectionTitle).toBe('Section One');
  });

  it('should return null for non-existent text', () => {
    const location = findLocationForMatch(
      content,
      'nonexistent text here',
      paragraphs
    );

    expect(location).toBeNull();
  });

  it('should find all matches for a pattern', () => {
    const contentWithDupes = 'Error here. Another error. Final error.';
    const paras = parseContentIntoParagraphs(contentWithDupes);
    const locations = findAllMatchLocations(contentWithDupes, /error/gi, paras);

    expect(locations.length).toBe(3);
  });

  it('should generate correct excerpt with ellipsis', () => {
    const location = findLocationForMatch(
      content,
      'different content',
      paragraphs
    );

    expect(location).not.toBeNull();
    expect(location?.excerpt).toContain('...');
    expect(location?.excerpt.length).toBeLessThanOrEqual(120);
  });
});

describe('Enhanced Types - Issue Location Index', () => {
  const mockIssues: EnhancedQualityIssue[] = [
    {
      id: 'issue-1',
      stage: 'test-stage',
      severity: 'critical',
      category: 'citation',
      message: 'Missing citation',
      location: {
        paragraphIndex: 0,
        lineStart: 5,
        lineEnd: 5,
        charStart: 100,
        charEnd: 150,
        excerpt: 'Test excerpt 1',
        sectionTitle: 'Introduction',
      },
      suggestion: 'Add citation',
      autoFixable: false,
    },
    {
      id: 'issue-2',
      stage: 'test-stage',
      severity: 'major',
      category: 'argument',
      message: 'Weak argument',
      location: {
        paragraphIndex: 0,
        lineStart: 5,
        lineEnd: 6,
        charStart: 100,
        charEnd: 200,
        excerpt: 'Test excerpt 2',
        sectionTitle: 'Introduction',
      },
      suggestion: 'Strengthen argument',
      autoFixable: true,
    },
    {
      id: 'issue-3',
      stage: 'test-stage',
      severity: 'minor',
      category: 'style',
      message: 'Style issue',
      location: {
        paragraphIndex: 2,
        lineStart: 15,
        lineEnd: 15,
        charStart: 500,
        charEnd: 550,
        excerpt: 'Test excerpt 3',
        sectionTitle: 'Method',
      },
      suggestion: 'Fix style',
      autoFixable: true,
      autoFixCode: 'fixed text',
    },
  ];

  it('should build index by line number', () => {
    const index = buildIssueLocationIndex(mockIssues);

    expect(index.byLine['5']).toHaveLength(2);
    expect(index.byLine['15']).toHaveLength(1);
  });

  it('should build index by paragraph', () => {
    const index = buildIssueLocationIndex(mockIssues);

    expect(index.byParagraph['0']).toHaveLength(2);
    expect(index.byParagraph['2']).toHaveLength(1);
  });

  it('should build index by section', () => {
    const index = buildIssueLocationIndex(mockIssues);

    expect(index.bySection['Introduction']).toHaveLength(2);
    expect(index.bySection['Method']).toHaveLength(1);
  });
});

describe('Enhanced Types - Report Generation', () => {
  const mockIssues: EnhancedQualityIssue[] = [
    {
      id: 'crit-1',
      stage: 'citation-stage',
      severity: 'critical',
      category: 'citation',
      message: 'Critical citation problem',
      location: {
        paragraphIndex: 0,
        lineStart: 10,
        lineEnd: 10,
        charStart: 200,
        charEnd: 250,
        excerpt: 'problematic text here',
        sectionTitle: 'Results',
      },
      suggestion: 'Add proper citation',
      autoFixable: false,
    },
    {
      id: 'major-1',
      stage: 'argument-stage',
      severity: 'major',
      category: 'argument',
      message: 'Unsupported claim',
      location: {
        paragraphIndex: 1,
        lineStart: 15,
        lineEnd: 16,
        charStart: 300,
        charEnd: 400,
        excerpt: 'claim without evidence',
      },
      suggestion: 'Add supporting evidence',
      autoFixable: true,
      autoFixCode: 'evidence-based claim',
    },
  ];

  it('should generate markdown report with issue counts', () => {
    const report = generateLocationReport(mockIssues);

    expect(report).toContain('## Quality Issues Report');
    expect(report).toContain('**Total Issues**: 2');
    expect(report).toContain('Critical: 1');
    expect(report).toContain('Major: 1');
  });

  it('should include location information', () => {
    const report = generateLocationReport(mockIssues);

    expect(report).toContain('Line 10');
    expect(report).toContain('Paragraph 1');
    expect(report).toContain('**Section**: Results');
  });

  it('should include excerpts', () => {
    const report = generateLocationReport(mockIssues, { includeExcerpts: true });

    expect(report).toContain('problematic text here');
    expect(report).toContain('**Context**:');
  });

  it('should include auto-fix information when available', () => {
    const report = generateLocationReport(mockIssues, { includeAutoFix: true });

    expect(report).toContain('**Auto-fix available**');
    expect(report).toContain('evidence-based claim');
  });

  it('should generate location summary', () => {
    const index = buildIssueLocationIndex(mockIssues);
    const summary = generateLocationSummary(index);

    expect(summary).toContain('## Issues by Location');
    expect(summary).toContain('By Section');
    expect(summary).toContain('Results');
  });
});

describe('LocationTracker', () => {
  const content = `# Test Document

First paragraph content here.

## Second Section

Another paragraph with more content.
This one spans two lines.

Final paragraph.`;

  let tracker: LocationTracker;

  beforeEach(() => {
    tracker = createLocationTracker(content);
  });

  it('should parse paragraphs on initialization', () => {
    const paragraphs = tracker.getParagraphs();
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('should find text matches', () => {
    const location = tracker.findMatch('Another paragraph');
    expect(location).not.toBeNull();
    expect(location?.sectionTitle).toBe('Second Section');
  });

  it('should create paragraph locations', () => {
    const location = tracker.createParagraphLocation(0);
    expect(location.lineStart).toBeGreaterThan(0);
    expect(location.paragraphIndex).toBe(0);
  });

  it('should generate excerpts', () => {
    const excerpt = tracker.generateExcerpt(50, 40);
    expect(excerpt.length).toBeLessThanOrEqual(50);
  });

  it('should get line numbers for offsets', () => {
    const line = tracker.getLineNumber(0);
    expect(line).toBe(1);
  });
});

describe('IssueBuilder', () => {
  const content = 'Test content for issue building.';
  let tracker: LocationTracker;
  let builder: IssueBuilder;

  beforeEach(() => {
    tracker = createLocationTracker(content);
    builder = createIssueBuilder(tracker, 'test-stage');
  });

  it('should build a complete issue', () => {
    const issue = builder
      .create('citation')
      .severity('major')
      .message('Missing citation')
      .suggestion('Add a citation')
      .atParagraph(0)
      .build();

    expect(issue.id).toContain('test-stage_citation_0_');
    expect(issue.severity).toBe('major');
    expect(issue.message).toBe('Missing citation');
    expect(issue.location.paragraphIndex).toBe(0);
  });

  it('should support auto-fix code', () => {
    const issue = builder
      .create('style')
      .severity('minor')
      .message('Style issue')
      .suggestion('Fix it')
      .atParagraph(0)
      .autoFix('fixed text')
      .build();

    expect(issue.autoFixable).toBe(true);
    expect(issue.autoFixCode).toBe('fixed text');
  });

  it('should support references and related issues', () => {
    const issue = builder
      .create('argument')
      .severity('major')
      .message('Weak argument')
      .suggestion('Strengthen')
      .atParagraph(0)
      .references('Style Guide Section 3.2')
      .relatedTo('issue-1', 'issue-2')
      .build();

    expect(issue.references).toContain('Style Guide Section 3.2');
    expect(issue.relatedIssues).toEqual(['issue-1', 'issue-2']);
  });

  it('should increment ID counter', () => {
    builder.create('test').severity('minor').message('msg').suggestion('s').atParagraph(0).build();
    builder.create('test').severity('minor').message('msg').suggestion('s').atParagraph(0).build();

    expect(builder.getIdCounter()).toBe(2);
  });

  it('should throw on incomplete issue', () => {
    expect(() => {
      builder.create('test').build();
    }).toThrow();
  });
});

describe('upgradeIssues', () => {
  it('should upgrade standard QualityIssues to EnhancedQualityIssues', () => {
    const content = 'Some test content with issues.';
    const standardIssues: QualityIssue[] = [
      {
        id: 'std-1',
        type: 'citation',
        severity: 'major',
        location: {
          chapterId: 1,
          paragraphIndex: 0,
        },
        description: 'Missing citation',
        suggestion: 'Add citation',
        autoFixable: false,
        contextSnippet: 'test content',
      },
    ];

    const enhanced = upgradeIssues(standardIssues, content, 'test-stage');

    expect(enhanced.length).toBe(1);
    expect(enhanced[0].stage).toBe('test-stage');
    expect(enhanced[0].location.lineStart).toBeGreaterThan(0);
    expect(enhanced[0].location.excerpt).toBeDefined();
  });
});

describe('enhanceStageResult', () => {
  it('should convert QualityStageResult to EnhancedQualityStageResult', () => {
    const content = 'Test document content.\n\nSecond paragraph.';
    const stageResult: QualityStageResult = {
      stageName: 'test-stage',
      passed: true,
      score: 0.85,
      issues: [
        {
          id: 'issue-1',
          type: 'citation',
          severity: 'minor',
          location: { chapterId: 1, paragraphIndex: 0 },
          description: 'Minor issue',
          suggestion: 'Fix it',
          autoFixable: true,
          contextSnippet: 'document content',
        },
      ],
      metrics: { testMetric: 42 },
      suggestions: ['General suggestion'],
    };

    const enhanced = enhanceStageResult(stageResult, content);

    expect(enhanced.stageName).toBe('test-stage');
    expect(enhanced.passed).toBe(true);
    expect(enhanced.score).toBe(0.85);
    expect(enhanced.issues.length).toBe(1);
    expect(enhanced.issues[0].location.lineStart).toBeGreaterThan(0);
    expect(enhanced.metrics.issuesBySeverity.minor).toBe(1);
    expect(enhanced.metrics.autoFixableCount).toBe(1);
    expect(enhanced.metrics.testMetric).toBe(42);
  });
});
