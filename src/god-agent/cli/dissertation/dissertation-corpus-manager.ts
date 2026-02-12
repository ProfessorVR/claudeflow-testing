/**
 * Dissertation Corpus Manager
 *
 * Manages the dissertation-specific corpus structure with:
 * - in_progress/ - Sections and chapters currently being worked on
 * - finalized/ - Completed and approved sections and chapters
 *
 * Provides functionality for:
 * - Tracking section/chapter status (draft, review, finalized)
 * - Moving content between folders as it progresses
 * - Integrating with the quality gauntlet for validation before finalization
 * - Providing context to agents about which content is stable vs in-flux
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

/**
 * Status of a dissertation section in the corpus
 */
export type SectionStatus = 'draft' | 'review' | 'finalized';

/**
 * Type of content in the corpus
 */
export type ContentType = 'chapter' | 'section' | 'appendix' | 'frontmatter' | 'backmatter';

/**
 * Metadata for a dissertation content item
 */
export interface DissertationContentMetadata {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Content type */
  readonly type: ContentType;
  /** Chapter number (if applicable) */
  readonly chapterNumber?: number;
  /** Section number within chapter (if applicable) */
  readonly sectionNumber?: number;
  /** Current status */
  readonly status: SectionStatus;
  /** File path relative to corpus/dissertation */
  readonly relativePath: string;
  /** Absolute file path */
  readonly absolutePath: string;
  /** Last modified timestamp */
  readonly lastModified: Date;
  /** File size in bytes */
  readonly fileSize: number;
  /** Version number (incremented on each update) */
  readonly version: number;
  /** Word count (if parsed) */
  readonly wordCount?: number;
  /** Citation count (if parsed) */
  readonly citationCount?: number;
  /** Notes from last review */
  readonly reviewNotes?: string;
}

/**
 * Result of a finalization check
 */
export interface FinalizationCheckResult {
  /** Whether the content can be finalized */
  readonly canFinalize: boolean;
  /** Issues preventing finalization */
  readonly blockingIssues: string[];
  /** Warnings that don't block but should be noted */
  readonly warnings: string[];
  /** Quality score (0-1) */
  readonly qualityScore: number;
  /** Recommendations for improvement */
  readonly recommendations: string[];
}

/**
 * Configuration for the dissertation corpus
 */
export interface DissertationCorpusConfig {
  /** Base path to corpus directory */
  readonly corpusBasePath: string;
  /** Whether to auto-create missing directories */
  readonly autoCreateDirs: boolean;
  /** Minimum quality score for finalization */
  readonly minFinalizeScore: number;
  /** File extensions to include */
  readonly includedExtensions: string[];
  /** Metadata file name */
  readonly metadataFileName: string;
}

/**
 * Corpus statistics
 */
export interface CorpusStats {
  readonly totalItems: number;
  readonly inProgressCount: number;
  readonly finalizedCount: number;
  readonly byType: Record<ContentType, number>;
  readonly byStatus: Record<SectionStatus, number>;
  readonly totalWordCount: number;
  readonly lastActivity: Date | null;
}

/**
 * Content move result
 */
export interface MoveResult {
  readonly success: boolean;
  readonly fromPath: string;
  readonly toPath: string;
  readonly newStatus: SectionStatus;
  readonly error?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CORPUS_CONFIG: DissertationCorpusConfig = {
  corpusBasePath: 'corpus/dissertation',
  autoCreateDirs: true,
  minFinalizeScore: 0.85,
  includedExtensions: ['.md', '.pdf', '.docx', '.tex'],
  metadataFileName: '.dissertation-metadata.json',
};

// ============================================================================
// DissertationCorpusManager Class
// ============================================================================

export class DissertationCorpusManager {
  private readonly config: DissertationCorpusConfig;
  private readonly projectRoot: string;
  private readonly inProgressPath: string;
  private readonly finalizedPath: string;
  private metadataCache: Map<string, DissertationContentMetadata> = new Map();

  constructor(
    projectRoot?: string,
    config: Partial<DissertationCorpusConfig> = {}
  ) {
    this.projectRoot = projectRoot || process.cwd();
    this.config = { ...DEFAULT_CORPUS_CONFIG, ...config };

    this.inProgressPath = path.join(
      this.projectRoot,
      this.config.corpusBasePath,
      'in_progress'
    );
    this.finalizedPath = path.join(
      this.projectRoot,
      this.config.corpusBasePath,
      'finalized'
    );

    if (this.config.autoCreateDirs) {
      this.ensureDirectories();
    }

    this.loadMetadataCache();
  }

  // ==========================================================================
  // Directory Management
  // ==========================================================================

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [this.inProgressPath, this.finalizedPath];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Get the path for a specific status folder
   */
  getStatusPath(status: SectionStatus): string {
    switch (status) {
      case 'draft':
      case 'review':
        return this.inProgressPath;
      case 'finalized':
        return this.finalizedPath;
    }
  }

  // ==========================================================================
  // Metadata Management
  // ==========================================================================

  /**
   * Load metadata from disk cache
   */
  private loadMetadataCache(): void {
    const metadataPath = path.join(
      this.projectRoot,
      this.config.corpusBasePath,
      this.config.metadataFileName
    );

    if (fs.existsSync(metadataPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        for (const item of raw.items || []) {
          this.metadataCache.set(item.id, {
            ...item,
            lastModified: new Date(item.lastModified),
          });
        }
      } catch {
        // Start fresh if metadata is corrupted
        this.metadataCache.clear();
      }
    }
  }

  /**
   * Save metadata cache to disk
   */
  private saveMetadataCache(): void {
    const metadataPath = path.join(
      this.projectRoot,
      this.config.corpusBasePath,
      this.config.metadataFileName
    );

    const data = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      items: Array.from(this.metadataCache.values()),
    };

    fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
  }

  /**
   * Generate a unique ID for content
   */
  private generateContentId(
    type: ContentType,
    chapterNumber?: number,
    sectionNumber?: number
  ): string {
    const parts: string[] = [type];
    if (chapterNumber !== undefined) {
      parts.push(`ch${chapterNumber}`);
    }
    if (sectionNumber !== undefined) {
      parts.push(`sec${sectionNumber}`);
    }
    parts.push(Date.now().toString(36));
    return parts.join('-');
  }

  // ==========================================================================
  // Content Discovery
  // ==========================================================================

  /**
   * Scan directories and discover all content
   */
  scanCorpus(): DissertationContentMetadata[] {
    const items: DissertationContentMetadata[] = [];

    // Scan in_progress folder
    items.push(...this.scanDirectory(this.inProgressPath, 'draft'));

    // Scan finalized folder
    items.push(...this.scanDirectory(this.finalizedPath, 'finalized'));

    return items;
  }

  /**
   * Scan a specific directory for content
   */
  private scanDirectory(
    dirPath: string,
    defaultStatus: SectionStatus
  ): DissertationContentMetadata[] {
    const items: DissertationContentMetadata[] = [];

    if (!fs.existsSync(dirPath)) {
      return items;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!this.config.includedExtensions.includes(ext)) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(
          path.join(this.projectRoot, this.config.corpusBasePath),
          fullPath
        );

        // Check if we have cached metadata
        const existingMeta = Array.from(this.metadataCache.values()).find(
          m => m.relativePath === relativePath
        );

        const stats = fs.statSync(fullPath);
        const parsed = this.parseFileName(entry.name);

        const metadata: DissertationContentMetadata = existingMeta
          ? {
              ...existingMeta,
              lastModified: stats.mtime,
              fileSize: stats.size,
            }
          : {
              id: this.generateContentId(
                parsed.type,
                parsed.chapterNumber,
                parsed.sectionNumber
              ),
              name: parsed.name,
              type: parsed.type,
              chapterNumber: parsed.chapterNumber,
              sectionNumber: parsed.sectionNumber,
              status: defaultStatus,
              relativePath,
              absolutePath: fullPath,
              lastModified: stats.mtime,
              fileSize: stats.size,
              version: 1,
            };

        items.push(metadata);
        this.metadataCache.set(metadata.id, metadata);
      }
    }

    return items;
  }

  /**
   * Parse a file name to extract content metadata
   */
  private parseFileName(fileName: string): {
    name: string;
    type: ContentType;
    chapterNumber?: number;
    sectionNumber?: number;
  } {
    const baseName = path.basename(fileName, path.extname(fileName));

    // Try to extract chapter number
    const chapterMatch = baseName.match(/chapter[_\s-]?(\d+)/i);
    const sectionMatch = baseName.match(/section[_\s-]?(\d+)/i);

    let type: ContentType = 'section';
    if (/chapter/i.test(baseName)) {
      type = 'chapter';
    } else if (/appendix/i.test(baseName)) {
      type = 'appendix';
    } else if (/abstract|acknowledgment|dedication|preface/i.test(baseName)) {
      type = 'frontmatter';
    } else if (/bibliography|references|index/i.test(baseName)) {
      type = 'backmatter';
    }

    return {
      name: baseName,
      type,
      chapterNumber: chapterMatch ? parseInt(chapterMatch[1], 10) : undefined,
      sectionNumber: sectionMatch ? parseInt(sectionMatch[1], 10) : undefined,
    };
  }

  // ==========================================================================
  // Content Access
  // ==========================================================================

  /**
   * Get all content items
   */
  getAllContent(): DissertationContentMetadata[] {
    return this.scanCorpus();
  }

  /**
   * Get content by ID
   */
  getContentById(id: string): DissertationContentMetadata | undefined {
    // First check cache
    if (this.metadataCache.has(id)) {
      return this.metadataCache.get(id);
    }

    // Rescan to find it
    this.scanCorpus();
    return this.metadataCache.get(id);
  }

  /**
   * Get all in-progress content
   */
  getInProgressContent(): DissertationContentMetadata[] {
    return this.scanCorpus().filter(
      item => item.status === 'draft' || item.status === 'review'
    );
  }

  /**
   * Get all finalized content
   */
  getFinalizedContent(): DissertationContentMetadata[] {
    return this.scanCorpus().filter(item => item.status === 'finalized');
  }

  /**
   * Get content by chapter number
   */
  getChapterContent(chapterNumber: number): DissertationContentMetadata[] {
    return this.scanCorpus().filter(
      item => item.chapterNumber === chapterNumber
    );
  }

  /**
   * Get content by type
   */
  getContentByType(type: ContentType): DissertationContentMetadata[] {
    return this.scanCorpus().filter(item => item.type === type);
  }

  // ==========================================================================
  // Status Management
  // ==========================================================================

  /**
   * Update content status
   */
  updateStatus(
    id: string,
    newStatus: SectionStatus,
    notes?: string
  ): MoveResult {
    const content = this.getContentById(id);

    if (!content) {
      return {
        success: false,
        fromPath: '',
        toPath: '',
        newStatus,
        error: `Content with ID ${id} not found`,
      };
    }

    // Determine target directory
    const targetDir = this.getStatusPath(newStatus);
    const targetPath = path.join(targetDir, path.basename(content.absolutePath));

    // Don't move if already in correct location
    if (content.absolutePath === targetPath) {
      // Just update the metadata
      const updatedMetadata: DissertationContentMetadata = {
        ...content,
        status: newStatus,
        version: content.version + 1,
        reviewNotes: notes || content.reviewNotes,
      };
      this.metadataCache.set(id, updatedMetadata);
      this.saveMetadataCache();

      return {
        success: true,
        fromPath: content.absolutePath,
        toPath: targetPath,
        newStatus,
      };
    }

    try {
      // Move the file
      fs.renameSync(content.absolutePath, targetPath);

      // Update metadata
      const updatedMetadata: DissertationContentMetadata = {
        ...content,
        status: newStatus,
        absolutePath: targetPath,
        relativePath: path.relative(
          path.join(this.projectRoot, this.config.corpusBasePath),
          targetPath
        ),
        version: content.version + 1,
        reviewNotes: notes || content.reviewNotes,
      };
      this.metadataCache.set(id, updatedMetadata);
      this.saveMetadataCache();

      return {
        success: true,
        fromPath: content.absolutePath,
        toPath: targetPath,
        newStatus,
      };
    } catch (error) {
      return {
        success: false,
        fromPath: content.absolutePath,
        toPath: targetPath,
        newStatus,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Mark content as ready for review
   */
  markForReview(id: string, notes?: string): MoveResult {
    return this.updateStatus(id, 'review', notes);
  }

  /**
   * Finalize content (move to finalized folder)
   */
  finalize(id: string, notes?: string): MoveResult {
    return this.updateStatus(id, 'finalized', notes);
  }

  /**
   * Revert finalized content back to in-progress
   */
  revertToInProgress(id: string, reason?: string): MoveResult {
    return this.updateStatus(id, 'draft', reason);
  }

  // ==========================================================================
  // Finalization Validation
  // ==========================================================================

  /**
   * Check if content is ready for finalization
   */
  async checkFinalizationReadiness(
    id: string
  ): Promise<FinalizationCheckResult> {
    const content = this.getContentById(id);

    if (!content) {
      return {
        canFinalize: false,
        blockingIssues: [`Content with ID ${id} not found`],
        warnings: [],
        qualityScore: 0,
        recommendations: [],
      };
    }

    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let qualityScore = 1.0;

    // Check file exists
    if (!fs.existsSync(content.absolutePath)) {
      issues.push('File not found on disk');
      qualityScore = 0;
    }

    // Check file size (empty files shouldn't be finalized)
    if (content.fileSize < 100) {
      issues.push('File appears to be empty or too small');
      qualityScore *= 0.5;
    }

    // Check if it's been reviewed
    if (content.status === 'draft') {
      warnings.push('Content has not been marked for review yet');
      recommendations.push('Consider running through review process first');
      qualityScore *= 0.9;
    }

    // Check word count if available
    if (content.wordCount !== undefined && content.wordCount < 500) {
      warnings.push('Content has fewer than 500 words');
      recommendations.push('Ensure this is intentional for the content type');
    }

    // Check citation count for chapters
    if (
      content.type === 'chapter' &&
      content.citationCount !== undefined &&
      content.citationCount < 5
    ) {
      warnings.push('Chapter has fewer than 5 citations');
      recommendations.push('Consider adding more scholarly references');
      qualityScore *= 0.95;
    }

    const canFinalize =
      issues.length === 0 && qualityScore >= this.config.minFinalizeScore;

    return {
      canFinalize,
      blockingIssues: issues,
      warnings,
      qualityScore,
      recommendations,
    };
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get corpus statistics
   */
  getStats(): CorpusStats {
    const items = this.scanCorpus();

    const byType: Record<ContentType, number> = {
      chapter: 0,
      section: 0,
      appendix: 0,
      frontmatter: 0,
      backmatter: 0,
    };

    const byStatus: Record<SectionStatus, number> = {
      draft: 0,
      review: 0,
      finalized: 0,
    };

    let totalWordCount = 0;
    let lastActivity: Date | null = null;

    for (const item of items) {
      byType[item.type]++;
      byStatus[item.status]++;

      if (item.wordCount) {
        totalWordCount += item.wordCount;
      }

      if (!lastActivity || item.lastModified > lastActivity) {
        lastActivity = item.lastModified;
      }
    }

    return {
      totalItems: items.length,
      inProgressCount: byStatus.draft + byStatus.review,
      finalizedCount: byStatus.finalized,
      byType,
      byStatus,
      totalWordCount,
      lastActivity,
    };
  }

  // ==========================================================================
  // Integration Helpers
  // ==========================================================================

  /**
   * Get context information for agents about corpus state
   */
  getAgentContext(): {
    inProgressSummary: string;
    finalizedSummary: string;
    availableChapters: number[];
    recommendation: string;
  } {
    const inProgress = this.getInProgressContent();
    const finalized = this.getFinalizedContent();

    const inProgressChapters = new Set(
      inProgress.filter(i => i.chapterNumber).map(i => i.chapterNumber!)
    );
    const finalizedChapters = new Set(
      finalized.filter(i => i.chapterNumber).map(i => i.chapterNumber!)
    );

    const allChapters = new Set([...inProgressChapters, ...finalizedChapters]);

    let recommendation = '';
    if (inProgress.length === 0 && finalized.length === 0) {
      recommendation = 'No dissertation content found. Start by adding drafts to in_progress/';
    } else if (inProgress.length > 0 && finalized.length === 0) {
      recommendation = 'Content is in progress. Focus on completing and finalizing chapters.';
    } else if (inProgress.length === 0 && finalized.length > 0) {
      recommendation = 'All content is finalized. Ready for compilation or defense preparation.';
    } else {
      recommendation = `Working on ${inProgress.length} items. ${finalized.length} items finalized.`;
    }

    return {
      inProgressSummary: inProgress.map(i => i.name).join(', ') || 'None',
      finalizedSummary: finalized.map(i => i.name).join(', ') || 'None',
      availableChapters: Array.from(allChapters).sort((a, b) => a - b),
      recommendation,
    };
  }

  /**
   * Check if a chapter is fully finalized
   */
  isChapterFinalized(chapterNumber: number): boolean {
    const chapterContent = this.getChapterContent(chapterNumber);
    return (
      chapterContent.length > 0 &&
      chapterContent.every(item => item.status === 'finalized')
    );
  }

  /**
   * Get the path to a specific chapter's content
   */
  getChapterPath(
    chapterNumber: number,
    preferFinalized: boolean = true
  ): string | undefined {
    const chapterContent = this.getChapterContent(chapterNumber);

    if (chapterContent.length === 0) {
      return undefined;
    }

    if (preferFinalized) {
      const finalized = chapterContent.find(c => c.status === 'finalized');
      if (finalized) return finalized.absolutePath;
    }

    // Return the most recently modified version
    return chapterContent.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
    )[0].absolutePath;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let managerInstance: DissertationCorpusManager | null = null;

/**
 * Get the singleton corpus manager instance
 */
export function getDissertationCorpusManager(
  projectRoot?: string
): DissertationCorpusManager {
  if (!managerInstance) {
    managerInstance = new DissertationCorpusManager(projectRoot);
  }
  return managerInstance;
}

/**
 * Create a new corpus manager with custom configuration
 */
export function createDissertationCorpusManager(
  projectRoot?: string,
  config?: Partial<DissertationCorpusConfig>
): DissertationCorpusManager {
  return new DissertationCorpusManager(projectRoot, config);
}

// ============================================================================
// CLI Test
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new DissertationCorpusManager();

  console.log('=== Dissertation Corpus Stats ===');
  console.log(JSON.stringify(manager.getStats(), null, 2));

  console.log('\n=== In Progress Content ===');
  console.log(manager.getInProgressContent().map(c => c.name).join('\n') || 'None');

  console.log('\n=== Finalized Content ===');
  console.log(manager.getFinalizedContent().map(c => c.name).join('\n') || 'None');

  console.log('\n=== Agent Context ===');
  console.log(JSON.stringify(manager.getAgentContext(), null, 2));
}
