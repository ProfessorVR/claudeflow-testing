/**
 * Run Manifest — Immutable Pipeline Run Snapshots
 *
 * Snapshots a completed ICP pipeline run for:
 *   - Regression testing (re-run with identical upstream → detect drift)
 *   - Reproducibility (same inputs → same outputs)
 *   - Corpus version diff (track what changed between runs)
 *
 * Stored at .god-agent/runs/{run_id}/
 *
 * @module run-manifest
 */

import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type {
  RunManifest,
  ICPSession,
  CorpusVersionDiff,
  PolicyArchive,
  PolicyRef,
  PolicyBlob,
  ParagraphLedger,
  ExportPackage,
} from './icp-types.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface RunManifestConfig {
  /** Base directory for run storage */
  runsDir: string;
  /** Base directory for policy store */
  policiesDir: string;
}

// =============================================================================
// RUN MANIFEST BUILDER
// =============================================================================

export class RunManifestBuilder {
  private readonly config: RunManifestConfig;

  constructor(config: RunManifestConfig) {
    this.config = config;
  }

  /**
   * Snapshot a completed session into a RunManifest.
   */
  snapshot(session: ICPSession, corpusHash: string): RunManifest {
    const runId = randomUUID();

    const manifest: RunManifest = {
      run_id: runId,
      created_at: new Date().toISOString(),
      prompt_spec: session.prompt_spec,
      source_scope: session.source_scope,
      corpus_hash: corpusHash,
      patch_epoch: this.getCurrentPatchEpoch(session),
      claim_map: session.claim_map,
      bindings: [...session.bindings],
      hypothesis_claims: [...session.hypothesis_claims],
      pre_polish_draft: this.extractPrePolishDraft(session),
      event_log_snapshot: [...session.event_log],
      canonical_registry_hash: session.canonical_registry_snapshot?.snapshot_hash,
      paragraph_ledger_snapshot: session.paragraph_ledger,
      ledger_hash: session.paragraph_ledger?.ledger_hash,
      atom_migrations_snapshot: [...session.atom_migrations],
      facet_migrations_snapshot: [...session.facet_migrations],
      policy_archive: this.buildPolicyArchive(session),
    };

    return manifest;
  }

  /**
   * Save a RunManifest to disk.
   */
  save(manifest: RunManifest): string {
    const runDir = path.join(this.config.runsDir, manifest.run_id);
    fs.mkdirSync(runDir, { recursive: true });

    const manifestPath = path.join(runDir, 'manifest.json');
    const tempPath = manifestPath + '.tmp';

    // Atomic write
    fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), 'utf-8');
    fs.renameSync(tempPath, manifestPath);

    return manifestPath;
  }

  /**
   * Load a RunManifest from disk.
   */
  load(runId: string): RunManifest | null {
    const manifestPath = path.join(this.config.runsDir, runId, 'manifest.json');
    if (!fs.existsSync(manifestPath)) return null;

    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as RunManifest;
  }

  /**
   * List all run IDs.
   */
  listRuns(): string[] {
    if (!fs.existsSync(this.config.runsDir)) return [];
    return fs.readdirSync(this.config.runsDir)
      .filter(f => {
        const manifestPath = path.join(this.config.runsDir, f, 'manifest.json');
        return fs.existsSync(manifestPath);
      })
      .sort();
  }

  /**
   * Compute corpus version diff between two runs.
   */
  computeCorpusVersionDiff(
    runId1: string,
    runId2: string,
  ): CorpusVersionDiff | null {
    const manifest1 = this.load(runId1);
    const manifest2 = this.load(runId2);
    if (!manifest1 || !manifest2) return null;

    if (manifest1.corpus_hash === manifest2.corpus_hash) {
      return {
        patches_applied: [],
        affected_quote_spans: [],
        stale_bindings: [],
        affected_claims: [],
      };
    }

    // Compute affected bindings
    const staleBindings: string[] = [];
    for (const binding of manifest2.bindings) {
      const oldBinding = manifest1.bindings.find(b => b.binding_id === binding.binding_id);
      if (oldBinding && binding.staleness_status !== oldBinding.staleness_status) {
        staleBindings.push(binding.binding_id);
      }
    }

    // Compute affected claims
    const affectedClaims = new Set<string>();
    for (const id of staleBindings) {
      const binding = manifest2.bindings.find(b => b.binding_id === id);
      if (binding) affectedClaims.add(binding.claim_id);
    }

    return {
      patches_applied: [],
      affected_quote_spans: [],
      stale_bindings: staleBindings,
      affected_claims: [...affectedClaims],
    };
  }

  /**
   * Build an ExportPackage from a session.
   */
  buildExportPackage(
    session: ICPSession,
    manifest: RunManifest,
    finalProse: string,
  ): ExportPackage {
    return {
      final_prose: finalProse,
      endnotes: this.buildEndnotes(session),
      bibliography: this.buildBibliography(session),
      claim_map_appendix: this.buildClaimMapMermaid(session),
      evidence_ledger: this.buildEvidenceLedger(session),
      paragraph_ledger: session.paragraph_ledger ?? { items: [], ledger_hash: '' },
      run_manifest: manifest,
      methodology_trace: this.buildMethodologyTrace(session),
    };
  }

  // ===========================================================================
  // POLICY STORE
  // ===========================================================================

  /**
   * Store a policy blob in the content-addressed store.
   */
  storePolicy(policyName: string, versionLabel: string, content: unknown): PolicyRef {
    const contentStr = JSON.stringify(content);
    const hash = createHash('sha256').update(contentStr).digest('hex');

    const blob: PolicyBlob = {
      policy_name: policyName,
      version_label: versionLabel,
      created_at: new Date().toISOString(),
      content,
    };

    const blobPath = path.join(this.config.policiesDir, `${hash}.json`);
    if (!fs.existsSync(blobPath)) {
      fs.mkdirSync(this.config.policiesDir, { recursive: true });
      fs.writeFileSync(blobPath, JSON.stringify(blob, null, 2), 'utf-8');
    }

    return { name: policyName, version_label: versionLabel, sha256: hash };
  }

  /**
   * Load a policy blob by hash.
   */
  loadPolicy(hash: string): PolicyBlob | null {
    const blobPath = path.join(this.config.policiesDir, `${hash}.json`);
    if (!fs.existsSync(blobPath)) return null;
    const content = fs.readFileSync(blobPath, 'utf-8');
    return JSON.parse(content) as PolicyBlob;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private getCurrentPatchEpoch(session: ICPSession): number {
    // Derive from event log
    const patchEvents = session.event_log.filter(e => e.action === 'patch');
    return patchEvents.length;
  }

  private extractPrePolishDraft(session: ICPSession): string {
    // Combine all generated text
    const parts: string[] = [];
    for (const [_key, text] of session.generated_text) {
      parts.push(text);
    }
    return parts.join('\n\n');
  }

  private buildPolicyArchive(session: ICPSession): PolicyArchive {
    // Collect all policy refs used in this session
    const refs: PolicyRef[] = [];
    // Would store normalization, trust tier, admission, delta, authority policies
    return { policy_refs: refs };
  }

  private buildEndnotes(session: ICPSession): string {
    const notes: string[] = [];
    let idx = 1;
    for (const span of session.quote_spans) {
      if (span.verification_status === 'auto_verified' ||
          span.verification_status === 'human_verified' ||
          span.verification_status === 'human_corrected') {
        notes.push(`${idx}. ${span.source_anchor ?? span.doc_id}, p. ${typeof span.page === 'number' ? span.page : span.page[0]}`);
        idx++;
      }
    }
    return notes.join('\n');
  }

  private buildBibliography(session: ICPSession): string {
    const docs = new Set(session.quote_spans.map(s => s.doc_id));
    return [...docs].sort().join('\n');
  }

  private buildClaimMapMermaid(session: ICPSession): string {
    if (!session.claim_map) return '```mermaid\ngraph TD\n  A[No claim map]\n```';

    const lines: string[] = ['```mermaid', 'graph TD'];
    for (const claim of session.claim_map.claims) {
      const safeLabel = claim.claim.slice(0, 50).replace(/"/g, "'");
      lines.push(`  ${claim.id}["${safeLabel}"]`);
    }

    // Add dependency edges
    for (const [from, deps] of session.claim_map.dependencies) {
      for (const dep of deps) {
        lines.push(`  ${dep} --> ${from}`);
      }
    }

    lines.push('```');
    return lines.join('\n');
  }

  private buildEvidenceLedger(session: ICPSession): string {
    const lines: string[] = ['# Evidence Ledger', ''];
    for (const binding of session.bindings) {
      const atoms = binding.atom_ids
        .map(id => session.atoms.find(a => a.atom_id === id)?.display_text ?? id)
        .join('; ');
      lines.push(`- Binding ${binding.binding_id}: ${binding.support_kind}`);
      lines.push(`  Atoms: ${atoms}`);
      lines.push(`  Quotes: ${binding.quote_ids.length}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  private buildMethodologyTrace(session: ICPSession): string {
    const userVisible = session.event_log.filter(e => e.user_visible);
    const lines: string[] = ['# Methodology Trace', ''];
    for (const event of userVisible) {
      lines.push(`[${event.ts}] ${event.actor}: ${event.action} — ${event.payload_summary}`);
    }
    return lines.join('\n');
  }
}
