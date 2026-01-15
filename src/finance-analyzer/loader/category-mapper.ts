/**
 * Category Mapper
 * Loads and applies custom category mappings to AMEX transactions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ICategoryMapping, IAMEXCategory } from '../types/index.js';

const DEFAULT_MAPPING_PATH = 'config/finance/category-mapping.json';

/**
 * Category mapper that converts AMEX categories to custom categories
 */
export class CategoryMapper {
  private mapping: ICategoryMapping | null = null;
  private mappingPath: string;

  constructor(mappingPath?: string) {
    this.mappingPath = mappingPath || DEFAULT_MAPPING_PATH;
  }

  /**
   * Load category mapping from JSON file
   */
  async load(basePath: string): Promise<void> {
    const fullPath = path.join(basePath, this.mappingPath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      this.mapping = JSON.parse(content) as ICategoryMapping;
    } catch (error) {
      throw new Error(`Failed to load category mapping from ${fullPath}: ${error}`);
    }
  }

  /**
   * Parse AMEX category string into structured format
   * e.g., "Restaurant-Bar & Café" -> { primary: "Restaurant", subcategory: "Bar & Café", original: "Restaurant-Bar & Café" }
   */
  parseAMEXCategory(categoryString: string): IAMEXCategory {
    const trimmed = categoryString.trim();
    const dashIndex = trimmed.indexOf('-');

    if (dashIndex === -1) {
      return {
        primary: trimmed,
        subcategory: '',
        original: trimmed
      };
    }

    return {
      primary: trimmed.substring(0, dashIndex).trim(),
      subcategory: trimmed.substring(dashIndex + 1).trim(),
      original: trimmed
    };
  }

  /**
   * Map an AMEX category to a custom category
   */
  mapToCustom(amexCategory: string): string {
    if (!this.mapping) {
      throw new Error('Category mapping not loaded. Call load() first.');
    }

    // Try exact match first
    const customCategory = this.mapping.amexToCustom[amexCategory];
    if (customCategory) {
      return customCategory;
    }

    // Try normalized match (handle minor variations)
    const normalized = amexCategory.replace(/\s+/g, ' ').trim();
    for (const [key, value] of Object.entries(this.mapping.amexToCustom)) {
      if (key.replace(/\s+/g, ' ').trim() === normalized) {
        return value;
      }
    }

    return this.mapping.defaultCategory;
  }

  /**
   * Get all unique custom categories
   */
  getCustomCategories(): string[] {
    if (!this.mapping) {
      throw new Error('Category mapping not loaded. Call load() first.');
    }

    const categories = new Set(Object.values(this.mapping.amexToCustom));
    categories.add(this.mapping.defaultCategory);
    return Array.from(categories).sort();
  }

  /**
   * Get category hierarchy (for rollups)
   */
  getHierarchy(): Record<string, string[]> {
    if (!this.mapping) {
      throw new Error('Category mapping not loaded. Call load() first.');
    }
    return this.mapping.customHierarchy;
  }

  /**
   * Get parent category for a custom category
   */
  getParentCategory(customCategory: string): string | null {
    if (!this.mapping) {
      throw new Error('Category mapping not loaded. Call load() first.');
    }

    for (const [parent, children] of Object.entries(this.mapping.customHierarchy)) {
      if (children.includes(customCategory)) {
        return parent;
      }
    }
    return null;
  }

  /**
   * Check if mapping is loaded
   */
  isLoaded(): boolean {
    return this.mapping !== null;
  }

  /**
   * Get raw mapping for debugging
   */
  getRawMapping(): ICategoryMapping | null {
    return this.mapping;
  }
}
