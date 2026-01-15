#!/usr/bin/env node
/**
 * Finance Analyzer CLI
 *
 * Usage:
 *   npx tsx src/finance-analyzer/cli/finance-cli.ts search --merchant "Amazon"
 *   npx tsx src/finance-analyzer/cli/finance-cli.ts summary --month 2025-01
 *   npx tsx src/finance-analyzer/cli/finance-cli.ts categories
 *   npx tsx src/finance-analyzer/cli/finance-cli.ts anomalies
 *   npx tsx src/finance-analyzer/cli/finance-cli.ts top --by amount --limit 10
 */

import { Command } from 'commander';
import * as path from 'path';
import { TransactionLoader } from '../loader/index.js';
import {
  TransactionSearchEngine,
  Aggregator,
  AnomalyDetector,
  PatternAnalyzer
} from '../analysis/index.js';
import {
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
} from './formatters.js';
import type { ITransactionFilter } from '../types/index.js';

// Determine base path (project root)
const basePath = process.cwd();

// Initialize loader
const loader = new TransactionLoader({ basePath });

// Parse date string to Date
function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    // YYYY-MM format - use first day of month
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  }
  return new Date(dateStr);
}

// Parse end date (end of month if only YYYY-MM)
function parseEndDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    // YYYY-MM format - use last day of month
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    return new Date(year, month, 0); // 0 = last day of previous month
  }
  return new Date(dateStr);
}

const program = new Command();

program
  .name('finance')
  .description('AMEX Transaction Analysis CLI')
  .version('1.0.0');

// Search command
program
  .command('search')
  .description('Search transactions')
  .option('-m, --merchant <text>', 'Search merchant/description')
  .option('-c, --category <name>', 'Filter by custom category')
  .option('--amex-category <name>', 'Filter by AMEX category')
  .option('--start <date>', 'Start date (YYYY-MM-DD or YYYY-MM)')
  .option('--end <date>', 'End date (YYYY-MM-DD or YYYY-MM)')
  .option('--min <amount>', 'Minimum amount', parseFloat)
  .option('--max <amount>', 'Maximum amount', parseFloat)
  .option('--credits', 'Only show credits/refunds')
  .option('--charges', 'Only show charges')
  .option('-l, --limit <n>', 'Limit results', parseInt)
  .option('--sort <field>', 'Sort by: date, amount, description, category')
  .option('--order <dir>', 'Sort order: asc, desc')
  .option('--json', 'Output as JSON')
  .option('--csv', 'Output as CSV')
  .option('--extended', 'Show extended details')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const searchEngine = new TransactionSearchEngine();
      searchEngine.setTransactions(loader.getTransactions());

      const filter: ITransactionFilter = {};
      if (options.merchant) filter.searchText = options.merchant;
      if (options.category) filter.customCategories = [options.category];
      if (options.amexCategory) filter.amexCategories = [options.amexCategory];
      if (options.start) filter.startDate = parseDate(options.start);
      if (options.end) filter.endDate = parseEndDate(options.end);
      if (options.min !== undefined) filter.minAmount = options.min;
      if (options.max !== undefined) filter.maxAmount = options.max;
      if (options.credits) filter.creditsOnly = true;
      if (options.charges) filter.chargesOnly = true;

      const result = searchEngine.search(filter, {
        sortBy: options.sort,
        sortOrder: options.order,
        limit: options.limit
      });

      console.log(`Found ${result.totalCount} transactions${options.limit ? ` (showing ${result.transactions.length})` : ''}:\n`);

      if (options.json) {
        console.log(formatTransactionsJSON(result.transactions));
      } else if (options.csv) {
        console.log(formatTransactionsCSV(result.transactions));
      } else {
        console.log(formatTransactionsTable(result.transactions, options.extended));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Summary command
program
  .command('summary')
  .description('Generate spending summary')
  .option('--month <YYYY-MM>', 'Specific month')
  .option('--year <YYYY>', 'Specific year')
  .option('--start <date>', 'Start date')
  .option('--end <date>', 'End date')
  .option('--by-category', 'Include category breakdown')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const aggregator = new Aggregator();
      aggregator.setTransactions(loader.getTransactions());

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (options.month) {
        startDate = parseDate(options.month);
        endDate = parseEndDate(options.month);
      } else if (options.year) {
        startDate = new Date(parseInt(options.year), 0, 1);
        endDate = new Date(parseInt(options.year), 11, 31);
      } else if (options.start || options.end) {
        if (options.start) startDate = parseDate(options.start);
        if (options.end) endDate = parseEndDate(options.end);
      }

      const report = aggregator.generateReport(startDate, endDate);

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatSummaryBox({
          ...report.summary,
          dateRange: report.dateRange
        }));

        if (options.month) {
          console.log('\n');
        } else {
          console.log('\nMonthly Breakdown:\n');
          console.log(formatMonthlySummaryTable(report.monthly));
        }

        if (options.byCategory) {
          console.log('\nCategory Breakdown:\n');
          console.log(formatCategoryTable(report.byCustomCategory));
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Categories command
program
  .command('categories')
  .description('List all categories with spending')
  .option('--amex', 'Show AMEX categories instead of custom')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const aggregator = new Aggregator();
      aggregator.setTransactions(loader.getTransactions());

      const report = aggregator.generateReport();
      const categories = options.amex
        ? report.byAMEXCategory
        : report.byCustomCategory;

      if (options.json) {
        console.log(formatCategoryJSON(categories));
      } else {
        console.log(options.amex ? 'AMEX Categories:\n' : 'Custom Categories:\n');
        console.log(formatCategoryTable(categories));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Anomalies command
program
  .command('anomalies')
  .description('Detect unusual transactions')
  .option('--type <type>', 'Filter by type: duplicate, unusual_amount, potential_fraud')
  .option('--severity <level>', 'Filter by severity: low, medium, high')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const detector = new AnomalyDetector();
      let anomalies = detector.detect(loader.getTransactions());

      if (options.type) {
        anomalies = anomalies.filter((a) => a.type === options.type);
      }
      if (options.severity) {
        anomalies = anomalies.filter((a) => a.severity === options.severity);
      }

      console.log(`Found ${anomalies.length} anomalies:\n`);

      if (options.json) {
        console.log(formatAnomaliesJSON(anomalies));
      } else {
        console.log(formatAnomaliesTable(anomalies));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Patterns command
program
  .command('patterns')
  .description('Detect spending patterns')
  .option('--type <type>', 'Filter by type: recurring, seasonal, increasing, decreasing')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const analyzer = new PatternAnalyzer();
      let patterns = analyzer.analyze(loader.getTransactions());

      if (options.type) {
        patterns = patterns.filter((p) => p.type === options.type);
      }

      console.log(`Found ${patterns.length} patterns:\n`);

      if (options.json) {
        console.log(JSON.stringify(patterns, null, 2));
      } else {
        for (const p of patterns) {
          console.log(`[${p.type.toUpperCase()}] ${p.description} (confidence: ${(p.confidence * 100).toFixed(0)}%)`);
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Top command
program
  .command('top')
  .description('Show top transactions/categories/merchants')
  .option('--by <field>', 'Rank by: amount, count, merchant', 'amount')
  .option('-l, --limit <n>', 'Number of results', parseInt, 10)
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const aggregator = new Aggregator();
      aggregator.setTransactions(loader.getTransactions());
      const searchEngine = new TransactionSearchEngine();
      searchEngine.setTransactions(loader.getTransactions());

      if (options.by === 'merchant') {
        const merchants = aggregator.getTopMerchants(
          loader.getTransactions(),
          options.limit
        );

        console.log(`Top ${options.limit} Merchants by Spending:\n`);

        if (options.json) {
          console.log(JSON.stringify(merchants, null, 2));
        } else {
          console.log('Merchant                       | Total      | Count');
          console.log('-'.repeat(55));
          for (const m of merchants) {
            const merchant = m.merchant.substring(0, 30).padEnd(30);
            const total = '$' + m.total.toFixed(2).padStart(9);
            const count = m.count.toString().padStart(5);
            console.log(`${merchant} | ${total} | ${count}`);
          }
        }
      } else if (options.by === 'count') {
        const report = aggregator.generateReport();
        const categories = [...report.byCustomCategory].sort(
          (a, b) => b.count - a.count
        ).slice(0, options.limit);

        console.log(`Top ${options.limit} Categories by Transaction Count:\n`);

        if (options.json) {
          console.log(formatCategoryJSON(categories));
        } else {
          console.log(formatCategoryTable(categories));
        }
      } else {
        // Default: top transactions by amount
        const result = searchEngine.search(
          { chargesOnly: true },
          { sortBy: 'amount', sortOrder: 'desc', limit: options.limit }
        );

        console.log(`Top ${options.limit} Transactions by Amount:\n`);

        if (options.json) {
          console.log(formatTransactionsJSON(result.transactions));
        } else {
          console.log(formatTransactionsTable(result.transactions));
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Trend command
program
  .command('trend')
  .description('Show spending trends over time')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const aggregator = new Aggregator();
      aggregator.setTransactions(loader.getTransactions());

      const trend = aggregator.getSpendingTrend();

      console.log('Spending Trend (Month over Month):\n');

      if (options.json) {
        console.log(JSON.stringify(trend, null, 2));
      } else {
        console.log('Month    | Spending   | Change     | Change %');
        console.log('-'.repeat(50));
        for (const t of trend) {
          const month = t.month;
          const spending = '$' + t.spending.toFixed(2).padStart(9);
          const change = (t.change >= 0 ? '+$' : '-$') +
            Math.abs(t.change).toFixed(2).padStart(8);
          const changePercent = (t.changePercent >= 0 ? '+' : '') +
            t.changePercent.toFixed(1).padStart(6) + '%';
          console.log(`${month} | ${spending} | ${change} | ${changePercent}`);
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show overall statistics')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await loader.loadAll();
      const stats = loader.getStats();

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(formatSummaryBox({
          totalSpending: stats.totalSpending,
          totalCredits: stats.totalCredits,
          netAmount: stats.totalSpending - stats.totalCredits,
          transactionCount: stats.totalTransactions,
          averageTransaction: stats.totalTransactions > 0
            ? stats.totalSpending / stats.totalTransactions
            : 0,
          uniqueMerchants: stats.uniqueMerchants,
          dateRange: stats.dateRange
        }));
        console.log(`\nUnique Categories: ${stats.uniqueCategories}`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
