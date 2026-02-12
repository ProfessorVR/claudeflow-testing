/**
 * DissertationLearningSession - Integrated learning session for PhD Pipeline
 *
 * Combines all dissertation-specific features into a cohesive session:
 * - Feedback integration for paragraph-level learning
 * - Dissertation routing for task-specific model selection
 * - Quality gauntlet integration for revision cycles
 * - Philosophical coherence checking
 * - Cross-chapter consistency tracking
 * - Progress and metrics tracking
 *
 * This class serves as the main entry point for dissertation writing sessions.
 */

import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import {
  FeedbackIntegration,
  createFeedbackIntegration,
  type FeedbackProcessingResult,
  type ParagraphGenerationResult,
  type FeedbackInput,
} from '../feedback/index.js';
import {
  DissertationFeedbackCollector,
  type DissertationFeedback,
  type ChapterFeedbackSummary,
  type DissertationFeedbackSummary,
  type DissertationSectionType,
} from '../feedback/dissertation-feedback.js';
import {
  DissertationRouter,
  DissertationTaskType,
  type DissertationRoutingRule,
  type DissertationComplexity,
  type DissertationRisk,
} from './dissertation-routing.js';
import {
  PhilosophicalCoherenceChecker,
  createDefaultPhilosophicalChecker,
  type TermDefinition,
  type ArgumentThread,
} from '../quality/stages/philosophical-coherence-checker.js';
import {
  QualityGauntlet,
  createDefaultGauntlet,
  type GauntletResult,
} from '../quality/quality-gauntlet.js';
import type { DeepStyleCharacteristics } from '../style/deep-style-analyzer.js';
import type { StyleProfileManager } from '../../universal/style-profile.js';

// ============================================================================
// Session State Types
// ============================================================================

/**
 * Chapter state within the learning session
 */
export interface ChapterState {
  /** Chapter number (1-indexed) */
  chapterId: number;
  /** Chapter title */
  title: string;
  /** Current draft text */
  currentText: string;
  /** Section states */
  sections: Map<string, SectionState>;
  /** Quality scores history */
  qualityHistory: Array<{
    timestamp: number;
    score: number;
    passed: boolean;
    issueCount: number;
  }>;
  /** Revision count */
  revisionCount: number;
  /** Status */
  status: 'draft' | 'in_revision' | 'quality_passed' | 'complete';
  /** Last modification time */
  lastModified: number;
}

/**
 * Section state within a chapter
 */
export interface SectionState {
  /** Section ID (e.g., "1.2.3") */
  sectionId: string;
  /** Section title */
  title: string;
  /** Section type */
  sectionType: DissertationSectionType;
  /** Word count */
  wordCount: number;
  /** Paragraph count */
  paragraphCount: number;
  /** Feedback received */
  feedbackCount: number;
  /** Quality score */
  qualityScore: number;
}

/**
 * Session metrics for tracking progress
 */
export interface SessionMetrics {
  /** Total words written */
  totalWords: number;
  /** Total paragraphs written */
  totalParagraphs: number;
  /** Total feedback collected */
  totalFeedback: number;
  /** Patterns learned from feedback */
  patternsLearned: number;
  /** Quality revision iterations */
  revisionIterations: number;
  /** Average quality score */
  averageQualityScore: number;
  /** Time spent in session (ms) */
  sessionDuration: number;
  /** Local model usage ratio */
  localModelUsage: number;
  /** Model usage breakdown */
  modelUsage: Record<string, number>;
}

/**
 * Session event for logging
 */
export interface SessionEvent {
  /** Event timestamp */
  timestamp: number;
  /** Event type */
  type: 'task_start' | 'task_complete' | 'feedback_received' | 'quality_check' | 'revision' | 'error';
  /** Event details */
  details: Record<string, unknown>;
}

/**
 * Session persistence state
 */
export interface SessionPersistence {
  /** Session ID */
  sessionId: string;
  /** Style profile ID */
  styleProfileId: string;
  /** Start time */
  startTime: number;
  /** Last activity time */
  lastActivityTime: number;
  /** Chapter states (serialized) */
  chapters: Array<{
    chapterId: number;
    title: string;
    status: string;
    wordCount: number;
    qualityScore: number;
    revisionCount: number;
  }>;
  /** Metrics snapshot */
  metrics: SessionMetrics;
  /** Events log */
  events: SessionEvent[];
}

// ============================================================================
// DissertationLearningSession Class
// ============================================================================

/**
 * Configuration for dissertation learning session
 */
export interface DissertationLearningSessionConfig {
  /** Base directory for session storage */
  baseDir: string;
  /** Style profile ID */
  styleProfileId: string;
  /** Whether to enable quality gauntlet */
  enableQualityGauntlet: boolean;
  /** Whether to enable feedback learning */
  enableFeedbackLearning: boolean;
  /** Whether to enable philosophical coherence */
  enablePhilosophicalCoherence: boolean;
  /** Quality threshold for chapters */
  qualityThreshold: number;
  /** Maximum revision iterations */
  maxRevisions: number;
}

/**
 * Default session configuration
 */
const DEFAULT_SESSION_CONFIG: DissertationLearningSessionConfig = {
  baseDir: process.cwd(),
  styleProfileId: 'default',
  enableQualityGauntlet: true,
  enableFeedbackLearning: true,
  enablePhilosophicalCoherence: true,
  qualityThreshold: 0.85,
  maxRevisions: 5,
};

/**
 * DissertationLearningSession - Main class for dissertation writing sessions
 */
export class DissertationLearningSession {
  /** Session ID */
  readonly sessionId: string;

  /** Session configuration */
  private config: DissertationLearningSessionConfig;

  /** Feedback integration */
  private feedbackIntegration: FeedbackIntegration | null = null;

  /** Dissertation feedback collector */
  private dissertationFeedback: DissertationFeedbackCollector;

  /** Dissertation router */
  private router: DissertationRouter;

  /** Philosophical coherence checker */
  private philosophicalChecker: PhilosophicalCoherenceChecker | null = null;

  /** Quality gauntlet */
  private qualityGauntlet: QualityGauntlet | null = null;

  /** Chapter states */
  private chapters: Map<number, ChapterState> = new Map();

  /** Session events */
  private events: SessionEvent[] = [];

  /** Session metrics */
  private metrics: SessionMetrics;

  /** Session start time */
  private startTime: number;

  /** Storage path */
  private storagePath: string;

  constructor(
    config: Partial<DissertationLearningSessionConfig> = {},
    sessionId?: string
  ) {
    this.sessionId = sessionId ?? uuidv4();
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.startTime = Date.now();

    // Initialize storage path
    this.storagePath = path.join(
      this.config.baseDir,
      '.dissertation-sessions',
      this.sessionId
    );

    // Initialize components
    this.dissertationFeedback = new DissertationFeedbackCollector();
    this.router = new DissertationRouter();

    if (this.config.enablePhilosophicalCoherence) {
      this.philosophicalChecker = createDefaultPhilosophicalChecker();
    }

    if (this.config.enableQualityGauntlet) {
      this.qualityGauntlet = createDefaultGauntlet();
    }

    // Initialize metrics
    this.metrics = {
      totalWords: 0,
      totalParagraphs: 0,
      totalFeedback: 0,
      patternsLearned: 0,
      revisionIterations: 0,
      averageQualityScore: 0,
      sessionDuration: 0,
      localModelUsage: 0,
      modelUsage: {},
    };

    this.logEvent('task_start', { action: 'session_created' });
  }

  /**
   * Initialize the session with style profile
   */
  async initialize(
    styleProfile: DeepStyleCharacteristics,
    profileManager: StyleProfileManager
  ): Promise<void> {
    // Ensure storage directory exists
    await fs.promises.mkdir(this.storagePath, { recursive: true });

    // Initialize feedback integration
    if (this.config.enableFeedbackLearning) {
      this.feedbackIntegration = createFeedbackIntegration(
        styleProfile,
        profileManager,
        this.storagePath,
        this.config.styleProfileId
      );
      await this.feedbackIntegration.initialize(this.sessionId);
    }

    this.logEvent('task_complete', { action: 'session_initialized' });
  }

  // ============================================================================
  // Chapter Management
  // ============================================================================

  /**
   * Register a new chapter in the session
   */
  registerChapter(chapterId: number, title: string): ChapterState {
    const chapter: ChapterState = {
      chapterId,
      title,
      currentText: '',
      sections: new Map(),
      qualityHistory: [],
      revisionCount: 0,
      status: 'draft',
      lastModified: Date.now(),
    };

    this.chapters.set(chapterId, chapter);
    this.logEvent('task_start', { action: 'chapter_registered', chapterId, title });

    return chapter;
  }

  /**
   * Update chapter text
   */
  updateChapterText(chapterId: number, text: string): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not registered`);
    }

    chapter.currentText = text;
    chapter.lastModified = Date.now();

    // Update metrics
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    this.metrics.totalWords = Array.from(this.chapters.values())
      .reduce((sum, ch) => sum + ch.currentText.split(/\s+/).filter(w => w.length > 0).length, 0);
    this.metrics.totalParagraphs = Array.from(this.chapters.values())
      .reduce((sum, ch) => sum + ch.currentText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length, 0);

    this.logEvent('task_complete', {
      action: 'chapter_updated',
      chapterId,
      wordCount,
      paragraphCount,
    });
  }

  /**
   * Get chapter state
   */
  getChapter(chapterId: number): ChapterState | undefined {
    return this.chapters.get(chapterId);
  }

  /**
   * Get all chapters
   */
  getAllChapters(): ChapterState[] {
    return Array.from(this.chapters.values());
  }

  // ============================================================================
  // Routing
  // ============================================================================

  /**
   * Get routing recommendation for a task
   */
  getTaskRoute(
    taskType: DissertationTaskType,
    complexity?: DissertationComplexity
  ): DissertationRoutingRule {
    return this.router.getRoute(taskType, complexity?.level);
  }

  /**
   * Classify task complexity
   */
  classifyTaskComplexity(
    wordCount: number,
    sourceCount: number,
    technicalTerms: number,
    crossReferences: number
  ): DissertationComplexity {
    return this.router.classifyComplexity(wordCount, sourceCount, technicalTerms, crossReferences);
  }

  /**
   * Assess task risk
   */
  assessTaskRisk(
    taskType: DissertationTaskType,
    complexity: DissertationComplexity,
    chapterNumber: number,
    isFirstDraft: boolean
  ): DissertationRisk {
    return this.router.assessRisk(taskType, complexity, chapterNumber, isFirstDraft);
  }

  /**
   * Record task outcome for learning
   */
  recordTaskOutcome(
    taskType: DissertationTaskType,
    model: string,
    quality: number,
    success: boolean
  ): void {
    const taskId = `${this.sessionId}_${Date.now()}`;
    this.router.recordOutcome(taskId, taskType, model, quality, success);

    // Update model usage metrics
    this.metrics.modelUsage[model] = (this.metrics.modelUsage[model] || 0) + 1;
    const totalUsage = Object.values(this.metrics.modelUsage).reduce((a, b) => a + b, 0);
    const localUsage = (this.metrics.modelUsage['qwen2.5-coder-32b'] || 0) +
                       (this.metrics.modelUsage['deepseek-coder'] || 0);
    this.metrics.localModelUsage = totalUsage > 0 ? localUsage / totalUsage : 0;
  }

  // ============================================================================
  // Feedback
  // ============================================================================

  /**
   * Record feedback for a paragraph
   */
  async recordFeedback(
    chapterId: number,
    paragraphIndex: number,
    generatedText: string,
    feedback: FeedbackInput & { sectionType?: DissertationSectionType }
  ): Promise<void> {
    // Record to dissertation feedback collector
    this.dissertationFeedback.addFeedback({
      id: `${this.sessionId}_${chapterId}_${paragraphIndex}_${Date.now()}`,
      sessionId: this.sessionId,
      chapterId,
      paragraphIndex,
      generatedText,
      soundsLikeMe: feedback.soundsLikeMe,
      userCorrection: feedback.correction,
      issues: feedback.issues,
      timestamp: Date.now(),
      processed: false,
      sectionType: feedback.sectionType,
    });

    // Record to feedback integration if enabled
    if (this.feedbackIntegration) {
      await this.feedbackIntegration.captureFeedback(
        chapterId,
        paragraphIndex,
        generatedText,
        feedback
      );
    }

    this.metrics.totalFeedback++;
    this.logEvent('feedback_received', {
      chapterId,
      paragraphIndex,
      soundsLikeMe: feedback.soundsLikeMe,
      hasCorrection: !!feedback.correction,
    });
  }

  /**
   * Process pending feedback and learn patterns
   */
  async processFeedback(): Promise<FeedbackProcessingResult> {
    if (!this.feedbackIntegration) {
      return { feedbackProcessed: 0, patternsLearned: 0, styleUpdated: false };
    }

    const result = await this.feedbackIntegration.processPendingFeedback();
    this.metrics.patternsLearned += result.patternsLearned;

    return result;
  }

  /**
   * Get chapter feedback summary
   */
  getChapterFeedbackSummary(chapterId: number): ChapterFeedbackSummary | null {
    return this.dissertationFeedback.getChapterSummary(chapterId);
  }

  /**
   * Get dissertation feedback summary
   */
  getDissertationFeedbackSummary(): DissertationFeedbackSummary {
    return this.dissertationFeedback.getDissertationSummary();
  }

  /**
   * Get enhanced style prompt for writing
   */
  async getEnhancedStylePrompt(): Promise<string> {
    if (!this.feedbackIntegration) {
      return '';
    }
    return this.feedbackIntegration.getEnhancedStylePrompt();
  }

  // ============================================================================
  // Quality
  // ============================================================================

  /**
   * Run quality check on chapter
   */
  async runQualityCheck(chapterId: number): Promise<GauntletResult | null> {
    if (!this.qualityGauntlet) {
      return null;
    }

    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not registered`);
    }

    const context: Record<string, unknown> = {};

    // Add previous chapters for cross-reference checking
    const previousChapters = new Map<number, string>();
    for (const [id, ch] of Array.from(this.chapters.entries())) {
      if (id < chapterId) {
        previousChapters.set(id, ch.currentText);
      }
    }
    context['previousChapters'] = previousChapters;

    const result = await this.qualityGauntlet.runGauntlet(
      chapter.currentText,
      chapterId,
      context
    );

    // Update chapter state
    chapter.qualityHistory.push({
      timestamp: Date.now(),
      score: result.overallScore,
      passed: result.passed,
      issueCount: result.allIssues.length,
    });

    if (result.passed) {
      chapter.status = 'quality_passed';
    }

    // Update metrics
    this.updateQualityMetrics();

    this.logEvent('quality_check', {
      chapterId,
      score: result.overallScore,
      passed: result.passed,
      issueCount: result.allIssues.length,
    });

    return result;
  }

  /**
   * Run philosophical coherence check
   */
  async runPhilosophicalCheck(chapterId: number): Promise<{
    score: number;
    issues: Array<{ description: string; severity: string }>;
    termDefinitions: Map<string, TermDefinition>;
    argumentThreads: Map<string, ArgumentThread>;
  } | null> {
    if (!this.philosophicalChecker) {
      return null;
    }

    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not registered`);
    }

    // Build context with previous chapters
    const context: Record<string, unknown> = {};
    const previousChapters = new Map<number, string>();
    for (const [id, ch] of Array.from(this.chapters.entries())) {
      if (id < chapterId) {
        previousChapters.set(id, ch.currentText);
      }
    }
    context['previousChapters'] = previousChapters;

    const result = await this.philosophicalChecker.evaluate(
      chapter.currentText,
      chapterId,
      context
    );

    return {
      score: result.score,
      issues: result.issues.map(i => ({
        description: i.description,
        severity: i.severity,
      })),
      termDefinitions: this.philosophicalChecker.getTermDefinitions(),
      argumentThreads: this.philosophicalChecker.getArgumentThreads(),
    };
  }

  /**
   * Mark revision iteration
   */
  markRevision(chapterId: number): void {
    const chapter = this.chapters.get(chapterId);
    if (chapter) {
      chapter.revisionCount++;
      chapter.status = 'in_revision';
      this.metrics.revisionIterations++;

      this.logEvent('revision', {
        chapterId,
        revisionNumber: chapter.revisionCount,
      });
    }
  }

  // ============================================================================
  // Session Persistence
  // ============================================================================

  /**
   * Save session state to disk
   */
  async saveSession(): Promise<void> {
    const state: SessionPersistence = {
      sessionId: this.sessionId,
      styleProfileId: this.config.styleProfileId,
      startTime: this.startTime,
      lastActivityTime: Date.now(),
      chapters: Array.from(this.chapters.values()).map(ch => ({
        chapterId: ch.chapterId,
        title: ch.title,
        status: ch.status,
        wordCount: ch.currentText.split(/\s+/).filter(w => w.length > 0).length,
        qualityScore: ch.qualityHistory.length > 0
          ? ch.qualityHistory[ch.qualityHistory.length - 1].score
          : 0,
        revisionCount: ch.revisionCount,
      })),
      metrics: this.getMetrics(),
      events: this.events.slice(-100), // Keep last 100 events
    };

    // Ensure storage directory exists
    await fs.promises.mkdir(this.storagePath, { recursive: true });

    const sessionFile = path.join(this.storagePath, 'session-state.json');
    await fs.promises.writeFile(sessionFile, JSON.stringify(state, null, 2));

    // Note: Feedback state is saved automatically by FeedbackIntegration during operations
  }

  /**
   * Load session state from disk
   */
  static async loadSession(
    sessionId: string,
    baseDir: string = process.cwd()
  ): Promise<SessionPersistence | null> {
    const storagePath = path.join(baseDir, '.dissertation-sessions', sessionId);
    const sessionFile = path.join(storagePath, 'session-state.json');

    try {
      const data = await fs.promises.readFile(sessionFile, 'utf-8');
      return JSON.parse(data) as SessionPersistence;
    } catch {
      return null;
    }
  }

  /**
   * List available sessions
   */
  static async listSessions(baseDir: string = process.cwd()): Promise<string[]> {
    const sessionsDir = path.join(baseDir, '.dissertation-sessions');

    try {
      const entries = await fs.promises.readdir(sessionsDir, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory())
        .map(e => e.name);
    } catch {
      return [];
    }
  }

  // ============================================================================
  // Metrics and Reporting
  // ============================================================================

  /**
   * Get current session metrics
   */
  getMetrics(): SessionMetrics {
    return {
      ...this.metrics,
      sessionDuration: Date.now() - this.startTime,
    };
  }

  /**
   * Get session events
   */
  getEvents(): SessionEvent[] {
    return [...this.events];
  }

  /**
   * Generate session report
   */
  generateReport(): {
    summary: string;
    metrics: SessionMetrics;
    chapters: Array<{
      chapterId: number;
      title: string;
      status: string;
      wordCount: number;
      qualityScore: number;
    }>;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const chapters = Array.from(this.chapters.values()).map(ch => ({
      chapterId: ch.chapterId,
      title: ch.title,
      status: ch.status,
      wordCount: ch.currentText.split(/\s+/).filter(w => w.length > 0).length,
      qualityScore: ch.qualityHistory.length > 0
        ? ch.qualityHistory[ch.qualityHistory.length - 1].score
        : 0,
    }));

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (metrics.localModelUsage < 0.5) {
      recommendations.push(
        'Consider using local models more frequently to reduce costs and improve response times.'
      );
    }

    if (metrics.averageQualityScore < this.config.qualityThreshold) {
      recommendations.push(
        `Average quality score (${metrics.averageQualityScore.toFixed(2)}) is below threshold (${this.config.qualityThreshold}). Consider additional revision passes.`
      );
    }

    const chaptersNeedingRevision = chapters.filter(ch => ch.status === 'draft' || ch.status === 'in_revision');
    if (chaptersNeedingRevision.length > 0) {
      recommendations.push(
        `${chaptersNeedingRevision.length} chapter(s) still need revision: ${chaptersNeedingRevision.map(ch => ch.title).join(', ')}`
      );
    }

    if (metrics.totalFeedback < metrics.totalParagraphs * 0.1) {
      recommendations.push(
        'Consider providing more feedback to improve style learning accuracy.'
      );
    }

    const summary = `
Session ${this.sessionId}
Duration: ${Math.round(metrics.sessionDuration / 60000)} minutes
Chapters: ${chapters.length}
Total Words: ${metrics.totalWords}
Total Paragraphs: ${metrics.totalParagraphs}
Quality Score: ${metrics.averageQualityScore.toFixed(2)}
Feedback Collected: ${metrics.totalFeedback}
Patterns Learned: ${metrics.patternsLearned}
Revision Iterations: ${metrics.revisionIterations}
Local Model Usage: ${(metrics.localModelUsage * 100).toFixed(1)}%
    `.trim();

    return { summary, metrics, chapters, recommendations };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Cleanup session resources
   */
  async cleanup(): Promise<void> {
    if (this.feedbackIntegration) {
      await this.feedbackIntegration.cleanup();
    }

    if (this.philosophicalChecker) {
      this.philosophicalChecker.reset();
    }

    this.logEvent('task_complete', { action: 'session_cleanup' });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Log a session event
   */
  private logEvent(type: SessionEvent['type'], details: Record<string, unknown>): void {
    this.events.push({
      timestamp: Date.now(),
      type,
      details,
    });
  }

  /**
   * Update quality metrics from chapter history
   */
  private updateQualityMetrics(): void {
    const allScores: number[] = [];

    for (const chapter of Array.from(this.chapters.values())) {
      if (chapter.qualityHistory.length > 0) {
        allScores.push(chapter.qualityHistory[chapter.qualityHistory.length - 1].score);
      }
    }

    this.metrics.averageQualityScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new dissertation learning session
 */
export function createDissertationLearningSession(
  config?: Partial<DissertationLearningSessionConfig>,
  sessionId?: string
): DissertationLearningSession {
  return new DissertationLearningSession(config, sessionId);
}

/**
 * Create a strict learning session (higher quality thresholds)
 */
export function createStrictLearningSession(
  config?: Partial<DissertationLearningSessionConfig>,
  sessionId?: string
): DissertationLearningSession {
  return new DissertationLearningSession({
    ...config,
    qualityThreshold: 0.90,
    maxRevisions: 7,
  }, sessionId);
}

/**
 * Create a draft learning session (lower quality thresholds)
 */
export function createDraftLearningSession(
  config?: Partial<DissertationLearningSessionConfig>,
  sessionId?: string
): DissertationLearningSession {
  return new DissertationLearningSession({
    ...config,
    qualityThreshold: 0.75,
    maxRevisions: 3,
    enableQualityGauntlet: false,
  }, sessionId);
}
