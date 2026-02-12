/**
 * Transition Generator - Generates transitions between segments
 *
 * This module generates smooth transitions between segments based on
 * their interface contracts. Transitions bridge the gap between what
 * one segment provides and what the next requires.
 *
 * @module transition-generator
 */

import type { SegmentInterface } from './segment-interface.js';

/**
 * Transition generation result
 */
export interface TransitionGenerationResult {
  /** Generated transitions */
  transitions: Transition[];

  /** Generation metadata */
  metadata: TransitionMetadata;
}

/**
 * Transition between segments
 */
export interface Transition {
  /** Transition ID */
  id: string;

  /** Source segment (segment before transition) */
  fromSegmentId: string;

  /** Target segment (segment after transition) */
  toSegmentId: string;

  /** Transition type */
  type: TransitionType;

  /** Generated transition text */
  text: string;

  /** Transition quality (0-1) */
  quality: number;

  /** Transition metadata */
  metadata: TransitionTextMetadata;
}

/**
 * Transition type
 */
export type TransitionType =
  | 'continuation'      // Continues same line of argument
  | 'elaboration'       // Elaborates on previous point
  | 'contrast'          // Contrasts with previous point
  | 'synthesis'         // Synthesizes previous points
  | 'pivot'             // Pivots to new topic
  | 'example'           // Provides example
  | 'application';      // Applies previous concept

/**
 * Transition text metadata
 */
export interface TransitionTextMetadata {
  /** Word count */
  wordCount: number;

  /** Addresses open tensions from previous segment */
  addressesOpenTensions: string[];

  /** Previews content from next segment */
  previewsConcepts: string[];

  /** Coherence score (0-1) */
  coherenceScore: number;
}

/**
 * Generation metadata
 */
export interface TransitionMetadata {
  /** Transitions generated */
  transitionsGenerated: number;

  /** Average transition quality */
  averageQuality: number;

  /** Average coherence score */
  averageCoherence: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * TransitionGenerator - Generates transitions between segments
 */
export class TransitionGenerator {
  /**
   * Generate transitions for all segments
   */
  async generate(segments: SegmentInterface[]): Promise<TransitionGenerationResult> {
    const startTime = Date.now();
    const transitions: Transition[] = [];

    // Generate transition between each pair of adjacent segments
    for (let i = 0; i < segments.length - 1; i++) {
      const fromSegment = segments[i];
      const toSegment = segments[i + 1];

      const transition = this.generateTransition(fromSegment, toSegment);
      transitions.push(transition);
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(transitions, Date.now() - startTime);

    return {
      transitions,
      metadata
    };
  }

  /**
   * Generate transition between two segments
   */
  private generateTransition(
    fromSegment: SegmentInterface,
    toSegment: SegmentInterface
  ): Transition {
    // Determine transition type
    const transitionType = this.determineTransitionType(fromSegment, toSegment);

    // Generate transition text
    const text = this.generateTransitionText(fromSegment, toSegment, transitionType);

    // Calculate quality
    const quality = this.assessTransitionQuality(text, fromSegment, toSegment);

    // Calculate coherence
    const coherenceScore = this.assessCoherence(text, fromSegment, toSegment);

    return {
      id: `transition-${fromSegment.id}-to-${toSegment.id}`,
      fromSegmentId: fromSegment.id,
      toSegmentId: toSegment.id,
      type: transitionType,
      text,
      quality,
      metadata: {
        wordCount: text.split(/\s+/).length,
        addressesOpenTensions: this.identifyAddressedTensions(fromSegment, toSegment),
        previewsConcepts: this.identifyPreviewedConcepts(toSegment),
        coherenceScore
      }
    };
  }

  /**
   * Determine transition type
   */
  private determineTransitionType(
    fromSegment: SegmentInterface,
    toSegment: SegmentInterface
  ): TransitionType {
    // Check if next segment uses outputs from previous
    const usesPreviousOutputs = toSegment.inputAssumptions.requiredClaims.some(claim =>
      fromSegment.outputContributions.claimsEstablished.some(contrib =>
        contrib.claim.id === claim.id
      )
    );

    if (usesPreviousOutputs) {
      return 'continuation';
    }

    // Check if next segment introduces contrasting point
    const hasContrastMarkers = toSegment.openTensions.some(t =>
      t.type === 'conceptual' || t.type === 'theoretical'
    );

    if (hasContrastMarkers) {
      return 'contrast';
    }

    // Check if next segment provides example
    const introducesExample = toSegment.outputContributions.knowledgeAdded.some(k =>
      k.description.toLowerCase().includes('example')
    );

    if (introducesExample) {
      return 'example';
    }

    // Default to elaboration
    return 'elaboration';
  }

  /**
   * Generate transition text
   */
  private generateTransitionText(
    fromSegment: SegmentInterface,
    toSegment: SegmentInterface,
    transitionType: TransitionType
  ): string {
    const templates = this.getTransitionTemplates(transitionType);

    // Select template based on context
    const template = templates[0]; // Simplified: use first template

    // Fill template with context
    return this.fillTemplate(template, fromSegment, toSegment);
  }

  /**
   * Get transition templates
   */
  private getTransitionTemplates(type: TransitionType): string[] {
    const templates: Record<TransitionType, string[]> = {
      continuation: [
        'Building on {previous_claim}, we now turn to {next_concept}.',
        'Having established {previous_claim}, the next step is to examine {next_concept}.',
        'This understanding of {previous_concept} provides the foundation for exploring {next_concept}.'
      ],
      elaboration: [
        'To elaborate on this point, consider {next_concept}.',
        'This requires further explanation. Specifically, {next_concept}.',
        'A more detailed examination reveals {next_concept}.'
      ],
      contrast: [
        'However, {next_concept} presents a contrasting perspective.',
        'In contrast to {previous_claim}, {next_concept} suggests an alternative view.',
        'Yet this account faces a challenge from {next_concept}.'
      ],
      synthesis: [
        'Synthesizing these perspectives, we can see that {next_concept}.',
        'Together, these insights reveal {next_concept}.',
        'The integration of these views yields {next_concept}.'
      ],
      pivot: [
        'Shifting focus to {next_concept}, we observe that...',
        'A different but related concern is {next_concept}.',
        'This brings us to the question of {next_concept}.'
      ],
      example: [
        'To illustrate this point, consider the example of {next_concept}.',
        'An instructive case is {next_concept}.',
        'This becomes clearer through the example of {next_concept}.'
      ],
      application: [
        'Applying this framework to {next_concept} reveals...',
        'When we apply this analysis to {next_concept}, we find that...',
        'This approach, applied to {next_concept}, demonstrates...'
      ]
    };

    return templates[type] || templates.continuation;
  }

  /**
   * Fill template with context
   */
  private fillTemplate(
    template: string,
    fromSegment: SegmentInterface,
    toSegment: SegmentInterface
  ): string {
    let filled = template;

    // Replace {previous_claim}
    if (fromSegment.outputContributions.claimsEstablished.length > 0) {
      const previousClaim = fromSegment.outputContributions.claimsEstablished[0].claim.claim;
      filled = filled.replace('{previous_claim}', this.summarize(previousClaim, 50));
    } else {
      filled = filled.replace('{previous_claim}', 'the previous point');
    }

    // Replace {previous_concept}
    if (fromSegment.outputContributions.conceptsIntroduced.length > 0) {
      const previousConcept = fromSegment.outputContributions.conceptsIntroduced[0].concept.term;
      filled = filled.replace('{previous_concept}', previousConcept);
    } else {
      filled = filled.replace('{previous_concept}', 'the previous concept');
    }

    // Replace {next_concept}
    if (toSegment.outputContributions.conceptsIntroduced.length > 0) {
      const nextConcept = toSegment.outputContributions.conceptsIntroduced[0].concept.term;
      filled = filled.replace('{next_concept}', nextConcept);
    } else if (toSegment.inputAssumptions.requiredConcepts.length > 0) {
      const nextConcept = toSegment.inputAssumptions.requiredConcepts[0].term;
      filled = filled.replace('{next_concept}', nextConcept);
    } else {
      filled = filled.replace('{next_concept}', 'the next topic');
    }

    return filled;
  }

  /**
   * Summarize text
   */
  private summarize(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Assess transition quality
   */
  private assessTransitionQuality(
    text: string,
    fromSegment: SegmentInterface,
    toSegment: SegmentInterface
  ): number {
    let quality = 0;

    // Length check (30-100 words is good)
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 30 && wordCount <= 100) {
      quality += 0.3;
    } else if (wordCount >= 15 && wordCount <= 150) {
      quality += 0.15;
    }

    // References previous content
    const referencesPrevious = fromSegment.outputContributions.claimsEstablished.some(contrib =>
      text.toLowerCase().includes(contrib.claim.claim.toLowerCase().substring(0, 20))
    );
    if (referencesPrevious) {
      quality += 0.3;
    }

    // Previews next content
    const previewsNext = toSegment.outputContributions.conceptsIntroduced.some(concept =>
      text.toLowerCase().includes(concept.concept.term.toLowerCase())
    );
    if (previewsNext) {
      quality += 0.2;
    }

    // Has transition markers
    const hasMarkers = /\b(however|moreover|furthermore|therefore|thus|building on|in contrast)\b/i.test(text);
    if (hasMarkers) {
      quality += 0.2;
    }

    return Math.min(1.0, quality);
  }

  /**
   * Assess coherence
   */
  private assessCoherence(
    text: string,
    fromSegment: SegmentInterface,
    toSegment: SegmentInterface
  ): number {
    let coherence = 0.5; // Base coherence

    // Uses concepts from both segments
    const usesFromConcepts = fromSegment.outputContributions.conceptsIntroduced.some(c =>
      text.toLowerCase().includes(c.concept.term.toLowerCase())
    );
    const usesToConcepts = toSegment.inputAssumptions.requiredConcepts.some(c =>
      text.toLowerCase().includes(c.term.toLowerCase())
    );

    if (usesFromConcepts && usesToConcepts) {
      coherence += 0.3;
    } else if (usesFromConcepts || usesToConcepts) {
      coherence += 0.15;
    }

    // Addresses open tensions
    const addressesTensions = fromSegment.openTensions.some(t =>
      toSegment.outputContributions.knowledgeAdded.some(k =>
        k.description.toLowerCase().includes(t.description.toLowerCase().substring(0, 20))
      )
    );
    if (addressesTensions) {
      coherence += 0.2;
    }

    return Math.min(1.0, coherence);
  }

  /**
   * Identify addressed tensions
   */
  private identifyAddressedTensions(
    fromSegment: SegmentInterface,
    toSegment: SegmentInterface
  ): string[] {
    return fromSegment.openTensions
      .filter(tension =>
        toSegment.outputContributions.knowledgeAdded.some(k =>
          k.description.toLowerCase().includes(tension.description.toLowerCase().substring(0, 20))
        )
      )
      .map(t => t.id);
  }

  /**
   * Identify previewed concepts
   */
  private identifyPreviewedConcepts(toSegment: SegmentInterface): string[] {
    return toSegment.outputContributions.conceptsIntroduced.map(c => c.concept.term);
  }

  /**
   * Calculate metadata
   */
  private calculateMetadata(
    transitions: Transition[],
    processingTime: number
  ): TransitionMetadata {
    const transitionsGenerated = transitions.length;

    const averageQuality = transitions.length > 0
      ? transitions.reduce((sum, t) => sum + t.quality, 0) / transitions.length
      : 0;

    const averageCoherence = transitions.length > 0
      ? transitions.reduce((sum, t) => sum + t.metadata.coherenceScore, 0) / transitions.length
      : 0;

    return {
      transitionsGenerated,
      averageQuality,
      averageCoherence,
      processingTime
    };
  }

  /**
   * Get detailed report
   */
  getDetailedReport(result: TransitionGenerationResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('TRANSITION GENERATION REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    // Metadata
    lines.push('GENERATION METADATA:');
    lines.push(`  Transitions generated: ${result.metadata.transitionsGenerated}`);
    lines.push(`  Average quality: ${(result.metadata.averageQuality * 100).toFixed(1)}%`);
    lines.push(`  Average coherence: ${(result.metadata.averageCoherence * 100).toFixed(1)}%`);
    lines.push(`  Processing time: ${result.metadata.processingTime}ms`);
    lines.push('');

    // Transitions
    if (result.transitions.length > 0) {
      lines.push('GENERATED TRANSITIONS:');
      lines.push('');

      for (const transition of result.transitions) {
        const qualityIcon = transition.quality >= 0.8 ? '🟢' :
                           transition.quality >= 0.6 ? '🟡' : '🔴';
        lines.push(`${qualityIcon} ${transition.fromSegmentId} → ${transition.toSegmentId}`);
        lines.push(`   Type: ${transition.type}`);
        lines.push(`   Quality: ${(transition.quality * 100).toFixed(0)}%`);
        lines.push(`   Coherence: ${(transition.metadata.coherenceScore * 100).toFixed(0)}%`);
        lines.push(`   Text: "${transition.text}"`);
        lines.push('');
      }
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}
