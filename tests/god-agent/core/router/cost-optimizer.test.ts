/**
 * Cost Optimizer Tests
 *
 * Tests for Phase 6.3: Cost Optimization Suggestions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  CostOptimizer,
  getCostOptimizer,
  initializeCostOptimizer,
  resetCostOptimizer,
  formatRecommendation,
  formatParetoAnalysis,
  formatOptimizationReport,
} from '../../../../src/god-agent/core/router/cost-optimizer.js';
import { CostTracker, resetCostTracker } from '../../../../src/god-agent/core/router/cost-tracker.js';
import { QualityScorer, resetQualityScorer } from '../../../../src/god-agent/core/router/quality-scorer.js';
import type { TaskType, ProviderType } from '../../../../src/god-agent/core/router/router-types.js';

// Helper to add cost records
function addCostRecords(
  tracker: CostTracker,
  model: string,
  provider: ProviderType,
  taskType: TaskType,
  count: number,
  avgCost: number
): void {
  for (let i = 0; i < count; i++) {
    tracker.recordCost(
      model,
      provider,
      { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      {
        inputCost: avgCost * 0.4,
        outputCost: avgCost * 0.6,
        totalCost: avgCost * (0.8 + Math.random() * 0.4), // Some variance
      },
      taskType
    );
  }
}

// Helper to add quality scores
function addQualityScores(
  scorer: QualityScorer,
  model: string,
  provider: ProviderType,
  taskType: TaskType,
  count: number,
  avgQuality: number
): void {
  for (let i = 0; i < count; i++) {
    const quality = avgQuality + (Math.random() - 0.5) * 0.2; // Some variance
    scorer.recordScore({
      model,
      provider,
      taskType,
      complexity: 'medium',
      responseTime: 1000 + Math.random() * 500,
      tokensUsed: 150,
      userAccepted: quality > 0.5,
      userRating: Math.round(quality * 4 + 1) as 1 | 2 | 3 | 4 | 5,
      testsPass: quality > 0.6,
    });
  }
}

describe('CostOptimizer', () => {
  let optimizer: CostOptimizer;
  let costTracker: CostTracker;
  let qualityScorer: QualityScorer;

  beforeEach(() => {
    resetCostOptimizer();
    resetCostTracker();
    resetQualityScorer();

    costTracker = new CostTracker();
    qualityScorer = new QualityScorer({ enabled: true, minSamplesForStats: 2 });
    optimizer = new CostOptimizer({
      costTracker,
      qualityScorer,
      minSamplesForRecommendation: 5,
    });
  });

  afterEach(() => {
    resetCostOptimizer();
    resetCostTracker();
    resetQualityScorer();
  });

  describe('Initialization', () => {
    it('should create optimizer with default config', () => {
      const opt = new CostOptimizer();
      expect(opt).toBeDefined();
    });

    it('should create optimizer with custom config', () => {
      const opt = new CostOptimizer({
        minSamplesForRecommendation: 20,
        p0SavingsThreshold: 100,
      });
      expect(opt).toBeDefined();
    });

    it('should use singleton pattern', () => {
      resetCostOptimizer();
      const instance1 = getCostOptimizer();
      const instance2 = getCostOptimizer();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with config', () => {
      resetCostOptimizer();
      const instance = initializeCostOptimizer({
        minSamplesForRecommendation: 15,
      });
      expect(instance).toBeDefined();
    });
  });

  describe('Cost-Quality Analysis', () => {
    beforeEach(() => {
      // Add data for multiple models
      addCostRecords(costTracker, 'claude-opus', 'anthropic', 'code_edit', 20, 0.05);
      addCostRecords(costTracker, 'local-awq', 'vllm', 'code_edit', 20, 0.001);
      addCostRecords(costTracker, 'gpt-4o', 'openai', 'code_edit', 20, 0.03);

      addQualityScores(qualityScorer, 'claude-opus', 'anthropic', 'code_edit', 20, 0.95);
      addQualityScores(qualityScorer, 'local-awq', 'vllm', 'code_edit', 20, 0.75);
      addQualityScores(qualityScorer, 'gpt-4o', 'openai', 'code_edit', 20, 0.90);
    });

    it('should collect cost-quality data', () => {
      const data = optimizer.getCostQualityData();

      expect(data.length).toBeGreaterThan(0);
      expect(data.some(d => d.model === 'claude-opus')).toBe(true);
      expect(data.some(d => d.model === 'local-awq')).toBe(true);
    });

    it('should filter by task type', () => {
      const data = optimizer.getCostQualityData('code_edit');

      expect(data.every(d => d.taskType === 'code_edit')).toBe(true);
    });

    it('should calculate cost efficiency', () => {
      const data = optimizer.getCostQualityData();

      for (const item of data) {
        expect(item.costEfficiency).toBeDefined();
        expect(item.costEfficiency).toBeGreaterThan(0);
      }
    });

    it('should group by model', () => {
      const byModel = optimizer.getCostQualityByModel();

      expect(byModel.size).toBeGreaterThan(0);
      expect(byModel.has('claude-opus')).toBe(true);
    });
  });

  describe('Pareto Analysis', () => {
    beforeEach(() => {
      // Create clear Pareto frontier scenario:
      // claude-opus: high cost, high quality (on frontier)
      // local-awq: low cost, lower quality (on frontier)
      // gpt-4o: medium cost, medium quality (potentially dominated)

      addCostRecords(costTracker, 'claude-opus', 'anthropic', 'code_edit', 20, 0.10);
      addQualityScores(qualityScorer, 'claude-opus', 'anthropic', 'code_edit', 20, 0.98);

      addCostRecords(costTracker, 'local-awq', 'vllm', 'code_edit', 20, 0.001);
      addQualityScores(qualityScorer, 'local-awq', 'vllm', 'code_edit', 20, 0.70);

      // This should be dominated (higher cost than local but lower quality than claude)
      addCostRecords(costTracker, 'dominated-model', 'openai', 'code_edit', 20, 0.05);
      addQualityScores(qualityScorer, 'dominated-model', 'openai', 'code_edit', 20, 0.65);
    });

    it('should calculate Pareto frontier', () => {
      const analysis = optimizer.calculateParetoFrontier('code_edit');

      expect(analysis.paretoFrontier.length).toBeGreaterThan(0);
      expect(analysis.allModels.length).toBeGreaterThan(0);
    });

    it('should identify dominated models', () => {
      const analysis = optimizer.calculateParetoFrontier('code_edit');

      // dominated-model should be dominated since local-awq is cheaper with similar quality
      expect(analysis.dominatedModels.some(m => m.model === 'dominated-model')).toBe(true);
    });

    it('should find best value model', () => {
      const analysis = optimizer.calculateParetoFrontier('code_edit');

      expect(analysis.bestValue).toBeDefined();
      expect(analysis.bestValue?.costEfficiency).toBeDefined();
    });

    it('should find highest quality model', () => {
      const analysis = optimizer.calculateParetoFrontier('code_edit');

      expect(analysis.highestQuality).toBeDefined();
      expect(analysis.highestQuality?.model).toBe('claude-opus');
    });

    it('should find lowest cost model', () => {
      const analysis = optimizer.calculateParetoFrontier('code_edit');

      expect(analysis.lowestCost).toBeDefined();
      expect(analysis.lowestCost?.model).toBe('local-awq');
    });

    it('should get all Pareto analyses by task type', () => {
      const analyses = optimizer.getAllParetoAnalyses();

      expect(analyses.size).toBeGreaterThan(0);
      expect(analyses.has('code_edit')).toBe(true);
    });
  });

  describe('Recommendations', () => {
    beforeEach(() => {
      // Set up scenario where recommendations should be generated
      // High cost, medium quality model
      addCostRecords(costTracker, 'expensive-model', 'anthropic', 'code_edit', 15, 0.08);
      addQualityScores(qualityScorer, 'expensive-model', 'anthropic', 'code_edit', 15, 0.80);

      // Low cost, similar quality model
      addCostRecords(costTracker, 'cheap-model', 'vllm', 'code_edit', 15, 0.002);
      addQualityScores(qualityScorer, 'cheap-model', 'vllm', 'code_edit', 15, 0.82);

      // High quality, high cost reference
      addCostRecords(costTracker, 'premium-model', 'anthropic', 'code_edit', 15, 0.15);
      addQualityScores(qualityScorer, 'premium-model', 'anthropic', 'code_edit', 15, 0.98);
    });

    it('should generate recommendations', () => {
      const recommendations = optimizer.generateRecommendations();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should recommend cheaper model with similar quality', () => {
      const recommendations = optimizer.generateRecommendations();

      // Should recommend switching from expensive-model to cheap-model
      const switchRec = recommendations.find(
        r => r.fromModel === 'expensive-model' && r.toModel === 'cheap-model'
      );

      expect(switchRec).toBeDefined();
      expect(switchRec?.monthlySavings).toBeGreaterThan(0);
    });

    it('should sort recommendations by priority', () => {
      const recommendations = optimizer.generateRecommendations();

      if (recommendations.length >= 2) {
        const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
        for (let i = 0; i < recommendations.length - 1; i++) {
          const currentPriority = priorityOrder[recommendations[i].priority];
          const nextPriority = priorityOrder[recommendations[i + 1].priority];
          expect(currentPriority).toBeLessThanOrEqual(nextPriority);
        }
      }
    });

    it('should calculate ROI', () => {
      const recommendations = optimizer.generateRecommendations();

      for (const rec of recommendations) {
        expect(rec.roi).toBeDefined();
        expect(rec.roi).toBeGreaterThan(0);
      }
    });

    it('should include confidence', () => {
      const recommendations = optimizer.generateRecommendations();

      for (const rec of recommendations) {
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should respect quality tolerance', () => {
      const recommendations = optimizer.generateRecommendations();

      for (const rec of recommendations) {
        // Quality impact should not be too negative
        expect(rec.qualityImpact).toBeGreaterThanOrEqual(-0.1);
      }
    });
  });

  describe('Reports', () => {
    beforeEach(() => {
      // Add sample data
      addCostRecords(costTracker, 'model-a', 'anthropic', 'code_edit', 20, 0.05);
      addQualityScores(qualityScorer, 'model-a', 'anthropic', 'code_edit', 20, 0.90);

      addCostRecords(costTracker, 'model-b', 'vllm', 'code_edit', 20, 0.001);
      addQualityScores(qualityScorer, 'model-b', 'vllm', 'code_edit', 20, 0.85);
    });

    it('should generate optimization report', () => {
      const report = optimizer.generateReport();

      expect(report.timestamp).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.paretoByTaskType).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should calculate current monthly cost', () => {
      const report = optimizer.generateReport();

      expect(report.currentMonthlyCost).toBeGreaterThanOrEqual(0);
    });

    it('should calculate potential savings', () => {
      const report = optimizer.generateReport();

      expect(report.totalPotentialSavings).toBeGreaterThanOrEqual(0);
    });

    it('should include summary statistics', () => {
      const report = optimizer.generateReport();

      expect(report.summary.totalModels).toBeGreaterThan(0);
      expect(typeof report.summary.paretoModels).toBe('number');
      expect(typeof report.summary.dominatedModels).toBe('number');
    });

    it('should get quick summary', () => {
      const summary = optimizer.getQuickSummary();

      expect(summary.topRecommendations).toBeDefined();
      expect(summary.totalMonthlySavings).toBeDefined();
      expect(summary.dominatedModelCount).toBeDefined();
    });
  });

  describe('Formatting', () => {
    it('should format recommendation', () => {
      const rec = {
        id: 'test-rec',
        priority: 'P0' as const,
        taskType: 'code_edit' as TaskType,
        fromModel: 'expensive',
        toModel: 'cheap',
        reason: 'Test reason',
        monthlySavings: 50,
        qualityImpact: 0.02,
        latencyImpact: -100,
        confidence: 0.85,
        roi: 60,
        stats: {
          fromCost: 0.05,
          toCost: 0.02,
          fromQuality: 0.90,
          toQuality: 0.92,
          sampleCount: 20,
        },
      };

      const formatted = formatRecommendation(rec);

      expect(formatted).toContain('P0');
      expect(formatted).toContain('expensive');
      expect(formatted).toContain('cheap');
      expect(formatted).toContain('50.00');
    });

    it('should format Pareto analysis', () => {
      // Add data
      addCostRecords(costTracker, 'model-a', 'anthropic', 'code_edit', 10, 0.05);
      addQualityScores(qualityScorer, 'model-a', 'anthropic', 'code_edit', 10, 0.90);

      const analysis = optimizer.calculateParetoFrontier('code_edit');
      const formatted = formatParetoAnalysis(analysis, 'code_edit');

      expect(formatted).toContain('Pareto Analysis');
      expect(formatted).toContain('code_edit');
    });

    it('should format optimization report', () => {
      addCostRecords(costTracker, 'model-a', 'anthropic', 'code_edit', 10, 0.05);
      addQualityScores(qualityScorer, 'model-a', 'anthropic', 'code_edit', 10, 0.90);

      const report = optimizer.generateReport();
      const formatted = formatOptimizationReport(report);

      expect(formatted).toContain('Cost Optimization Report');
      expect(formatted).toContain('Current Monthly Cost');
      expect(formatted).toContain('Potential Savings');
    });
  });

  describe('Edge Cases', () => {
    it('should handle no data', () => {
      const data = optimizer.getCostQualityData();
      expect(data).toHaveLength(0);

      const recommendations = optimizer.generateRecommendations();
      expect(recommendations).toHaveLength(0);
    });

    it('should handle single model', () => {
      addCostRecords(costTracker, 'only-model', 'anthropic', 'code_edit', 10, 0.05);
      addQualityScores(qualityScorer, 'only-model', 'anthropic', 'code_edit', 10, 0.90);

      const analysis = optimizer.calculateParetoFrontier('code_edit');

      expect(analysis.paretoFrontier).toHaveLength(1);
      expect(analysis.dominatedModels).toHaveLength(0);
    });

    it('should handle insufficient samples', () => {
      // Add very few samples
      addCostRecords(costTracker, 'model-a', 'anthropic', 'code_edit', 2, 0.05);
      addQualityScores(qualityScorer, 'model-a', 'anthropic', 'code_edit', 2, 0.90);

      addCostRecords(costTracker, 'model-b', 'vllm', 'code_edit', 2, 0.001);
      addQualityScores(qualityScorer, 'model-b', 'vllm', 'code_edit', 2, 0.85);

      const recommendations = optimizer.generateRecommendations();

      // Should not generate recommendations with too few samples
      expect(recommendations).toHaveLength(0);
    });

    it('should handle equal cost models', () => {
      addCostRecords(costTracker, 'model-a', 'anthropic', 'code_edit', 10, 0.05);
      addQualityScores(qualityScorer, 'model-a', 'anthropic', 'code_edit', 10, 0.90);

      addCostRecords(costTracker, 'model-b', 'openai', 'code_edit', 10, 0.05);
      addQualityScores(qualityScorer, 'model-b', 'openai', 'code_edit', 10, 0.85);

      const analysis = optimizer.calculateParetoFrontier('code_edit');

      // Model with higher quality should be on frontier
      expect(analysis.paretoFrontier.some(m => m.model === 'model-a')).toBe(true);
    });

    it('should handle multiple task types', () => {
      addCostRecords(costTracker, 'model-a', 'anthropic', 'code_edit', 10, 0.05);
      addQualityScores(qualityScorer, 'model-a', 'anthropic', 'code_edit', 10, 0.90);

      addCostRecords(costTracker, 'model-a', 'anthropic', 'code_write', 10, 0.06);
      addQualityScores(qualityScorer, 'model-a', 'anthropic', 'code_write', 10, 0.88);

      const analyses = optimizer.getAllParetoAnalyses();

      expect(analyses.size).toBe(2);
      expect(analyses.has('code_edit')).toBe(true);
      expect(analyses.has('code_write')).toBe(true);
    });
  });
});
