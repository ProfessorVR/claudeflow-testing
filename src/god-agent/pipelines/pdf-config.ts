/**
 * Configuration Presets for PDF Analysis
 * Allows saving and loading user preferences
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { AnalysisConfig } from './pdf-analysis-types.js';

export interface ConfigPreset {
  name: string;
  description: string;
  config: Partial<AnalysisConfig>;
  createdAt: string;
  lastUsed?: string;
}

export class PDFAnalysisConfigManager {
  private configDir: string;
  private presetsFile: string;

  constructor(configDir: string = './.pdf-analysis-config') {
    this.configDir = configDir;
    this.presetsFile = join(configDir, 'presets.json');
  }

  /**
   * Save a configuration preset
   */
  async savePreset(name: string, description: string, config: Partial<AnalysisConfig>): Promise<void> {
    await fs.mkdir(this.configDir, { recursive: true });

    const presets = await this.loadAllPresets();

    const preset: ConfigPreset = {
      name,
      description,
      config,
      createdAt: new Date().toISOString(),
    };

    // Update or add preset
    const existingIndex = presets.findIndex((p) => p.name === name);
    if (existingIndex >= 0) {
      presets[existingIndex] = preset;
    } else {
      presets.push(preset);
    }

    await fs.writeFile(this.presetsFile, JSON.stringify(presets, null, 2));
  }

  /**
   * Load a configuration preset
   */
  async loadPreset(name: string): Promise<ConfigPreset | null> {
    const presets = await this.loadAllPresets();
    const preset = presets.find((p) => p.name === name);

    if (preset) {
      // Update last used timestamp
      preset.lastUsed = new Date().toISOString();
      await fs.writeFile(this.presetsFile, JSON.stringify(presets, null, 2));
    }

    return preset || null;
  }

  /**
   * Load all presets
   */
  async loadAllPresets(): Promise<ConfigPreset[]> {
    try {
      const data = await fs.readFile(this.presetsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Delete a preset
   */
  async deletePreset(name: string): Promise<boolean> {
    const presets = await this.loadAllPresets();
    const filtered = presets.filter((p) => p.name !== name);

    if (filtered.length === presets.length) {
      return false; // Preset not found
    }

    await fs.writeFile(this.presetsFile, JSON.stringify(filtered, null, 2));
    return true;
  }

  /**
   * Get default presets
   */
  static getDefaultPresets(): ConfigPreset[] {
    return [
      {
        name: 'quick-scan',
        description: 'Quick overview with large chunks',
        config: {
          mode: 'auto',
          pagesPerChunk: 50,
          reviewBeforeAnalysis: false,
          saveCheckpoints: false,
        },
        createdAt: new Date().toISOString(),
      },
      {
        name: 'detailed-analysis',
        description: 'Detailed analysis with small chunks',
        config: {
          mode: 'hybrid',
          pagesPerChunk: 15,
          reviewBeforeAnalysis: true,
          saveCheckpoints: true,
        },
        createdAt: new Date().toISOString(),
      },
      {
        name: 'academic-paper',
        description: 'Optimized for academic papers',
        config: {
          mode: 'hybrid',
          pagesPerChunk: 20,
          reviewBeforeAnalysis: true,
          saveCheckpoints: true,
        },
        createdAt: new Date().toISOString(),
      },
      {
        name: 'thesis-dissertation',
        description: 'Optimized for long dissertations',
        config: {
          mode: 'hybrid',
          pagesPerChunk: 30,
          reviewBeforeAnalysis: true,
          saveCheckpoints: true,
        },
        createdAt: new Date().toISOString(),
      },
      {
        name: 'manual-control',
        description: 'Full manual control',
        config: {
          mode: 'manual',
          pagesPerChunk: 30,
          reviewBeforeAnalysis: false,
          saveCheckpoints: false,
        },
        createdAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Initialize with default presets
   */
  async initializeDefaults(): Promise<void> {
    const existing = await this.loadAllPresets();
    if (existing.length === 0) {
      const defaults = PDFAnalysisConfigManager.getDefaultPresets();
      await fs.mkdir(this.configDir, { recursive: true });
      await fs.writeFile(this.presetsFile, JSON.stringify(defaults, null, 2));
    }
  }

  /**
   * Merge preset with custom config
   */
  static mergeConfig(preset: ConfigPreset, overrides: Partial<AnalysisConfig>): AnalysisConfig {
    return {
      ...preset.config,
      ...overrides,
    } as AnalysisConfig;
  }
}
