/**
 * Lanham Pipeline Smoke Test
 *
 * Integration tests asserting the pipeline infrastructure is operational:
 * - ChromaDB heartbeat
 * - Embedding service reachability
 * - v2_knowledge_chunks collection resolution
 * - Retrieval returns chunks for a known-good query
 * - Active profile has lanhamMetrics
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Lanham pipeline smoke test', () => {
  it('ChromaDB heartbeat succeeds', async () => {
    const resp = await fetch('http://localhost:8001/api/v2/heartbeat');
    expect(resp.ok).toBe(true);
  });

  it('Embedding service reachable', async () => {
    const resp = await fetch('http://localhost:8000/');
    expect(resp.ok).toBe(true);
  });

  it('v2_knowledge_chunks collection resolves', async () => {
    const resp = await fetch(
      'http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections'
    );
    expect(resp.ok).toBe(true);
    const collections = await resp.json();
    const v2 = (collections as any[]).find((c: any) => c.name === 'v2_knowledge_chunks');
    expect(v2).toBeDefined();
    expect(v2.id).toBeTruthy();
  });

  it('retrieval returns >0 chunks for known-good query', async () => {
    const { SmartRetrievalLayer } = await import(
      '../../src/god-agent/retrieval/smart-retrieval-layer.js'
    );
    const retrieval = new SmartRetrievalLayer();
    const results = await retrieval.retrieveContext(
      'AT THROUGH opacity transparency Lanham',
      { maxChunks: 3, minRelevance: 0.0 }
    );
    expect(results.length).toBeGreaterThan(0);
  });

  it('active profile has lanhamMetrics', () => {
    const profilePath = resolve(process.cwd(), '.agentdb-v2/universal/style-profiles.json');
    const data = JSON.parse(readFileSync(profilePath, 'utf-8'));
    const profile = data.profiles[data.activeProfile];
    expect(profile).toBeDefined();
    expect(profile.characteristics.lanhamMetrics).toBeDefined();
    expect(profile.characteristics.lanhamMetrics.labels).toBeDefined();
    expect(profile.metadata.lanhamAnalyzerTier).toBeDefined();
  });
});
