/**
 * CitationDensityChecker - Quality stage for evaluating citation density
 *
 * PhD-level academic writing requires 15+ citations per major section.
 * This stage integrates with the CitationCounter module to:
 * - Check citation density per section
 * - Identify sections below threshold
 * - Calculate overall citation density metrics
 *
 * Part of Phase A Quality Enhancement implementation.
 */

import {
  BaseQualityStage,
  type QualityStageResult,
  type QualityIssue,
  type QualityEvaluationContext,
  countIssuesBySeverity,
} from '../quality-stage.js';
import { CitationCounter, type CitationStats, type SectionStats } from '../../composition/citation-counter.js';

// ============================================================================
// Configuration
// ============================================================================

// PhD dissertation chapter thresholds (5,000+ words)
const MIN_CITATIONS_PER_SECTION_DISSERTATION = 15;
const MIN_DENSITY_PER_1000_WORDS_DISSERTATION = 10; // citations per 1000 words

// Short document thresholds (under 3,000 words)
// For short analytical pieces, 1+ citation per section is acceptable
const MIN_CITATIONS_PER_SECTION_SHORT = 1;
const MIN_DENSITY_PER_1000_WORDS_SHORT = 2; // citations per 1000 words

// Medium document thresholds (3,000-5,000 words)
const MIN_CITATIONS_PER_SECTION_MEDIUM = 8;
const MIN_DENSITY_PER_1000_WORDS_MEDIUM = 6; // citations per 1000 words

/**
 * Get appropriate citation thresholds based on document word count
 */
function getThresholds(wordCount: number): { minCitations: number; minDensity: number } {
  if (wordCount < 3000) {
    return { minCitations: MIN_CITATIONS_PER_SECTION_SHORT, minDensity: MIN_DENSITY_PER_1000_WORDS_SHORT };
  } else if (wordCount < 5000) {
    return { minCitations: MIN_CITATIONS_PER_SECTION_MEDIUM, minDensity: MIN_DENSITY_PER_1000_WORDS_MEDIUM };
  } else {
    return { minCitations: MIN_CITATIONS_PER_SECTION_DISSERTATION, minDensity: MIN_DENSITY_PER_1000_WORDS_DISSERTATION };
  }
}

// ============================================================================
// CitationDensityChecker Class
// ============================================================================

/**
 * Quality stage that evaluates citation density in academic writing
 * Ensures PhD-level scholarly rigor with 15+ citations per section
 */
export class CitationDensityChecker extends BaseQualityStage {
  readonly name = 'citation-density';
  readonly weight = 0.12; // 12% weight in overall gauntlet (7-stage)
  readonly threshold = 0.80;

  private readonly citationCounter: CitationCounter;

  constructor() {
    super();
    this.citationCounter = new CitationCounter();
  }

  /**
   * Evaluate chapter text for citation density
   */
  async evaluate(
    chapterText: string,
    chapterId: number,
    _context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const startTime = Date.now();
    const issues: QualityIssue[] = [];
    const metrics: Record<string, number> = {};
    const suggestions: string[] = [];

    // Analyze citations using CitationCounter
    const stats = await this.citationCounter.analyze(chapterText);

    // Get document word count and appropriate thresholds
    const totalWordCount = stats.sections.reduce((sum, s) => sum + s.wordCount, 0);
    const { minCitations, minDensity } = getThresholds(totalWordCount);

    // Record metrics
    metrics['totalCitations'] = stats.total;
    metrics['overallDensity'] = stats.density;
    metrics['sectionsAnalyzed'] = stats.sections.length;
    metrics['documentWordCount'] = totalWordCount;
    metrics['minCitationsThreshold'] = minCitations;
    metrics['minDensityThreshold'] = minDensity;

    // Recalculate section thresholds based on document length
    const sectionsBelow = stats.sections.filter(s => s.citations < minCitations);
    const sectionsPassing = stats.sections.filter(s => s.citations >= minCitations);
    metrics['sectionsBelowThreshold'] = sectionsBelow.length;
    metrics['sectionsPassingThreshold'] = sectionsPassing.length;

    let issueIndex = 0;

    // Check each section for citation density (using dynamic thresholds)
    for (const section of stats.sections) {
      // Skip header-only sections and reference lists
      const sectionNameLower = section.name.toLowerCase();
      if (section.wordCount < 50 ||
          sectionNameLower === 'references' ||
          sectionNameLower === 'bibliography' ||
          sectionNameLower === 'introduction' && section.wordCount < 100) {
        continue;
      }

      const meetsThreshold = section.citations >= minCitations;
      const deficit = meetsThreshold ? 0 : minCitations - section.citations;

      if (!meetsThreshold) {
        // Determine severity based on how far below threshold
        const severity = this.determineSeverity(section.citations, deficit);

        issues.push({
          id: this.generateIssueId('citation', issueIndex++),
          type: 'citation',
          severity,
          location: {
            chapterId,
            sectionId: section.name,
          },
          description: `Section "${section.name}" has only ${section.citations} citations (need ${minCitations}+)`,
          suggestion: `Add ${deficit} more citations to meet the academic standard. Focus on peer-reviewed sources from Tier 1/2.`,
          autoFixable: false,
          contextSnippet: `${section.citations} citations, ${section.wordCount} words, density: ${section.density.toFixed(2)}/1000 words`,
          confidence: 1.0,
        });
      }

      // Check density per 1000 words (using dynamic threshold)
      if (section.density < minDensity && section.wordCount > 500) {
        issues.push({
          id: this.generateIssueId('citation', issueIndex++),
          type: 'citation',
          severity: 'minor',
          location: {
            chapterId,
            sectionId: section.name,
          },
          description: `Section "${section.name}" has low citation density: ${section.density.toFixed(2)} per 1000 words`,
          suggestion: `Aim for ${minDensity}+ citations per 1000 words for academic writing.`,
          autoFixable: false,
        });
      }

      // Track per-section metrics
      metrics[`section_${section.name.replace(/\s+/g, '_')}_citations`] = section.citations;
      metrics[`section_${section.name.replace(/\s+/g, '_')}_density`] = section.density;
    }

    // Overall document checks (scale minimum based on document length)
    // Short docs: 3+, medium: 8+, long: 15+
    const minTotalCitations = totalWordCount < 3000 ? 3 : totalWordCount < 5000 ? 8 : 15;
    if (stats.total < minTotalCitations) {
      issues.push({
        id: this.generateIssueId('citation', issueIndex++),
        type: 'citation',
        severity: 'critical',
        location: { chapterId },
        description: `Document has only ${stats.total} total citations - below academic standards (need ${minTotalCitations}+)`,
        suggestion: 'Academic writing requires scholarly engagement. Add citations from peer-reviewed sources.',
        autoFixable: false,
      });
    }

    // Generate suggestions
    if (sectionsBelow.length > 0) {
      suggestions.push(
        `${sectionsBelow.length} section(s) below the citation threshold of ${minCitations}. ` +
        `Consider adding citations from the corpus or conducting additional literature review.`
      );
    }

    if (stats.density < minDensity) {
      suggestions.push(
        `Overall citation density (${stats.density.toFixed(2)}/1000 words) is below the recommended ${minDensity}/1000 words. ` +
        `Academic writing benefits from denser scholarly engagement.`
      );
    }

    if (stats.sections.length === 1 && stats.sections[0].name === 'Document') {
      suggestions.push(
        'Consider structuring your document with section headers (## Section Name) for better organization and citation tracking.'
      );
    }

    // Calculate score
    const { critical, major, minor } = countIssuesBySeverity(issues);
    const totalSections = Math.max(stats.sections.length, 1);
    const score = this.calculateDensityScore(stats, critical, major, minor, totalSections);

    const passed = score >= this.threshold && critical === 0;

    return {
      stageName: this.name,
      passed,
      score,
      issues,
      metrics,
      suggestions,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Determine issue severity based on citation deficit
   */
  private determineSeverity(citations: number, deficit: number): 'critical' | 'major' | 'minor' {
    if (citations === 0) {
      return 'critical'; // No citations at all
    } else if (deficit > 10 || citations < 5) {
      return 'major'; // Significant deficit
    } else {
      return 'minor'; // Small deficit
    }
  }

  /**
   * Calculate quality score for citation density
   */
  private calculateDensityScore(
    stats: CitationStats,
    critical: number,
    major: number,
    minor: number,
    totalSections: number
  ): number {
    // Base score from sections meeting threshold
    const passingRatio = stats.sections.filter(s => s.meetsThreshold).length / totalSections;

    // Calculate issue penalty using logarithmic scaling
    const totalIssues = critical + major + minor;
    const weightedIssues = (critical * 3) + (major * 2) + (minor * 1);
    const issuePenalty = totalIssues > 0
      ? 0.15 * Math.log2(1 + weightedIssues)
      : 0;

    // Density bonus (up to 0.1)
    const densityBonus = Math.min(0.1, stats.density / 200);

    // Calculate final score (minimum 0.2 if there's any passing ratio)
    const minScore = passingRatio > 0 ? 0.2 : 0;
    const score = Math.max(minScore, Math.min(1, passingRatio - issuePenalty + densityBonus));

    return score;
  }

  /**
   * Check if an issue can be auto-fixed
   */
  canAutoFix(_issue: QualityIssue): boolean {
    // Citation density issues require manual addition of citations
    return false;
  }

  /**
   * Citation density issues cannot be auto-fixed
   */
  autoFix(text: string, _issue: QualityIssue): string {
    return text;
  }

  /**
   * Get sections below threshold for targeted enhancement
   */
  async getSectionsBelowThreshold(chapterText: string): Promise<SectionStats[]> {
    return this.citationCounter.getSectionsBelowThreshold(chapterText);
  }

  /**
   * Generate a detailed citation density report
   */
  async generateReport(chapterText: string): Promise<string> {
    return this.citationCounter.generateReport(chapterText);
  }
}
