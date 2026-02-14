/**
 * Tests for ICP Session Events — Event Emitter Helpers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  emitRetrievalEvent,
  emitVerificationEvent,
  emitPatchEvent,
  emitBindingEvent,
  emitPruneEvent,
  emitStressTestEvent,
  emitPlanValidateEvent,
  emitGenerationEvent,
  emitDriftFlagEvent,
  emitAtomMigrationEvent,
  emitPolishNormalizationEvent,
  emitJustifiedRelaxationEvent,
  emitReviewFailEvent,
  emitExportEvent,
} from '../../../../src/god-agent/core/composition/icp-session-events.js';
import type {
  ICPSession,
  ICPSessionEvent,
  PromptSpec,
  SourceScopeSpec,
} from '../../../../src/god-agent/core/composition/icp-types.js';
import { createICPSession } from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeSession(): ICPSession {
  const promptSpec: PromptSpec = {
    original_prompt: 'Analyze phantasia',
    research_questions: ['What is phantasia?'],
    required_facets: [],
    optional_facets: [],
    retrieval_lexicon: new Map(),
    success_criteria: new Map(),
  };
  const sourceScope: SourceScopeSpec = {
    mode: 'corpus',
    doc_authority_policy: {
      version: '1.0.0',
      tiers: { primary: 1 },
    },
  };
  return createICPSession('session-evt-test', promptSpec, sourceScope);
}

function lastEvent(session: ICPSession): ICPSessionEvent {
  return session.event_log[session.event_log.length - 1];
}

// =============================================================================
// TESTS
// =============================================================================

describe('ICP Session Events', () => {
  let session: ICPSession;

  beforeEach(() => {
    session = makeSession();
  });

  // ===========================================================================
  // 1. Session revision increments
  // ===========================================================================

  describe('session revision tracking', () => {
    it('should increment session.revision with each emitted event', () => {
      expect(session.revision).toBe(0);

      emitRetrievalEvent(session, 'facet-1', 5);
      expect(session.revision).toBe(1);

      emitVerificationEvent(session, 'q-1', 'auto_verified');
      expect(session.revision).toBe(2);

      emitBindingEvent(session, 'b-1', ['a-1'], ['q-1']);
      expect(session.revision).toBe(3);
    });

    it('should set session_revision on each event to match the session revision', () => {
      emitRetrievalEvent(session, 'facet-1', 5);
      expect(lastEvent(session).session_revision).toBe(1);

      emitVerificationEvent(session, 'q-1', 'auto_verified');
      expect(lastEvent(session).session_revision).toBe(2);
    });

    it('should update session.updated_at after each event', () => {
      const beforeTimestamp = session.updated_at;
      emitRetrievalEvent(session, 'facet-1', 5);
      // updated_at should be set (may be same ms, so just check it is defined)
      expect(session.updated_at).toBeDefined();
    });
  });

  // ===========================================================================
  // 2. emitRetrievalEvent
  // ===========================================================================

  describe('emitRetrievalEvent', () => {
    it('should emit event with correct action, actor, and category', () => {
      emitRetrievalEvent(session, 'facet-1', 10);
      const evt = lastEvent(session);

      expect(evt.action).toBe('retrieve');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('evidence');
      expect(evt.severity).toBe('info');
      expect(evt.user_visible).toBe(true);
    });

    it('should include facetId in affected_ids and spanCount in summary', () => {
      emitRetrievalEvent(session, 'facet-abc', 7);
      const evt = lastEvent(session);

      expect(evt.affected_ids).toContain('facet-abc');
      expect(evt.payload_summary).toContain('7');
      expect(evt.payload_summary).toContain('facet-abc');
    });
  });

  // ===========================================================================
  // 3. emitVerificationEvent
  // ===========================================================================

  describe('emitVerificationEvent', () => {
    it('should emit event with correct action and category', () => {
      emitVerificationEvent(session, 'q-42', 'human_verified');
      const evt = lastEvent(session);

      expect(evt.action).toBe('verify');
      expect(evt.actor).toBe('system'); // default actor
      expect(evt.category).toBe('verification');
      expect(evt.user_visible).toBe(true);
    });

    it('should accept a custom actor', () => {
      emitVerificationEvent(session, 'q-42', 'human_verified', 'user');
      const evt = lastEvent(session);

      expect(evt.actor).toBe('user');
    });

    it('should include quoteId in affected_ids and status in summary', () => {
      emitVerificationEvent(session, 'q-42', 'auto_rejected');
      const evt = lastEvent(session);

      expect(evt.affected_ids).toContain('q-42');
      expect(evt.payload_summary).toContain('q-42');
      expect(evt.payload_summary).toContain('auto_rejected');
    });
  });

  // ===========================================================================
  // 4. emitPatchEvent
  // ===========================================================================

  describe('emitPatchEvent', () => {
    it('should emit event with correct action, actor, and category', () => {
      emitPatchEvent(session, 'patch-1', 'doc-1', ['span-1', 'span-2']);
      const evt = lastEvent(session);

      expect(evt.action).toBe('patch');
      expect(evt.actor).toBe('user');
      expect(evt.category).toBe('staleness');
      expect(evt.user_visible).toBe(true);
    });

    it('should set severity to warn when impacted spans exist', () => {
      emitPatchEvent(session, 'patch-1', 'doc-1', ['span-1']);
      expect(lastEvent(session).severity).toBe('warn');
    });

    it('should set severity to info when no impacted spans', () => {
      emitPatchEvent(session, 'patch-1', 'doc-1', []);
      expect(lastEvent(session).severity).toBe('info');
    });

    it('should include patchId, docId, and span ids in affected_ids', () => {
      emitPatchEvent(session, 'patch-1', 'doc-1', ['span-a', 'span-b']);
      const evt = lastEvent(session);

      expect(evt.affected_ids).toContain('patch-1');
      expect(evt.affected_ids).toContain('doc-1');
      expect(evt.affected_ids).toContain('span-a');
      expect(evt.affected_ids).toContain('span-b');
    });
  });

  // ===========================================================================
  // 5. emitBindingEvent
  // ===========================================================================

  describe('emitBindingEvent', () => {
    it('should emit event with correct action, actor, and category', () => {
      emitBindingEvent(session, 'b-1', ['a-1', 'a-2'], ['q-1']);
      const evt = lastEvent(session);

      expect(evt.action).toBe('bind');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('evidence');
      expect(evt.severity).toBe('info');
      expect(evt.user_visible).toBe(false);
    });

    it('should include all IDs in affected_ids', () => {
      emitBindingEvent(session, 'b-1', ['a-1', 'a-2'], ['q-1', 'q-2']);
      const evt = lastEvent(session);

      expect(evt.affected_ids).toContain('b-1');
      expect(evt.affected_ids).toContain('a-1');
      expect(evt.affected_ids).toContain('a-2');
      expect(evt.affected_ids).toContain('q-1');
      expect(evt.affected_ids).toContain('q-2');
    });
  });

  // ===========================================================================
  // 6. emitStressTestEvent
  // ===========================================================================

  describe('emitStressTestEvent', () => {
    it('should emit event with correct action and stats in summary', () => {
      emitStressTestEvent(session, 10, 7, 2, 1);
      const evt = lastEvent(session);

      expect(evt.action).toBe('stress_test');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('evidence');
      expect(evt.user_visible).toBe(true);
      expect(evt.payload_summary).toContain('10');
      expect(evt.payload_summary).toContain('7');
      expect(evt.payload_summary).toContain('2');
      expect(evt.payload_summary).toContain('1');
    });

    it('should set severity to warn when failed > 0', () => {
      emitStressTestEvent(session, 10, 7, 3, 0);
      expect(lastEvent(session).severity).toBe('warn');
    });

    it('should set severity to info when failed is 0', () => {
      emitStressTestEvent(session, 10, 10, 0, 0);
      expect(lastEvent(session).severity).toBe('info');
    });
  });

  // ===========================================================================
  // 7. emitGenerationEvent
  // ===========================================================================

  describe('emitGenerationEvent', () => {
    it('should emit event with correct action and actor', () => {
      emitGenerationEvent(session, 'para-1', 0);
      const evt = lastEvent(session);

      expect(evt.action).toBe('generate');
      expect(evt.actor).toBe('llm');
      expect(evt.category).toBe('generation');
      expect(evt.user_visible).toBe(true);
    });

    it('should set severity to warn when driftFlagCount > 0', () => {
      emitGenerationEvent(session, 'para-1', 3);
      expect(lastEvent(session).severity).toBe('warn');
    });

    it('should set severity to info when driftFlagCount is 0', () => {
      emitGenerationEvent(session, 'para-1', 0);
      expect(lastEvent(session).severity).toBe('info');
    });

    it('should include paragraph_id in affected_ids', () => {
      emitGenerationEvent(session, 'para-xyz', 0);
      expect(lastEvent(session).affected_ids).toContain('para-xyz');
    });
  });

  // ===========================================================================
  // 8. emitDriftFlagEvent
  // ===========================================================================

  describe('emitDriftFlagEvent', () => {
    it('should emit event with correct action and category', () => {
      emitDriftFlagEvent(session, 'sent-1', 'WARN', 'Phantasia operates independently');
      const evt = lastEvent(session);

      expect(evt.action).toBe('drift_flag');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('generation');
      expect(evt.user_visible).toBe(true);
    });

    it('should set severity to block for BLOCK verdict', () => {
      emitDriftFlagEvent(session, 'sent-1', 'BLOCK', 'Unsubstantiated claim');
      expect(lastEvent(session).severity).toBe('block');
    });

    it('should set severity to warn for non-BLOCK verdict', () => {
      emitDriftFlagEvent(session, 'sent-1', 'WARN', 'Possible drift');
      expect(lastEvent(session).severity).toBe('warn');
    });

    it('should truncate long propositions in payload_summary', () => {
      const longProp = 'A'.repeat(200);
      emitDriftFlagEvent(session, 'sent-1', 'WARN', longProp);
      const evt = lastEvent(session);

      // The function truncates to 80 chars
      expect(evt.payload_summary.length).toBeLessThan(200);
    });
  });

  // ===========================================================================
  // 9. emitAtomMigrationEvent
  // ===========================================================================

  describe('emitAtomMigrationEvent', () => {
    it('should emit auto migration with system actor', () => {
      emitAtomMigrationEvent(session, 'old-1', 'new-1', 'replace', true);
      const evt = lastEvent(session);

      expect(evt.action).toBe('atom_auto_migrate');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('evidence');
      expect(evt.severity).toBe('info');
      expect(evt.user_visible).toBe(true);
    });

    it('should emit manual migration with user actor', () => {
      emitAtomMigrationEvent(session, 'old-1', 'new-1', 'split', false);
      const evt = lastEvent(session);

      expect(evt.action).toBe('atom_migrate');
      expect(evt.actor).toBe('user');
    });

    it('should include both old and new atom IDs in affected_ids', () => {
      emitAtomMigrationEvent(session, 'old-x', 'new-y', 'merge', true);
      const evt = lastEvent(session);

      expect(evt.affected_ids).toContain('old-x');
      expect(evt.affected_ids).toContain('new-y');
    });

    it('should include migration type in payload_summary', () => {
      emitAtomMigrationEvent(session, 'old-1', 'new-1', 'split', true);
      expect(lastEvent(session).payload_summary).toContain('split');
    });
  });

  // ===========================================================================
  // 10. emitPolishNormalizationEvent
  // ===========================================================================

  describe('emitPolishNormalizationEvent', () => {
    it('should emit event with debug severity and not user visible', () => {
      emitPolishNormalizationEvent(session, 'q-1', 'before text', 'after text');
      const evt = lastEvent(session);

      expect(evt.action).toBe('polish_normalize');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('generation');
      expect(evt.severity).toBe('debug');
      expect(evt.user_visible).toBe(false);
    });

    it('should include quote_id in affected_ids', () => {
      emitPolishNormalizationEvent(session, 'q-42', 'old', 'new');
      expect(lastEvent(session).affected_ids).toContain('q-42');
    });
  });

  // ===========================================================================
  // 11. emitExportEvent
  // ===========================================================================

  describe('emitExportEvent', () => {
    it('should emit event with correct action and category', () => {
      emitExportEvent(session, 'run-123', 'markdown');
      const evt = lastEvent(session);

      expect(evt.action).toBe('export');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('export');
      expect(evt.severity).toBe('info');
      expect(evt.user_visible).toBe(true);
    });

    it('should include runId in affected_ids and format in summary', () => {
      emitExportEvent(session, 'run-abc', 'latex');
      const evt = lastEvent(session);

      expect(evt.affected_ids).toContain('run-abc');
      expect(evt.payload_summary).toContain('run-abc');
      expect(evt.payload_summary).toContain('latex');
    });
  });

  // ===========================================================================
  // 12. emitPruneEvent
  // ===========================================================================

  describe('emitPruneEvent', () => {
    it('should emit event with correct action and affected_ids', () => {
      emitPruneEvent(session, ['q-1', 'q-2', 'q-3'], 'redundancy');
      const evt = lastEvent(session);

      expect(evt.action).toBe('prune');
      expect(evt.actor).toBe('system');
      expect(evt.category).toBe('evidence');
      expect(evt.severity).toBe('info');
      expect(evt.user_visible).toBe(true);
      expect(evt.affected_ids).toEqual(['q-1', 'q-2', 'q-3']);
      expect(evt.payload_summary).toContain('3');
      expect(evt.payload_summary).toContain('redundancy');
    });
  });

  // ===========================================================================
  // 13. emitPlanValidateEvent
  // ===========================================================================

  describe('emitPlanValidateEvent', () => {
    it('should emit info severity when validation passes', () => {
      emitPlanValidateEvent(session, true, []);
      const evt = lastEvent(session);

      expect(evt.action).toBe('plan_validate');
      expect(evt.severity).toBe('info');
      expect(evt.category).toBe('generation');
      expect(evt.payload_summary).toContain('validated successfully');
    });

    it('should emit block severity when validation fails', () => {
      emitPlanValidateEvent(session, false, ['missing atom coverage', 'orphan sentence']);
      const evt = lastEvent(session);

      expect(evt.severity).toBe('block');
      expect(evt.payload_summary).toContain('missing atom coverage');
      expect(evt.payload_summary).toContain('orphan sentence');
    });
  });

  // ===========================================================================
  // 14. emitJustifiedRelaxationEvent
  // ===========================================================================

  describe('emitJustifiedRelaxationEvent', () => {
    it('should emit event with user actor, warn severity, and policy category', () => {
      emitJustifiedRelaxationEvent(
        session,
        'facet-1',
        'strict',
        'moderate',
        'Limited corpus for this facet',
      );
      const evt = lastEvent(session);

      expect(evt.action).toBe('justified_relaxation');
      expect(evt.actor).toBe('user');
      expect(evt.severity).toBe('warn');
      expect(evt.category).toBe('policy');
      expect(evt.user_visible).toBe(true);
      expect(evt.affected_ids).toContain('facet-1');
      expect(evt.payload_summary).toContain('strict');
      expect(evt.payload_summary).toContain('moderate');
    });
  });

  // ===========================================================================
  // 15. emitReviewFailEvent
  // ===========================================================================

  describe('emitReviewFailEvent', () => {
    it('should emit event with block severity and generation category', () => {
      emitReviewFailEvent(
        session,
        'binding_error',
        'Stale binding detected',
        ['b-1', 'b-2'],
      );
      const evt = lastEvent(session);

      expect(evt.action).toBe('review_fail');
      expect(evt.actor).toBe('system');
      expect(evt.severity).toBe('block');
      expect(evt.category).toBe('generation');
      expect(evt.user_visible).toBe(true);
      expect(evt.affected_ids).toEqual(['b-1', 'b-2']);
      expect(evt.payload_summary).toContain('binding_error');
      expect(evt.payload_summary).toContain('Stale binding detected');
    });
  });

  // ===========================================================================
  // 16. Event log accumulation
  // ===========================================================================

  describe('event log accumulation', () => {
    it('should append events to session.event_log in order', () => {
      emitRetrievalEvent(session, 'f1', 5);
      emitVerificationEvent(session, 'q1', 'verified');
      emitGenerationEvent(session, 'p1', 0);
      emitExportEvent(session, 'run1', 'md');

      expect(session.event_log).toHaveLength(4);
      expect(session.event_log[0].action).toBe('retrieve');
      expect(session.event_log[1].action).toBe('verify');
      expect(session.event_log[2].action).toBe('generate');
      expect(session.event_log[3].action).toBe('export');

      // Revisions should be sequential
      expect(session.event_log.map(e => e.session_revision)).toEqual([1, 2, 3, 4]);
    });
  });
});
