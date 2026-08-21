/**
 * Lanham Prose Analyst Agent
 * Conversational agent for analyzing arbitrary text using Lanham's method.
 * Modes: describe (non-evaluative analysis) | revise (local transformations)
 * See plan: plans/lanham-module-port-plan.md Phase 4
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ILanhamAnalyzer } from '../cli/style/lanham-analyzer-interface.js';
import type { LanhamProseMetrics } from '../universal/style-analyzer.js';
import type { LanhamStyleTarget } from '../universal/stages/stage-types.js';

export type AnalysisMode = 'describe' | 'revise' | 'critique' | 'teach';

export interface AnalysisTrajectory {
  id: string;
  name: string;
  source_chapter: number;
  source_pages: string;
  input_passage: string;
  steps: Array<{
    step: number;
    operation: string;
    axis: string;
    observation: string;
    finding: string;
  }>;
  axes_invoked: string[];
  analytical_vocabulary_used: string[];
  domain: string;
  tags: string[];
}

export interface RevisionPair {
  original: string;
  revised: string;
  axis: string;
  explanation: string;
}

export interface AnalysisResult {
  mode: AnalysisMode;
  metrics: LanhamProseMetrics;
  axisDescriptions: Array<{
    axis: string;
    label: string;
    explanation: string;
    evidence: string;
    confidence: string;
  }>;
  revisionPairs?: RevisionPair[];
  fullRewrite?: string;
  orchestratorInstructions?: string[];
  trajectoryUsed?: string;
  critiqueSummary?: string;
  teachingNarrative?: string;
}

export class LanhamProseAnalyst {
  private analyzer: ILanhamAnalyzer;
  private trajectories: AnalysisTrajectory[];

  constructor(analyzer: ILanhamAnalyzer) {
    this.analyzer = analyzer;
    this.trajectories = this.loadTrajectories();
  }

  private loadTrajectories(): AnalysisTrajectory[] {
    const trajPath = join(process.cwd(), 'god-learn', 'analysis-trajectories.jsonl');
    if (!existsSync(trajPath)) {
      return [];
    }
    const lines = readFileSync(trajPath, 'utf-8').trim().split('\n');
    return lines.filter(l => l.trim()).map(l => JSON.parse(l));
  }

  /**
   * Select the most relevant trajectory based on the text's dominant axis
   */
  private selectTrajectory(metrics: LanhamProseMetrics): AnalysisTrajectory | null {
    if (this.trajectories.length === 0) return null;

    // Prefer the full-method trajectory (Two Lemon Squeezers) if it exists
    const fullMethod = this.trajectories.find(t => t.tags.includes('full_method'));

    // Otherwise match on dominant axis
    if (metrics.labels.nounVerb !== 'balanced') {
      const nounVerb = this.trajectories.find(t => t.axes_invoked.includes('noun_verb'));
      if (nounVerb) return nounVerb;
    }
    if (metrics.labels.parataxisHypotaxis !== 'mixed') {
      const para = this.trajectories.find(t => t.axes_invoked.includes('parataxis_hypotaxis'));
      if (para) return para;
    }
    // Tacit patterns if notable density
    const tacitTotal = metrics.tacitPatterns.anaphoraCount + metrics.tacitPatterns.chiasmusCount + metrics.tacitPatterns.antithesisCount + metrics.tacitPatterns.isocolonCount + metrics.tacitPatterns.climaxPatternCount;
    if (tacitTotal > 3) {
      const tacit = this.trajectories.find(t => t.axes_invoked.includes('tacit_persuasion'));
      if (tacit) return tacit;
    }

    return fullMethod || this.trajectories[0] || null;
  }

  /**
   * Extract evidence passages from input text for each axis
   */
  private extractEvidence(text: string, axis: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return '(no evidence extractable)';

    switch (axis) {
      case 'nounVerb': {
        // Find sentence with highest nominalization density
        const nomRegex = /\b\w+(tion|ment|ness|ity|ence|ance|ism|ure)\b/gi;
        let best: string = sentences[0] ?? '';
        let bestCount = 0;
        for (const s of sentences) {
          const count = (s.match(nomRegex) || []).length;
          if (count > bestCount) { bestCount = count; best = s; }
        }
        return best.trim();
      }
      case 'parataxisHypotaxis': {
        // Find sentence with most coordinating or subordinating conjunctions
        const conjRegex = /\b(and|but|or|nor|yet|so|because|although|while|since|if|when|whereas|unless)\b/gi;
        let best: string = sentences[0] ?? '';
        let bestCount = 0;
        for (const s of sentences) {
          const count = (s.match(conjRegex) || []).length;
          if (count > bestCount) { bestCount = count; best = s; }
        }
        return best.trim();
      }
      case 'voice': {
        // Find the most rhythmically varied consecutive pair
        if (sentences.length < 2) return (sentences[0] ?? '').trim();
        let bestPair = sentences[0] + ' ' + sentences[1];
        let bestVariance = 0;
        for (let i = 0; i < sentences.length - 1; i++) {
          const len1 = sentences[i].split(/\s+/).length;
          const len2 = sentences[i + 1].split(/\s+/).length;
          const variance = Math.abs(len1 - len2);
          if (variance > bestVariance) {
            bestVariance = variance;
            bestPair = sentences[i].trim() + ' ' + sentences[i + 1].trim();
          }
        }
        return bestPair;
      }
      default:
        return sentences[Math.floor(sentences.length / 2)].trim();
    }
  }

  /**
   * Generate before/after revision pairs for noun-style issues
   */
  private generateRevisionPairs(text: string, metrics: LanhamProseMetrics): RevisionPair[] {
    const pairs: RevisionPair[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    // Noun -> verb transformations
    if (metrics.labels.nounVerb === 'predominantly noun-style') {
      const DENOMINALIZATIONS: Record<string, string> = {
        'implementation': 'implementing', 'assessment': 'assessing',
        'establishment': 'establishing', 'evaluation': 'evaluating',
        'determination': 'determining', 'investigation': 'investigating',
        'identification': 'identifying', 'classification': 'classifying',
        'examination': 'examining', 'administration': 'administering',
        'organization': 'organizing', 'utilization': 'utilizing',
        'application': 'applying', 'communication': 'communicating',
        'interpretation': 'interpreting', 'representation': 'representing',
        'consideration': 'considering', 'demonstration': 'demonstrating',
        'participation': 'participating', 'transformation': 'transforming',
        'development': 'developing', 'achievement': 'achieving',
        'management': 'managing', 'improvement': 'improving',
        'measurement': 'measuring', 'requirement': 'requiring',
        'arrangement': 'arranging', 'engagement': 'engaging',
        'enhancement': 'enhancing',
      };

      for (const s of sentences.slice(0, 20)) {
        const nomRegex = /\bthe\s+(\w+(?:tion|ment|ness|ity|ence|ance))\s+of\b/gi;
        const match = nomRegex.exec(s);
        if (match && pairs.length < 5) {
          const original = match[0];
          const noun = match[1];
          // Use lookup table first, fall back to heuristic for unknown words
          const nounLower = noun.toLowerCase();
          let verb = DENOMINALIZATIONS[nounLower];
          if (!verb) {
            // Heuristic fallback for words not in the lookup table
            verb = noun;
            if (noun.endsWith('tion')) verb = noun.slice(0, -4) + 'ting';
            else if (noun.endsWith('ment')) verb = noun.slice(0, -4) + 'ing';
            else if (noun.endsWith('ance')) verb = noun.slice(0, -4) + 'ing';
            else if (noun.endsWith('ence')) verb = noun.slice(0, -4) + 'ing';
          }
          pairs.push({
            original: original,
            revised: verb,
            axis: 'noun_verb',
            explanation: `De-nominalization: convert "the ${noun} of" to active verb form`,
          });
        }
      }
    }

    // Sentence length monotony
    if (metrics.dynamicRange < 0.3) {
      const lens = sentences.slice(0, 10).map(s => s.split(/\s+/).length);
      const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
      if (lens.every(l => Math.abs(l - avg) < 5)) {
        pairs.push({
          original: '(passage-level observation)',
          revised: 'Vary sentence length: follow a long periodic sentence with a short declarative one',
          axis: 'voice',
          explanation: 'Monotonous sentence length ("da da dum") suppresses voice. Rhythmic variety creates vocal presence.',
        });
      }
    }

    return pairs.slice(0, 5);
  }

  /**
   * Main analysis entry point
   * @param text - The prose passage to analyze
   * @param mode - Analysis mode: describe, revise, critique, or teach
   * @param options - Mode-specific options
   *   - styleTarget: required for critique mode, optional style target for evaluation
   *   - fullRewrite: when true in revise mode, returns a complete rewritten passage
   */
  async analyze(
    text: string,
    mode: AnalysisMode = 'describe',
    options?: { styleTarget?: LanhamStyleTarget; fullRewrite?: boolean },
  ): Promise<AnalysisResult> {
    const metrics = await this.analyzer.fullAnalysis(text);
    const trajectory = this.selectTrajectory(metrics);

    const axisDescriptions = [
      { axis: 'nounVerb', label: metrics.labels.nounVerb, explanation: metrics.explanations.nounVerb, confidence: metrics.confidenceByAxis.nounVerb },
      { axis: 'parataxisHypotaxis', label: metrics.labels.parataxisHypotaxis, explanation: metrics.explanations.parataxisHypotaxis, confidence: metrics.confidenceByAxis.parataxisHypotaxis },
      { axis: 'periodicRunning', label: metrics.labels.periodicRunning, explanation: metrics.explanations.periodicRunning, confidence: metrics.confidenceByAxis.periodicRunning },
      { axis: 'voice', label: metrics.labels.voice, explanation: metrics.explanations.voice, confidence: metrics.confidenceByAxis.voice },
      { axis: 'register', label: `${metrics.labels.primaryRegister}${metrics.labels.registerMixed ? ' (mixed)' : ''}`, explanation: metrics.explanations.register, confidence: metrics.confidenceByAxis.register },
      { axis: 'opacity', label: metrics.labels.opacity, explanation: metrics.explanations.opacity, confidence: metrics.confidenceByAxis.opacity },
      { axis: 'tacitPatterns', label: metrics.explanations.tacitPatterns || 'none detected', explanation: metrics.explanations.tacitPatterns, confidence: metrics.confidenceByAxis.tacitPatterns },
    ].map(desc => ({
      ...desc,
      evidence: this.extractEvidence(text, desc.axis),
    }));

    const result: AnalysisResult = {
      mode,
      metrics,
      axisDescriptions,
      trajectoryUsed: trajectory?.name,
    };

    if (mode === 'revise') {
      result.revisionPairs = this.generateRevisionPairs(text, metrics);
      result.orchestratorInstructions = this.generateOrchestratorInstructions(metrics);
      if (options?.fullRewrite) {
        result.fullRewrite = this.generateFullRewrite(text, metrics);
      }
    }

    if (mode === 'critique') {
      result.critiqueSummary = this.generateCritique(metrics, options?.styleTarget);
    }

    if (mode === 'teach') {
      result.teachingNarrative = this.generateTeachingNarrative(text, metrics);
    }

    return result;
  }

  /**
   * Critique mode: evaluate text against a declared style target.
   * Reports deviations from target, never from a universal norm.
   */
  private generateCritique(metrics: LanhamProseMetrics, target?: LanhamStyleTarget): string {
    const lines: string[] = [];

    if (!target) {
      lines.push('No explicit style target provided. Critique mode requires a LanhamStyleTarget to evaluate against.');
      lines.push('Without a target, only structural observations are possible — see describe mode.');
      return lines.join('\n');
    }

    lines.push(`Critique against declared target: genre=${target.genre}, AT/THROUGH=${target.atThroughMode}, voice=${target.voiceTarget}`);
    lines.push('');

    // Voice deviation
    const voiceMap: Record<string, [number, number]> = {
      'voiced': [0.60, 1.0],
      'moderate': [0.30, 0.70],
      'unvoiced': [0.0, 0.35],
    };
    const [voiceLo, voiceHi] = voiceMap[target.voiceTarget] ?? [0.30, 0.70];
    if (metrics.voiceScore < voiceLo) {
      lines.push(`VOICE: Given your target of "${target.voiceTarget}", the current text deviates on voice because it reads as too flat and unvoiced (score ${metrics.voiceScore.toFixed(2)}). The prose lacks the rhythmic variety and personality markers that "${target.voiceTarget}" voice requires. Increase sentence-length variance and allow authorial presence to surface.`);
    } else if (metrics.voiceScore > voiceHi) {
      lines.push(`VOICE: Given your target of "${target.voiceTarget}", the current text deviates on voice because it reads as too strongly voiced (score ${metrics.voiceScore.toFixed(2)}). The rhythmic personality overshoots what "${target.voiceTarget}" calls for. Consider dampening dynamic range or reducing first-person/personality markers.`);
    }

    // Opacity/AT-THROUGH deviation
    const opacityTargets: Record<string, [number, number]> = {
      'mostly transparent': [0.0, 0.25],
      'transparent with AT moments': [0.10, 0.40],
      'oscillating': [0.25, 0.65],
      'mostly opaque': [0.50, 1.0],
    };
    const [opaLo, opaHi] = opacityTargets[target.atThroughMode] ?? [0.0, 0.50];
    if (metrics.opacityScore < opaLo) {
      lines.push(`OPACITY: Given your target of "${target.atThroughMode}", the current text deviates on opacity because it is too transparent (score ${metrics.opacityScore.toFixed(2)}). The reader looks exclusively THROUGH the language without any AT moments. Your declared mode "${target.atThroughMode}" requires more self-conscious attention to the medium — add sound patterning, meta-linguistic gestures, or rhetorical display.`);
    } else if (metrics.opacityScore > opaHi) {
      lines.push(`OPACITY: Given your target of "${target.atThroughMode}", the current text deviates on opacity because the prose draws too much attention to itself as language (score ${metrics.opacityScore.toFixed(2)}). For "${target.atThroughMode}", reduce meta-linguistic markers and sound patterns so the reader can look THROUGH to the content more readily.`);
    }

    // Register deviation
    if (target.registerTarget) {
      const currentReg = metrics.labels.primaryRegister;
      if (currentReg !== target.registerTarget && target.registerTarget !== 'mixed') {
        lines.push(`REGISTER: Given your target of "${target.registerTarget}" register, the current text deviates because it reads as ${currentReg} register. ${
          target.registerTarget === 'high'
            ? 'Increase Latinate vocabulary density and sentence complexity; reduce contractions.'
            : target.registerTarget === 'low'
              ? 'Use shorter, Germanic-rooted words; allow contractions and colloquial phrasing.'
              : 'Balance Latinate and Germanic vocabulary to achieve the unmarked middle register.'
        }`);
      }
    }

    // Tacit persuasion deviation
    if (target.tacitPersuasionLevel) {
      const tp = metrics.tacitPatterns;
      const tacitTotal = tp.anaphoraCount + tp.chiasmusCount + tp.antithesisCount + tp.isocolonCount + tp.climaxPatternCount;
      const tacitThresholds: Record<string, [number, number]> = {
        'almost none': [0, 1],
        'some': [1, 4],
        'moderate': [3, 8],
        'dense': [6, Infinity],
      };
      const [tacitLo, tacitHi] = tacitThresholds[target.tacitPersuasionLevel] ?? [0, Infinity];
      if (tacitTotal < tacitLo) {
        lines.push(`TACIT PERSUASION: Given your target of "${target.tacitPersuasionLevel}" tacit patterns, the current text has too few formal figures (${tacitTotal} detected). Add anaphora, isocolon, or chiasmus to meet the density your genre expects.`);
      } else if (tacitTotal > tacitHi) {
        lines.push(`TACIT PERSUASION: Given your target of "${target.tacitPersuasionLevel}" tacit patterns, the current text is overdoing rhetorical figuration (${tacitTotal} detected). The formal patterning risks overwhelming the propositional content.`);
      }
    }

    if (lines.length <= 2) {
      lines.push('No significant deviations from declared target detected. The prose aligns with the specified style parameters.');
    }

    return lines.join('\n');
  }

  /**
   * Teach mode: metacommentary in Lanham's pedagogical style.
   * Uses AT/THROUGH vocabulary explicitly with duck/rabbit oscillation references.
   */
  private generateTeachingNarrative(text: string, metrics: LanhamProseMetrics): string {
    const lines: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    lines.push('--- LANHAM TEACHING NARRATIVE ---');
    lines.push('');
    lines.push('Think of the duck/rabbit figure from Wittgenstein. You cannot see both at once — you oscillate. Reading prose works the same way: you either look AT the words (their sound, shape, rhythm) or THROUGH them (to the meaning beyond). Lanham\'s entire analytical method asks you to practice this oscillation deliberately.');
    lines.push('');

    // AT/THROUGH gesture based on opacity
    if (metrics.opacityScore > 0.4) {
      // Find a sentence with sound patterns for the AT example
      const example = this.findATExample(sentences);
      lines.push(`Notice how in this passage you are frequently pulled to look AT the language itself. ${example ? `Consider: "${example.trim().substring(0, 150)}" — the formal patterning here (${this.identifyATMechanism(example)}) makes the words themselves visible. That is Lanham's "opaque" moment: the medium calls attention to itself, and you become self-conscious about reading.` : 'The density of formal patterning — sound, repetition, structural parallelism — keeps pulling your attention to the surface. You are looking AT the words, not just THROUGH them.'}`);
    } else if (metrics.opacityScore < 0.2) {
      lines.push('This prose is almost entirely transparent — you look THROUGH the words to the meaning without noticing the language itself. That is the C-B-S ideal: clear, brief, sincere prose that pretends it has no style. But Lanham would ask you to oscillate: force yourself to look AT these sentences for a moment. Notice the sentence lengths, the verb choices, the rhythm. Even "transparent" prose has formal properties — they are simply invisible because the culture has trained you not to notice them.');
    } else {
      lines.push('This passage oscillates between AT and THROUGH moments. Some sentences let you look directly through to the content; others slow you down and make you notice the language itself. That oscillation is not a defect — it is the fundamental rhythm of prose, and Lanham\'s descriptive method asks you to become conscious of it.');
    }
    lines.push('');

    // Noun/Verb teaching
    if (metrics.labels.nounVerb === 'predominantly noun-style') {
      lines.push('The noun-style texture here is worth attending to. When you see "the implementation of the strategy" instead of "implementing the strategy" or simply "they implemented it," you are witnessing what Lanham calls the Official Style. Nominalizations freeze action into abstract objects. Try Lanham\'s Paramedic Method: circle every "is" and every prepositional phrase, then ask "who is kicking whom?" That simple question often reveals the living verb buried under the nominal crust.');
    } else if (metrics.labels.nounVerb === 'predominantly verb-style') {
      lines.push('The verb-driven rhythm here creates forward momentum — you can almost hear it when you read aloud. Active verbs produce what Lanham calls a "kicking" style: who does what to whom is always clear. Now oscillate to the AT position and notice HOW that clarity works: short clauses, concrete subjects, verbs that actually move.');
    }
    lines.push('');

    // Voice teaching
    if (metrics.labels.voice === 'strongly voiced') {
      lines.push('There is a distinct personality in this prose — sentence lengths vary, emphasis shifts, rhythmic surprises occur. Lanham would say you can "hear" this writer. That voicedness is created by technique, not sincerity: dynamic range in sentence length, strategic variation between long periodic builds and short declarative punctuations. The voice is a formal property, even when it feels personal.');
    } else if (metrics.labels.voice === 'unvoiced') {
      lines.push('This prose has what Lanham calls an "unvoiced" quality — the sentences maintain a bureaucratic evenness, a "da da dum, da da dum" monotony. No single sentence surprises you with its length or rhythm. Try reading it aloud: the lack of vocal variety becomes immediately apparent. An unvoiced passage is not necessarily bad — technical documentation SHOULD be unvoiced — but the writer should choose this quality deliberately, not fall into it by default.');
    }

    // Architecture teaching
    if (metrics.labels.parataxisHypotaxis === 'predominantly paratactic') {
      lines.push('');
      lines.push('The paratactic architecture here — clause after clause linked by "and," "but," "or" without subordination — creates a distinctive effect. Hemingway built a career on it. Parataxis refuses to rank: every clause gets equal grammatical weight. That refusal has consequences for how the reader processes information — nothing is grammatically marked as more important than anything else. The reader must supply the hierarchy.');
    }

    return lines.join('\n');
  }

  /**
   * Find a sentence that works well as an AT-mode example
   */
  private findATExample(sentences: string[]): string | null {
    // Look for sentences with alliteration, repetition, or unusual structure
    for (const sent of sentences) {
      const words = sent.toLowerCase().split(/\s+/);
      // Check for alliteration (3+ words starting with same letter)
      for (let i = 0; i < words.length - 2; i++) {
        const a = words[i]?.[0];
        const b = words[i + 1]?.[0];
        const c = words[i + 2]?.[0];
        if (a && a === b && b === c && /[bcdfghjklmnpqrstvwxyz]/.test(a)) {
          return sent;
        }
      }
    }
    // Fallback: sentence with most rhetorical features (longest with commas)
    let best = sentences[0] || null;
    let bestScore = 0;
    for (const sent of sentences) {
      const commas = (sent.match(/,/g) || []).length;
      const semicolons = (sent.match(/;/g) || []).length;
      const score = commas + semicolons * 2 + sent.split(/\s+/).length / 10;
      if (score > bestScore) { bestScore = score; best = sent; }
    }
    return best;
  }

  /**
   * Identify what AT mechanism is at work in a given sentence
   */
  private identifyATMechanism(sentence: string): string {
    const mechanisms: string[] = [];
    const words = sentence.toLowerCase().split(/\s+/);

    // Alliteration
    for (let i = 0; i < words.length - 2; i++) {
      const a = words[i]?.[0];
      const b = words[i + 1]?.[0];
      const c = words[i + 2]?.[0];
      if (a && a === b && b === c && /[bcdfghjklmnpqrstvwxyz]/.test(a)) {
        mechanisms.push('alliteration');
        break;
      }
    }

    // Parallel structure (commas suggesting isocolon)
    const commas = (sentence.match(/,/g) || []).length;
    if (commas >= 2) mechanisms.push('parallel structure');

    // Repetition
    const wordSet = new Map<string, number>();
    for (const w of words) {
      if (w.length > 4) wordSet.set(w, (wordSet.get(w) || 0) + 1);
    }
    for (const [, count] of wordSet) {
      if (count >= 2) { mechanisms.push('repetition'); break; }
    }

    return mechanisms.length > 0 ? mechanisms.join(', ') : 'structural complexity';
  }

  /**
   * Full rewrite mode (v2 upgrade for revise):
   * Returns a complete rewritten passage applying all identified transformations.
   */
  private generateFullRewrite(text: string, metrics: LanhamProseMetrics): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return text;

    const rewritten: string[] = [];

    for (const sent of sentences) {
      let revised = sent;

      // Noun-to-verb de-nominalization
      if (metrics.labels.nounVerb === 'predominantly noun-style') {
        revised = revised.replace(
          /\bthe\s+(\w+)(tion|ment|ance|ence)\s+of\s+(\w+)/gi,
          (_, noun, suffix, obj) => {
            let verb = noun;
            if (suffix === 'tion') verb = noun + 'ting';
            else if (suffix === 'ment') verb = noun + 'ing';
            else if (suffix === 'ance' || suffix === 'ence') verb = noun + 'ing';
            return `${verb} ${obj}`;
          },
        );
        // Replace "is/are/was/were + [adjective]" with active verb where possible
        revised = revised.replace(
          /\b(is|are|was|were)\s+(not\s+)?(able|capable|responsible)\b/gi,
          (_, _be, neg, adj) => {
            const verbMap: Record<string, string> = { 'able': 'can', 'capable': 'can', 'responsible': 'must handle' };
            return `${neg || ''}${verbMap[adj.toLowerCase()] || adj}`;
          },
        );
      }

      rewritten.push(revised.trim());
    }

    // Rhythm improvement: if dynamic range is low, vary sentence lengths
    if (metrics.dynamicRange < 0.3 && rewritten.length > 3) {
      // Find the longest sentence and split it if possible
      let longestIdx = 0;
      let longestLen = 0;
      for (let i = 0; i < rewritten.length; i++) {
        const len = rewritten[i].split(/\s+/).length;
        if (len > longestLen) { longestLen = len; longestIdx = i; }
      }
      // Instead of inserting a literal sentence, add a revision instruction
      // for the writer to compose a short declarative sentence here.
      if (longestLen > 25) {
        rewritten.splice(longestIdx + 1, 0, '[REVISION: Insert a short, punchy declarative sentence here to break rhythmic monotony.]');
      }
    }

    return rewritten.join(' ');
  }

  /**
   * Generate prompt instructions for the orchestrator based on analysis
   */
  private generateOrchestratorInstructions(metrics: LanhamProseMetrics): string[] {
    const instructions: string[] = [];

    if (metrics.labels.nounVerb === 'predominantly noun-style') {
      instructions.push('For the next section, prefer active verbs and shorter clauses; convert "the X of Y" constructions to verb form.');
    }
    if (metrics.labels.voice === 'unvoiced') {
      instructions.push('Vary sentence length and rhythm. Insert a periodic sentence at key argumentative turns. Allow the prose to breathe.');
    }
    if (metrics.labels.parataxisHypotaxis === 'predominantly paratactic' && metrics.confidenceByAxis.parataxisHypotaxis !== 'low') {
      instructions.push('Consider adding subordinating structure to rank ideas; use "because", "although", "since" to create analytical hierarchy.');
    }
    if (metrics.labels.opacity === 'opaque' && metrics.confidenceByAxis.opacity !== 'low') {
      instructions.push('The prose is drawing attention to itself as language. If transparency is the target, reduce sound patterns and simplify syntax.');
    }

    return instructions;
  }

  /**
   * Format analysis result as human-readable text
   */
  formatAsText(result: AnalysisResult): string {
    const lines: string[] = [];
    lines.push('=== LANHAM PROSE ANALYSIS ===');
    lines.push(`Mode: ${result.mode}`);
    if (result.trajectoryUsed) {
      lines.push(`Analytical template: ${result.trajectoryUsed}`);
    }
    lines.push('');

    for (const desc of result.axisDescriptions) {
      lines.push(`${desc.axis.toUpperCase()}: ${desc.label}`);
      lines.push(`  Confidence: ${desc.confidence}`);
      lines.push(`  ${desc.explanation}`);
      lines.push(`  Evidence: "${desc.evidence.substring(0, 120)}${desc.evidence.length > 120 ? '...' : ''}"`);
      lines.push('');
    }

    if (result.revisionPairs && result.revisionPairs.length > 0) {
      lines.push('--- REVISION SUGGESTIONS ---');
      for (const pair of result.revisionPairs) {
        lines.push(`[${pair.axis}] "${pair.original}" -> "${pair.revised}"`);
        lines.push(`  ${pair.explanation}`);
      }
      lines.push('');
    }

    if (result.fullRewrite) {
      lines.push('--- FULL REWRITE ---');
      lines.push(result.fullRewrite);
      lines.push('');
    }

    if (result.orchestratorInstructions && result.orchestratorInstructions.length > 0) {
      lines.push('--- ORCHESTRATOR INSTRUCTIONS ---');
      for (const inst of result.orchestratorInstructions) {
        lines.push(`* ${inst}`);
      }
      lines.push('');
    }

    if (result.critiqueSummary) {
      lines.push('--- CRITIQUE ---');
      lines.push(result.critiqueSummary);
      lines.push('');
    }

    if (result.teachingNarrative) {
      lines.push(result.teachingNarrative);
      lines.push('');
    }

    return lines.join('\n');
  }
}
