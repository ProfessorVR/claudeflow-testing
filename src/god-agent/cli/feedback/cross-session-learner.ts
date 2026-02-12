/**
 * CrossSessionLearner - Aggregates learning across multiple sessions
 * Tracks session history, learning evolution, and consolidates patterns that persist
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { ContrastivePair, ConsistentPattern, AntiPattern, PositivePattern } from './contrastive-learner.js';
import type { ParagraphFeedback, FeedbackStats, IssueType } from './paragraph-feedback-capture.js';

/**
 * User satisfaction metrics for a session (PHASE-3-002)
 */
export interface SessionSatisfactionMetrics {
  /** Number of chapters rated this session */
  chaptersRated: number;
  /** Average "sounds like me" score (1-5) */
  avgSoundsLikeMeScore: number;
  /** Average quality satisfaction score (1-5) */
  avgQualitySatisfactionScore: number;
  /** Percentage who would use chapter as-is (0-1) */
  wouldUseAsIsRatio: number;
  /** Raw ratings for detailed analysis */
  ratings: Array<{
    chapterId: number;
    soundsLikeMeScore: 1 | 2 | 3 | 4 | 5;
    qualitySatisfactionScore: 1 | 2 | 3 | 4 | 5;
    wouldUseAsIs: boolean;
  }>;
}

/**
 * A learning session snapshot
 */
export interface SessionSnapshot {
  sessionId: string;
  timestamp: number;
  duration: number;  // milliseconds

  /** Chapter(s) worked on */
  chapters: number[];

  /** Feedback statistics */
  stats: FeedbackStats;

  /** Patterns discovered this session */
  discoveredPatterns: {
    consistent: ConsistentPattern[];
    anti: AntiPattern[];
    positive: PositivePattern[];
  };

  /** Contrastive pairs added this session */
  pairsAdded: number;

  /** Voice match accuracy (soundsLikeMe ratio) */
  voiceMatchAccuracy: number;

  /** Style drift metrics */
  driftMetrics: {
    averageDrift: number;
    worstDriftParagraphs: number;
    alertCount: number;
  };

  /** User satisfaction metrics (PHASE-3-002) */
  satisfactionMetrics?: SessionSatisfactionMetrics;
}

/**
 * Consolidated pattern that persists across sessions
 */
export interface ConsolidatedPattern {
  pattern: string;
  replacement?: string;  // For consistent patterns
  reason?: string;       // For anti-patterns
  context?: string;      // For positive patterns
  type: 'consistent' | 'anti' | 'positive';

  /** Number of sessions where this pattern appeared */
  sessionCount: number;

  /** Total frequency across all sessions */
  totalFrequency: number;

  /** First session where discovered */
  firstSeenSession: string;
  firstSeenTimestamp: number;

  /** Most recent session */
  lastSeenSession: string;
  lastSeenTimestamp: number;

  /** Confidence based on cross-session persistence */
  consolidatedConfidence: number;
}

/**
 * Learning trend over time
 */
export interface LearningTrend {
  /** Voice match accuracy trend */
  voiceMatchTrend: number[];  // Array of ratios per session

  /** Style drift trend */
  driftTrend: number[];  // Array of average drift per session

  /** Pattern discovery trend */
  patternDiscoveryTrend: number[];  // Patterns discovered per session

  /** Issue type trends */
  issueTypeTrends: Record<IssueType, number[]>;

  /** Overall improvement score (0-1) */
  improvementScore: number;

  /** User satisfaction trends (PHASE-3-002) */
  satisfactionTrends: {
    /** "Sounds like me" scores per session (1-5 average) */
    soundsLikeMeTrend: number[];
    /** Quality satisfaction scores per session (1-5 average) */
    qualitySatisfactionTrend: number[];
    /** "Would use as-is" ratio per session (0-1) */
    wouldUseAsIsTrend: number[];
  };
}

/**
 * Cross-session learning state
 */
export interface CrossSessionState {
  /** All session snapshots (limited to recent sessions) */
  sessions: SessionSnapshot[];

  /** Consolidated patterns */
  consolidatedPatterns: ConsolidatedPattern[];

  /** Learning trends */
  trends: LearningTrend;

  /** Total sessions recorded */
  totalSessionsRecorded: number;

  /** First session timestamp */
  firstSessionTimestamp: number;

  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * CrossSessionLearner class for aggregating learning across sessions
 */
export class CrossSessionLearner {
  private state: CrossSessionState;
  private storagePath: string;
  private maxSessionSnapshots: number = 50;  // Keep last 50 sessions
  private patternConsolidationThreshold: number = 3;  // Patterns must appear in 3+ sessions

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.state = this.createEmptyState();
  }

  /**
   * Record a session snapshot
   */
  recordSession(
    sessionId: string,
    stats: FeedbackStats,
    patterns: {
      consistent: ConsistentPattern[];
      anti: AntiPattern[];
      positive: PositivePattern[];
    },
    pairsAdded: number,
    driftMetrics: {
      averageDrift: number;
      worstDriftParagraphs: number;
      alertCount: number;
    },
    chapters: number[],
    sessionStartTime: number,
    satisfactionMetrics?: SessionSatisfactionMetrics
  ): void {
    const now = Date.now();

    const snapshot: SessionSnapshot = {
      sessionId,
      timestamp: now,
      duration: now - sessionStartTime,
      chapters,
      stats,
      discoveredPatterns: patterns,
      pairsAdded,
      voiceMatchAccuracy: stats.soundsLikeMeRatio,
      driftMetrics,
      satisfactionMetrics,
    };

    // Add to sessions
    this.state.sessions.push(snapshot);
    this.state.totalSessionsRecorded++;
    this.state.lastUpdated = now;

    if (this.state.firstSessionTimestamp === 0) {
      this.state.firstSessionTimestamp = sessionStartTime;
    }

    // Trim old sessions
    if (this.state.sessions.length > this.maxSessionSnapshots) {
      this.state.sessions = this.state.sessions.slice(-this.maxSessionSnapshots);
    }

    // Update consolidated patterns
    this.consolidatePatterns();

    // Update trends
    this.updateTrends();
  }

  /**
   * Get consolidated patterns that persist across sessions
   */
  getConsolidatedPatterns(minSessions: number = 2): ConsolidatedPattern[] {
    return this.state.consolidatedPatterns
      .filter(p => p.sessionCount >= minSessions)
      .sort((a, b) => b.consolidatedConfidence - a.consolidatedConfidence);
  }

  /**
   * Get consolidated patterns by type
   */
  getConsolidatedPatternsByType(type: 'consistent' | 'anti' | 'positive'): ConsolidatedPattern[] {
    return this.state.consolidatedPatterns
      .filter(p => p.type === type)
      .sort((a, b) => b.consolidatedConfidence - a.consolidatedConfidence);
  }

  /**
   * Get learning trends
   */
  getTrends(): LearningTrend {
    return this.state.trends;
  }

  /**
   * Get session history
   */
  getSessionHistory(limit?: number): SessionSnapshot[] {
    const sessions = [...this.state.sessions].reverse();  // Most recent first
    return limit ? sessions.slice(0, limit) : sessions;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionSnapshot | undefined {
    return this.state.sessions.find(s => s.sessionId === sessionId);
  }

  /**
   * Get improvement summary
   */
  getImprovementSummary(): {
    overallImprovement: number;
    voiceMatchImprovement: number;
    driftReduction: number;
    sessionsAnalyzed: number;
    consolidatedPatternCount: number;
    topImprovementAreas: string[];
    areasNeedingWork: string[];
    satisfactionImprovement: {
      soundsLikeMeImprovement: number;
      qualityImprovement: number;
      wouldUseAsIsImprovement: number;
    };
  } {
    const trends = this.state.trends;
    const sessions = this.state.sessions;

    if (sessions.length < 2) {
      return {
        overallImprovement: 0,
        voiceMatchImprovement: 0,
        driftReduction: 0,
        sessionsAnalyzed: sessions.length,
        consolidatedPatternCount: this.state.consolidatedPatterns.length,
        topImprovementAreas: [],
        areasNeedingWork: [],
        satisfactionImprovement: {
          soundsLikeMeImprovement: 0,
          qualityImprovement: 0,
          wouldUseAsIsImprovement: 0,
        },
      };
    }

    // Calculate voice match improvement (comparing first half to second half)
    const voiceMatchTrend = trends.voiceMatchTrend;
    const midpoint = Math.floor(voiceMatchTrend.length / 2);
    const firstHalfVoice = this.average(voiceMatchTrend.slice(0, midpoint));
    const secondHalfVoice = this.average(voiceMatchTrend.slice(midpoint));
    const voiceMatchImprovement = secondHalfVoice - firstHalfVoice;

    // Calculate drift reduction
    const driftTrend = trends.driftTrend;
    const firstHalfDrift = this.average(driftTrend.slice(0, midpoint));
    const secondHalfDrift = this.average(driftTrend.slice(midpoint));
    const driftReduction = firstHalfDrift - secondHalfDrift;  // Positive = improvement

    // Calculate satisfaction improvements (PHASE-3-002)
    const satisfactionTrends = trends.satisfactionTrends;
    const firstHalfSoundsLikeMe = this.average(
      satisfactionTrends.soundsLikeMeTrend.slice(0, midpoint).filter(v => v > 0)
    );
    const secondHalfSoundsLikeMe = this.average(
      satisfactionTrends.soundsLikeMeTrend.slice(midpoint).filter(v => v > 0)
    );
    const firstHalfQuality = this.average(
      satisfactionTrends.qualitySatisfactionTrend.slice(0, midpoint).filter(v => v > 0)
    );
    const secondHalfQuality = this.average(
      satisfactionTrends.qualitySatisfactionTrend.slice(midpoint).filter(v => v > 0)
    );
    const firstHalfWouldUse = this.average(
      satisfactionTrends.wouldUseAsIsTrend.slice(0, midpoint).filter(v => v > 0)
    );
    const secondHalfWouldUse = this.average(
      satisfactionTrends.wouldUseAsIsTrend.slice(midpoint).filter(v => v > 0)
    );

    // Identify improvement areas
    const topImprovementAreas: string[] = [];
    const areasNeedingWork: string[] = [];

    for (const [issueType, trend] of Object.entries(trends.issueTypeTrends)) {
      if (trend.length >= 2) {
        const firstHalf = this.average(trend.slice(0, midpoint));
        const secondHalf = this.average(trend.slice(midpoint));
        const change = secondHalf - firstHalf;

        if (change < -0.5) {  // Significant decrease in issues
          topImprovementAreas.push(issueType);
        } else if (change > 0.5) {  // Increase in issues
          areasNeedingWork.push(issueType);
        }
      }
    }

    return {
      overallImprovement: trends.improvementScore,
      voiceMatchImprovement,
      driftReduction,
      sessionsAnalyzed: sessions.length,
      consolidatedPatternCount: this.state.consolidatedPatterns.length,
      topImprovementAreas,
      areasNeedingWork,
      satisfactionImprovement: {
        soundsLikeMeImprovement: secondHalfSoundsLikeMe - firstHalfSoundsLikeMe,
        qualityImprovement: secondHalfQuality - firstHalfQuality,
        wouldUseAsIsImprovement: secondHalfWouldUse - firstHalfWouldUse,
      },
    };
  }

  /**
   * Get satisfaction trends (PHASE-3-002)
   */
  getSatisfactionTrends(): {
    currentAvgSoundsLikeMe: number;
    currentAvgQuality: number;
    currentWouldUseAsIsRatio: number;
    trendsOverTime: LearningTrend['satisfactionTrends'];
    sessionsWithRatings: number;
  } {
    const sessions = this.state.sessions;
    const sessionsWithRatings = sessions.filter(s => s.satisfactionMetrics).length;

    if (sessionsWithRatings === 0) {
      return {
        currentAvgSoundsLikeMe: 0,
        currentAvgQuality: 0,
        currentWouldUseAsIsRatio: 0,
        trendsOverTime: this.state.trends.satisfactionTrends,
        sessionsWithRatings: 0,
      };
    }

    // Get average from last 5 sessions with ratings
    const recentWithRatings = sessions
      .filter(s => s.satisfactionMetrics)
      .slice(-5);

    return {
      currentAvgSoundsLikeMe: this.average(
        recentWithRatings.map(s => s.satisfactionMetrics!.avgSoundsLikeMeScore)
      ),
      currentAvgQuality: this.average(
        recentWithRatings.map(s => s.satisfactionMetrics!.avgQualitySatisfactionScore)
      ),
      currentWouldUseAsIsRatio: this.average(
        recentWithRatings.map(s => s.satisfactionMetrics!.wouldUseAsIsRatio)
      ),
      trendsOverTime: this.state.trends.satisfactionTrends,
      sessionsWithRatings,
    };
  }

  /**
   * Generate cross-session learning prompt
   */
  generateLearningPrompt(): string {
    const lines: string[] = [
      '## CROSS-SESSION LEARNING INSIGHTS',
      '',
    ];

    // Add consolidated patterns
    const consolidatedConsistent = this.getConsolidatedPatternsByType('consistent').slice(0, 10);
    const consolidatedAnti = this.getConsolidatedPatternsByType('anti').slice(0, 8);
    const consolidatedPositive = this.getConsolidatedPatternsByType('positive').slice(0, 8);

    if (consolidatedConsistent.length > 0) {
      lines.push('### Proven Style Preferences (consistent across sessions)');
      lines.push('');
      for (const p of consolidatedConsistent) {
        const confidence = (p.consolidatedConfidence * 100).toFixed(0);
        lines.push(`- "${p.pattern}" → "${p.replacement}" [${p.sessionCount} sessions, ${confidence}% confidence]`);
      }
      lines.push('');
    }

    if (consolidatedAnti.length > 0) {
      lines.push('### Confirmed Patterns to Avoid');
      lines.push('');
      for (const p of consolidatedAnti) {
        lines.push(`- AVOID: "${p.pattern}" - ${p.reason} [seen in ${p.sessionCount} sessions]`);
      }
      lines.push('');
    }

    if (consolidatedPositive.length > 0) {
      lines.push('### Confirmed Positive Patterns');
      lines.push('');
      for (const p of consolidatedPositive) {
        lines.push(`- USE: "${p.pattern}" (${p.context}) [${p.sessionCount} sessions]`);
      }
      lines.push('');
    }

    // Add improvement summary
    const summary = this.getImprovementSummary();
    if (summary.sessionsAnalyzed >= 3) {
      lines.push('### Learning Progress');
      lines.push('');
      lines.push(`- Voice match improvement: ${summary.voiceMatchImprovement > 0 ? '+' : ''}${(summary.voiceMatchImprovement * 100).toFixed(1)}%`);
      lines.push(`- Style drift reduction: ${summary.driftReduction > 0 ? '+' : ''}${(summary.driftReduction * 100).toFixed(1)}%`);
      lines.push(`- Sessions analyzed: ${summary.sessionsAnalyzed}`);

      if (summary.topImprovementAreas.length > 0) {
        lines.push(`- Improved areas: ${summary.topImprovementAreas.join(', ')}`);
      }
      if (summary.areasNeedingWork.length > 0) {
        lines.push(`- Areas needing attention: ${summary.areasNeedingWork.join(', ')}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalSessions: number;
    sessionSnapshots: number;
    consolidatedPatterns: number;
    averageVoiceMatch: number;
    averageDrift: number;
    daysSinceFirstSession: number;
  } {
    const sessions = this.state.sessions;
    const now = Date.now();

    return {
      totalSessions: this.state.totalSessionsRecorded,
      sessionSnapshots: sessions.length,
      consolidatedPatterns: this.state.consolidatedPatterns.length,
      averageVoiceMatch: sessions.length > 0
        ? this.average(sessions.map(s => s.voiceMatchAccuracy))
        : 0,
      averageDrift: sessions.length > 0
        ? this.average(sessions.map(s => s.driftMetrics.averageDrift))
        : 0,
      daysSinceFirstSession: this.state.firstSessionTimestamp > 0
        ? Math.floor((now - this.state.firstSessionTimestamp) / (24 * 60 * 60 * 1000))
        : 0,
    };
  }

  /**
   * Compare two sessions
   */
  compareSessions(sessionId1: string, sessionId2: string): {
    voiceMatchChange: number;
    driftChange: number;
    newPatterns: string[];
    resolvedIssues: IssueType[];
    newIssues: IssueType[];
  } | null {
    const session1 = this.getSession(sessionId1);
    const session2 = this.getSession(sessionId2);

    if (!session1 || !session2) {
      return null;
    }

    // Calculate changes
    const voiceMatchChange = session2.voiceMatchAccuracy - session1.voiceMatchAccuracy;
    const driftChange = session2.driftMetrics.averageDrift - session1.driftMetrics.averageDrift;

    // Find new patterns in session2
    const patterns1 = new Set([
      ...session1.discoveredPatterns.consistent.map(p => p.pattern),
      ...session1.discoveredPatterns.anti.map(p => p.pattern),
      ...session1.discoveredPatterns.positive.map(p => p.pattern),
    ]);

    const newPatterns = [
      ...session2.discoveredPatterns.consistent.map(p => p.pattern),
      ...session2.discoveredPatterns.anti.map(p => p.pattern),
      ...session2.discoveredPatterns.positive.map(p => p.pattern),
    ].filter(p => !patterns1.has(p));

    // Find issue changes
    const issues1 = Object.entries(session1.stats.issuesByType)
      .filter(([, count]) => count > 0)
      .map(([type]) => type as IssueType);
    const issues2 = Object.entries(session2.stats.issuesByType)
      .filter(([, count]) => count > 0)
      .map(([type]) => type as IssueType);

    const resolvedIssues = issues1.filter(i => !issues2.includes(i));
    const newIssues = issues2.filter(i => !issues1.includes(i));

    return {
      voiceMatchChange,
      driftChange,
      newPatterns,
      resolvedIssues,
      newIssues,
    };
  }

  /**
   * Save state to disk
   */
  async save(): Promise<void> {
    const feedbackDir = path.join(this.storagePath, 'feedback');
    await fs.mkdir(feedbackDir, { recursive: true });

    const statePath = path.join(feedbackDir, 'cross-session-state.json');
    await fs.writeFile(
      statePath,
      JSON.stringify(this.state, null, 2),
      'utf-8'
    );
  }

  /**
   * Load state from disk
   */
  async load(): Promise<void> {
    const statePath = path.join(this.storagePath, 'feedback', 'cross-session-state.json');

    try {
      const content = await fs.readFile(statePath, 'utf-8');
      this.state = JSON.parse(content) as CrossSessionState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist - start fresh
      this.state = this.createEmptyState();
    }
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.state = this.createEmptyState();
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createEmptyState(): CrossSessionState {
    return {
      sessions: [],
      consolidatedPatterns: [],
      trends: {
        voiceMatchTrend: [],
        driftTrend: [],
        patternDiscoveryTrend: [],
        issueTypeTrends: {
          word_choice: [],
          sentence_structure: [],
          tone: [],
          argument_style: [],
          citation_style: [],
          transition: [],
          other: [],
        },
        improvementScore: 0,
        satisfactionTrends: {
          soundsLikeMeTrend: [],
          qualitySatisfactionTrend: [],
          wouldUseAsIsTrend: [],
        },
      },
      totalSessionsRecorded: 0,
      firstSessionTimestamp: 0,
      lastUpdated: 0,
    };
  }

  private consolidatePatterns(): void {
    // Build pattern frequency maps across sessions
    const consistentMap = new Map<string, {
      replacement: string;
      sessions: Set<string>;
      firstSeen: { session: string; timestamp: number };
      lastSeen: { session: string; timestamp: number };
      totalFrequency: number;
      confidences: number[];
    }>();

    const antiMap = new Map<string, {
      reasons: string[];
      sessions: Set<string>;
      firstSeen: { session: string; timestamp: number };
      lastSeen: { session: string; timestamp: number };
      totalFrequency: number;
    }>();

    const positiveMap = new Map<string, {
      contexts: string[];
      sessions: Set<string>;
      firstSeen: { session: string; timestamp: number };
      lastSeen: { session: string; timestamp: number };
      totalFrequency: number;
    }>();

    // Process all sessions
    for (const session of this.state.sessions) {
      // Process consistent patterns
      for (const p of session.discoveredPatterns.consistent) {
        const existing = consistentMap.get(p.pattern);
        if (existing) {
          existing.sessions.add(session.sessionId);
          existing.lastSeen = { session: session.sessionId, timestamp: session.timestamp };
          existing.totalFrequency += p.frequency;
          existing.confidences.push(p.confidence);
        } else {
          consistentMap.set(p.pattern, {
            replacement: p.replacement,
            sessions: new Set([session.sessionId]),
            firstSeen: { session: session.sessionId, timestamp: session.timestamp },
            lastSeen: { session: session.sessionId, timestamp: session.timestamp },
            totalFrequency: p.frequency,
            confidences: [p.confidence],
          });
        }
      }

      // Process anti patterns
      for (const p of session.discoveredPatterns.anti) {
        const existing = antiMap.get(p.pattern);
        if (existing) {
          existing.sessions.add(session.sessionId);
          existing.lastSeen = { session: session.sessionId, timestamp: session.timestamp };
          existing.totalFrequency += p.frequency;
          if (!existing.reasons.includes(p.reason)) {
            existing.reasons.push(p.reason);
          }
        } else {
          antiMap.set(p.pattern, {
            reasons: [p.reason],
            sessions: new Set([session.sessionId]),
            firstSeen: { session: session.sessionId, timestamp: session.timestamp },
            lastSeen: { session: session.sessionId, timestamp: session.timestamp },
            totalFrequency: p.frequency,
          });
        }
      }

      // Process positive patterns
      for (const p of session.discoveredPatterns.positive) {
        const existing = positiveMap.get(p.pattern);
        if (existing) {
          existing.sessions.add(session.sessionId);
          existing.lastSeen = { session: session.sessionId, timestamp: session.timestamp };
          existing.totalFrequency += p.frequency;
          if (!existing.contexts.includes(p.context)) {
            existing.contexts.push(p.context);
          }
        } else {
          positiveMap.set(p.pattern, {
            contexts: [p.context],
            sessions: new Set([session.sessionId]),
            firstSeen: { session: session.sessionId, timestamp: session.timestamp },
            lastSeen: { session: session.sessionId, timestamp: session.timestamp },
            totalFrequency: p.frequency,
          });
        }
      }
    }

    // Convert to consolidated patterns
    const consolidated: ConsolidatedPattern[] = [];

    for (const [pattern, data] of Array.from(consistentMap.entries())) {
      if (data.sessions.size >= this.patternConsolidationThreshold) {
        const avgConfidence = this.average(data.confidences);
        // Cross-session confidence boosts the pattern
        const consolidatedConfidence = Math.min(1, avgConfidence * (1 + (data.sessions.size - 1) * 0.1));

        consolidated.push({
          pattern,
          replacement: data.replacement,
          type: 'consistent',
          sessionCount: data.sessions.size,
          totalFrequency: data.totalFrequency,
          firstSeenSession: data.firstSeen.session,
          firstSeenTimestamp: data.firstSeen.timestamp,
          lastSeenSession: data.lastSeen.session,
          lastSeenTimestamp: data.lastSeen.timestamp,
          consolidatedConfidence,
        });
      }
    }

    for (const [pattern, data] of Array.from(antiMap.entries())) {
      if (data.sessions.size >= this.patternConsolidationThreshold) {
        consolidated.push({
          pattern,
          reason: data.reasons.join('; '),
          type: 'anti',
          sessionCount: data.sessions.size,
          totalFrequency: data.totalFrequency,
          firstSeenSession: data.firstSeen.session,
          firstSeenTimestamp: data.firstSeen.timestamp,
          lastSeenSession: data.lastSeen.session,
          lastSeenTimestamp: data.lastSeen.timestamp,
          consolidatedConfidence: Math.min(1, 0.5 + (data.sessions.size * 0.1)),
        });
      }
    }

    for (const [pattern, data] of Array.from(positiveMap.entries())) {
      if (data.sessions.size >= this.patternConsolidationThreshold) {
        consolidated.push({
          pattern,
          context: data.contexts.join('; '),
          type: 'positive',
          sessionCount: data.sessions.size,
          totalFrequency: data.totalFrequency,
          firstSeenSession: data.firstSeen.session,
          firstSeenTimestamp: data.firstSeen.timestamp,
          lastSeenSession: data.lastSeen.session,
          lastSeenTimestamp: data.lastSeen.timestamp,
          consolidatedConfidence: Math.min(1, 0.5 + (data.sessions.size * 0.1)),
        });
      }
    }

    this.state.consolidatedPatterns = consolidated;
  }

  private updateTrends(): void {
    const sessions = this.state.sessions;

    // Update voice match trend
    this.state.trends.voiceMatchTrend = sessions.map(s => s.voiceMatchAccuracy);

    // Update drift trend
    this.state.trends.driftTrend = sessions.map(s => s.driftMetrics.averageDrift);

    // Update pattern discovery trend
    this.state.trends.patternDiscoveryTrend = sessions.map(s =>
      s.discoveredPatterns.consistent.length +
      s.discoveredPatterns.anti.length +
      s.discoveredPatterns.positive.length
    );

    // Update issue type trends
    const issueTypes: IssueType[] = [
      'word_choice', 'sentence_structure', 'tone',
      'argument_style', 'citation_style', 'transition', 'other'
    ];

    for (const issueType of issueTypes) {
      this.state.trends.issueTypeTrends[issueType] = sessions.map(
        s => s.stats.issuesByType[issueType] ?? 0
      );
    }

    // Update satisfaction trends (PHASE-3-002)
    this.state.trends.satisfactionTrends = {
      soundsLikeMeTrend: sessions.map(s =>
        s.satisfactionMetrics?.avgSoundsLikeMeScore ?? 0
      ),
      qualitySatisfactionTrend: sessions.map(s =>
        s.satisfactionMetrics?.avgQualitySatisfactionScore ?? 0
      ),
      wouldUseAsIsTrend: sessions.map(s =>
        s.satisfactionMetrics?.wouldUseAsIsRatio ?? 0
      ),
    };

    // Calculate improvement score
    this.state.trends.improvementScore = this.calculateImprovementScore();
  }

  private calculateImprovementScore(): number {
    const sessions = this.state.sessions;
    if (sessions.length < 3) return 0;

    const midpoint = Math.floor(sessions.length / 2);

    // Voice match improvement (weight: 0.4)
    const firstHalfVoice = this.average(sessions.slice(0, midpoint).map(s => s.voiceMatchAccuracy));
    const secondHalfVoice = this.average(sessions.slice(midpoint).map(s => s.voiceMatchAccuracy));
    const voiceImprovement = (secondHalfVoice - firstHalfVoice) / Math.max(0.1, 1 - firstHalfVoice);

    // Drift reduction (weight: 0.3)
    const firstHalfDrift = this.average(sessions.slice(0, midpoint).map(s => s.driftMetrics.averageDrift));
    const secondHalfDrift = this.average(sessions.slice(midpoint).map(s => s.driftMetrics.averageDrift));
    const driftImprovement = (firstHalfDrift - secondHalfDrift) / Math.max(0.1, firstHalfDrift);

    // Pattern consolidation (weight: 0.3)
    const patternScore = Math.min(1, this.state.consolidatedPatterns.length / 20);

    // Weighted score
    const score = (
      (Math.max(0, voiceImprovement) * 0.4) +
      (Math.max(0, driftImprovement) * 0.3) +
      (patternScore * 0.3)
    );

    return Math.min(1, Math.max(0, score));
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}
