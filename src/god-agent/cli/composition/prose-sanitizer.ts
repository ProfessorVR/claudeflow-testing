import { createComponentLogger, type StructuredLogger } from '../../core/observability/logger.js';

export interface ArtifactViolation {
  type: 'research_artifact' | 'meta_commentary' | 'debug_marker';
  text: string;
  position: number;
  line: number;
  severity: 'critical' | 'warning';
}

export interface SanitizationResult {
  sanitized: string;
  violations: ArtifactViolation[];
  artifactCount: number;
  cleanRate: number;
}

/**
 * ProseSanitizer - Eliminates research artifacts from academic writing
 *
 * Research artifacts destroy academic credibility and signal amateur work.
 * This module ensures 100% artifact-free prose for publication-ready output.
 *
 * Target: 100% clean rate (zero tolerance for artifacts)
 */
export class ProseSanitizer {
  private readonly logger: StructuredLogger = createComponentLogger('ProseSanitizer');

  // Comprehensive artifact patterns - match artifact markers with following content
  private readonly ARTIFACT_PATTERNS = [
    // Research markers - match marker + content until next marker, newline, or end
    /\bQ\d+:[^Q\n]*(?=Q\d+:|$|\n)/gi,
    /\bFLAG:[^\n]*/gi,
    /\bHYPOTHESIS TO TEST:[^\n]*/gi,
    /\bStep-Back Analysis:[^\n]*/gi,
    /\bCLAIM\s*\d+:[^\n]*/gi,

    // Confidence scores
    /\bConfidence:\s*\d+%[^\n]*/gi,
    /\{.*?confidence.*?\}/gi,

    // Meta commentary
    /\[SYNTHESIS NEEDED\]/gi,
    /\[TODO:.*?\]/gi,
    /<<<.*?>>>/g,
    /\[EVIDENCE REQUIRED\]/gi,
    // [CITATION NEEDED] intentionally NOT stripped — Stage 9a injects these as
    // visible flags for paragraphs missing parenthetical citations. They must
    // survive sanitization so the gap is visible in the final output.

    // Debug markers
    /\bDEBUG:[^\n]*/gi,
    /\bFIXME:[^\n]*/gi,
    /\bNOTE TO SELF:[^\n]*/gi,
    /\bXXX:[^\n]*/gi,

    // Inline validation failure markers
    /\[GENERATION FAILED:.*?\](?:\n.*?)*?\[REQUIRES MANUAL REVIEW\]/gi,
    /\[GENERATION FAILED:[^\]]*\]/gi,
    /\[REQUIRES MANUAL REVIEW\]/gi,
    /\bIntent:[^\n]*/gi,
    /\bLast validation score:[^\n]*/gi,
    /\bCritical issues:[^\n]*/gi,

    // LLM meta-text leaks (from inline validation internal reasoning)
    /\bBased on the citation lookup results,?\s*I can now[^\n]*/gi,
    /\bLet me (?:generate|write|create|draft)[^\n]*/gi,
    /\bI'll now (?:generate|write|create|draft)[^\n]*/gi,
    /\bNow I'll (?:generate|write|create|draft)[^\n]*/gi,
    /\bNow I will (?:generate|write|create|draft)[^\n]*/gi,
    /\bHere (?:is|are) the (?:generated|written|drafted|completed)[^\n]*/gi,
    /\b(?:Using|Based on) the (?:evidence|sources|citations|corpus|chunks|search results)[^\n]*/gi,
    /\bI (?:will|shall) (?:now )?(?:generate|write|create|draft|compose)[^\n]*/gi,

    // Research scaffolding
    /\[PLACEHOLDER\]/gi,
    /\[INSERT.*?\]/gi,
    /\{INSERT.*?\}/gi,

    // Agent communication
    /\bAgent \d+:[^\n]*/gi,
    /\bPhase \d+:[^\n]*/gi,
    /\bStage \d+:[^\n]*/gi,
  ];

  /**
   * Sanitize content by removing all research artifacts
   */
  async sanitize(content: string): Promise<SanitizationResult> {
    this.logger.info('Starting prose sanitization', {
      contentLength: content.length
    });

    const violations: ArtifactViolation[] = [];
    let sanitized = content;

    // Detect and remove artifacts
    for (const pattern of this.ARTIFACT_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern));

      for (const match of matches) {
        violations.push({
          type: 'research_artifact',
          text: match[0],
          position: match.index!,
          line: this.getLineNumber(content, match.index!),
          severity: 'critical'
        });

        // Remove artifact
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Remove duplicate sections (same heading appearing twice)
    sanitized = this.removeDuplicateSections(sanitized);

    // Remove duplicate paragraphs (near-identical content from inline validation retries)
    sanitized = this.removeDuplicateParagraphs(sanitized);

    // Clean up extra whitespace from removals
    sanitized = this.cleanWhitespace(sanitized);

    const cleanRate = violations.length === 0 ? 1.0 : 1 - (violations.length / 100);

    this.logger.info('Sanitization complete', {
      violations: violations.length,
      cleanRate,
      artifactTypes: this.getArtifactTypeBreakdown(violations)
    });

    return {
      sanitized,
      violations,
      artifactCount: violations.length,
      cleanRate
    };
  }

  /**
   * Get line number for position in content
   */
  private getLineNumber(content: string, position: number): number {
    return content.substring(0, position).split('\n').length;
  }

  /**
   * Remove duplicate sections (same heading appearing more than once).
   * Keeps the first occurrence and removes subsequent duplicates.
   */
  private removeDuplicateSections(content: string): string {
    const lines = content.split('\n');
    const seenHeadings = new Set<string>();
    const result: string[] = [];
    let skipUntilNextHeading = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

      if (headingMatch) {
        const headingText = headingMatch[2].trim().toLowerCase();
        if (seenHeadings.has(headingText)) {
          // Skip this section until the next heading of same or higher level
          skipUntilNextHeading = true;
          continue;
        }
        seenHeadings.add(headingText);
        skipUntilNextHeading = false;
      }

      if (skipUntilNextHeading) {
        // Check if this line starts a new heading (end of duplicate section)
        if (line.match(/^#{1,4}\s+/) && !seenHeadings.has(line.replace(/^#{1,4}\s+/, '').trim().toLowerCase())) {
          skipUntilNextHeading = false;
          seenHeadings.add(line.replace(/^#{1,4}\s+/, '').trim().toLowerCase());
          result.push(line);
        }
        continue;
      }

      result.push(line);
    }

    return result.join('\n');
  }

  /**
   * Remove duplicate paragraphs (near-identical content from inline validation retries).
   * Compares the first 80 characters of each paragraph; if two paragraphs share the
   * same opening, keeps the longer one and removes the other.
   */
  private removeDuplicateParagraphs(content: string): string {
    const paragraphs = content.split(/\n\n+/);
    const seen = new Map<string, number>(); // fingerprint -> index in result
    const result: string[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Skip headings (handled by removeDuplicateSections)
      if (trimmed.match(/^#{1,4}\s+/)) {
        result.push(trimmed);
        continue;
      }

      // Fingerprint: first 80 chars, lowercased, whitespace-normalized
      const fingerprint = trimmed
        .slice(0, 80)
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[""'']/g, '"');

      if (seen.has(fingerprint)) {
        // Duplicate detected — keep the longer version
        const existingIdx = seen.get(fingerprint)!;
        if (trimmed.length > result[existingIdx].length) {
          result[existingIdx] = trimmed; // Replace with longer version
        }
        // Skip adding this duplicate
        continue;
      }

      seen.set(fingerprint, result.length);
      result.push(trimmed);
    }

    return result.join('\n\n');
  }

  /**
   * Clean up excessive whitespace after artifact removal
   */
  private cleanWhitespace(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
      .replace(/[ \t]{2,}/g, ' ')  // Max 1 space
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove triple newlines with spaces
      .trim();
  }

  /**
   * Get breakdown of artifact types for logging
   */
  private getArtifactTypeBreakdown(violations: ArtifactViolation[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const violation of violations) {
      const type = violation.type;
      breakdown[type] = (breakdown[type] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Validate that content is artifact-free
   */
  async validate(content: string): Promise<{ valid: boolean; violations: ArtifactViolation[] }> {
    const result = await this.sanitize(content);
    return {
      valid: result.violations.length === 0,
      violations: result.violations
    };
  }
}
