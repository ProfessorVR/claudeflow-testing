/**
 * Dependency Graph Builder - Construct paragraph dependencies
 *
 * This module builds dependency graphs by analyzing paragraph structure,
 * identifying prerequisites, and detecting violations.
 *
 * @module dependency-graph-builder
 */

import type {
  ParagraphNode,
  DependencyGraph,
  InputAssumptions,
  OutputContributions,
  ConceptualWork,
  GraphMetadata
} from '../sir/dependency-graph.js';

import type { ToulminClaim, ClaimMap } from '../sir/claim-map.js';
import type { ConceptLedger } from '../sir/concept-ledger.js';

import {
  buildDependencyEdges,
  topologicalSort,
  validateDependencyGraph,
  calculateGraphMetadata
} from '../sir/dependency-graph.js';

/**
 * Options for dependency graph building
 */
export interface DependencyGraphBuilderOptions {
  /** Source text to analyze */
  text: string;

  /** Claim map (for claim dependencies) */
  claimMap: ClaimMap;

  /** Concept ledger (for concept dependencies) */
  conceptLedger: ConceptLedger;

  /** Paragraph structure */
  paragraphs?: ParagraphStructure[];
}

/**
 * Paragraph structure
 */
export interface ParagraphStructure {
  /** Paragraph ID */
  id: string;

  /** Section ID */
  sectionId: string;

  /** Subsection ID (optional) */
  subsectionId?: string;

  /** Paragraph index */
  paragraphIndex: number;

  /** Paragraph text */
  text: string;

  /** Word count */
  wordCount: number;
}

/**
 * Result of dependency graph building
 */
export interface DependencyGraphBuildResult {
  /** Built dependency graph */
  graph: DependencyGraph;

  /** Build metadata */
  metadata: DependencyGraphBuildMetadata;
}

/**
 * Build metadata
 */
export interface DependencyGraphBuildMetadata {
  /** Paragraphs analyzed */
  paragraphsAnalyzed: number;

  /** Dependencies identified */
  dependenciesIdentified: number;

  /** Violations detected */
  violationsDetected: number;

  /** Graph is acyclic */
  isAcyclic: boolean;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * DependencyGraphBuilder - Main builder class
 */
export class DependencyGraphBuilder {
  private options: Required<DependencyGraphBuilderOptions>;
  private nodes: Map<string, ParagraphNode>;

  constructor(options: DependencyGraphBuilderOptions) {
    this.options = {
      ...options,
      paragraphs: options.paragraphs || this.extractParagraphs(options.text)
    };

    this.nodes = new Map();
  }

  /**
   * Build dependency graph
   */
  async build(): Promise<DependencyGraphBuildResult> {
    const startTime = Date.now();

    // Step 1: Build paragraph nodes
    for (const paragraph of this.options.paragraphs) {
      const node = await this.buildParagraphNode(paragraph);
      this.nodes.set(node.id, node);
    }

    // Step 2: Build dependency edges
    const edges = buildDependencyEdges(this.nodes);

    // Step 3: Compute topological sort
    const topologicalOrder = topologicalSort(this.nodes, edges);

    // Step 4: Validate graph
    const tempGraph: DependencyGraph = {
      nodes: this.nodes,
      edges,
      topologicalOrder,
      violations: [],
      metadata: {} as any
    };

    const validation = validateDependencyGraph(tempGraph);

    // Step 5: Calculate metadata
    const graphMetadata = calculateGraphMetadata({
      ...tempGraph,
      violations: validation.issues,
      metadata: {} as any
    });

    const graph: DependencyGraph = {
      nodes: this.nodes,
      edges,
      topologicalOrder,
      violations: validation.issues,
      metadata: graphMetadata
    };

    const processingTime = Date.now() - startTime;

    return {
      graph,
      metadata: {
        paragraphsAnalyzed: this.nodes.size,
        dependenciesIdentified: edges.size,
        violationsDetected: validation.issues.length,
        isAcyclic: topologicalOrder.length > 0,
        processingTime
      }
    };
  }

  /**
   * Build paragraph node from structure
   */
  private async buildParagraphNode(paragraph: ParagraphStructure): Promise<ParagraphNode> {
    // Extract purpose (topic sentence)
    const purpose = this.extractPurpose(paragraph.text);

    // Identify input assumptions
    const inputAssumptions = this.identifyInputAssumptions(paragraph);

    // Identify output contributions
    const outputContributions = this.identifyOutputContributions(paragraph);

    // Identify open tensions
    const openTensions = this.identifyOpenTensions(paragraph.text);

    // Classify conceptual work
    const conceptualWork = this.classifyConceptualWork(paragraph.text);

    return {
      id: paragraph.id,
      location: {
        sectionId: paragraph.sectionId,
        subsectionId: paragraph.subsectionId,
        paragraphIndex: paragraph.paragraphIndex,
        wordCount: paragraph.wordCount
      },
      purpose,
      inputAssumptions,
      outputContributions,
      openTensions,
      conceptualWork,
      metadata: {
        purposeFulfilled: true,
        transitionQuality: 0.8,
        dependencySatisfaction: 1.0,
        clarity: 0.85
      }
    };
  }

  /**
   * Extract purpose (topic sentence)
   */
  private extractPurpose(text: string): string {
    // Heuristic: first sentence is often topic sentence
    const sentences = text.split(/[.!?]+/);
    return sentences[0]?.trim() || 'Purpose not identified';
  }

  /**
   * Identify input assumptions
   */
  private identifyInputAssumptions(paragraph: ParagraphStructure): InputAssumptions {
    const requiredClaims: string[] = [];
    const requiredConcepts: string[] = [];
    const requiredThreads: string[] = [];
    const requiredKnowledge: string[] = [];

    // Check for claim references
    for (const claim of this.options.claimMap.claims) {
      // Check if paragraph references this claim
      if (this.referencesContent(paragraph.text, claim.claim)) {
        requiredClaims.push(claim.id);
      }
    }

    // Check for concept references
    for (const [term, entry] of this.options.conceptLedger.concepts) {
      if (paragraph.text.includes(term) &&
          !this.definesContent(paragraph.text, term)) {
        // Uses concept but doesn't define it = requires it
        requiredConcepts.push(term);
      }
    }

    return {
      requiredClaims,
      requiredConcepts,
      requiredThreads,
      requiredKnowledge
    };
  }

  /**
   * Identify output contributions
   */
  private identifyOutputContributions(paragraph: ParagraphStructure): OutputContributions {
    const claimsEstablished: string[] = [];
    const conceptsIntroduced: string[] = [];
    const threadsAdvanced: string[] = [];
    const knowledgeAdded: string[] = [];

    // Check if paragraph establishes any claims
    for (const claim of this.options.claimMap.claims) {
      if (this.establishesContent(paragraph.text, claim.claim)) {
        claimsEstablished.push(claim.id);
      }
    }

    // Check if paragraph introduces concepts
    for (const [term, entry] of this.options.conceptLedger.concepts) {
      if (entry.introducedAt.sectionId === paragraph.sectionId &&
          entry.introducedAt.paragraphIndex === paragraph.paragraphIndex) {
        conceptsIntroduced.push(term);
      }
    }

    return {
      claimsEstablished,
      conceptsIntroduced,
      threadsAdvanced,
      knowledgeAdded
    };
  }

  /**
   * Check if text references content
   */
  private referencesContent(text: string, content: string): boolean {
    // Check for partial match (30% of content words)
    const contentWords = content.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const textLower = text.toLowerCase();

    const matches = contentWords.filter(w => textLower.includes(w)).length;
    return matches >= contentWords.length * 0.3;
  }

  /**
   * Check if text defines content
   */
  private definesContent(text: string, term: string): boolean {
    const definitionPatterns = [
      new RegExp(`${term}\\s+(is|are)\\s+defined`, 'i'),
      new RegExp(`${term}:\\s+`, 'i'),
      new RegExp(`${term}\\s+(means?|refers? to)`, 'i')
    ];

    return definitionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if text establishes content
   */
  private establishesContent(text: string, content: string): boolean {
    // Check if paragraph asserts the claim
    const assertionMarkers = /\b(is|are|demonstrates?|shows?|proves?|establishes?)\b/i;

    return this.referencesContent(text, content) && assertionMarkers.test(text);
  }

  /**
   * Identify open tensions
   */
  private identifyOpenTensions(text: string): string[] {
    const tensions: string[] = [];

    const tensionMarkers = [
      /\b(however|although|yet|but)\b/i,
      /\b(tension|contradiction|paradox)\b/i,
      /\b(remains unclear|open question)\b/i
    ];

    for (const marker of tensionMarkers) {
      if (marker.test(text)) {
        tensions.push('Tension marker detected');
        break;
      }
    }

    return tensions;
  }

  /**
   * Classify conceptual work
   */
  private classifyConceptualWork(text: string): ConceptualWork {
    // Heuristic classification based on linguistic markers

    if (/\b(is defined|means?|refers? to)\b/i.test(text)) {
      return 'definition';
    }

    if (/\b(for (example|instance)|such as|consider)\b/i.test(text)) {
      return 'example';
    }

    if (/\b(however|in contrast|on the other hand|objection)\b/i.test(text)) {
      return 'counter-argument';
    }

    if (/\b(synthesiz|combin|integrat)\b/i.test(text)) {
      return 'synthesis';
    }

    if (/\b(moreover|furthermore|in addition|building on)\b/i.test(text)) {
      return 'transition';
    }

    if (/\b(evidence|data|study|research)\b/i.test(text)) {
      return 'evidence-presentation';
    }

    if (/\b(to clarify|in other words|put differently)\b/i.test(text)) {
      return 'clarification';
    }

    // Default
    return 'claim-establishment';
  }

  /**
   * Extract paragraphs from text
   */
  private extractParagraphs(text: string): ParagraphStructure[] {
    const paragraphs: ParagraphStructure[] = [];
    const blocks = text.split(/\n\n+/);

    let sectionId = '1';
    let paragraphIndex = 0;

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      // Check if section header
      if (this.isSectionHeader(trimmed)) {
        sectionId = this.extractSectionId(trimmed);
        paragraphIndex = 0;
        continue;
      }

      const wordCount = trimmed.split(/\s+/).length;

      paragraphs.push({
        id: `P${sectionId}.${paragraphIndex}`,
        sectionId,
        paragraphIndex,
        text: trimmed,
        wordCount
      });

      paragraphIndex++;
    }

    return paragraphs;
  }

  /**
   * Check if text is section header
   */
  private isSectionHeader(text: string): boolean {
    return /^#+\s/.test(text) || /^(Section|Chapter)\s+\d+/.test(text);
  }

  /**
   * Extract section ID from header
   */
  private extractSectionId(text: string): string {
    const match = text.match(/(\d+(\.\d+)*)/);
    return match ? match[1] : '1';
  }
}
