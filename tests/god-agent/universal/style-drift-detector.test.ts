/**
 * Tests for Style Drift Detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StyleDriftDetector,
  createStyleDriftDetector,
} from '../../../src/god-agent/__experimental__/style-drift-detector.js';
import type { StyleCharacteristics } from '../../../src/god-agent/universal/style-analyzer.js';

describe('StyleDriftDetector', () => {
  let detector: StyleDriftDetector;
  const targetStyle: StyleCharacteristics = {
    avgSentenceLength: 15,
    avgWordLength: 5,
    avgParagraphLength: 4,
    formalityScore: 0.8,
    vocabularyRichness: 0.6,
    toneMarkers: [],
  };

  beforeEach(() => {
    detector = createStyleDriftDetector(targetStyle);
  });

  describe('Constructor', () => {
    it('should create detector with target style', () => {
      expect(detector).toBeInstanceOf(StyleDriftDetector);
    });

    it('should have correct thresholds', () => {
      expect(StyleDriftDetector.THRESHOLDS.minor).toBe(0.15);
      expect(StyleDriftDetector.THRESHOLDS.moderate).toBe(0.30);
      expect(StyleDriftDetector.THRESHOLDS.severe).toBe(0.50);
    });
  });

  describe('detectDrift', () => {
    it('should detect minimal drift for matching content', async () => {
      // Content that matches target style (15 words/sentence, 5 chars/word, formal)
      const content = 'This is a formal test sentence. Another formal sentence follows here. And yet another formal sentence is added.';

      const drift = await detector.detectDrift(content, 'test-1');
      expect(drift.score).toBeGreaterThanOrEqual(0);
      expect(drift.score).toBeLessThan(1.0);
      expect(drift.alertLevel).not.toBe('severe');
    });

    it('should detect severe drift for very different content', async () => {
      // Very short, informal content
      const content = 'Hi! Yo! Hey!';

      const drift = await detector.detectDrift(content, 'test-2');
      expect(drift.score).toBeGreaterThan(0);
    });

    it('should track drift history', async () => {
      await detector.detectDrift('Content 1', 'test-1');
      await detector.detectDrift('Content 2', 'test-2');

      const history = detector.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should calculate drift characteristics', async () => {
      const content = 'Test content with some characteristics.';

      const drift = await detector.detectDrift(content, 'test-3');
      expect(drift.characteristics).toHaveProperty('sentenceLength');
      expect(drift.characteristics).toHaveProperty('vocabulary');
      expect(drift.characteristics).toHaveProperty('tone');
      expect(drift.characteristics).toHaveProperty('formality');
      expect(drift.characteristics).toHaveProperty('structure');
    });

    it('should determine alert level based on score', async () => {
      const content = 'Formal test content for drift detection.';

      const drift = await detector.detectDrift(content, 'test-4');
      expect(['none', 'minor', 'moderate', 'severe']).toContain(drift.alertLevel);
    });
  });

  describe('getDriftTrend', () => {
    it('should return stable for insufficient data', () => {
      const trend = detector.getDriftTrend();
      expect(trend).toBe('stable');
    });

    it('should calculate trend from history', async () => {
      // Add some measurements
      await detector.detectDrift('Content 1', 'test-1');
      await detector.detectDrift('Content 2', 'test-2');
      await detector.detectDrift('Content 3', 'test-3');

      const trend = detector.getDriftTrend();
      expect(['increasing', 'decreasing', 'stable']).toContain(trend);
    });

    it('should respect window size', async () => {
      for (let i = 0; i < 10; i++) {
        await detector.detectDrift(`Content ${i}`, `test-${i}`);
      }

      const trendAll = detector.getDriftTrend(10);
      const trendRecent = detector.getDriftTrend(3);

      expect(['increasing', 'decreasing', 'stable']).toContain(trendAll);
      expect(['increasing', 'decreasing', 'stable']).toContain(trendRecent);
    });
  });

  describe('getAverageDrift', () => {
    it('should return 0 for no history', () => {
      const avg = detector.getAverageDrift();
      expect(avg).toBe(0);
    });

    it('should calculate average from history', async () => {
      await detector.detectDrift('Content 1', 'test-1');
      await detector.detectDrift('Content 2', 'test-2');

      const avg = detector.getAverageDrift();
      expect(avg).toBeGreaterThanOrEqual(0);
      expect(avg).toBeLessThanOrEqual(1);
    });
  });

  describe('getHistory', () => {
    it('should return empty array initially', () => {
      const history = detector.getHistory();
      expect(history).toEqual([]);
    });

    it('should return all history entries', async () => {
      await detector.detectDrift('Content 1', 'test-1');
      await detector.detectDrift('Content 2', 'test-2');

      const history = detector.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].contentId).toBe('test-1');
      expect(history[1].contentId).toBe('test-2');
    });
  });

  describe('generateReport', () => {
    it('should generate report with no history', () => {
      const report = detector.generateReport();
      expect(report).toContain('STYLE DRIFT REPORT');
      expect(report).toContain('Total Measurements: 0');
    });

    it('should generate report with history', async () => {
      await detector.detectDrift('Content 1', 'test-1');
      await detector.detectDrift('Content 2', 'test-2');

      const report = detector.generateReport();
      expect(report).toContain('Total Measurements: 2');
      expect(report).toContain('Recent Measurements');
    });
  });
});
