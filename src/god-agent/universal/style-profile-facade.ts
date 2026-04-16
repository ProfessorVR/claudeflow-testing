/**
 * StyleProfileFacade - Thin facade over StyleProfileManager
 *
 * Extracted from UniversalAgent (Tranche E-03, SEAM-4).
 * Delegates all operations to StyleProfileManager.
 */

import { StyleProfileManager, type StoredStyleProfile, type StyleProfileMetadata } from './style-profile.js';
import type { StyleCharacteristics } from './style-analyzer.js';

export class StyleProfileFacade {
  constructor(
    private styleProfileManager: StyleProfileManager | undefined,
    private log: (message: string) => void,
    private ensureInitialized: () => Promise<void>
  ) {}

  /**
   * Learn a writing style from text samples
   */
  async learnStyle(
    name: string,
    textSamples: string[],
    options: {
      description?: string;
      tags?: string[];
      setAsActive?: boolean;
      lanhamMode?: 'auto' | 'on' | 'off';
      lanhamTier?: 'heuristic' | 'advanced';
    } = {}
  ): Promise<StoredStyleProfile | null> {
    await this.ensureInitialized();

    if (!this.styleProfileManager) {
      this.log('Warning: StyleProfileManager not available');
      return null;
    }

    try {
      const profile = await this.styleProfileManager.createProfile(name, textSamples, {
        description: options.description,
        sourceType: 'text',
        tags: options.tags,
        lanhamMode: options.lanhamMode,
        lanhamTier: options.lanhamTier,
      });

      if (options.setAsActive) {
        await this.styleProfileManager.setActiveProfile(profile.metadata.id);
        this.log(`Style profile "${name}" created and set as active`);
      } else {
        this.log(`Style profile "${name}" created`);
      }

      return profile;
    } catch (error) {
      this.log(`Error creating style profile: ${error}`);
      return null;
    }
  }

  /**
   * List all available style profiles
   */
  listProfiles(): StyleProfileMetadata[] {
    if (!this.styleProfileManager) {
      return [];
    }
    return this.styleProfileManager.listProfiles();
  }

  /**
   * Set the active style profile
   */
  async setActiveProfile(profileId: string | null): Promise<boolean> {
    if (!this.styleProfileManager) {
      this.log('Warning: StyleProfileManager not available');
      return false;
    }

    try {
      await this.styleProfileManager.setActiveProfile(profileId);
      this.log(`Active style profile set to: ${profileId ?? 'none'}`);
      return true;
    } catch (error) {
      this.log(`Error setting active style profile: ${error}`);
      return false;
    }
  }

  /**
   * Get the active style profile
   */
  getActiveProfile(): StoredStyleProfile | undefined {
    return this.styleProfileManager?.getActiveProfile();
  }

  /**
   * Get style characteristics for a profile
   */
  getCharacteristics(profileId?: string): StyleCharacteristics | null {
    if (!this.styleProfileManager) {
      return null;
    }
    return this.styleProfileManager.getStyleCharacteristics(profileId);
  }

  /**
   * Get style profile statistics
   */
  getStats(): { totalProfiles: number; activeProfile: string | null; totalSourceDocuments: number } {
    if (!this.styleProfileManager) {
      return { totalProfiles: 0, activeProfile: null, totalSourceDocuments: 0 };
    }
    return this.styleProfileManager.getStats();
  }

  /**
   * Get the underlying StyleProfileManager instance
   */
  getManager(): StyleProfileManager | undefined {
    return this.styleProfileManager;
  }
}
