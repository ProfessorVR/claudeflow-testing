/**
 * ParagraphFeedbackCapture - Captures granular feedback on generated text
 * Implements paragraph-level style learning for the PhD Pipeline
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Types of issues that can be identified in generated text
 */
export type IssueType =
  | 'word_choice'
  | 'sentence_structure'
  | 'tone'
  | 'argument_style'
  | 'citation_style'
  | 'transition'
  | 'other';

/**
 * A specific issue identified in generated text
 */
export interface StyleIssue {
  type: IssueType;
  description: string;
  originalSnippet: string;
  correctedSnippet?: string;
}

/**
 * Feedback for a single paragraph of generated text
 */
export interface ParagraphFeedback {
  id: string;
  sessionId: string;
  chapterId: number;
  paragraphIndex: number;

  /** The generated text */
  generatedText: string;

  /** User's correction (if any) */
  userCorrection?: string;

  /** Does this sound like the user's voice? */
  soundsLikeMe: boolean;

  /** Specific issues identified */
  issues?: StyleIssue[];

  /** Timestamp when feedback was captured */
  timestamp: number;

  /** Has this been used for learning? */
  processed: boolean;
}

/**
 * A feedback session containing multiple paragraph feedbacks
 */
export interface FeedbackSession {
  sessionId: string;
  chapterId: number;
  feedback: ParagraphFeedback[];
  overallRating: number;  // 0-1 scale
  notes?: string;
}

/**
 * Statistics about captured feedback
 */
export interface FeedbackStats {
  totalFeedback: number;
  processedCount: number;
  soundsLikeMeRatio: number;
  issuesByType: Record<IssueType, number>;
}

/**
 * Data format for exporting feedback for training
 */
export interface TrainingExport {
  original: string;
  corrected: string;
  issues: string[];
}

/**
 * ParagraphFeedbackCapture class for managing paragraph-level feedback
 * Stores and retrieves feedback for learning from user corrections
 */
export class ParagraphFeedbackCapture {
  private feedbackStore: Map<string, ParagraphFeedback>;
  private storagePath: string;
  private sessionSessions: Map<string, FeedbackSession>;

  constructor(storagePath: string) {
    this.feedbackStore = new Map();
    this.sessionSessions = new Map();
    this.storagePath = storagePath;
  }

  /**
   * Capture feedback for a single paragraph
   * @returns Feedback ID
   */
  captureFeedback(
    sessionId: string,
    chapterId: number,
    paragraphIndex: number,
    generatedText: string,
    feedback: {
      soundsLikeMe: boolean;
      userCorrection?: string;
      issues?: StyleIssue[];
    }
  ): string {
    const feedbackId = uuidv4();

    const paragraphFeedback: ParagraphFeedback = {
      id: feedbackId,
      sessionId,
      chapterId,
      paragraphIndex,
      generatedText,
      userCorrection: feedback.userCorrection,
      soundsLikeMe: feedback.soundsLikeMe,
      issues: feedback.issues,
      timestamp: Date.now(),
      processed: false,
    };

    this.feedbackStore.set(feedbackId, paragraphFeedback);

    // Track in session
    const sessionKey = `${sessionId}-${chapterId}`;
    let session = this.sessionSessions.get(sessionKey);
    if (!session) {
      session = {
        sessionId,
        chapterId,
        feedback: [],
        overallRating: 0,
      };
      this.sessionSessions.set(sessionKey, session);
    }
    session.feedback.push(paragraphFeedback);

    return feedbackId;
  }

  /**
   * Get a specific feedback by ID
   */
  getFeedback(feedbackId: string): ParagraphFeedback | undefined {
    return this.feedbackStore.get(feedbackId);
  }

  /**
   * Get all feedback for a session and chapter
   */
  getFeedbackForChapter(sessionId: string, chapterId: number): ParagraphFeedback[] {
    const sessionKey = `${sessionId}-${chapterId}`;
    const session = this.sessionSessions.get(sessionKey);
    return session?.feedback ?? [];
  }

  /**
   * Get all unprocessed feedback for learning
   */
  getUnprocessedFeedback(): ParagraphFeedback[] {
    return Array.from(this.feedbackStore.values())
      .filter(f => !f.processed);
  }

  /**
   * Get unprocessed feedback with corrections (for contrastive learning)
   */
  getUnprocessedCorrections(): ParagraphFeedback[] {
    return Array.from(this.feedbackStore.values())
      .filter(f => !f.processed && f.userCorrection);
  }

  /**
   * Mark feedback as processed after learning
   */
  markProcessed(feedbackId: string): void {
    const feedback = this.feedbackStore.get(feedbackId);
    if (feedback) {
      feedback.processed = true;
    }
  }

  /**
   * Mark multiple feedbacks as processed
   */
  markMultipleProcessed(feedbackIds: string[]): void {
    for (const id of feedbackIds) {
      this.markProcessed(id);
    }
  }

  /**
   * Get feedback statistics
   */
  getStats(): FeedbackStats {
    const allFeedback = Array.from(this.feedbackStore.values());
    const totalFeedback = allFeedback.length;
    const processedCount = allFeedback.filter(f => f.processed).length;

    // Calculate soundsLikeMe ratio
    const soundsLikeMeCount = allFeedback.filter(f => f.soundsLikeMe).length;
    const soundsLikeMeRatio = totalFeedback > 0
      ? soundsLikeMeCount / totalFeedback
      : 0;

    // Count issues by type
    const issuesByType: Record<IssueType, number> = {
      word_choice: 0,
      sentence_structure: 0,
      tone: 0,
      argument_style: 0,
      citation_style: 0,
      transition: 0,
      other: 0,
    };

    for (const feedback of allFeedback) {
      if (feedback.issues) {
        for (const issue of feedback.issues) {
          issuesByType[issue.type]++;
        }
      }
    }

    return {
      totalFeedback,
      processedCount,
      soundsLikeMeRatio,
      issuesByType,
    };
  }

  /**
   * Get most common issues across all feedback
   */
  getMostCommonIssues(limit: number = 5): Array<{ type: IssueType; count: number }> {
    const stats = this.getStats();
    return Object.entries(stats.issuesByType)
      .map(([type, count]) => ({ type: type as IssueType, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Update session overall rating
   */
  setSessionRating(sessionId: string, chapterId: number, rating: number, notes?: string): void {
    const sessionKey = `${sessionId}-${chapterId}`;
    const session = this.sessionSessions.get(sessionKey);
    if (session) {
      session.overallRating = Math.max(0, Math.min(1, rating));
      if (notes !== undefined) {
        session.notes = notes;
      }
    }
  }

  /**
   * Get session feedback summary
   */
  getSessionSummary(sessionId: string, chapterId: number): FeedbackSession | undefined {
    const sessionKey = `${sessionId}-${chapterId}`;
    return this.sessionSessions.get(sessionKey);
  }

  /**
   * Export feedback for training purposes
   * Only includes feedback with corrections
   */
  exportForTraining(): TrainingExport[] {
    const exports: TrainingExport[] = [];

    for (const feedback of this.feedbackStore.values()) {
      if (feedback.userCorrection) {
        exports.push({
          original: feedback.generatedText,
          corrected: feedback.userCorrection,
          issues: feedback.issues?.map(i => i.type) ?? [],
        });
      }
    }

    return exports;
  }

  /**
   * Export feedback with detailed issue information
   */
  exportDetailedForTraining(): Array<{
    original: string;
    corrected: string;
    issues: StyleIssue[];
    chapterId: number;
    paragraphIndex: number;
    timestamp: number;
  }> {
    const exports: Array<{
      original: string;
      corrected: string;
      issues: StyleIssue[];
      chapterId: number;
      paragraphIndex: number;
      timestamp: number;
    }> = [];

    for (const feedback of this.feedbackStore.values()) {
      if (feedback.userCorrection) {
        exports.push({
          original: feedback.generatedText,
          corrected: feedback.userCorrection,
          issues: feedback.issues ?? [],
          chapterId: feedback.chapterId,
          paragraphIndex: feedback.paragraphIndex,
          timestamp: feedback.timestamp,
        });
      }
    }

    // Sort by timestamp (most recent first)
    return exports.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all feedback IDs
   */
  getAllFeedbackIds(): string[] {
    return Array.from(this.feedbackStore.keys());
  }

  /**
   * Clear all feedback (for testing or reset)
   */
  clear(): void {
    this.feedbackStore.clear();
    this.sessionSessions.clear();
  }

  /**
   * Get storage path for the feedback data
   */
  getStoragePath(): string {
    return this.storagePath;
  }

  /**
   * Save feedback to disk
   */
  async save(): Promise<void> {
    const feedbackDir = path.join(this.storagePath, 'feedback');

    // Ensure directory exists
    await fs.mkdir(feedbackDir, { recursive: true });

    // Save main feedback store
    const feedbackData = Array.from(this.feedbackStore.entries());
    const feedbackPath = path.join(feedbackDir, 'paragraph-feedback.json');
    await fs.writeFile(
      feedbackPath,
      JSON.stringify(feedbackData, null, 2),
      'utf-8'
    );

    // Save session summaries
    const sessionData = Array.from(this.sessionSessions.entries());
    const sessionPath = path.join(feedbackDir, 'feedback-sessions.json');
    await fs.writeFile(
      sessionPath,
      JSON.stringify(sessionData, null, 2),
      'utf-8'
    );
  }

  /**
   * Load feedback from disk
   */
  async load(): Promise<void> {
    const feedbackDir = path.join(this.storagePath, 'feedback');

    try {
      // Load main feedback store
      const feedbackPath = path.join(feedbackDir, 'paragraph-feedback.json');
      const feedbackContent = await fs.readFile(feedbackPath, 'utf-8');
      const feedbackData = JSON.parse(feedbackContent) as Array<[string, ParagraphFeedback]>;
      this.feedbackStore = new Map(feedbackData);

      // Load session summaries
      const sessionPath = path.join(feedbackDir, 'feedback-sessions.json');
      const sessionContent = await fs.readFile(sessionPath, 'utf-8');
      const sessionData = JSON.parse(sessionContent) as Array<[string, FeedbackSession]>;
      this.sessionSessions = new Map(sessionData);
    } catch (error) {
      // If files don't exist, start fresh
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // Otherwise, keep empty stores (expected on first run)
    }
  }

  /**
   * Get feedback by session ID
   */
  getFeedbackBySession(sessionId: string): ParagraphFeedback[] {
    return Array.from(this.feedbackStore.values())
      .filter(f => f.sessionId === sessionId);
  }

  /**
   * Delete feedback by ID
   */
  deleteFeedback(feedbackId: string): boolean {
    const feedback = this.feedbackStore.get(feedbackId);
    if (!feedback) {
      return false;
    }

    // Remove from store
    this.feedbackStore.delete(feedbackId);

    // Remove from session
    const sessionKey = `${feedback.sessionId}-${feedback.chapterId}`;
    const session = this.sessionSessions.get(sessionKey);
    if (session) {
      session.feedback = session.feedback.filter(f => f.id !== feedbackId);
    }

    return true;
  }

  /**
   * Get count of feedback items
   */
  get count(): number {
    return this.feedbackStore.size;
  }

  /**
   * Check if there is any feedback
   */
  get isEmpty(): boolean {
    return this.feedbackStore.size === 0;
  }
}
