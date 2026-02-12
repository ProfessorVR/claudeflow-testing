/**
 * ContrastiveLearner - Stores and learns from contrastive pairs (generated vs corrected)
 * Enables pattern recognition from user corrections for style improvement
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { PatternDiff, PatternCategory } from './incremental-style-updater.js';

/**
 * A contrastive pair of generated and corrected text
 */
export interface ContrastivePair {
  id: string;
  generated: string;
  corrected: string;

  /** Pattern differences extracted from this pair */
  differences: PatternDiff[];

  /** Stylistic changes identified */
  stylisticChanges: string[];

  /** Content changes identified */
  contentChanges: string[];

  /** Chapter this pair came from */
  chapterId: number;

  /** Paragraph index within the chapter */
  paragraphIndex: number;

  /** When this pair was captured */
  timestamp: number;

  /** How important this pair is for learning (0-1) */
  weight: number;
}

/**
 * A consistent pattern that users regularly correct
 */
export interface ConsistentPattern {
  pattern: string;
  replacement: string;
  frequency: number;
  confidence: number;
}

/**
 * An anti-pattern (something to avoid)
 */
export interface AntiPattern {
  pattern: string;
  reason: string;
  frequency: number;
}

/**
 * A positive pattern (something to do)
 */
export interface PositivePattern {
  pattern: string;
  context: string;
  frequency: number;
}

/**
 * ContrastiveLearner class for learning from generated vs corrected text pairs
 */
export class ContrastiveLearner {
  private pairs: ContrastivePair[];
  private storagePath: string;
  private maxPairs: number = 500;
  private recencyDecayFactor: number = 0.95;  // Weight decay per day

  constructor(storagePath: string) {
    this.pairs = [];
    this.storagePath = storagePath;
  }

  /**
   * Add a new contrastive pair
   * @returns Pair ID
   */
  addPair(
    generated: string,
    corrected: string,
    metadata: { chapterId: number; paragraphIndex: number }
  ): string {
    const id = uuidv4();

    // Extract differences
    const differences = this.extractDifferences(generated, corrected);

    // Categorize changes
    const { stylisticChanges, contentChanges } = this.categorizeChanges(generated, corrected);

    // Calculate initial weight based on correction significance
    const weight = this.calculateWeight(generated, corrected, differences);

    const pair: ContrastivePair = {
      id,
      generated,
      corrected,
      differences,
      stylisticChanges,
      contentChanges,
      chapterId: metadata.chapterId,
      paragraphIndex: metadata.paragraphIndex,
      timestamp: Date.now(),
      weight,
    };

    this.pairs.push(pair);

    // Trim old pairs if needed
    if (this.pairs.length > this.maxPairs) {
      this.trimOldPairs();
    }

    return id;
  }

  /**
   * Get a specific pair by ID
   */
  getPair(id: string): ContrastivePair | undefined {
    return this.pairs.find(p => p.id === id);
  }

  /**
   * Get all pairs for a chapter
   */
  getPairsForChapter(chapterId: number): ContrastivePair[] {
    return this.pairs.filter(p => p.chapterId === chapterId);
  }

  /**
   * Get patterns that users consistently change
   */
  getConsistentPatterns(): ConsistentPattern[] {
    const patternCounts = new Map<string, { replacement: string; count: number; weights: number[] }>();

    for (const pair of this.pairs) {
      for (const diff of pair.differences) {
        if (diff.type === 'modified' && diff.original && diff.corrected) {
          const key = diff.original.toLowerCase();
          const existing = patternCounts.get(key);

          if (existing) {
            // Check if replacement is consistent
            if (existing.replacement.toLowerCase() === diff.corrected.toLowerCase()) {
              existing.count++;
              existing.weights.push(pair.weight);
            }
          } else {
            patternCounts.set(key, {
              replacement: diff.corrected,
              count: 1,
              weights: [pair.weight],
            });
          }
        }
      }
    }

    // Convert to consistent patterns
    const patterns: ConsistentPattern[] = [];

    for (const [pattern, data] of patternCounts) {
      if (data.count >= 2) {
        const avgWeight = data.weights.reduce((a, b) => a + b, 0) / data.weights.length;
        const confidence = Math.min(1, (data.count / 10) * avgWeight);

        patterns.push({
          pattern,
          replacement: data.replacement,
          frequency: data.count,
          confidence,
        });
      }
    }

    // Sort by frequency * confidence
    return patterns.sort((a, b) => (b.frequency * b.confidence) - (a.frequency * a.confidence));
  }

  /**
   * Find pairs similar to a given text
   */
  findSimilarPairs(text: string, limit: number = 5): ContrastivePair[] {
    // Calculate similarity scores for all pairs
    const scored = this.pairs.map(pair => ({
      pair,
      score: this.calculateTextSimilarity(text, pair.generated),
    }));

    // Sort by similarity and return top matches
    return scored
      .filter(s => s.score > 0.3)  // Minimum similarity threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.pair);
  }

  /**
   * Generate anti-patterns (things to avoid)
   */
  getAntiPatterns(): AntiPattern[] {
    const antiPatterns = new Map<string, { reasons: string[]; frequency: number }>();

    for (const pair of this.pairs) {
      // Look for patterns that were consistently removed or replaced
      for (const diff of pair.differences) {
        if (diff.type === 'removed' || (diff.type === 'modified' && diff.original)) {
          const pattern = diff.original.toLowerCase().trim();
          if (pattern.length >= 3) {  // Only meaningful patterns
            const existing = antiPatterns.get(pattern);
            const reason = this.inferRemovalReason(diff, pair);

            if (existing) {
              existing.frequency++;
              if (!existing.reasons.includes(reason)) {
                existing.reasons.push(reason);
              }
            } else {
              antiPatterns.set(pattern, { reasons: [reason], frequency: 1 });
            }
          }
        }
      }
    }

    // Convert to anti-patterns
    const patterns: AntiPattern[] = [];

    for (const [pattern, data] of antiPatterns) {
      if (data.frequency >= 2) {
        patterns.push({
          pattern,
          reason: data.reasons.join('; '),
          frequency: data.frequency,
        });
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate positive patterns (things to do)
   */
  getPositivePatterns(): PositivePattern[] {
    const positivePatterns = new Map<string, { contexts: string[]; frequency: number }>();

    for (const pair of this.pairs) {
      // Look for patterns that were consistently added
      for (const diff of pair.differences) {
        if (diff.type === 'added' && diff.corrected) {
          const pattern = diff.corrected.toLowerCase().trim();
          if (pattern.length >= 3) {
            const context = this.extractContext(diff, pair);
            const existing = positivePatterns.get(pattern);

            if (existing) {
              existing.frequency++;
              if (!existing.contexts.includes(context) && existing.contexts.length < 3) {
                existing.contexts.push(context);
              }
            } else {
              positivePatterns.set(pattern, { contexts: [context], frequency: 1 });
            }
          }
        }
      }

      // Also look at stylistic changes that were added
      for (const change of pair.stylisticChanges) {
        if (change.startsWith('Added:')) {
          const pattern = change.replace('Added:', '').trim().toLowerCase();
          const existing = positivePatterns.get(pattern);

          if (existing) {
            existing.frequency++;
          } else {
            positivePatterns.set(pattern, {
              contexts: ['stylistic improvement'],
              frequency: 1,
            });
          }
        }
      }
    }

    // Convert to positive patterns
    const patterns: PositivePattern[] = [];

    for (const [pattern, data] of positivePatterns) {
      if (data.frequency >= 2) {
        patterns.push({
          pattern,
          context: data.contexts.join('; '),
          frequency: data.frequency,
        });
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Build training prompt from contrastive pairs
   */
  buildTrainingPrompt(): string {
    const lines: string[] = [
      '## CONTRASTIVE LEARNING PATTERNS',
      '',
      'Learn from these user corrections to match their writing style:',
      '',
    ];

    // Add consistent patterns
    const consistentPatterns = this.getConsistentPatterns().slice(0, 15);
    if (consistentPatterns.length > 0) {
      lines.push('### Preferred Replacements');
      lines.push('When you see the left pattern, use the right instead:');
      lines.push('');
      for (const p of consistentPatterns) {
        lines.push(`- "${p.pattern}" -> "${p.replacement}" (confidence: ${(p.confidence * 100).toFixed(0)}%)`);
      }
      lines.push('');
    }

    // Add anti-patterns
    const antiPatterns = this.getAntiPatterns().slice(0, 10);
    if (antiPatterns.length > 0) {
      lines.push('### Patterns to Avoid');
      for (const p of antiPatterns) {
        lines.push(`- AVOID: "${p.pattern}" (${p.reason})`);
      }
      lines.push('');
    }

    // Add positive patterns
    const positivePatterns = this.getPositivePatterns().slice(0, 10);
    if (positivePatterns.length > 0) {
      lines.push('### Patterns to Include');
      for (const p of positivePatterns) {
        lines.push(`- USE: "${p.pattern}" (context: ${p.context})`);
      }
      lines.push('');
    }

    // Add example corrections
    const recentPairs = this.getRecentHighWeightPairs(5);
    if (recentPairs.length > 0) {
      lines.push('### Example Corrections');
      lines.push('');
      for (const pair of recentPairs) {
        lines.push('**Before:**');
        lines.push(`> ${this.truncate(pair.generated, 200)}`);
        lines.push('');
        lines.push('**After (corrected):**');
        lines.push(`> ${this.truncate(pair.corrected, 200)}`);
        lines.push('');
        if (pair.stylisticChanges.length > 0) {
          lines.push(`*Changes: ${pair.stylisticChanges.slice(0, 3).join(', ')}*`);
        }
        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Get total number of pairs
   */
  get count(): number {
    return this.pairs.length;
  }

  /**
   * Check if any pairs exist
   */
  get isEmpty(): boolean {
    return this.pairs.length === 0;
  }

  /**
   * Clear all pairs
   */
  clear(): void {
    this.pairs = [];
  }

  /**
   * Update weights based on recency
   */
  updateWeights(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (const pair of this.pairs) {
      const ageInDays = (now - pair.timestamp) / dayMs;
      pair.weight *= Math.pow(this.recencyDecayFactor, ageInDays);
    }
  }

  /**
   * Save pairs to disk
   */
  async save(): Promise<void> {
    const feedbackDir = path.join(this.storagePath, 'feedback');
    await fs.mkdir(feedbackDir, { recursive: true });

    const pairsPath = path.join(feedbackDir, 'contrastive-pairs.json');
    await fs.writeFile(
      pairsPath,
      JSON.stringify(this.pairs, null, 2),
      'utf-8'
    );
  }

  /**
   * Load pairs from disk
   */
  async load(): Promise<void> {
    const pairsPath = path.join(this.storagePath, 'feedback', 'contrastive-pairs.json');

    try {
      const content = await fs.readFile(pairsPath, 'utf-8');
      this.pairs = JSON.parse(content) as ContrastivePair[];

      // Update weights based on recency
      this.updateWeights();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist - start fresh (expected on first run)
    }
  }

  /**
   * Get all pair IDs
   */
  getAllPairIds(): string[] {
    return this.pairs.map(p => p.id);
  }

  /**
   * Remove a pair by ID
   */
  removePair(id: string): boolean {
    const index = this.pairs.findIndex(p => p.id === id);
    if (index >= 0) {
      this.pairs.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get recent high-weight pairs
   */
  getRecentHighWeightPairs(limit: number = 5): ContrastivePair[] {
    return [...this.pairs]
      .sort((a, b) => (b.weight * b.timestamp) - (a.weight * a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get statistics about the stored pairs
   */
  getStats(): {
    totalPairs: number;
    averageWeight: number;
    chaptersRepresented: number;
    oldestPairAge: number;
    newestPairAge: number;
    totalDifferences: number;
  } {
    if (this.pairs.length === 0) {
      return {
        totalPairs: 0,
        averageWeight: 0,
        chaptersRepresented: 0,
        oldestPairAge: 0,
        newestPairAge: 0,
        totalDifferences: 0,
      };
    }

    const now = Date.now();
    const chapters = new Set(this.pairs.map(p => p.chapterId));
    const timestamps = this.pairs.map(p => p.timestamp);
    const totalDifferences = this.pairs.reduce((sum, p) => sum + p.differences.length, 0);

    return {
      totalPairs: this.pairs.length,
      averageWeight: this.pairs.reduce((sum, p) => sum + p.weight, 0) / this.pairs.length,
      chaptersRepresented: chapters.size,
      oldestPairAge: now - Math.min(...timestamps),
      newestPairAge: now - Math.max(...timestamps),
      totalDifferences,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractDifferences(generated: string, corrected: string): PatternDiff[] {
    const differences: PatternDiff[] = [];

    // Word-level differences
    const genWords = this.tokenize(generated);
    const corrWords = this.tokenize(corrected);

    // Find removed words
    for (const word of genWords) {
      if (!corrWords.includes(word) && word.length > 2) {
        differences.push({
          type: 'removed',
          category: 'word',
          original: word,
          corrected: '',
          frequency: 1,
          weight: 0.3,
        });
      }
    }

    // Find added words
    for (const word of corrWords) {
      if (!genWords.includes(word) && word.length > 2) {
        differences.push({
          type: 'added',
          category: 'word',
          original: '',
          corrected: word,
          frequency: 1,
          weight: 0.3,
        });
      }
    }

    // Find phrase changes (3-grams)
    const genPhrases = this.extractNgrams(generated, 3);
    const corrPhrases = this.extractNgrams(corrected, 3);

    for (const phrase of genPhrases) {
      if (!corrPhrases.includes(phrase)) {
        // Check if there's a similar phrase in corrected
        const similar = this.findSimilarPhrase(phrase, corrPhrases);
        if (similar) {
          differences.push({
            type: 'modified',
            category: 'phrase',
            original: phrase,
            corrected: similar,
            frequency: 1,
            weight: 0.5,
          });
        }
      }
    }

    // Transition changes
    const genTransitions = this.extractTransitions(generated);
    const corrTransitions = this.extractTransitions(corrected);

    for (const trans of genTransitions) {
      if (!corrTransitions.includes(trans)) {
        differences.push({
          type: 'removed',
          category: 'transition',
          original: trans,
          corrected: '',
          frequency: 1,
          weight: 0.4,
        });
      }
    }

    for (const trans of corrTransitions) {
      if (!genTransitions.includes(trans)) {
        differences.push({
          type: 'added',
          category: 'transition',
          original: '',
          corrected: trans,
          frequency: 1,
          weight: 0.4,
        });
      }
    }

    return differences;
  }

  private categorizeChanges(
    generated: string,
    corrected: string
  ): { stylisticChanges: string[]; contentChanges: string[] } {
    const stylisticChanges: string[] = [];
    const contentChanges: string[] = [];

    // Check sentence structure changes
    const genSentences = generated.match(/[^.!?]+[.!?]+/g) ?? [];
    const corrSentences = corrected.match(/[^.!?]+[.!?]+/g) ?? [];

    if (genSentences.length !== corrSentences.length) {
      stylisticChanges.push(
        `Sentence count: ${genSentences.length} -> ${corrSentences.length}`
      );
    }

    // Check average sentence length
    const avgGenLen = this.avgSentenceLength(genSentences);
    const avgCorrLen = this.avgSentenceLength(corrSentences);

    if (Math.abs(avgGenLen - avgCorrLen) > 5) {
      stylisticChanges.push(
        `Sentence length: ${avgGenLen.toFixed(0)} -> ${avgCorrLen.toFixed(0)} words avg`
      );
    }

    // Check for transition additions/removals
    const genTrans = this.extractTransitions(generated);
    const corrTrans = this.extractTransitions(corrected);

    const addedTrans = corrTrans.filter(t => !genTrans.includes(t));
    const removedTrans = genTrans.filter(t => !corrTrans.includes(t));

    for (const t of addedTrans) {
      stylisticChanges.push(`Added: "${t}"`);
    }
    for (const t of removedTrans) {
      stylisticChanges.push(`Removed: "${t}"`);
    }

    // Check for key term changes (content-related)
    const genKeyTerms = this.extractKeyTerms(generated);
    const corrKeyTerms = this.extractKeyTerms(corrected);

    const addedTerms = [...corrKeyTerms].filter(t => !genKeyTerms.has(t));
    const removedTerms = [...genKeyTerms].filter(t => !corrKeyTerms.has(t));

    for (const term of addedTerms.slice(0, 5)) {
      contentChanges.push(`Added concept: "${term}"`);
    }
    for (const term of removedTerms.slice(0, 5)) {
      contentChanges.push(`Removed concept: "${term}"`);
    }

    // Check for citation changes
    const genCitations = (generated.match(/\([A-Z][a-z]+.*?\d{4}\)/g) ?? []).length;
    const corrCitations = (corrected.match(/\([A-Z][a-z]+.*?\d{4}\)/g) ?? []).length;

    if (genCitations !== corrCitations) {
      contentChanges.push(`Citations: ${genCitations} -> ${corrCitations}`);
    }

    return { stylisticChanges, contentChanges };
  }

  private calculateWeight(
    generated: string,
    corrected: string,
    differences: PatternDiff[]
  ): number {
    // Weight based on:
    // 1. Number of meaningful differences
    // 2. Types of changes
    // 3. Text lengths

    let weight = 0.5;  // Base weight

    // More differences = more learning opportunity
    weight += Math.min(0.2, differences.length * 0.02);

    // Phrase and structure changes are more valuable
    const phraseChanges = differences.filter(d => d.category === 'phrase').length;
    const structureChanges = differences.filter(d => d.category === 'structure').length;
    weight += Math.min(0.2, (phraseChanges + structureChanges) * 0.05);

    // Transition changes indicate style preferences
    const transitionChanges = differences.filter(d => d.category === 'transition').length;
    weight += Math.min(0.1, transitionChanges * 0.03);

    return Math.min(1, weight);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.tokenize(text1));
    const words2 = new Set(this.tokenize(text2));

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return union > 0 ? intersection / union : 0;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private extractNgrams(text: string, n: number): string[] {
    const words = text.split(/\s+/);
    const ngrams: string[] = [];

    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ').toLowerCase();
      if (/[a-zA-Z]{3,}/.test(ngram)) {
        ngrams.push(ngram);
      }
    }

    return ngrams;
  }

  private extractTransitions(text: string): string[] {
    const transitionRegex = /\b(However|Therefore|Thus|Moreover|Furthermore|Nevertheless|Consequently|Additionally|In contrast|On the other hand|Similarly|Likewise|Indeed|In fact|For example|For instance|Specifically|In particular|First|Second|Third|Finally|In conclusion|To summarize|Overall)\b/gi;
    const matches = text.match(transitionRegex) ?? [];
    return matches.map(m => m.toLowerCase());
  }

  private extractKeyTerms(text: string): Set<string> {
    const words = text.toLowerCase().match(/\b[a-z]{5,}\b/g) ?? [];
    const stopWords = new Set([
      'these', 'those', 'which', 'where', 'about', 'there', 'their',
      'would', 'could', 'should', 'being', 'other', 'after', 'before',
      'through', 'during', 'between', 'under', 'while', 'because',
    ]);
    return new Set(words.filter(w => !stopWords.has(w)));
  }

  private avgSentenceLength(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    return totalWords / sentences.length;
  }

  private findSimilarPhrase(phrase: string, phrases: string[]): string | null {
    const words = phrase.split(/\s+/);

    for (const candidate of phrases) {
      const candWords = candidate.split(/\s+/);

      // Check for overlap
      const overlap = words.filter(w => candWords.includes(w)).length;
      if (overlap >= Math.ceil(words.length / 2)) {
        return candidate;
      }
    }

    return null;
  }

  private inferRemovalReason(diff: PatternDiff, _pair: ContrastivePair): string {
    const original = diff.original.toLowerCase();

    // Check for common reasons
    if (/\b(very|really|quite|rather|somewhat)\b/.test(original)) {
      return 'removes unnecessary intensifier';
    }

    if (/\b(basically|essentially|actually)\b/.test(original)) {
      return 'removes filler word';
    }

    if (/\b(obviously|clearly|certainly)\b/.test(original)) {
      return 'removes overconfident language';
    }

    if (/\b(I think|I believe|in my opinion)\b/.test(original)) {
      return 'removes first-person opinion markers';
    }

    return 'style improvement';
  }

  private extractContext(diff: PatternDiff, pair: ContrastivePair): string {
    const corrected = diff.corrected;

    // Find where this appears in the corrected text
    const index = pair.corrected.toLowerCase().indexOf(corrected.toLowerCase());
    if (index === -1) return 'general usage';

    // Extract surrounding context
    const start = Math.max(0, index - 30);
    const end = Math.min(pair.corrected.length, index + corrected.length + 30);
    const context = pair.corrected.substring(start, end).trim();

    // Determine context type
    if (index < 50) return 'paragraph opening';
    if (index > pair.corrected.length - 50) return 'paragraph closing';
    if (/^[A-Z]/.test(context)) return 'sentence start';

    return 'mid-sentence';
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private trimOldPairs(): void {
    // Sort by weight * recency and keep top maxPairs
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    this.pairs.sort((a, b) => {
      const aScore = a.weight * Math.pow(this.recencyDecayFactor, (now - a.timestamp) / dayMs);
      const bScore = b.weight * Math.pow(this.recencyDecayFactor, (now - b.timestamp) / dayMs);
      return bScore - aScore;
    });

    this.pairs = this.pairs.slice(0, this.maxPairs);
  }
}
