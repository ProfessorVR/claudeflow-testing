/**
 * Calibration CLI - Command-line interface for human rating workflow
 *
 * Provides CLI commands for:
 * - Managing raters (register, list, deactivate)
 * - Managing chapters for rating
 * - Submitting and reviewing ratings
 * - Running calibration analysis
 * - Exporting data for external analysis
 *
 * Usage:
 *   npx tsx src/god-agent/cli/phd-cli.ts calibrate <command> [options]
 *
 * Commands:
 *   rater register   - Register a new expert rater
 *   rater list       - List all active raters
 *   chapter add      - Add a chapter for rating
 *   chapter list     - List chapters available for rating
 *   rate             - Submit a rating for a chapter
 *   analyze          - Run calibration analysis
 *   export           - Export data for external analysis
 *   status           - Show calibration progress
 */

import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';
import {
  createRatingStore,
  type IRatingStore,
  type ChapterForRating,
  type CalibrationPair,
} from './rating-store.js';
import {
  createCalibrationAnalyzer,
  type CalibrationReport,
} from './calibration-analyzer.js';
import {
  RATING_ANCHORS,
  ARGUMENT_COHERENCE_CRITERIA,
  CITATION_COMPLETENESS_CRITERIA,
  STYLE_CONSISTENCY_CRITERIA,
  FACTUAL_ACCURACY_CRITERIA,
  validateRatingSubmission,
  meetsMinimumQualifications,
  type RatingScore,
  type RatingConfidence,
  type HumanRatingDimensions,
  type RatingSubmission,
  type RaterProfile,
} from './rating-protocol.js';

// ============================================================================
// CLI Command Interface
// ============================================================================

export interface CalibrateCommandOptions {
  /** Database path override */
  dbPath?: string;

  /** Output format (json, table, text) */
  format?: 'json' | 'table' | 'text';

  /** Rater ID for filtering */
  raterId?: string;

  /** Chapter ID */
  chapterId?: number;

  /** Session ID */
  sessionId?: string;

  /** Include detailed output */
  verbose?: boolean;
}

export interface CalibrateCommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============================================================================
// Main CLI Handler
// ============================================================================

export async function handleCalibrateCommand(
  subcommand: string,
  args: string[],
  options: CalibrateCommandOptions
): Promise<CalibrateCommandResult> {
  const store = createRatingStore(options.dbPath);

  try {
    switch (subcommand) {
      case 'rater':
        return handleRaterCommand(store, args, options);

      case 'chapter':
        return handleChapterCommand(store, args, options);

      case 'rate':
        return await handleRateCommand(store, options);

      case 'analyze':
        return handleAnalyzeCommand(store, options);

      case 'export':
        return handleExportCommand(store, options);

      case 'status':
        return handleStatusCommand(store, options);

      case 'help':
      default:
        return {
          success: true,
          message: getHelpText(),
        };
    }
  } finally {
    store.close();
  }
}

// ============================================================================
// Rater Commands
// ============================================================================

function handleRaterCommand(
  store: IRatingStore,
  args: string[],
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  const action = args[0] || 'list';

  switch (action) {
    case 'register':
      return registerRater(store, args.slice(1), options);

    case 'list':
      return listRaters(store, options);

    case 'info':
      return getRaterInfo(store, args[1] || options.raterId, options);

    case 'deactivate':
      return deactivateRater(store, args[1] || options.raterId);

    default:
      return {
        success: false,
        error: `Unknown rater action: ${action}`,
        message: 'Valid actions: register, list, info, deactivate',
      };
  }
}

function registerRater(
  store: IRatingStore,
  args: string[],
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  // Parse args: name email degree field years hasPublications expertise...
  if (args.length < 6) {
    return {
      success: false,
      error: 'Missing required arguments',
      message: 'Usage: calibrate rater register <name> <email> <degree> <field> <years> <hasPublications> [expertise...]',
    };
  }

  const [name, email, degree, field, yearsStr, hasPubStr, ...expertise] = args;
  const years = parseInt(yearsStr, 10);
  const hasPublications = hasPubStr.toLowerCase() === 'true' || hasPubStr === '1';

  if (isNaN(years)) {
    return {
      success: false,
      error: 'Invalid years experience',
      message: 'Years must be a number',
    };
  }

  const qualifications = {
    highestDegree: degree as 'PhD' | 'ABD' | 'Masters' | 'Other',
    fieldOfStudy: field,
    yearsExperience: years,
    hasPublications,
    expertiseAreas: expertise.length > 0 ? expertise : [field],
  };

  // Validate qualifications
  const qualCheck = meetsMinimumQualifications(qualifications);
  if (!qualCheck.meets) {
    return {
      success: false,
      error: 'Rater does not meet minimum qualifications',
      message: qualCheck.issues.join('; '),
    };
  }

  const raterId = store.registerRater({
    name,
    email,
    qualifications,
    isActive: true,
  });

  return {
    success: true,
    message: `Rater registered successfully`,
    data: { raterId, name, email },
  };
}

function listRaters(
  store: IRatingStore,
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  const raters = store.listActiveRaters();

  if (options.format === 'json') {
    return {
      success: true,
      message: `Found ${raters.length} active raters`,
      data: raters,
    };
  }

  if (raters.length === 0) {
    return {
      success: true,
      message: 'No active raters found. Use "calibrate rater register" to add raters.',
    };
  }

  const table = raters.map(r => ({
    ID: r.raterId.substring(0, 8),
    Name: r.name,
    Email: r.email,
    Degree: r.qualifications.highestDegree,
    Years: r.qualifications.yearsExperience,
    Ratings: r.totalRatingsCompleted,
  }));

  return {
    success: true,
    message: formatTable(table),
    data: raters,
  };
}

function getRaterInfo(
  store: IRatingStore,
  raterId: string | undefined,
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  if (!raterId) {
    return {
      success: false,
      error: 'Rater ID required',
      message: 'Usage: calibrate rater info <rater-id>',
    };
  }

  const rater = store.getRater(raterId);
  if (!rater) {
    return {
      success: false,
      error: 'Rater not found',
      message: `No rater found with ID: ${raterId}`,
    };
  }

  const ratings = store.getRatingsByRater(raterId);

  return {
    success: true,
    message: formatRaterDetails(rater, ratings.length),
    data: { rater, ratingsCount: ratings.length },
  };
}

function deactivateRater(
  store: IRatingStore,
  raterId: string | undefined
): CalibrateCommandResult {
  if (!raterId) {
    return {
      success: false,
      error: 'Rater ID required',
      message: 'Usage: calibrate rater deactivate <rater-id>',
    };
  }

  // Note: Would need to add deactivate method to store
  return {
    success: false,
    error: 'Not implemented',
    message: 'Rater deactivation not yet implemented',
  };
}

// ============================================================================
// Chapter Commands
// ============================================================================

function handleChapterCommand(
  store: IRatingStore,
  args: string[],
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  const action = args[0] || 'list';

  switch (action) {
    case 'add':
      return addChapter(store, args.slice(1), options);

    case 'list':
      return listChapters(store, options);

    default:
      return {
        success: false,
        error: `Unknown chapter action: ${action}`,
        message: 'Valid actions: add, list',
      };
  }
}

function addChapter(
  store: IRatingStore,
  args: string[],
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  // Parse: chapterId sessionId title wordCount arg cit style fact overall passed
  if (args.length < 10) {
    return {
      success: false,
      error: 'Missing required arguments',
      message: 'Usage: calibrate chapter add <chapterId> <sessionId> <title> <wordCount> <argScore> <citScore> <styleScore> <factScore> <overallScore> <passed>',
    };
  }

  const [chapterIdStr, sessionId, title, wordCountStr, argStr, citStr, styleStr, factStr, overallStr, passedStr] = args;

  const chapterId = parseInt(chapterIdStr, 10);
  const wordCount = parseInt(wordCountStr, 10);
  const gauntletScores = {
    argumentCoherence: parseFloat(argStr),
    citationCompleteness: parseFloat(citStr),
    styleConsistency: parseFloat(styleStr),
    factualAccuracy: parseFloat(factStr),
    overall: parseFloat(overallStr),
  };
  const passed = passedStr.toLowerCase() === 'true' || passedStr === '1';

  store.addChapterForRating({
    chapterId,
    sessionId,
    title,
    wordCount,
    gauntletScores,
    gauntletPassed: passed,
  });

  return {
    success: true,
    message: `Chapter ${chapterId} added for rating`,
    data: { chapterId, sessionId, title },
  };
}

function listChapters(
  store: IRatingStore,
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  const chapters = store.getChaptersForRating(options.raterId);

  if (options.format === 'json') {
    return {
      success: true,
      message: `Found ${chapters.length} chapters`,
      data: chapters,
    };
  }

  if (chapters.length === 0) {
    return {
      success: true,
      message: 'No chapters available for rating. Use "calibrate chapter add" to add chapters.',
    };
  }

  const table = chapters.map(c => ({
    Chapter: c.chapterId,
    Session: c.sessionId.substring(0, 8),
    Title: c.title.substring(0, 30) + (c.title.length > 30 ? '...' : ''),
    Words: c.wordCount,
    'Gauntlet Score': (c.gauntletScores.overall * 100).toFixed(1) + '%',
    Passed: c.gauntletPassed ? 'Yes' : 'No',
  }));

  return {
    success: true,
    message: formatTable(table),
    data: chapters,
  };
}

// ============================================================================
// Rating Commands
// ============================================================================

async function handleRateCommand(
  store: IRatingStore,
  options: CalibrateCommandOptions
): Promise<CalibrateCommandResult> {
  if (!options.raterId) {
    return {
      success: false,
      error: 'Rater ID required',
      message: 'Usage: calibrate rate --rater-id <id> [--chapter-id <id>] [--session-id <id>]',
    };
  }

  // Verify rater exists
  const rater = store.getRater(options.raterId);
  if (!rater) {
    return {
      success: false,
      error: 'Rater not found',
      message: `No rater found with ID: ${options.raterId}`,
    };
  }

  // Get chapter to rate
  let chapter: ChapterForRating | undefined;

  if (options.chapterId && options.sessionId) {
    const chapters = store.getChaptersForRating(options.raterId);
    chapter = chapters.find(
      c => c.chapterId === options.chapterId && c.sessionId === options.sessionId
    );
  } else {
    // Get next unrated chapter for this rater
    const chapters = store.getChaptersForRating(options.raterId);
    chapter = chapters[0];
  }

  if (!chapter) {
    return {
      success: true,
      message: 'No chapters available for rating by this rater.',
    };
  }

  // Interactive rating collection
  console.log('\n' + '='.repeat(60));
  console.log(`Rating Chapter ${chapter.chapterId}: ${chapter.title}`);
  console.log('='.repeat(60));
  console.log(`Session: ${chapter.sessionId}`);
  console.log(`Word Count: ${chapter.wordCount}`);
  console.log(`Gauntlet Score: ${(chapter.gauntletScores.overall * 100).toFixed(1)}%`);
  console.log('\n' + RATING_ANCHORS[3] + ' (3 = Acceptable)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise(resolve => {
      rl.question(question, answer => {
        resolve(answer.trim());
      });
    });
  };

  try {
    const startTime = Date.now();

    // Collect ratings for each dimension
    const ratings: HumanRatingDimensions = {
      argumentCoherence: await collectDimensionRating(askQuestion, 'Argument Coherence', ARGUMENT_COHERENCE_CRITERIA),
      citationCompleteness: await collectDimensionRating(askQuestion, 'Citation Completeness', CITATION_COMPLETENESS_CRITERIA),
      styleConsistency: await collectDimensionRating(askQuestion, 'Style Consistency', STYLE_CONSISTENCY_CRITERIA),
      factualAccuracy: await collectDimensionRating(askQuestion, 'Factual Accuracy', FACTUAL_ACCURACY_CRITERIA),
      overallQuality: await collectOverallRating(askQuestion),
    };

    const endTime = Date.now();
    const timeSpentMinutes = Math.round((endTime - startTime) / 60000);

    // Create submission
    const submission: RatingSubmission = {
      submissionId: uuidv4(),
      raterId: options.raterId,
      chapterId: chapter.chapterId,
      sessionId: chapter.sessionId,
      ratings,
      metadata: {
        timeSpentMinutes: Math.max(1, timeSpentMinutes),
        isRerating: false,
      },
      timestamp: new Date().toISOString(),
    };

    // Validate
    const validation = validateRatingSubmission(submission);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid rating submission',
        message: validation.errors.join('; '),
      };
    }

    // Store
    const submissionId = store.storeRating(submission);

    return {
      success: true,
      message: `Rating submitted successfully (ID: ${submissionId.substring(0, 8)})`,
      data: { submissionId, chapterId: chapter.chapterId },
    };
  } finally {
    rl.close();
  }
}

async function collectDimensionRating(
  ask: (q: string) => Promise<string>,
  dimension: string,
  criteria: Record<RatingScore, string[]>
): Promise<{ score: RatingScore; confidence: RatingConfidence; notes?: string }> {
  console.log(`\n--- ${dimension} ---`);
  console.log('Criteria for score 3 (Acceptable):');
  criteria[3].forEach(c => console.log(`  - ${c}`));

  const scoreStr = await ask(`${dimension} Score (1-5): `);
  const score = parseInt(scoreStr, 10) as RatingScore;

  if (score < 1 || score > 5 || isNaN(score)) {
    console.log('Invalid score, defaulting to 3');
    return { score: 3, confidence: 'low' };
  }

  const confStr = await ask('Confidence (l/m/h): ');
  const confidence: RatingConfidence =
    confStr.toLowerCase().startsWith('l') ? 'low' :
    confStr.toLowerCase().startsWith('h') ? 'high' : 'medium';

  const notes = await ask('Notes (optional, press Enter to skip): ');

  return {
    score,
    confidence,
    notes: notes || undefined,
  };
}

async function collectOverallRating(
  ask: (q: string) => Promise<string>
): Promise<{ score: RatingScore; wouldPublish: boolean; notes?: string }> {
  console.log('\n--- Overall Quality ---');

  const scoreStr = await ask('Overall Score (1-5): ');
  const score = parseInt(scoreStr, 10) as RatingScore;

  const publishStr = await ask('Would you recommend for publication? (y/n): ');
  const wouldPublish = publishStr.toLowerCase().startsWith('y');

  const notes = await ask('Overall notes (optional): ');

  return {
    score: (score >= 1 && score <= 5) ? score : 3,
    wouldPublish,
    notes: notes || undefined,
  };
}

// ============================================================================
// Analysis Commands
// ============================================================================

function handleAnalyzeCommand(
  store: IRatingStore,
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  const pairs = store.getCalibrationPairs();

  if (pairs.length === 0) {
    return {
      success: true,
      message: 'No calibration data available. Add chapters and collect ratings first.',
    };
  }

  const analyzer = createCalibrationAnalyzer(0.50);
  const report = analyzer.analyze(pairs);

  if (options.format === 'json') {
    return {
      success: true,
      message: 'Calibration analysis complete',
      data: report,
    };
  }

  return {
    success: true,
    message: formatCalibrationReport(report),
    data: report,
  };
}

// ============================================================================
// Export Commands
// ============================================================================

function handleExportCommand(
  store: IRatingStore,
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  const data = store.exportForAnalysis();

  if (options.format === 'json') {
    return {
      success: true,
      message: 'Export complete',
      data,
    };
  }

  // Generate CSV-friendly output
  const csv = generateCSVExport(data);

  return {
    success: true,
    message: csv,
    data,
  };
}

function generateCSVExport(data: ReturnType<IRatingStore['exportForAnalysis']>): string {
  const lines: string[] = [];

  // Ratings CSV
  lines.push('=== RATINGS ===');
  lines.push('submission_id,rater_id,chapter_id,session_id,arg_score,cit_score,style_score,fact_score,overall_score,would_publish,time_minutes');
  for (const r of data.ratings) {
    lines.push([
      r.submissionId,
      r.raterId,
      r.chapterId,
      r.sessionId,
      r.ratings.argumentCoherence.score,
      r.ratings.citationCompleteness.score,
      r.ratings.styleConsistency.score,
      r.ratings.factualAccuracy.score,
      r.ratings.overallQuality.score,
      r.ratings.overallQuality.wouldPublish ? 1 : 0,
      r.metadata.timeSpentMinutes,
    ].join(','));
  }

  // Calibration pairs CSV
  lines.push('\n=== CALIBRATION PAIRS ===');
  lines.push('chapter_id,session_id,gauntlet_arg,gauntlet_cit,gauntlet_style,gauntlet_fact,gauntlet_overall,human_arg,human_cit,human_style,human_fact,human_overall,rater_count');
  for (const p of data.pairs) {
    lines.push([
      p.chapterId,
      p.sessionId,
      p.gauntletScores.argumentCoherence.toFixed(3),
      p.gauntletScores.citationCompleteness.toFixed(3),
      p.gauntletScores.styleConsistency.toFixed(3),
      p.gauntletScores.factualAccuracy.toFixed(3),
      p.gauntletScores.overall.toFixed(3),
      p.humanRatings.argumentCoherence.toFixed(2),
      p.humanRatings.citationCompleteness.toFixed(2),
      p.humanRatings.styleConsistency.toFixed(2),
      p.humanRatings.factualAccuracy.toFixed(2),
      p.humanRatings.overall.toFixed(2),
      p.raterCount,
    ].join(','));
  }

  return lines.join('\n');
}

// ============================================================================
// Status Commands
// ============================================================================

function handleStatusCommand(
  store: IRatingStore,
  options: CalibrateCommandOptions
): CalibrateCommandResult {
  const raters = store.listActiveRaters();
  const chapters = store.getChaptersForRating();
  const pairs = store.getCalibrationPairs();
  const reliability = store.getInterRaterReliability();

  const status = {
    raters: {
      total: raters.length,
      withRatings: raters.filter(r => r.totalRatingsCompleted > 0).length,
    },
    chapters: {
      total: chapters.length,
      rated: pairs.length,
      unrated: chapters.length - pairs.length,
    },
    ratings: {
      total: reliability.totalRatings,
      multiRatedChapters: reliability.multiRatedChapters,
    },
    reliability: {
      percentAgreement: (reliability.percentAgreement * 100).toFixed(1) + '%',
      percentAgreementWithin1: (reliability.percentAgreementWithin1 * 100).toFixed(1) + '%',
    },
    targets: {
      chaptersNeeded: Math.max(0, 50 - pairs.length),
      ratersNeeded: Math.max(0, 5 - raters.length),
    },
  };

  if (options.format === 'json') {
    return {
      success: true,
      message: 'Status retrieved',
      data: status,
    };
  }

  const lines = [
    '╔══════════════════════════════════════════════════════════╗',
    '║           CALIBRATION STUDY STATUS                       ║',
    '╠══════════════════════════════════════════════════════════╣',
    `║ Raters:    ${status.raters.total} active (${status.raters.withRatings} with ratings)`.padEnd(59) + '║',
    `║ Chapters:  ${status.chapters.total} total, ${status.chapters.rated} rated, ${status.chapters.unrated} pending`.padEnd(59) + '║',
    `║ Ratings:   ${status.ratings.total} total submissions`.padEnd(59) + '║',
    `║ Multi-rated: ${status.ratings.multiRatedChapters} chapters with 2+ raters`.padEnd(59) + '║',
    '╠══════════════════════════════════════════════════════════╣',
    '║ INTER-RATER RELIABILITY                                  ║',
    `║ Exact Agreement:    ${status.reliability.percentAgreement}`.padEnd(59) + '║',
    `║ Agreement ±1 point: ${status.reliability.percentAgreementWithin1}`.padEnd(59) + '║',
    '╠══════════════════════════════════════════════════════════╣',
    '║ TARGETS                                                  ║',
    `║ Chapters needed:  ${status.targets.chaptersNeeded} more (target: 50)`.padEnd(59) + '║',
    `║ Raters needed:    ${status.targets.ratersNeeded} more (target: 5)`.padEnd(59) + '║',
    '╚══════════════════════════════════════════════════════════╝',
  ];

  return {
    success: true,
    message: lines.join('\n'),
    data: status,
  };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatTable(rows: Record<string, any>[]): string {
  if (rows.length === 0) return 'No data';

  const headers = Object.keys(rows[0]);
  const widths = headers.map(h => {
    const values = rows.map(r => String(r[h] ?? ''));
    return Math.max(h.length, ...values.map(v => v.length));
  });

  const lines: string[] = [];

  // Header
  lines.push(headers.map((h, i) => h.padEnd(widths[i])).join(' | '));
  lines.push(widths.map(w => '-'.repeat(w)).join('-+-'));

  // Rows
  for (const row of rows) {
    lines.push(headers.map((h, i) => String(row[h] ?? '').padEnd(widths[i])).join(' | '));
  }

  return lines.join('\n');
}

function formatRaterDetails(rater: RaterProfile, ratingsCount: number): string {
  return `
Rater: ${rater.name}
ID: ${rater.raterId}
Email: ${rater.email}
Degree: ${rater.qualifications.highestDegree} in ${rater.qualifications.fieldOfStudy}
Experience: ${rater.qualifications.yearsExperience} years
Publications: ${rater.qualifications.hasPublications ? 'Yes' : 'No'}
Expertise: ${rater.qualifications.expertiseAreas.join(', ')}
Onboarding: ${rater.onboardingCompletedAt || 'Not completed'}
Ratings Completed: ${ratingsCount}
Status: ${rater.isActive ? 'Active' : 'Inactive'}
  `.trim();
}

function formatCalibrationReport(report: CalibrationReport): string {
  const lines: string[] = [];

  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('║           CALIBRATION ANALYSIS REPORT                    ║');
  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push(`║ Chapters Analyzed: ${report.metadata.totalChapters}`.padEnd(59) + '║');
  lines.push(`║ Total Ratings: ${report.metadata.totalRatings}`.padEnd(59) + '║');
  lines.push(`║ Avg Raters/Chapter: ${report.metadata.averageRatersPerChapter.toFixed(1)}`.padEnd(59) + '║');
  lines.push(`║ Target Correlation: r >= ${report.metadata.targetCorrelation}`.padEnd(59) + '║');

  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push('║ OVERALL RESULT: ' + (report.passesCalibration ? '✓ PASSES' : '✗ FAILS') + ''.padEnd(40) + '║');
  lines.push(`║ Average Correlation: r = ${report.overall.pearsonR.toFixed(3)}`.padEnd(59) + '║');
  lines.push(`║ Average R²: ${report.overall.rSquared.toFixed(3)}`.padEnd(59) + '║');

  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push('║ BY DIMENSION                                             ║');
  lines.push('║ Dimension            | r      | R²     | Meets Target   ║');
  lines.push('║ ---------------------|--------|--------|--------------- ║');

  for (const [dim, result] of Object.entries(report.byDimension)) {
    if (dim === 'overall') continue;
    const status = result.meetsTarget ? '✓ Yes' : '✗ No';
    lines.push(`║ ${dim.padEnd(20)} | ${result.pearsonR.toFixed(3).padStart(6)} | ${result.rSquared.toFixed(3).padStart(6)} | ${status.padEnd(14)} ║`);
  }

  if (report.failingDimensions.length > 0) {
    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║ FAILING DIMENSIONS                                       ║');
    for (const dim of report.failingDimensions) {
      lines.push(`║ - ${dim}`.padEnd(59) + '║');
    }
  }

  if (report.recommendations.length > 0) {
    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║ RECOMMENDATIONS                                          ║');
    for (const rec of report.recommendations) {
      // Word wrap recommendation
      const wrapped = wrapText(rec, 56);
      for (const line of wrapped) {
        lines.push(`║ ${line}`.padEnd(59) + '║');
      }
    }
  }

  lines.push('╚══════════════════════════════════════════════════════════╝');

  return lines.join('\n');
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

function getHelpText(): string {
  return `
Calibration CLI - Human Rating Workflow for Quality Gauntlet Calibration

USAGE:
  npx tsx src/god-agent/cli/phd-cli.ts calibrate <command> [options]

COMMANDS:
  rater register <name> <email> <degree> <field> <years> <hasPublications> [expertise...]
    Register a new expert rater

  rater list
    List all active raters

  rater info <rater-id>
    Show details for a specific rater

  chapter add <chapterId> <sessionId> <title> <wordCount> <argScore> <citScore> <styleScore> <factScore> <overallScore> <passed>
    Add a chapter for rating with its gauntlet scores

  chapter list [--rater-id <id>]
    List chapters available for rating

  rate --rater-id <id> [--chapter-id <id>] [--session-id <id>]
    Submit a rating (interactive)

  analyze [--format json]
    Run calibration analysis

  export [--format json]
    Export all data for external analysis

  status [--format json]
    Show calibration progress and statistics

OPTIONS:
  --db-path <path>    Override database path (default: .god-agent/calibration.db)
  --format <format>   Output format: json, table, text (default: text)
  --rater-id <id>     Filter by rater ID
  --verbose           Include detailed output

EXAMPLES:
  # Register a new rater
  npx tsx src/god-agent/cli/phd-cli.ts calibrate rater register "Dr. Jane Smith" "jane@example.edu" PhD "Computer Science" 5 true "AI" "NLP"

  # Add a chapter for rating
  npx tsx src/god-agent/cli/phd-cli.ts calibrate chapter add 1 "session-123" "Introduction" 3500 0.85 0.90 0.78 0.82 0.84 true

  # Submit a rating interactively
  npx tsx src/god-agent/cli/phd-cli.ts calibrate rate --rater-id abc123

  # Run calibration analysis
  npx tsx src/god-agent/cli/phd-cli.ts calibrate analyze

  # Export data for R/SPSS analysis
  npx tsx src/god-agent/cli/phd-cli.ts calibrate export --format json > calibration_data.json
  `.trim();
}

export default {
  handleCalibrateCommand,
};
