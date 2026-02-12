/**
 * DissertationContextManager - Central manager for all context tracking
 *
 * Coordinates all cross-chapter context tracking for the PhD Pipeline:
 * - Chapter context aggregation
 * - Argument thread tracking
 * - Forward reference validation
 * - Thesis management
 * - Term glossary
 *
 * This is the main entry point for context management in the pipeline.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import {
  ChapterContextAggregator,
  type ChapterContext,
} from './chapter-context-aggregator.js';

import {
  ArgumentThreadTracker,
  type ArgumentThread,
  type ValidationResult as ThreadValidationResult,
} from './argument-thread-tracker.js';

import {
  ForwardReferenceValidator,
  type ForwardReference,
  type ValidationReport,
} from './forward-reference-validator.js';

import {
  TieredContextManager,
  type TieredContext,
  type TieredContextManagerConfig,
  type ColdContextAccessor,
} from './tiered-context-manager.js';

/**
 * Sub-thesis structure for tracking dissertation arguments
 */
export interface SubThesis {
  /** Unique identifier */
  id: string;
  /** The thesis statement */
  statement: string;
  /** Chapters that cover this sub-thesis */
  chapterCoverage: number[];
  /** Relationship to main thesis */
  relationToMain: string;
  /** Status */
  status: 'proposed' | 'developing' | 'supported' | 'concluded';
}

/**
 * Term definition for glossary
 */
export interface GlossaryTerm {
  /** The term being defined */
  term: string;
  /** Definition */
  definition: string;
  /** Chapter where first defined */
  firstAppearance: number;
  /** Chapters that use this term */
  usedInChapters: number[];
  /** Related terms */
  relatedTerms: string[];
}

/**
 * Complete dissertation context
 */
export interface DissertationContext {
  /** Dissertation title */
  title: string;
  /** Chapter contexts by chapter number */
  chapters: Map<number, ChapterContext>;
  /** Argument thread tracker */
  argumentThreads: ArgumentThreadTracker;
  /** Forward reference validator */
  forwardReferences: ForwardReferenceValidator;

  /** Main thesis statement */
  mainThesis: string;
  /** Sub-theses */
  subTheses: SubThesis[];

  /** Key terms glossary */
  glossary: Map<string, GlossaryTerm>;

  /** Metadata */
  createdAt: number;
  lastUpdatedAt: number;
  sessionId: string;
}

/**
 * Validation report for the entire dissertation
 */
export interface DissertationValidationReport {
  /** Overall validity */
  valid: boolean;
  /** Total issues found */
  totalIssues: number;

  /** Thread validation results */
  threadIssues: ThreadValidationResult[];

  /** Forward reference validation report */
  forwardReferenceReport: ValidationReport;

  /** Thesis coverage analysis */
  thesisCoverage: {
    mainThesisCovered: boolean;
    subThesesCoverage: Array<{
      id: string;
      statement: string;
      coveragePercentage: number;
      missingChapters: number[];
    }>;
  };

  /** Term consistency issues */
  termIssues: Array<{
    term: string;
    issue: string;
    affectedChapters: number[];
  }>;

  /** Narrative coherence score (0-1) */
  coherenceScore: number;

  /** Generated at timestamp */
  generatedAt: number;

  /** Recommendations */
  recommendations: string[];
}

/**
 * Options for context building
 */
export interface ContextBuildOptions {
  /** Include full chapter summaries */
  includeSummaries?: boolean;
  /** Include argument thread status */
  includeThreadStatus?: boolean;
  /** Include defined terms */
  includeGlossary?: boolean;
  /** Include forward reference promises */
  includeForwardPromises?: boolean;
  /** Maximum context length (in characters) */
  maxLength?: number;
  /**
   * Use tiered context compression for large documents.
   * When true, uses the TieredContextManager for hierarchical compression.
   * Recommended for documents > 50k tokens.
   */
  useTieredContext?: boolean;
  /** Token budget for tiered context (only used if useTieredContext is true) */
  tieredTokenBudget?: number;
}

/**
 * Options for tiered context building
 */
export interface TieredContextBuildOptions {
  /** Token budget for the entire context (default: 60000) */
  tokenBudget?: number;
  /** Custom TieredContextManager configuration */
  tieredConfig?: TieredContextManagerConfig;
  /** Custom cold context accessor (e.g., AgentDB) */
  coldAccessor?: ColdContextAccessor;
  /** Section name within the chapter */
  sectionName?: string;
}

/**
 * DissertationContextManager coordinates all context tracking
 */
export class DissertationContextManager {
  /** The dissertation context */
  private context: DissertationContext;
  /** Storage path for persistence */
  private storagePath: string;

  /** Aggregator for extracting chapter context */
  private aggregator: ChapterContextAggregator;

  /** Tiered context manager for large documents */
  private tieredManager: TieredContextManager | null = null;

  /**
   * Create a new DissertationContextManager
   *
   * @param sessionId - Pipeline session ID
   * @param storagePath - Base path for context storage
   * @param title - Dissertation title
   */
  constructor(
    sessionId: string,
    storagePath: string,
    title: string = 'Untitled Dissertation'
  ) {
    this.storagePath = storagePath;
    this.aggregator = new ChapterContextAggregator();

    this.context = {
      title,
      chapters: new Map(),
      argumentThreads: new ArgumentThreadTracker(),
      forwardReferences: new ForwardReferenceValidator(),
      mainThesis: '',
      subTheses: [],
      glossary: new Map(),
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      sessionId,
    };
  }

  // ============================================
  // Chapter Lifecycle Methods
  // ============================================

  /**
   * Called when a chapter is completed
   *
   * @param chapterNumber - The chapter number
   * @param chapterText - The full text of the chapter
   * @param chapterTitle - Optional chapter title
   */
  async onChapterComplete(
    chapterNumber: number,
    chapterText: string,
    chapterTitle?: string
  ): Promise<void> {
    // Extract context from the chapter
    const chapterContext = this.aggregator.extractContext(
      chapterText,
      chapterNumber,
      chapterTitle
    );

    // Store chapter context
    this.context.chapters.set(chapterNumber, chapterContext);

    // Process key arguments into thread tracker
    for (const arg of chapterContext.keyArguments) {
      if (arg.type === 'introduced') {
        const threadId = this.context.argumentThreads.introduceThread(
          chapterNumber,
          arg.statement,
          3, // Default importance
          []
        );
        // Add evidence
        for (const evidence of arg.supportingEvidence) {
          this.context.argumentThreads.addEvidence(threadId, evidence);
        }
      }
    }

    // Process forward references
    this.context.forwardReferences.extractForwardReferences(
      chapterText,
      chapterNumber
    );

    // Add defined terms to glossary
    for (const term of chapterContext.definedTerms) {
      this.addToGlossary(term.term, term.definition, chapterNumber);
    }

    // Update timestamp
    this.context.lastUpdatedAt = Date.now();

    // Persist context
    await this.save();
  }

  /**
   * Build context prompt for a writing agent
   *
   * @param chapterNumber - The chapter being written
   * @param options - Options for context building
   * @returns Formatted context string for injection
   */
  buildContextForChapter(
    chapterNumber: number,
    options: ContextBuildOptions = {}
  ): string {
    const {
      includeSummaries = true,
      includeThreadStatus = true,
      includeGlossary = true,
      includeForwardPromises = true,
      maxLength = 15000,
    } = options;

    const sections: string[] = [];
    let currentLength = 0;

    // Header
    sections.push('# DISSERTATION CONTEXT');
    sections.push('');
    sections.push(`You are writing Chapter ${chapterNumber} of "${this.context.title}".`);
    sections.push('The following context from prior chapters MUST inform your writing.');
    sections.push('');
    currentLength = sections.join('\n').length;

    // Main thesis reminder
    if (this.context.mainThesis) {
      const thesisSection = this.buildThesisSection(chapterNumber);
      if (currentLength + thesisSection.length < maxLength) {
        sections.push(thesisSection);
        currentLength += thesisSection.length;
      }
    }

    // Prior chapter summaries
    if (includeSummaries) {
      const summarySection = this.aggregator.buildContextSummaryForAgent(
        chapterNumber,
        Array.from(this.context.chapters.values())
      );
      if (currentLength + summarySection.length < maxLength) {
        sections.push(summarySection);
        currentLength += summarySection.length;
      }
    }

    // Argument thread status
    if (includeThreadStatus) {
      const threadSection = this.context.argumentThreads.buildThreadStatusPrompt(
        chapterNumber
      );
      if (currentLength + threadSection.length < maxLength) {
        sections.push(threadSection);
        currentLength += threadSection.length;
      }
    }

    // Forward reference promises to fulfill
    if (includeForwardPromises) {
      const promiseSection = this.buildForwardPromiseSection(chapterNumber);
      if (promiseSection && currentLength + promiseSection.length < maxLength) {
        sections.push(promiseSection);
        currentLength += promiseSection.length;
      }
    }

    // Glossary
    if (includeGlossary) {
      const glossarySection = this.buildGlossarySection(chapterNumber);
      if (glossarySection && currentLength + glossarySection.length < maxLength) {
        sections.push(glossarySection);
        currentLength += glossarySection.length;
      }
    }

    // Writing guidance
    sections.push(this.buildWritingGuidance(chapterNumber));

    return sections.join('\n');
  }

  /**
   * Build tiered context for a chapter using hierarchical compression
   *
   * This method is recommended for large dissertations where the full context
   * would exceed context window limits. It uses a three-tier system:
   * - Tier 1 (Hot): Immediate section context
   * - Tier 2 (Warm): Compressed chapter summaries
   * - Tier 3 (Cold): On-demand retrieval
   *
   * @param chapterNumber - The chapter being written
   * @param options - Options for tiered context building
   * @returns Formatted context string optimized for token budget
   */
  async buildTieredContextForChapter(
    chapterNumber: number,
    options: TieredContextBuildOptions = {}
  ): Promise<string> {
    const {
      tokenBudget = 60000,
      tieredConfig,
      coldAccessor,
      sectionName = `Chapter ${chapterNumber}`,
    } = options;

    // Initialize or reconfigure tiered manager if needed
    if (!this.tieredManager || tieredConfig) {
      this.tieredManager = new TieredContextManager(tieredConfig, coldAccessor);
    }

    // Load current context into tiered manager
    this.tieredManager.addChapterContexts(
      Array.from(this.context.chapters.values())
    );
    this.tieredManager.setGlossary(this.context.glossary);
    this.tieredManager.setMainThesis(this.context.mainThesis);
    this.tieredManager.setSubTheses(
      this.context.subTheses.map(sub => sub.statement)
    );

    // Build tiered context
    const tieredContext = await this.tieredManager.buildTieredContext(
      chapterNumber,
      sectionName
    );

    // Generate prompt within budget
    const prompt = this.tieredManager.buildPromptWithBudget(
      tieredContext,
      tokenBudget
    );

    // Add dissertation-specific header
    const header = `# DISSERTATION CONTEXT (Tiered Compression)\n\n` +
      `Writing: Chapter ${chapterNumber} - "${sectionName}" of "${this.context.title}"\n\n`;

    return header + prompt;
  }

  /**
   * Get the tiered context as a structured object (for advanced use cases)
   *
   * @param chapterNumber - The chapter being written
   * @param sectionName - The section within the chapter
   * @param options - Options for tiered context building
   * @returns TieredContext structure
   */
  async getTieredContext(
    chapterNumber: number,
    sectionName: string,
    options: TieredContextBuildOptions = {}
  ): Promise<TieredContext> {
    const { tieredConfig, coldAccessor } = options;

    // Initialize or reconfigure tiered manager
    if (!this.tieredManager || tieredConfig) {
      this.tieredManager = new TieredContextManager(tieredConfig, coldAccessor);
    }

    // Load current context
    this.tieredManager.addChapterContexts(
      Array.from(this.context.chapters.values())
    );
    this.tieredManager.setGlossary(this.context.glossary);
    this.tieredManager.setMainThesis(this.context.mainThesis);
    this.tieredManager.setSubTheses(
      this.context.subTheses.map(sub => sub.statement)
    );

    return this.tieredManager.buildTieredContext(chapterNumber, sectionName);
  }

  /**
   * Determine if tiered context should be used based on content size
   *
   * @returns true if tiered context is recommended
   */
  shouldUseTieredContext(): boolean {
    // Estimate total token count
    let totalChars = 0;

    for (const chapter of this.context.chapters.values()) {
      totalChars += chapter.summary.length;
      for (const arg of chapter.keyArguments) {
        totalChars += arg.statement.length;
      }
    }

    for (const term of this.context.glossary.values()) {
      totalChars += term.term.length + term.definition.length;
    }

    totalChars += this.context.mainThesis.length;
    for (const sub of this.context.subTheses) {
      totalChars += sub.statement.length;
    }

    // Estimate tokens (4 chars per token)
    const estimatedTokens = totalChars / 4;

    // Recommend tiered if over 30k tokens (leaves room for growth)
    return estimatedTokens > 30000;
  }

  /**
   * Get the tiered context manager for direct access
   *
   * @returns TieredContextManager instance or null if not initialized
   */
  getTieredManager(): TieredContextManager | null {
    return this.tieredManager;
  }

  // ============================================
  // Thesis Management
  // ============================================

  /**
   * Set the main thesis statement
   *
   * @param thesis - The main thesis statement
   */
  setMainThesis(thesis: string): void {
    this.context.mainThesis = thesis;
    this.context.lastUpdatedAt = Date.now();
  }

  /**
   * Add a sub-thesis
   *
   * @param statement - The sub-thesis statement
   * @param chapters - Chapters that should cover this thesis
   * @param relationToMain - How this relates to the main thesis
   * @returns The sub-thesis ID
   */
  addSubThesis(
    statement: string,
    chapters: number[],
    relationToMain: string = 'supports'
  ): string {
    const id = `subthesis_${uuidv4().substring(0, 8)}`;

    this.context.subTheses.push({
      id,
      statement,
      chapterCoverage: chapters,
      relationToMain,
      status: 'proposed',
    });

    this.context.lastUpdatedAt = Date.now();
    return id;
  }

  /**
   * Update sub-thesis status
   *
   * @param id - Sub-thesis ID
   * @param status - New status
   */
  updateSubThesisStatus(
    id: string,
    status: SubThesis['status']
  ): void {
    const subThesis = this.context.subTheses.find(s => s.id === id);
    if (subThesis) {
      subThesis.status = status;
      this.context.lastUpdatedAt = Date.now();
    }
  }

  // ============================================
  // Term Management
  // ============================================

  /**
   * Define a term in the glossary
   *
   * @param term - The term to define
   * @param definition - The definition
   * @param chapter - Chapter where defined
   */
  defineTerm(term: string, definition: string, chapter: number): void {
    this.addToGlossary(term, definition, chapter);
  }

  /**
   * Get a term definition
   *
   * @param term - The term to look up
   * @returns Term definition or undefined
   */
  getTerm(term: string): GlossaryTerm | undefined {
    return this.context.glossary.get(term.toLowerCase());
  }

  /**
   * Record term usage in a chapter
   *
   * @param term - The term
   * @param chapter - Chapter where used
   */
  recordTermUsage(term: string, chapter: number): void {
    const glossaryTerm = this.context.glossary.get(term.toLowerCase());
    if (glossaryTerm && !glossaryTerm.usedInChapters.includes(chapter)) {
      glossaryTerm.usedInChapters.push(chapter);
      this.context.lastUpdatedAt = Date.now();
    }
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate the entire dissertation's consistency
   *
   * @returns Comprehensive validation report
   */
  validateDissertationConsistency(): DissertationValidationReport {
    const recommendations: string[] = [];
    let totalIssues = 0;

    // Validate argument threads
    const threadIssues = this.context.argumentThreads.validateThreadConsistency();
    totalIssues += threadIssues.filter(i => !i.valid).length;

    if (threadIssues.length > 0) {
      recommendations.push(
        'Address abandoned or unresolved argument threads before finalizing'
      );
    }

    // Validate forward references
    const chapters = new Map<number, string>();
    // Note: We don't have chapter text here, just contexts
    // In real usage, chapter text would be passed in
    const forwardReferenceReport = this.context.forwardReferences.validateAllReferences(chapters);
    totalIssues += forwardReferenceReport.unfulfilledCount;

    if (forwardReferenceReport.unfulfilledCount > 0) {
      recommendations.push(
        'Resolve unfulfilled forward references or revise the promises'
      );
    }

    // Check thesis coverage
    const thesisCoverage = this.analyzeThesisCoverage();
    if (!thesisCoverage.mainThesisCovered) {
      totalIssues++;
      recommendations.push(
        'Ensure the main thesis is adequately addressed across chapters'
      );
    }

    for (const sub of thesisCoverage.subThesesCoverage) {
      if (sub.coveragePercentage < 0.7) {
        totalIssues++;
        recommendations.push(
          `Sub-thesis "${sub.statement.substring(0, 50)}..." needs more coverage in chapters: ${sub.missingChapters.join(', ')}`
        );
      }
    }

    // Check term consistency
    const termIssues = this.analyzeTermConsistency();
    totalIssues += termIssues.length;

    if (termIssues.length > 0) {
      recommendations.push(
        'Ensure consistent use of defined terms across all chapters'
      );
    }

    // Calculate coherence score
    const coherenceScore = this.calculateCoherenceScore(
      threadIssues,
      forwardReferenceReport,
      thesisCoverage,
      termIssues
    );

    return {
      valid: totalIssues === 0,
      totalIssues,
      threadIssues,
      forwardReferenceReport,
      thesisCoverage,
      termIssues,
      coherenceScore,
      generatedAt: Date.now(),
      recommendations,
    };
  }

  // ============================================
  // Persistence
  // ============================================

  /**
   * Save context to disk
   */
  async save(): Promise<void> {
    const contextDir = path.join(this.storagePath, 'context');
    await fs.mkdir(contextDir, { recursive: true });

    // Save main context
    const contextPath = path.join(contextDir, 'dissertation-context.json');
    const serializable = {
      title: this.context.title,
      chapters: Array.from(this.context.chapters.entries()),
      mainThesis: this.context.mainThesis,
      subTheses: this.context.subTheses,
      glossary: Array.from(this.context.glossary.entries()),
      createdAt: this.context.createdAt,
      lastUpdatedAt: this.context.lastUpdatedAt,
      sessionId: this.context.sessionId,
      forwardReferences: this.context.forwardReferences.references,
    };
    await fs.writeFile(contextPath, JSON.stringify(serializable, null, 2), 'utf-8');

    // Save thread tracker separately (it has its own save method)
    const threadsPath = path.join(contextDir, 'argument-threads.json');
    await this.context.argumentThreads.save(threadsPath);
  }

  /**
   * Load context from disk
   */
  async load(): Promise<void> {
    const contextDir = path.join(this.storagePath, 'context');

    try {
      // Load main context
      const contextPath = path.join(contextDir, 'dissertation-context.json');
      const content = await fs.readFile(contextPath, 'utf-8');
      const data = JSON.parse(content);

      this.context.title = data.title;
      this.context.chapters = new Map(data.chapters);
      this.context.mainThesis = data.mainThesis;
      this.context.subTheses = data.subTheses;
      this.context.glossary = new Map(data.glossary);
      this.context.createdAt = data.createdAt;
      this.context.lastUpdatedAt = data.lastUpdatedAt;
      this.context.sessionId = data.sessionId;

      // Restore forward references
      if (data.forwardReferences) {
        this.context.forwardReferences.references = data.forwardReferences;
      }

      // Load thread tracker
      const threadsPath = path.join(contextDir, 'argument-threads.json');
      await this.context.argumentThreads.load(threadsPath);

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Files don't exist yet, that's fine
        return;
      }
      throw error;
    }
  }

  // ============================================
  // Getters
  // ============================================

  /**
   * Get the dissertation title
   */
  getTitle(): string {
    return this.context.title;
  }

  /**
   * Set the dissertation title
   */
  setTitle(title: string): void {
    this.context.title = title;
    this.context.lastUpdatedAt = Date.now();
  }

  /**
   * Get chapter context
   */
  getChapterContext(chapterNumber: number): ChapterContext | undefined {
    return this.context.chapters.get(chapterNumber);
  }

  /**
   * Get all chapter contexts
   */
  getAllChapterContexts(): ChapterContext[] {
    return Array.from(this.context.chapters.values())
      .sort((a, b) => a.chapterId - b.chapterId);
  }

  /**
   * Get the argument thread tracker
   */
  getArgumentThreadTracker(): ArgumentThreadTracker {
    return this.context.argumentThreads;
  }

  /**
   * Get the forward reference validator
   */
  getForwardReferenceValidator(): ForwardReferenceValidator {
    return this.context.forwardReferences;
  }

  /**
   * Get main thesis
   */
  getMainThesis(): string {
    return this.context.mainThesis;
  }

  /**
   * Get all sub-theses
   */
  getSubTheses(): SubThesis[] {
    return this.context.subTheses;
  }

  /**
   * Get full glossary
   */
  getGlossary(): Map<string, GlossaryTerm> {
    return this.context.glossary;
  }

  /**
   * Get glossary terms as array
   */
  getGlossaryTerms(): GlossaryTerm[] {
    return Array.from(this.context.glossary.values());
  }

  /**
   * Get chapters that have context recorded
   */
  getChaptersWithContext(): number[] {
    return Array.from(this.context.chapters.keys()).sort((a, b) => a - b);
  }

  /**
   * Get active argument threads
   */
  getActiveThreads(): ArgumentThread[] {
    return this.context.argumentThreads.getActiveThreads();
  }

  /**
   * Record chapter context (simplified interface for section completion)
   */
  recordChapterContext(context: ChapterContext): void {
    this.context.chapters.set(context.chapterId, context);
    this.context.lastUpdatedAt = Date.now();
  }

  /**
   * Get storage path
   */
  getStoragePath(): string {
    return this.storagePath;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Add a term to the glossary
   */
  private addToGlossary(term: string, definition: string, chapter: number): void {
    const key = term.toLowerCase();
    const existing = this.context.glossary.get(key);

    if (existing) {
      // Update existing term if this definition is longer/better
      if (definition.length > existing.definition.length) {
        existing.definition = definition;
      }
      if (!existing.usedInChapters.includes(chapter)) {
        existing.usedInChapters.push(chapter);
      }
    } else {
      this.context.glossary.set(key, {
        term,
        definition,
        firstAppearance: chapter,
        usedInChapters: [chapter],
        relatedTerms: [],
      });
    }
  }

  /**
   * Build thesis section for context prompt
   */
  private buildThesisSection(chapterNumber: number): string {
    const sections: string[] = [];

    sections.push('## DISSERTATION THESIS');
    sections.push('');

    if (this.context.mainThesis) {
      sections.push(`**Main Thesis**: ${this.context.mainThesis}`);
      sections.push('');
    }

    // Find relevant sub-theses for this chapter
    const relevantSubTheses = this.context.subTheses.filter(
      s => s.chapterCoverage.includes(chapterNumber)
    );

    if (relevantSubTheses.length > 0) {
      sections.push('**Sub-theses for this chapter**:');
      for (const sub of relevantSubTheses) {
        sections.push(`- ${sub.statement} (${sub.status})`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Build forward promise section for context prompt
   */
  private buildForwardPromiseSection(chapterNumber: number): string | null {
    const promises = this.context.forwardReferences.getReferencesForChapter(chapterNumber);

    if (promises.length === 0) return null;

    const sections: string[] = [];
    sections.push('## FORWARD REFERENCE PROMISES TO FULFILL');
    sections.push('');
    sections.push('Prior chapters made these promises about this chapter:');
    sections.push('');

    for (const promise of promises) {
      sections.push(`- **Chapter ${promise.sourceChapter}** promised: "${promise.claim}"`);
    }

    sections.push('');
    sections.push('**You MUST address each of these promises in this chapter.**');
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Build glossary section for context prompt
   */
  private buildGlossarySection(chapterNumber: number): string | null {
    // Get terms defined in earlier chapters
    const relevantTerms = Array.from(this.context.glossary.values())
      .filter(t => t.firstAppearance < chapterNumber)
      .sort((a, b) => a.firstAppearance - b.firstAppearance);

    if (relevantTerms.length === 0) return null;

    const sections: string[] = [];
    sections.push('## DEFINED TERMS (Use Consistently)');
    sections.push('');
    sections.push('The following terms have been defined. Use them consistently:');
    sections.push('');

    for (const term of relevantTerms.slice(0, 20)) { // Limit to 20 most important
      sections.push(`- **${term.term}** (Ch.${term.firstAppearance}): ${term.definition.substring(0, 100)}`);
    }

    sections.push('');

    return sections.join('\n');
  }

  /**
   * Build writing guidance section
   */
  private buildWritingGuidance(chapterNumber: number): string {
    const sections: string[] = [];

    sections.push('## WRITING GUIDANCE');
    sections.push('');
    sections.push('When writing this chapter:');
    sections.push('');
    sections.push('1. **Build on prior chapters**: Reference and develop arguments from earlier chapters');
    sections.push('2. **Use defined terms**: Use terms consistently as defined in the glossary');
    sections.push('3. **Track arguments**: Introduce new arguments with clear statements');
    sections.push('4. **Fulfill promises**: Address any forward references that target this chapter');
    sections.push('5. **Make forward references**: If you mention topics for later chapters, be specific');
    sections.push('');

    // Add chapter-specific guidance
    if (chapterNumber === 1) {
      sections.push('**First Chapter Guidance**:');
      sections.push('- Establish the research problem and significance');
      sections.push('- Introduce the main thesis');
      sections.push('- Define key terms that will be used throughout');
      sections.push('- Preview the dissertation structure');
      sections.push('');
    } else if (this.context.chapters.size > 0) {
      const completedChapters = Array.from(this.context.chapters.keys()).sort((a, b) => a - b);
      sections.push(`**Building on**: Chapters ${completedChapters.join(', ')} are complete`);
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Analyze thesis coverage across chapters
   */
  private analyzeThesisCoverage(): DissertationValidationReport['thesisCoverage'] {
    const mainThesisCovered = this.context.chapters.size > 0;

    const subThesesCoverage = this.context.subTheses.map(sub => {
      const coveredChapters = sub.chapterCoverage.filter(
        ch => this.context.chapters.has(ch)
      );
      const coveragePercentage = sub.chapterCoverage.length > 0
        ? coveredChapters.length / sub.chapterCoverage.length
        : 0;
      const missingChapters = sub.chapterCoverage.filter(
        ch => !this.context.chapters.has(ch)
      );

      return {
        id: sub.id,
        statement: sub.statement,
        coveragePercentage,
        missingChapters,
      };
    });

    return {
      mainThesisCovered,
      subThesesCoverage,
    };
  }

  /**
   * Analyze term consistency across chapters
   */
  private analyzeTermConsistency(): DissertationValidationReport['termIssues'] {
    const issues: DissertationValidationReport['termIssues'] = [];

    for (const [_, term] of this.context.glossary) {
      // Check for terms defined but never used elsewhere
      if (term.usedInChapters.length === 1 && this.context.chapters.size > 2) {
        issues.push({
          term: term.term,
          issue: 'Term defined but only used in one chapter',
          affectedChapters: term.usedInChapters,
        });
      }

      // Check for gaps in usage (defined early, not used in middle chapters)
      if (term.usedInChapters.length >= 2) {
        const sortedChapters = [...term.usedInChapters].sort((a, b) => a - b);
        for (let i = 1; i < sortedChapters.length; i++) {
          const gap = sortedChapters[i] - sortedChapters[i - 1];
          if (gap > 2) {
            const missingChapters: number[] = [];
            for (let j = sortedChapters[i - 1] + 1; j < sortedChapters[i]; j++) {
              if (this.context.chapters.has(j)) {
                missingChapters.push(j);
              }
            }
            if (missingChapters.length > 0) {
              issues.push({
                term: term.term,
                issue: `Term has usage gap (not used in chapters ${missingChapters.join(', ')})`,
                affectedChapters: missingChapters,
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Calculate overall coherence score
   */
  private calculateCoherenceScore(
    threadIssues: ThreadValidationResult[],
    forwardRefReport: ValidationReport,
    thesisCoverage: DissertationValidationReport['thesisCoverage'],
    termIssues: DissertationValidationReport['termIssues']
  ): number {
    // Start with perfect score
    let score = 1.0;

    // Deduct for thread issues
    const threadPenalty = threadIssues.filter(i => !i.valid).length * 0.05;
    score -= Math.min(0.3, threadPenalty);

    // Deduct for forward reference issues
    if (forwardRefReport.totalReferences > 0) {
      const refScore = forwardRefReport.fulfillmentRate;
      score -= (1 - refScore) * 0.3;
    }

    // Deduct for thesis coverage issues
    for (const sub of thesisCoverage.subThesesCoverage) {
      if (sub.coveragePercentage < 0.7) {
        score -= 0.05;
      }
    }

    // Deduct for term issues
    const termPenalty = termIssues.length * 0.02;
    score -= Math.min(0.2, termPenalty);

    return Math.max(0, score);
  }
}
