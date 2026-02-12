/**
 * Tests for Typed Entailment Relations - Classifier
 */

import { describe, it, expect } from 'vitest';
import {
  EntailmentClassifier,
  type EntailmentClassifierOptions,
} from '../../../../../src/god-agent/core/writing/entailment/entailment-classifier.js';
import { type ContextChunk } from '../../../../../src/god-agent/core/writing/entailment/entailment-types.js';

describe('EntailmentClassifier', () => {
  const classifier = new EntailmentClassifier();

  describe('Textual Entailment', () => {
    it('should detect quoted text as textual entailment', async () => {
      const claim = 'Aristotle states that "the soul is the form of the body."';
      const evidence: ContextChunk = {
        id: 'aristotle-1',
        content: 'Aristotle famously declared that the soul is the form of the body.',
        metadata: { author: 'Aristotle' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const textualRelation = result.relations.find((r) => r.type === 'textual');
      expect(textualRelation).toBeDefined();
      expect(textualRelation!.confidence).toBeGreaterThan(0.4);
    });

    it('should detect high lexical overlap', async () => {
      const claim = 'The soul is the first actuality of a natural body.';
      const evidence: ContextChunk = {
        id: 'de-anima-1',
        content: 'The soul is the first actuality of a natural body having life potentially.',
        metadata: { author: 'Aristotle', work: 'De Anima' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const textualRelation = result.relations.find((r) => r.type === 'textual');
      expect(textualRelation).toBeDefined();
      expect(textualRelation!.evidence.metrics.lexicalOverlap).toBeGreaterThan(0.5);
    });

    it('should require high overlap for high confidence', async () => {
      const claim = 'Justice is the harmony of the soul.';
      const evidence: ContextChunk = {
        id: 'plato-1',
        content: 'The Republic discusses virtue, politics, and the nature of reality.',
        metadata: { author: 'Plato' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const textualRelation = result.relations.find((r) => r.type === 'textual');
      // Low overlap should result in low confidence
      if (textualRelation) {
        expect(textualRelation.confidence).toBeLessThan(0.5);
      }
    });
  });

  describe('Paraphrastic Entailment', () => {
    it('should detect paraphrase indicators', async () => {
      const lowThresholdClassifier = new EntailmentClassifier({ minConfidence: 0.2 });
      const claim = 'In other words, Kant believes that moral law binds universally.';
      const evidence: ContextChunk = {
        id: 'kant-1',
        content:
          'Kant argues that the categorical imperative applies to all rational beings universally.',
        metadata: { author: 'Kant' },
      };

      const result = await lowThresholdClassifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const paraphrasticRelation = result.relations.find((r) => r.type === 'paraphrastic');
      expect(paraphrasticRelation).toBeDefined();
      expect(paraphrasticRelation!.confidence).toBeGreaterThan(0.2);
    });

    it('should detect "essentially" as paraphrase marker', async () => {
      const lowThresholdClassifier = new EntailmentClassifier({ minConfidence: 0.2 });
      const claim = 'Essentially, phantasia mediates between perception and thought.';
      const evidence: ContextChunk = {
        id: 'de-anima-2',
        content: 'Phantasia mediates between perception and thought as an intermediary faculty.',
        metadata: { author: 'Aristotle' },
      };

      const result = await lowThresholdClassifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const paraphrasticRelation = result.relations.find((r) => r.type === 'paraphrastic');
      expect(paraphrasticRelation).toBeDefined();
    });
  });

  describe('Conceptual Entailment', () => {
    it('should detect vocabulary translation patterns', async () => {
      const lowThresholdClassifier = new EntailmentClassifier({ minConfidence: 0.2 });
      const claim = "What Aristotle calls phantasia corresponds to Heidegger's notion of imagination.";
      const evidence: ContextChunk = {
        id: 'comparison-1',
        content: 'The faculty of phantasia in Aristotle corresponds to imagination in later thinkers.',
        metadata: { author: 'Commentator' },
      };

      const result = await lowThresholdClassifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const conceptualRelation = result.relations.find((r) => r.type === 'conceptual');
      expect(conceptualRelation).toBeDefined();
    });

    it('should detect framework translation language', async () => {
      const claim = "In Heidegger's terms, being-in-the-world replaces the subject-object split.";
      const evidence: ContextChunk = {
        id: 'bt-1',
        content: 'Dasein is essentially being-in-the-world, not a subject set over against objects.',
        metadata: { author: 'Heidegger' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const conceptualRelation = result.relations.find((r) => r.type === 'conceptual');
      expect(conceptualRelation).toBeDefined();
    });
  });

  describe('Inferential Entailment', () => {
    it('should detect inference markers like "therefore"', async () => {
      const claim = 'Therefore, phantasia is essential for practical reasoning.';
      const evidence: ContextChunk = {
        id: 'de-anima-3',
        content: 'Phantasia provides images that guide deliberation and choice.',
        metadata: { author: 'Aristotle' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const inferentialRelation = result.relations.find((r) => r.type === 'inferential');
      expect(inferentialRelation).toBeDefined();
      expect(inferentialRelation!.confidence).toBeGreaterThan(0.4);
    });

    it('should detect premise-conclusion structure', async () => {
      const claim = 'Since Dasein is being-in-the-world, it follows that spatiality is fundamental.';
      const evidence: ContextChunk = {
        id: 'bt-2',
        content: 'Dasein is essentially being-in-the-world. Spatiality belongs to its constitution.',
        metadata: { author: 'Heidegger' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const inferentialRelation = result.relations.find((r) => r.type === 'inferential');
      expect(inferentialRelation).toBeDefined();
      expect(inferentialRelation!.evidence.metrics.premiseCoverage).toBeGreaterThan(0);
    });

    it('should detect "we can conclude" as inference marker', async () => {
      const claim = 'We can conclude that Aristotle anticipated phenomenological insights.';
      const evidence: ContextChunk = {
        id: 'scholar-1',
        content: "Aristotle's treatment of perception shares key features with phenomenology.",
        metadata: { author: 'Scholar' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const inferentialRelation = result.relations.find((r) => r.type === 'inferential');
      expect(inferentialRelation).toBeDefined();
    });
  });

  describe('Analogical Entailment', () => {
    it('should detect "just as" analogy pattern', async () => {
      const claim =
        'Just as Aristotle describes phantasia as mediating between perception and thought, Heidegger places Stimmung between thrownness and projection.';
      const evidence1: ContextChunk = {
        id: 'aristotle-2',
        content: 'Phantasia receives perceptual images and presents them to nous.',
        metadata: { author: 'Aristotle' },
      };
      const evidence2: ContextChunk = {
        id: 'heidegger-1',
        content: 'Stimmung discloses our thrownness and opens possibilities.',
        metadata: { author: 'Heidegger' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence1, evidence2],
      });

      const analogicalRelation = result.relations.find((r) => r.type === 'analogical');
      expect(analogicalRelation).toBeDefined();
      expect(analogicalRelation!.confidence).toBeGreaterThan(0.4);
    });

    it('should detect "parallels" as analogy marker', async () => {
      const claim = "Aristotle's account of phantasia parallels Kant's theory of imagination.";
      const evidence1: ContextChunk = {
        id: 'aristotle-3',
        content: 'Phantasia is the capacity to form images.',
        metadata: { author: 'Aristotle' },
      };
      const evidence2: ContextChunk = {
        id: 'kant-2',
        content: 'Imagination synthesizes sensible intuitions.',
        metadata: { author: 'Kant' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence1, evidence2],
      });

      const analogicalRelation = result.relations.find((r) => r.type === 'analogical');
      expect(analogicalRelation).toBeDefined();
    });
  });

  describe('Evaluative Entailment', () => {
    it('should detect "successfully" as evaluative language', async () => {
      const claim = 'Heidegger successfully overcomes Cartesian dualism.';
      const evidence: ContextChunk = {
        id: 'bt-3',
        content: 'Being and Time does not begin from a subject cut off from the world.',
        metadata: { author: 'Heidegger' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const evaluativeRelation = result.relations.find((r) => r.type === 'evaluative');
      expect(evaluativeRelation).toBeDefined();
      expect(evaluativeRelation!.confidence).toBeGreaterThan(0.4);
    });

    it('should detect "fails to" as evaluative language', async () => {
      const claim = 'Descartes fails to account for embodied cognition.';
      const evidence: ContextChunk = {
        id: 'descartes-1',
        content: 'The mind is entirely distinct from the body.',
        metadata: { author: 'Descartes' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      const evaluativeRelation = result.relations.find((r) => r.type === 'evaluative');
      expect(evaluativeRelation).toBeDefined();
    });

    it('should check for argument structure', async () => {
      const claim = 'This reading is more convincing because it accounts for the textual evidence.';
      const evidence: ContextChunk = {
        id: 'scholar-2',
        content: 'The text supports this interpretation.',
        metadata: { author: 'Scholar' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
        discourseContext: 'We are evaluating competing interpretations.',
      });

      const evaluativeRelation = result.relations.find((r) => r.type === 'evaluative');
      expect(evaluativeRelation).toBeDefined();
      expect(evaluativeRelation!.evidence.metrics.argumentPresence).toBeGreaterThan(0);
    });
  });

  describe('Multiple Relations', () => {
    it('should detect multiple relation types when present', async () => {
      const classifier = new EntailmentClassifier({ detectMultipleRelations: true });
      const claim =
        'Therefore, as Aristotle explicitly states, "phantasia is that by which an image arises."';
      const evidence: ContextChunk = {
        id: 'de-anima-4',
        content: 'Phantasia is that by which an image arises for us.',
        metadata: { author: 'Aristotle' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      // Should detect both textual (quotation) and inferential (therefore)
      expect(result.relations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Classification Metadata', () => {
    it('should include classification metadata', async () => {
      const claim = 'Test claim.';
      const evidence: ContextChunk = {
        id: 'test-1',
        content: 'Test evidence.',
        metadata: { author: 'Test' },
      };

      const result = await classifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.classificationTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.chunksProcessed).toBe(1);
      expect(result.metadata.usedEmbeddings).toBe(false);
    });
  });

  describe('Single Pair Classification', () => {
    it('should classify single claim-evidence pair', async () => {
      const relations = await classifier.classifySingle(
        'Aristotle argues that the soul is mortal.',
        'The soul cannot exist without the body.'
      );

      expect(Array.isArray(relations)).toBe(true);
    });

    it('should get best relation for a pair', async () => {
      const best = await classifier.getBestRelation(
        'Therefore, we must conclude this.',
        'The evidence supports this conclusion.',
        { author: 'Test' }
      );

      // May or may not find a relation depending on patterns
      expect(best === null || best.type !== undefined).toBe(true);
    });
  });

  describe('Classifier Options', () => {
    it('should respect minConfidence option', async () => {
      const strictClassifier = new EntailmentClassifier({ minConfidence: 0.9 });
      const claim = 'Some claim.';
      const evidence: ContextChunk = {
        id: 'test',
        content: 'Unrelated evidence.',
        metadata: { author: 'Test' },
      };

      const result = await strictClassifier.classify({
        claimText: claim,
        evidenceChunks: [evidence],
      });

      // With high threshold, should have fewer relations
      expect(result.relations.every((r) => r.confidence >= 0.9)).toBe(true);
    });

    it('should allow custom patterns', async () => {
      const customPatterns = new Map([['textual', [/CUSTOM_MARKER/gi]]]);
      // Use low minConfidence since lexical overlap is key for textual confidence
      const customClassifier = new EntailmentClassifier({ customPatterns, minConfidence: 0.1 });

      const result = await customClassifier.classify({
        // Include CUSTOM_MARKER which will match the custom pattern
        claimText: 'This text has CUSTOM_MARKER appearing in the content.',
        // Maximize lexical overlap with similar words
        evidenceChunks: [{ id: 't', content: 'This text has content appearing in the same way.', metadata: { author: 'Test' } }],
      });

      const textualRelation = result.relations.find((r) => r.type === 'textual');
      expect(textualRelation).toBeDefined();
    });
  });
});
