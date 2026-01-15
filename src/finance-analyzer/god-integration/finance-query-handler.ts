/**
 * Finance Query Handler for God Agent Integration
 * Interprets natural language queries about personal finances
 */

import { TransactionLoader } from '../loader/index.js';
import {
  TransactionSearchEngine,
  Aggregator,
  AnomalyDetector,
  PatternAnalyzer
} from '../analysis/index.js';
import type {
  ITransaction,
  IFinanceQueryResult,
  ITransactionFilter
} from '../types/index.js';

/**
 * Query intent classification
 */
type QueryIntent =
  | 'search'
  | 'summary'
  | 'category_breakdown'
  | 'comparison'
  | 'anomaly'
  | 'top_spending'
  | 'trend'
  | 'pattern'
  | 'general';

interface IParsedQuery {
  intent: QueryIntent;
  entities: {
    dateRange?: { start?: Date; end?: Date };
    month?: string;
    year?: number;
    merchants?: string[];
    categories?: string[];
    amounts?: { min?: number; max?: number };
    limit?: number;
  };
  originalQuery: string;
}

/**
 * Finance query handler for natural language queries
 */
export class FinanceQueryHandler {
  private loader: TransactionLoader;
  private searchEngine: TransactionSearchEngine;
  private aggregator: Aggregator;
  private anomalyDetector: AnomalyDetector;
  private patternAnalyzer: PatternAnalyzer;
  private initialized = false;

  constructor(basePath: string = process.cwd()) {
    this.loader = new TransactionLoader({ basePath });
    this.searchEngine = new TransactionSearchEngine();
    this.aggregator = new Aggregator();
    this.anomalyDetector = new AnomalyDetector();
    this.patternAnalyzer = new PatternAnalyzer();
  }

  /**
   * Initialize by loading all transactions
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const transactions = await this.loader.loadAll();
    this.searchEngine.setTransactions(transactions);
    this.aggregator.setTransactions(transactions);
    this.initialized = true;
  }

  /**
   * Handle a natural language finance query
   */
  async handleQuery(query: string): Promise<IFinanceQueryResult> {
    await this.initialize();

    const parsed = this.parseQuery(query);

    switch (parsed.intent) {
      case 'search':
        return this.handleSearchQuery(parsed);
      case 'summary':
        return this.handleSummaryQuery(parsed);
      case 'category_breakdown':
        return this.handleCategoryQuery(parsed);
      case 'anomaly':
        return this.handleAnomalyQuery(parsed);
      case 'top_spending':
        return this.handleTopSpendingQuery(parsed);
      case 'trend':
        return this.handleTrendQuery(parsed);
      case 'pattern':
        return this.handlePatternQuery(parsed);
      case 'comparison':
        return this.handleComparisonQuery(parsed);
      default:
        return this.handleGeneralQuery(parsed);
    }
  }

  /**
   * Parse natural language query to structured intent
   */
  private parseQuery(query: string): IParsedQuery {
    const lower = query.toLowerCase();

    // Intent detection
    let intent: QueryIntent = 'general';

    if (/how much|total|spent|spending|summary/.test(lower)) {
      intent = 'summary';
    } else if (/categor|breakdown|by type|by category/.test(lower)) {
      intent = 'category_breakdown';
    } else if (/unusual|anomal|duplicate|suspicious|fraud|weird|strange/.test(lower)) {
      intent = 'anomaly';
    } else if (/top|highest|most|largest|biggest|expensive/.test(lower)) {
      intent = 'top_spending';
    } else if (/trend|over time|month.to.month|change/.test(lower)) {
      intent = 'trend';
    } else if (/pattern|recurring|subscription|repeat/.test(lower)) {
      intent = 'pattern';
    } else if (/compare|versus|vs|difference/.test(lower)) {
      intent = 'comparison';
    } else if (/find|show|list|search|where|what/.test(lower)) {
      intent = 'search';
    }

    // Entity extraction
    const entities: IParsedQuery['entities'] = {};

    // Month extraction
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthMatch = lower.match(
      new RegExp(`(${monthNames.join('|')})(?:\\s*(\\d{4}))?`, 'i')
    );
    if (monthMatch) {
      const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase()) + 1;
      const year = monthMatch[2] ? parseInt(monthMatch[2]) : new Date().getFullYear();
      entities.month = `${year}-${monthIndex.toString().padStart(2, '0')}`;
    }

    // Year extraction
    const yearMatch = lower.match(/\b(20\d{2})\b/);
    if (yearMatch && !monthMatch) {
      entities.year = parseInt(yearMatch[1]);
    }

    // Last month / this month
    if (/last month/.test(lower)) {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      entities.month = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    } else if (/this month/.test(lower)) {
      const now = new Date();
      entities.month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    // Category extraction
    const knownCategories = [
      'dining', 'groceries', 'shopping', 'entertainment', 'travel',
      'subscriptions', 'electronics', 'clothing', 'health', 'auto',
      'transportation', 'online shopping', 'dining out'
    ];
    for (const cat of knownCategories) {
      if (lower.includes(cat)) {
        entities.categories = entities.categories || [];
        // Normalize category names
        const normalized = cat === 'dining' ? 'Dining Out' :
          cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        entities.categories.push(normalized);
      }
    }

    // Merchant extraction (common merchants)
    const merchants = ['amazon', 'apple', 'steam', 'paypal', 'google', 'netflix', 'spotify'];
    const foundMerchants = merchants.filter((m) => lower.includes(m));
    if (foundMerchants.length) {
      entities.merchants = foundMerchants;
    }

    // Amount extraction
    const amountMatch = lower.match(/\$(\d+(?:\.\d{2})?)/g);
    if (amountMatch) {
      const amounts = amountMatch.map((a) => parseFloat(a.replace('$', '')));
      if (amounts.length === 1) {
        if (/over|more than|above|greater/.test(lower)) {
          entities.amounts = { min: amounts[0] };
        } else if (/under|less than|below/.test(lower)) {
          entities.amounts = { max: amounts[0] };
        }
      } else if (amounts.length >= 2) {
        entities.amounts = { min: Math.min(...amounts), max: Math.max(...amounts) };
      }
    }

    // Limit extraction
    const limitMatch = lower.match(/top\s*(\d+)|(\d+)\s*(?:transactions?|items?)/);
    if (limitMatch) {
      entities.limit = parseInt(limitMatch[1] || limitMatch[2]);
    }

    return { intent, entities, originalQuery: query };
  }

  private async handleSearchQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const filter: ITransactionFilter = {};

    if (parsed.entities.merchants?.length) {
      filter.searchText = parsed.entities.merchants[0];
    }
    if (parsed.entities.categories?.length) {
      filter.customCategories = parsed.entities.categories;
    }
    if (parsed.entities.month) {
      const [year, month] = parsed.entities.month.split('-').map(Number);
      filter.startDate = new Date(year, month - 1, 1);
      filter.endDate = new Date(year, month, 0);
    }
    if (parsed.entities.amounts) {
      filter.minAmount = parsed.entities.amounts.min;
      filter.maxAmount = parsed.entities.amounts.max;
    }

    const result = this.searchEngine.search(filter, {
      limit: parsed.entities.limit || 10,
      sortBy: 'date',
      sortOrder: 'desc'
    });

    const total = result.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      query: parsed.originalQuery,
      response: `Found ${result.totalCount} transactions totaling $${total.toFixed(2)}. ` +
        `Showing the most recent ${result.transactions.length}.`,
      data: {
        transactions: result.transactions,
        summary: {
          transactionCount: result.totalCount,
          totalSpending: total
        }
      },
      confidence: 0.85
    };
  }

  private async handleSummaryQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (parsed.entities.month) {
      const [year, month] = parsed.entities.month.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else if (parsed.entities.year) {
      startDate = new Date(parsed.entities.year, 0, 1);
      endDate = new Date(parsed.entities.year, 11, 31);
    }

    const report = this.aggregator.generateReport(startDate, endDate);

    let periodDesc = 'all time';
    if (parsed.entities.month) {
      const [year, month] = parsed.entities.month.split('-');
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      periodDesc = `${monthNames[parseInt(month)]} ${year}`;
    } else if (parsed.entities.year) {
      periodDesc = parsed.entities.year.toString();
    }

    return {
      query: parsed.originalQuery,
      response: `In ${periodDesc}, you spent $${report.summary.totalSpending.toFixed(2)} across ${report.summary.transactionCount} transactions. ` +
        `Average transaction: $${report.summary.averageTransaction.toFixed(2)}. ` +
        `You received $${report.summary.totalCredits.toFixed(2)} in credits/refunds.`,
      data: {
        summary: report.summary,
        categories: report.byCustomCategory.slice(0, 5)
      },
      confidence: 0.9
    };
  }

  private async handleCategoryQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const report = this.aggregator.generateReport();
    const categories = report.byCustomCategory;

    const topCategories = categories.slice(0, 5);
    const categoryList = topCategories
      .map((c) => `${c.category}: $${c.total.toFixed(2)} (${c.percentage.toFixed(1)}%)`)
      .join(', ');

    return {
      query: parsed.originalQuery,
      response: `Your spending by category: ${categoryList}`,
      data: {
        categories: categories
      },
      confidence: 0.9
    };
  }

  private async handleAnomalyQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const anomalies = this.anomalyDetector.detect(this.loader.getTransactions());

    if (anomalies.length === 0) {
      return {
        query: parsed.originalQuery,
        response: 'No unusual transactions or anomalies detected in your spending history.',
        data: { anomalies: [] },
        confidence: 0.8
      };
    }

    const highSeverity = anomalies.filter((a) => a.severity === 'high');
    const summary = highSeverity.length > 0
      ? `Found ${highSeverity.length} high-severity anomalies and ${anomalies.length - highSeverity.length} other concerns.`
      : `Found ${anomalies.length} potential anomalies to review.`;

    const topAnomalies = anomalies.slice(0, 3);
    const details = topAnomalies.map((a) => a.description).join(' | ');

    return {
      query: parsed.originalQuery,
      response: `${summary} Top concerns: ${details}`,
      data: { anomalies },
      confidence: 0.75
    };
  }

  private async handleTopSpendingQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const limit = parsed.entities.limit || 5;
    const result = this.searchEngine.search(
      { chargesOnly: true },
      { sortBy: 'amount', sortOrder: 'desc', limit }
    );

    const total = result.transactions.reduce((sum, t) => sum + t.amount, 0);
    const topList = result.transactions
      .map((t) => `${t.description}: $${t.amount.toFixed(2)} (${t.dateString})`)
      .join(', ');

    return {
      query: parsed.originalQuery,
      response: `Your top ${limit} largest transactions (totaling $${total.toFixed(2)}): ${topList}`,
      data: {
        transactions: result.transactions,
        summary: { totalSpending: total, transactionCount: result.totalCount }
      },
      confidence: 0.9
    };
  }

  private async handleTrendQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const trend = this.aggregator.getSpendingTrend();

    if (trend.length < 2) {
      return {
        query: parsed.originalQuery,
        response: 'Not enough data to analyze spending trends.',
        data: {},
        confidence: 0.5
      };
    }

    const recent = trend.slice(-3);
    const avgChange = recent.reduce((sum, t) => sum + t.changePercent, 0) / recent.length;
    const direction = avgChange > 5 ? 'increasing' : avgChange < -5 ? 'decreasing' : 'stable';

    const trendDesc = recent
      .map((t) => `${t.month}: $${t.spending.toFixed(0)} (${t.changePercent >= 0 ? '+' : ''}${t.changePercent.toFixed(1)}%)`)
      .join(', ');

    return {
      query: parsed.originalQuery,
      response: `Your spending is ${direction}. Recent months: ${trendDesc}`,
      data: {},
      confidence: 0.8
    };
  }

  private async handlePatternQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const patterns = this.patternAnalyzer.analyze(this.loader.getTransactions());
    const recurring = patterns.filter((p) => p.type === 'recurring');

    if (recurring.length === 0) {
      return {
        query: parsed.originalQuery,
        response: 'No clear recurring charges or subscription patterns detected.',
        data: {},
        confidence: 0.7
      };
    }

    const patternList = recurring.slice(0, 5).map((p) => p.description).join('; ');

    return {
      query: parsed.originalQuery,
      response: `Found ${recurring.length} recurring patterns: ${patternList}`,
      data: {},
      confidence: 0.8
    };
  }

  private async handleComparisonQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const summaries = this.aggregator.generateMonthlySummaries();

    if (summaries.length < 2) {
      return {
        query: parsed.originalQuery,
        response: 'Not enough monthly data for comparison.',
        data: {},
        confidence: 0.5
      };
    }

    const [current, previous] = summaries;
    const diff = current.totalSpending - previous.totalSpending;
    const percentChange = previous.totalSpending > 0
      ? (diff / previous.totalSpending) * 100
      : 0;

    const direction = diff > 0 ? 'more' : 'less';

    return {
      query: parsed.originalQuery,
      response: `Comparing ${current.month} to ${previous.month}: You spent $${Math.abs(diff).toFixed(2)} ${direction} ` +
        `(${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%). ` +
        `${current.month}: $${current.totalSpending.toFixed(2)}, ${previous.month}: $${previous.totalSpending.toFixed(2)}`,
      data: {},
      confidence: 0.85
    };
  }

  private async handleGeneralQuery(parsed: IParsedQuery): Promise<IFinanceQueryResult> {
    const stats = this.loader.getStats();

    return {
      query: parsed.originalQuery,
      response: `I have ${stats.totalTransactions} transactions totaling $${stats.totalSpending.toFixed(2)} in spending. ` +
        `Try asking about specific categories, months, merchants, anomalies, or trends.`,
      data: {
        summary: {
          totalSpending: stats.totalSpending,
          totalCredits: stats.totalCredits,
          transactionCount: stats.totalTransactions
        }
      },
      confidence: 0.6
    };
  }
}
