import { describe, it, expect, beforeEach } from 'vitest';
import { CompactionDetector } from '@god-agent/core/ucm/index.js';

/**
 * CompactionDetector tests aligned with actual API:
 *
 * Public methods:
 *   detectCompaction(message: string): boolean
 *   getCompactionTimestamp(): number
 *   isInRecoveryMode(): boolean
 *   setRecoveryMode(enabled: boolean): void
 *   getState(): { detected, timestamp, marker, confidence, recoveryMode }
 *   getHistory(): Array<{ timestamp, marker, confidence }>
 *   reset(): void
 *   isRecentDetection(thresholdMs?): boolean
 *   getConfidence(): number
 *
 * Internal COMPACTION_MARKERS (private, not exported):
 *   - 'This session is being continued from a previous conversation'
 *   - 'conversation is summarized below'
 *   - 'ran out of context'
 *   - 'context window limit'
 *   - 'conversation has been compacted'
 *   - 'previous messages have been summarized'
 *   - 'continuing from a previous session'
 *   - 'context has been compressed'
 *   - 'earlier conversation history'
 *   - 'session continuation detected'
 *
 * Partial-match keywords (>70% needed): session, continued, previous,
 *   conversation, summarized, context, compacted, compressed
 */
describe('CompactionDetector', () => {
  let detector: CompactionDetector;

  beforeEach(() => {
    detector = new CompactionDetector();
  });

  describe('exact marker detection', () => {
    it('should detect "conversation has been compacted" marker', () => {
      const result = detector.detectCompaction('conversation has been compacted');
      expect(result).toBe(true);
    });

    it('should detect "context has been compressed" marker', () => {
      const result = detector.detectCompaction('context has been compressed');
      expect(result).toBe(true);
    });

    it('should detect "previous messages have been summarized" marker', () => {
      const result = detector.detectCompaction('previous messages have been summarized');
      expect(result).toBe(true);
    });

    it('should detect "ran out of context" marker', () => {
      const result = detector.detectCompaction('ran out of context');
      expect(result).toBe(true);
    });

    it('should detect "context window limit" marker', () => {
      const result = detector.detectCompaction('context window limit');
      expect(result).toBe(true);
    });

    it('should detect "session continuation detected" marker', () => {
      const result = detector.detectCompaction('session continuation detected');
      expect(result).toBe(true);
    });

    it('should detect case-insensitive markers', () => {
      const responses = [
        'CONVERSATION HAS BEEN COMPACTED',
        'Context Has Been Compressed',
        'RAN OUT OF CONTEXT'
      ];

      responses.forEach(response => {
        detector.reset();
        expect(detector.detectCompaction(response)).toBe(true);
      });
    });

    it('should detect markers embedded in longer text', () => {
      const response = 'Note: This session is being continued from a previous conversation that was truncated.';
      expect(detector.detectCompaction(response)).toBe(true);
    });

    it('should not detect non-compaction text', () => {
      const normalResponses = [
        'This is a normal response',
        'Here is the analysis you requested',
        'The function returns a value'
      ];

      normalResponses.forEach(response => {
        expect(detector.detectCompaction(response)).toBe(false);
      });
    });

    it('should handle empty string', () => {
      expect(detector.detectCompaction('')).toBe(false);
    });

    it('should handle multiline text with markers', () => {
      const response = `Line 1
Line 2
conversation has been compacted
Line 4`;

      expect(detector.detectCompaction(response)).toBe(true);
    });
  });

  describe('partial match detection', () => {
    it('should detect when many compaction keywords are present (>70%)', () => {
      // Keywords: session, continued, previous, conversation, summarized, context, compacted, compressed
      // Need >70% = at least 6 out of 8
      const text = 'In this session the previous conversation context was summarized and compacted and compressed';
      // Contains: session, previous, conversation, context, summarized, compacted, compressed = 7/8
      expect(detector.detectCompaction(text)).toBe(true);
    });

    it('should not detect when few compaction keywords are present', () => {
      // Only 1-2 keywords is well below 70%
      const text = 'The context of this discussion is about cooking';
      // Contains: context = 1/8 = 12.5%
      expect(detector.detectCompaction(text)).toBe(false);
    });
  });

  describe('state tracking', () => {
    it('should track detection state after compaction', () => {
      detector.detectCompaction('conversation has been compacted');

      const state = detector.getState();
      expect(state.detected).toBe(true);
      expect(state.marker).toBe('conversation has been compacted');
      expect(state.confidence).toBe(1.0);
      expect(state.recoveryMode).toBe(true);
    });

    it('should track last compaction timestamp', () => {
      const before = Date.now();
      detector.detectCompaction('conversation has been compacted');
      const after = Date.now();

      const state = detector.getState();
      expect(state.timestamp).toBeGreaterThanOrEqual(before);
      expect(state.timestamp).toBeLessThanOrEqual(after);
    });

    it('should initialize state correctly', () => {
      const state = detector.getState();

      expect(state.detected).toBe(false);
      expect(state.timestamp).toBe(0);
      expect(state.marker).toBeNull();
      expect(state.confidence).toBe(0);
      expect(state.recoveryMode).toBe(false);
    });

    it('should not change state for non-compaction responses', () => {
      detector.detectCompaction('normal response');
      detector.detectCompaction('another normal response');

      const state = detector.getState();
      expect(state.detected).toBe(false);
      expect(state.timestamp).toBe(0);
    });

    it('should update state on each detection', () => {
      detector.detectCompaction('conversation has been compacted');
      const firstTimestamp = detector.getState().timestamp;

      // Small delay to ensure different timestamp
      detector.detectCompaction('context has been compressed');
      const secondTimestamp = detector.getState().timestamp;

      expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
      expect(detector.getState().marker).toBe('context has been compressed');
    });
  });

  describe('detection history', () => {
    it('should record detection history', () => {
      detector.detectCompaction('conversation has been compacted');
      detector.detectCompaction('context has been compressed');

      const history = detector.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].marker).toBe('conversation has been compacted');
      expect(history[1].marker).toBe('context has been compressed');
    });

    it('should not add to history for non-detections', () => {
      detector.detectCompaction('normal text');
      expect(detector.getHistory()).toHaveLength(0);
    });

    it('should limit history to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        detector.detectCompaction('conversation has been compacted');
      }

      const history = detector.getHistory();
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('recovery mode', () => {
    it('should enter recovery mode after detection', () => {
      detector.detectCompaction('conversation has been compacted');

      expect(detector.isInRecoveryMode()).toBe(true);
      expect(detector.getState().recoveryMode).toBe(true);
    });

    it('should exit recovery mode via setRecoveryMode', () => {
      detector.detectCompaction('conversation has been compacted');
      detector.setRecoveryMode(false);

      expect(detector.isInRecoveryMode()).toBe(false);
      expect(detector.getState().recoveryMode).toBe(false);
    });

    it('should remain in recovery mode after multiple detections', () => {
      detector.detectCompaction('conversation has been compacted');
      detector.detectCompaction('context has been compressed');

      expect(detector.isInRecoveryMode()).toBe(true);
    });

    it('should not enter recovery mode without detection', () => {
      detector.detectCompaction('normal response');

      expect(detector.isInRecoveryMode()).toBe(false);
    });

    it('should allow re-entering recovery mode', () => {
      detector.detectCompaction('conversation has been compacted');
      detector.setRecoveryMode(false);
      detector.detectCompaction('context has been compressed');

      expect(detector.isInRecoveryMode()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      detector.detectCompaction('conversation has been compacted');
      detector.detectCompaction('context has been compressed');

      detector.reset();

      const state = detector.getState();
      expect(state.detected).toBe(false);
      expect(state.timestamp).toBe(0);
      expect(state.marker).toBeNull();
      expect(state.confidence).toBe(0);
      expect(state.recoveryMode).toBe(false);
    });

    it('should allow reuse after reset', () => {
      detector.detectCompaction('conversation has been compacted');
      detector.reset();
      detector.detectCompaction('context has been compressed');

      const state = detector.getState();
      expect(state.detected).toBe(true);
      expect(state.marker).toBe('context has been compressed');
    });
  });

  describe('convenience methods', () => {
    it('getCompactionTimestamp should return 0 initially', () => {
      expect(detector.getCompactionTimestamp()).toBe(0);
    });

    it('getCompactionTimestamp should return timestamp after detection', () => {
      const before = Date.now();
      detector.detectCompaction('conversation has been compacted');

      expect(detector.getCompactionTimestamp()).toBeGreaterThanOrEqual(before);
    });

    it('getConfidence should return 0 initially', () => {
      expect(detector.getConfidence()).toBe(0);
    });

    it('getConfidence should return 1.0 for exact marker match', () => {
      detector.detectCompaction('conversation has been compacted');
      expect(detector.getConfidence()).toBe(1.0);
    });

    it('isRecentDetection should return false when no detection', () => {
      expect(detector.isRecentDetection()).toBe(false);
    });

    it('isRecentDetection should return true immediately after detection', () => {
      detector.detectCompaction('conversation has been compacted');
      expect(detector.isRecentDetection()).toBe(true);
    });
  });

  describe('performance', () => {
    it('should detect quickly for short text', () => {
      const text = 'conversation has been compacted';
      const start = performance.now();

      detector.detectCompaction(text);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5);
    });

    it('should detect quickly for long text', () => {
      const longText = 'word '.repeat(10000) + ' conversation has been compacted ';
      const start = performance.now();

      detector.detectCompaction(longText);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in surrounding text', () => {
      const text = '!@#$%^&*() conversation has been compacted !@#$%^&*()';
      expect(detector.detectCompaction(text)).toBe(true);
    });

    it('should handle unicode text around markers', () => {
      const text = 'conversation has been compacted';
      expect(detector.detectCompaction(text)).toBe(true);
    });

    it('should detect only once per call even when multiple markers present', () => {
      const text = 'conversation has been compacted and context has been compressed';
      detector.detectCompaction(text);

      // Only the first matched marker is recorded
      const history = detector.getHistory();
      expect(history).toHaveLength(1);
    });

    it('should handle very short text without matching', () => {
      expect(detector.detectCompaction('c')).toBe(false);
      expect(detector.detectCompaction('co')).toBe(false);
      expect(detector.detectCompaction('ran')).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should track conversation with mixed responses', () => {
      const responses = [
        'Normal analysis here',
        'conversation has been compacted',
        'More normal content',
        'context has been compressed',
        'Final response'
      ];

      responses.forEach(r => detector.detectCompaction(r));

      const history = detector.getHistory();
      expect(history).toHaveLength(2);
      expect(detector.isInRecoveryMode()).toBe(true);
    });

    it('should support recovery workflow', () => {
      // Detect compaction
      detector.detectCompaction('conversation has been compacted');
      expect(detector.isInRecoveryMode()).toBe(true);

      // Perform recovery actions...

      // Exit recovery
      detector.setRecoveryMode(false);
      expect(detector.isInRecoveryMode()).toBe(false);

      // Continue normal operation
      detector.detectCompaction('normal response');
      expect(detector.isInRecoveryMode()).toBe(false);
    });
  });
});
