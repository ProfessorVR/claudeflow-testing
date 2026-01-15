/**
 * Finance Transaction Types
 * Core data models for AMEX transaction analysis
 */

/**
 * Raw AMEX CSV row (as parsed, before transformation)
 */
export interface IRawAMEXTransaction {
  Date: string;
  Description: string;
  Amount: string;
  'Extended Details': string;
  'Appears On Your Statement As': string;
  Address: string;
  'City/State': string;
  'Zip Code': string;
  Country: string;
  Reference: string;
  Category: string;
}

/**
 * AMEX category in "Primary - Subcategory" format
 */
export interface IAMEXCategory {
  /** Primary category (e.g., "Restaurant", "Merchandise & Supplies") */
  primary: string;
  /** Subcategory (e.g., "Bar & Cafe", "Internet Purchase") */
  subcategory: string;
  /** Original full string (e.g., "Restaurant-Bar & Cafe") */
  original: string;
}

/**
 * Normalized transaction after parsing and transformation
 */
export interface ITransaction {
  /** Unique transaction ID (derived from Reference or generated) */
  id: string;
  /** Transaction date (normalized to Date object) */
  date: Date;
  /** ISO date string for easy sorting/comparison */
  dateString: string;
  /** Transaction description (cleaned) */
  description: string;
  /** Transaction amount (positive = charge, negative = credit/refund) */
  amount: number;
  /** Is this a credit/refund (negative amount)? */
  isCredit: boolean;
  /** Extended details (cleaned) */
  extendedDetails: string;
  /** Statement display name */
  statementAs: string;
  /** Merchant address */
  address: {
    street: string;
    cityState: string;
    zipCode: string;
    country: string;
  };
  /** AMEX original category */
  amexCategory: IAMEXCategory;
  /** User-defined custom category (mapped from AMEX category) */
  customCategory: string;
  /** Original AMEX reference number */
  reference: string;
  /** Source file this transaction came from */
  sourceFile: string;
  /** Original row index in source file */
  sourceRow: number;
  /** Any parsing warnings */
  warnings?: string[];
}

/**
 * Custom category mapping configuration
 */
export interface ICategoryMapping {
  /** Version for tracking config changes */
  version: string;
  /** Description of this mapping */
  description: string;
  /** Map of AMEX category (full string) to custom category */
  amexToCustom: Record<string, string>;
  /** Custom category hierarchy (for rollups) */
  customHierarchy: Record<string, string[]>;
  /** Default custom category for unmapped AMEX categories */
  defaultCategory: string;
}

/**
 * Transaction search/filter criteria
 */
export interface ITransactionFilter {
  /** Date range start (inclusive) */
  startDate?: Date;
  /** Date range end (inclusive) */
  endDate?: Date;
  /** Minimum amount (inclusive) */
  minAmount?: number;
  /** Maximum amount (inclusive) */
  maxAmount?: number;
  /** AMEX categories to include (full strings) */
  amexCategories?: string[];
  /** Custom categories to include */
  customCategories?: string[];
  /** Merchant/description search text (case-insensitive) */
  searchText?: string;
  /** Only credits/refunds */
  creditsOnly?: boolean;
  /** Only charges */
  chargesOnly?: boolean;
  /** Specific source files to include */
  sourceFiles?: string[];
}
