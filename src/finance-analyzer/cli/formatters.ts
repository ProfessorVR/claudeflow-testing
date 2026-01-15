/**
 * CLI Output Formatters
 * Format transaction data as tables, JSON, or CSV
 */

import type {
  ITransaction,
  ICategoryBreakdown,
  IMonthlySummary,
  IAnomaly
} from '../types/index.js';

/**
 * Format transactions as a table
 */
export function formatTransactionsTable(
  transactions: ITransaction[],
  showExtended = false
): string {
  if (transactions.length === 0) {
    return 'No transactions found.';
  }

  const lines: string[] = [];

  // Header
  const header = showExtended
    ? 'Date       | Amount    | Category        | Description                    | Reference'
    : 'Date       | Amount    | Category        | Description';
  const separator = showExtended
    ? '-'.repeat(100)
    : '-'.repeat(75);

  lines.push(header);
  lines.push(separator);

  // Rows
  for (const tx of transactions) {
    const date = tx.dateString;
    const amount = (tx.isCredit ? '-' : ' ') + '$' + Math.abs(tx.amount).toFixed(2).padStart(8);
    const category = tx.customCategory.padEnd(15).substring(0, 15);
    const description = tx.description.substring(0, 30).padEnd(30);

    if (showExtended) {
      const reference = tx.reference.substring(0, 15);
      lines.push(`${date} | ${amount} | ${category} | ${description} | ${reference}`);
    } else {
      lines.push(`${date} | ${amount} | ${category} | ${description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format transactions as JSON
 */
export function formatTransactionsJSON(transactions: ITransaction[]): string {
  return JSON.stringify(
    transactions.map((tx) => ({
      id: tx.id,
      date: tx.dateString,
      description: tx.description,
      amount: tx.amount,
      category: tx.customCategory,
      amexCategory: tx.amexCategory.original,
      isCredit: tx.isCredit,
      reference: tx.reference
    })),
    null,
    2
  );
}

/**
 * Format transactions as CSV
 */
export function formatTransactionsCSV(transactions: ITransaction[]): string {
  const lines: string[] = [];

  // Header
  lines.push('Date,Description,Amount,Category,AMEX Category,Is Credit,Reference');

  // Rows
  for (const tx of transactions) {
    const row = [
      tx.dateString,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      `"${tx.customCategory}"`,
      `"${tx.amexCategory.original}"`,
      tx.isCredit ? 'true' : 'false',
      tx.reference
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Format category breakdown as table
 */
export function formatCategoryTable(categories: ICategoryBreakdown[]): string {
  if (categories.length === 0) {
    return 'No categories found.';
  }

  const lines: string[] = [];

  // Header
  lines.push('Category            | Total      | Count |   Avg    | Percent');
  lines.push('-'.repeat(65));

  // Rows
  for (const cat of categories) {
    const category = cat.category.padEnd(19).substring(0, 19);
    const total = '$' + cat.total.toFixed(2).padStart(9);
    const count = cat.count.toString().padStart(5);
    const avg = '$' + cat.average.toFixed(2).padStart(7);
    const percent = cat.percentage.toFixed(1).padStart(6) + '%';

    lines.push(`${category} | ${total} | ${count} | ${avg} | ${percent}`);
  }

  return lines.join('\n');
}

/**
 * Format category breakdown as JSON
 */
export function formatCategoryJSON(categories: ICategoryBreakdown[]): string {
  return JSON.stringify(categories, null, 2);
}

/**
 * Format monthly summary as table
 */
export function formatMonthlySummaryTable(summaries: IMonthlySummary[]): string {
  if (summaries.length === 0) {
    return 'No monthly data found.';
  }

  const lines: string[] = [];

  // Header
  lines.push('Month    | Spending   | Credits   | Net        | Txns |    Avg');
  lines.push('-'.repeat(65));

  // Rows
  for (const s of summaries) {
    const month = s.month;
    const spending = '$' + s.totalSpending.toFixed(2).padStart(9);
    const credits = '$' + s.totalCredits.toFixed(2).padStart(8);
    const net = '$' + s.netAmount.toFixed(2).padStart(9);
    const txns = s.transactionCount.toString().padStart(4);
    const avg = '$' + s.averageTransaction.toFixed(2).padStart(7);

    lines.push(`${month} | ${spending} | ${credits} | ${net} | ${txns} | ${avg}`);
  }

  return lines.join('\n');
}

/**
 * Format monthly summary as JSON
 */
export function formatMonthlySummaryJSON(summaries: IMonthlySummary[]): string {
  return JSON.stringify(summaries, null, 2);
}

/**
 * Format anomalies as table
 */
export function formatAnomaliesTable(anomalies: IAnomaly[]): string {
  if (anomalies.length === 0) {
    return 'No anomalies detected.';
  }

  const lines: string[] = [];

  // Header
  lines.push('Severity | Type             | Description');
  lines.push('-'.repeat(80));

  // Rows
  for (const a of anomalies) {
    const severity = a.severity.toUpperCase().padEnd(8);
    const type = a.type.replace(/_/g, ' ').padEnd(16).substring(0, 16);
    const description = a.description.substring(0, 50);

    lines.push(`${severity} | ${type} | ${description}`);
  }

  return lines.join('\n');
}

/**
 * Format anomalies as JSON
 */
export function formatAnomaliesJSON(anomalies: IAnomaly[]): string {
  return JSON.stringify(
    anomalies.map((a) => ({
      type: a.type,
      severity: a.severity,
      description: a.description,
      confidence: a.confidence,
      rule: a.rule,
      transactionIds: a.transactions.map((t) => t.id),
      context: a.context
    })),
    null,
    2
  );
}

/**
 * Format a simple summary box
 */
export function formatSummaryBox(data: {
  totalSpending: number;
  totalCredits: number;
  netAmount: number;
  transactionCount: number;
  averageTransaction: number;
  uniqueMerchants?: number;
  dateRange?: { start: Date; end: Date } | null;
}): string {
  const lines: string[] = [];

  lines.push('╔════════════════════════════════════════╗');
  lines.push('║         SPENDING SUMMARY               ║');
  lines.push('╠════════════════════════════════════════╣');

  if (data.dateRange) {
    const start = data.dateRange.start.toISOString().split('T')[0];
    const end = data.dateRange.end.toISOString().split('T')[0];
    lines.push(`║  Period: ${start} to ${end}  ║`);
    lines.push('╠════════════════════════════════════════╣');
  }

  lines.push(`║  Total Spending:  $${data.totalSpending.toFixed(2).padStart(15)}  ║`);
  lines.push(`║  Total Credits:   $${data.totalCredits.toFixed(2).padStart(15)}  ║`);
  lines.push(`║  Net Amount:      $${data.netAmount.toFixed(2).padStart(15)}  ║`);
  lines.push('╠════════════════════════════════════════╣');
  lines.push(`║  Transactions:    ${data.transactionCount.toString().padStart(16)}  ║`);
  lines.push(`║  Avg Transaction: $${data.averageTransaction.toFixed(2).padStart(15)}  ║`);

  if (data.uniqueMerchants !== undefined) {
    lines.push(`║  Unique Merchants:${data.uniqueMerchants.toString().padStart(16)}  ║`);
  }

  lines.push('╚════════════════════════════════════════╝');

  return lines.join('\n');
}
