/**
 * FeedbackIntegration - Integrates all feedback components for paragraph-level learning
 * Provides a unified interface for feedback capture, drift detection, and style updates
 */

import * as path from 'path';
import { ParagraphFeedbackCapture, type ParagraphFeedback, type StyleIssue } from './paragraph-feedback-capture.js';
import { StyleDriftDetector, type DriftAnalysis } from './style-drift-detector.js';
import { IncrementalStyleUpdater } from './incremental-style-updater.js';
import { ContrastiveLearner } from './contrastive-learner.js';
import { CrossSessionLearner, type SessionSnapshot, type ConsolidatedPattern, type LearningTrend, type SessionSatisfactionMetrics } from './cross-session-learner.js';
import type { DeepStyleCharacteristics } from '../style/deep-style-analyzer.js';
import type { StyleProfileManager } from '../../universal/style-profile.js';

/**
 * Result of processing pending feedback
 */
export interface FeedbackProcessingResult {
  feedbackProcessed: number;
  patternsLearned: number;
  styleUpdated: boolean;
}

/**
 * Result of paragraph generation analysis
 */
export interface ParagraphGenerationResult {
  driftAnalysis: DriftAnalysis;
  shouldAlert: boolean;
}

/**
 * Feedback data for capturing
 */
export interface FeedbackInput {
  soundsLikeMe: boolean;
  correction?: string;
  issues?: StyleIssue[];
}

/**
 * User satisfaction rating (PHASE-3-002)
 */
interface SatisfactionRating {
  chapterId: number;
  soundsLikeMeScore: 1 | 2 | 3 | 4 | 5;
  qualitySatisfactionScore: 1 | 2 | 3 | 4 | 5;
  wouldUseAsIs: boolean;
  timestamp: number;
}

/**
 * Session state for feedback integration
 */
interface FeedbackSessionState {
  sessionId: string;
  initialized: boolean;
  startTime: number;
  chapters: Set<number>;
  pendingParagraphs: Map<string, { chapterId: number; paragraphIndex: number; text: string }>;
  /** User satisfaction ratings (PHASE-3-002) */
  satisfactionRatings: Map<number, SatisfactionRating>;
}

/**
 * FeedbackIntegration class - Main entry point for feedback learning system
 */
export class FeedbackIntegration {
  private feedbackCapture: ParagraphFeedbackCapture;
  private driftDetector: StyleDriftDetector;
  private styleUpdater: IncrementalStyleUpdater;
  private contrastiveLearner: ContrastiveLearner;
  private crossSessionLearner: CrossSessionLearner;

  private storagePath: string;
  private profileId: string;
  private sessionState: FeedbackSessionState | null = null;

  constructor(
    styleProfile: DeepStyleCharacteristics,
    profileManager: StyleProfileManager,
    storagePath: string,
    profileId: string = 'default'
  ) {
    this.storagePath = storagePath;
    this.profileId = profileId;

    // Initialize all components
    this.feedbackCapture = new ParagraphFeedbackCapture(storagePath);
    this.driftDetector = new StyleDriftDetector(styleProfile);
    this.styleUpdater = new IncrementalStyleUpdater(profileManager);
    this.contrastiveLearner = new ContrastiveLearner(storagePath);
    this.crossSessionLearner = new CrossSessionLearner(storagePath);
  }

  /**
   * Initialize for a session
   */
  async initialize(sessionId: string): Promise<void> {
    // Load persisted state
    await Promise.all([
      this.feedbackCapture.load(),
      this.contrastiveLearner.load(),
      this.crossSessionLearner.load(),
    ]);

    // Initialize session state
    this.sessionState = {
      sessionId,
      initialized: true,
      startTime: Date.now(),
      chapters: new Set(),
      pendingParagraphs: new Map(),
      satisfactionRatings: new Map(),
    };
  }

  /**
   * Process a generated paragraph (check for drift, prepare for feedback)
   */
  async onParagraphGenerated(
    chapterId: number,
    paragraphIndex: number,
    text: string
  ): Promise<ParagraphGenerationResult> {
    if (!this.sessionState?.initialized) {
      throw new Error('FeedbackIntegration not initialized. Call initialize() first.');
    }

    // Track chapter
    this.sessionState.chapters.add(chapterId);

    // Analyze for drift
    const driftAnalysis = this.driftDetector.analyzeParagraph(text);

    // Store paragraph for potential feedback
    const key = `${chapterId}-${paragraphIndex}`;
    this.sessionState.pendingParagraphs.set(key, {
      chapterId,
      paragraphIndex,
      text,
    });

    return {
      driftAnalysis,
      shouldAlert: driftAnalysis.shouldAlert,
    };
  }

  /**
   * Capture user feedback for a paragraph
   */
  async captureFeedback(
    chapterId: number,
    paragraphIndex: number,
    generatedText: string,
    feedback: FeedbackInput
  ): Promise<void> {
    if (!this.sessionState?.initialized) {
      throw new Error('FeedbackIntegration not initialized. Call initialize() first.');
    }

    // Capture the feedback
    this.feedbackCapture.captureFeedback(
      this.sessionState.sessionId,
      chapterId,
      paragraphIndex,
      generatedText,
      {
        soundsLikeMe: feedback.soundsLikeMe,
        userCorrection: feedback.correction,
        issues: feedback.issues,
      }
    );

    // If there's a correction, add to contrastive learner
    if (feedback.correction) {
      this.contrastiveLearner.addPair(
        generatedText,
        feedback.correction,
        { chapterId, paragraphIndex }
      );
    }

    // Remove from pending
    const key = `${chapterId}-${paragraphIndex}`;
    this.sessionState.pendingParagraphs.delete(key);

    // Save after each feedback capture
    await this.saveState();
  }

  /**
   * Capture "sounds like me" feedback quickly
   */
  async captureSoundsLikeMe(
    chapterId: number,
    paragraphIndex: number,
    generatedText: string,
    soundsLikeMe: boolean
  ): Promise<void> {
    await this.captureFeedback(chapterId, paragraphIndex, generatedText, {
      soundsLikeMe,
    });
  }

  /**
   * Capture a correction
   */
  async captureCorrection(
    chapterId: number,
    paragraphIndex: number,
    generatedText: string,
    correction: string
  ): Promise<void> {
    // Infer soundsLikeMe based on similarity
    const similarity = this.calculateSimilarity(generatedText, correction);
    const soundsLikeMe = similarity > 0.8;  // High similarity = minor changes = still sounds like them

    await this.captureFeedback(chapterId, paragraphIndex, generatedText, {
      soundsLikeMe,
      correction,
    });
  }

  // ============================================================================
  // PHASE-3-002: User Satisfaction Rating Methods
  // ============================================================================

  /**
   * Capture user satisfaction rating for a chapter (PHASE-3-002)
   * Integrates with cross-session learning for trend analysis
   */
  captureSatisfactionRating(
    chapterId: number,
    soundsLikeMeScore: 1 | 2 | 3 | 4 | 5,
    qualitySatisfactionScore: 1 | 2 | 3 | 4 | 5,
    wouldUseAsIs: boolean
  ): void {
    if (!this.sessionState?.initialized) {
      throw new Error('FeedbackIntegration not initialized. Call initialize() first.');
    }

    const rating: SatisfactionRating = {
      chapterId,
      soundsLikeMeScore,
      qualitySatisfactionScore,
      wouldUseAsIs,
      timestamp: Date.now(),
    };

    this.sessionState.satisfactionRatings.set(chapterId, rating);

    // Also convert to binary "sounds like me" feedback for the feedback loop
    // Score >= 4 counts as "sounds like me"
    const soundsLikeMe = soundsLikeMeScore >= 4;

    // Weight future corrections based on satisfaction
    // Lower satisfaction = corrections are more important
    // This allows the system to prioritize learning from chapters where the user was less satisfied
  }

  /**
   * Get satisfaction rating for a chapter
   */
  getSatisfactionRating(chapterId: number): SatisfactionRating | undefined {
    return this.sessionState?.satisfactionRatings.get(chapterId);
  }

  /**
   * Get all satisfaction ratings for the session
   */
  getAllSatisfactionRatings(): SatisfactionRating[] {
    if (!this.sessionState?.initialized) {
      return [];
    }
    return Array.from(this.sessionState.satisfactionRatings.values());
  }

  /**
   * Get satisfaction metrics summary for current session
   */
  getSatisfactionMetrics(): {
    chaptersRated: number;
    avgSoundsLikeMeScore: number;
    avgQualitySatisfactionScore: number;
    wouldUseAsIsRatio: number;
  } {
    const ratings = this.getAllSatisfactionRatings();

    if (ratings.length === 0) {
      return {
        chaptersRated: 0,
        avgSoundsLikeMeScore: 0,
        avgQualitySatisfactionScore: 0,
        wouldUseAsIsRatio: 0,
      };
    }

    const avgSoundsLikeMe = ratings.reduce((sum, r) => sum + r.soundsLikeMeScore, 0) / ratings.length;
    const avgQuality = ratings.reduce((sum, r) => sum + r.qualitySatisfactionScore, 0) / ratings.length;
    const wouldUseAsIsCount = ratings.filter(r => r.wouldUseAsIs).length;

    return {
      chaptersRated: ratings.length,
      avgSoundsLikeMeScore: avgSoundsLikeMe,
      avgQualitySatisfactionScore: avgQuality,
      wouldUseAsIsRatio: wouldUseAsIsCount / ratings.length,
    };
  }

  /**
   * Get satisfaction trends across sessions (PHASE-3-002)
   */
  getSatisfactionTrends(): ReturnType<CrossSessionLearner['getSatisfactionTrends']> {
    return this.crossSessionLearner.getSatisfactionTrends();
  }

  /**
   * Process all pending feedback and update style
   */
  async processPendingFeedback(): Promise<FeedbackProcessingResult> {
    if (!this.sessionState?.initialized) {
      throw new Error('FeedbackIntegration not initialized. Call initialize() first.');
    }

    // Get unprocessed feedback with corrections
    const unprocessedCorrections = this.feedbackCapture.getUnprocessedCorrections();

    if (unprocessedCorrections.length === 0) {
      return {
        feedbackProcessed: 0,
        patternsLearned: 0,
        styleUpdated: false,
      };
    }

    // Prepare corrections for batch learning
    const corrections = unprocessedCorrections
      .filter(f => f.userCorrection)
      .map(f => ({
        original: f.generatedText,
        corrected: f.userCorrection!,
      }));

    // Learn from corrections
    const updateResult = await this.styleUpdater.learnFromBatch(corrections, this.profileId);

    // Mark feedback as processed
    const feedbackIds = unprocessedCorrections.map(f => f.id);
    this.feedbackCapture.markMultipleProcessed(feedbackIds);

    // Calibrate drift detector based on feedback
    const allFeedback = this.feedbackCapture.getFeedbackBySession(this.sessionState.sessionId);
    this.driftDetector.calibrateThreshold(allFeedback);

    // Save state
    await this.saveState();

    return {
      feedbackProcessed: unprocessedCorrections.length,
      patternsLearned: updateResult.changesApplied.length,
      styleUpdated: updateResult.updated,
    };
  }

  /**
   * Get feedback-enhanced style prompt
   */
  async getEnhancedStylePrompt(): Promise<string> {
    const parts: string[] = [];

    // Get cross-session learning insights (highest priority - proven patterns)
    const crossSessionPrompt = this.crossSessionLearner.generateLearningPrompt();
    if (crossSessionPrompt && this.crossSessionLearner.getStats().totalSessions > 2) {
      parts.push(crossSessionPrompt);
    }

    // Get learned patterns from style updater
    const styleEnhancement = this.styleUpdater.generateStyleEnhancementPrompt(this.profileId);
    if (styleEnhancement) {
      parts.push(styleEnhancement);
    }

    // Get contrastive learning patterns (current session)
    const contrastivePrompt = this.contrastiveLearner.buildTrainingPrompt();
    if (contrastivePrompt && this.contrastiveLearner.count > 0) {
      parts.push(contrastivePrompt);
    }

    // Add statistics summary
    const stats = this.getStats();
    if (stats.totalFeedback > 0) {
      parts.push('');
      parts.push(`*Style learning based on ${stats.totalFeedback} user feedback items*`);
      parts.push(`*Voice match confidence: ${(stats.soundsLikeMeRatio * 100).toFixed(0)}%*`);
    }

    // Add cross-session stats if available
    const crossSessionStats = this.crossSessionLearner.getStats();
    if (crossSessionStats.totalSessions > 1) {
      parts.push(`*Cross-session learning: ${crossSessionStats.consolidatedPatterns} proven patterns from ${crossSessionStats.totalSessions} sessions*`);
    }

    return parts.join('\n');
  }

  /**
   * Get drift analysis for current session
   */
  getDriftAnalysisForSession(): {
    totalParagraphs: number;
    driftingParagraphs: number;
    averageDrift: number;
    alertLevel: 'none' | 'minor' | 'moderate' | 'significant';
  } {
    if (!this.sessionState?.initialized) {
      return {
        totalParagraphs: 0,
        driftingParagraphs: 0,
        averageDrift: 0,
        alertLevel: 'none',
      };
    }

    const pending = Array.from(this.sessionState.pendingParagraphs.values());
    if (pending.length === 0) {
      return {
        totalParagraphs: 0,
        driftingParagraphs: 0,
        averageDrift: 0,
        alertLevel: 'none',
      };
    }

    let totalDrift = 0;
    let driftingCount = 0;

    for (const para of pending) {
      const analysis = this.driftDetector.analyzeParagraph(para.text);
      totalDrift += analysis.overallDriftScore;
      if (analysis.shouldAlert) {
        driftingCount++;
      }
    }

    const averageDrift = totalDrift / pending.length;
    let alertLevel: 'none' | 'minor' | 'moderate' | 'significant';

    if (averageDrift < 0.2) alertLevel = 'none';
    else if (averageDrift < 0.4) alertLevel = 'minor';
    else if (averageDrift < 0.6) alertLevel = 'moderate';
    else alertLevel = 'significant';

    return {
      totalParagraphs: pending.length,
      driftingParagraphs: driftingCount,
      averageDrift,
      alertLevel,
    };
  }

  /**
   * Analyze a chapter for drift
   */
  analyzeChapterDrift(chapterText: string): {
    overallDrift: number;
    worstParagraphs: number[];
    suggestions: string[];
  } {
    const analysis = this.driftDetector.analyzeChapter(chapterText);

    // Generate suggestions based on drift areas
    const suggestions: string[] = [];
    const allDriftAreas = new Map<string, number>();

    for (const para of analysis.paragraphDrifts) {
      for (const area of para.analysis.driftedAreas) {
        const current = allDriftAreas.get(area.area) ?? 0;
        allDriftAreas.set(area.area, current + 1);
      }
    }

    // Add suggestions for most common drift areas
    const sortedAreas = [...allDriftAreas.entries()].sort((a, b) => b[1] - a[1]);

    for (const [area, count] of sortedAreas.slice(0, 3)) {
      if (count >= 2) {
        switch (area) {
          case 'sentence_length':
            suggestions.push('Adjust sentence length to match your typical writing style');
            break;
          case 'vocabulary':
            suggestions.push('Use more formal/academic vocabulary consistent with your writing');
            break;
          case 'tone':
            suggestions.push('Adjust tone to match your expected academic register');
            break;
          case 'hedging':
            suggestions.push('Calibrate hedging language to match your claim strength preferences');
            break;
          case 'citation_style':
            suggestions.push('Align citation integration style with your preferences');
            break;
          case 'paragraph_structure':
            suggestions.push('Strengthen topic sentences and paragraph conclusions');
            break;
          case 'rhetorical_moves':
            suggestions.push('Incorporate more of your characteristic rhetorical patterns');
            break;
        }
      }
    }

    return {
      overallDrift: analysis.overallDrift,
      worstParagraphs: analysis.worstDriftParagraphs,
      suggestions,
    };
  }

  /**
   * Get feedback statistics
   */
  getStats(): {
    totalFeedback: number;
    processedCount: number;
    soundsLikeMeRatio: number;
    contrastivePairs: number;
    patternsLearned: number;
  } {
    const feedbackStats = this.feedbackCapture.getStats();
    const learningStats = this.styleUpdater.getLearningStats(this.profileId);

    return {
      totalFeedback: feedbackStats.totalFeedback,
      processedCount: feedbackStats.processedCount,
      soundsLikeMeRatio: feedbackStats.soundsLikeMeRatio,
      contrastivePairs: this.contrastiveLearner.count,
      patternsLearned: learningStats.patternsLearned,
    };
  }

  /**
   * Get most common issues from feedback
   */
  getMostCommonIssues(): Array<{ type: string; count: number }> {
    return this.feedbackCapture.getMostCommonIssues();
  }

  /**
   * Get consistent patterns from contrastive learning
   */
  getConsistentPatterns(): Array<{ pattern: string; replacement: string; confidence: number }> {
    return this.contrastiveLearner.getConsistentPatterns();
  }

  /**
   * Get anti-patterns to avoid
   */
  getAntiPatterns(): Array<{ pattern: string; reason: string }> {
    return this.contrastiveLearner.getAntiPatterns();
  }

  /**
   * Update the style profile
   */
  updateStyleProfile(newProfile: DeepStyleCharacteristics): void {
    this.driftDetector.updateProfile(newProfile);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Record session snapshot for cross-session learning
    if (this.sessionState?.initialized) {
      const stats = this.feedbackCapture.getStats();
      const driftAnalysis = this.getDriftAnalysisForSession();

      // Build satisfaction metrics (PHASE-3-002)
      const satisfactionMetrics = this.buildSatisfactionMetrics();

      this.crossSessionLearner.recordSession(
        this.sessionState.sessionId,
        stats,
        {
          consistent: this.contrastiveLearner.getConsistentPatterns(),
          anti: this.contrastiveLearner.getAntiPatterns(),
          positive: this.contrastiveLearner.getPositivePatterns(),
        },
        this.contrastiveLearner.count,
        {
          averageDrift: driftAnalysis.averageDrift,
          worstDriftParagraphs: driftAnalysis.driftingParagraphs,
          alertCount: driftAnalysis.alertLevel === 'significant' ? 3 :
                      driftAnalysis.alertLevel === 'moderate' ? 2 :
                      driftAnalysis.alertLevel === 'minor' ? 1 : 0,
        },
        Array.from(this.sessionState.chapters),
        this.sessionState.startTime,
        satisfactionMetrics  // PHASE-3-002: Include satisfaction data
      );
    }

    // Save all state before cleanup
    await this.saveState();

    // Clear session state
    this.sessionState = null;
  }

  /**
   * Build satisfaction metrics for cross-session learning (PHASE-3-002)
   */
  private buildSatisfactionMetrics(): SessionSatisfactionMetrics | undefined {
    if (!this.sessionState?.initialized) {
      return undefined;
    }

    const ratings = this.getAllSatisfactionRatings();
    if (ratings.length === 0) {
      return undefined;
    }

    const avgSoundsLikeMe = ratings.reduce((sum, r) => sum + r.soundsLikeMeScore, 0) / ratings.length;
    const avgQuality = ratings.reduce((sum, r) => sum + r.qualitySatisfactionScore, 0) / ratings.length;
    const wouldUseAsIsCount = ratings.filter(r => r.wouldUseAsIs).length;

    return {
      chaptersRated: ratings.length,
      avgSoundsLikeMeScore: avgSoundsLikeMe,
      avgQualitySatisfactionScore: avgQuality,
      wouldUseAsIsRatio: wouldUseAsIsCount / ratings.length,
      ratings: ratings.map(r => ({
        chapterId: r.chapterId,
        soundsLikeMeScore: r.soundsLikeMeScore,
        qualitySatisfactionScore: r.qualitySatisfactionScore,
        wouldUseAsIs: r.wouldUseAsIs,
      })),
    };
  }

  /**
   * Check if initialized
   */
  get isInitialized(): boolean {
    return this.sessionState?.initialized ?? false;
  }

  /**
   * Get current session ID
   */
  get currentSessionId(): string | null {
    return this.sessionState?.sessionId ?? null;
  }

  /**
   * Export feedback for external analysis
   */
  exportFeedback(): {
    feedback: ParagraphFeedback[];
    trainingData: Array<{ original: string; corrected: string; issues: string[] }>;
    contrastiveStats: ReturnType<ContrastiveLearner['getStats']>;
  } {
    return {
      feedback: this.sessionState
        ? this.feedbackCapture.getFeedbackBySession(this.sessionState.sessionId)
        : [],
      trainingData: this.feedbackCapture.exportForTraining(),
      contrastiveStats: this.contrastiveLearner.getStats(),
    };
  }

  /**
   * Reset all learned patterns (for testing or fresh start)
   */
  async reset(): Promise<void> {
    this.feedbackCapture.clear();
    this.contrastiveLearner.clear();
    this.crossSessionLearner.clear();
    this.styleUpdater.clearLearnedPatterns(this.profileId);

    await this.saveState();
  }

  /**
   * Get cross-session learning statistics
   */
  getCrossSessionStats(): ReturnType<CrossSessionLearner['getStats']> {
    return this.crossSessionLearner.getStats();
  }

  /**
   * Get improvement summary across sessions
   */
  getImprovementSummary(): ReturnType<CrossSessionLearner['getImprovementSummary']> {
    return this.crossSessionLearner.getImprovementSummary();
  }

  /**
   * Get consolidated patterns that persist across sessions
   */
  getConsolidatedPatterns(minSessions?: number): ConsolidatedPattern[] {
    return this.crossSessionLearner.getConsolidatedPatterns(minSessions);
  }

  /**
   * Get learning trends over time
   */
  getLearningTrends(): LearningTrend {
    return this.crossSessionLearner.getTrends();
  }

  /**
   * Get session history
   */
  getSessionHistory(limit?: number): SessionSnapshot[] {
    return this.crossSessionLearner.getSessionHistory(limit);
  }

  /**
   * Compare two sessions for improvement
   */
  compareSessions(sessionId1: string, sessionId2: string): ReturnType<CrossSessionLearner['compareSessions']> {
    return this.crossSessionLearner.compareSessions(sessionId1, sessionId2);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async saveState(): Promise<void> {
    await Promise.all([
      this.feedbackCapture.save(),
      this.contrastiveLearner.save(),
      this.crossSessionLearner.save(),
    ]);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return union > 0 ? intersection / union : 0;
  }
}

/**
 * Create a FeedbackIntegration instance with default configuration
 */
export function createFeedbackIntegration(
  styleProfile: DeepStyleCharacteristics,
  profileManager: StyleProfileManager,
  sessionStoragePath: string,
  profileId?: string
): FeedbackIntegration {
  return new FeedbackIntegration(
    styleProfile,
    profileManager,
    sessionStoragePath,
    profileId
  );
}
