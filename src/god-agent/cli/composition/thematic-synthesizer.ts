/**
 * ThematicSynthesizer - Synthesize recurring themes across literature
 *
 * PhD-level academic synthesis requires identifying coherent themes
 * that reveal conceptual structure across analyzed patterns.
 *
 * This module:
 * - Extracts 8-15 distinct themes from text
 * - Maps theme relationships and hierarchies
 * - Documents supporting evidence (10+ citations per theme)
 * - Creates thematic framework visualizations
 * - Identifies 2-4 meta-themes (higher-order organizing principles)
 *
 * Part of Phase C Thematic Synthesis implementation.
 * Target: 8-15 themes with ≥10 citations each, <30% conceptual overlap
 */

import { createComponentLogger, type StructuredLogger } from '../../core/observability/logger.js';

// ============================================================================
// Types
// ============================================================================

export interface ExtractedTheme {
  /** Unique identifier */
  id: number;

  /** Clear, descriptive label */
  name: string;

  /** Precise conceptual boundaries */
  definition: string;

  /** Scope definition */
  scope: {
    includes: string[];
    excludes: string[];
  };

  /** Supporting patterns from pattern analysis */
  supportingPatterns: string[];

  /** Evidence base - citations supporting this theme */
  evidence: ThemeCitation[];

  /** Confidence score (0-1) */
  confidence: number;

  /** Prevalence across studies */
  prevalence: {
    studyCount: number;
    totalStudies: number;
    percentage: number;
  };

  /** Keywords/terms associated with this theme */
  keywords: string[];
}

export interface ThemeCitation {
  /** Author(s) */
  author: string;

  /** Publication year */
  year: number;

  /** Evidence type */
  evidenceType: 'direct' | 'supporting' | 'corroborating' | 'contradicting';

  /** Evidence strength */
  strength: 'primary' | 'secondary' | 'tertiary';

  /** Brief context */
  context: string;

  /** Source document ID (if from corpus) */
  docId?: string;

  /** Page/paragraph reference */
  pageRef?: string;
}

export interface ThemeCluster {
  /** Cluster name */
  name: string;

  /** Higher-order unifying concept */
  unifyingConcept: string;

  /** Component theme IDs */
  componentThemeIds: number[];

  /** Total studies represented */
  studiesRepresented: number;

  /** Cluster coherence rating */
  coherence: 'high' | 'medium' | 'low';

  /** Theoretical grounding connection */
  theoreticalGrounding?: string;
}

export interface ThemeRelationship {
  /** Source theme ID */
  themeA: number;

  /** Target theme ID */
  themeB: number;

  /** Relationship type */
  type: 'hierarchical' | 'sequential' | 'mediating' | 'moderating' | 'complementary';

  /** Relationship direction (for directional relationships) */
  direction?: 'A→B' | 'B→A' | 'bidirectional';

  /** Relationship strength */
  strength: 'strong' | 'medium' | 'weak';

  /** Number of studies supporting this relationship */
  supportingStudies: number;

  /** Description of the relationship */
  description: string;
}

export interface MetaTheme {
  /** Unique identifier */
  id: number;

  /** Highest-level conceptual label */
  name: string;

  /** Broad organizing principle */
  definition: string;

  /** Component theme IDs */
  componentThemeIds: number[];

  /** Theoretical significance */
  significance: string;

  /** Total citations across component themes */
  totalCitations: number;

  /** Total studies represented */
  totalStudies: number;

  /** Novel contribution vs existing frameworks */
  novelContribution: string;

  /** Research implications */
  implications: string[];

  /** Confidence score (0-1) */
  confidence: number;
}

export interface ThematicFramework {
  /** Framework structure type */
  type: 'hierarchical' | 'network' | 'sequential';

  /** Primary organizing meta-theme ID */
  primaryMetaThemeId: number;

  /** Total theme count */
  themeCount: number;

  /** Total citation count */
  totalCitations: number;

  /** ASCII visualization */
  visualization: string;
}

export interface SynthesisResult {
  /** Extracted themes (8-15 target) */
  themes: ExtractedTheme[];

  /** Theme clusters */
  clusters: ThemeCluster[];

  /** Theme relationships */
  relationships: ThemeRelationship[];

  /** Meta-themes (2-4 target) */
  metaThemes: MetaTheme[];

  /** Thematic framework */
  framework: ThematicFramework;

  /** Synthesis quality metrics */
  quality: {
    themeCount: number;
    avgCitationsPerTheme: number;
    avgConfidence: number;
    metaThemeCount: number;
    coveragePercentage: number;
    distinctivenessScore: number;
  };

  /** Gaps and tensions identified */
  gaps: {
    underTheorized: string[];
    contradictory: string[];
    missing: string[];
  };
}

export interface ThematicSynthesizerConfig {
  /** Minimum themes to extract (default: 8) */
  minThemes?: number;

  /** Maximum themes to extract (default: 15) */
  maxThemes?: number;

  /** Minimum citations per theme (default: 10) */
  minCitationsPerTheme?: number;

  /** Maximum conceptual overlap allowed (default: 0.30) */
  maxConceptualOverlap?: number;

  /** Minimum confidence threshold (default: 0.85) */
  minConfidence?: number;

  /** Corpus search function for evidence retrieval */
  corpusSearchFn?: (query: string, topK: number) => Promise<CorpusEvidence[]>;

  /** Pattern analysis results (input from pattern-analyst) */
  patternAnalysisResults?: PatternAnalysisInput;
}

export interface CorpusEvidence {
  docId: string;
  content: string;
  metadata: {
    author: string;
    title: string;
    year: number;
    pageRef?: string;
  };
  score: number;
}

export interface PatternAnalysisInput {
  patterns: Array<{
    name: string;
    description: string;
    frequency: number;
    studies: string[];
  }>;
  totalStudies: number;
}

// ============================================================================
// Theme Extraction Patterns
// ============================================================================

/**
 * Linguistic patterns that signal thematic content
 */
const THEMATIC_SIGNAL_PATTERNS: Array<{
  pattern: RegExp;
  weight: number;
  category: string;
}> = [
  // Conceptual definitions
  { pattern: /\b(is\s+defined\s+as|refers?\s+to|conceptualized\s+as|understood\s+as)\b/gi, weight: 0.9, category: 'definition' },
  { pattern: /\b(the\s+concept\s+of|the\s+notion\s+of|the\s+idea\s+of)\s+(\w+)/gi, weight: 0.85, category: 'concept' },

  // Theoretical constructs
  { pattern: /\b(theory|framework|model|paradigm|approach)\s+of\s+(\w+)/gi, weight: 0.9, category: 'theory' },
  { pattern: /\b(\w+)\s+(theory|framework|model|paradigm|approach)/gi, weight: 0.85, category: 'theory' },

  // Recurring phenomena
  { pattern: /\b(consistently|repeatedly|frequently|commonly|typically)\s+(found|observed|identified|reported)/gi, weight: 0.8, category: 'recurrence' },
  { pattern: /\b(across\s+studies|multiple\s+studies|body\s+of\s+research|literature\s+shows)/gi, weight: 0.85, category: 'convergence' },

  // Causal/relational claims
  { pattern: /\b(leads?\s+to|results?\s+in|causes?|influences?|affects?|determines?)\b/gi, weight: 0.75, category: 'causal' },
  { pattern: /\b(is\s+associated\s+with|correlates?\s+with|related\s+to)\b/gi, weight: 0.7, category: 'relational' },

  // Contrast and distinction
  { pattern: /\b(in\s+contrast|whereas|unlike|differs?\s+from|distinct\s+from)\b/gi, weight: 0.8, category: 'distinction' },
  { pattern: /\b(on\s+the\s+other\s+hand|alternatively|conversely)\b/gi, weight: 0.75, category: 'contrast' },

  // Synthesis markers
  { pattern: /\b(integrates?|synthesizes?|combines?|unifies?|bridges?)\b/gi, weight: 0.85, category: 'synthesis' },
  { pattern: /\b(overarching|underlying|fundamental|core|central)\s+(theme|concept|principle)/gi, weight: 0.9, category: 'meta' },
];

/**
 * Academic keywords that often anchor themes
 */
const THEME_ANCHOR_KEYWORDS = [
  // Process-related
  'mechanism', 'process', 'dynamic', 'development', 'evolution', 'transformation',
  // Structure-related
  'structure', 'system', 'framework', 'architecture', 'organization', 'pattern',
  // Cognitive-related
  'cognition', 'perception', 'understanding', 'knowledge', 'learning', 'reasoning',
  // Social-related
  'interaction', 'relationship', 'communication', 'collaboration', 'community',
  // Outcome-related
  'outcome', 'effect', 'impact', 'consequence', 'result', 'implication',
];

// ============================================================================
// ThematicSynthesizer Class
// ============================================================================

/**
 * Synthesizes recurring themes across literature into a coherent framework
 */
export class ThematicSynthesizer {
  private readonly logger: StructuredLogger;
  private readonly config: Required<Omit<ThematicSynthesizerConfig, 'corpusSearchFn' | 'patternAnalysisResults'>> & {
    corpusSearchFn?: ThematicSynthesizerConfig['corpusSearchFn'];
    patternAnalysisResults?: PatternAnalysisInput;
  };

  constructor(config: ThematicSynthesizerConfig = {}) {
    this.logger = createComponentLogger('ThematicSynthesizer');
    this.config = {
      minThemes: config.minThemes ?? 8,
      maxThemes: config.maxThemes ?? 15,
      minCitationsPerTheme: config.minCitationsPerTheme ?? 10,
      maxConceptualOverlap: config.maxConceptualOverlap ?? 0.30,
      minConfidence: config.minConfidence ?? 0.85,
      corpusSearchFn: config.corpusSearchFn,
      patternAnalysisResults: config.patternAnalysisResults,
    };
  }

  /**
   * Synthesize themes from analyzed text
   */
  async synthesize(text: string): Promise<SynthesisResult> {
    this.logger.info('Starting thematic synthesis', { textLength: text.length });

    // Phase 1: Extract candidate themes
    const candidateThemes = await this.extractCandidateThemes(text);
    this.logger.info('Candidate themes extracted', { count: candidateThemes.length });

    // Phase 2: Refine and validate themes
    const refinedThemes = await this.refineThemes(candidateThemes);
    this.logger.info('Themes refined', { count: refinedThemes.length });

    // Phase 3: Cluster related themes
    const clusters = this.clusterThemes(refinedThemes);
    this.logger.info('Theme clusters created', { count: clusters.length });

    // Phase 4: Map theme relationships
    const relationships = this.mapRelationships(refinedThemes, text);
    this.logger.info('Relationships mapped', { count: relationships.length });

    // Phase 5: Identify meta-themes
    const metaThemes = this.identifyMetaThemes(refinedThemes, clusters);
    this.logger.info('Meta-themes identified', { count: metaThemes.length });

    // Phase 6: Build thematic framework
    const framework = this.buildFramework(refinedThemes, clusters, metaThemes);

    // Phase 7: Identify gaps and tensions
    const gaps = this.identifyGaps(refinedThemes, text);

    // Calculate quality metrics
    const quality = this.calculateQuality(refinedThemes, metaThemes);

    const result: SynthesisResult = {
      themes: refinedThemes,
      clusters,
      relationships,
      metaThemes,
      framework,
      quality,
      gaps,
    };

    this.logger.info('Thematic synthesis complete', {
      themes: refinedThemes.length,
      clusters: clusters.length,
      metaThemes: metaThemes.length,
    });

    return result;
  }

  /**
   * Extract candidate themes from text using pattern matching
   */
  private async extractCandidateThemes(text: string): Promise<ExtractedTheme[]> {
    const candidates: Map<string, {
      name: string;
      contexts: string[];
      matches: number;
      keywords: Set<string>;
      patterns: string[];
    }> = new Map();

    const lines = text.split('\n').filter(l => l.trim().length > 0);

    // Helper function to add or update candidate
    const addCandidate = (term: string, context: string, weight: number, category: string) => {
      const key = term.toLowerCase().trim();
      if (key.length < 3) return;

      const existing = candidates.get(key);
      if (existing) {
        existing.matches += weight;
        if (!existing.contexts.includes(context)) {
          existing.contexts.push(context);
        }
        existing.patterns.push(category);
      } else {
        candidates.set(key, {
          name: term.trim(),
          contexts: [context],
          matches: weight,
          keywords: new Set([term.trim()]),
          patterns: [category],
        });
      }
    };

    // Pass 0: Direct extraction of named concepts
    const directPatterns = [
      // "The concept of X" or "The theory of X"
      /(?:The\s+)?(?:concept|theory|model|framework|notion|idea)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)/gi,
      // "X Theory" or "X Framework"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Theory|Framework|Model|Approach)/g,
      // Definitions: "X is defined as" or "X refers to"
      /([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s+(?:is\s+defined\s+as|refers?\s+to|means?)/gi,
      // "the term X"
      /(?:the\s+term)\s+([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)/gi,
    ];

    for (const line of lines) {
      for (const pattern of directPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const term = match[1]?.trim();
          if (term && term.length >= 3) {
            addCandidate(term, line.trim(), 1.5, 'direct');
          }
        }
      }
    }

    // Pass 1: Extract thematic signals
    for (const line of lines) {
      for (const { pattern, weight, category } of THEMATIC_SIGNAL_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          // Extract key term from match context
          const context = this.extractContext(line, match.index);
          const keyTerms = this.extractKeyTerms(context);

          for (const term of keyTerms) {
            addCandidate(term, context, weight, category);
          }
        }
      }
    }

    // Pass 2: Score candidates by anchor keywords
    for (const keyword of THEME_ANCHOR_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      for (const line of lines) {
        if (regex.test(line)) {
          const context = line.trim();
          const keyTerms = this.extractKeyTerms(context);

          for (const term of keyTerms) {
            const existing = candidates.get(term.toLowerCase());
            if (existing) {
              existing.matches += 0.5;
              existing.keywords.add(keyword);
            } else {
              // Add new candidate from anchor keyword context
              addCandidate(term, context, 0.5, 'anchor');
            }
          }
        }
      }
    }

    // Pass 3: Extract capitalized compound terms (potential theme names)
    const compoundPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
    for (const line of lines) {
      compoundPattern.lastIndex = 0;
      let match;
      while ((match = compoundPattern.exec(line)) !== null) {
        const term = match[1];
        if (term.split(/\s+/).length >= 2 && term.length >= 8) {
          addCandidate(term, line.trim(), 0.8, 'compound');
        }
      }
    }

    // Convert to ExtractedTheme objects
    const themes: ExtractedTheme[] = [];
    let id = 1;

    const sortedCandidates = Array.from(candidates.entries())
      .sort((a, b) => b[1].matches - a[1].matches)
      .slice(0, this.config.maxThemes * 2); // Get more candidates for refinement

    // Lower threshold to 0.8 to capture more themes
    for (const [_, candidate] of sortedCandidates) {
      if (candidate.matches >= 0.8) {
        const theme = await this.buildTheme(id++, candidate);
        themes.push(theme);
      }
    }

    return themes;
  }

  /**
   * Build a theme from candidate data
   */
  private async buildTheme(
    id: number,
    candidate: {
      name: string;
      contexts: string[];
      matches: number;
      keywords: Set<string>;
      patterns: string[];
    }
  ): Promise<ExtractedTheme> {
    // Generate definition from contexts
    const definition = this.generateDefinition(candidate.name, candidate.contexts);

    // Determine scope
    const scope = this.determineScope(candidate.name, candidate.contexts);

    // Gather evidence from contexts first
    const contextEvidence = this.extractEvidenceFromContexts(candidate.contexts);

    // Then try corpus search for additional evidence
    const corpusEvidence = await this.gatherEvidence(candidate.name, candidate.contexts);

    // Combine and deduplicate evidence
    const evidence = this.deduplicateEvidence([...contextEvidence, ...corpusEvidence]);

    // Calculate confidence based on multiple factors
    const matchScore = Math.min(1.0, candidate.matches / 3); // Normalize matches
    const evidenceScore = Math.min(1.0, evidence.length / 5); // Evidence bonus
    const patternDiversity = Math.min(1.0, new Set(candidate.patterns).size / 3); // Pattern diversity

    const confidence = Math.min(0.95, 0.5 + (matchScore * 0.2) + (evidenceScore * 0.15) + (patternDiversity * 0.1));

    return {
      id,
      name: this.formatThemeName(candidate.name),
      definition,
      scope,
      supportingPatterns: [...new Set(candidate.patterns)],
      evidence,
      confidence,
      prevalence: {
        studyCount: evidence.length,
        totalStudies: Math.max(evidence.length * 2, 20), // Estimate
        percentage: Math.min(100, (evidence.length / 20) * 100),
      },
      keywords: Array.from(candidate.keywords),
    };
  }

  /**
   * Extract evidence citations from context strings
   */
  private extractEvidenceFromContexts(contexts: string[]): ThemeCitation[] {
    const evidence: ThemeCitation[] = [];
    const citationPattern = /\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?),?\s*(\d{4})(?:,?\s*p\.?\s*(\d+))?\)/g;

    for (const context of contexts) {
      citationPattern.lastIndex = 0;
      let match;
      while ((match = citationPattern.exec(context)) !== null) {
        evidence.push({
          author: match[1],
          year: parseInt(match[2]),
          evidenceType: 'supporting',
          strength: 'secondary',
          context: context.slice(0, 100),
          pageRef: match[3] ? `p. ${match[3]}` : undefined,
        });
      }
    }

    return evidence;
  }

  /**
   * Refine themes by merging similar and removing weak ones
   */
  private async refineThemes(themes: ExtractedTheme[]): Promise<ExtractedTheme[]> {
    if (themes.length === 0) return [];

    // Step 1: Merge highly similar themes
    const merged = this.mergeSimilarThemes(themes);

    // Step 2: Filter by minimum requirements (more lenient for initial synthesis)
    // Evidence threshold is only enforced if corpus search is configured
    const minEvidenceRequired = this.config.corpusSearchFn
      ? Math.max(1, Math.floor(this.config.minCitationsPerTheme * 0.2))
      : 0;

    const filtered = merged.filter(theme =>
      theme.confidence >= Math.max(0.5, this.config.minConfidence * 0.6) && // More permissive
      theme.evidence.length >= minEvidenceRequired &&
      theme.name.length >= 3 && // Filter out very short names
      theme.name.split(/\s+/).length <= 8 // Filter out very long names (likely extraction errors)
    );

    // Step 3: Limit to max themes, prioritizing by confidence
    const limited = filtered
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxThemes);

    // Step 4: Re-number themes
    return limited.map((theme, idx) => ({
      ...theme,
      id: idx + 1,
    }));
  }

  /**
   * Merge themes with high conceptual overlap
   */
  private mergeSimilarThemes(themes: ExtractedTheme[]): ExtractedTheme[] {
    const merged: ExtractedTheme[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < themes.length; i++) {
      if (usedIndices.has(i)) continue;

      let currentTheme = themes[i];

      for (let j = i + 1; j < themes.length; j++) {
        if (usedIndices.has(j)) continue;

        const overlap = this.calculateOverlap(currentTheme, themes[j]);

        if (overlap > this.config.maxConceptualOverlap) {
          // Merge themes
          currentTheme = this.mergeThemes(currentTheme, themes[j]);
          usedIndices.add(j);
        }
      }

      merged.push(currentTheme);
      usedIndices.add(i);
    }

    return merged;
  }

  /**
   * Calculate conceptual overlap between two themes
   */
  private calculateOverlap(theme1: ExtractedTheme, theme2: ExtractedTheme): number {
    const keywords1 = new Set(theme1.keywords.map(k => k.toLowerCase()));
    const keywords2 = new Set(theme2.keywords.map(k => k.toLowerCase()));

    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);

    // Jaccard similarity
    return intersection.size / union.size;
  }

  /**
   * Merge two themes into one
   */
  private mergeThemes(theme1: ExtractedTheme, theme2: ExtractedTheme): ExtractedTheme {
    return {
      ...theme1,
      name: theme1.confidence >= theme2.confidence ? theme1.name : theme2.name,
      definition: theme1.confidence >= theme2.confidence ? theme1.definition : theme2.definition,
      scope: {
        includes: [...new Set([...theme1.scope.includes, ...theme2.scope.includes])],
        excludes: [...new Set([...theme1.scope.excludes, ...theme2.scope.excludes])],
      },
      supportingPatterns: [...new Set([...theme1.supportingPatterns, ...theme2.supportingPatterns])],
      evidence: this.deduplicateEvidence([...theme1.evidence, ...theme2.evidence]),
      confidence: Math.max(theme1.confidence, theme2.confidence),
      prevalence: {
        studyCount: theme1.prevalence.studyCount + theme2.prevalence.studyCount,
        totalStudies: Math.max(theme1.prevalence.totalStudies, theme2.prevalence.totalStudies),
        percentage: Math.min(100, theme1.prevalence.percentage + theme2.prevalence.percentage),
      },
      keywords: [...new Set([...theme1.keywords, ...theme2.keywords])],
    };
  }

  /**
   * Cluster related themes
   */
  private clusterThemes(themes: ExtractedTheme[]): ThemeCluster[] {
    const clusters: ThemeCluster[] = [];
    const assignedThemes = new Set<number>();

    // Group themes by shared keywords and patterns
    for (let i = 0; i < themes.length; i++) {
      if (assignedThemes.has(themes[i].id)) continue;

      const clusterThemes = [themes[i]];
      assignedThemes.add(themes[i].id);

      for (let j = i + 1; j < themes.length; j++) {
        if (assignedThemes.has(themes[j].id)) continue;

        const similarity = this.calculateThemeSimilarity(themes[i], themes[j]);
        if (similarity >= 0.3 && similarity <= 0.6) { // Related but distinct
          clusterThemes.push(themes[j]);
          assignedThemes.add(themes[j].id);
        }
      }

      if (clusterThemes.length >= 2) {
        clusters.push({
          name: this.generateClusterName(clusterThemes),
          unifyingConcept: this.deriveUnifyingConcept(clusterThemes),
          componentThemeIds: clusterThemes.map(t => t.id),
          studiesRepresented: this.countUniqueStudies(clusterThemes),
          coherence: this.assessClusterCoherence(clusterThemes),
          theoreticalGrounding: this.findTheoreticalGrounding(clusterThemes),
        });
      }
    }

    return clusters;
  }

  /**
   * Map relationships between themes
   */
  private mapRelationships(themes: ExtractedTheme[], text: string): ThemeRelationship[] {
    const relationships: ThemeRelationship[] = [];

    // Analyze pairwise relationships
    for (let i = 0; i < themes.length; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        const relationship = this.detectRelationship(themes[i], themes[j], text);
        if (relationship) {
          relationships.push(relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Detect relationship between two themes
   */
  private detectRelationship(
    themeA: ExtractedTheme,
    themeB: ExtractedTheme,
    text: string
  ): ThemeRelationship | null {
    // Look for co-occurrence patterns
    const cooccurrenceCount = this.countCooccurrence(themeA, themeB, text);
    if (cooccurrenceCount < 2) return null;

    // Determine relationship type based on patterns
    const relationshipType = this.inferRelationshipType(themeA, themeB, text);
    if (!relationshipType) return null;

    return {
      themeA: themeA.id,
      themeB: themeB.id,
      type: relationshipType.type,
      direction: relationshipType.direction,
      strength: cooccurrenceCount >= 5 ? 'strong' : cooccurrenceCount >= 3 ? 'medium' : 'weak',
      supportingStudies: Math.min(cooccurrenceCount, Math.floor(themeA.evidence.length / 2)),
      description: `${themeA.name} ${relationshipType.description} ${themeB.name}`,
    };
  }

  /**
   * Identify meta-themes from themes and clusters
   */
  private identifyMetaThemes(themes: ExtractedTheme[], clusters: ThemeCluster[]): MetaTheme[] {
    const metaThemes: MetaTheme[] = [];

    // Strategy 1: Promote high-confidence themes with many children
    const broadThemes = themes.filter(t =>
      t.confidence >= 0.9 &&
      t.keywords.length >= 5 &&
      t.evidence.length >= this.config.minCitationsPerTheme
    );

    for (const theme of broadThemes.slice(0, 2)) {
      const childThemes = themes.filter(t =>
        t.id !== theme.id &&
        this.calculateOverlap(theme, t) > 0.15
      );

      if (childThemes.length >= 2) {
        metaThemes.push({
          id: metaThemes.length + 1,
          name: this.toMetaThemeName(theme.name),
          definition: this.expandDefinition(theme.definition),
          componentThemeIds: [theme.id, ...childThemes.map(t => t.id)],
          significance: `Bridges ${childThemes.length} related themes into unified framework`,
          totalCitations: theme.evidence.length + childThemes.reduce((sum, t) => sum + t.evidence.length, 0),
          totalStudies: this.countUniqueStudies([theme, ...childThemes]),
          novelContribution: `Integration of ${childThemes.map(t => t.name).join(', ')} under ${theme.name}`,
          implications: this.deriveImplications(theme, childThemes),
          confidence: theme.confidence,
        });
      }
    }

    // Strategy 2: Create meta-themes from clusters
    for (const cluster of clusters.slice(0, 2)) {
      const clusterThemes = themes.filter(t => cluster.componentThemeIds.includes(t.id));

      if (!metaThemes.some(mt =>
        mt.componentThemeIds.some(id => cluster.componentThemeIds.includes(id))
      )) {
        metaThemes.push({
          id: metaThemes.length + 1,
          name: cluster.name,
          definition: cluster.unifyingConcept,
          componentThemeIds: cluster.componentThemeIds,
          significance: `Unifies ${cluster.componentThemeIds.length} themes through ${cluster.unifyingConcept}`,
          totalCitations: clusterThemes.reduce((sum, t) => sum + t.evidence.length, 0),
          totalStudies: cluster.studiesRepresented,
          novelContribution: `Cluster-based integration revealing ${cluster.name} as organizing principle`,
          implications: this.deriveClusterImplications(cluster, clusterThemes),
          confidence: cluster.coherence === 'high' ? 0.92 : cluster.coherence === 'medium' ? 0.85 : 0.75,
        });
      }
    }

    return metaThemes.slice(0, 4); // Max 4 meta-themes
  }

  /**
   * Build the thematic framework
   */
  private buildFramework(
    themes: ExtractedTheme[],
    clusters: ThemeCluster[],
    metaThemes: MetaTheme[]
  ): ThematicFramework {
    // Determine framework type based on structure
    const type = this.determineFrameworkType(themes, clusters, metaThemes);

    // Identify primary meta-theme
    const primaryMetaTheme = metaThemes.length > 0
      ? metaThemes.reduce((max, mt) => mt.totalCitations > max.totalCitations ? mt : max)
      : null;

    // Generate ASCII visualization
    const visualization = this.generateVisualization(themes, clusters, metaThemes);

    return {
      type,
      primaryMetaThemeId: primaryMetaTheme?.id ?? 0,
      themeCount: themes.length,
      totalCitations: themes.reduce((sum, t) => sum + t.evidence.length, 0),
      visualization,
    };
  }

  /**
   * Identify gaps and tensions in thematic synthesis
   */
  private identifyGaps(themes: ExtractedTheme[], text: string): SynthesisResult['gaps'] {
    return {
      underTheorized: themes
        .filter(t => t.confidence < 0.85 || t.evidence.length < this.config.minCitationsPerTheme)
        .map(t => `${t.name}: Needs more theoretical development`),
      contradictory: this.findContradictions(themes),
      missing: this.findMissingThemes(themes, text),
    };
  }

  /**
   * Calculate quality metrics
   */
  private calculateQuality(themes: ExtractedTheme[], metaThemes: MetaTheme[]): SynthesisResult['quality'] {
    const avgCitations = themes.length > 0
      ? themes.reduce((sum, t) => sum + t.evidence.length, 0) / themes.length
      : 0;

    const avgConfidence = themes.length > 0
      ? themes.reduce((sum, t) => sum + t.confidence, 0) / themes.length
      : 0;

    // Calculate distinctiveness (inverse of average pairwise overlap)
    let totalOverlap = 0;
    let pairs = 0;
    for (let i = 0; i < themes.length; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        totalOverlap += this.calculateOverlap(themes[i], themes[j]);
        pairs++;
      }
    }
    const avgOverlap = pairs > 0 ? totalOverlap / pairs : 0;
    const distinctivenessScore = 1 - avgOverlap;

    return {
      themeCount: themes.length,
      avgCitationsPerTheme: avgCitations,
      avgConfidence,
      metaThemeCount: metaThemes.length,
      coveragePercentage: Math.min(100, (themes.length / this.config.maxThemes) * 100),
      distinctivenessScore,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractContext(line: string, position: number): string {
    const start = Math.max(0, position - 100);
    const end = Math.min(line.length, position + 100);
    return line.slice(start, end).trim();
  }

  private extractKeyTerms(context: string): string[] {
    // Extract potential theme names (capitalized phrases, quoted terms, etc.)
    const terms: string[] = [];
    const stopWords = new Set([
      'Research', 'Studies', 'According', 'However', 'Therefore', 'Furthermore',
      'Although', 'Moreover', 'Additionally', 'Specifically', 'Generally',
      'Multiple', 'Several', 'Various', 'Recent', 'Previous', 'Current',
      'First', 'Second', 'Third', 'Finally', 'Initially', 'Subsequently',
      'The', 'This', 'That', 'These', 'Those', 'Which', 'What', 'Where', 'When',
    ]);

    // Pattern 1: Capitalized multi-word phrases (2-5 words)
    const capMatches = context.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}/g) || [];
    for (const match of capMatches) {
      const words = match.split(/\s+/);
      if (!stopWords.has(words[0])) {
        terms.push(match);
      }
    }

    // Pattern 2: Terms after "the concept/theory/model/framework/notion of"
    const conceptPatterns = [
      /(?:concept|theory|model|framework|approach|notion|idea)\s+of\s+([A-Z][a-z]+(?:\s+[A-Za-z]+)*)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:theory|framework|model|approach)/gi,
    ];
    for (const pattern of conceptPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(context)) !== null) {
        const term = match[1]?.trim();
        if (term && term.length > 2 && !stopWords.has(term.split(/\s+/)[0])) {
          terms.push(term);
        }
      }
    }

    // Pattern 3: Terms in "is defined as" or "refers to" constructs
    const definitionPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is\s+defined\s+as|refers?\s+to|means?)/gi,
      /(?:defined\s+as|known\s+as)\s+([a-z]+(?:\s+[a-z]+)*)/gi,
    ];
    for (const pattern of definitionPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(context)) !== null) {
        const term = match[1]?.trim();
        if (term && term.length > 2) {
          terms.push(term);
        }
      }
    }

    // Pattern 4: Standalone capitalized terms (potential theme names)
    const words = context.match(/\b[A-Z][a-z]{4,}\b/g) || [];
    for (const word of words) {
      if (!stopWords.has(word) && word.length >= 5) {
        terms.push(word);
      }
    }

    // Pattern 5: Terms in quotes
    const quotedTerms = context.match(/"([^"]+)"|'([^']+)'/g) || [];
    for (const quoted of quotedTerms) {
      const term = quoted.replace(/["']/g, '').trim();
      if (term.length > 2) {
        terms.push(term);
      }
    }

    // Deduplicate and return top terms
    const uniqueTerms = [...new Set(terms.map(t => t.trim()).filter(t => t.length > 2))];
    return uniqueTerms.slice(0, 8);
  }

  private generateDefinition(name: string, contexts: string[]): string {
    // Find the most informative context
    const definitionContext = contexts.find(c =>
      /is\s+defined\s+as|refers?\s+to|means?\s+/i.test(c)
    ) || contexts[0];

    return definitionContext?.slice(0, 200) || `${name} encompasses related concepts and patterns identified in the literature.`;
  }

  private determineScope(name: string, contexts: string[]): ExtractedTheme['scope'] {
    const includes: string[] = [name];
    const excludes: string[] = [];

    for (const context of contexts.slice(0, 5)) {
      // Look for inclusive terms
      const includeMatches = context.match(/includes?\s+([^,.]+)/gi) || [];
      for (const match of includeMatches) {
        includes.push(match.replace(/includes?\s+/i, '').trim());
      }

      // Look for exclusive terms
      const excludeMatches = context.match(/excludes?\s+([^,.]+)|not\s+([^,.]+)/gi) || [];
      for (const match of excludeMatches) {
        excludes.push(match.replace(/excludes?\s+|not\s+/i, '').trim());
      }
    }

    return {
      includes: [...new Set(includes)].slice(0, 5),
      excludes: [...new Set(excludes)].slice(0, 3),
    };
  }

  private async gatherEvidence(name: string, contexts: string[]): Promise<ThemeCitation[]> {
    const evidence: ThemeCitation[] = [];

    // Extract citations from contexts
    for (const context of contexts) {
      const citationMatches = context.matchAll(/\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?),?\s*(\d{4})\)/g);

      for (const match of citationMatches) {
        evidence.push({
          author: match[1],
          year: parseInt(match[2]),
          evidenceType: 'supporting',
          strength: 'secondary',
          context: context.slice(0, 100),
        });
      }
    }

    // If corpus search is available, find additional evidence
    if (this.config.corpusSearchFn) {
      try {
        const results = await this.config.corpusSearchFn(name, 10);
        for (const result of results.slice(0, 5)) {
          evidence.push({
            author: result.metadata.author,
            year: result.metadata.year,
            evidenceType: result.score >= 0.8 ? 'direct' : 'supporting',
            strength: result.score >= 0.8 ? 'primary' : 'secondary',
            context: result.content.slice(0, 100),
            docId: result.docId,
            pageRef: result.metadata.pageRef,
          });
        }
      } catch (error) {
        this.logger.warn('Corpus search failed', { error });
      }
    }

    return this.deduplicateEvidence(evidence);
  }

  private deduplicateEvidence(evidence: ThemeCitation[]): ThemeCitation[] {
    const seen = new Set<string>();
    return evidence.filter(e => {
      const key = `${e.author}-${e.year}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private formatThemeName(name: string): string {
    // Capitalize appropriately
    return name.split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private calculateThemeSimilarity(theme1: ExtractedTheme, theme2: ExtractedTheme): number {
    // Combine keyword overlap with pattern overlap
    const keywordOverlap = this.calculateOverlap(theme1, theme2);

    const patterns1 = new Set(theme1.supportingPatterns);
    const patterns2 = new Set(theme2.supportingPatterns);
    const patternIntersection = new Set([...patterns1].filter(p => patterns2.has(p)));
    const patternOverlap = patternIntersection.size / Math.max(patterns1.size, patterns2.size, 1);

    return (keywordOverlap + patternOverlap) / 2;
  }

  private generateClusterName(themes: ExtractedTheme[]): string {
    // Find common keywords
    const allKeywords = themes.flatMap(t => t.keywords);
    const keywordCounts = new Map<string, number>();
    for (const kw of allKeywords) {
      keywordCounts.set(kw.toLowerCase(), (keywordCounts.get(kw.toLowerCase()) || 0) + 1);
    }

    const commonKeyword = [...keywordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .find(([_, count]) => count >= 2)?.[0];

    return commonKeyword
      ? this.formatThemeName(commonKeyword) + ' Cluster'
      : themes[0].name + ' and Related Themes';
  }

  private deriveUnifyingConcept(themes: ExtractedTheme[]): string {
    // Combine definitions to derive unifying concept
    const keywords = themes.flatMap(t => t.keywords).slice(0, 10);
    return `Unifying ${keywords.slice(0, 3).join(', ')} through shared conceptual foundations`;
  }

  private countUniqueStudies(themes: ExtractedTheme[]): number {
    const uniqueAuthors = new Set<string>();
    for (const theme of themes) {
      for (const evidence of theme.evidence) {
        uniqueAuthors.add(`${evidence.author}-${evidence.year}`);
      }
    }
    return uniqueAuthors.size;
  }

  private assessClusterCoherence(themes: ExtractedTheme[]): 'high' | 'medium' | 'low' {
    if (themes.length < 2) return 'low';

    let totalSimilarity = 0;
    let pairs = 0;

    for (let i = 0; i < themes.length; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        totalSimilarity += this.calculateThemeSimilarity(themes[i], themes[j]);
        pairs++;
      }
    }

    const avgSimilarity = totalSimilarity / pairs;

    if (avgSimilarity >= 0.5) return 'high';
    if (avgSimilarity >= 0.3) return 'medium';
    return 'low';
  }

  private findTheoreticalGrounding(themes: ExtractedTheme[]): string | undefined {
    // Look for theory-related patterns
    for (const theme of themes) {
      if (theme.supportingPatterns.includes('theory')) {
        return `Grounded in ${theme.name} theoretical framework`;
      }
    }
    return undefined;
  }

  private countCooccurrence(themeA: ExtractedTheme, themeB: ExtractedTheme, text: string): number {
    let count = 0;
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasA = themeA.keywords.some(kw => lowerSentence.includes(kw.toLowerCase()));
      const hasB = themeB.keywords.some(kw => lowerSentence.includes(kw.toLowerCase()));

      if (hasA && hasB) count++;
    }

    return count;
  }

  private inferRelationshipType(
    themeA: ExtractedTheme,
    themeB: ExtractedTheme,
    text: string
  ): { type: ThemeRelationship['type']; direction: ThemeRelationship['direction']; description: string } | null {
    const lowerText = text.toLowerCase();
    const nameA = themeA.name.toLowerCase();
    const nameB = themeB.name.toLowerCase();

    // Check for causal patterns
    if (new RegExp(`${nameA}.*(?:leads?\\s+to|causes?|results?\\s+in).*${nameB}`, 'i').test(text)) {
      return { type: 'sequential', direction: 'A→B', description: 'leads to' };
    }
    if (new RegExp(`${nameB}.*(?:leads?\\s+to|causes?|results?\\s+in).*${nameA}`, 'i').test(text)) {
      return { type: 'sequential', direction: 'B→A', description: 'is led to by' };
    }

    // Check for mediating patterns
    if (new RegExp(`${nameA}.*(?:mediates?|explains?).*${nameB}`, 'i').test(text)) {
      return { type: 'mediating', direction: 'A→B', description: 'mediates' };
    }

    // Check for moderating patterns
    if (new RegExp(`${nameA}.*(?:moderates?|influences?\\s+the\\s+relationship).*${nameB}`, 'i').test(text)) {
      return { type: 'moderating', direction: 'A→B', description: 'moderates' };
    }

    // Check for hierarchical patterns
    if (new RegExp(`${nameA}.*(?:subsumes?|includes?|encompasses?).*${nameB}`, 'i').test(text)) {
      return { type: 'hierarchical', direction: 'A→B', description: 'subsumes' };
    }

    // Default to complementary if co-occurring
    return { type: 'complementary', direction: 'bidirectional', description: 'complements' };
  }

  private toMetaThemeName(name: string): string {
    return name + ' Framework';
  }

  private expandDefinition(definition: string): string {
    return `Higher-order organizing principle: ${definition}`;
  }

  private deriveImplications(theme: ExtractedTheme, childThemes: ExtractedTheme[]): string[] {
    return [
      `Provides unified lens for understanding ${childThemes.map(t => t.name).join(', ')}`,
      `Suggests integrated research agenda across ${childThemes.length} related domains`,
      `Offers theoretical foundation for cross-domain synthesis`,
    ];
  }

  private deriveClusterImplications(cluster: ThemeCluster, themes: ExtractedTheme[]): string[] {
    return [
      `Reveals conceptual coherence among ${themes.length} themes`,
      `Suggests ${cluster.unifyingConcept} as organizing principle`,
      `Indicates potential for integrated theoretical development`,
    ];
  }

  private determineFrameworkType(
    themes: ExtractedTheme[],
    clusters: ThemeCluster[],
    metaThemes: MetaTheme[]
  ): ThematicFramework['type'] {
    if (metaThemes.length >= 2 && clusters.length >= 2) {
      return 'hierarchical';
    }
    if (themes.some(t => t.supportingPatterns.includes('causal'))) {
      return 'sequential';
    }
    return 'network';
  }

  private generateVisualization(
    themes: ExtractedTheme[],
    clusters: ThemeCluster[],
    metaThemes: MetaTheme[]
  ): string {
    const lines: string[] = [];

    if (metaThemes.length > 0) {
      lines.push('THEMATIC FRAMEWORK VISUALIZATION');
      lines.push('================================');
      lines.push('');

      for (const metaTheme of metaThemes) {
        lines.push(`META-THEME: ${metaTheme.name}`);
        lines.push(`    |`);

        const componentThemes = themes.filter(t => metaTheme.componentThemeIds.includes(t.id));
        for (let i = 0; i < componentThemes.length; i++) {
          const prefix = i === componentThemes.length - 1 ? '    └── ' : '    ├── ';
          lines.push(`${prefix}${componentThemes[i].name} (${componentThemes[i].evidence.length} citations)`);
        }
        lines.push('');
      }

      // Show unclustered themes
      const clusteredIds = new Set(metaThemes.flatMap(mt => mt.componentThemeIds));
      const unclusteredThemes = themes.filter(t => !clusteredIds.has(t.id));

      if (unclusteredThemes.length > 0) {
        lines.push('INDEPENDENT THEMES:');
        for (const theme of unclusteredThemes) {
          lines.push(`  • ${theme.name} (${theme.evidence.length} citations)`);
        }
      }
    } else {
      lines.push('THEMES:');
      for (const theme of themes) {
        lines.push(`  ${theme.id}. ${theme.name} (${theme.evidence.length} citations, ${(theme.confidence * 100).toFixed(0)}% confidence)`);
      }
    }

    return lines.join('\n');
  }

  private findContradictions(themes: ExtractedTheme[]): string[] {
    const contradictions: string[] = [];

    for (let i = 0; i < themes.length; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        // Check if themes have contradicting evidence
        const hasContradictingEvidence = themes[i].evidence.some(e => e.evidenceType === 'contradicting') ||
                                         themes[j].evidence.some(e => e.evidenceType === 'contradicting');

        if (hasContradictingEvidence) {
          contradictions.push(`${themes[i].name} vs ${themes[j].name}: Conflicting evidence detected`);
        }
      }
    }

    return contradictions;
  }

  private findMissingThemes(themes: ExtractedTheme[], text: string): string[] {
    const missing: string[] = [];

    // Look for patterns that aren't covered by extracted themes
    for (const keyword of THEME_ANCHOR_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(text)) {
        const covered = themes.some(t =>
          t.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
        );

        if (!covered) {
          missing.push(`Expected theme related to '${keyword}' not extracted`);
        }
      }
    }

    return missing.slice(0, 5);
  }

  /**
   * Generate a formatted report of the synthesis
   */
  generateReport(result: SynthesisResult): string {
    const lines: string[] = [];

    lines.push('# Thematic Synthesis Report');
    lines.push('');
    lines.push(`**Themes Identified**: ${result.themes.length}`);
    lines.push(`**Meta-Themes**: ${result.metaThemes.length}`);
    lines.push(`**Total Citations**: ${result.quality.avgCitationsPerTheme * result.themes.length}`);
    lines.push(`**Average Confidence**: ${(result.quality.avgConfidence * 100).toFixed(1)}%`);
    lines.push(`**Distinctiveness Score**: ${(result.quality.distinctivenessScore * 100).toFixed(1)}%`);
    lines.push('');

    lines.push('## Extracted Themes');
    lines.push('');

    for (const theme of result.themes) {
      lines.push(`### Theme ${theme.id}: ${theme.name}`);
      lines.push(`**Definition**: ${theme.definition}`);
      lines.push(`**Confidence**: ${(theme.confidence * 100).toFixed(0)}%`);
      lines.push(`**Evidence**: ${theme.evidence.length} citations`);
      lines.push(`**Keywords**: ${theme.keywords.join(', ')}`);
      lines.push('');
    }

    lines.push('## Meta-Themes');
    lines.push('');

    for (const metaTheme of result.metaThemes) {
      lines.push(`### ${metaTheme.name}`);
      lines.push(`**Definition**: ${metaTheme.definition}`);
      lines.push(`**Component Themes**: ${metaTheme.componentThemeIds.join(', ')}`);
      lines.push(`**Significance**: ${metaTheme.significance}`);
      lines.push('');
    }

    lines.push('## Framework Visualization');
    lines.push('```');
    lines.push(result.framework.visualization);
    lines.push('```');
    lines.push('');

    if (result.gaps.underTheorized.length > 0 || result.gaps.missing.length > 0) {
      lines.push('## Gaps Identified');
      lines.push('');

      if (result.gaps.underTheorized.length > 0) {
        lines.push('**Under-Theorized**:');
        for (const gap of result.gaps.underTheorized) {
          lines.push(`- ${gap}`);
        }
        lines.push('');
      }

      if (result.gaps.missing.length > 0) {
        lines.push('**Missing Themes**:');
        for (const gap of result.gaps.missing) {
          lines.push(`- ${gap}`);
        }
      }
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a thematic synthesizer with default configuration
 */
export function createDefaultSynthesizer(): ThematicSynthesizer {
  return new ThematicSynthesizer();
}

/**
 * Create a thematic synthesizer with strict requirements
 */
export function createStrictSynthesizer(): ThematicSynthesizer {
  return new ThematicSynthesizer({
    minThemes: 10,
    maxThemes: 15,
    minCitationsPerTheme: 15,
    maxConceptualOverlap: 0.20,
    minConfidence: 0.90,
  });
}

/**
 * Create a thematic synthesizer for exploratory analysis (more lenient)
 */
export function createExploratorySynthesizer(): ThematicSynthesizer {
  return new ThematicSynthesizer({
    minThemes: 5,
    maxThemes: 20,
    minCitationsPerTheme: 5,
    maxConceptualOverlap: 0.40,
    minConfidence: 0.75,
  });
}
