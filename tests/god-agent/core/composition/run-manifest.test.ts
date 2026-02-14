/**
 * Tests for RunManifestBuilder — Immutable Pipeline Run Snapshots
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  RunManifestBuilder,
  type RunManifestConfig,
} from '../../../../src/god-agent/core/composition/run-manifest.js';
import type {
  ICPSession,
  RunManifest,
  PromptSpec,
  SourceScopeSpec,
  Facet,
  QuoteSpan,
  ClaimBinding,
  ICPSessionEvent,
  ParagraphLedger,
} from '../../../../src/god-agent/core/composition/icp-types.js';
import { createICPSession } from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'run-manifest-test-'));
}

function makePromptSpec(overrides: Partial<PromptSpec> = {}): PromptSpec {
  return {
    original_prompt: 'Analyze phantasia in Aristotle',
    research_questions: ['What is phantasia?'],
    required_facets: [],
    optional_facets: [],
    retrieval_lexicon: new Map(),
    success_criteria: new Map(),
    ...overrides,
  };
}

function makeSourceScope(): SourceScopeSpec {
  return {
    mode: 'corpus',
    corpus_config: {
      collections: ['aristotle'],
      min_relevance: 0.5,
      max_chunks: 20,
    },
    doc_authority_policy: {
      version: '1.0.0',
      tiers: { primary: 1, secondary: 2 },
    },
  };
}

function makeSession(overrides: Partial<ICPSession> = {}): ICPSession {
  const session = createICPSession(
    'session-test-1',
    makePromptSpec(),
    makeSourceScope(),
  );
  // Apply overrides
  Object.assign(session, overrides);
  return session;
}

function makeBinding(overrides: Partial<ClaimBinding> = {}): ClaimBinding {
  return {
    binding_id: 'bind-1',
    claim_id: 'C1',
    atom_ids: ['atom-1'],
    quote_ids: ['q-1'],
    support_kind: 'DIRECT_QUOTE',
    staleness_status: 'current',
    ...overrides,
  };
}

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: 'q-1',
    text_fingerprint: 'fp-1',
    span_fingerprint: 'sfp-1',
    doc_id: 'doc-1',
    page: 42,
    source_kind: 'CORPUS',
    clean_text_range: [0, 100],
    clean_range_hash: 'hash-1',
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: 'Phantasia is a movement arising from sense perception.',
    left_ctx_hash: 'lhash',
    right_ctx_hash: 'rhash',
    verification_status: 'auto_verified',
    source_anchor: 'De Anima 428a',
    provenance_scorecard: {
      fidelity_score: 0.9,
      ocr_risk_score: 0.1,
      cluster_size: 1,
      prior_usage_count: 0,
      doc_authority_tier: 1,
    },
    ...overrides,
  };
}

function makeEvent(overrides: Partial<ICPSessionEvent> = {}): ICPSessionEvent {
  return {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'retrieve',
    payload_summary: 'Test event',
    affected_ids: [],
    session_revision: 1,
    severity: 'info',
    user_visible: true,
    category: 'evidence',
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('RunManifestBuilder', () => {
  let tmpDir: string;
  let config: RunManifestConfig;
  let builder: RunManifestBuilder;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    config = {
      runsDir: path.join(tmpDir, 'runs'),
      policiesDir: path.join(tmpDir, 'policies'),
    };
    builder = new RunManifestBuilder(config);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ===========================================================================
  // 1. Manifest creation from session
  // ===========================================================================

  describe('snapshot()', () => {
    it('should create a manifest with a unique run_id and created_at', () => {
      const session = makeSession();
      const manifest = builder.snapshot(session, 'corpus-hash-abc');

      expect(manifest.run_id).toBeDefined();
      expect(manifest.run_id.length).toBeGreaterThan(0);
      expect(manifest.created_at).toBeDefined();
      expect(() => new Date(manifest.created_at)).not.toThrow();
    });

    it('should generate different run_ids for successive snapshots', () => {
      const session = makeSession();
      const m1 = builder.snapshot(session, 'hash-1');
      const m2 = builder.snapshot(session, 'hash-2');

      expect(m1.run_id).not.toBe(m2.run_id);
    });
  });

  // ===========================================================================
  // 2. Snapshot completeness
  // ===========================================================================

  describe('snapshot completeness', () => {
    it('should capture prompt_spec and source_scope from session', () => {
      const session = makeSession();
      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.prompt_spec).toEqual(session.prompt_spec);
      expect(manifest.source_scope).toEqual(session.source_scope);
    });

    it('should capture bindings and hypothesis_claims arrays', () => {
      const binding = makeBinding();
      const session = makeSession({
        bindings: [binding],
        hypothesis_claims: [
          {
            claim_id: 'hyp-1',
            original_claim: {} as any,
            atoms: [],
            demotion_reason: 'Insufficient evidence',
            demotion_timestamp: new Date().toISOString(),
            source_bindings: [],
          },
        ],
      });

      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.bindings).toHaveLength(1);
      expect(manifest.bindings[0].binding_id).toBe('bind-1');
      expect(manifest.hypothesis_claims).toHaveLength(1);
      expect(manifest.hypothesis_claims[0].claim_id).toBe('hyp-1');
    });

    it('should capture pre_polish_draft from generated_text map', () => {
      const generatedText = new Map<string, string>();
      generatedText.set('para-1', 'First paragraph about phantasia.');
      generatedText.set('para-2', 'Second paragraph about perception.');

      const session = makeSession({ generated_text: generatedText });
      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.pre_polish_draft).toContain('First paragraph about phantasia.');
      expect(manifest.pre_polish_draft).toContain('Second paragraph about perception.');
    });

    it('should capture atom_migrations_snapshot and facet_migrations_snapshot', () => {
      const session = makeSession({
        atom_migrations: [
          {
            migration_id: 'mig-1',
            old_atom_id: 'old-1',
            new_atom_id: 'new-1',
            type: 'replace',
            timestamp: new Date().toISOString(),
          },
        ],
        facet_migrations: [
          {
            migration_id: 'fmig-1',
            type: 'merge',
            source_facet_ids: ['f1', 'f2'],
            target_facet_ids: ['f3'],
            atom_reassignment_rules: { 'atom-1': 'f3' },
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.atom_migrations_snapshot).toHaveLength(1);
      expect(manifest.atom_migrations_snapshot[0].type).toBe('replace');
      expect(manifest.facet_migrations_snapshot).toHaveLength(1);
      expect(manifest.facet_migrations_snapshot[0].type).toBe('merge');
    });
  });

  // ===========================================================================
  // 3. Corpus hash tracking
  // ===========================================================================

  describe('corpus hash tracking', () => {
    it('should store the provided corpus hash', () => {
      const session = makeSession();
      const manifest = builder.snapshot(session, 'sha256-corpus-abc123');

      expect(manifest.corpus_hash).toBe('sha256-corpus-abc123');
    });
  });

  // ===========================================================================
  // 4. Policy archive
  // ===========================================================================

  describe('policy archive', () => {
    it('should include a policy_archive in the manifest', () => {
      const session = makeSession();
      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.policy_archive).toBeDefined();
      expect(manifest.policy_archive.policy_refs).toBeDefined();
      expect(Array.isArray(manifest.policy_archive.policy_refs)).toBe(true);
    });
  });

  // ===========================================================================
  // 5. Policy store — storePolicy and loadPolicy
  // ===========================================================================

  describe('policy store', () => {
    it('should store and load a policy blob by content hash', () => {
      const policyContent = { version: '1.0.0', rules: ['rule1'] };
      const ref = builder.storePolicy('normalization', 'v1.0.0', policyContent);

      expect(ref.name).toBe('normalization');
      expect(ref.version_label).toBe('v1.0.0');
      expect(ref.sha256).toBeDefined();
      expect(ref.sha256.length).toBe(64); // SHA-256 hex

      const loaded = builder.loadPolicy(ref.sha256);
      expect(loaded).not.toBeNull();
      expect(loaded!.policy_name).toBe('normalization');
      expect(loaded!.content).toEqual(policyContent);
    });

    it('should return null for non-existent policy hash', () => {
      const loaded = builder.loadPolicy('nonexistent-hash');
      expect(loaded).toBeNull();
    });

    it('should not overwrite if same content is stored twice', () => {
      const content = { rule: 'test' };
      const ref1 = builder.storePolicy('test', 'v1', content);
      const ref2 = builder.storePolicy('test', 'v1', content);

      expect(ref1.sha256).toBe(ref2.sha256);
    });
  });

  // ===========================================================================
  // 6. Save and load manifest
  // ===========================================================================

  describe('save() and load()', () => {
    it('should save manifest to disk and load it back', () => {
      const session = makeSession();
      const manifest = builder.snapshot(session, 'hash-1');

      const savedPath = builder.save(manifest);
      expect(fs.existsSync(savedPath)).toBe(true);

      const loaded = builder.load(manifest.run_id);
      expect(loaded).not.toBeNull();
      expect(loaded!.run_id).toBe(manifest.run_id);
      expect(loaded!.corpus_hash).toBe('hash-1');
    });

    it('should return null for non-existent run ID', () => {
      const loaded = builder.load('nonexistent-run-id');
      expect(loaded).toBeNull();
    });
  });

  // ===========================================================================
  // 7. Corpus version diff
  // ===========================================================================

  describe('computeCorpusVersionDiff()', () => {
    it('should return empty diff when corpus hashes match', () => {
      const session = makeSession();
      const m1 = builder.snapshot(session, 'same-hash');
      const m2 = builder.snapshot(session, 'same-hash');
      builder.save(m1);
      builder.save(m2);

      const diff = builder.computeCorpusVersionDiff(m1.run_id, m2.run_id);

      expect(diff).not.toBeNull();
      expect(diff!.stale_bindings).toHaveLength(0);
      expect(diff!.affected_claims).toHaveLength(0);
    });

    it('should detect stale bindings when corpus hash differs and binding staleness changed', () => {
      const binding1 = makeBinding({ binding_id: 'b1', staleness_status: 'current' });
      const binding2 = makeBinding({ binding_id: 'b1', staleness_status: 'stale' });

      const session1 = makeSession({ bindings: [binding1] });
      const session2 = makeSession({ bindings: [binding2] });

      const m1 = builder.snapshot(session1, 'hash-old');
      const m2 = builder.snapshot(session2, 'hash-new');
      builder.save(m1);
      builder.save(m2);

      const diff = builder.computeCorpusVersionDiff(m1.run_id, m2.run_id);

      expect(diff).not.toBeNull();
      expect(diff!.stale_bindings).toContain('b1');
      expect(diff!.affected_claims).toContain('C1');
    });

    it('should return null if either run ID does not exist', () => {
      const session = makeSession();
      const m1 = builder.snapshot(session, 'hash-1');
      builder.save(m1);

      const diff = builder.computeCorpusVersionDiff(m1.run_id, 'nonexistent');
      expect(diff).toBeNull();
    });
  });

  // ===========================================================================
  // 8. Event log snapshot
  // ===========================================================================

  describe('event log snapshot', () => {
    it('should capture all events from the session event_log', () => {
      const events: ICPSessionEvent[] = [
        makeEvent({ action: 'retrieve', payload_summary: 'Retrieved spans' }),
        makeEvent({ action: 'verify', payload_summary: 'Verified quote', session_revision: 2 }),
        makeEvent({ action: 'patch', payload_summary: 'Applied patch', session_revision: 3 }),
      ];
      const session = makeSession({ event_log: events });
      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.event_log_snapshot).toHaveLength(3);
      expect(manifest.event_log_snapshot[0].action).toBe('retrieve');
      expect(manifest.event_log_snapshot[2].action).toBe('patch');
    });
  });

  // ===========================================================================
  // 9. Empty session
  // ===========================================================================

  describe('empty session', () => {
    it('should produce a valid manifest from an empty session', () => {
      const session = makeSession();
      const manifest = builder.snapshot(session, 'empty-hash');

      expect(manifest.run_id).toBeDefined();
      expect(manifest.bindings).toHaveLength(0);
      expect(manifest.hypothesis_claims).toHaveLength(0);
      expect(manifest.event_log_snapshot).toHaveLength(0);
      expect(manifest.atom_migrations_snapshot).toHaveLength(0);
      expect(manifest.facet_migrations_snapshot).toHaveLength(0);
      expect(manifest.patch_epoch).toBe(0);
    });
  });

  // ===========================================================================
  // 10. Ledger hash
  // ===========================================================================

  describe('ledger hash', () => {
    it('should capture paragraph_ledger and ledger_hash when present', () => {
      const ledger: ParagraphLedger = {
        items: [
          {
            paragraph_id: 'p1',
            paragraph_order: 0,
            atom_ids: ['atom-1'],
            quote_ids: ['q-1'],
            strictness: 'strict',
            coverage_stats: { atoms_covered: 1, atoms_total: 1, quotes_used: 1 },
            drift_flags: [],
            warn_resolutions: [],
          },
        ],
        ledger_hash: 'ledger-sha256-abc',
      };
      const session = makeSession({ paragraph_ledger: ledger });
      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.paragraph_ledger_snapshot).toBeDefined();
      expect(manifest.paragraph_ledger_snapshot!.items).toHaveLength(1);
      expect(manifest.ledger_hash).toBe('ledger-sha256-abc');
    });

    it('should have undefined ledger_hash when no paragraph_ledger is set', () => {
      const session = makeSession();
      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.paragraph_ledger_snapshot).toBeUndefined();
      expect(manifest.ledger_hash).toBeUndefined();
    });
  });

  // ===========================================================================
  // 11. Patch epoch
  // ===========================================================================

  describe('patch epoch', () => {
    it('should derive patch_epoch from number of patch events in event_log', () => {
      const events: ICPSessionEvent[] = [
        makeEvent({ action: 'patch', session_revision: 1 }),
        makeEvent({ action: 'retrieve', session_revision: 2 }),
        makeEvent({ action: 'patch', session_revision: 3 }),
      ];
      const session = makeSession({ event_log: events });
      const manifest = builder.snapshot(session, 'hash-1');

      expect(manifest.patch_epoch).toBe(2);
    });
  });

  // ===========================================================================
  // 12. listRuns
  // ===========================================================================

  describe('listRuns()', () => {
    it('should list all saved run IDs', () => {
      const session = makeSession();
      const m1 = builder.snapshot(session, 'h1');
      const m2 = builder.snapshot(session, 'h2');
      builder.save(m1);
      builder.save(m2);

      const runs = builder.listRuns();
      expect(runs).toHaveLength(2);
      expect(runs).toContain(m1.run_id);
      expect(runs).toContain(m2.run_id);
    });

    it('should return empty array when no runs exist', () => {
      const runs = builder.listRuns();
      expect(runs).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 13. Export package
  // ===========================================================================

  describe('buildExportPackage()', () => {
    it('should produce an export package with all required fields', () => {
      const span = makeSpan();
      const binding = makeBinding();
      const session = makeSession({
        quote_spans: [span],
        bindings: [binding],
        atoms: [
          {
            atom_id: 'atom-1',
            atom_version_id: 1,
            display_text: 'Phantasia is perception-based',
            semantic_text: 'phantasia perception',
            modality: 'asserted' as const,
            kind: 'corpus_claim' as const,
            parent_claim_id: 'C1',
            evidence_mode: 'DIRECT_QUOTE' as const,
            bound_quote_ids: ['q-1'],
            facet_id: 'facet-1',
          },
        ],
      });
      const manifest = builder.snapshot(session, 'hash-1');

      const pkg = builder.buildExportPackage(session, manifest, 'Final prose text.');

      expect(pkg.final_prose).toBe('Final prose text.');
      expect(pkg.run_manifest.run_id).toBe(manifest.run_id);
      expect(pkg.endnotes).toBeDefined();
      expect(pkg.bibliography).toBeDefined();
      expect(pkg.claim_map_appendix).toContain('mermaid');
      expect(pkg.evidence_ledger).toContain('Evidence Ledger');
      expect(pkg.methodology_trace).toContain('Methodology Trace');
    });
  });
});
