/**
 * IncrementalStyleUpdater - Learns from user corrections to improve style profiles
 * Extracts pattern differences and applies them incrementally to style profiles
 */

import type { StyleProfileManager } from '../../universal/style-profile.js';

/**
 * Type of pattern difference detected
 */
export type PatternDiffType = 'added' | 'removed' | 'modified';

/**
 * Category of pattern change
 */
export type PatternCategory = 'word' | 'phrase' | 'structure' | 'transition' | 'citation';

/**
 * A difference between original and corrected text patterns
 */
export interface PatternDiff {
  type: PatternDiffType;
  category: PatternCategory;
  original: string;
  corrected: string;
  frequency: number;  // How often this pattern appears in corrections
  weight: number;     // Importance weight (0-1)
}

/**
 * Result of applying style updates
 */
export interface StyleUpdateResult {
  updated: boolean;
  changesApplied: PatternDiff[];
  profileVersion: number;
  confidence: number;
}

/**
 * Classification of a correction type
 */
export interface CorrectionClassification {
  type: 'stylistic' | 'content' | 'both';
  stylisticWeight: number;
  contentWeight: number;
}

/**
 * Learning statistics for a profile
 */
export interface LearningStats {
  totalCorrections: number;
  patternsLearned: number;
  lastUpdateTime: number;
  profileConfidence: number;
}

/**
 * Internal storage for learned patterns
 */
interface LearnedPatterns {
  profileId: string;
  patterns: PatternDiff[];
  lastUpdated: number;
  version: number;
  totalCorrections: number;
}

/**
 * IncrementalStyleUpdater class for learning from user corrections
 */
export class IncrementalStyleUpdater {
  private profileManager: StyleProfileManager;
  private learnedPatternsStore: Map<string, LearnedPatterns>;
  private minFrequencyThreshold: number = 2;
  private maxPatternsPerCategory: number = 50;

  constructor(profileManager: StyleProfileManager) {
    this.profileManager = profileManager;
    this.learnedPatternsStore = new Map();
  }

  /**
   * Learn from a single correction
   */
  async learnFromCorrection(
    original: string,
    corrected: string,
    profileId: string
  ): Promise<StyleUpdateResult> {
    // Extract pattern differences
    const patterns = this.extractPatternDifferences(original, corrected);

    if (patterns.length === 0) {
      return {
        updated: false,
        changesApplied: [],
        profileVersion: this.getProfileVersion(profileId),
        confidence: this.getProfileConfidence(profileId),
      };
    }

    // Add to learned patterns
    await this.addLearnedPatterns(profileId, patterns);

    // Check if we should apply to profile
    const shouldApply = this.shouldApplyToProfile(profileId);

    if (shouldApply) {
      await this.applyToProfile(patterns, profileId);
    }

    return {
      updated: shouldApply,
      changesApplied: shouldApply ? patterns : [],
      profileVersion: this.getProfileVersion(profileId),
      confidence: this.getProfileConfidence(profileId),
    };
  }

  /**
   * Learn from multiple corrections (batch)
   */
  async learnFromBatch(
    corrections: Array<{ original: string; corrected: string }>,
    profileId: string
  ): Promise<StyleUpdateResult> {
    const allPatterns: PatternDiff[] = [];

    for (const { original, corrected } of corrections) {
      const patterns = this.extractPatternDifferences(original, corrected);
      allPatterns.push(...patterns);
    }

    if (allPatterns.length === 0) {
      return {
        updated: false,
        changesApplied: [],
        profileVersion: this.getProfileVersion(profileId),
        confidence: this.getProfileConfidence(profileId),
      };
    }

    // Consolidate patterns (increase frequency for duplicates)
    const consolidatedPatterns = this.consolidatePatterns(allPatterns);

    // Add to learned patterns
    await this.addLearnedPatterns(profileId, consolidatedPatterns);

    // Apply significant patterns
    const significantPatterns = consolidatedPatterns.filter(
      p => p.frequency >= this.minFrequencyThreshold
    );

    if (significantPatterns.length > 0) {
      await this.applyToProfile(significantPatterns, profileId);
    }

    return {
      updated: significantPatterns.length > 0,
      changesApplied: significantPatterns,
      profileVersion: this.getProfileVersion(profileId),
      confidence: this.getProfileConfidence(profileId),
    };
  }

  /**
   * Extract pattern differences between original and corrected text
   */
  extractPatternDifferences(original: string, corrected: string): PatternDiff[] {
    const patterns: PatternDiff[] = [];

    // Extract word-level differences
    const wordDiffs = this.extractWordDifferences(original, corrected);
    patterns.push(...wordDiffs);

    // Extract phrase-level differences
    const phraseDiffs = this.extractPhraseDifferences(original, corrected);
    patterns.push(...phraseDiffs);

    // Extract structural differences
    const structureDiffs = this.extractStructuralDifferences(original, corrected);
    patterns.push(...structureDiffs);

    // Extract transition differences
    const transitionDiffs = this.extractTransitionDifferences(original, corrected);
    patterns.push(...transitionDiffs);

    // Extract citation differences
    const citationDiffs = this.extractCitationDifferences(original, corrected);
    patterns.push(...citationDiffs);

    return patterns;
  }

  /**
   * Apply learned patterns to style profile
   */
  async applyToProfile(patterns: PatternDiff[], profileId: string): Promise<void> {
    const stored = this.learnedPatternsStore.get(profileId);
    if (!stored) return;

    // Get current profile
    const profile = this.profileManager.getProfile(profileId);
    if (!profile) return;

    // Apply patterns based on category
    // Note: The actual profile update depends on the StyleProfileManager implementation
    // Here we update our internal learned patterns store

    stored.version++;
    stored.lastUpdated = Date.now();

    // In a real implementation, you would update the profile's characteristics
    // For now, we just track the patterns for prompt enhancement

    this.learnedPatternsStore.set(profileId, stored);
  }

  /**
   * Detect if correction is stylistic or content-based
   */
  classifyCorrection(original: string, corrected: string): CorrectionClassification {
    // Calculate similarity metrics
    const wordSimilarity = this.calculateWordSimilarity(original, corrected);
    const structuralSimilarity = this.calculateStructuralSimilarity(original, corrected);
    const semanticSimilarity = this.estimateSemanticSimilarity(original, corrected);

    // High word change with high semantic similarity = stylistic
    // Low semantic similarity = content change

    let stylisticWeight = 0;
    let contentWeight = 0;

    // If structure is very different but semantics similar -> stylistic
    if (structuralSimilarity < 0.5 && semanticSimilarity > 0.7) {
      stylisticWeight += 0.5;
    }

    // If words are different but key nouns/verbs same -> stylistic
    if (wordSimilarity < 0.7 && semanticSimilarity > 0.6) {
      stylisticWeight += 0.3;
    }

    // If semantic similarity is low -> content change
    if (semanticSimilarity < 0.5) {
      contentWeight += 0.7;
    }

    // If both texts contain same key terms but different phrasing -> stylistic
    const keyTermOverlap = this.calculateKeyTermOverlap(original, corrected);
    if (keyTermOverlap > 0.7) {
      stylisticWeight += 0.2;
    } else {
      contentWeight += 0.2;
    }

    // Normalize weights
    const total = stylisticWeight + contentWeight;
    if (total > 0) {
      stylisticWeight /= total;
      contentWeight /= total;
    } else {
      stylisticWeight = 0.5;
      contentWeight = 0.5;
    }

    // Determine type
    let type: 'stylistic' | 'content' | 'both';
    if (stylisticWeight > 0.7) {
      type = 'stylistic';
    } else if (contentWeight > 0.7) {
      type = 'content';
    } else {
      type = 'both';
    }

    return { type, stylisticWeight, contentWeight };
  }

  /**
   * Get learning statistics for a profile
   */
  getLearningStats(profileId: string): LearningStats {
    const stored = this.learnedPatternsStore.get(profileId);

    if (!stored) {
      return {
        totalCorrections: 0,
        patternsLearned: 0,
        lastUpdateTime: 0,
        profileConfidence: 0,
      };
    }

    return {
      totalCorrections: stored.totalCorrections,
      patternsLearned: stored.patterns.length,
      lastUpdateTime: stored.lastUpdated,
      profileConfidence: this.getProfileConfidence(profileId),
    };
  }

  /**
   * Get all learned patterns for a profile
   */
  getLearnedPatterns(profileId: string): PatternDiff[] {
    const stored = this.learnedPatternsStore.get(profileId);
    return stored?.patterns ?? [];
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(profileId: string, category: PatternCategory): PatternDiff[] {
    const patterns = this.getLearnedPatterns(profileId);
    return patterns.filter(p => p.category === category);
  }

  /**
   * Generate a style enhancement prompt from learned patterns
   */
  generateStyleEnhancementPrompt(profileId: string): string {
    const patterns = this.getLearnedPatterns(profileId);

    if (patterns.length === 0) {
      return '';
    }

    const lines: string[] = [
      '## LEARNED STYLE PATTERNS',
      '',
      'Based on previous corrections, apply these stylistic preferences:',
      '',
    ];

    // Group by category
    const byCategory = new Map<PatternCategory, PatternDiff[]>();
    for (const pattern of patterns) {
      const existing = byCategory.get(pattern.category) ?? [];
      existing.push(pattern);
      byCategory.set(pattern.category, existing);
    }

    // Word replacements
    const wordPatterns = byCategory.get('word') ?? [];
    if (wordPatterns.length > 0) {
      lines.push('### Word Choice Preferences');
      for (const p of wordPatterns.slice(0, 10)) {
        if (p.type === 'modified') {
          lines.push(`- Use "${p.corrected}" instead of "${p.original}"`);
        }
      }
      lines.push('');
    }

    // Phrase patterns
    const phrasePatterns = byCategory.get('phrase') ?? [];
    if (phrasePatterns.length > 0) {
      lines.push('### Phrase Preferences');
      for (const p of phrasePatterns.slice(0, 10)) {
        if (p.type === 'modified') {
          lines.push(`- Prefer: "${p.corrected}"`);
          lines.push(`  Over: "${p.original}"`);
        } else if (p.type === 'added') {
          lines.push(`- Include: "${p.corrected}"`);
        }
      }
      lines.push('');
    }

    // Structural patterns
    const structurePatterns = byCategory.get('structure') ?? [];
    if (structurePatterns.length > 0) {
      lines.push('### Structure Preferences');
      for (const p of structurePatterns.slice(0, 5)) {
        lines.push(`- ${p.corrected}`);
      }
      lines.push('');
    }

    // Transition patterns
    const transitionPatterns = byCategory.get('transition') ?? [];
    if (transitionPatterns.length > 0) {
      lines.push('### Transition Preferences');
      for (const p of transitionPatterns.slice(0, 10)) {
        if (p.type === 'modified') {
          lines.push(`- Use "${p.corrected}" instead of "${p.original}"`);
        } else if (p.type === 'added') {
          lines.push(`- Include transitions like: "${p.corrected}"`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Clear learned patterns for a profile
   */
  clearLearnedPatterns(profileId: string): void {
    this.learnedPatternsStore.delete(profileId);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractWordDifferences(original: string, corrected: string): PatternDiff[] {
    const patterns: PatternDiff[] = [];

    const originalWords = this.tokenize(original);
    const correctedWords = this.tokenize(corrected);

    // Find words that were replaced
    const replacements = this.findWordReplacements(originalWords, correctedWords);

    for (const [origWord, corrWord] of replacements) {
      patterns.push({
        type: 'modified',
        category: 'word',
        original: origWord,
        corrected: corrWord,
        frequency: 1,
        weight: 0.5,
      });
    }

    return patterns;
  }

  private extractPhraseDifferences(original: string, corrected: string): PatternDiff[] {
    const patterns: PatternDiff[] = [];

    // Extract n-grams (2-4 words)
    const originalPhrases = this.extractPhrases(original);
    const correctedPhrases = this.extractPhrases(corrected);

    // Find phrases that were modified
    for (const origPhrase of originalPhrases) {
      // Check if this phrase was replaced with a similar one
      for (const corrPhrase of correctedPhrases) {
        if (
          this.isPhraseModification(origPhrase, corrPhrase) &&
          origPhrase !== corrPhrase
        ) {
          patterns.push({
            type: 'modified',
            category: 'phrase',
            original: origPhrase,
            corrected: corrPhrase,
            frequency: 1,
            weight: 0.6,
          });
        }
      }
    }

    // Find phrases that were added
    for (const corrPhrase of correctedPhrases) {
      if (!this.hasSimilarPhrase(corrPhrase, originalPhrases)) {
        patterns.push({
          type: 'added',
          category: 'phrase',
          original: '',
          corrected: corrPhrase,
          frequency: 1,
          weight: 0.4,
        });
      }
    }

    return patterns.slice(0, 20); // Limit to prevent explosion
  }

  private extractStructuralDifferences(original: string, corrected: string): PatternDiff[] {
    const patterns: PatternDiff[] = [];

    // Check sentence count changes
    const origSentences = original.match(/[^.!?]+[.!?]+/g) ?? [];
    const corrSentences = corrected.match(/[^.!?]+[.!?]+/g) ?? [];

    if (origSentences.length !== corrSentences.length) {
      const change = corrSentences.length > origSentences.length ? 'more' : 'fewer';
      patterns.push({
        type: 'modified',
        category: 'structure',
        original: `${origSentences.length} sentences`,
        corrected: `Prefer ${change} sentences (${corrSentences.length} used)`,
        frequency: 1,
        weight: 0.3,
      });
    }

    // Check average sentence length changes
    const avgOrigLen = this.averageSentenceLength(origSentences);
    const avgCorrLen = this.averageSentenceLength(corrSentences);

    if (Math.abs(avgOrigLen - avgCorrLen) > 5) {
      const change = avgCorrLen > avgOrigLen ? 'longer' : 'shorter';
      patterns.push({
        type: 'modified',
        category: 'structure',
        original: `~${avgOrigLen.toFixed(0)} words/sentence`,
        corrected: `Prefer ${change} sentences (~${avgCorrLen.toFixed(0)} words)`,
        frequency: 1,
        weight: 0.4,
      });
    }

    return patterns;
  }

  private extractTransitionDifferences(original: string, corrected: string): PatternDiff[] {
    const patterns: PatternDiff[] = [];

    // Common transition patterns
    const transitionRegex = /\b(However|Therefore|Thus|Moreover|Furthermore|Nevertheless|Consequently|Additionally|In contrast|On the other hand|Similarly|Likewise|Indeed|In fact|For example|For instance|Specifically|In particular|First|Second|Third|Finally|In conclusion|To summarize|Overall)\b/gi;

    const origTransitions = original.match(transitionRegex) ?? [];
    const corrTransitions = corrected.match(transitionRegex) ?? [];

    // Find added transitions
    for (const trans of corrTransitions) {
      const transLower = trans.toLowerCase();
      if (!origTransitions.some(t => t.toLowerCase() === transLower)) {
        patterns.push({
          type: 'added',
          category: 'transition',
          original: '',
          corrected: trans,
          frequency: 1,
          weight: 0.5,
        });
      }
    }

    // Find removed/replaced transitions
    for (const trans of origTransitions) {
      const transLower = trans.toLowerCase();
      if (!corrTransitions.some(t => t.toLowerCase() === transLower)) {
        // Check if replaced with something similar
        const replacement = this.findSimilarTransition(trans, corrTransitions);
        if (replacement) {
          patterns.push({
            type: 'modified',
            category: 'transition',
            original: trans,
            corrected: replacement,
            frequency: 1,
            weight: 0.6,
          });
        } else {
          patterns.push({
            type: 'removed',
            category: 'transition',
            original: trans,
            corrected: '',
            frequency: 1,
            weight: 0.3,
          });
        }
      }
    }

    return patterns;
  }

  private extractCitationDifferences(original: string, corrected: string): PatternDiff[] {
    const patterns: PatternDiff[] = [];

    // Check citation format changes
    const authorProminentOrig = (original.match(/\b[A-Z][a-z]+\s*(?:et al\.?|and\s+[A-Z][a-z]+)?\s*\(\d{4}\)/g) ?? []).length;
    const infoProminentOrig = (original.match(/\([A-Z][a-z]+(?:\s+(?:et al\.?|&\s*[A-Z][a-z]+))?,?\s*\d{4}\)/g) ?? []).length;

    const authorProminentCorr = (corrected.match(/\b[A-Z][a-z]+\s*(?:et al\.?|and\s+[A-Z][a-z]+)?\s*\(\d{4}\)/g) ?? []).length;
    const infoProminentCorr = (corrected.match(/\([A-Z][a-z]+(?:\s+(?:et al\.?|&\s*[A-Z][a-z]+))?,?\s*\d{4}\)/g) ?? []).length;

    // Check if citation style shifted
    const origTotal = authorProminentOrig + infoProminentOrig;
    const corrTotal = authorProminentCorr + infoProminentCorr;

    if (origTotal > 0 && corrTotal > 0) {
      const origAuthorRatio = authorProminentOrig / origTotal;
      const corrAuthorRatio = authorProminentCorr / corrTotal;

      if (Math.abs(origAuthorRatio - corrAuthorRatio) > 0.3) {
        const preference = corrAuthorRatio > origAuthorRatio
          ? 'author-prominent'
          : 'information-prominent';
        patterns.push({
          type: 'modified',
          category: 'citation',
          original: `${(origAuthorRatio * 100).toFixed(0)}% author-prominent`,
          corrected: `Prefer ${preference} citations`,
          frequency: 1,
          weight: 0.5,
        });
      }
    }

    return patterns;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private findWordReplacements(
    original: string[],
    corrected: string[]
  ): Array<[string, string]> {
    const replacements: Array<[string, string]> = [];

    // Simple word alignment using context
    const origSet = new Set(original);
    const corrSet = new Set(corrected);

    // Words in original but not in corrected
    const removed = original.filter(w => !corrSet.has(w));
    // Words in corrected but not in original
    const added = corrected.filter(w => !origSet.has(w));

    // Try to pair up removed and added words that appear in similar contexts
    for (const rem of removed) {
      // Find potential replacement based on edit distance
      for (const add of added) {
        if (this.areRelatedWords(rem, add)) {
          replacements.push([rem, add]);
          break;
        }
      }
    }

    return replacements;
  }

  private areRelatedWords(word1: string, word2: string): boolean {
    // Check if words are related (same root, similar meaning, etc.)
    if (word1 === word2) return false;

    // Check for similar prefixes (shared root)
    const minLen = Math.min(word1.length, word2.length);
    if (minLen >= 4) {
      const sharedPrefix = this.commonPrefixLength(word1, word2);
      if (sharedPrefix >= minLen * 0.6) return true;
    }

    // Check edit distance
    const distance = this.levenshteinDistance(word1, word2);
    const maxLen = Math.max(word1.length, word2.length);
    if (distance / maxLen < 0.4) return true;

    return false;
  }

  private commonPrefixLength(str1: string, str2: string): number {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return i;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  private extractPhrases(text: string): string[] {
    const phrases: string[] = [];
    const words = text.split(/\s+/);

    // Extract 2-grams and 3-grams
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ');
        // Filter out phrases that are mostly punctuation
        if (/[a-zA-Z]{3,}/.test(phrase)) {
          phrases.push(phrase.toLowerCase());
        }
      }
    }

    return phrases;
  }

  private isPhraseModification(phrase1: string, phrase2: string): boolean {
    // Check if phrases share significant overlap
    const words1 = phrase1.split(/\s+/);
    const words2 = phrase2.split(/\s+/);

    // At least one word must be shared
    const sharedWords = words1.filter(w => words2.includes(w));
    return sharedWords.length > 0 && sharedWords.length < Math.max(words1.length, words2.length);
  }

  private hasSimilarPhrase(phrase: string, phrases: string[]): boolean {
    return phrases.some(p => this.isPhraseModification(phrase, p) || phrase === p);
  }

  private findSimilarTransition(transition: string, transitions: string[]): string | null {
    // Group similar transitions
    const transitionGroups: { [key: string]: string[] } = {
      contrast: ['however', 'nevertheless', 'nonetheless', 'in contrast', 'on the other hand'],
      addition: ['moreover', 'furthermore', 'additionally', 'in addition'],
      consequence: ['therefore', 'thus', 'consequently', 'as a result', 'hence'],
      similarity: ['similarly', 'likewise', 'in the same way'],
      emphasis: ['indeed', 'in fact', 'certainly'],
    };

    const transLower = transition.toLowerCase();

    // Find which group the original belongs to
    for (const [_group, members] of Object.entries(transitionGroups)) {
      if (members.includes(transLower)) {
        // Check if any corrected transition is in the same group
        for (const corr of transitions) {
          if (members.includes(corr.toLowerCase()) && corr.toLowerCase() !== transLower) {
            return corr;
          }
        }
      }
    }

    return null;
  }

  private averageSentenceLength(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    return totalWords / sentences.length;
  }

  private consolidatePatterns(patterns: PatternDiff[]): PatternDiff[] {
    const consolidated = new Map<string, PatternDiff>();

    for (const pattern of patterns) {
      const key = `${pattern.category}:${pattern.type}:${pattern.original}:${pattern.corrected}`;
      const existing = consolidated.get(key);

      if (existing) {
        existing.frequency++;
        existing.weight = Math.min(1, existing.weight + 0.1);
      } else {
        consolidated.set(key, { ...pattern });
      }
    }

    return Array.from(consolidated.values());
  }

  private async addLearnedPatterns(profileId: string, patterns: PatternDiff[]): Promise<void> {
    let stored = this.learnedPatternsStore.get(profileId);

    if (!stored) {
      stored = {
        profileId,
        patterns: [],
        lastUpdated: Date.now(),
        version: 1,
        totalCorrections: 0,
      };
      this.learnedPatternsStore.set(profileId, stored);
    }

    stored.totalCorrections++;

    // Merge new patterns with existing
    for (const pattern of patterns) {
      const key = `${pattern.category}:${pattern.type}:${pattern.original}:${pattern.corrected}`;
      const existingIdx = stored.patterns.findIndex(
        p => `${p.category}:${p.type}:${p.original}:${p.corrected}` === key
      );

      if (existingIdx >= 0) {
        stored.patterns[existingIdx].frequency++;
        stored.patterns[existingIdx].weight = Math.min(1, stored.patterns[existingIdx].weight + 0.1);
      } else {
        stored.patterns.push({ ...pattern });
      }
    }

    // Sort by frequency and trim to max per category
    stored.patterns.sort((a, b) => b.frequency - a.frequency);

    // Trim each category
    const byCategory = new Map<PatternCategory, PatternDiff[]>();
    for (const p of stored.patterns) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }

    stored.patterns = [];
    for (const [_cat, list] of byCategory) {
      stored.patterns.push(...list.slice(0, this.maxPatternsPerCategory));
    }

    stored.lastUpdated = Date.now();
  }

  private shouldApplyToProfile(profileId: string): boolean {
    const stored = this.learnedPatternsStore.get(profileId);
    if (!stored) return false;

    // Apply when we have enough high-frequency patterns
    const highFreqPatterns = stored.patterns.filter(p => p.frequency >= this.minFrequencyThreshold);
    return highFreqPatterns.length >= 3;
  }

  private getProfileVersion(profileId: string): number {
    const stored = this.learnedPatternsStore.get(profileId);
    return stored?.version ?? 1;
  }

  private getProfileConfidence(profileId: string): number {
    const stored = this.learnedPatternsStore.get(profileId);
    if (!stored) return 0;

    // Confidence based on number of corrections and patterns
    const correctionFactor = Math.min(1, stored.totalCorrections / 20);
    const patternFactor = Math.min(1, stored.patterns.length / 30);
    const frequencyFactor = stored.patterns.reduce((sum, p) => sum + Math.min(1, p.frequency / 5), 0) /
      Math.max(1, stored.patterns.length);

    return (correctionFactor * 0.3 + patternFactor * 0.3 + frequencyFactor * 0.4);
  }

  private calculateWordSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.tokenize(text1));
    const words2 = new Set(this.tokenize(text2));

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return union > 0 ? intersection / union : 0;
  }

  private calculateStructuralSimilarity(text1: string, text2: string): number {
    const sent1 = (text1.match(/[^.!?]+[.!?]+/g) ?? []).length;
    const sent2 = (text2.match(/[^.!?]+[.!?]+/g) ?? []).length;

    const len1 = text1.length;
    const len2 = text2.length;

    const sentSim = 1 - Math.abs(sent1 - sent2) / Math.max(sent1, sent2, 1);
    const lenSim = 1 - Math.abs(len1 - len2) / Math.max(len1, len2, 1);

    return (sentSim + lenSim) / 2;
  }

  private estimateSemanticSimilarity(text1: string, text2: string): number {
    // Use key noun/verb overlap as a proxy for semantic similarity
    // This is a heuristic - in production, you might use embeddings
    const keyTerms1 = this.extractKeyTerms(text1);
    const keyTerms2 = this.extractKeyTerms(text2);

    return this.calculateKeyTermOverlap(text1, text2);
  }

  private extractKeyTerms(text: string): Set<string> {
    // Extract nouns and verbs (simplified)
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];

    // Filter out common words
    const stopWords = new Set([
      'that', 'this', 'with', 'from', 'have', 'been', 'were', 'will',
      'would', 'could', 'should', 'their', 'there', 'which', 'about',
      'also', 'more', 'some', 'only', 'such', 'than', 'very', 'just',
    ]);

    return new Set(words.filter(w => !stopWords.has(w)));
  }

  private calculateKeyTermOverlap(text1: string, text2: string): number {
    const terms1 = this.extractKeyTerms(text1);
    const terms2 = this.extractKeyTerms(text2);

    const intersection = [...terms1].filter(t => terms2.has(t)).length;
    const union = new Set([...terms1, ...terms2]).size;

    return union > 0 ? intersection / union : 0;
  }
}
