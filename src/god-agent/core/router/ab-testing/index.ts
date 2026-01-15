/**
 * A/B Testing Module
 *
 * Implements Phase 6.2: A/B Testing Between Models
 *
 * Provides:
 * - Experiment lifecycle management
 * - Paired test execution
 * - Statistical significance testing
 * - Effect size calculation
 */

// Types
export * from './types.js';

// Statistical analysis
export {
  StatisticalAnalyzer,
  getStatisticalAnalyzer,
  initializeStatisticalAnalyzer,
  resetStatisticalAnalyzer,
} from './statistical-analyzer.js';

// Experiment management
export {
  ExperimentManager,
  getExperimentManager,
  initializeExperimentManager,
  resetExperimentManager,
} from './experiment-manager.js';
