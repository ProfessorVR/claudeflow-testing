import { ProseSanitizer } from '../../../../src/god-agent/cli/composition/prose-sanitizer';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ProseSanitizer', () => {
  let sanitizer: ProseSanitizer;

  beforeEach(() => {
    sanitizer = new ProseSanitizer();
  });

  describe('artifact detection and removal', () => {
    it('should remove research question markers', async () => {
      const input = 'This is a claim. Q1: What is the mechanism? More text.';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).not.toMatch(/Q\d+:/);
      expect(result.violations.length).toBe(1);
      expect(result.artifactCount).toBe(1);
      expect(result.violations[0].text).toMatch(/Q1:/);
    });

    it('should remove confidence scores', async () => {
      const input = 'This claim is well-supported. Confidence: 87%.';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).not.toMatch(/Confidence:/);
      expect(result.violations.length).toBe(1);
      expect(result.violations[0].severity).toBe('critical');
    });

    it('should remove meta commentary', async () => {
      const input = 'Text before. [SYNTHESIS NEEDED] [TODO: add citation] Text after.';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).not.toMatch(/\[SYNTHESIS NEEDED\]/);
      expect(result.sanitized).not.toMatch(/\[TODO:/);
      expect(result.violations.length).toBe(2);
    });

    it('should remove debug markers', async () => {
      const input = 'Normal text. DEBUG: check this. FIXME: broken logic.';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).not.toMatch(/DEBUG:/);
      expect(result.sanitized).not.toMatch(/FIXME:/);
      expect(result.violations.length).toBe(2);
    });

    it('should remove research scaffolding', async () => {
      const input = '[CITATION NEEDED] [EVIDENCE REQUIRED] [PLACEHOLDER]';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).not.toMatch(/\[CITATION NEEDED\]/);
      expect(result.sanitized).not.toMatch(/\[EVIDENCE REQUIRED\]/);
      expect(result.sanitized).not.toMatch(/\[PLACEHOLDER\]/);
      expect(result.violations.length).toBe(3);
    });

    it('should remove multiple artifacts from same content', async () => {
      const input = `
Research suggests X is true. Q1: Why? Confidence: 92%.
[SYNTHESIS NEEDED] More analysis. DEBUG: check sources.
      `.trim();

      const result = await sanitizer.sanitize(input);

      expect(result.violations.length).toBeGreaterThanOrEqual(4);
      expect(result.sanitized).not.toMatch(/Q\d+:|Confidence:|SYNTHESIS|DEBUG:/);
    });
  });

  describe('clean academic prose preservation', () => {
    it('should preserve clean academic prose', async () => {
      const input = 'This is clean academic prose with proper citations (Author, 2024).';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).toBe(input);
      expect(result.violations.length).toBe(0);
      expect(result.cleanRate).toBe(1.0);
    });

    it('should preserve APA citations', async () => {
      const input = 'Research shows X (Smith, 2024; Jones et al., 2023).';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).toBe(input);
      expect(result.violations.length).toBe(0);
    });

    it('should preserve paragraph structure', async () => {
      const input = `
First paragraph with academic content.

Second paragraph continues the argument.

Third paragraph concludes.
      `.trim();

      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).toBe(input);
      expect(result.violations.length).toBe(0);
    });
  });

  describe('whitespace cleaning', () => {
    it('should clean up whitespace after removal', async () => {
      const input = 'Text before.\n\nQ1: Artifact here.\n\n\n\nText after.';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).toMatch(/Text before\.\s+Text after\./);
      expect(result.sanitized).not.toMatch(/\n{3,}/);
    });

    it('should remove excessive spaces', async () => {
      const input = 'Text    with    multiple    spaces.';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).toMatch(/Text with multiple spaces\./);
      expect(result.sanitized).not.toMatch(/  /);  // No double spaces
    });

    it('should trim leading/trailing whitespace', async () => {
      const input = '\n\n  Some content  \n\n';
      const result = await sanitizer.sanitize(input);

      expect(result.sanitized).toBe('Some content');
    });
  });

  describe('validation', () => {
    it('should validate artifact-free content', async () => {
      const input = 'Clean academic prose (Author, 2024).';
      const result = await sanitizer.validate(input);

      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should detect artifacts in validation', async () => {
      const input = 'Text with Q1: artifact.';
      const result = await sanitizer.validate(input);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBe(1);
    });
  });

  describe('clean rate calculation', () => {
    it('should calculate 100% clean rate for no artifacts', async () => {
      const input = 'Clean academic text.';
      const result = await sanitizer.sanitize(input);

      expect(result.cleanRate).toBe(1.0);
    });

    it('should calculate clean rate with artifacts present', async () => {
      const input = 'Q1: artifact Q2: another Q3: third';
      const result = await sanitizer.sanitize(input);

      expect(result.cleanRate).toBeLessThan(1.0);
      expect(result.violations.length).toBe(3);
    });
  });

  describe('line number reporting', () => {
    it('should report correct line numbers for violations', async () => {
      const input = 'Line 1\nLine 2 with Q1: artifact\nLine 3';
      const result = await sanitizer.sanitize(input);

      expect(result.violations[0].line).toBe(2);
    });

    it('should report multiple line numbers', async () => {
      const input = 'Line 1 Q1: first\nLine 2\nLine 3 Q2: second';
      const result = await sanitizer.sanitize(input);

      expect(result.violations[0].line).toBe(1);
      expect(result.violations[1].line).toBe(3);
    });
  });
});
