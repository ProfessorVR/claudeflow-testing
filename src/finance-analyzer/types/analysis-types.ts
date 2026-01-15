/**
 * Finance Analysis Types
 * Types for reports, aggregations, and anomaly detection
 */

import type { ITransaction } from './transaction-types.js';

/**
 * Category breakdown for reports
 */
export interface ICategoryBreakdown {
  /** Category name */
  category: string;
  /** Total amount */
  total: number;
  /** Transaction count */
  count: number;
  /** Percentage of total spending */
  percentage: number;
  /** Average transaction */
  average: number;
}

/**
 * Monthly spending summary
 */
export interface IMonthlySummary {
  /** Month identifier (YYYY-MM) */
  month: string;
  /** Year */
  year: number;
  /** Month number (1-12) */
  monthNumber: number;
  /** Total spending (charges only, positive) */
  totalSpending: number;
  /** Total credits/refunds (negative amounts made positive) */
  totalCredits: number;
  /** Net amount (spending - credits) */
  netAmount: number;
  /** Number of transactions */
  transactionCount: number;
  /** Average transaction amount (charges only) */
  averageTransaction: number;
  /** Breakdown by custom category */
  byCustomCategory: Record<string, ICategoryBreakdown>;
  /** Breakdown by AMEX primary category */
  byAMEXPrimary: Record<string, ICategoryBreakdown>;
}

/**
 * Spending pattern analysis
 */
export interface ISpendingPattern {
  /** Pattern type identifier */
  type: 'recurring' | 'seasonal' | 'increasing' | 'decreasing' | 'anomaly';
  /** Description of the pattern */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Related transactions */
  transactionIds: string[];
  /** Pattern-specific data */
  data: Record<string, unknown>;
}

/**
 * Anomaly detection result
 */
export interface IAnomaly {
  /** Anomaly type */
  type: 'duplicate' | 'unusual_amount' | 'unusual_merchant' | 'unusual_frequency' | 'potential_fraud';
  /** Severity (low, medium, high) */
  severity: 'low' | 'medium' | 'high';
  /** Human-readable description */
  description: string;
  /** Affected transaction(s) */
  transactions: ITransaction[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Detection rule that triggered this */
  rule: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Complete spending report
 */
export interface ISpendingReport {
  /** Report generation timestamp */
  generatedAt: Date;
  /** Date range covered */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** Overall statistics */
  summary: {
    totalSpending: number;
    totalCredits: number;
    netAmount: number;
    transactionCount: number;
    averageTransaction: number;
    uniqueMerchants: number;
  };
  /** Monthly breakdowns */
  monthly: IMonthlySummary[];
  /** Category breakdowns */
  byCustomCategory: ICategoryBreakdown[];
  byAMEXCategory: ICategoryBreakdown[];
  /** Top merchants by spending */
  topMerchants: Array<{
    merchant: string;
    total: number;
    count: number;
  }>;
  /** Detected patterns */
  patterns: ISpendingPattern[];
  /** Detected anomalies */
  anomalies: IAnomaly[];
}

/**
 * Natural language query result (for God Agent integration)
 */
export interface IFinanceQueryResult {
  /** Query that was asked */
  query: string;
  /** Natural language response */
  response: string;
  /** Structured data supporting the response */
  data: {
    transactions?: ITransaction[];
    summary?: Partial<ISpendingReport['summary']>;
    categories?: ICategoryBreakdown[];
    anomalies?: IAnomaly[];
  };
  /** Confidence in the response (0-1) */
  confidence: number;
}

/**
 * Anomaly detection rules configuration
 */
export interface IAnomalyRules {
  /** Amount threshold for "large transaction" (default: 500) */
  largeTransactionThreshold: number;
  /** Standard deviation multiplier for unusual amount (default: 2.5) */
  unusualAmountStdDev: number;
  /** Days window for duplicate detection (default: 7) */
  duplicateWindowDays: number;
  /** Similarity threshold for duplicate description (0-1, default: 0.85) */
  duplicateSimilarity: number;
}
