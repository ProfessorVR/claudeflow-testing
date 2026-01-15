/**
 * Transaction Search Engine
 * Provides filtering, searching, and sorting capabilities
 */

import type { ITransaction, ITransactionFilter } from '../types/index.js';

export interface ISearchOptions {
  /** Sort field */
  sortBy?: 'date' | 'amount' | 'description' | 'category';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface ISearchResult {
  /** Matching transactions */
  transactions: ITransaction[];
  /** Total count before pagination */
  totalCount: number;
  /** Applied filters */
  appliedFilters: ITransactionFilter;
  /** Applied options */
  appliedOptions: ISearchOptions;
}

/**
 * Search engine for querying transactions
 */
export class TransactionSearchEngine {
  private transactions: ITransaction[] = [];

  /**
   * Set the transactions to search
   */
  setTransactions(transactions: ITransaction[]): void {
    this.transactions = transactions;
  }

  /**
   * Search transactions with filters and options
   */
  search(
    filter: ITransactionFilter = {},
    options: ISearchOptions = {}
  ): ISearchResult {
    // Apply filters
    let results = this.transactions.filter((tx) => this.matchesFilter(tx, filter));

    // Sort
    const sortBy = options.sortBy || 'date';
    const sortOrder = options.sortOrder || 'desc';
    results = this.sortTransactions(results, sortBy, sortOrder);

    const totalCount = results.length;

    // Pagination
    if (options.offset && options.offset > 0) {
      results = results.slice(options.offset);
    }
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return {
      transactions: results,
      totalCount,
      appliedFilters: filter,
      appliedOptions: options
    };
  }

  /**
   * Search by merchant/description text
   */
  searchByText(
    searchText: string,
    options: ISearchOptions = {}
  ): ISearchResult {
    return this.search({ searchText }, options);
  }

  /**
   * Search by custom category
   */
  searchByCategory(
    categories: string[],
    options: ISearchOptions = {}
  ): ISearchResult {
    return this.search({ customCategories: categories }, options);
  }

  /**
   * Search by date range
   */
  searchByDateRange(
    startDate: Date,
    endDate: Date,
    options: ISearchOptions = {}
  ): ISearchResult {
    return this.search({ startDate, endDate }, options);
  }

  /**
   * Search by amount range
   */
  searchByAmountRange(
    minAmount: number,
    maxAmount: number,
    options: ISearchOptions = {}
  ): ISearchResult {
    return this.search({ minAmount, maxAmount }, options);
  }

  /**
   * Get all unique merchants
   */
  getUniqueMerchants(): string[] {
    const merchants = new Set(this.transactions.map((t) => t.description));
    return Array.from(merchants).sort();
  }

  /**
   * Get all unique custom categories
   */
  getUniqueCategories(): string[] {
    const categories = new Set(this.transactions.map((t) => t.customCategory));
    return Array.from(categories).sort();
  }

  /**
   * Get all unique AMEX categories
   */
  getUniqueAMEXCategories(): string[] {
    const categories = new Set(this.transactions.map((t) => t.amexCategory.original));
    return Array.from(categories).sort();
  }

  /**
   * Check if a transaction matches the filter criteria
   */
  private matchesFilter(tx: ITransaction, filter: ITransactionFilter): boolean {
    // Date range
    if (filter.startDate && tx.date < filter.startDate) {
      return false;
    }
    if (filter.endDate && tx.date > filter.endDate) {
      return false;
    }

    // Amount range (use absolute value for comparison)
    const absAmount = Math.abs(tx.amount);
    if (filter.minAmount !== undefined && absAmount < filter.minAmount) {
      return false;
    }
    if (filter.maxAmount !== undefined && absAmount > filter.maxAmount) {
      return false;
    }

    // AMEX categories
    if (
      filter.amexCategories &&
      filter.amexCategories.length > 0 &&
      !filter.amexCategories.includes(tx.amexCategory.original)
    ) {
      return false;
    }

    // Custom categories
    if (
      filter.customCategories &&
      filter.customCategories.length > 0 &&
      !filter.customCategories.includes(tx.customCategory)
    ) {
      return false;
    }

    // Text search (case-insensitive, matches description, statement, or extended details)
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      const matchFields = [
        tx.description,
        tx.statementAs,
        tx.extendedDetails,
        tx.address.street,
        tx.address.cityState
      ].map((f) => f.toLowerCase());

      if (!matchFields.some((f) => f.includes(searchLower))) {
        return false;
      }
    }

    // Credit/charge filters
    if (filter.creditsOnly && !tx.isCredit) {
      return false;
    }
    if (filter.chargesOnly && tx.isCredit) {
      return false;
    }

    // Source file filter
    if (
      filter.sourceFiles &&
      filter.sourceFiles.length > 0 &&
      !filter.sourceFiles.includes(tx.sourceFile)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Sort transactions by specified field and direction
   */
  private sortTransactions(
    transactions: ITransaction[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): ITransaction[] {
    const sorted = [...transactions].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date':
          cmp = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          cmp = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'description':
          cmp = a.description.localeCompare(b.description);
          break;
        case 'category':
          cmp = a.customCategory.localeCompare(b.customCategory);
          break;
        default:
          cmp = 0;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }
}
