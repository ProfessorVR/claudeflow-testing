/**
 * Feedback Module - Paragraph-level feedback learning for PhD Pipeline
 *
 * This module provides fine-grained style learning from user corrections:
 *
 * - ParagraphFeedbackCapture: Captures feedback on individual paragraphs
 * - StyleDriftDetector: Detects when generated text deviates from user's style
 * - IncrementalStyleUpdater: Learns patterns from corrections to update profiles
 * - ContrastiveLearner: Stores and learns from generated vs corrected pairs
 * - FeedbackIntegration: Unified interface integrating all components
 *
 * Usage:
 * ```typescript
 * import { FeedbackIntegration, createFeedbackIntegration } from './feedback';
 *
 * const feedback = createFeedbackIntegration(styleProfile, profileManager, storagePath);
 * await feedback.initialize(sessionId);
 *
 * // After generating a paragraph
 * const result = await feedback.onParagraphGenerated(chapterId, paragraphIndex, text);
 * if (result.shouldAlert) {
 *   console.log('Style drift detected:', result.driftAnalysis);
 * }
 *
 * // Capture user feedback
 * await feedback.captureFeedback(chapterId, paragraphIndex, generatedText, {
 *   soundsLikeMe: false,
 *   correction: 'User corrected text...',
 *   issues: [{ type: 'tone', description: 'Too informal' }]
 * });
 *
 * // Process feedback and update style
 * const processed = await feedback.processPendingFeedback();
 * console.log(`Learned ${processed.patternsLearned} patterns`);
 *
 * // Get enhanced prompt with learned patterns
 * const enhancedPrompt = await feedback.getEnhancedStylePrompt();
 * ```
 */

// Paragraph Feedback Capture
export {
  ParagraphFeedbackCapture,
  type ParagraphFeedback,
  type FeedbackSession,
  type FeedbackStats,
  type TrainingExport,
  type StyleIssue,
  type IssueType,
} from './paragraph-feedback-capture.js';

// Style Drift Detector
export {
  StyleDriftDetector,
  type DriftAnalysis,
  type DriftedArea,
  type DriftArea,
  type AlertLevel,
  type ParagraphDriftAnalysis,
  type ChapterDriftAnalysis,
} from './style-drift-detector.js';

// Incremental Style Updater
export {
  IncrementalStyleUpdater,
  type PatternDiff,
  type PatternDiffType,
  type PatternCategory,
  type StyleUpdateResult,
  type CorrectionClassification,
  type LearningStats,
} from './incremental-style-updater.js';

// Contrastive Learner
export {
  ContrastiveLearner,
  type ContrastivePair,
  type ConsistentPattern,
  type AntiPattern,
  type PositivePattern,
} from './contrastive-learner.js';

// Cross-Session Learner
export {
  CrossSessionLearner,
  type SessionSnapshot,
  type ConsolidatedPattern,
  type LearningTrend,
  type CrossSessionState,
} from './cross-session-learner.js';

// Philosophical Feedback Processor
export {
  PhilosophicalFeedbackProcessor,
  type PhilosophicalIssueType,
  type PhilosophicalIssue,
  type PhilosophicalFeedbackAnalysis,
  type TerminologyChange,
  type ArgumentChange,
  type CitationChange,
} from './philosophical-feedback-processor.js';

// Enhancement Prompt Generator
export {
  EnhancementPromptGenerator,
  createEnhancementPromptGenerator,
  type EnhancementPromptConfig,
} from './enhancement-prompt-generator.js';

// Feedback Integration
export {
  FeedbackIntegration,
  createFeedbackIntegration,
  type FeedbackProcessingResult,
  type ParagraphGenerationResult,
  type FeedbackInput,
} from './feedback-integration.js';

// Feedback Metrics (PHASE-6-001)
export {
  FeedbackMetricsCollector,
  createFeedbackMetricsCollector,
  formatEffectivenessReport,
  formatReportSummary,
  type FeedbackComponent,
  type PatternApplicationEvent,
  type CorrectionEvent,
  type SatisfactionRecord,
  type QualityChangeRecord,
  type ComponentEffectiveness,
  type FeedbackROI,
  type FeedbackEffectivenessReport,
  type MetricsEvent,
  type TimeWindow,
} from './feedback-metrics.js';
