/**
 * Transaction Anomaly Detector
 * Identifies duplicates, unusual patterns, and potential fraud
 */

import type { ITransaction, IAnomaly, IAnomalyRules } from '../types/index.js';

const DEFAULT_RULES: IAnomalyRules = {
  largeTransactionThreshold: 500,
  unusualAmountStdDev: 2.5,
  duplicateWindowDays: 7,
  duplicateSimilarity: 0.85
};

/**
 * Anomaly detector for transaction analysis
 */
export class AnomalyDetector {
  private rules: IAnomalyRules;

  constructor(rules: Partial<IAnomalyRules> = {}) {
    this.rules = { ...DEFAULT_RULES, ...rules };
  }

  /**
   * Run all anomaly detection on transactions
   */
  detect(transactions: ITransaction[]): IAnomaly[] {
    const anomalies: IAnomaly[] = [];

    // Run all detection methods
    anomalies.push(...this.detectDuplicates(transactions));
    anomalies.push(...this.detectUnusualAmounts(transactions));
    anomalies.push(...this.detectPotentialFraud(transactions));
    anomalies.push(...this.detectLargeTransactions(transactions));

    // Sort by severity (high first)
    const severityOrder = { high: 0, medium: 1, low: 2 };
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Deduplicate (same transactions shouldn't appear in multiple anomalies of same type)
    return this.deduplicateAnomalies(anomalies);
  }

  /**
   * Detect potential duplicate transactions
   */
  detectDuplicates(transactions: ITransaction[]): IAnomaly[] {
    const anomalies: IAnomaly[] = [];
    const sorted = [...transactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const seen = new Set<string>();

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const tx1 = sorted[i];
        const tx2 = sorted[j];

        // Check time window
        const daysDiff =
          (tx2.date.getTime() - tx1.date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > this.rules.duplicateWindowDays) break;

        // Check amount match (within $0.01)
        if (Math.abs(tx1.amount - tx2.amount) < 0.01) {
          // Check description similarity
          const similarity = this.stringSimilarity(
            tx1.description,
            tx2.description
          );
          if (similarity >= this.rules.duplicateSimilarity) {
            const key = `${tx1.id}-${tx2.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              anomalies.push({
                type: 'duplicate',
                severity: 'medium',
                description: `Potential duplicate: "${tx1.description}" on ${tx1.dateString} and ${tx2.dateString} for $${Math.abs(tx1.amount).toFixed(2)}`,
                transactions: [tx1, tx2],
                confidence: similarity,
                rule: 'duplicate_detection'
              });
            }
          }
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect unusually large or small amounts compared to category average
   */
  detectUnusualAmounts(transactions: ITransaction[]): IAnomaly[] {
    const anomalies: IAnomaly[] = [];

    // Group by custom category
    const byCategory = new Map<string, ITransaction[]>();
    for (const tx of transactions) {
      if (tx.isCredit) continue; // Skip credits
      const cat = tx.customCategory;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(tx);
    }

    // Check each category for outliers
    for (const [category, catTxs] of byCategory) {
      if (catTxs.length < 5) continue; // Need enough data points

      const amounts = catTxs.map((tx) => tx.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(
        amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
      );

      if (stdDev < 1) continue; // Skip if amounts are too uniform

      for (const tx of catTxs) {
        const deviation = Math.abs(tx.amount - mean);
        if (deviation > stdDev * this.rules.unusualAmountStdDev) {
          const isHigh = tx.amount > mean;
          anomalies.push({
            type: 'unusual_amount',
            severity:
              tx.amount > this.rules.largeTransactionThreshold ? 'high' : 'low',
            description: `Unusually ${isHigh ? 'high' : 'low'} ${category} charge: $${tx.amount.toFixed(2)} (avg: $${mean.toFixed(2)}, stddev: $${stdDev.toFixed(2)})`,
            transactions: [tx],
            confidence: Math.min(0.95, deviation / (stdDev * 3)),
            rule: 'unusual_amount_detection',
            context: { mean, stdDev, category, deviation }
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect potential fraud patterns
   */
  detectPotentialFraud(transactions: ITransaction[]): IAnomaly[] {
    const anomalies: IAnomaly[] = [];
    const reportedTxIds = new Set<string>();

    // Pattern 1: Multiple similar transactions on same day
    const byDate = new Map<string, ITransaction[]>();
    for (const tx of transactions) {
      if (!byDate.has(tx.dateString)) byDate.set(tx.dateString, []);
      byDate.get(tx.dateString)!.push(tx);
    }

    for (const [_date, dayTxs] of byDate) {
      if (dayTxs.length < 3) continue;

      // Check for similar descriptions
      for (let i = 0; i < dayTxs.length; i++) {
        const tx = dayTxs[i];
        if (reportedTxIds.has(tx.id)) continue;

        const similarTxs = dayTxs.filter(
          (t) =>
            t.id !== tx.id &&
            this.stringSimilarity(t.description, tx.description) > 0.7
        );

        if (similarTxs.length >= 2) {
          const allTxs = [tx, ...similarTxs];
          allTxs.forEach((t) => reportedTxIds.add(t.id));

          anomalies.push({
            type: 'potential_fraud',
            severity: 'high',
            description: `Multiple similar transactions (${allTxs.length}) on ${tx.dateString}: "${tx.description}"`,
            transactions: allTxs,
            confidence: 0.7,
            rule: 'multiple_similar_same_day'
          });
        }
      }
    }

    // Pattern 2: Unusual merchant (first time, large amount)
    const merchantCounts = new Map<string, number>();
    for (const tx of transactions) {
      merchantCounts.set(
        tx.description,
        (merchantCounts.get(tx.description) || 0) + 1
      );
    }

    for (const tx of transactions) {
      if (tx.isCredit) continue;
      if (merchantCounts.get(tx.description) === 1) {
        if (tx.amount > this.rules.largeTransactionThreshold) {
          anomalies.push({
            type: 'unusual_merchant',
            severity: 'medium',
            description: `First-time merchant with large charge: "${tx.description}" for $${tx.amount.toFixed(2)}`,
            transactions: [tx],
            confidence: 0.6,
            rule: 'first_time_large_merchant'
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect large transactions above threshold
   */
  detectLargeTransactions(transactions: ITransaction[]): IAnomaly[] {
    const anomalies: IAnomaly[] = [];

    for (const tx of transactions) {
      if (tx.isCredit) continue;
      if (tx.amount > this.rules.largeTransactionThreshold * 2) {
        anomalies.push({
          type: 'unusual_amount',
          severity: 'medium',
          description: `Large transaction: "${tx.description}" for $${tx.amount.toFixed(2)} on ${tx.dateString}`,
          transactions: [tx],
          confidence: 0.5,
          rule: 'large_transaction'
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate string similarity using Jaccard index on words
   */
  private stringSimilarity(s1: string, s2: string): number {
    const words1 = new Set(
      s1
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
    const words2 = new Set(
      s2
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

    if (words1.size === 0 && words2.size === 0) return 1;
    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Remove duplicate anomalies (same transactions)
   */
  private deduplicateAnomalies(anomalies: IAnomaly[]): IAnomaly[] {
    const seen = new Map<string, IAnomaly>();

    for (const anomaly of anomalies) {
      const key = `${anomaly.type}-${anomaly.transactions.map((t) => t.id).sort().join(',')}`;
      if (!seen.has(key) || seen.get(key)!.confidence < anomaly.confidence) {
        seen.set(key, anomaly);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Update detection rules
   */
  setRules(rules: Partial<IAnomalyRules>): void {
    this.rules = { ...this.rules, ...rules };
  }

  /**
   * Get current rules
   */
  getRules(): IAnomalyRules {
    return { ...this.rules };
  }
}
