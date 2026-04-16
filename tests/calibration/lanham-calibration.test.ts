/**
 * Lanham Prose Analyzer — Phase H Calibration Test Suite
 *
 * Loads 25 gold-set texts, runs LanhamProseAnalyzer.fullAnalysis() on each,
 * and reports per-axis agreement and monotonicity against gold labels.
 *
 * Tier structure (from plan):
 *   Hard constraint:   nounVerb, register      — agreement target 80-90%, monotonicity >0.85
 *   Firm guidance:     voice                    — monotonicity target >0.75
 *   Soft observation:  parataxis/hypotaxis, opacity — monotonicity target >0.70
 *   Informational:     periodicRunning          — monotonicity target >0.65
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../../src/god-agent/cli/style/lanham-prose-analyzer.js';
import type { LanhamProseMetrics } from '../../src/god-agent/universal/style-analyzer.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GoldEntry {
  id: string;
  genre: string;
  text: string;
  labels: {
    nounVerb: string;
    parataxisHypotaxis: string;
    periodicRunning: string;
    voice: string;
    primaryRegister: string;
    opacity: string;
  };
  source: string;
  notes: string;
}

interface AnalysisResult {
  entry: GoldEntry;
  metrics: LanhamProseMetrics;
}

// ── Ordinal maps for monotonicity computation ─────────────────────────────────

const NOUN_VERB_ORD: Record<string, number> = {
  'predominantly noun-style': 0,
  'balanced': 1,
  'predominantly verb-style': 2,
};

const PARA_HYPO_ORD: Record<string, number> = {
  'predominantly paratactic': 0,
  'mixed': 1,
  'predominantly hypotactic': 2,
};

const PERIODIC_RUNNING_ORD: Record<string, number> = {
  'predominantly periodic': 0,
  'mixed': 1,
  'predominantly running': 2,
};

const VOICE_ORD: Record<string, number> = {
  'unvoiced': 0,
  'moderate voice': 1,
  'strongly voiced': 2,
};

const REGISTER_ORD: Record<string, number> = {
  'low': 0,
  'middle': 1,
  'mixed': 1.5,
  'high': 2,
};

const OPACITY_ORD: Record<string, number> = {
  'transparent': 0,
  'mixed opacity': 1,
  'opaque': 2,
};

// Map axis name to its ordinal mapping and continuous score field
const AXIS_CONFIG: Record<string, {
  ordMap: Record<string, number>;
  goldKey: keyof GoldEntry['labels'];
  predKey: keyof LanhamProseMetrics['labels'];
  scoreField: keyof LanhamProseMetrics;
  tier: 'hard' | 'firm' | 'soft' | 'informational';
  monotonicityTarget: number;
}> = {
  nounVerb: {
    ordMap: NOUN_VERB_ORD,
    goldKey: 'nounVerb',
    predKey: 'nounVerb',
    scoreField: 'nounVerbRatio',
    tier: 'hard',
    monotonicityTarget: 0.85,
  },
  parataxisHypotaxis: {
    ordMap: PARA_HYPO_ORD,
    goldKey: 'parataxisHypotaxis',
    predKey: 'parataxisHypotaxis',
    scoreField: 'parataxisHypotaxisRatio',
    tier: 'soft',
    monotonicityTarget: 0.70,
  },
  periodicRunning: {
    ordMap: PERIODIC_RUNNING_ORD,
    goldKey: 'periodicRunning',
    predKey: 'periodicRunning',
    scoreField: 'periodicRunningRatio',
    tier: 'informational',
    monotonicityTarget: 0.65,
  },
  voice: {
    ordMap: VOICE_ORD,
    goldKey: 'voice',
    predKey: 'voice',
    scoreField: 'voiceScore',
    tier: 'firm',
    monotonicityTarget: 0.75,
  },
  register: {
    ordMap: REGISTER_ORD,
    goldKey: 'primaryRegister',
    predKey: 'primaryRegister',
    scoreField: 'latinateGermanicRatio',
    tier: 'hard',
    monotonicityTarget: 0.85,
  },
  opacity: {
    ordMap: OPACITY_ORD,
    goldKey: 'opacity',
    predKey: 'opacity',
    scoreField: 'opacityScore',
    tier: 'soft',
    monotonicityTarget: 0.70,
  },
};

// ── Statistical helpers ───────────────────────────────────────────────────────

/** Spearman rank correlation coefficient */
function spearmanRho(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;

  function rank(arr: number[]): number[] {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j < n - 1 && sorted[j + 1].v === sorted[j].v) j++;
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) {
        ranks[sorted[k].i] = avgRank;
      }
      i = j + 1;
    }
    return ranks;
  }

  const rx = rank(x);
  const ry = rank(y);
  const dSq = rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0);
  return 1 - (6 * dSq) / (n * (n * n - 1));
}

// ── Load gold set and run analyses ────────────────────────────────────────────

const GOLD_SET_PATH = resolve(__dirname, 'lanham-gold-set.jsonl');

let goldEntries: GoldEntry[] = [];
let results: AnalysisResult[] = [];

// Genre group definitions
const GENRE_GROUPS: Record<string, string[]> = {
  'Academic Humanities': ['academic-humanities'],
  'Academic Social Science': ['academic-social-science'],
  'Legal': ['legal'],
  'Journalism': ['journalism'],
  'Narrative/Memoir': ['narrative'],
  'Technical': ['technical'],
  'Marketing': ['marketing'],
  'Polemical': ['polemical'],
  'Lanham Anchors': ['lanham-anchor'],
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('Lanham Calibration Suite', () => {
  const analyzer = new LanhamProseAnalyzer('general');

  beforeAll(async () => {
    // Load gold set
    const raw = readFileSync(GOLD_SET_PATH, 'utf-8');
    goldEntries = raw
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line) as GoldEntry);

    // Run analysis on all entries
    results = await Promise.all(
      goldEntries.map(async (entry) => ({
        entry,
        metrics: await analyzer.fullAnalysis(entry.text),
      })),
    );
  });

  // ── Per-genre-group tests ─────────────────────────────────────────────────

  for (const [groupName, genreTags] of Object.entries(GENRE_GROUPS)) {
    describe(`Genre group: ${groupName}`, () => {
      it(`runs analysis on all ${groupName} texts without errors`, () => {
        const groupResults = results.filter(r =>
          genreTags.includes(r.entry.genre),
        );
        expect(groupResults.length).toBeGreaterThan(0);

        for (const { entry, metrics } of groupResults) {
          // Basic sanity: labels exist and are from valid enum sets
          expect(metrics.labels).toBeDefined();
          expect(metrics.labels.nounVerb).toBeDefined();
          expect(metrics.labels.parataxisHypotaxis).toBeDefined();
          expect(metrics.labels.periodicRunning).toBeDefined();
          expect(metrics.labels.voice).toBeDefined();
          expect(metrics.labels.primaryRegister).toBeDefined();
          expect(metrics.labels.opacity).toBeDefined();
        }
      });

      it(`reports per-axis agreement for ${groupName}`, () => {
        const groupResults = results.filter(r =>
          genreTags.includes(r.entry.genre),
        );

        const report: string[] = [`\n  --- ${groupName} (${groupResults.length} texts) ---`];

        for (const { entry, metrics } of groupResults) {
          const mismatches: string[] = [];
          for (const [axisName, cfg] of Object.entries(AXIS_CONFIG)) {
            const goldLabel = entry.labels[cfg.goldKey];
            const predLabel = metrics.labels[cfg.predKey] as string;
            if (goldLabel !== predLabel) {
              mismatches.push(
                `${axisName}: gold="${goldLabel}" pred="${predLabel}"`,
              );
            }
          }
          if (mismatches.length > 0) {
            report.push(`  ${entry.id} (${entry.genre}): ${mismatches.join('; ')}`);
          } else {
            report.push(`  ${entry.id} (${entry.genre}): all axes match`);
          }
        }

        console.log(report.join('\n'));
        // This test always passes — agreement is reported for information
        expect(true).toBe(true);
      });
    });
  }

  // ── Aggregate metrics test ────────────────────────────────────────────────

  describe('Aggregate calibration metrics', () => {
    it('computes per-axis agreement and monotonicity', () => {
      const n = results.length;
      const report: string[] = [
        `\n${'='.repeat(72)}`,
        `  LANHAM CALIBRATION REPORT — ${n} texts`,
        `${'='.repeat(72)}`,
      ];

      const axisResults: Record<string, {
        agreement: number;
        monotonicity: number;
        target: number;
        tier: string;
        mismatches: string[];
      }> = {};

      for (const [axisName, cfg] of Object.entries(AXIS_CONFIG)) {
        // Categorical agreement
        let matchCount = 0;
        const mismatches: string[] = [];

        // Collect ordinal pairs for monotonicity
        const goldOrdinals: number[] = [];
        const predScores: number[] = [];

        for (const { entry, metrics } of results) {
          const goldLabel = entry.labels[cfg.goldKey];
          const predLabel = metrics.labels[cfg.predKey] as string;

          if (goldLabel === predLabel) {
            matchCount++;
          } else {
            mismatches.push(
              `${entry.id}: gold="${goldLabel}" pred="${predLabel}"`,
            );
          }

          // Ordinal from gold label
          const goldOrd = cfg.ordMap[goldLabel];
          if (goldOrd !== undefined) {
            goldOrdinals.push(goldOrd);
            // Continuous score from analyzer
            const score = metrics[cfg.scoreField] as number;
            predScores.push(score ?? 0);
          }
        }

        const agreement = matchCount / n;
        const monotonicity = spearmanRho(goldOrdinals, predScores);

        axisResults[axisName] = {
          agreement,
          monotonicity,
          target: cfg.monotonicityTarget,
          tier: cfg.tier,
          mismatches,
        };

        // Format report line
        const tierLabel = `[${cfg.tier.toUpperCase()}]`.padEnd(16);
        const agrPct = (agreement * 100).toFixed(1).padStart(5) + '%';
        const monStr = monotonicity.toFixed(3).padStart(6);
        const targetStr = cfg.monotonicityTarget.toFixed(2);
        const passStr = monotonicity >= cfg.monotonicityTarget ? 'PASS' : 'BELOW';
        report.push(
          `  ${axisName.padEnd(22)} ${tierLabel} agreement=${agrPct}  monotonicity=${monStr}  target=${targetStr}  ${passStr}`,
        );
      }

      // Mismatches detail
      report.push(`\n  --- Mismatches ---`);
      for (const [axisName, data] of Object.entries(axisResults)) {
        if (data.mismatches.length > 0) {
          report.push(`  ${axisName} (${data.mismatches.length}/${n} wrong):`);
          for (const m of data.mismatches) {
            report.push(`    ${m}`);
          }
        }
      }

      // Summary
      report.push(`\n  --- Summary ---`);
      let allMonoPass = true;
      for (const [axisName, data] of Object.entries(axisResults)) {
        if (data.monotonicity < data.target) {
          report.push(
            `  WARNING: ${axisName} monotonicity ${data.monotonicity.toFixed(3)} below target ${data.target.toFixed(2)} — threshold tuning needed`,
          );
          allMonoPass = false;
        }
      }
      if (allMonoPass) {
        report.push(`  All axes meet monotonicity targets.`);
      }

      report.push(`${'='.repeat(72)}`);
      console.log(report.join('\n'));

      // Informational: report always passes, findings are for tuning
      expect(true).toBe(true);
    });

    // ── Hard constraint: nounVerb monotonicity ──────────────────────────────

    it('nounVerb axis achieves monotonicity target (hard constraint, >0.85)', () => {
      const cfg = AXIS_CONFIG.nounVerb;
      const goldOrdinals: number[] = [];
      const predScores: number[] = [];

      for (const { entry, metrics } of results) {
        const goldOrd = cfg.ordMap[entry.labels[cfg.goldKey]];
        if (goldOrd !== undefined) {
          goldOrdinals.push(goldOrd);
          predScores.push((metrics[cfg.scoreField] as number) ?? 0);
        }
      }

      const mono = spearmanRho(goldOrdinals, predScores);
      console.log(`  nounVerb monotonicity: ${mono.toFixed(3)} (target: ${cfg.monotonicityTarget})`);

      // Hard constraint: enforce monotonicity
      expect(mono).toBeGreaterThanOrEqual(cfg.monotonicityTarget);
    });

    // ── Hard constraint: register monotonicity ──────────────────────────────

    it('register axis achieves monotonicity target (hard constraint, >0.85)', () => {
      const cfg = AXIS_CONFIG.register;
      const goldOrdinals: number[] = [];
      const predScores: number[] = [];

      for (const { entry, metrics } of results) {
        const goldOrd = cfg.ordMap[entry.labels[cfg.goldKey]];
        if (goldOrd !== undefined) {
          goldOrdinals.push(goldOrd);
          predScores.push((metrics[cfg.scoreField] as number) ?? 0);
        }
      }

      const mono = spearmanRho(goldOrdinals, predScores);
      console.log(`  register monotonicity: ${mono.toFixed(3)} (target: ${cfg.monotonicityTarget})`);

      // Hard constraint: enforce monotonicity
      expect(mono).toBeGreaterThanOrEqual(cfg.monotonicityTarget);
    });

    // ── Firm guidance: voice monotonicity ────────────────────────────────────

    it('voice axis achieves monotonicity target (firm guidance, >0.75)', () => {
      const cfg = AXIS_CONFIG.voice;
      const goldOrdinals: number[] = [];
      const predScores: number[] = [];

      for (const { entry, metrics } of results) {
        const goldOrd = cfg.ordMap[entry.labels[cfg.goldKey]];
        if (goldOrd !== undefined) {
          goldOrdinals.push(goldOrd);
          predScores.push((metrics[cfg.scoreField] as number) ?? 0);
        }
      }

      const mono = spearmanRho(goldOrdinals, predScores);
      console.log(`  voice monotonicity: ${mono.toFixed(3)} (target: ${cfg.monotonicityTarget})`);

      // Firm guidance: enforce monotonicity
      expect(mono).toBeGreaterThanOrEqual(cfg.monotonicityTarget);
    });

    // ── Soft observation: parataxis/hypotaxis monotonicity ───────────────────

    it('parataxisHypotaxis axis achieves monotonicity target (soft observation, >0.70)', () => {
      const cfg = AXIS_CONFIG.parataxisHypotaxis;
      const goldOrdinals: number[] = [];
      const predScores: number[] = [];

      for (const { entry, metrics } of results) {
        const goldOrd = cfg.ordMap[entry.labels[cfg.goldKey]];
        if (goldOrd !== undefined) {
          goldOrdinals.push(goldOrd);
          predScores.push((metrics[cfg.scoreField] as number) ?? 0);
        }
      }

      const mono = spearmanRho(goldOrdinals, predScores);
      console.log(`  parataxisHypotaxis monotonicity: ${mono.toFixed(3)} (target: ${cfg.monotonicityTarget})`);

      // Soft observation: enforce monotonicity
      expect(mono).toBeGreaterThanOrEqual(cfg.monotonicityTarget);
    });

    // ── Soft observation: opacity monotonicity ──────────────────────────────

    it('opacity axis achieves monotonicity target (soft observation, >0.70)', () => {
      const cfg = AXIS_CONFIG.opacity;
      const goldOrdinals: number[] = [];
      const predScores: number[] = [];

      for (const { entry, metrics } of results) {
        const goldOrd = cfg.ordMap[entry.labels[cfg.goldKey]];
        if (goldOrd !== undefined) {
          goldOrdinals.push(goldOrd);
          predScores.push((metrics[cfg.scoreField] as number) ?? 0);
        }
      }

      const mono = spearmanRho(goldOrdinals, predScores);
      console.log(`  opacity monotonicity: ${mono.toFixed(3)} (target: ${cfg.monotonicityTarget})`);

      // Soft observation: enforce monotonicity
      expect(mono).toBeGreaterThanOrEqual(cfg.monotonicityTarget);
    });

    // ── Informational: periodic/running monotonicity ────────────────────────

    it('periodicRunning axis reports monotonicity (informational, target >0.65)', () => {
      const cfg = AXIS_CONFIG.periodicRunning;
      const goldOrdinals: number[] = [];
      const predScores: number[] = [];

      for (const { entry, metrics } of results) {
        const goldOrd = cfg.ordMap[entry.labels[cfg.goldKey]];
        if (goldOrd !== undefined) {
          goldOrdinals.push(goldOrd);
          predScores.push((metrics[cfg.scoreField] as number) ?? 0);
        }
      }

      const mono = spearmanRho(goldOrdinals, predScores);
      console.log(`  periodicRunning monotonicity: ${mono.toFixed(3)} (target: ${cfg.monotonicityTarget})`);

      // Informational: explicitly allowed to fail — "directionally useful but not automation-safe"
      // Report but do not enforce
      if (mono < cfg.monotonicityTarget) {
        console.log(`  NOTE: periodicRunning below target — expected, this axis is directionally useful but not automation-safe`);
      }
      expect(true).toBe(true);
    });
  });
});
