/**
 * Chapter Spec Mapper
 *
 * This module maps dissertation chapter structures to orchestration
 * specifications, converting high-level chapter outlines into detailed
 * micro-meso-macro specifications.
 *
 * @module chapter-spec-mapper
 */

import type { GodWriteIntegrationSpec, DocumentStructure, SectionStructure, SubsectionStructure } from './orchestrator-integration.js';

/**
 * Chapter outline
 */
export interface ChapterOutline {
  /** Chapter number */
  chapterNumber: number;

  /** Chapter title */
  title: string;

  /** Chapter thesis/argument */
  thesis: string;

  /** Chapter purpose */
  purpose: string;

  /** Target audience */
  targetAudience: string;

  /** Sections */
  sections: SectionOutline[];

  /** Style preferences */
  stylePreferences?: {
    academicStyle?: 'formal' | 'conversational' | 'technical';
    citationStyle?: 'APA' | 'MLA' | 'Chicago';
    useFirstPerson?: boolean;
  };
}

/**
 * Section outline
 */
export interface SectionOutline {
  /** Section title */
  title: string;

  /** Section thesis */
  thesis: string;

  /** Key points to make */
  keyPoints: string[];

  /** Evidence type for this section */
  evidenceType?: 'empirical' | 'theoretical' | 'analytical' | 'conceptual';

  /** Word count target (optional) */
  wordCountTarget?: number;
}

/**
 * ChapterSpecMapper - Converts chapter outlines to integration specs
 */
export class ChapterSpecMapper {
  /**
   * Map chapter outline to god-write integration spec
   */
  mapChapterToSpec(outline: ChapterOutline): GodWriteIntegrationSpec {
    // Build document structure
    const structure: DocumentStructure = {
      documentId: `chapter-${outline.chapterNumber}`,
      title: outline.title,
      sections: outline.sections.map((section, sectionIndex) =>
        this.mapSectionToStructure(section, sectionIndex, outline.chapterNumber)
      )
    };

    // Build integration spec
    return {
      documentType: 'chapter',
      documentPurpose: outline.purpose,
      targetAudience: outline.targetAudience,
      structure,
      styleProfile: outline.stylePreferences,
      verbose: true
    };
  }

  /**
   * Map section outline to section structure
   */
  private mapSectionToStructure(
    outline: SectionOutline,
    sectionIndex: number,
    chapterNumber: number
  ): SectionStructure {
    // Determine evidence type
    const evidenceType = outline.evidenceType || this.inferEvidenceType(outline.title, outline.keyPoints);

    // Split key points into subsections (group by 2-4 points)
    const subsections = this.groupKeyPointsIntoSubsections(
      outline.keyPoints,
      sectionIndex,
      chapterNumber,
      evidenceType,
      outline.wordCountTarget
    );

    return {
      sectionId: `section-${chapterNumber}.${sectionIndex + 1}`,
      title: outline.title,
      thesis: outline.thesis,
      subsections
    };
  }

  /**
   * Infer evidence type from section title and key points
   */
  private inferEvidenceType(
    title: string,
    keyPoints: string[]
  ): 'empirical' | 'theoretical' | 'analytical' | 'conceptual' {
    const titleLower = title.toLowerCase();
    const allText = [titleLower, ...keyPoints.map(k => k.toLowerCase())].join(' ');

    // Check for empirical indicators
    if (/\b(study|experiment|data|survey|observation|result|finding)\b/.test(allText)) {
      return 'empirical';
    }

    // Check for theoretical indicators
    if (/\b(theory|framework|model|concept|definition|principle)\b/.test(allText)) {
      return 'theoretical';
    }

    // Check for analytical indicators
    if (/\b(analysis|argument|critique|evaluation|comparison)\b/.test(allText)) {
      return 'analytical';
    }

    // Default to conceptual
    return 'conceptual';
  }

  /**
   * Group key points into subsections
   */
  private groupKeyPointsIntoSubsections(
    keyPoints: string[],
    sectionIndex: number,
    chapterNumber: number,
    evidenceType: 'empirical' | 'theoretical' | 'analytical' | 'conceptual',
    totalWordTarget?: number
  ): SubsectionStructure[] {
    const subsections: SubsectionStructure[] = [];
    const groupSize = 3; // Target 3 key points per subsection

    // Calculate word count per subsection
    const subsectionCount = Math.ceil(keyPoints.length / groupSize);
    const wordsPerSubsection = totalWordTarget
      ? Math.floor(totalWordTarget / subsectionCount)
      : 400; // Default 400 words per subsection

    for (let i = 0; i < keyPoints.length; i += groupSize) {
      const subsectionPoints = keyPoints.slice(i, i + groupSize);
      const subsectionIndex = Math.floor(i / groupSize);

      subsections.push({
        subsectionId: `section-${chapterNumber}.${sectionIndex + 1}.${subsectionIndex + 1}`,
        thesis: this.generateSubsectionThesis(subsectionPoints),
        targetClaims: subsectionPoints.map(point => ({
          statement: point,
          evidenceType,
          minEvidence: this.determineMinEvidence(evidenceType),
          requiresRebuttal: this.requiresRebuttal(point)
        })),
        inputAssumptions: {
          requiredClaims: subsectionIndex > 0 ? [`section-${chapterNumber}.${sectionIndex + 1}.${subsectionIndex}`] : [],
          requiredConcepts: []
        },
        wordCountTarget: {
          min: Math.floor(wordsPerSubsection * 0.8),
          max: Math.floor(wordsPerSubsection * 1.2)
        }
      });
    }

    return subsections;
  }

  /**
   * Generate subsection thesis from key points
   */
  private generateSubsectionThesis(keyPoints: string[]): string {
    if (keyPoints.length === 1) {
      return keyPoints[0];
    }

    // Create a general thesis that encompasses all points
    return `This subsection establishes that ${keyPoints.map(p => p.toLowerCase()).join(', and ')}`;
  }

  /**
   * Determine minimum evidence needed based on evidence type
   */
  private determineMinEvidence(evidenceType: 'empirical' | 'theoretical' | 'analytical' | 'conceptual'): number {
    switch (evidenceType) {
      case 'empirical':
        return 3; // Empirical claims need more evidence
      case 'theoretical':
        return 2; // Theoretical claims need moderate evidence
      case 'analytical':
        return 2; // Analytical claims need moderate evidence
      case 'conceptual':
        return 1; // Conceptual claims need less evidence
    }
  }

  /**
   * Determine if claim requires rebuttal
   */
  private requiresRebuttal(claim: string): boolean {
    const claimLower = claim.toLowerCase();

    // Controversial indicators
    const controversialIndicators = [
      'always',
      'never',
      'all',
      'none',
      'only',
      'must',
      'cannot',
      'impossible',
      'necessarily'
    ];

    return controversialIndicators.some(indicator =>
      new RegExp(`\\b${indicator}\\b`).test(claimLower)
    );
  }

  /**
   * Map simple outline (title + key points) to spec
   */
  mapSimpleOutline(
    title: string,
    keyPoints: string[],
    options?: {
      chapterNumber?: number;
      purpose?: string;
      targetAudience?: string;
      evidenceType?: 'empirical' | 'theoretical' | 'analytical' | 'conceptual';
    }
  ): GodWriteIntegrationSpec {
    const outline: ChapterOutline = {
      chapterNumber: options?.chapterNumber || 1,
      title,
      thesis: `This chapter argues that ${keyPoints[0]?.toLowerCase() || 'the following points are valid'}`,
      purpose: options?.purpose || 'Establish key arguments',
      targetAudience: options?.targetAudience || 'Academic researchers',
      sections: [
        {
          title: 'Main Arguments',
          thesis: `This section establishes that ${keyPoints.map(p => p.toLowerCase()).join(', and ')}`,
          keyPoints,
          evidenceType: options?.evidenceType
        }
      ]
    };

    return this.mapChapterToSpec(outline);
  }
}
