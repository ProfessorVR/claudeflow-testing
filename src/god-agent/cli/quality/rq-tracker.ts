/**
 * RQTracker - Research Question Coverage Matrix
 *
 * Tracks research questions from introduction through results/discussion
 * to ensure all RQs are properly addressed.
 */

// Research question definition
export interface ResearchQuestion {
  id: string;                    // RQ1, RQ2, H1, H2, etc.
  type: 'question' | 'hypothesis';
  text: string;                  // Full question/hypothesis text
  chapter: number;               // Where defined
  section?: string;              // Section where defined
  lineNumber: number;            // Line in source document
  hypotheses?: string[];         // Associated hypotheses (for RQs)
  parentRQ?: string;             // Parent RQ (for hypotheses)
}

// How an RQ is addressed in a section
export interface RQAddress {
  rqId: string;
  section: string;               // 'results', 'discussion', 'conclusion'
  paragraphIndex: number;
  lineNumber: number;
  excerpt: string;               // Text that addresses the RQ
  coverageType: 'direct' | 'partial' | 'implied';
  confidence: number;            // 0-1 how confident we are this addresses the RQ
}

// Coverage status for a single RQ
export interface RQCoverage {
  rq: ResearchQuestion;
  addressedIn: RQAddress[];
  status: 'fully-addressed' | 'partially-addressed' | 'missing';
  completenessScore: number;     // 0-1
  notes: string[];               // Observations about coverage
}

// Overall coverage report
export interface RQCoverageReport {
  totalRQs: number;
  totalHypotheses: number;
  fullyAddressed: number;
  partiallyAddressed: number;
  missing: number;
  overallCoverage: number;       // 0-1
  coverage: RQCoverage[];
  canProceed: boolean;
  issues: string[];
}

// Patterns for detecting RQs and hypotheses
const RQ_PATTERNS = [
  // Numbered RQs: "RQ1:", "RQ 1:", "Research Question 1:", etc.
  /(?:RQ|Research Question)\s*(\d+)[:\.]?\s*(.+?)(?:\?|$)/gi,

  // Bulleted RQs: "1. What is...", "- How do..."
  /^(?:\d+\.|•|-)\s*((?:What|How|Why|When|Where|Which|To what extent|Does|Do|Is|Are|Can|Will).+?\?)/gmi,

  // Inline questions: "This study asks: What..."
  /(?:asks?|investigates?|examines?|explores?):\s*((?:What|How|Why|When|Where|Which).+?\?)/gi,
];

const HYPOTHESIS_PATTERNS = [
  // Numbered hypotheses: "H1:", "Hypothesis 1:", etc.
  /(?:H|Hypothesis)\s*(\d+)[:\.]?\s*(.+?)(?:\.|$)/gi,

  // Predictions: "We predict that...", "It is hypothesized that..."
  /(?:predict|hypothesize|expect)\s+that\s+(.+?)(?:\.|$)/gi,
];

export class RQTracker {
  private researchQuestions: ResearchQuestion[] = [];
  private hypotheses: ResearchQuestion[] = [];

  /**
   * Extract RQs and hypotheses from introduction content
   */
  extractRQsFromIntroduction(
    content: string,
    chapter: number = 1
  ): { rqs: ResearchQuestion[]; hypotheses: ResearchQuestion[] } {
    const rqs: ResearchQuestion[] = [];
    const hypotheses: ResearchQuestion[] = [];
    const lines = content.split('\n');

    let currentSection = 'Introduction';

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineNum = lineIdx + 1;

      // Track section headers
      if (line.startsWith('## ') || line.startsWith('### ')) {
        currentSection = line.replace(/^#+\s*/, '').trim();
      }

      // Look for RQs
      for (const pattern of RQ_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(line)) !== null) {
          const rqNum = match[1] || (rqs.length + 1).toString();
          const rqText = (match[2] || match[1] || '').trim();

          if (rqText.length > 10) { // Minimum length to be valid
            rqs.push({
              id: `RQ${rqNum}`,
              type: 'question',
              text: rqText,
              chapter,
              section: currentSection,
              lineNumber: lineNum,
            });
          }
        }
      }

      // Look for hypotheses
      for (const pattern of HYPOTHESIS_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(line)) !== null) {
          const hNum = match[1] || (hypotheses.length + 1).toString();
          const hText = (match[2] || match[1] || '').trim();

          if (hText.length > 10) {
            hypotheses.push({
              id: `H${hNum}`,
              type: 'hypothesis',
              text: hText,
              chapter,
              section: currentSection,
              lineNumber: lineNum,
            });
          }
        }
      }
    }

    // Link hypotheses to RQs if numbering matches
    for (const h of hypotheses) {
      const hNum = parseInt(h.id.replace('H', ''));
      const matchingRQ = rqs.find(rq => parseInt(rq.id.replace('RQ', '')) === hNum);
      if (matchingRQ) {
        h.parentRQ = matchingRQ.id;
        if (!matchingRQ.hypotheses) matchingRQ.hypotheses = [];
        matchingRQ.hypotheses.push(h.id);
      }
    }

    this.researchQuestions = rqs;
    this.hypotheses = hypotheses;

    return { rqs, hypotheses };
  }

  /**
   * Check how RQs are addressed in results content
   */
  checkCoverageInResults(resultsContent: string): RQAddress[] {
    return this.findAddresses(resultsContent, 'results');
  }

  /**
   * Check how RQs are addressed in discussion content
   */
  checkCoverageInDiscussion(discussionContent: string): RQAddress[] {
    return this.findAddresses(discussionContent, 'discussion');
  }

  /**
   * Find where RQs are addressed in content
   */
  private findAddresses(content: string, section: string): RQAddress[] {
    const addresses: RQAddress[] = [];
    const paragraphs = this.splitIntoParagraphs(content);

    for (const rq of [...this.researchQuestions, ...this.hypotheses]) {
      // Extract key terms from RQ
      const keyTerms = this.extractKeyTerms(rq.text);

      // Search for mentions
      for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
        const para = paragraphs[pIdx];
        const matchScore = this.calculateMatchScore(para.content, keyTerms, rq.id);

        if (matchScore > 0.3) {
          // Determine coverage type
          let coverageType: 'direct' | 'partial' | 'implied' = 'implied';

          if (para.content.includes(rq.id) || matchScore > 0.7) {
            coverageType = 'direct';
          } else if (matchScore > 0.5) {
            coverageType = 'partial';
          }

          // Get excerpt
          const excerpt = para.content.substring(0, 150).trim() +
            (para.content.length > 150 ? '...' : '');

          addresses.push({
            rqId: rq.id,
            section,
            paragraphIndex: pIdx,
            lineNumber: para.lineStart,
            excerpt,
            coverageType,
            confidence: matchScore,
          });
        }
      }
    }

    return addresses;
  }

  /**
   * Extract key terms from RQ text
   */
  private extractKeyTerms(text: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
      'what', 'how', 'why', 'when', 'where', 'which', 'who', 'whom',
      'this', 'that', 'these', 'those', 'and', 'or', 'but', 'if', 'then',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Calculate match score between content and key terms
   */
  private calculateMatchScore(
    content: string,
    keyTerms: string[],
    rqId: string
  ): number {
    const contentLower = content.toLowerCase();

    // Direct RQ reference is highest match
    if (contentLower.includes(rqId.toLowerCase())) {
      return 1.0;
    }

    // Count matching key terms
    let matches = 0;
    for (const term of keyTerms) {
      if (contentLower.includes(term)) {
        matches++;
      }
    }

    return keyTerms.length > 0 ? matches / keyTerms.length : 0;
  }

  /**
   * Split content into paragraphs with line info
   */
  private splitIntoParagraphs(content: string): Array<{
    content: string;
    lineStart: number;
    lineEnd: number;
  }> {
    const paragraphs: Array<{
      content: string;
      lineStart: number;
      lineEnd: number;
    }> = [];

    const lines = content.split('\n');
    let currentPara: string[] = [];
    let paraStart = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '') {
        if (currentPara.length > 0) {
          paragraphs.push({
            content: currentPara.join('\n'),
            lineStart: paraStart,
            lineEnd: i,
          });
          currentPara = [];
        }
        paraStart = i + 2;
      } else {
        if (currentPara.length === 0) {
          paraStart = i + 1;
        }
        currentPara.push(line);
      }
    }

    if (currentPara.length > 0) {
      paragraphs.push({
        content: currentPara.join('\n'),
        lineStart: paraStart,
        lineEnd: lines.length,
      });
    }

    return paragraphs;
  }

  /**
   * Generate complete coverage report
   */
  generateCoverageReport(
    resultsContent: string,
    discussionContent: string
  ): RQCoverageReport {
    const resultsAddresses = this.checkCoverageInResults(resultsContent);
    const discussionAddresses = this.checkCoverageInDiscussion(discussionContent);

    const allAddresses = [...resultsAddresses, ...discussionAddresses];
    const coverage: RQCoverage[] = [];
    const issues: string[] = [];

    for (const rq of [...this.researchQuestions, ...this.hypotheses]) {
      const addresses = allAddresses.filter(a => a.rqId === rq.id);

      // Determine status
      let status: 'fully-addressed' | 'partially-addressed' | 'missing';
      let completenessScore: number;
      const notes: string[] = [];

      if (addresses.length === 0) {
        status = 'missing';
        completenessScore = 0;
        issues.push(`${rq.id} is not addressed in results or discussion`);
        notes.push('No mention found');
      } else {
        const hasDirectAddress = addresses.some(a => a.coverageType === 'direct');
        const hasResultsAddress = addresses.some(a => a.section === 'results');
        const hasDiscussionAddress = addresses.some(a => a.section === 'discussion');

        if (hasDirectAddress && hasResultsAddress && hasDiscussionAddress) {
          status = 'fully-addressed';
          completenessScore = 1.0;
        } else if (hasDirectAddress || (hasResultsAddress && hasDiscussionAddress)) {
          status = 'partially-addressed';
          completenessScore = 0.7;

          if (!hasResultsAddress) {
            notes.push('Not addressed in Results section');
            issues.push(`${rq.id} should be addressed in Results`);
          }
          if (!hasDiscussionAddress) {
            notes.push('Not addressed in Discussion section');
          }
        } else {
          status = 'partially-addressed';
          completenessScore = 0.4;
          notes.push('Only implied/partial coverage found');
        }
      }

      coverage.push({
        rq,
        addressedIn: addresses,
        status,
        completenessScore,
        notes,
      });
    }

    const fullyAddressed = coverage.filter(c => c.status === 'fully-addressed').length;
    const partiallyAddressed = coverage.filter(c => c.status === 'partially-addressed').length;
    const missing = coverage.filter(c => c.status === 'missing').length;
    const total = coverage.length;

    return {
      totalRQs: this.researchQuestions.length,
      totalHypotheses: this.hypotheses.length,
      fullyAddressed,
      partiallyAddressed,
      missing,
      overallCoverage: total > 0 ? (fullyAddressed + 0.5 * partiallyAddressed) / total : 1,
      coverage,
      canProceed: missing === 0,
      issues,
    };
  }

  /**
   * Generate markdown coverage matrix
   */
  generateCoverageMatrix(report: RQCoverageReport): string {
    const lines = [
      '# Research Question Coverage Matrix',
      '',
      `**Total RQs**: ${report.totalRQs}`,
      `**Total Hypotheses**: ${report.totalHypotheses}`,
      `**Overall Coverage**: ${(report.overallCoverage * 100).toFixed(1)}%`,
      '',
      '## Coverage Summary',
      '',
      '| ID | Type | Status | Results | Discussion | Score |',
      '|----|------|--------|---------|------------|-------|',
    ];

    for (const cov of report.coverage) {
      const resultsAddr = cov.addressedIn.filter(a => a.section === 'results');
      const discussionAddr = cov.addressedIn.filter(a => a.section === 'discussion');

      lines.push(
        `| ${cov.rq.id} | ${cov.rq.type} | ${cov.status} | ` +
        `${resultsAddr.length > 0 ? '✓' : '✗'} | ` +
        `${discussionAddr.length > 0 ? '✓' : '✗'} | ` +
        `${(cov.completenessScore * 100).toFixed(0)}% |`
      );
    }

    if (report.issues.length > 0) {
      lines.push('');
      lines.push('## Issues');
      lines.push('');
      for (const issue of report.issues) {
        lines.push(`- ⚠️ ${issue}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Get stored RQs
   */
  getResearchQuestions(): ResearchQuestion[] {
    return [...this.researchQuestions];
  }

  /**
   * Get stored hypotheses
   */
  getHypotheses(): ResearchQuestion[] {
    return [...this.hypotheses];
  }
}

// Export singleton
export const rqTracker = new RQTracker();
