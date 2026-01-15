/**
 * Pattern Analyzer
 * Identifies spending patterns, recurring charges, and trends
 */

import type { ITransaction, ISpendingPattern } from '../types/index.js';

/**
 * Pattern analyzer for identifying spending trends and recurring charges
 */
export class PatternAnalyzer {
  /**
   * Detect all patterns in transactions
   */
  analyze(transactions: ITransaction[]): ISpendingPattern[] {
    const patterns: ISpendingPattern[] = [];

    patterns.push(...this.detectRecurring(transactions));
    patterns.push(...this.detectTrends(transactions));
    patterns.push(...this.detectSeasonalPatterns(transactions));

    return patterns;
  }

  /**
   * Detect recurring charges (subscriptions, bills)
   */
  detectRecurring(transactions: ITransaction[]): ISpendingPattern[] {
    const patterns: ISpendingPattern[] = [];

    // Group by merchant
    const byMerchant = new Map<string, ITransaction[]>();
    for (const tx of transactions) {
      if (tx.isCredit) continue;
      const key = tx.description.toLowerCase();
      if (!byMerchant.has(key)) byMerchant.set(key, []);
      byMerchant.get(key)!.push(tx);
    }

    for (const [merchant, merchantTxs] of byMerchant) {
      if (merchantTxs.length < 3) continue;

      // Sort by date
      const sorted = [...merchantTxs].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      // Check for monthly pattern (25-35 days apart)
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const days =
          (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) /
          (1000 * 60 * 60 * 24);
        intervals.push(days);
      }

      if (intervals.length < 2) continue;

      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance =
        intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) /
        intervals.length;
      const intervalStdDev = Math.sqrt(intervalVariance);

      // Check if intervals are consistent (low variance)
      if (intervalStdDev < 5 && avgInterval >= 25 && avgInterval <= 35) {
        // Monthly subscription
        const amounts = sorted.map((t) => t.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

        patterns.push({
          type: 'recurring',
          description: `Monthly subscription: ${merchantTxs[0].description} (~$${avgAmount.toFixed(2)}/month)`,
          confidence: Math.max(0.5, 1 - intervalStdDev / 10),
          transactionIds: sorted.map((t) => t.id),
          data: {
            merchant,
            frequency: 'monthly',
            averageAmount: avgAmount,
            averageInterval: avgInterval,
            transactionCount: sorted.length
          }
        });
      } else if (intervalStdDev < 3 && avgInterval >= 6 && avgInterval <= 8) {
        // Weekly pattern
        const avgAmount =
          sorted.reduce((sum, t) => sum + t.amount, 0) / sorted.length;

        patterns.push({
          type: 'recurring',
          description: `Weekly recurring: ${merchantTxs[0].description} (~$${avgAmount.toFixed(2)}/week)`,
          confidence: Math.max(0.5, 1 - intervalStdDev / 5),
          transactionIds: sorted.map((t) => t.id),
          data: {
            merchant,
            frequency: 'weekly',
            averageAmount: avgAmount,
            averageInterval: avgInterval,
            transactionCount: sorted.length
          }
        });
      }
    }

    return patterns;
  }

  /**
   * Detect spending trends (increasing or decreasing)
   */
  detectTrends(transactions: ITransaction[]): ISpendingPattern[] {
    const patterns: ISpendingPattern[] = [];

    // Group by month
    const byMonth = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.isCredit) continue;
      const month = tx.dateString.substring(0, 7);
      byMonth.set(month, (byMonth.get(month) || 0) + tx.amount);
    }

    // Need at least 3 months of data
    if (byMonth.size < 3) return patterns;

    // Sort months chronologically
    const months = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => ({ month, total }));

    // Calculate trend using linear regression
    const n = months.length;
    const xMean = (n - 1) / 2;
    const yMean = months.reduce((sum, m) => sum + m.total, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (months[i].total - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator > 0 ? numerator / denominator : 0;
    const percentChange = yMean > 0 ? (slope / yMean) * 100 : 0;

    // Significant trend if > 5% change per month
    if (Math.abs(percentChange) > 5) {
      const isIncreasing = slope > 0;
      patterns.push({
        type: isIncreasing ? 'increasing' : 'decreasing',
        description: `Overall spending is ${isIncreasing ? 'increasing' : 'decreasing'} by ~${Math.abs(percentChange).toFixed(1)}% per month`,
        confidence: Math.min(0.9, Math.abs(percentChange) / 20),
        transactionIds: transactions.filter((t) => !t.isCredit).map((t) => t.id),
        data: {
          slope,
          percentChangePerMonth: percentChange,
          monthlyTotals: months
        }
      });
    }

    return patterns;
  }

  /**
   * Detect seasonal patterns (higher spending in certain months)
   */
  detectSeasonalPatterns(transactions: ITransaction[]): ISpendingPattern[] {
    const patterns: ISpendingPattern[] = [];

    // Group by month number (1-12)
    const byMonthNum = new Map<number, number[]>();
    for (const tx of transactions) {
      if (tx.isCredit) continue;
      const monthNum = tx.date.getMonth() + 1;
      if (!byMonthNum.has(monthNum)) byMonthNum.set(monthNum, []);
      byMonthNum.get(monthNum)!.push(tx.amount);
    }

    // Need data for at least 6 different months
    if (byMonthNum.size < 6) return patterns;

    // Calculate average per month number
    const monthAverages = new Map<number, number>();
    for (const [month, amounts] of byMonthNum) {
      monthAverages.set(month, amounts.reduce((a, b) => a + b, 0) / amounts.length);
    }

    const overallAverage =
      Array.from(monthAverages.values()).reduce((a, b) => a + b, 0) /
      monthAverages.size;

    // Find months with significantly higher/lower spending
    const monthNames = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const highMonths: string[] = [];
    const lowMonths: string[] = [];

    for (const [month, avg] of monthAverages) {
      const deviation = (avg - overallAverage) / overallAverage;
      if (deviation > 0.3) {
        highMonths.push(monthNames[month]);
      } else if (deviation < -0.3) {
        lowMonths.push(monthNames[month]);
      }
    }

    if (highMonths.length > 0) {
      patterns.push({
        type: 'seasonal',
        description: `Higher spending typically in: ${highMonths.join(', ')}`,
        confidence: 0.6,
        transactionIds: [],
        data: {
          highSpendingMonths: highMonths,
          averageSpending: overallAverage,
          monthlyAverages: Object.fromEntries(
            Array.from(monthAverages.entries()).map(([m, a]) => [monthNames[m], a])
          )
        }
      });
    }

    if (lowMonths.length > 0) {
      patterns.push({
        type: 'seasonal',
        description: `Lower spending typically in: ${lowMonths.join(', ')}`,
        confidence: 0.6,
        transactionIds: [],
        data: {
          lowSpendingMonths: lowMonths,
          averageSpending: overallAverage
        }
      });
    }

    return patterns;
  }
}
