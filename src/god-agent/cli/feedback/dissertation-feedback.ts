/**
 * DissertationFeedback - Extended feedback interface for dissertation-specific writing
 * Provides specialized feedback categories for academic philosophical writing
 */

import type { ParagraphFeedback, IssueType } from './paragraph-feedback-capture.js';

/**
 * Rating scale for philosophical feedback (1-5)
 */
export type PhilosophicalRating = 1 | 2 | 3 | 4 | 5;

/**
 * Dissertation-specific philosophical feedback categories
 */
export interface PhilosophicalFeedbackCategories {
  /** How well does it use philosophical terms correctly? (1-5) */
  terminologicalAccuracy: PhilosophicalRating;
  /** Is the argument clear and well-structured? (1-5) */
  argumentClarity: PhilosophicalRating;
  /** Does it sound appropriately scholarly? (1-5) */
  scholarlyTone: PhilosophicalRating;
  /** How well does it integrate scholarly sources? (1-5) */
  integrationQuality: PhilosophicalRating;
  /** For Heideggerian sections: phenomenological precision (1-5) */
  phenomenologicalPrecision?: PhilosophicalRating;
  /** For Aristotelian sections: exegetical accuracy (1-5) */
  exegeticalAccuracy?: PhilosophicalRating;
}

/**
 * Issue flags for specific dissertation problems
 */
export interface DissertationIssueFlags {
  /** Needs more citations to support claims */
  needsMoreCitations: boolean;
  /** Too speculative without textual grounding */
  tooSpeculative: boolean;
  /** Misses relevant primary text passages */
  missesPrimaryText: boolean;
  /** Too technical for the audience level */
  overlyTechnical: boolean;
  /** Tone is inconsistent with dissertation voice */
  toneInconsistent: boolean;
  /** Argument is weak or unconvincing */
  argumentWeak: boolean;
  /** Greek/technical term used incorrectly */
  terminologyError: boolean;
  /** Anachronistic concept or language */
  anachronism: boolean;
  /** Conflates Aristotelian and Heideggerian concepts */
  conceptConflation: boolean;
}

/**
 * Section type for context-aware feedback
 */
export type DissertationSectionType =
  | 'introduction'
  | 'literature_review'
  | 'textual_analysis'
  | 'phenomenological_description'
  | 'argument_synthesis'
  | 'conclusion'
  | 'transition';

/**
 * Extended feedback interface for dissertation writing
 */
export interface DissertationFeedback extends ParagraphFeedback {
  // Extended dissertation-specific fields

  /** The type of section being evaluated */
  sectionType?: DissertationSectionType;

  /** Detailed philosophical feedback ratings */
  philosophicalFeedback?: PhilosophicalFeedbackCategories;

  /** Specific issue flags */
  issueFlags?: Partial<DissertationIssueFlags>;

  /** Which chapter this is from (1-indexed) */
  chapterNumber?: number;

  /** Section identifier within chapter */
  sectionId?: string;

  /** Primary authors referenced in this section */
  primaryAuthors?: string[];

  /** Greek terms used that need verification */
  greekTermsUsed?: string[];

  /** Specific revision guidance from user */
  revisionGuidance?: string;

  /** Whether this section involves Aristotle-Heidegger synthesis */
  isSynthesisSection?: boolean;

  /** Whether this section involves phenomenological analysis */
  isPhenomenologicalSection?: boolean;
}

/**
 * Aggregate feedback statistics for a chapter
 */
export interface ChapterFeedbackSummary {
  chapterId: number;
  feedbackCount: number;

  /** Average ratings across philosophical categories */
  averageRatings: {
    terminologicalAccuracy: number;
    argumentClarity: number;
    scholarlyTone: number;
    integrationQuality: number;
    phenomenologicalPrecision?: number;
    exegeticalAccuracy?: number;
  };

  /** Issue flag frequencies */
  issueFrequencies: Record<keyof DissertationIssueFlags, number>;

  /** Voice match ratio (soundsLikeMe) */
  voiceMatchRatio: number;

  /** Correction rate */
  correctionRate: number;

  /** Most common issues */
  topIssues: Array<{ issue: string; count: number }>;
}

/**
 * Aggregate feedback statistics for entire dissertation
 */
export interface DissertationFeedbackSummary {
  /** Total feedback items */
  totalFeedback: number;

  /** Feedback by chapter */
  byChapter: Map<number, ChapterFeedbackSummary>;

  /** Global average ratings */
  globalAverageRatings: {
    terminologicalAccuracy: number;
    argumentClarity: number;
    scholarlyTone: number;
    integrationQuality: number;
  };

  /** Global issue frequencies */
  globalIssueFrequencies: Record<keyof DissertationIssueFlags, number>;

  /** Overall voice match ratio */
  overallVoiceMatchRatio: number;

  /** Sections needing most improvement */
  problemSections: Array<{
    chapterId: number;
    sectionId: string;
    issues: string[];
  }>;

  /** Learning recommendations */
  learningRecommendations: string[];
}

/**
 * DissertationFeedbackCollector - Collects and analyzes dissertation-specific feedback
 */
export class DissertationFeedbackCollector {
  private feedback: DissertationFeedback[] = [];

  /**
   * Add dissertation feedback
   */
  addFeedback(feedback: DissertationFeedback): void {
    this.feedback.push(feedback);
  }

  /**
   * Get all feedback
   */
  getAllFeedback(): DissertationFeedback[] {
    return [...this.feedback];
  }

  /**
   * Get feedback for a specific chapter
   */
  getFeedbackByChapter(chapterId: number): DissertationFeedback[] {
    return this.feedback.filter(f => f.chapterNumber === chapterId);
  }

  /**
   * Get feedback for a specific section type
   */
  getFeedbackBySectionType(sectionType: DissertationSectionType): DissertationFeedback[] {
    return this.feedback.filter(f => f.sectionType === sectionType);
  }

  /**
   * Get feedback with specific issue flag
   */
  getFeedbackWithIssue(issue: keyof DissertationIssueFlags): DissertationFeedback[] {
    return this.feedback.filter(f => f.issueFlags?.[issue] === true);
  }

  /**
   * Generate chapter feedback summary
   */
  getChapterSummary(chapterId: number): ChapterFeedbackSummary {
    const chapterFeedback = this.getFeedbackByChapter(chapterId);

    // Calculate average ratings
    const ratingsSum = {
      terminologicalAccuracy: 0,
      argumentClarity: 0,
      scholarlyTone: 0,
      integrationQuality: 0,
      phenomenologicalPrecision: 0,
      exegeticalAccuracy: 0,
    };
    const ratingsCounts = { ...ratingsSum };

    for (const f of chapterFeedback) {
      if (f.philosophicalFeedback) {
        const pf = f.philosophicalFeedback;
        ratingsSum.terminologicalAccuracy += pf.terminologicalAccuracy;
        ratingsSum.argumentClarity += pf.argumentClarity;
        ratingsSum.scholarlyTone += pf.scholarlyTone;
        ratingsSum.integrationQuality += pf.integrationQuality;
        ratingsCounts.terminologicalAccuracy++;
        ratingsCounts.argumentClarity++;
        ratingsCounts.scholarlyTone++;
        ratingsCounts.integrationQuality++;

        if (pf.phenomenologicalPrecision) {
          ratingsSum.phenomenologicalPrecision += pf.phenomenologicalPrecision;
          ratingsCounts.phenomenologicalPrecision++;
        }
        if (pf.exegeticalAccuracy) {
          ratingsSum.exegeticalAccuracy += pf.exegeticalAccuracy;
          ratingsCounts.exegeticalAccuracy++;
        }
      }
    }

    const averageRatings = {
      terminologicalAccuracy: ratingsCounts.terminologicalAccuracy > 0
        ? ratingsSum.terminologicalAccuracy / ratingsCounts.terminologicalAccuracy : 0,
      argumentClarity: ratingsCounts.argumentClarity > 0
        ? ratingsSum.argumentClarity / ratingsCounts.argumentClarity : 0,
      scholarlyTone: ratingsCounts.scholarlyTone > 0
        ? ratingsSum.scholarlyTone / ratingsCounts.scholarlyTone : 0,
      integrationQuality: ratingsCounts.integrationQuality > 0
        ? ratingsSum.integrationQuality / ratingsCounts.integrationQuality : 0,
      phenomenologicalPrecision: ratingsCounts.phenomenologicalPrecision > 0
        ? ratingsSum.phenomenologicalPrecision / ratingsCounts.phenomenologicalPrecision : undefined,
      exegeticalAccuracy: ratingsCounts.exegeticalAccuracy > 0
        ? ratingsSum.exegeticalAccuracy / ratingsCounts.exegeticalAccuracy : undefined,
    };

    // Calculate issue frequencies
    const issueFrequencies: Record<keyof DissertationIssueFlags, number> = {
      needsMoreCitations: 0,
      tooSpeculative: 0,
      missesPrimaryText: 0,
      overlyTechnical: 0,
      toneInconsistent: 0,
      argumentWeak: 0,
      terminologyError: 0,
      anachronism: 0,
      conceptConflation: 0,
    };

    for (const f of chapterFeedback) {
      if (f.issueFlags) {
        for (const [key, value] of Object.entries(f.issueFlags)) {
          if (value === true) {
            issueFrequencies[key as keyof DissertationIssueFlags]++;
          }
        }
      }
    }

    // Calculate voice match and correction rates
    const voiceMatchCount = chapterFeedback.filter(f => f.soundsLikeMe).length;
    const correctionCount = chapterFeedback.filter(f => f.userCorrection).length;

    // Find top issues
    const topIssues = Object.entries(issueFrequencies)
      .filter(([, count]) => count > 0)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      chapterId,
      feedbackCount: chapterFeedback.length,
      averageRatings,
      issueFrequencies,
      voiceMatchRatio: chapterFeedback.length > 0 ? voiceMatchCount / chapterFeedback.length : 0,
      correctionRate: chapterFeedback.length > 0 ? correctionCount / chapterFeedback.length : 0,
      topIssues,
    };
  }

  /**
   * Generate dissertation-wide feedback summary
   */
  getDissertationSummary(): DissertationFeedbackSummary {
    // Get unique chapter IDs
    const chapterIds = new Set(this.feedback.map(f => f.chapterNumber).filter(Boolean) as number[]);

    // Generate summaries by chapter
    const byChapter = new Map<number, ChapterFeedbackSummary>();
    for (const chapterId of chapterIds) {
      byChapter.set(chapterId, this.getChapterSummary(chapterId));
    }

    // Calculate global averages
    const allWithRatings = this.feedback.filter(f => f.philosophicalFeedback);
    let globalRatingsSum = {
      terminologicalAccuracy: 0,
      argumentClarity: 0,
      scholarlyTone: 0,
      integrationQuality: 0,
    };

    for (const f of allWithRatings) {
      const pf = f.philosophicalFeedback!;
      globalRatingsSum.terminologicalAccuracy += pf.terminologicalAccuracy;
      globalRatingsSum.argumentClarity += pf.argumentClarity;
      globalRatingsSum.scholarlyTone += pf.scholarlyTone;
      globalRatingsSum.integrationQuality += pf.integrationQuality;
    }

    const count = allWithRatings.length || 1;
    const globalAverageRatings = {
      terminologicalAccuracy: globalRatingsSum.terminologicalAccuracy / count,
      argumentClarity: globalRatingsSum.argumentClarity / count,
      scholarlyTone: globalRatingsSum.scholarlyTone / count,
      integrationQuality: globalRatingsSum.integrationQuality / count,
    };

    // Global issue frequencies
    const globalIssueFrequencies: Record<keyof DissertationIssueFlags, number> = {
      needsMoreCitations: 0,
      tooSpeculative: 0,
      missesPrimaryText: 0,
      overlyTechnical: 0,
      toneInconsistent: 0,
      argumentWeak: 0,
      terminologyError: 0,
      anachronism: 0,
      conceptConflation: 0,
    };

    for (const f of this.feedback) {
      if (f.issueFlags) {
        for (const [key, value] of Object.entries(f.issueFlags)) {
          if (value === true) {
            globalIssueFrequencies[key as keyof DissertationIssueFlags]++;
          }
        }
      }
    }

    // Find problem sections
    const problemSections: Array<{ chapterId: number; sectionId: string; issues: string[] }> = [];
    for (const f of this.feedback) {
      if (f.chapterNumber && f.sectionId && f.issueFlags) {
        const issues = Object.entries(f.issueFlags)
          .filter(([, value]) => value === true)
          .map(([key]) => key);
        if (issues.length >= 2) {
          problemSections.push({
            chapterId: f.chapterNumber,
            sectionId: f.sectionId,
            issues,
          });
        }
      }
    }

    // Generate learning recommendations
    const learningRecommendations: string[] = [];

    if (globalIssueFrequencies.needsMoreCitations > 3) {
      learningRecommendations.push('Increase citation density - integrate more scholarly sources');
    }
    if (globalIssueFrequencies.tooSpeculative > 3) {
      learningRecommendations.push('Ground claims more firmly in textual evidence');
    }
    if (globalIssueFrequencies.argumentWeak > 3) {
      learningRecommendations.push('Strengthen argument structure with clearer warrants');
    }
    if (globalIssueFrequencies.terminologyError > 2) {
      learningRecommendations.push('Review Greek/technical term usage for consistency');
    }
    if (globalIssueFrequencies.conceptConflation > 1) {
      learningRecommendations.push('Maintain clearer distinctions between Aristotelian and Heideggerian concepts');
    }
    if (globalAverageRatings.scholarlyTone < 3.5) {
      learningRecommendations.push('Elevate scholarly tone - reduce informal language');
    }

    return {
      totalFeedback: this.feedback.length,
      byChapter,
      globalAverageRatings,
      globalIssueFrequencies,
      overallVoiceMatchRatio: this.feedback.length > 0
        ? this.feedback.filter(f => f.soundsLikeMe).length / this.feedback.length
        : 0,
      problemSections,
      learningRecommendations,
    };
  }

  /**
   * Generate enhanced prompt from dissertation feedback
   */
  generateEnhancementPrompt(): string {
    const summary = this.getDissertationSummary();
    const lines: string[] = ['## DISSERTATION-SPECIFIC STYLE GUIDANCE'];

    // Voice match analysis
    lines.push('');
    lines.push(`*Based on ${summary.totalFeedback} feedback items*`);
    lines.push(`*Voice match rate: ${(summary.overallVoiceMatchRatio * 100).toFixed(0)}%*`);

    // Ratings-based guidance
    if (summary.globalAverageRatings.terminologicalAccuracy < 4) {
      lines.push('');
      lines.push('### Terminology Guidance');
      lines.push('- Pay extra attention to Greek/technical term accuracy');
      lines.push('- Verify transliterations match established conventions');
    }

    if (summary.globalAverageRatings.argumentClarity < 4) {
      lines.push('');
      lines.push('### Argument Structure');
      lines.push('- Make claim-evidence-warrant connections more explicit');
      lines.push('- Use clearer topic sentences');
    }

    if (summary.globalAverageRatings.integrationQuality < 4) {
      lines.push('');
      lines.push('### Source Integration');
      lines.push('- Increase citation density');
      lines.push('- Use more author-prominent citations');
    }

    // Issue-based guidance
    const topIssues = Object.entries(summary.globalIssueFrequencies)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topIssues.length > 0) {
      lines.push('');
      lines.push('### Common Issues to Avoid');
      for (const [issue, count] of topIssues) {
        lines.push(`- ${this.issueToGuidance(issue as keyof DissertationIssueFlags)} (occurred ${count}x)`);
      }
    }

    // Learning recommendations
    if (summary.learningRecommendations.length > 0) {
      lines.push('');
      lines.push('### Recommendations');
      for (const rec of summary.learningRecommendations) {
        lines.push(`- ${rec}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Convert issue flag to guidance text
   */
  private issueToGuidance(issue: keyof DissertationIssueFlags): string {
    const guidance: Record<keyof DissertationIssueFlags, string> = {
      needsMoreCitations: 'Add more scholarly citations to support claims',
      tooSpeculative: 'Ground interpretations more firmly in textual evidence',
      missesPrimaryText: 'Include relevant primary text passages',
      overlyTechnical: 'Simplify technical language where possible',
      toneInconsistent: 'Maintain consistent scholarly tone throughout',
      argumentWeak: 'Strengthen argument with clearer warrants and evidence',
      terminologyError: 'Verify Greek/technical term usage',
      anachronism: 'Avoid anachronistic concepts or language',
      conceptConflation: 'Keep Aristotelian and Heideggerian concepts distinct',
    };
    return guidance[issue];
  }

  /**
   * Clear all feedback
   */
  clear(): void {
    this.feedback = [];
  }

  /**
   * Get feedback count
   */
  get count(): number {
    return this.feedback.length;
  }
}

/**
 * Create a DissertationFeedback from a standard ParagraphFeedback
 */
export function toDissertationFeedback(
  feedback: ParagraphFeedback,
  extras: Partial<DissertationFeedback> = {}
): DissertationFeedback {
  return {
    ...feedback,
    ...extras,
  };
}

/**
 * Calculate overall quality score from philosophical feedback
 */
export function calculateQualityScore(feedback: DissertationFeedback): number {
  if (!feedback.philosophicalFeedback) {
    return feedback.soundsLikeMe ? 0.7 : 0.4;
  }

  const pf = feedback.philosophicalFeedback;
  const ratings = [
    pf.terminologicalAccuracy,
    pf.argumentClarity,
    pf.scholarlyTone,
    pf.integrationQuality,
  ];

  if (pf.phenomenologicalPrecision) ratings.push(pf.phenomenologicalPrecision);
  if (pf.exegeticalAccuracy) ratings.push(pf.exegeticalAccuracy);

  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  // Convert 1-5 scale to 0-1 score
  let score = (avgRating - 1) / 4;

  // Penalize for issue flags
  if (feedback.issueFlags) {
    const issueCount = Object.values(feedback.issueFlags).filter(v => v === true).length;
    score -= issueCount * 0.05;
  }

  // Bonus for voice match
  if (feedback.soundsLikeMe) {
    score += 0.05;
  }

  return Math.max(0, Math.min(1, score));
}
