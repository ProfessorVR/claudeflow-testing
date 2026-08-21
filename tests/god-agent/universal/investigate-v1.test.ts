import { describe, it, expect, vi } from 'vitest';

// Create a minimal mock of WritePipelineOrchestrator to test investigateV1
// Since investigateV1 is a method on the class, we need to instantiate it.
// However, the constructor requires many deps. We'll test via a standalone extraction.

// Extract the investigation logic into a testable form by importing the class
// and creating a minimal instance.

describe('investigateV1', () => {
  // Create a minimal orchestrator instance for testing
  let orchestrator: any;

  beforeEach(async () => {
    // Dynamic import to handle ESM
    const mod = await import('../../../src/god-agent/universal/write-pipeline-orchestrator.js');
    const WritePipelineOrchestrator = mod.WritePipelineOrchestrator;

    // Minimal deps mock
    orchestrator = new WritePipelineOrchestrator({
      log: vi.fn(),
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      executeTaskDefault: vi.fn(),
      maybeStorePattern: vi.fn().mockResolvedValue(undefined),
      extractTags: vi.fn().mockReturnValue([]),
      storeDESCEpisode: vi.fn().mockResolvedValue(undefined),
      proseSanitizer: { sanitize: vi.fn().mockResolvedValue({ sanitized: '', artifactCount: 0, cleanRate: 1, violations: [] }) },
      config: { autoLearn: false, autoStoreThreshold: 0.7 },
    });
  });

  const makeChunk = (author: string, content: string, pageStart = 1) => ({
    chunkId: `chunk-${author}-${pageStart}`,
    content,
    relevanceScore: 0.8,
    metadata: {
      author,
      title: `Work by ${author}`,
      year: '2020',
      page_start: pageStart,
      source_id: `src-${author}`,
    },
  });

  it('should detect hallucinated citations (author not in manifest)', () => {
    const v1Content = `
## 1. Introduction

Aristotle argues in *Physics* that motion is fundamental (Aristotle, *Physics*, p. 17).
As White observes in *Temporal Logic*, "time is a measure of change" (White, *Temporal Logic*, p. 45).
Heidegger further notes that "being means being-present" (Heidegger, *Basic Concepts*, p. 200).
`;
    const chunks = [
      makeChunk('Aristotle', 'each of them has within itself a principle of motion', 17),
      makeChunk('Heidegger, Martin', 'being means being-present, being-completed', 200),
    ];
    const manifestAuthors = ['Aristotle', 'Heidegger, Martin'];

    const result = orchestrator.investigateV1(v1Content, chunks, manifestAuthors);

    const hallucinated = result.issues.filter((i: any) => i.type === 'hallucinated-citation');
    expect(hallucinated.length).toBeGreaterThanOrEqual(1);
    expect(hallucinated[0].detail).toContain('White');
    expect(result.preventionPlan.blacklistedAuthors).toContain('White');
  });

  it('should detect phantom quotations not in chunks', () => {
    const v1Content = `
## 1. Section

As Aristotle observes, "motion is the actualization of potentiality" (Aristotle, *Physics*, p. 17).
Furthermore, "the soul perceives through phantasmata" (Aristotle, *De Anima*, p. 30).
`;
    const chunks = [
      makeChunk('Aristotle', 'motion is the actualization of potentiality as such', 17),
    ];
    const manifestAuthors = ['Aristotle'];

    const result = orchestrator.investigateV1(v1Content, chunks, manifestAuthors);

    // First quote should be found (close match), second should be phantom
    const phantoms = result.issues.filter((i: any) => i.type === 'phantom-quotation');
    expect(phantoms.length).toBeGreaterThanOrEqual(1);
    expect(phantoms.some((p: any) => p.detail.includes('soul perceives'))).toBe(true);
  });

  it('should detect short sections below 350 words', () => {
    // Create a section with < 350 words
    const shortSection = 'Word '.repeat(100); // 100 words
    const longSection = 'Word '.repeat(400); // 400 words
    const v1Content = `
## 1. Short Section

${shortSection}

## 2. Long Section

${longSection}
`;
    const chunks = [makeChunk('Author', 'some content')];
    const manifestAuthors = ['Author'];

    const result = orchestrator.investigateV1(v1Content, chunks, manifestAuthors);

    const shortSections = result.issues.filter((i: any) => i.type === 'short-section');
    expect(shortSections.length).toBeGreaterThanOrEqual(1);
    expect(shortSections[0].detail).toContain('Short Section');
  });

  it('should detect over-cited sources (>40% of citations)', () => {
    // Create content where one author dominates
    const v1Content = `
## 1. Section

As Aristotle notes in *Physics*, "claim one" (Aristotle, *Physics*, p. 10).
As Aristotle argues in *Physics*, "claim two" (Aristotle, *Physics*, p. 15).
As Aristotle states in *Physics*, "claim three" (Aristotle, *Physics*, p. 20).
As Aristotle maintains in *Physics*, "claim four" (Aristotle, *Physics*, p. 25).
As Aristotle observes in *Physics*, "claim five" (Aristotle, *Physics*, p. 30).
As Heidegger suggests in *Basic Concepts*, "one claim" (Heidegger, *Basic Concepts*, p. 200).
`;
    const chunks = [
      makeChunk('Aristotle', 'claim one claim two claim three claim four claim five', 10),
      makeChunk('Heidegger, Martin', 'one claim about being', 200),
    ];
    const manifestAuthors = ['Aristotle', 'Heidegger, Martin'];

    const result = orchestrator.investigateV1(v1Content, chunks, manifestAuthors);

    const overCited = result.issues.filter((i: any) => i.type === 'over-cited-source');
    expect(overCited.length).toBeGreaterThanOrEqual(1);
    expect(result.preventionPlan.overCitedSources.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect under-cited chunk authors', () => {
    const v1Content = `
## 1. Section

As Aristotle notes in *Physics*, "the principle of motion" (Aristotle, *Physics*, p. 17).
`;
    const chunks = [
      makeChunk('Aristotle', 'the principle of motion and rest', 17),
      makeChunk('Frede, Dorothea', 'perception is not mere passive reception', 3),
      makeChunk('Papachristou, Christina', 'phantasia is a kind of motion in the soul', 12),
    ];
    const manifestAuthors = ['Aristotle', 'Frede, Dorothea', 'Papachristou, Christina'];

    const result = orchestrator.investigateV1(v1Content, chunks, manifestAuthors);

    const underCited = result.issues.filter((i: any) => i.type === 'under-cited-source');
    expect(underCited.length).toBeGreaterThanOrEqual(2); // Frede and Papachristou
    expect(result.preventionPlan.underCitedSources).toContain('frede, dorothea');
  });

  it('should build strengthened constraints from all issue types', () => {
    const shortContent = 'Word '.repeat(200); // Only 200 words total
    const v1Content = `
## 1. Only Section

${shortContent}
As White notes in *Theory*, "some claim" (White, *Theory*, p. 5).
`;
    const chunks = [makeChunk('Aristotle', 'content here', 1)];
    const manifestAuthors = ['Aristotle'];

    const result = orchestrator.investigateV1(v1Content, chunks, manifestAuthors);

    // Should have constraints for: hallucinated author, low word count, short section, under-cited source
    expect(result.preventionPlan.strengthenedConstraints.length).toBeGreaterThan(0);
    expect(result.preventionPlan.blacklistedAuthors).toContain('White');
  });

  it('should return correct stats', () => {
    const v1Content = `
## 1. First Section

As Aristotle notes in *Physics*, "the principle of motion" (Aristotle, *Physics*, p. 17).
Heidegger further argues in *Basic Concepts*, "being means being-present" (Heidegger, *Basic Concepts*, p. 200).

## 2. Second Section

More discussion follows here with citations (Aristotle, *Physics*, p. 20).
`;
    const chunks = [
      makeChunk('Aristotle', 'the principle of motion', 17),
      makeChunk('Heidegger, Martin', 'being means being-present', 200),
    ];
    const manifestAuthors = ['Aristotle', 'Heidegger, Martin'];

    const result = orchestrator.investigateV1(v1Content, chunks, manifestAuthors);

    expect(result.stats.sectionCount).toBe(2);
    expect(result.stats.citationCount).toBeGreaterThanOrEqual(3);
    expect(result.stats.quotationCount).toBeGreaterThanOrEqual(2);
    expect(result.stats.sectionWordCounts.length).toBe(2);
    expect(typeof result.stats.claimsWithoutCitation).toBe('number');
  });
});
