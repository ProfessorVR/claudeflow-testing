/**
 * Tests for Provenance Ledger
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProvenanceLedger,
  createProvenanceLedger,
} from '../../../src/god-agent/__experimental__/provenance-ledger.js';

describe('ProvenanceLedger', () => {
  let ledger: ProvenanceLedger;

  beforeEach(() => {
    ledger = createProvenanceLedger();
  });

  describe('Source Management', () => {
    it('should add citation source', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test Paper',
        url: 'https://example.com/paper',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      expect(sourceId).toMatch(/^source-\d+$/);
    });

    it('should track multiple sources', () => {
      ledger.addSource({ type: 'research', title: 'Paper 1', accessDate: new Date().toISOString(), confidence: 0.9 });
      ledger.addSource({ type: 'web', title: 'Article 1', accessDate: new Date().toISOString(), confidence: 0.7 });

      const sources = ledger.getAllSources();
      expect(sources).toHaveLength(2);
    });
  });

  describe('Claim Management', () => {
    it('should add claim with sources', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test Paper',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      const claimId = ledger.addClaim(
        'AI can process natural language',
        { paragraph: 0, startChar: 0, endChar: 50 },
        [sourceId],
        'fact'
      );

      expect(claimId).toMatch(/^claim-\d+$/);
    });

    it('should track claim without sources', () => {
      const claimId = ledger.addClaim(
        'Uncited claim',
        { paragraph: 0, startChar: 0, endChar: 20 },
        [],
        'opinion'
      );

      const uncited = ledger.getUncitedClaims();
      expect(uncited).toHaveLength(1);
      expect(uncited[0].id).toBe(claimId);
    });

    it('should verify claims with sources', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test Paper',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      const claimId = ledger.addClaim(
        'Test claim',
        { paragraph: 0, startChar: 0, endChar: 10 },
        [sourceId]
      );

      const claims = ledger.getAllClaims();
      const claim = claims.find(c => c.id === claimId);
      expect(claim?.verified).toBe(true);
    });
  });

  describe('Provenance Chain', () => {
    it('should link claim to source', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test Paper',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      const claimId = ledger.addClaim(
        'Test claim',
        { paragraph: 0, startChar: 0, endChar: 10 },
        []
      );

      ledger.linkClaimToSource(claimId, sourceId, 'synthesized-from', 0.85);

      const provenance = ledger.getClaimProvenance(claimId);
      expect(provenance).toBeDefined();
      expect(provenance!.chain).toHaveLength(1);
      expect(provenance!.chain[0].relationship).toBe('synthesized-from');
    });

    it('should get provenance for claim', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test Paper',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      const claimId = ledger.addClaim(
        'Test claim',
        { paragraph: 0, startChar: 0, endChar: 10 },
        [sourceId]
      );

      const provenance = ledger.getClaimProvenance(claimId);
      expect(provenance).toBeDefined();
      expect(provenance!.claim.id).toBe(claimId);
      expect(provenance!.sources).toHaveLength(1);
      expect(provenance!.score).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent claim', () => {
      const provenance = ledger.getClaimProvenance('non-existent');
      expect(provenance).toBeUndefined();
    });
  });

  describe('Citation Completeness', () => {
    it('should calculate 0% for all uncited', () => {
      ledger.addClaim('Claim 1', { paragraph: 0, startChar: 0, endChar: 10 }, []);
      ledger.addClaim('Claim 2', { paragraph: 1, startChar: 0, endChar: 10 }, []);

      const completeness = ledger.getCitationCompleteness();
      expect(completeness).toBe(0);
    });

    it('should calculate 100% for all cited', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      ledger.addClaim('Claim 1', { paragraph: 0, startChar: 0, endChar: 10 }, [sourceId]);
      ledger.addClaim('Claim 2', { paragraph: 1, startChar: 0, endChar: 10 }, [sourceId]);

      const completeness = ledger.getCitationCompleteness();
      expect(completeness).toBe(1);
    });

    it('should calculate 50% for half cited', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      ledger.addClaim('Claim 1', { paragraph: 0, startChar: 0, endChar: 10 }, [sourceId]);
      ledger.addClaim('Claim 2', { paragraph: 1, startChar: 0, endChar: 10 }, []);

      const completeness = ledger.getCitationCompleteness();
      expect(completeness).toBe(0.5);
    });
  });

  describe('Report Generation', () => {
    it('should generate provenance report', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test Paper',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      ledger.addClaim('Claim 1', { paragraph: 0, startChar: 0, endChar: 10 }, [sourceId]);
      ledger.addClaim('Claim 2', { paragraph: 1, startChar: 0, endChar: 10 }, []);

      const report = ledger.generateReport();
      expect(report).toContain('PROVENANCE LEDGER REPORT');
      expect(report).toContain('Total Claims: 2');
      expect(report).toContain('Total Sources: 1');
      expect(report).toContain('Uncited Claims: 1');
    });
  });

  describe('Import/Export', () => {
    it('should export ledger data', () => {
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      ledger.addClaim('Claim', { paragraph: 0, startChar: 0, endChar: 10 }, [sourceId]);

      const data = ledger.exportData();
      expect(data.sources).toHaveLength(1);
      expect(data.claims).toHaveLength(1);
      expect(data.provenanceChain).toHaveLength(1);
    });

    it('should import ledger data', () => {
      const data = {
        sources: [{
          id: 'source-1',
          type: 'research' as const,
          title: 'Imported Source',
          accessDate: new Date().toISOString(),
          confidence: 0.8,
        }],
        claims: [{
          id: 'claim-1',
          text: 'Imported claim',
          location: { paragraph: 0, startChar: 0, endChar: 10 },
          sourceIds: ['source-1'],
          type: 'fact' as const,
          verified: true,
          timestamp: new Date().toISOString(),
        }],
        provenanceChain: [{
          claimId: 'claim-1',
          sourceId: 'source-1',
          relationship: 'directly-cited' as const,
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        }],
      };

      ledger.importData(data);

      expect(ledger.getAllSources()).toHaveLength(1);
      expect(ledger.getAllClaims()).toHaveLength(1);
    });
  });
});
