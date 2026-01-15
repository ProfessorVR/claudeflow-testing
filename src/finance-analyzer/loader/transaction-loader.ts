/**
 * Transaction Loader
 * Orchestrates parsing AMEX CSVs and transforming to normalized transactions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parseAMEXCSV, parseAMEXDirectory } from './csv-parser.js';
import { CategoryMapper } from './category-mapper.js';
import type { ITransaction, IRawAMEXTransaction } from '../types/index.js';

export interface ILoaderOptions {
  /** Base path for project (for loading config) */
  basePath?: string;
  /** Path to category mapping config */
  categoryMappingPath?: string;
  /** Path to corpus finances directory */
  corpusPath?: string;
}

const DEFAULT_OPTIONS: Required<ILoaderOptions> = {
  basePath: process.cwd(),
  categoryMappingPath: 'config/finance/category-mapping.json',
  corpusPath: 'corpus/finances'
};

/**
 * Transaction loader that parses and normalizes AMEX CSV data
 */
export class TransactionLoader {
  private options: Required<ILoaderOptions>;
  private categoryMapper: CategoryMapper;
  private transactions: ITransaction[] = [];
  private loaded = false;

  constructor(options: ILoaderOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.categoryMapper = new CategoryMapper(this.options.categoryMappingPath);
  }

  /**
   * Load all transactions from the corpus
   */
  async loadAll(): Promise<ITransaction[]> {
    // Load category mapping
    await this.categoryMapper.load(this.options.basePath);

    // Parse all AMEX CSVs
    const corpusFullPath = path.join(this.options.basePath, this.options.corpusPath);
    const parseResults = await parseAMEXDirectory(corpusFullPath);

    // Transform all transactions
    this.transactions = [];
    let globalIndex = 0;

    for (const result of parseResults) {
      for (let i = 0; i < result.transactions.length; i++) {
        const raw = result.transactions[i];
        const transformed = this.transformTransaction(
          raw,
          result.sourceFile,
          i + 1, // 1-indexed row (after header)
          globalIndex++
        );
        this.transactions.push(transformed);
      }
    }

    // Sort by date (newest first)
    this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.loaded = true;

    return this.transactions;
  }

  /**
   * Transform a raw AMEX transaction to normalized format
   */
  private transformTransaction(
    raw: IRawAMEXTransaction,
    sourceFile: string,
    sourceRow: number,
    globalIndex: number
  ): ITransaction {
    // Parse date (MM/DD/YYYY format)
    const dateParts = raw.Date.split('/');
    const date = new Date(
      parseInt(dateParts[2], 10),
      parseInt(dateParts[0], 10) - 1,
      parseInt(dateParts[1], 10)
    );

    // Parse amount (remove $ and commas, handle negative)
    const amountStr = raw.Amount.replace(/[$,]/g, '');
    const amount = parseFloat(amountStr);

    // Parse AMEX category
    const amexCategory = this.categoryMapper.parseAMEXCategory(raw.Category);

    // Map to custom category
    const customCategory = this.categoryMapper.mapToCustom(raw.Category);

    // Generate ID from reference or create one
    const id = raw.Reference || `tx_${sourceFile}_${sourceRow}_${globalIndex}`;

    return {
      id,
      date,
      dateString: date.toISOString().split('T')[0],
      description: raw.Description.trim(),
      amount,
      isCredit: amount < 0,
      extendedDetails: raw['Extended Details']?.trim() || '',
      statementAs: raw['Appears On Your Statement As']?.trim() || '',
      address: {
        street: raw.Address?.trim() || '',
        cityState: raw['City/State']?.trim() || '',
        zipCode: raw['Zip Code']?.trim() || '',
        country: raw.Country?.trim() || ''
      },
      amexCategory,
      customCategory,
      reference: raw.Reference?.trim() || '',
      sourceFile,
      sourceRow
    };
  }

  /**
   * Get all loaded transactions
   */
  getTransactions(): ITransaction[] {
    if (!this.loaded) {
      throw new Error('Transactions not loaded. Call loadAll() first.');
    }
    return this.transactions;
  }

  /**
   * Get category mapper instance
   */
  getCategoryMapper(): CategoryMapper {
    return this.categoryMapper;
  }

  /**
   * Check if transactions are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get summary statistics
   */
  getStats(): {
    totalTransactions: number;
    totalSpending: number;
    totalCredits: number;
    dateRange: { start: Date; end: Date } | null;
    uniqueCategories: number;
    uniqueMerchants: number;
  } {
    if (!this.loaded) {
      throw new Error('Transactions not loaded. Call loadAll() first.');
    }

    const charges = this.transactions.filter((t) => !t.isCredit);
    const credits = this.transactions.filter((t) => t.isCredit);

    const totalSpending = charges.reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = credits.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const dates = this.transactions.map((t) => t.date);
    const dateRange =
      dates.length > 0
        ? {
            start: new Date(Math.min(...dates.map((d) => d.getTime()))),
            end: new Date(Math.max(...dates.map((d) => d.getTime())))
          }
        : null;

    const uniqueCategories = new Set(this.transactions.map((t) => t.customCategory)).size;
    const uniqueMerchants = new Set(this.transactions.map((t) => t.description)).size;

    return {
      totalTransactions: this.transactions.length,
      totalSpending,
      totalCredits,
      dateRange,
      uniqueCategories,
      uniqueMerchants
    };
  }
}
