/**
 * EnhancementPromptGenerator - Combines all learned patterns into comprehensive prompts
 * Aggregates insights from style analysis, feedback, cross-session learning, and philosophical processing
 */

import type { DeepStyleCharacteristics } from '../style/deep-style-analyzer.js';
import type { ContrastiveLearner, ConsistentPattern, AntiPattern, PositivePattern } from './contrastive-learner.js';
import type { CrossSessionLearner, ConsolidatedPattern } from './cross-session-learner.js';
import type { IncrementalStyleUpdater } from './incremental-style-updater.js';
import type { PhilosophicalFeedbackProcessor, PhilosophicalFeedbackAnalysis } from './philosophical-feedback-processor.js';
import type { CitationTemplateSet } from '../style/citation-template-generator.js';
import type { PhenomenologicalMarkerPatterns } from '../style/phenomenological-marker-extractor.js';

/**
 * Configuration for prompt generation
 */
export interface EnhancementPromptConfig {
  /** Include deep style characteristics */
  includeStyleProfile: boolean;
  /** Include learned patterns from feedback */
  includeLearnedPatterns: boolean;
  /** Include cross-session consolidated patterns */
  includeCrossSessionPatterns: boolean;
  /** Include philosophical writing guidance */
  includePhilosophicalGuidance: boolean;
  /** Include citation templates */
  includeCitationTemplates: boolean;
  /** Include phenomenological markers (for philosophical writing) */
  includePhenomenologicalMarkers: boolean;
  /** Maximum length of prompt section (characters) */
  maxSectionLength: number;
  /** Priority order for sections when truncating */
  priorityOrder: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: EnhancementPromptConfig = {
  includeStyleProfile: true,
  includeLearnedPatterns: true,
  includeCrossSessionPatterns: true,
  includePhilosophicalGuidance: true,
  includeCitationTemplates: true,
  includePhenomenologicalMarkers: true,
  maxSectionLength: 3000,
  priorityOrder: [
    'crossSession',      // Most reliable (proven across sessions)
    'philosophical',     // Domain-specific guidance
    'styleProfile',      // Base voice characteristics
    'learnedPatterns',   // Current session learning
    'citationTemplates', // Citation formatting
    'phenomenological',  // Technical vocabulary
  ],
};

/**
 * Prompt section with metadata
 */
interface PromptSection {
  id: string;
  title: string;
  content: string;
  priority: number;
  charCount: number;
}

/**
 * EnhancementPromptGenerator class
 */
export class EnhancementPromptGenerator {
  private config: EnhancementPromptConfig;

  constructor(config: Partial<EnhancementPromptConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a comprehensive enhancement prompt from all available sources
   */
  generatePrompt(
    styleProfile: DeepStyleCharacteristics | null,
    contrastiveLearner: ContrastiveLearner | null,
    crossSessionLearner: CrossSessionLearner | null,
    styleUpdater: IncrementalStyleUpdater | null,
    philosophicalAnalyses: PhilosophicalFeedbackAnalysis[] | null,
    citationTemplates: CitationTemplateSet | null,
    phenomenologicalMarkers: PhenomenologicalMarkerPatterns | null,
    profileId: string = 'default'
  ): string {
    const sections: PromptSection[] = [];

    // Generate each section
    if (this.config.includeCrossSessionPatterns && crossSessionLearner) {
      const content = this.generateCrossSessionSection(crossSessionLearner);
      if (content) {
        sections.push({
          id: 'crossSession',
          title: 'CROSS-SESSION LEARNING INSIGHTS',
          content,
          priority: this.getPriority('crossSession'),
          charCount: content.length,
        });
      }
    }

    if (this.config.includePhilosophicalGuidance && philosophicalAnalyses && philosophicalAnalyses.length > 0) {
      const content = this.generatePhilosophicalSection(philosophicalAnalyses);
      if (content) {
        sections.push({
          id: 'philosophical',
          title: 'PHILOSOPHICAL WRITING GUIDANCE',
          content,
          priority: this.getPriority('philosophical'),
          charCount: content.length,
        });
      }
    }

    if (this.config.includeStyleProfile && styleProfile) {
      const content = this.generateStyleProfileSection(styleProfile);
      if (content) {
        sections.push({
          id: 'styleProfile',
          title: 'VOICE AND STYLE CHARACTERISTICS',
          content,
          priority: this.getPriority('styleProfile'),
          charCount: content.length,
        });
      }
    }

    if (this.config.includeLearnedPatterns && (contrastiveLearner || styleUpdater)) {
      const content = this.generateLearnedPatternsSection(contrastiveLearner, styleUpdater, profileId);
      if (content) {
        sections.push({
          id: 'learnedPatterns',
          title: 'LEARNED PATTERNS FROM USER FEEDBACK',
          content,
          priority: this.getPriority('learnedPatterns'),
          charCount: content.length,
        });
      }
    }

    if (this.config.includeCitationTemplates && citationTemplates) {
      const content = this.generateCitationTemplatesSection(citationTemplates);
      if (content) {
        sections.push({
          id: 'citationTemplates',
          title: 'CITATION STYLE TEMPLATES',
          content,
          priority: this.getPriority('citationTemplates'),
          charCount: content.length,
        });
      }
    }

    if (this.config.includePhenomenologicalMarkers && phenomenologicalMarkers) {
      const content = this.generatePhenomenologicalSection(phenomenologicalMarkers);
      if (content) {
        sections.push({
          id: 'phenomenological',
          title: 'PHENOMENOLOGICAL VOCABULARY',
          content,
          priority: this.getPriority('phenomenological'),
          charCount: content.length,
        });
      }
    }

    // Sort by priority and truncate if needed
    sections.sort((a, b) => a.priority - b.priority);
    const finalSections = this.truncateSections(sections);

    // Combine into final prompt
    return this.combineSections(finalSections);
  }

  /**
   * Generate a minimal prompt for quick generation
   */
  generateMinimalPrompt(
    crossSessionLearner: CrossSessionLearner | null,
    styleProfile: DeepStyleCharacteristics | null
  ): string {
    const lines: string[] = ['## STYLE ENHANCEMENT'];

    // Only include most important cross-session patterns
    if (crossSessionLearner) {
      const consolidated = crossSessionLearner.getConsolidatedPatterns(3);
      const topPatterns = consolidated.slice(0, 5);

      if (topPatterns.length > 0) {
        lines.push('');
        lines.push('### Proven Style Preferences');
        for (const p of topPatterns) {
          if (p.type === 'consistent' && p.replacement) {
            lines.push(`- Use "${p.replacement}" instead of "${p.pattern}"`);
          } else if (p.type === 'anti') {
            lines.push(`- AVOID: "${p.pattern}"`);
          }
        }
      }
    }

    // Include core voice characteristics
    if (styleProfile) {
      lines.push('');
      lines.push('### Voice Characteristics');

      if (styleProfile.citationIntegration?.introductionPatterns?.authorProminent &&
          styleProfile.citationIntegration.introductionPatterns.authorProminent.length > 0) {
        lines.push('- Use author-prominent citations (e.g., "Aristotle argues that...")');
      }

      if (styleProfile.rhetoricalMoves?.occupyingNiche?.methodPreviews &&
          styleProfile.rhetoricalMoves.occupyingNiche.methodPreviews.length > 0) {
        lines.push('- Include clear structural signposting');
      }

      const claimStrength = styleProfile.argumentPatterns?.claimStructure?.claimStrength;
      if (claimStrength === 'strong') {
        lines.push('- Use confident, assertive claims');
      } else if (claimStrength === 'moderate') {
        lines.push('- Balance claims with appropriate hedging');
      } else if (claimStrength === 'cautious') {
        lines.push('- Prefer cautious, hedged claims');
      }
    }

    return lines.join('\n');
  }

  // ============================================================================
  // Section Generation Methods
  // ============================================================================

  private generateCrossSessionSection(learner: CrossSessionLearner): string {
    const lines: string[] = [];
    const stats = learner.getStats();

    if (stats.totalSessions < 2) {
      return '';
    }

    // Get consolidated patterns by type
    const consistentPatterns = learner.getConsolidatedPatternsByType('consistent').slice(0, 10);
    const antiPatterns = learner.getConsolidatedPatternsByType('anti').slice(0, 8);
    const positivePatterns = learner.getConsolidatedPatternsByType('positive').slice(0, 8);

    if (consistentPatterns.length > 0) {
      lines.push('### Proven Style Replacements');
      lines.push('These patterns have been consistently corrected across multiple sessions:');
      lines.push('');
      for (const p of consistentPatterns) {
        const confidence = (p.consolidatedConfidence * 100).toFixed(0);
        lines.push(`- "${p.pattern}" → "${p.replacement}" [${p.sessionCount} sessions, ${confidence}% confidence]`);
      }
      lines.push('');
    }

    if (antiPatterns.length > 0) {
      lines.push('### Confirmed Anti-Patterns');
      lines.push('Avoid these patterns based on repeated corrections:');
      lines.push('');
      for (const p of antiPatterns) {
        lines.push(`- AVOID: "${p.pattern}" (${p.reason}) [${p.sessionCount} sessions]`);
      }
      lines.push('');
    }

    if (positivePatterns.length > 0) {
      lines.push('### Confirmed Positive Patterns');
      lines.push('Include these elements based on user preferences:');
      lines.push('');
      for (const p of positivePatterns) {
        lines.push(`- USE: "${p.pattern}" (${p.context}) [${p.sessionCount} sessions]`);
      }
      lines.push('');
    }

    // Add improvement summary
    const improvement = learner.getImprovementSummary();
    if (improvement.sessionsAnalyzed >= 3) {
      lines.push('### Learning Progress');
      lines.push(`- Voice match trend: ${improvement.voiceMatchImprovement > 0 ? '+' : ''}${(improvement.voiceMatchImprovement * 100).toFixed(1)}%`);
      if (improvement.topImprovementAreas.length > 0) {
        lines.push(`- Improved areas: ${improvement.topImprovementAreas.join(', ')}`);
      }
      if (improvement.areasNeedingWork.length > 0) {
        lines.push(`- Focus areas: ${improvement.areasNeedingWork.join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  private generatePhilosophicalSection(analyses: PhilosophicalFeedbackAnalysis[]): string {
    const lines: string[] = [];

    // Aggregate terminology preferences
    const termPreferences = new Map<string, { preferred: string; count: number }>();
    for (const analysis of analyses) {
      for (const change of analysis.terminologyChanges) {
        const key = change.term.toLowerCase();
        const existing = termPreferences.get(key);
        if (existing) {
          existing.count++;
        } else {
          termPreferences.set(key, { preferred: change.correctedUsage, count: 1 });
        }
      }
    }

    if (termPreferences.size > 0) {
      lines.push('### Terminology Preferences');
      for (const [term, data] of Array.from(termPreferences.entries())) {
        if (data.count >= 1) {
          lines.push(`- **${term}**: Use "${data.preferred}"`);
        }
      }
      lines.push('');
    }

    // Aggregate argument structure guidance
    const structureGuidance = new Set<string>();
    for (const analysis of analyses) {
      for (const issue of analysis.philosophicalIssues) {
        if (issue.suggestedRevision && ['argument_structure', 'dialectical_move', 'interpretive_claim'].includes(issue.philosophicalType)) {
          structureGuidance.add(issue.suggestedRevision);
        }
      }
    }

    if (structureGuidance.size > 0) {
      lines.push('### Argument Structure');
      for (const guidance of Array.from(structureGuidance)) {
        lines.push(`- ${guidance}`);
      }
      lines.push('');
    }

    // Aggregate hedging preferences
    const hedgingIssues = analyses.flatMap(a => a.philosophicalIssues).filter(i => i.philosophicalType === 'hedging_balance');
    const overHedged = hedgingIssues.filter(i => i.description.includes('over-hedged')).length;
    const underHedged = hedgingIssues.filter(i => i.description.includes('under-hedged')).length;

    if (hedgingIssues.length > 0) {
      lines.push('### Hedging Calibration');
      if (overHedged > underHedged) {
        lines.push('- User prefers assertive claims; minimize excessive hedging');
        lines.push('- Use "I argue that..." rather than "It might seem that..."');
      } else if (underHedged > overHedged) {
        lines.push('- User prefers cautious claims; include appropriate hedging');
        lines.push('- Use "suggests" rather than "proves"');
      } else {
        lines.push('- Maintain balanced hedging appropriate to claim strength');
      }
      lines.push('');
    }

    // Citation style preferences
    const citationPrefs = new Map<string, number>();
    for (const analysis of analyses) {
      for (const change of analysis.citationChanges) {
        if (change.integrationStyle) {
          const count = citationPrefs.get(change.integrationStyle) || 0;
          citationPrefs.set(change.integrationStyle, count + 1);
        }
      }
    }

    if (citationPrefs.size > 0) {
      lines.push('### Citation Integration');
      const sorted = Array.from(citationPrefs.entries()).sort((a, b) => b[1] - a[1]);
      for (const [style, count] of sorted) {
        lines.push(`- Prefer ${style} citations (based on ${count} corrections)`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateStyleProfileSection(profile: DeepStyleCharacteristics): string {
    const lines: string[] = [];

    // Rhetorical patterns
    if (profile.rhetoricalMoves) {
      lines.push('### Rhetorical Patterns');

      if (profile.rhetoricalMoves.establishingTerritory?.topicIntroducers &&
          profile.rhetoricalMoves.establishingTerritory.topicIntroducers.length > 0) {
        lines.push('- Begin sections with broad topic generalizations');
      }

      if (profile.rhetoricalMoves.establishingNiche?.gapIndicators &&
          profile.rhetoricalMoves.establishingNiche.gapIndicators.length > 0) {
        lines.push('- Establish scholarly gaps using "however", "yet", "nevertheless"');
      }

      if (profile.rhetoricalMoves.occupyingNiche?.purposeStatements &&
          profile.rhetoricalMoves.occupyingNiche.purposeStatements.length > 0) {
        lines.push('- Clearly announce research contributions');
      }

      if (profile.rhetoricalMoves.occupyingNiche?.methodPreviews &&
          profile.rhetoricalMoves.occupyingNiche.methodPreviews.length > 0) {
        lines.push('- Include explicit structural signposting');
      }
      lines.push('');
    }

    // Argument patterns
    if (profile.argumentPatterns) {
      lines.push('### Argument Structure');

      const claimStrength = profile.argumentPatterns.claimStructure?.claimStrength;
      if (claimStrength) {
        const strengthDesc = claimStrength === 'strong' ? 'assertive' :
                          claimStrength === 'moderate' ? 'balanced' : 'cautious';
        lines.push(`- Claim strength: ${strengthDesc}`);
      }

      if (profile.argumentPatterns.warrantConnection?.reasoningConnectors &&
          profile.argumentPatterns.warrantConnection.reasoningConnectors.length > 0) {
        lines.push('- Include explicit warrants connecting evidence to claims');
      }

      if (profile.argumentPatterns.counterargument?.objectionIntroducers &&
          profile.argumentPatterns.counterargument.objectionIntroducers.length > 0) {
        lines.push('- Acknowledge and address counterarguments');
      }
      lines.push('');
    }

    // Citation integration
    if (profile.citationIntegration) {
      lines.push('### Citation Style');

      if (profile.citationIntegration.introductionPatterns?.authorProminent &&
          profile.citationIntegration.introductionPatterns.authorProminent.length > 0) {
        lines.push('- Prefer author-prominent citations (X argues that...)');
      } else if (profile.citationIntegration.introductionPatterns?.informationProminent &&
                 profile.citationIntegration.introductionPatterns.informationProminent.length > 0) {
        lines.push('- Prefer information-prominent citations (Research shows...)');
      }

      if (profile.citationIntegration.quotationStyle?.quoteVerbs &&
          profile.citationIntegration.quotationStyle.quoteVerbs.length > 0) {
        lines.push('- Use varied quotation integration patterns');
      }

      if (profile.citationIntegration.synthesisPatterns?.contrastivePatterns &&
          profile.citationIntegration.synthesisPatterns.contrastivePatterns.length > 0) {
        lines.push('- Use comparative synthesis (X argues..., while Y contends...)');
      }
      lines.push('');
    }

    // Transition patterns
    if (profile.transitionPatterns?.sectionTransitions) {
      lines.push('### Transition Preferences');
      // Use section openers if available
      const transitions = profile.transitionPatterns.sectionTransitions.openers?.slice(0, 5) || [];
      for (const t of transitions) {
        lines.push(`- ${t}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateLearnedPatternsSection(
    contrastiveLearner: ContrastiveLearner | null,
    styleUpdater: IncrementalStyleUpdater | null,
    profileId: string
  ): string {
    const lines: string[] = [];

    // Contrastive patterns (current session)
    if (contrastiveLearner && contrastiveLearner.count > 0) {
      const consistent = contrastiveLearner.getConsistentPatterns().slice(0, 8);
      const anti = contrastiveLearner.getAntiPatterns().slice(0, 5);
      const positive = contrastiveLearner.getPositivePatterns().slice(0, 5);

      if (consistent.length > 0) {
        lines.push('### Session Patterns');
        for (const p of consistent) {
          lines.push(`- "${p.pattern}" → "${p.replacement}" (${(p.confidence * 100).toFixed(0)}%)`);
        }
        lines.push('');
      }

      if (anti.length > 0) {
        lines.push('### Patterns to Avoid');
        for (const p of anti) {
          lines.push(`- AVOID: "${p.pattern}" (${p.reason})`);
        }
        lines.push('');
      }

      if (positive.length > 0) {
        lines.push('### Patterns to Include');
        for (const p of positive) {
          lines.push(`- USE: "${p.pattern}" (${p.context})`);
        }
        lines.push('');
      }
    }

    // Style updater learned patterns
    if (styleUpdater) {
      const enhancement = styleUpdater.generateStyleEnhancementPrompt(profileId);
      if (enhancement) {
        lines.push('### Style Learning Updates');
        lines.push(enhancement);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private generateCitationTemplatesSection(templates: CitationTemplateSet): string {
    const lines: string[] = [];

    if (templates.authorProminent.length > 0) {
      lines.push('### Author-Prominent Citations');
      for (const t of templates.authorProminent.slice(0, 3)) {
        lines.push(`- ${t.pattern}`);
        lines.push(`  Example: "${t.example}"`);
      }
      lines.push('');
    }

    if (templates.informationProminent.length > 0) {
      lines.push('### Information-Prominent Citations');
      for (const t of templates.informationProminent.slice(0, 3)) {
        lines.push(`- ${t.pattern}`);
        lines.push(`  Example: "${t.example}"`);
      }
      lines.push('');
    }

    if (templates.synthesis.length > 0) {
      lines.push('### Synthesis Templates');
      for (const t of templates.synthesis.slice(0, 2)) {
        lines.push(`- ${t.pattern}`);
      }
      lines.push('');
    }

    if (templates.quotation.length > 0) {
      lines.push('### Quotation Integration');
      for (const t of templates.quotation.slice(0, 2)) {
        lines.push(`- ${t.pattern}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private generatePhenomenologicalSection(markers: PhenomenologicalMarkerPatterns): string {
    const lines: string[] = [];

    // Heideggerian vocabulary
    if (markers.heideggerian) {
      const hVocab = markers.heideggerian;
      lines.push('### Heideggerian Vocabulary');

      if (hVocab.daseinLanguage && hVocab.daseinLanguage.length > 0) {
        const terms = hVocab.daseinLanguage.slice(0, 5).map(t => t.term);
        lines.push(`- Dasein terms: ${terms.join(', ')}`);
      }

      if (hVocab.temporalityMarkers && hVocab.temporalityMarkers.length > 0) {
        const terms = hVocab.temporalityMarkers.slice(0, 5).map(t => t.term);
        lines.push(`- Temporality markers: ${terms.join(', ')}`);
      }

      if (hVocab.authenticityMarkers && hVocab.authenticityMarkers.length > 0) {
        const terms = hVocab.authenticityMarkers.slice(0, 5).map(t => t.term);
        lines.push(`- Authenticity terms: ${terms.join(', ')}`);
      }
      lines.push('');
    }

    // Aristotelian vocabulary
    if (markers.aristotelian) {
      const aVocab = markers.aristotelian;
      lines.push('### Aristotelian Vocabulary');

      if (aVocab.psycheTerms && aVocab.psycheTerms.length > 0) {
        const terms = aVocab.psycheTerms.slice(0, 5).map(t => t.term);
        lines.push(`- Psyche terms: ${terms.join(', ')}`);
      }

      if (aVocab.phantasiaTerms && aVocab.phantasiaTerms.length > 0) {
        const terms = aVocab.phantasiaTerms.slice(0, 5).map(t => t.term);
        lines.push(`- Phantasia terms: ${terms.join(', ')}`);
      }

      if (aVocab.perceptionTerms && aVocab.perceptionTerms.length > 0) {
        const terms = aVocab.perceptionTerms.slice(0, 5).map(t => t.term);
        lines.push(`- Perception terms: ${terms.join(', ')}`);
      }
      lines.push('');
    }

    // Greek term patterns
    if (markers.greekTerms) {
      lines.push('### Greek Term Usage');

      if (markers.greekTerms.transliterationStyle) {
        lines.push(`- Transliteration: ${markers.greekTerms.transliterationStyle}`);
      }

      if (markers.greekTerms.definitionPlacement) {
        lines.push(`- Definition placement: ${markers.greekTerms.definitionPlacement}`);
      }

      if (markers.greekTerms.frequentTerms && markers.greekTerms.frequentTerms.size > 0) {
        const terms = Array.from(markers.greekTerms.frequentTerms.keys()).slice(0, 5);
        lines.push(`- Key terms: ${terms.join(', ')}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getPriority(sectionId: string): number {
    const index = this.config.priorityOrder.indexOf(sectionId);
    return index >= 0 ? index : this.config.priorityOrder.length;
  }

  private truncateSections(sections: PromptSection[]): PromptSection[] {
    const totalChars = sections.reduce((sum, s) => sum + s.charCount, 0);
    const maxTotal = this.config.maxSectionLength * sections.length;

    if (totalChars <= maxTotal) {
      return sections;
    }

    // Truncate lower priority sections first
    const reversed = [...sections].reverse();
    let remaining = maxTotal;

    const result: PromptSection[] = [];
    for (const section of reversed) {
      if (remaining <= 0) {
        continue;
      }

      if (section.charCount <= remaining) {
        result.unshift(section);
        remaining -= section.charCount;
      } else {
        // Truncate this section
        const truncated = {
          ...section,
          content: section.content.substring(0, remaining - 100) + '\n... (truncated)',
          charCount: remaining,
        };
        result.unshift(truncated);
        remaining = 0;
      }
    }

    return result;
  }

  private combineSections(sections: PromptSection[]): string {
    const parts: string[] = [];

    for (const section of sections) {
      if (section.content.trim()) {
        parts.push(`## ${section.title}`);
        parts.push('');
        parts.push(section.content);
        parts.push('');
      }
    }

    return parts.join('\n').trim();
  }
}

/**
 * Create an enhancement prompt generator with default configuration
 */
export function createEnhancementPromptGenerator(
  config?: Partial<EnhancementPromptConfig>
): EnhancementPromptGenerator {
  return new EnhancementPromptGenerator(config);
}
