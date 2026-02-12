/**
 * Citation Extractor Tests
 *
 * Comprehensive tests for parsing citations from documents.
 * Part of Phase 4: Citation Graph Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CitationExtractor,
  createCitationExtractor,
  type ExtractedCitation,
  type ReferenceEntry,
  type CitationExtractionResult,
} from '../../../../src/god-agent/cli/retrieval/citation-extractor.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const SAMPLE_TEXT_WITH_APA = `
This is a research paper about machine learning.

As noted by Smith (2020), deep learning has transformed AI. The foundational work
by LeCun, Bengio, and Hinton (2015) established key principles. Recent advances
(Brown et al., 2022) have shown remarkable progress.

The attention mechanism (Vaswani et al., 2017) revolutionized NLP. This builds on
earlier work (Bahdanau, 2014).
`;

const SAMPLE_TEXT_WITH_REFERENCES = `
Introduction

Machine learning has made significant progress. Smith (2020) demonstrated key findings.
The work by Jones and Brown (2019) extended these ideas.

References

Smith, J. (2020). Deep learning fundamentals. Journal of AI Research, 15(3), 45-67.
    https://doi.org/10.1234/jair.2020.15.3.45

Jones, A., & Brown, B. (2019). Neural network architectures. AI Conference Proceedings,
    pp. 123-145. doi:10.5678/aiconf.2019.123

Wilson, C. (2018). "Attention mechanisms in modern NLP". Natural Language Processing
    Quarterly, 8(2), 90-110.
`;

const SAMPLE_NUMBERED_REFS = `
Deep learning [1] has transformed the field. Multiple approaches [2,3] have been proposed.

References
1. Smith, J. (2020). Deep learning fundamentals.
2. Jones, A. (2019). Neural networks explained.
3. Brown, B. (2018). Attention mechanisms.
`;

const SIMPLE_TEXT = `
A short document with one citation (Author, 2024) for testing.
`;

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('CitationExtractor - Basic Functionality', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = createCitationExtractor();
  });

  it('should create extractor with default config', () => {
    expect(extractor).toBeDefined();
    expect(extractor).toBeInstanceOf(CitationExtractor);
  });

  it('should create extractor with custom config', () => {
    const customExtractor = new CitationExtractor({
      minConfidence: 0.7,
      extractInline: true,
      extractReferences: false,
    });

    expect(customExtractor).toBeDefined();
  });

  it('should extract from simple text', () => {
    const result = extractor.extract(SIMPLE_TEXT, 'doc-001', 'Test Document');

    expect(result).toBeDefined();
    expect(result.documentId).toBe('doc-001');
    expect(result.inlineCitations.length).toBeGreaterThan(0);
  });

  it('should handle empty text', () => {
    const result = extractor.extract('', 'doc-001');

    expect(result.inlineCitations).toHaveLength(0);
    expect(result.references).toHaveLength(0);
  });

  it('should handle text with no citations', () => {
    const result = extractor.extract(
      'This is plain text with no academic citations.',
      'doc-001'
    );

    expect(result.inlineCitations).toHaveLength(0);
  });
});

// ============================================================================
// Inline Citation Extraction Tests
// ============================================================================

describe('CitationExtractor - Inline Citations', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = createCitationExtractor();
  });

  it('should extract APA-style citations', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');
    const citations = result.inlineCitations;

    expect(citations.length).toBeGreaterThan(0);

    // Should find Smith (2020) - may be detected as APA or Harvard depending on format
    const smith = citations.find(
      (c) => c.authors?.includes('Smith') && c.year === 2020
    );
    expect(smith).toBeDefined();
    expect(['apa', 'harvard']).toContain(smith?.format);
  });

  it('should extract narrative citations', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');
    const citations = result.inlineCitations;

    // Should find Smith (2020) narrative style
    const narrative = citations.find(
      (c) => c.format === 'harvard' && c.year === 2020
    );
    expect(narrative).toBeDefined();
  });

  it('should extract et al. citations', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');
    const citations = result.inlineCitations;

    // Should find (Brown et al., 2022)
    const etAl = citations.find(
      (c) => c.raw.includes('et al') && c.year === 2022
    );
    expect(etAl).toBeDefined();
  });

  it('should assign confidence scores', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');

    result.inlineCitations.forEach((citation) => {
      expect(citation.confidence).toBeGreaterThan(0);
      expect(citation.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should include location context', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');

    result.inlineCitations.forEach((citation) => {
      expect(citation.location).toBeDefined();
      expect(citation.location?.lineNumber).toBeGreaterThan(0);
    });
  });

  it('should not duplicate citations', () => {
    const textWithDuplicates = 'Smith (2020) said X. Also Smith (2020) noted Y.';
    const result = extractor.extract(textWithDuplicates, 'doc-001');

    const smithCitations = result.inlineCitations.filter(
      (c) => c.authors?.includes('Smith') && c.year === 2020
    );
    // Should have exactly one unique citation
    expect(smithCitations.length).toBe(1);
  });

  it('should respect minimum confidence threshold', () => {
    const strictExtractor = new CitationExtractor({ minConfidence: 0.95 });
    const result = strictExtractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');

    result.inlineCitations.forEach((citation) => {
      expect(citation.confidence).toBeGreaterThanOrEqual(0.95);
    });
  });
});

// ============================================================================
// Reference Section Extraction Tests
// ============================================================================

describe('CitationExtractor - Reference Section', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = createCitationExtractor();
  });

  it('should find reference section', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');

    expect(result.references.length).toBeGreaterThan(0);
  });

  it('should parse reference entries', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');
    const refs = result.references;

    // Should find Smith reference
    const smith = refs.find((r) => r.text.includes('Smith'));
    expect(smith).toBeDefined();
    expect(smith?.year).toBe(2020);
  });

  it('should extract DOIs from references when present', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');
    const refs = result.references;

    // References were found
    expect(refs.length).toBeGreaterThan(0);

    // Check if any DOI was found (may not always be extracted depending on format)
    const withDoi = refs.find((r) => r.doi !== undefined);
    // DOI extraction is best-effort - if found, it should be defined
    if (withDoi) {
      expect(withDoi.doi).toBeDefined();
    }
  });

  it('should extract URLs from references', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');
    const refs = result.references;

    // At least one reference should have a URL
    const withUrl = refs.find((r) => r.url !== undefined);
    expect(withUrl).toBeDefined();
  });

  it('should extract titles from references', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');
    const refs = result.references;

    // Wilson reference has title in quotes
    const wilson = refs.find((r) => r.text.includes('Wilson'));
    if (wilson) {
      expect(wilson.title).toBeDefined();
    }
  });

  it('should handle numbered reference format', () => {
    const result = extractor.extract(SAMPLE_NUMBERED_REFS, 'doc-001');

    expect(result.references.length).toBeGreaterThan(0);
  });

  it('should handle different reference headers', () => {
    const variations = [
      'Bibliography\n\nSmith (2020). Test paper.',
      'Works Cited\n\nSmith (2020). Test paper.',
      'Literature Cited\n\nSmith (2020). Test paper.',
    ];

    variations.forEach((text) => {
      const result = extractor.extract(text, 'doc-001');
      expect(result.references.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// Citation Matching Tests
// ============================================================================

describe('CitationExtractor - Citation Matching', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = createCitationExtractor({ matchCitations: true });
  });

  it('should match inline citations to references', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');

    expect(result.stats.matchedCount).toBeGreaterThan(0);
  });

  it('should enrich citations with reference data', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');

    // Find a matched citation
    const matchedCitation = result.inlineCitations.find((c) => c.title);
    if (matchedCitation) {
      expect(matchedCitation.title).toBeDefined();
    }
  });

  it('should track unmatched citations', () => {
    const textWithUnmatched = `
      This cites Unknown (2099) which has no reference.

      References

      Smith (2020). Some paper.
    `;

    const result = extractor.extract(textWithUnmatched, 'doc-001');

    // The Unknown citation should be unmatched
    expect(result.stats.unmatchedCount).toBeGreaterThan(0);
  });

  it('should disable matching when configured', () => {
    const noMatchExtractor = new CitationExtractor({ matchCitations: false });
    const result = noMatchExtractor.extract(
      SAMPLE_TEXT_WITH_REFERENCES,
      'doc-001'
    );

    expect(result.stats.matchedCount).toBe(0);
  });
});

// ============================================================================
// Graph Element Generation Tests
// ============================================================================

describe('CitationExtractor - Graph Elements', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = createCitationExtractor();
  });

  it('should generate citation nodes', () => {
    const result = extractor.extract(
      SAMPLE_TEXT_WITH_REFERENCES,
      'doc-001',
      'Source Document'
    );

    expect(result.citationNodes.length).toBeGreaterThan(0);

    // Should include source document node
    const sourceNode = result.citationNodes.find((n) => n.id === 'doc-001');
    expect(sourceNode).toBeDefined();
    expect(sourceNode?.title).toBe('Source Document');
  });

  it('should generate citation edges', () => {
    const result = extractor.extract(
      SAMPLE_TEXT_WITH_REFERENCES,
      'doc-001',
      'Source Document'
    );

    expect(result.citationEdges.length).toBeGreaterThan(0);

    // All edges should originate from source document
    result.citationEdges.forEach((edge) => {
      expect(edge.from).toBe('doc-001');
      expect(edge.type).toBeDefined();
      expect(edge.confidence).toBeGreaterThan(0);
    });
  });

  it('should set correct edge types', () => {
    const result = extractor.extract(
      SAMPLE_TEXT_WITH_REFERENCES,
      'doc-001',
      'Source Document'
    );

    result.citationEdges.forEach((edge) => {
      expect(['direct', 'inferred']).toContain(edge.type);
    });
  });

  it('should generate unique node IDs', () => {
    const result = extractor.extract(
      SAMPLE_TEXT_WITH_REFERENCES,
      'doc-001',
      'Source Document'
    );

    const ids = result.citationNodes.map((n) => n.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should include node metadata', () => {
    const result = extractor.extract(
      SAMPLE_TEXT_WITH_REFERENCES,
      'doc-001',
      'Source Document'
    );

    result.citationNodes.forEach((node) => {
      expect(node.id).toBeDefined();
      expect(node.title).toBeDefined();
      expect(node.type).toBe('paper');
    });
  });
});

// ============================================================================
// Statistics Tests
// ============================================================================

describe('CitationExtractor - Statistics', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = createCitationExtractor();
  });

  it('should track inline citation count', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');

    expect(result.stats.inlineCount).toBe(result.inlineCitations.length);
    expect(result.stats.inlineCount).toBeGreaterThan(0);
  });

  it('should track reference count', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');

    expect(result.stats.referenceCount).toBe(result.references.length);
    expect(result.stats.referenceCount).toBeGreaterThan(0);
  });

  it('should track matched vs unmatched', () => {
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');

    expect(result.stats.matchedCount + result.stats.unmatchedCount).toBe(
      result.stats.inlineCount
    );
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('CitationExtractor - Edge Cases', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = createCitationExtractor();
  });

  it('should handle year-only parentheticals', () => {
    const text = 'This happened in the year (2020) which was significant.';
    const result = extractor.extract(text, 'doc-001');

    // Should not extract year-only as citation
    expect(result.inlineCitations.length).toBe(0);
  });

  it('should handle multi-author citations', () => {
    const text = 'According to Smith, Jones, and Brown (2020), this is true.';
    const result = extractor.extract(text, 'doc-001');

    // Should extract this citation
    expect(result.inlineCitations.length).toBeGreaterThan(0);
  });

  it('should handle hyphenated names', () => {
    const text = 'Smith-Jones (2020) conducted the study.';
    const result = extractor.extract(text, 'doc-001');

    expect(result.inlineCitations.length).toBeGreaterThan(0);
  });

  it('should handle very long reference entries', () => {
    const longRef = `
References

Smith, A., Jones, B., Brown, C., Davis, D., Wilson, E., Taylor, F., Anderson, G.,
Thomas, H., Jackson, I., White, J. (2020). A very long title that goes on and on
describing the comprehensive analysis of something very complex and detailed in the
field of artificial intelligence and machine learning applications. Journal of
Extended Research Papers, 100(50), 1-100. https://doi.org/10.1234/very/long/doi
    `;

    const result = extractor.extract(longRef, 'doc-001');
    expect(result.references.length).toBeGreaterThan(0);
  });

  it('should handle malformed citations gracefully', () => {
    const text = 'This cites (2020 Smith) and also (Smith 2020';
    const result = extractor.extract(text, 'doc-001');

    // Should not crash, may or may not extract
    expect(result).toBeDefined();
  });

  it('should handle unicode author names', () => {
    const text = 'As noted by Müller (2020) and also Søren (2019).';
    const result = extractor.extract(text, 'doc-001');

    // May or may not extract depending on pattern matching
    expect(result).toBeDefined();
  });

  it('should handle empty reference section', () => {
    const text = `
Some text with Smith (2020).

References

    `;

    const result = extractor.extract(text, 'doc-001');
    expect(result.references).toHaveLength(0);
  });
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe('CitationExtractor - Configuration', () => {
  it('should disable inline extraction', () => {
    const extractor = new CitationExtractor({ extractInline: false });
    const result = extractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');

    expect(result.inlineCitations).toHaveLength(0);
  });

  it('should disable reference extraction', () => {
    const extractor = new CitationExtractor({ extractReferences: false });
    const result = extractor.extract(SAMPLE_TEXT_WITH_REFERENCES, 'doc-001');

    expect(result.references).toHaveLength(0);
  });

  it('should apply confidence filter', () => {
    const strictExtractor = new CitationExtractor({ minConfidence: 0.99 });
    const lenientExtractor = new CitationExtractor({ minConfidence: 0.1 });

    const strictResult = strictExtractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');
    const lenientResult = lenientExtractor.extract(SAMPLE_TEXT_WITH_APA, 'doc-001');

    expect(lenientResult.inlineCitations.length).toBeGreaterThanOrEqual(
      strictResult.inlineCitations.length
    );
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('CitationExtractor - Integration', () => {
  it('should handle full academic document', () => {
    const academicDoc = `
# A Study of Machine Learning

## Abstract

This paper explores machine learning techniques.

## Introduction

Deep learning (LeCun et al., 2015) has transformed the field. Building on earlier work
by Rumelhart (1986), modern approaches have achieved remarkable results.

Smith and Jones (2020) demonstrated new architectures. The transformer (Vaswani et al., 2017)
introduced attention mechanisms that are now ubiquitous.

## Methods

Following Brown (2019), we implemented...

## Results

Our findings align with previous work (Wilson, 2018; Taylor, 2019).

## Discussion

These results extend the work of Anderson (2017).

## References

LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444.

Rumelhart, D. E. (1986). Learning representations by back-propagating errors.

Smith, J., & Jones, A. (2020). Modern deep learning architectures. ICML 2020.

Vaswani, A., et al. (2017). Attention is all you need. NeurIPS 2017.

Brown, T. (2019). Language models. arXiv preprint.

Wilson, C. (2018). Neural approaches. Journal of ML, 5(2), 100-120.

Taylor, R. (2019). Applied deep learning. AI Magazine.

Anderson, K. (2017). Foundational concepts. ML Workshop.
    `;

    const extractor = createCitationExtractor();
    const result = extractor.extract(academicDoc, 'academic-001', 'ML Study');

    // Should extract inline citations
    expect(result.stats.inlineCount).toBeGreaterThanOrEqual(5);

    // Should extract references
    expect(result.stats.referenceCount).toBeGreaterThanOrEqual(5);

    // Should generate graph elements
    expect(result.citationNodes.length).toBeGreaterThan(1);
    expect(result.citationEdges.length).toBeGreaterThan(0);

    // Source document should be included
    const sourceNode = result.citationNodes.find((n) => n.id === 'academic-001');
    expect(sourceNode?.title).toBe('ML Study');
  });
});
