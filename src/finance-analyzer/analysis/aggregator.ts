/**
 * Transaction Aggregator
 * Generates monthly summaries, category breakdowns, and spending analysis
 */

import type {
  ITransaction,
  IMonthlySummary,
  ICategoryBreakdown,
  ISpendingReport
} from '../types/index.js';

/**
 * Aggregator for generating spending reports and summaries
 */
export class Aggregator {
  private transactions: ITransaction[] = [];

  /**
   * Set the transactions to aggregate
   */
  setTransactions(transactions: ITransaction[]): void {
    this.transactions = transactions;
  }

  /**
   * Generate a complete spending report
   */
  generateReport(
    startDate?: Date,
    endDate?: Date
  ): ISpendingReport {
    const filtered = this.filterByDateRange(startDate, endDate);

    const charges = filtered.filter((t) => !t.isCredit);
    const credits = filtered.filter((t) => t.isCredit);

    const totalSpending = charges.reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = credits.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const dates = filtered.map((t) => t.date);
    const dateRange = {
      start: dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date(),
      end: dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date()
    };

    const uniqueMerchants = new Set(filtered.map((t) => t.description)).size;

    return {
      generatedAt: new Date(),
      dateRange,
      summary: {
        totalSpending,
        totalCredits,
        netAmount: totalSpending - totalCredits,
        transactionCount: filtered.length,
        averageTransaction: charges.length > 0 ? totalSpending / charges.length : 0,
        uniqueMerchants
      },
      monthly: this.generateMonthlySummaries(filtered),
      byCustomCategory: this.generateCategoryBreakdown(filtered, 'custom'),
      byAMEXCategory: this.generateCategoryBreakdown(filtered, 'amex'),
      topMerchants: this.getTopMerchants(filtered, 10),
      patterns: [],
      anomalies: []
    };
  }

  /**
   * Generate monthly summaries
   */
  generateMonthlySummaries(
    transactions?: ITransaction[]
  ): IMonthlySummary[] {
    const txs = transactions || this.transactions;

    // Group by month
    const byMonth = new Map<string, ITransaction[]>();
    for (const tx of txs) {
      const month = tx.dateString.substring(0, 7); // YYYY-MM
      if (!byMonth.has(month)) {
        byMonth.set(month, []);
      }
      byMonth.get(month)!.push(tx);
    }

    // Generate summary for each month
    const summaries: IMonthlySummary[] = [];
    for (const [month, monthTxs] of byMonth) {
      const [year, monthNum] = month.split('-').map(Number);
      const charges = monthTxs.filter((t) => !t.isCredit);
      const credits = monthTxs.filter((t) => t.isCredit);

      const totalSpending = charges.reduce((sum, t) => sum + t.amount, 0);
      const totalCredits = credits.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      summaries.push({
        month,
        year,
        monthNumber: monthNum,
        totalSpending,
        totalCredits,
        netAmount: totalSpending - totalCredits,
        transactionCount: monthTxs.length,
        averageTransaction: charges.length > 0 ? totalSpending / charges.length : 0,
        byCustomCategory: this.generateCategoryBreakdownMap(monthTxs, 'custom'),
        byAMEXPrimary: this.generateCategoryBreakdownMap(monthTxs, 'amexPrimary')
      });
    }

    // Sort by month descending
    summaries.sort((a, b) => b.month.localeCompare(a.month));
    return summaries;
  }

  /**
   * Generate category breakdown as array
   */
  generateCategoryBreakdown(
    transactions: ITransaction[],
    type: 'custom' | 'amex'
  ): ICategoryBreakdown[] {
    const map = this.generateCategoryBreakdownMap(
      transactions,
      type === 'amex' ? 'amexPrimary' : 'custom'
    );
    return Object.values(map).sort((a, b) => b.total - a.total);
  }

  /**
   * Generate category breakdown as map
   */
  private generateCategoryBreakdownMap(
    transactions: ITransaction[],
    type: 'custom' | 'amexPrimary'
  ): Record<string, ICategoryBreakdown> {
    const charges = transactions.filter((t) => !t.isCredit);
    const totalSpending = charges.reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const byCategory = new Map<string, ITransaction[]>();
    for (const tx of charges) {
      const category =
        type === 'custom' ? tx.customCategory : tx.amexCategory.primary;
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(tx);
    }

    // Generate breakdown for each category
    const breakdown: Record<string, ICategoryBreakdown> = {};
    for (const [category, catTxs] of byCategory) {
      const total = catTxs.reduce((sum, t) => sum + t.amount, 0);
      breakdown[category] = {
        category,
        total,
        count: catTxs.length,
        percentage: totalSpending > 0 ? (total / totalSpending) * 100 : 0,
        average: catTxs.length > 0 ? total / catTxs.length : 0
      };
    }

    return breakdown;
  }

  /**
   * Get top merchants by spending
   */
  getTopMerchants(
    transactions: ITransaction[],
    limit: number = 10
  ): Array<{ merchant: string; total: number; count: number }> {
    const charges = transactions.filter((t) => !t.isCredit);

    // Group by merchant
    const byMerchant = new Map<string, { total: number; count: number }>();
    for (const tx of charges) {
      const current = byMerchant.get(tx.description) || { total: 0, count: 0 };
      current.total += tx.amount;
      current.count += 1;
      byMerchant.set(tx.description, current);
    }

    // Convert to array and sort
    const merchants = Array.from(byMerchant.entries())
      .map(([merchant, data]) => ({ merchant, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    return merchants;
  }

  /**
   * Get summary for a specific month
   */
  getMonthlySummary(year: number, month: number): IMonthlySummary | null {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    const summaries = this.generateMonthlySummaries();
    return summaries.find((s) => s.month === monthStr) || null;
  }

  /**
   * Get spending trend (month over month change)
   */
  getSpendingTrend(): Array<{
    month: string;
    spending: number;
    change: number;
    changePercent: number;
  }> {
    const summaries = this.generateMonthlySummaries();
    // Sort ascending for trend calculation
    summaries.sort((a, b) => a.month.localeCompare(b.month));

    const trend: Array<{
      month: string;
      spending: number;
      change: number;
      changePercent: number;
    }> = [];

    for (let i = 0; i < summaries.length; i++) {
      const current = summaries[i];
      const previous = i > 0 ? summaries[i - 1] : null;

      const change = previous ? current.totalSpending - previous.totalSpending : 0;
      const changePercent =
        previous && previous.totalSpending > 0
          ? (change / previous.totalSpending) * 100
          : 0;

      trend.push({
        month: current.month,
        spending: current.totalSpending,
        change,
        changePercent
      });
    }

    return trend;
  }

  /**
   * Filter transactions by date range
   */
  private filterByDateRange(
    startDate?: Date,
    endDate?: Date
  ): ITransaction[] {
    return this.transactions.filter((tx) => {
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      return true;
    });
  }
}
