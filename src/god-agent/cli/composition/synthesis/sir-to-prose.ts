/**
 * SIR-to-Prose Renderer
 *
 * This module renders Structured Intermediate Representations (SIR) into
 * natural language prose. It converts claim maps, concept ledgers, and
 * segment interfaces into coherent academic writing.
 *
 * @module sir-to-prose
 */

import type { ClaimMap, ToulminClaim } from '../sir/claim-map.js';
import type { ConceptLedger } from '../sir/concept-ledger.js';
import type { SegmentInterface } from '../interfaces/segment-interface.js';
import type { Transition } from '../interfaces/transition-generator.js';

/**
 * Prose rendering specification
 */
export interface ProseRenderSpec {
  /** Claim map to render */
  claimMap: ClaimMap;

  /** Concept ledger for term definitions */
  conceptLedger: ConceptLedger;

  /** Segment interface (optional, for context) */
  segmentInterface?: SegmentInterface;

  /** Transitions to include (optional) */
  transitions?: Transition[];

  /** Rendering style */
  style: {
    /** Academic style (formal, conversational, technical) */
    academicStyle: 'formal' | 'conversational' | 'technical';

    /** Citation style (APA, MLA, Chicago) */
    citationStyle: 'APA' | 'MLA' | 'Chicago';

    /** Paragraph density (sparse, moderate, dense) */
    paragraphDensity: 'sparse' | 'moderate' | 'dense';

    /** Use first person? */
    useFirstPerson: boolean;

    /** Include hedging language? */
    includeHedging: boolean;
  };

  /** Style profile name (optional, overrides style settings) */
  styleProfile?: string;
}

/**
 * Rendered prose result
 */
export interface ProseRenderResult {
  /** Rendered prose */
  prose: string;

  /** Metadata about rendering */
  metadata: ProseRenderMetadata;
}

/**
 * Prose render metadata
 */
export interface ProseRenderMetadata {
  /** Word count */
  wordCount: number;

  /** Paragraph count */
  paragraphCount: number;

  /** Claims rendered */
  claimsRendered: number;

  /** Concepts introduced */
  conceptsIntroduced: number;

  /** Citations included */
  citationsIncluded: number;

  /** Average paragraph length */
  averageParagraphLength: number;

  /** Rendering time (ms) */
  renderingTime: number;
}

/**
 * SIRToProseRenderer - Converts SIR to prose
 */
export class SIRToProseRenderer {
  /**
   * Render SIR to prose
   */
  async render(spec: ProseRenderSpec): Promise<ProseRenderResult> {
    const startTime = Date.now();

    // Step 1: Generate thesis paragraph
    const thesisParagraph = this.renderThesis(spec.claimMap.hierarchy.thesis, spec.style);

    // Step 2: Generate claim paragraphs
    const claimParagraphs = await this.renderClaims(spec.claimMap.claims, spec.style);

    // Step 3: Insert transitions (if provided)
    const paragraphsWithTransitions = this.insertTransitions(
      claimParagraphs,
      spec.transitions || [],
      spec.style
    );

    // Step 4: Insert concept definitions (if needed)
    const paragraphsWithDefinitions = this.insertDefinitions(
      [thesisParagraph, ...paragraphsWithTransitions],
      spec.conceptLedger,
      spec.style
    );

    // Step 5: Combine into final prose
    const prose = paragraphsWithDefinitions.join('\n\n');

    // Calculate metadata
    const metadata = this.calculateMetadata(
      prose,
      spec.claimMap,
      spec.conceptLedger,
      Date.now() - startTime
    );

    return {
      prose,
      metadata
    };
  }

  /**
   * Render thesis claim as opening paragraph
   */
  private renderThesis(thesis: ToulminClaim, style: ProseRenderSpec['style']): string {
    const parts: string[] = [];

    // Opening statement
    if (style.academicStyle === 'formal') {
      parts.push(`This section argues that ${thesis.claim.toLowerCase()}.`);
    } else if (style.academicStyle === 'conversational') {
      parts.push(`In this section, ${style.useFirstPerson ? 'I' : 'we'} argue that ${thesis.claim.toLowerCase()}.`);
    } else {
      parts.push(`${thesis.claim}.`);
    }

    // Add warrant if present
    if (thesis.warrant) {
      parts.push(thesis.warrant);
    }

    return parts.join(' ');
  }

  /**
   * Render claims as paragraphs
   */
  private async renderClaims(
    claims: ToulminClaim[],
    style: ProseRenderSpec['style']
  ): Promise<string[]> {
    const paragraphs: string[] = [];

    for (const claim of claims) {
      const paragraph = await this.renderClaim(claim, style);
      paragraphs.push(paragraph);
    }

    return paragraphs;
  }

  /**
   * Render single claim as paragraph
   */
  private async renderClaim(
    claim: ToulminClaim,
    style: ProseRenderSpec['style']
  ): Promise<string> {
    const sentences: string[] = [];

    // 1. Claim statement
    sentences.push(this.formatClaim(claim.claim, style));

    // 2. Grounds (evidence)
    if (claim.grounds.length > 0) {
      const evidenceSentence = this.formatGrounds(claim.grounds, style);
      sentences.push(evidenceSentence);
    }

    // 3. Warrant (reasoning)
    if (claim.warrant) {
      sentences.push(claim.warrant);
    }

    // 4. Backing (if present)
    if (claim.backing) {
      sentences.push(claim.backing);
    }

    // 5. Qualification (if present)
    if (claim.qualification) {
      // Insert qualification into claim statement
      sentences[0] = this.insertQualification(sentences[0], claim.qualification);
    }

    // 6. Rebuttal (if present)
    if (claim.rebuttal) {
      sentences.push(claim.rebuttal);
    }

    // 7. Citations (if present)
    if (claim.citations.length > 0) {
      const citedSentence = this.addCitations(
        sentences[sentences.length - 1],
        claim.citations,
        style.citationStyle
      );
      sentences[sentences.length - 1] = citedSentence;
    }

    return sentences.join(' ');
  }

  /**
   * Format claim statement
   */
  private formatClaim(claim: string, style: ProseRenderSpec['style']): string {
    // Ensure claim ends with period
    if (!claim.endsWith('.') && !claim.endsWith('?') && !claim.endsWith('!')) {
      return `${claim}.`;
    }
    return claim;
  }

  /**
   * Format grounds (evidence) as sentence
   */
  private formatGrounds(grounds: string[], style: ProseRenderSpec['style']): string {
    if (grounds.length === 1) {
      return `This is evidenced by ${grounds[0]}.`;
    } else if (grounds.length === 2) {
      return `This is supported by ${grounds[0]} and ${grounds[1]}.`;
    } else {
      const allButLast = grounds.slice(0, -1).join(', ');
      const last = grounds[grounds.length - 1];
      return `This is supported by ${allButLast}, and ${last}.`;
    }
  }

  /**
   * Insert qualification into claim
   */
  private insertQualification(claim: string, qualification: string): string {
    // Simple insertion before final punctuation
    const lastPunctuation = claim.match(/[.!?]$/);
    if (lastPunctuation) {
      return claim.slice(0, -1) + `, ${qualification}${lastPunctuation[0]}`;
    }
    return `${claim}, ${qualification}.`;
  }

  /**
   * Add citations to sentence
   */
  private addCitations(
    sentence: string,
    citations: any[],
    citationStyle: 'APA' | 'MLA' | 'Chicago'
  ): string {
    if (citations.length === 0) return sentence;

    // Format citations based on style
    const formattedCitations = citations.map(c => {
      if (citationStyle === 'APA') {
        return `${c.author}, ${c.year}`;
      } else if (citationStyle === 'MLA') {
        return c.author;
      } else {
        return `${c.author} ${c.year}`;
      }
    });

    // Remove final punctuation, add citation, re-add punctuation
    const lastPunctuation = sentence.match(/[.!?]$/);
    if (lastPunctuation) {
      const withoutPunc = sentence.slice(0, -1);
      return `${withoutPunc} (${formattedCitations.join('; ')})${lastPunctuation[0]}`;
    }
    return `${sentence} (${formattedCitations.join('; ')}).`;
  }

  /**
   * Insert transitions between paragraphs
   */
  private insertTransitions(
    paragraphs: string[],
    transitions: Transition[],
    style: ProseRenderSpec['style']
  ): string[] {
    if (transitions.length === 0) return paragraphs;

    const result: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      result.push(paragraphs[i]);

      // Check if there's a transition after this paragraph
      const transition = transitions.find(t =>
        t.fromSegmentId === `para-${i}` || i < paragraphs.length - 1
      );

      if (transition && i < paragraphs.length - 1) {
        // Prepend transition to next paragraph
        result.push(transition.text);
      }
    }

    return result;
  }

  /**
   * Insert concept definitions where needed
   */
  private insertDefinitions(
    paragraphs: string[],
    conceptLedger: ConceptLedger,
    style: ProseRenderSpec['style']
  ): string[] {
    // For now, just return paragraphs as-is
    // In a full implementation, would insert definitions at first usage
    return paragraphs;
  }

  /**
   * Calculate prose metadata
   */
  private calculateMetadata(
    prose: string,
    claimMap: ClaimMap,
    conceptLedger: ConceptLedger,
    renderingTime: number
  ): ProseRenderMetadata {
    const paragraphs = prose.split('\n\n').filter(p => p.trim().length > 0);
    const words = prose.split(/\s+/).filter(w => w.length > 0);

    const averageParagraphLength = paragraphs.length > 0
      ? words.length / paragraphs.length
      : 0;

    return {
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      claimsRendered: claimMap.claims.length,
      conceptsIntroduced: conceptLedger.concepts.size,
      citationsIncluded: claimMap.claims.reduce((sum, c) => sum + c.citations.length, 0),
      averageParagraphLength,
      renderingTime
    };
  }

  /**
   * Render with style profile
   */
  async renderWithStyleProfile(
    claimMap: ClaimMap,
    conceptLedger: ConceptLedger,
    styleProfile: any
  ): Promise<ProseRenderResult> {
    // Extract style settings from profile
    const style: ProseRenderSpec['style'] = {
      academicStyle: styleProfile.tone === 'academic' ? 'formal' : 'conversational',
      citationStyle: 'APA',
      paragraphDensity: 'moderate',
      useFirstPerson: styleProfile.voice === 'first-person',
      includeHedging: styleProfile.hedging !== 'minimal'
    };

    return this.render({
      claimMap,
      conceptLedger,
      style
    });
  }
}
