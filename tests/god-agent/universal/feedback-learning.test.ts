/**
 * Tests for Feedback Learning
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeedbackLearner,
  createFeedbackLearner,
} from '../../../src/god-agent/__experimental__/feedback-learning.js';

describe('FeedbackLearner', () => {
  let learner: FeedbackLearner;

  beforeEach(() => {
    learner = createFeedbackLearner(undefined, { enabled: false });
  });

  describe('Constructor', () => {
    it('should create learner with default options', () => {
      const l = createFeedbackLearner();
      expect(l).toBeInstanceOf(FeedbackLearner);
    });

    it('should accept custom options', () => {
      const l = createFeedbackLearner(undefined, {
        enabled: true,
        collectParagraphFeedback: true,
        timeout: 30000,
      });
      expect(l).toBeInstanceOf(FeedbackLearner);
    });
  });

  describe('collectFeedback', () => {
    it('should return undefined when disabled', async () => {
      const feedback = await learner.collectFeedback('Test content', 'traj-1');
      expect(feedback).toBeUndefined();
    });
  });

  describe('getFeedback', () => {
    it('should return undefined for non-existent trajectory', () => {
      const feedback = learner.getFeedback('non-existent');
      expect(feedback).toBeUndefined();
    });
  });

  describe('getAllFeedback', () => {
    it('should return empty array initially', () => {
      const feedback = learner.getAllFeedback();
      expect(feedback).toEqual([]);
    });
  });

  describe('analyzeFeedbackPatterns', () => {
    it('should return zero patterns for no feedback', () => {
      const patterns = learner.analyzeFeedbackPatterns();
      expect(patterns.avgRating).toBe(0);
      expect(patterns.totalFeedback).toBe(0);
      expect(patterns.commonIssues.size).toBe(0);
      expect(patterns.commonStrengths.size).toBe(0);
    });
  });
});
