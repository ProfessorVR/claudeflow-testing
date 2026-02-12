/**
 * MissingSourceAcquisitionLayer - Download/locate missing sources
 *
 * This module handles the acquisition of sources that are missing from the corpus:
 * - Downloads open access PDFs and texts
 * - Provides links for paywalled sources
 * - Generates acquisition reports
 *
 * IMPORTANT: This module respects copyright and does NOT attempt to bypass paywalls.
 * For paywalled sources, it only provides legitimate access links.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import {
  type AcquisitionSuggestion,
  type SourceAvailability,
} from './source-verification-layer.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of attempting to acquire a source
 */
export interface AcquisitionResult {
  /** Source identifier */
  source: string;
  /** Author */
  author: string;
  /** Title */
  title: string;
  /** Acquisition status */
  status: 'downloaded' | 'link_provided' | 'not_found' | 'error';
  /** Path to downloaded file (if downloaded) */
  downloadPath?: string;
  /** URLs for manual access */
  accessUrls?: string[];
  /** Error message if failed */
  error?: string;
  /** File size in bytes (if downloaded) */
  fileSize?: number;
  /** Whether ingestion to corpus is needed */
  needsIngestion?: boolean;
}

/**
 * Configuration for acquisition
 */
export interface AcquisitionConfig {
  /** Directory to save downloaded files */
  downloadDir: string;
  /** Automatically download open access sources */
  autoDownload: boolean;
  /** Maximum file size to download (bytes) */
  maxDownloadSize: number;
  /** Timeout for downloads (ms) */
  downloadTimeout: number;
  /** Require approval before downloading */
  requireApproval: boolean;
  /** Verbose logging */
  verbose: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: AcquisitionConfig = {
  downloadDir: './corpus/downloads',
  autoDownload: true,
  maxDownloadSize: 50 * 1024 * 1024, // 50MB
  downloadTimeout: 60000, // 60 seconds
  requireApproval: false,
  verbose: false,
};

// ============================================================================
// MissingSourceAcquisitionLayer Class
// ============================================================================

/**
 * Handles acquisition of missing sources from the corpus
 */
export class MissingSourceAcquisitionLayer {
  private config: AcquisitionConfig;

  constructor(config: Partial<AcquisitionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Ensure download directory exists
    if (!fs.existsSync(this.config.downloadDir)) {
      fs.mkdirSync(this.config.downloadDir, { recursive: true });
    }
  }

  /**
   * Acquire a single source
   */
  async acquireSource(suggestion: AcquisitionSuggestion): Promise<AcquisitionResult> {
    const result: AcquisitionResult = {
      source: suggestion.source,
      author: suggestion.author,
      title: suggestion.title,
      status: 'not_found',
    };

    // For open access sources, attempt download
    if (suggestion.type === 'open_access' && suggestion.urls.openAccess?.length) {
      if (this.config.autoDownload) {
        for (const url of suggestion.urls.openAccess) {
          try {
            const downloadResult = await this.downloadFile(url, suggestion);
            if (downloadResult.success) {
              result.status = 'downloaded';
              result.downloadPath = downloadResult.path;
              result.fileSize = downloadResult.size;
              result.needsIngestion = true;
              return result;
            }
          } catch (error) {
            if (this.config.verbose) {
              console.warn(`Failed to download from ${url}:`, error);
            }
          }
        }
      }

      // If download failed or not enabled, provide links
      result.status = 'link_provided';
      result.accessUrls = suggestion.urls.openAccess;
      return result;
    }

    // For paywalled sources, provide links only
    if (suggestion.type === 'paywalled') {
      result.status = 'link_provided';
      result.accessUrls = [
        ...(suggestion.urls.purchase || []),
        ...(suggestion.urls.doi ? [suggestion.urls.doi] : []),
        ...(suggestion.urls.library ? [suggestion.urls.library] : []),
      ];
      return result;
    }

    // Unknown availability - provide any available links
    const allUrls = [
      ...(suggestion.urls.openAccess || []),
      ...(suggestion.urls.purchase || []),
      ...(suggestion.urls.doi ? [suggestion.urls.doi] : []),
      ...(suggestion.urls.library ? [suggestion.urls.library] : []),
    ];

    if (allUrls.length > 0) {
      result.status = 'link_provided';
      result.accessUrls = allUrls;
    }

    return result;
  }

  /**
   * Acquire multiple sources
   */
  async acquireSources(
    suggestions: AcquisitionSuggestion[]
  ): Promise<AcquisitionResult[]> {
    const results: AcquisitionResult[] = [];

    for (const suggestion of suggestions) {
      const result = await this.acquireSource(suggestion);
      results.push(result);

      if (this.config.verbose) {
        console.log(`[${result.status}] ${result.source}`);
      }
    }

    return results;
  }

  /**
   * Download a file from URL
   */
  private async downloadFile(
    url: string,
    suggestion: AcquisitionSuggestion
  ): Promise<{ success: boolean; path?: string; size?: number; error?: string }> {
    return new Promise((resolve) => {
      const filename = this.generateFilename(suggestion, url);
      const filepath = path.join(this.config.downloadDir, filename);

      // Check if already downloaded
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        resolve({ success: true, path: filepath, size: stats.size });
        return;
      }

      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const request = protocol.get(url, {
        timeout: this.config.downloadTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AcademicCorpusDownloader/1.0)',
        },
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.downloadFile(redirectUrl, suggestion).then(resolve);
            return;
          }
        }

        if (response.statusCode !== 200) {
          resolve({
            success: false,
            error: `HTTP ${response.statusCode}: ${response.statusMessage}`,
          });
          return;
        }

        // Check content length
        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        if (contentLength > this.config.maxDownloadSize) {
          resolve({
            success: false,
            error: `File too large: ${contentLength} bytes`,
          });
          return;
        }

        // Download file
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          const stats = fs.statSync(filepath);
          resolve({ success: true, path: filepath, size: stats.size });
        });

        fileStream.on('error', (error) => {
          fs.unlinkSync(filepath); // Clean up partial file
          resolve({ success: false, error: error.message });
        });
      });

      request.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({ success: false, error: 'Download timeout' });
      });
    });
  }

  /**
   * Generate a filename for the downloaded source
   */
  private generateFilename(suggestion: AcquisitionSuggestion, url: string): string {
    // Extract extension from URL
    const urlPath = new URL(url).pathname;
    let ext = path.extname(urlPath) || '.pdf';
    if (!ext.match(/^\.(pdf|txt|html|htm|epub)$/i)) {
      ext = '.pdf';
    }

    // Clean author and title for filename
    const cleanAuthor = suggestion.author
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);

    const cleanTitle = suggestion.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const year = suggestion.year ? `_${suggestion.year}` : '';

    return `${cleanAuthor}-${cleanTitle}${year}${ext}`;
  }

  /**
   * Generate a markdown report of acquisition results
   */
  generateAcquisitionReport(results: AcquisitionResult[]): string {
    const lines: string[] = [
      '# Source Acquisition Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      `**Download Directory:** ${this.config.downloadDir}`,
      '',
      '## Summary',
      '',
    ];

    const downloaded = results.filter(r => r.status === 'downloaded');
    const linkProvided = results.filter(r => r.status === 'link_provided');
    const notFound = results.filter(r => r.status === 'not_found');
    const errors = results.filter(r => r.status === 'error');

    lines.push(`- **Downloaded:** ${downloaded.length}`);
    lines.push(`- **Links Provided:** ${linkProvided.length}`);
    lines.push(`- **Not Found:** ${notFound.length}`);
    if (errors.length > 0) {
      lines.push(`- **Errors:** ${errors.length}`);
    }
    lines.push('');

    // Downloaded sources
    if (downloaded.length > 0) {
      lines.push('## Downloaded Sources', '');
      lines.push('These sources have been downloaded and are ready for corpus ingestion:', '');

      for (const result of downloaded) {
        lines.push(`### ${result.author} - ${result.title}`);
        lines.push(`- **Path:** \`${result.downloadPath}\``);
        if (result.fileSize) {
          lines.push(`- **Size:** ${this.formatFileSize(result.fileSize)}`);
        }
        lines.push(`- **Needs Ingestion:** ${result.needsIngestion ? 'Yes' : 'No'}`);
        lines.push('');
      }
    }

    // Sources requiring manual acquisition
    if (linkProvided.length > 0) {
      lines.push('## Sources Requiring Manual Acquisition', '');
      lines.push('These sources are paywalled or require manual download:', '');

      for (const result of linkProvided) {
        lines.push(`### ${result.author} - ${result.title}`);
        if (result.accessUrls?.length) {
          lines.push('**Access URLs:**');
          for (const url of result.accessUrls) {
            lines.push(`- ${url}`);
          }
        }
        lines.push('');
      }
    }

    // Not found
    if (notFound.length > 0) {
      lines.push('## Sources Not Found', '');
      lines.push('These sources could not be located:', '');

      for (const result of notFound) {
        lines.push(`- ${result.author} - ${result.title}`);
      }
      lines.push('');
    }

    // Errors
    if (errors.length > 0) {
      lines.push('## Errors', '');
      for (const result of errors) {
        lines.push(`- **${result.source}:** ${result.error}`);
      }
      lines.push('');
    }

    // Ingestion instructions
    if (downloaded.length > 0) {
      lines.push('## Next Steps', '');
      lines.push('To ingest downloaded sources into the corpus:', '');
      lines.push('```bash');
      lines.push(`python scripts/ingest/run_ingest.py --input "${this.config.downloadDir}"`);
      lines.push('```');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an acquisition layer with default settings
 */
export function createMissingSourceAcquisitionLayer(
  config?: Partial<AcquisitionConfig>
): MissingSourceAcquisitionLayer {
  return new MissingSourceAcquisitionLayer(config);
}

/**
 * Singleton instance
 */
let _instance: MissingSourceAcquisitionLayer | null = null;

export function getMissingSourceAcquisitionLayer(): MissingSourceAcquisitionLayer {
  if (!_instance) {
    _instance = new MissingSourceAcquisitionLayer();
  }
  return _instance;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Missing Source Acquisition Layer

Usage:
  npx tsx missing-source-acquisition.ts --source <name> [options]
  npx tsx missing-source-acquisition.ts --suggestions <json-file> [options]

Options:
  --source <name>        Single source to acquire (author - title)
  --suggestions <file>   JSON file with AcquisitionSuggestion array
  --download-dir <dir>   Download directory (default: ./corpus/downloads)
  --no-download          Don't auto-download, just provide links
  --output <file>        Output report file (default: stdout)
  --json                 Output as JSON
  --verbose              Verbose logging
  --help, -h             Show this help
`);
    process.exit(0);
  }

  const sourceIndex = args.indexOf('--source');
  const suggestionsIndex = args.indexOf('--suggestions');
  const downloadDirIndex = args.indexOf('--download-dir');
  const outputIndex = args.indexOf('--output');
  const noDownload = args.includes('--no-download');
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');

  // Config
  const config: Partial<AcquisitionConfig> = {
    autoDownload: !noDownload,
    verbose,
  };

  if (downloadDirIndex !== -1) {
    config.downloadDir = args[downloadDirIndex + 1];
  }

  const layer = new MissingSourceAcquisitionLayer(config);

  // Get suggestions
  let suggestions: AcquisitionSuggestion[] = [];

  if (suggestionsIndex !== -1 && args[suggestionsIndex + 1]) {
    const suggestionsFile = args[suggestionsIndex + 1];
    if (!fs.existsSync(suggestionsFile)) {
      console.error(`Error: Suggestions file not found: ${suggestionsFile}`);
      process.exit(1);
    }
    suggestions = JSON.parse(fs.readFileSync(suggestionsFile, 'utf-8'));
  } else if (sourceIndex !== -1 && args[sourceIndex + 1]) {
    const sourceStr = args[sourceIndex + 1];
    const [author, ...titleParts] = sourceStr.split(' - ');
    suggestions = [{
      source: sourceStr,
      author: author.trim(),
      title: titleParts.join(' - ').trim() || 'Unknown',
      type: 'unknown' as SourceAvailability,
      urls: {},
    }];
  } else {
    console.error('Error: --source or --suggestions required');
    process.exit(1);
  }

  // Acquire
  const results = await layer.acquireSources(suggestions);

  // Output
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : undefined;

  if (jsonOutput) {
    const output = JSON.stringify(results, null, 2);
    if (outputFile) {
      fs.writeFileSync(outputFile, output);
    } else {
      console.log(output);
    }
  } else {
    const report = layer.generateAcquisitionReport(results);
    if (outputFile) {
      fs.writeFileSync(outputFile, report);
    } else {
      console.log(report);
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
