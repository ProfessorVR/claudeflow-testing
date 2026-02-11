/**
 * StatsCollector - Aggregate learning statistics and status
 *
 * Extracted from UniversalAgent (Tranche E-04, SEAM-11).
 * Read-only aggregation, zero side effects.
 */

import type { UnifiedLearningStats } from './universal-agent.js';

export interface StatsDataSources {
  getInteractionStoreStats: () => {
    totalInteractions: number;
    knowledgeCount: number;
    highQualityCount: number;
    oldestInteraction: number | null;
    newestInteraction: number | null;
  };
  getSuccessfulPatterns: () => Map<string, number>;
  getDomainExpertise: () => Map<string, number>;
  getSonaEngine: () => unknown;
  log: (message: string) => void;
}

/**
 * Collect comprehensive learning statistics from multiple data sources.
 */
export function collectStats(sources: StatsDataSources): UnifiedLearningStats {
  const storeStats = sources.getInteractionStoreStats();

  // Get top patterns (sorted by usage)
  const patternArray = Array.from(sources.getSuccessfulPatterns().entries())
    .map(([id, count]) => ({ id, uses: count }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 10);

  const stats: UnifiedLearningStats = {
    totalInteractions: storeStats.totalInteractions,
    knowledgeEntries: storeStats.knowledgeCount,
    domainExpertise: Object.fromEntries(sources.getDomainExpertise()),
    topPatterns: patternArray,
    persistenceStats: {
      highQualityCount: storeStats.highQualityCount,
      oldestInteraction: storeStats.oldestInteraction,
      newestInteraction: storeStats.newestInteraction,
      lastSaved: new Date().toISOString(),
    },
  };

  // Add SonaEngine metrics if available
  try {
    const sonaEngineRaw = sources.getSonaEngine();
    if (sonaEngineRaw) {
      const sonaEngine = sonaEngineRaw as { getStats: () => { routeCount: number }; getMetrics: () => Record<string, unknown> };
      const sonaStats = sonaEngine.getStats();
      const metrics = sonaEngine.getMetrics();

      stats.sonaMetrics = {
        totalTrajectories: (metrics as Record<string, number>).totalTrajectories,
        totalRoutes: sonaStats.routeCount,
        averageQualityByRoute: (metrics as Record<string, Record<string, number>>).averageQualityByRoute || {},
        improvementPercentage: (metrics as Record<string, Record<string, number>>).improvementPercentage || {},
        currentDrift: (metrics as Record<string, number>).currentDrift || 0,
      };

      // Calculate learning effectiveness
      stats.learningEffectiveness = calculateLearningEffectiveness(sonaEngineRaw);
    }
  } catch (error) {
    // SonaEngine not available or error - continue without
    sources.log(`SonaEngine metrics unavailable: ${error}`);
  }

  return stats;
}

/**
 * Calculate learning effectiveness (G3 requirement: 10-30% improvement)
 */
export function calculateLearningEffectiveness(sonaEngine: unknown): UnifiedLearningStats['learningEffectiveness'] {
  try {
    // Cast to access methods (SonaEngine type might not be exported)
    const engine = sonaEngine as {
      listTrajectories: (route?: string) => Array<{ quality?: number; timestamp: number }>;
    };

    // Get all trajectories with quality scores, sorted by timestamp
    const allTrajectories = engine.listTrajectories()
      .filter(t => t.quality !== undefined)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (allTrajectories.length < 20) {
      return undefined; // Not enough data yet
    }

    const qualities = allTrajectories.map(t => t.quality!);
    const sampleSize = Math.min(20, Math.floor(qualities.length / 2));

    // First N trajectories (baseline)
    const baseline = qualities.slice(0, sampleSize);
    const baselineAvg = baseline.reduce((a, b) => a + b, 0) / baseline.length;

    // Last N trajectories (learned)
    const learned = qualities.slice(-sampleSize);
    const learnedAvg = learned.reduce((a, b) => a + b, 0) / learned.length;

    // Calculate improvement
    const improvementPct = baselineAvg > 0
      ? ((learnedAvg - baselineAvg) / baselineAvg) * 100
      : 0;

    return {
      baselineQuality: Math.round(baselineAvg * 1000) / 1000,
      learnedQuality: Math.round(learnedAvg * 1000) / 1000,
      improvementPct: Math.round(improvementPct * 10) / 10,
      sampleSize: sampleSize * 2,
    };
  } catch {
    // INTENTIONAL: Learning metrics calculation is optional - undefined signals unavailable metrics
    return undefined;
  }
}
