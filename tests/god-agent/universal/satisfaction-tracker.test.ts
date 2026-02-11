/**
 * Tests for User Satisfaction Tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SatisfactionTracker,
  createSatisfactionTracker,
  createNonInteractiveSatisfactionTracker,
} from '../../../src/god-agent/__experimental__/satisfaction-tracker.js';

describe('SatisfactionTracker', () => {
  let tracker: SatisfactionTracker;

  beforeEach(() => {
    tracker = createSatisfactionTracker(undefined, { enabled: false });
  });

  describe('Constructor', () => {
    it('should create tracker with default options', () => {
      const t = createSatisfactionTracker();
      expect(t).toBeInstanceOf(SatisfactionTracker);
    });

    it('should create non-interactive tracker', () => {
      const t = createNonInteractiveSatisfactionTracker();
      expect(t).toBeInstanceOf(SatisfactionTracker);
    });
  });

  describe('collectRating', () => {
    it('should return undefined when disabled', async () => {
      const rating = await tracker.collectRating('traj-1', 'Test content');
      expect(rating).toBeUndefined();
    });
  });

  describe('getRating', () => {
    it('should return undefined for non-existent trajectory', () => {
      const rating = tracker.getRating('non-existent');
      expect(rating).toBeUndefined();
    });
  });

  describe('getAllRatings', () => {
    it('should return empty array initially', () => {
      const ratings = tracker.getAllRatings();
      expect(ratings).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return zero stats when no ratings', () => {
      const stats = tracker.getStatistics();
      expect(stats.totalRatings).toBe(0);
      expect(stats.avgOverallScore).toBe(0);
      expect(stats.useAsIsPercentage).toBe(0);
    });
  });

  describe('updateOptions', () => {
    it('should update tracker options', () => {
      tracker.updateOptions({ enabled: true, collectDetailedScores: false });
      expect(tracker).toBeInstanceOf(SatisfactionTracker);
    });
  });
});
