/**
 * ArgumentThreadTracker - Track arguments across chapters for consistent development
 *
 * Implements cross-chapter argument threading for the PhD Pipeline to ensure
 * arguments are introduced, developed, and concluded consistently.
 *
 * Responsibilities:
 * - Track argument threads from introduction through conclusion
 * - Detect abandoned or unresolved arguments
 * - Generate prompts for agents about thread status
 * - Validate thread consistency across the dissertation
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Represents a single argument thread tracked across chapters
 */
export interface ArgumentThread {
  /** Unique thread identifier */
  id: string;
  /** The core argument statement */
  statement: string;
  /** Current status of the thread */
  status: 'introduced' | 'developing' | 'concluded' | 'abandoned';

  /** History of thread development across chapters */
  history: Array<{
    chapterId: number;
    action: 'introduced' | 'developed' | 'refined' | 'concluded' | 'referenced';
    content: string;
    timestamp: number;
  }>;

  /** IDs of related argument threads */
  relatedThreads: string[];
  /** Evidence supporting this argument */
  supportingEvidence: string[];
  /** Counterarguments or limitations */
  counterarguments: string[];

  /** Chapter where this thread was first introduced */
  introducedInChapter: number;
  /** Chapter where this thread was concluded (if applicable) */
  concludedInChapter?: number;
  /** Last chapter where this thread was referenced */
  lastReferencedChapter: number;

  /** Importance level (1-5, 5 being central thesis) */
  importance: number;
  /** Tags for categorization */
  tags: string[];
}

/**
 * Result of thread validation
 */
export interface ValidationResult {
  /** Whether the thread passes validation */
  valid: boolean;
  /** Thread ID being validated */
  threadId: string;
  /** Type of issue found */
  issueType?: 'abandoned' | 'unresolved' | 'inconsistent' | 'orphaned' | 'contradiction';
  /** Human-readable message */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Chapters involved in the issue */
  affectedChapters: number[];
}

/**
 * Similarity match result for finding related threads
 */
interface SimilarityMatch {
  threadId: string;
  similarity: number;
}

/**
 * ArgumentThreadTracker maintains and validates argument threads
 */
export class ArgumentThreadTracker {
  /** Map of thread ID to ArgumentThread */
  private threads: Map<string, ArgumentThread>;

  /** Index for fast lookup by chapter */
  private chapterIndex: Map<number, Set<string>>;

  /** Threshold for considering threads similar */
  private static readonly SIMILARITY_THRESHOLD = 0.6;

  /** Chapters gap that marks a thread as potentially abandoned */
  private static readonly ABANDONMENT_THRESHOLD = 2;

  constructor() {
    this.threads = new Map();
    this.chapterIndex = new Map();
  }

  /**
   * Introduce a new argument thread
   *
   * @param chapterId - Chapter where the argument is introduced
   * @param statement - The core argument statement
   * @param importance - Importance level (1-5)
   * @param tags - Optional tags for categorization
   * @returns Thread ID of the new thread
   */
  introduceThread(
    chapterId: number,
    statement: string,
    importance: number = 3,
    tags: string[] = []
  ): string {
    const threadId = `thread_${uuidv4().substring(0, 8)}`;
    const now = Date.now();

    // Check for similar existing threads
    const similarThreads = this.findSimilarThreads(statement);
    const relatedThreads = similarThreads
      .filter(m => m.similarity > ArgumentThreadTracker.SIMILARITY_THRESHOLD)
      .map(m => m.threadId);

    const thread: ArgumentThread = {
      id: threadId,
      statement,
      status: 'introduced',
      history: [{
        chapterId,
        action: 'introduced',
        content: statement,
        timestamp: now,
      }],
      relatedThreads,
      supportingEvidence: [],
      counterarguments: [],
      introducedInChapter: chapterId,
      lastReferencedChapter: chapterId,
      importance,
      tags,
    };

    this.threads.set(threadId, thread);
    this.addToChapterIndex(chapterId, threadId);

    // Update related threads to reference this one
    for (const relatedId of relatedThreads) {
      const related = this.threads.get(relatedId);
      if (related && !related.relatedThreads.includes(threadId)) {
        related.relatedThreads.push(threadId);
      }
    }

    return threadId;
  }

  /**
   * Develop an existing thread with new content
   *
   * @param chapterId - Chapter where the development occurs
   * @param threadId - ID of the thread to develop
   * @param development - New development content
   */
  developThread(chapterId: number, threadId: string, development: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    if (thread.status === 'concluded') {
      throw new Error(`Cannot develop concluded thread ${threadId}`);
    }

    thread.status = 'developing';
    thread.lastReferencedChapter = chapterId;
    thread.history.push({
      chapterId,
      action: 'developed',
      content: development,
      timestamp: Date.now(),
    });

    this.addToChapterIndex(chapterId, threadId);
  }

  /**
   * Refine a thread with updated understanding
   *
   * @param chapterId - Chapter where the refinement occurs
   * @param threadId - ID of the thread to refine
   * @param refinement - Refinement content
   */
  refineThread(chapterId: number, threadId: string, refinement: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    thread.lastReferencedChapter = chapterId;
    thread.history.push({
      chapterId,
      action: 'refined',
      content: refinement,
      timestamp: Date.now(),
    });

    this.addToChapterIndex(chapterId, threadId);
  }

  /**
   * Conclude a thread with final resolution
   *
   * @param chapterId - Chapter where the conclusion occurs
   * @param threadId - ID of the thread to conclude
   * @param conclusion - Conclusion content
   */
  concludeThread(chapterId: number, threadId: string, conclusion: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    thread.status = 'concluded';
    thread.concludedInChapter = chapterId;
    thread.lastReferencedChapter = chapterId;
    thread.history.push({
      chapterId,
      action: 'concluded',
      content: conclusion,
      timestamp: Date.now(),
    });

    this.addToChapterIndex(chapterId, threadId);
  }

  /**
   * Reference a thread without changing it
   *
   * @param chapterId - Chapter where the reference occurs
   * @param threadId - ID of the thread being referenced
   * @param context - Reference context
   */
  referenceThread(chapterId: number, threadId: string, context: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    thread.lastReferencedChapter = chapterId;
    thread.history.push({
      chapterId,
      action: 'referenced',
      content: context,
      timestamp: Date.now(),
    });

    this.addToChapterIndex(chapterId, threadId);
  }

  /**
   * Add supporting evidence to a thread
   *
   * @param threadId - Thread ID
   * @param evidence - Evidence citation or description
   */
  addEvidence(threadId: string, evidence: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    if (!thread.supportingEvidence.includes(evidence)) {
      thread.supportingEvidence.push(evidence);
    }
  }

  /**
   * Add a counterargument to a thread
   *
   * @param threadId - Thread ID
   * @param counterargument - Counterargument description
   */
  addCounterargument(threadId: string, counterargument: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    if (!thread.counterarguments.includes(counterargument)) {
      thread.counterarguments.push(counterargument);
    }
  }

  /**
   * Get all active (not concluded or abandoned) threads
   */
  getActiveThreads(): ArgumentThread[] {
    return Array.from(this.threads.values())
      .filter(t => t.status === 'introduced' || t.status === 'developing');
  }

  /**
   * Get threads that should have been concluded but weren't
   */
  getUnresolvedThreads(): ArgumentThread[] {
    return Array.from(this.threads.values())
      .filter(t => t.status !== 'concluded' && t.status !== 'abandoned')
      .filter(t => t.importance >= 3); // Only important threads
  }

  /**
   * Get threads that appear abandoned (not referenced for too long)
   *
   * @param currentChapter - Current chapter number for comparison
   */
  getAbandonedThreads(currentChapter?: number): ArgumentThread[] {
    const refChapter = currentChapter || this.getMaxChapter();

    return Array.from(this.threads.values())
      .filter(t => t.status !== 'concluded')
      .filter(t => {
        const gap = refChapter - t.lastReferencedChapter;
        return gap > ArgumentThreadTracker.ABANDONMENT_THRESHOLD;
      });
  }

  /**
   * Get all threads for a specific chapter
   */
  getThreadsForChapter(chapterId: number): ArgumentThread[] {
    const threadIds = this.chapterIndex.get(chapterId);
    if (!threadIds) return [];

    return Array.from(threadIds)
      .map(id => this.threads.get(id))
      .filter((t): t is ArgumentThread => t !== undefined);
  }

  /**
   * Get a thread by ID
   */
  getThread(threadId: string): ArgumentThread | undefined {
    return this.threads.get(threadId);
  }

  /**
   * Build a prompt about thread status for writing agents
   *
   * @param forChapter - Chapter number the agent is writing
   * @returns Formatted prompt string
   */
  buildThreadStatusPrompt(forChapter: number): string {
    const sections: string[] = [];

    sections.push('## ARGUMENT THREAD STATUS');
    sections.push('');
    sections.push(`When writing Chapter ${forChapter}, be aware of the following argument threads:`);
    sections.push('');

    // Active threads that should continue
    const activeThreads = this.getActiveThreads()
      .filter(t => t.lastReferencedChapter < forChapter)
      .sort((a, b) => b.importance - a.importance);

    if (activeThreads.length > 0) {
      sections.push('### Active Threads (Consider Developing or Referencing)');
      sections.push('');
      for (const thread of activeThreads.slice(0, 10)) {
        sections.push(`**${thread.id}** [Importance: ${thread.importance}/5] - ${thread.status}`);
        sections.push(`> ${thread.statement.substring(0, 200)}`);
        sections.push(`Introduced: Ch.${thread.introducedInChapter}, Last referenced: Ch.${thread.lastReferencedChapter}`);
        if (thread.supportingEvidence.length > 0) {
          sections.push(`Evidence: ${thread.supportingEvidence.slice(0, 3).join('; ')}`);
        }
        sections.push('');
      }
    }

    // Threads that may be getting abandoned
    const potentiallyAbandoned = this.getAbandonedThreads(forChapter);
    if (potentiallyAbandoned.length > 0) {
      sections.push('### Threads at Risk of Abandonment (Consider Addressing)');
      sections.push('');
      for (const thread of potentiallyAbandoned.slice(0, 5)) {
        const gap = forChapter - thread.lastReferencedChapter;
        sections.push(`- **${thread.id}**: Not referenced for ${gap} chapters`);
        sections.push(`  Statement: ${thread.statement.substring(0, 150)}`);
        sections.push('');
      }
    }

    // Threads ready for conclusion (if this is a later chapter)
    const readyForConclusion = activeThreads
      .filter(t => t.importance >= 4)
      .filter(t => t.history.length >= 3);

    if (readyForConclusion.length > 0 && forChapter > 5) {
      sections.push('### Threads Ready for Conclusion');
      sections.push('');
      for (const thread of readyForConclusion.slice(0, 5)) {
        sections.push(`- **${thread.id}**: Developed across ${thread.history.length} chapters`);
        sections.push(`  May be ready for conclusion if appropriate to this chapter's content.`);
        sections.push('');
      }
    }

    // Related thread clusters
    const clusters = this.findThreadClusters();
    if (clusters.length > 0) {
      sections.push('### Related Thread Clusters');
      sections.push('');
      for (const cluster of clusters.slice(0, 3)) {
        const clusterThreads = cluster.map(id => this.threads.get(id)).filter(Boolean);
        if (clusterThreads.length >= 2) {
          sections.push(`Cluster: ${clusterThreads.map(t => t!.id).join(', ')}`);
          sections.push(`These threads are related and should be addressed consistently.`);
          sections.push('');
        }
      }
    }

    return sections.join('\n');
  }

  /**
   * Validate consistency of all threads
   */
  validateThreadConsistency(): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const thread of this.threads.values()) {
      // Check for abandoned threads
      if (thread.status !== 'concluded' && thread.status !== 'abandoned') {
        const maxChapter = this.getMaxChapter();
        const gap = maxChapter - thread.lastReferencedChapter;

        if (gap > ArgumentThreadTracker.ABANDONMENT_THRESHOLD) {
          results.push({
            valid: false,
            threadId: thread.id,
            issueType: 'abandoned',
            message: `Thread "${thread.statement.substring(0, 50)}..." has not been referenced for ${gap} chapters`,
            suggestion: `Consider developing or concluding this thread, or explicitly marking it as abandoned`,
            affectedChapters: [thread.lastReferencedChapter, maxChapter],
          });
        }
      }

      // Check for important unresolved threads
      if (thread.importance >= 4 && thread.status !== 'concluded') {
        results.push({
          valid: false,
          threadId: thread.id,
          issueType: 'unresolved',
          message: `High-importance thread "${thread.statement.substring(0, 50)}..." remains unresolved`,
          suggestion: `This thread should be concluded before the dissertation ends`,
          affectedChapters: [thread.introducedInChapter],
        });
      }

      // Check for inconsistent development
      const chaptersSeen = new Set<number>();
      for (const entry of thread.history) {
        if (chaptersSeen.has(entry.chapterId) && entry.action !== 'referenced') {
          // Multiple substantive actions in the same chapter might indicate inconsistency
          // This is a soft warning
        }
        chaptersSeen.add(entry.chapterId);
      }

      // Check for threads with counterarguments but no resolution
      if (thread.counterarguments.length > 0 && thread.status !== 'concluded') {
        results.push({
          valid: false,
          threadId: thread.id,
          issueType: 'inconsistent',
          message: `Thread has ${thread.counterarguments.length} counterargument(s) but no conclusion addressing them`,
          suggestion: `Address counterarguments when concluding this thread`,
          affectedChapters: Array.from(chaptersSeen),
        });
      }
    }

    return results;
  }

  /**
   * Mark a thread as abandoned
   *
   * @param threadId - Thread to abandon
   * @param reason - Reason for abandonment
   */
  abandonThread(threadId: string, reason: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    thread.status = 'abandoned';
    thread.history.push({
      chapterId: thread.lastReferencedChapter,
      action: 'referenced',
      content: `Abandoned: ${reason}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Save threads to disk
   *
   * @param filePath - Path to save to
   */
  async save(filePath: string): Promise<void> {
    const data = {
      threads: Array.from(this.threads.entries()),
      chapterIndex: Array.from(this.chapterIndex.entries()).map(
        ([k, v]) => [k, Array.from(v)]
      ),
      savedAt: Date.now(),
      version: 1,
    };

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load threads from disk
   *
   * @param filePath - Path to load from
   */
  async load(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.threads = new Map(data.threads);
      this.chapterIndex = new Map(
        data.chapterIndex.map(([k, v]: [number, string[]]) => [k, new Set(v)])
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, start fresh
        this.threads = new Map();
        this.chapterIndex = new Map();
      } else {
        throw error;
      }
    }
  }

  /**
   * Get all threads
   */
  getAllThreads(): ArgumentThread[] {
    return Array.from(this.threads.values());
  }

  /**
   * Get thread count
   */
  getThreadCount(): number {
    return this.threads.size;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Add a thread to the chapter index
   */
  private addToChapterIndex(chapterId: number, threadId: string): void {
    if (!this.chapterIndex.has(chapterId)) {
      this.chapterIndex.set(chapterId, new Set());
    }
    this.chapterIndex.get(chapterId)!.add(threadId);
  }

  /**
   * Find threads with similar statements
   */
  private findSimilarThreads(statement: string): SimilarityMatch[] {
    const matches: SimilarityMatch[] = [];
    const statementTokens = this.tokenize(statement);

    for (const thread of this.threads.values()) {
      const threadTokens = this.tokenize(thread.statement);
      const similarity = this.jaccardSimilarity(statementTokens, threadTokens);

      if (similarity > 0.3) { // Lower threshold for finding any related
        matches.push({
          threadId: thread.id,
          similarity,
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find clusters of related threads
   */
  private findThreadClusters(): string[][] {
    const clusters: string[][] = [];
    const assigned = new Set<string>();

    for (const thread of this.threads.values()) {
      if (assigned.has(thread.id)) continue;

      if (thread.relatedThreads.length > 0) {
        const cluster = [thread.id, ...thread.relatedThreads];
        cluster.forEach(id => assigned.add(id));
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Get the maximum chapter number referenced
   */
  private getMaxChapter(): number {
    let max = 0;
    for (const chapterId of this.chapterIndex.keys()) {
      if (chapterId > max) max = chapterId;
    }
    return max;
  }

  /**
   * Tokenize text for similarity comparison
   */
  private tokenize(text: string): Set<string> {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'we', 'our',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));

    return new Set(words);
  }

  /**
   * Calculate Jaccard similarity between two token sets
   */
  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 && set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }
}
