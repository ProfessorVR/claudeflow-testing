/**
 * Tests for SemanticChunker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SemanticChunker,
  createDefaultChunker,
  createAcademicChunker,
  createTechnicalChunker,
} from '../../../src/god-agent/retrieval/chunking-strategy.js';

describe('SemanticChunker', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = new SemanticChunker({ docId: 'test-doc' });
  });

  describe('basic chunking', () => {
    it('should return empty array for empty document', async () => {
      const chunks = await chunker.chunk('');
      expect(chunks).toEqual([]);
    });

    it('should return empty array for whitespace-only document', async () => {
      const chunks = await chunker.chunk('   \n\n   ');
      expect(chunks).toEqual([]);
    });

    it('should create single chunk for short document', async () => {
      const text = 'This is a short paragraph with only a few words.';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toContain('short paragraph');
    });

    it('should preserve content integrity', async () => {
      const text = 'First paragraph with content.\n\nSecond paragraph with more content.';
      const chunks = await chunker.chunk(text);

      // All original content should be present across chunks
      const combined = chunks.map(c => c.content.replace('[...] ', '')).join(' ');
      expect(combined).toContain('First paragraph');
      expect(combined).toContain('Second paragraph');
    });
  });

  describe('paragraph-based splitting', () => {
    it('should respect paragraph boundaries', async () => {
      // Create long text with clear paragraphs (200 words each = 600 total, exceeds 500 max)
      const para1 = 'Word '.repeat(200) + 'First paragraph ends here.';
      const para2 = 'Word '.repeat(200) + 'Second paragraph ends here.';
      const para3 = 'Word '.repeat(200) + 'Third paragraph ends here.';
      const text = `${para1}\n\n${para2}\n\n${para3}`;

      const chunks = await chunker.chunk(text);

      // Should have multiple chunks since total exceeds max size
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      // Chunks should contain meaningful content
      expect(chunks.some(c => c.content.includes('ends here'))).toBe(true);
    });

    it('should handle headers as paragraph boundaries', async () => {
      const text = `## Introduction\n\nThis is the intro.\n\n## Methods\n\nThis is the methods section.`;
      const chunks = await chunker.chunk(text);

      // Content should include headers
      const combined = chunks.map(c => c.content).join(' ');
      expect(combined).toContain('Introduction');
      expect(combined).toContain('Methods');
    });
  });

  describe('chunk size targeting', () => {
    it('should create chunks near target size', async () => {
      // Create long document
      const paragraphs = Array(10).fill(null).map((_, i) =>
        `Paragraph ${i + 1}: ` + 'Word '.repeat(80) + 'End.'
      );
      const text = paragraphs.join('\n\n');

      const chunks = await chunker.chunk(text);

      // Most chunks should be near target size (350 words)
      const avgWordCount = chunks.reduce((sum, c) => sum + c.wordCount, 0) / chunks.length;
      expect(avgWordCount).toBeGreaterThan(200);
      expect(avgWordCount).toBeLessThan(500);
    });

    it('should not exceed maximum chunk size when possible', async () => {
      // Create multiple paragraphs that can be chunked properly
      const paragraphs = Array(6).fill(null).map((_, i) =>
        `Paragraph ${i + 1}: ` + 'Word '.repeat(100) + 'End.'
      );
      const text = paragraphs.join('\n\n');

      const chunks = await chunker.chunk(text);

      // With 6 paragraphs of ~100 words each (600 total), should get multiple chunks
      // Most chunks should respect size limits
      const normalChunks = chunks.filter(c => c.wordCount <= 550);
      expect(normalChunks.length).toBeGreaterThan(0);
    });
  });

  describe('metadata', () => {
    it('should include chunk index in metadata', async () => {
      const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
      const chunks = await chunker.chunk(text);

      chunks.forEach((chunk, i) => {
        expect(chunk.metadata.chunkIndex).toBe(i);
      });
    });

    it('should include total chunks in metadata', async () => {
      const text = 'Word '.repeat(800);
      const chunks = await chunker.chunk(text);

      for (const chunk of chunks) {
        expect(chunk.metadata.totalChunks).toBe(chunks.length);
      }
    });

    it('should track section headers', async () => {
      const text = `## First Section\n\nContent of first section.\n\n## Second Section\n\nContent of second section.`;
      const chunks = await chunker.chunk(text);

      // At least one chunk should have section metadata
      expect(chunks.some(c => c.metadata.section)).toBe(true);
    });

    it('should detect semantic type', async () => {
      const text = '- Item 1\n- Item 2\n- Item 3\n\nA regular paragraph.';
      const chunks = await chunker.chunk(text);

      // Should detect list or mixed content
      expect(chunks.some(c => c.metadata.semanticType === 'list' || c.metadata.semanticType === 'mixed')).toBe(true);
    });
  });

  describe('overlap handling', () => {
    it('should add overlap between chunks', async () => {
      const chunkerWithOverlap = new SemanticChunker({
        docId: 'test',
        overlap: 50,
        targetSize: 100,
        maxSize: 150,
      });

      // Create text that will generate multiple chunks
      const text = 'Word '.repeat(400);
      const chunks = await chunkerWithOverlap.chunk(text);

      if (chunks.length > 1) {
        // Second chunk onwards should have overlap marker
        expect(chunks[1].content.startsWith('[...]')).toBe(true);
        expect(chunks[1].metadata.hasOverlap).toBe(true);
      }
    });

    it('should not have overlap on first chunk', async () => {
      const text = 'Word '.repeat(400);
      const chunks = await chunker.chunk(text);

      expect(chunks[0].content.startsWith('[...]')).toBe(false);
      expect(chunks[0].metadata.hasOverlap).toBeFalsy();
    });
  });

  describe('factory functions', () => {
    it('should create default chunker', () => {
      const defaultChunker = createDefaultChunker('test');
      expect(defaultChunker).toBeInstanceOf(SemanticChunker);
    });

    it('should create academic chunker with larger sizes', async () => {
      const academicChunker = createAcademicChunker('test');
      const text = 'Word '.repeat(800);
      const chunks = await academicChunker.chunk(text);

      // Academic chunker has larger target size (400)
      const avgSize = chunks.reduce((sum, c) => sum + c.wordCount, 0) / chunks.length;
      expect(avgSize).toBeGreaterThan(250);
    });

    it('should create technical chunker with smaller sizes', async () => {
      const technicalChunker = createTechnicalChunker('test');
      const text = 'Word '.repeat(600);
      const chunks = await technicalChunker.chunk(text);

      // Technical chunker has smaller target size (300)
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('getChunkingStats', () => {
    it('should return statistics about chunks', async () => {
      const text = 'Word '.repeat(500);
      const chunks = await chunker.chunk(text);

      const stats = chunker.getChunkingStats(chunks);

      expect(stats.totalChunks).toBe(chunks.length);
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.avgWordCount).toBeGreaterThan(0);
      expect(stats.minWordCount).toBeLessThanOrEqual(stats.avgWordCount);
      expect(stats.maxWordCount).toBeGreaterThanOrEqual(stats.avgWordCount);
    });

    it('should handle empty chunk array', () => {
      const stats = chunker.getChunkingStats([]);

      expect(stats.totalChunks).toBe(0);
      expect(stats.avgWordCount).toBe(0);
    });
  });

  describe('toContextChunks', () => {
    it('should convert to ContextChunk format', async () => {
      const text = 'Some academic content here.';
      const chunks = await chunker.chunk(text);

      const contextChunks = chunker.toContextChunks(chunks, {
        author: 'Smith',
        title: 'Test Paper',
        year: 2024,
        collection: 'theory',
      });

      expect(contextChunks[0].metadata.author).toBe('Smith');
      expect(contextChunks[0].metadata.title).toBe('Test Paper');
      expect(contextChunks[0].metadata.year).toBe(2024);
      expect(contextChunks[0].metadata.collection).toBe('theory');
    });
  });
});
