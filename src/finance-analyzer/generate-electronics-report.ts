#!/usr/bin/env npx tsx
/**
 * Generate comprehensive electronics and technology spending report
 */

import * as fs from 'fs/promises';
import { TransactionLoader, TransactionSearchEngine } from './index.js';
import type { ITransaction } from './types/index.js';

interface TransactionGroup {
  name: string;
  transactions: ITransaction[];
  total: number;
}

async function generateReport() {
  const loader = new TransactionLoader({ basePath: process.cwd() });
  await loader.loadAll();

  const searchEngine = new TransactionSearchEngine();
  searchEngine.setTransactions(loader.getTransactions());

  // Get all relevant categories
  const categories = ['Electronics', 'Subscriptions', 'Phone'];
  const allTech: ITransaction[] = [];
  const seenIds = new Set<string>();

  for (const cat of categories) {
    const result = searchEngine.search(
      { customCategories: [cat] },
      { sortBy: 'date', sortOrder: 'desc' }
    );
    for (const tx of result.transactions) {
      if (!seenIds.has(tx.id)) {
        seenIds.add(tx.id);
        allTech.push(tx);
      }
    }
  }

  // Also search for specific tech merchants that might be miscategorized
  const techMerchants = ['google', 'youtube', 'apple', 'steam', 'humble', 'microsoft', 'nvidia'];
  for (const merchant of techMerchants) {
    const result = searchEngine.search({ searchText: merchant }, {});
    for (const tx of result.transactions) {
      if (!seenIds.has(tx.id)) {
        seenIds.add(tx.id);
        allTech.push(tx);
      }
    }
  }

  // Sort by date descending
  allTech.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by vendor type
  const groups: Record<string, ITransaction[]> = {
    aiServices: [],
    internetServices: [],
    phoneFinancing: [],
    streaming: [],
    gaming: [],
    hardware: [],
    cloudStorage: [],
    other: []
  };

  for (const tx of allTech) {
    const desc = tx.description.toLowerCase();
    if (
      desc.includes('anthropic') ||
      desc.includes('claude') ||
      desc.includes('openai') ||
      desc.includes('chatgpt')
    ) {
      groups.aiServices.push(tx);
    } else if (
      desc.includes('starlink') ||
      desc.includes('facebook') ||
      desc.includes('meta ')
    ) {
      groups.internetServices.push(tx);
    } else if (desc.includes('iphone') || desc.includes('citizens')) {
      groups.phoneFinancing.push(tx);
    } else if (
      desc.includes('crunchyroll') ||
      desc.includes('youtube') ||
      desc.includes('google*tv')
    ) {
      groups.streaming.push(tx);
    } else if (
      desc.includes('steam') ||
      desc.includes('humble') ||
      desc.includes('8bitdo') ||
      desc.includes('analogue') ||
      desc.includes('gamersnexus') ||
      desc.includes('nintendo')
    ) {
      groups.gaming.push(tx);
    } else if (
      desc.includes('framework') ||
      desc.includes('lumen') ||
      desc.includes('inmotion')
    ) {
      groups.hardware.push(tx);
    } else if (desc.includes('google one') || desc.includes('google *google')) {
      groups.cloudStorage.push(tx);
    } else {
      groups.other.push(tx);
    }
  }

  // Calculate totals
  const calcTotal = (arr: ITransaction[]) =>
    arr.reduce((sum, t) => sum + (t.isCredit ? -Math.abs(t.amount) : t.amount), 0);

  // Generate markdown report
  const lines: string[] = [];

  lines.push('# Electronics & Technology Spending Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`);
  lines.push(`**Period:** ${allTech[allTech.length - 1]?.dateString || 'N/A'} to ${allTech[0]?.dateString || 'N/A'}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Category | Transactions | Total |`);
  lines.push(`|----------|-------------|-------|`);

  const categoryNames: Record<string, string> = {
    aiServices: 'AI Services (Claude, ChatGPT)',
    internetServices: 'Internet Services (Starlink, etc)',
    phoneFinancing: 'Phone Financing (iPhone)',
    streaming: 'Streaming (YouTube, Crunchyroll)',
    gaming: 'Gaming (Steam, Hardware)',
    hardware: 'Computer Hardware',
    cloudStorage: 'Cloud Storage (Google One)',
    other: 'Other Technology'
  };

  let grandTotal = 0;
  let totalTx = 0;
  for (const [key, txs] of Object.entries(groups)) {
    const total = calcTotal(txs);
    grandTotal += total;
    totalTx += txs.length;
    lines.push(
      `| ${categoryNames[key]} | ${txs.length} | $${total.toFixed(2)} |`
    );
  }
  lines.push(`| **TOTAL** | **${totalTx}** | **$${grandTotal.toFixed(2)}** |`);
  lines.push('');

  // Detailed sections
  const sectionOrder = [
    'aiServices',
    'internetServices',
    'phoneFinancing',
    'streaming',
    'gaming',
    'hardware',
    'cloudStorage',
    'other'
  ];

  for (const key of sectionOrder) {
    const txs = groups[key];
    if (txs.length === 0) continue;

    lines.push(`## ${categoryNames[key]}`);
    lines.push('');
    lines.push(`**Total:** $${calcTotal(txs).toFixed(2)} across ${txs.length} transactions`);
    lines.push('');
    lines.push('| Date | Description | Amount |');
    lines.push('|------|-------------|--------|');

    for (const tx of txs) {
      const amount = tx.isCredit ? `-$${Math.abs(tx.amount).toFixed(2)}` : `$${tx.amount.toFixed(2)}`;
      const desc = tx.description.substring(0, 40).trim();
      lines.push(`| ${tx.dateString} | ${desc} | ${amount} |`);
    }
    lines.push('');
  }

  // Monthly breakdown
  lines.push('## Monthly Technology Spending');
  lines.push('');

  const byMonth = new Map<string, number>();
  for (const tx of allTech) {
    if (tx.isCredit) continue;
    const month = tx.dateString.substring(0, 7);
    byMonth.set(month, (byMonth.get(month) || 0) + tx.amount);
  }

  const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  lines.push('| Month | Total |');
  lines.push('|-------|-------|');
  for (const [month, total] of months) {
    lines.push(`| ${month} | $${total.toFixed(2)} |`);
  }
  lines.push('');

  // Recurring services summary
  lines.push('## Recurring Services Identified');
  lines.push('');
  lines.push('Based on transaction patterns:');
  lines.push('');

  const recurring = [
    { name: 'Claude.ai Subscription', amount: '~$20-96/month', vendor: 'Anthropic' },
    { name: 'ChatGPT Plus', amount: '$20/month', vendor: 'OpenAI' },
    { name: 'YouTube Premium', amount: '$7.99/month', vendor: 'Google' },
    { name: 'Crunchyroll', amount: '$7.99/month', vendor: 'Crunchyroll' },
    { name: 'Google One', amount: '$1.99/month', vendor: 'Google' },
    { name: 'Starlink Internet', amount: '~$5-282/month', vendor: 'SpaceX' },
    { name: 'iPhone Financing', amount: '$61.15/month', vendor: 'Citizens One' }
  ];

  lines.push('| Service | Monthly Cost | Vendor |');
  lines.push('|---------|--------------|--------|');
  for (const svc of recurring) {
    lines.push(`| ${svc.name} | ${svc.amount} | ${svc.vendor} |`);
  }
  lines.push('');

  const report = lines.join('\n');

  // Write to file
  const outputPath = 'corpus/finances/electronics-report.md';
  await fs.writeFile(outputPath, report);
  console.log(`Report written to: ${outputPath}`);
  console.log('');
  console.log(report);
}

generateReport().catch(console.error);
