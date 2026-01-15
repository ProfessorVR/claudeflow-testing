/**
 * Finance Analyzer - Public API
 *
 * A comprehensive personal finance transaction analysis module for AMEX data.
 *
 * @example
 * ```typescript
 * import { TransactionLoader, TransactionSearchEngine, Aggregator } from './finance-analyzer';
 *
 * const loader = new TransactionLoader({ basePath: process.cwd() });
 * const transactions = await loader.loadAll();
 *
 * const searchEngine = new TransactionSearchEngine();
 * searchEngine.setTransactions(transactions);
 * const result = searchEngine.search({ searchText: 'Amazon' });
 * ```
 */

// Types
export * from './types/index.js';

// Loader
export {
  TransactionLoader,
  CategoryMapper,
  parseAMEXCSV,
  parseAMEXDirectory,
  type ILoaderOptions,
  type IParseResult
} from './loader/index.js';

// Analysis
export {
  TransactionSearchEngine,
  Aggregator,
  AnomalyDetector,
  PatternAnalyzer,
  type ISearchOptions,
  type ISearchResult
} from './analysis/index.js';

// God Agent Integration
export { FinanceQueryHandler } from './god-integration/index.js';

// CLI Formatters
export {
  formatTransactionsTable,
  formatTransactionsJSON,
  formatTransactionsCSV,
  formatCategoryTable,
  formatCategoryJSON,
  formatMonthlySummaryTable,
  formatMonthlySummaryJSON,
  formatAnomaliesTable,
  formatAnomaliesJSON,
  formatSummaryBox
} from './cli/index.js';
