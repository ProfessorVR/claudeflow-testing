/**
 * Gold Standard Prompt Builder — standalone, reusable prompt construction.
 *
 * Extracted from WritePipelineOrchestrator.buildGoldStandardPrompt() so that
 * both the CLI pipeline and the dashboard API can build identical prompts.
 *
 * Single source of truth for:
 *   - MLA citation format enforcement (no APA)
 *   - Style profile injection
 *   - Grounding rules (corpus-only citations)
 *   - Source diversity requirements
 *   - Per-section word targets and citation quotas
 *   - Reasoning edge structural relationships
 *   - Knowledge unit context
 *
 * @module gold-standard-prompt-builder
 */

import type { ContextChunk } from '../retrieval/index.js';
import { GOLD_STANDARD_CONFIG } from './gold-standard-config.js';
import { getActiveBridges, extractTopicWords } from '../shared/cross-author-utils.js';
import type { LanhamStyleTarget } from './stages/stage-types.js';

// ============================================================================
// Types
// ============================================================================

export interface GoldStandardPromptOptions {
  topic: string;
  subsections: string[];
  chunks: ContextChunk[];
  knowledgeUnits: string[];
  structuralEdges?: string[];
  ontologyNodes?: string[];
  crossPipelineHooks?: string[];
  tensionEdges?: string[];
  stylePrompt: string;
  wordTarget: string;
  preventionPlan?: {
    blacklistedAuthors: string[];
    strengthenedConstraints: string[];
    underCitedSources: string[];
    overCitedSources: string[];
  };
  sectionConstraints?: string[];
  primaryUnderCoverage?: string[];
  /** Lanham AT/THROUGH style target — prescriptive prose control. */
  lanhamStyleTarget?: LanhamStyleTarget;
  /** Lanham revision guidance from Prose Analyst Agent for inter-section correction. */
  lanhamRevisionGuidance?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Assign suggested corpus sources to each section based on term overlap.
 * Pure function — no side effects.
 */
export function assignSourcesToSections(
  subsections: string[],
  chunks: ContextChunk[]
): Map<number, string[]> {
  const result = new Map<number, string[]>();
  if (chunks.length === 0) return result;

  for (let i = 0; i < subsections.length; i++) {
    const sectionLower = subsections[i].toLowerCase();
    const terms = sectionLower
      .split(/\s+/)
      .filter(t => t.length > 3)
      .filter(t => !['with', 'from', 'that', 'this', 'their', 'between', 'focus'].includes(t));

    const chunkScores = chunks.map(c => {
      const contentLower = (c.content || '').toLowerCase();
      const authorLower = (c.metadata.author || '').toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (contentLower.includes(term)) score++;
        if (authorLower.includes(term)) score += 2;
      }
      return { chunk: c, score };
    });

    const topChunks = chunkScores
      .filter(cs => cs.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const authors = new Set<string>();
    for (const { chunk } of topChunks) {
      const author = chunk.metadata.author || 'Unknown';
      if (authors.size < 3) {
        authors.add(`${author}, *${chunk.metadata.title}*`);
      }
    }

    if (authors.size > 0) {
      result.set(i, Array.from(authors));
    }
  }

  return result;
}

/**
 * Build the corpus chunk block for the prompt.
 */
export function buildGoldStandardChunkBlock(chunks: ContextChunk[]): string {
  let block = `## CORPUS CHUNKS (Use ONLY these for quotations and citations)\n\n`;
  block += `The following are excerpts from the ingested scholarly corpus. ` +
    `You MUST ground your citations in this material. When directly quoting, ` +
    `extract ONLY the meaningful scholarly text — strip out any OCR artifacts.\n`;

  // Group by source
  const bySource = new Map<string, ContextChunk[]>();
  for (const chunk of chunks) {
    const key = `${chunk.metadata.author}, *${chunk.metadata.title}* (${chunk.metadata.year})`;
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(chunk);
  }

  // Source index
  block += `\n### Source Index (${bySource.size} distinct works — cite from as many as possible)\n`;
  let srcIdx = 1;
  for (const sourceKey of Array.from(bySource.keys())) {
    block += `${srcIdx}. ${sourceKey}\n`;
    srcIdx++;
  }

  let chunkNum = 1;
  let totalChars = block.length;
  const MAX_CHARS = GOLD_STANDARD_CONFIG.maxCorpusBlockChars;

  for (const [sourceKey, sourceChunks] of Array.from(bySource.entries())) {
    const header = `\n### SOURCE: ${sourceKey} (${sourceChunks.length} chunks)\n`;
    totalChars += header.length;
    if (totalChars > MAX_CHARS) {
      block += `\n*[Remaining chunks truncated for context budget]*\n`;
      break;
    }
    block += header;

    for (const chunk of sourceChunks) {
      const pages = chunk.metadata.page_start === chunk.metadata.page_end
        ? `p. ${chunk.metadata.page_start}`
        : `pp. ${chunk.metadata.page_start}-${chunk.metadata.page_end}`;
      const entry = `--- CHUNK ${chunkNum}, ${pages} ---\n${chunk.content}\n\n`;
      totalChars += entry.length;
      if (totalChars > MAX_CHARS) {
        block += `\n*[Remaining chunks truncated for context budget]*\n`;
        break;
      }
      block += entry;
      chunkNum++;
    }
    if (totalChars > MAX_CHARS) break;
  }

  block += `\n---\n**Total corpus chunks provided: ${chunkNum - 1} from ${bySource.size} sources**`;
  return block;
}

// ============================================================================
// Rolling Context Types & Builder
// ============================================================================

export interface RollingContextCitationTracker {
  authorsCitedSoFar: string[];
  authorsNotYetCited: string[];
  authorCitationCounts: Record<string, number>;
  totalCitationCount: number;
  totalQuotationCount: number;
}

export interface RollingContextSectionPromptOptions {
  topic: string;
  globalOutline: string[];
  currentSectionIndex: number;
  currentSectionHeading: string;
  sectionWordTarget: string;
  chunks: ContextChunk[];
  knowledgeUnits: string[];
  structuralEdges?: string[];
  ontologyNodes?: string[];
  crossPipelineHooks?: string[];
  tensionEdges?: string[];
  stylePrompt: string;
  preventionPlan?: {
    blacklistedAuthors: string[];
    strengthenedConstraints: string[];
    underCitedSources: string[];
    overCitedSources: string[];
  };
  priorSectionsText: string;
  priorSectionSummaries?: string[];
  citationTracker: RollingContextCitationTracker;
  isConclusion: boolean;
  nextSectionHeading?: string;
  sectionConstraint?: string;
  /** Lanham AT/THROUGH style target — prescriptive prose control. */
  lanhamStyleTarget?: LanhamStyleTarget;
  /** Lanham revision guidance from Prose Analyst Agent for inter-section correction. */
  lanhamRevisionGuidance?: string;
}

/**
 * Build a per-section prompt for rolling context generation.
 *
 * Unlike buildGoldStandardPrompt() which is shaped for whole-document generation,
 * this produces a focused prompt for a single section with rolling context from
 * previously generated sections.
 */
export function buildRollingContextSectionPrompt(options: RollingContextSectionPromptOptions): string {
  const sections: string[] = [];
  const totalSections = options.globalOutline.length;

  // [1] ROLE FRAMING
  sections.push(
    `You are writing Section ${options.currentSectionIndex + 1} of ${totalSections} in a scholarly dissertation. ` +
    `You must continue naturally from the preceding sections — this is part of a single, continuous argument, not a standalone essay.`
  );

  // [2] STYLE PROFILE
  if (options.stylePrompt) {
    let enrichedStyle = options.stylePrompt;
    if (!enrichedStyle.includes('Paragraph') && !enrichedStyle.includes('paragraph')) {
      enrichedStyle += `\n\nStructure:\n- Paragraph length: substantial, approximately 140+ words per paragraph`;
      enrichedStyle += `\n- Question frequency: ~2.8% (use rhetorical questions occasionally to advance argument)`;
    }
    if (!enrichedStyle.includes('Citation Style') && !enrichedStyle.includes('citation style')) {
      enrichedStyle += `\n\nCitation Style: MLA-influenced. ALWAYS include the work title: (Author, *Title*, p. X). NEVER use APA-style (Author Year).`;
    }
    if (!enrichedStyle.includes('Characteristic') && !enrichedStyle.includes('characteristic')) {
      enrichedStyle += `\n\nCharacteristic features:\n- Philosophical and declarative opening statements`;
      enrichedStyle += `\n- Em-dashes for parenthetical asides`;
      enrichedStyle += `\n- Close engagement with primary texts through direct quotation`;
      enrichedStyle += `\n- Long, architectonic sentences followed by shorter declarative ones for emphasis`;
    }
    sections.push(`## STYLE PROFILE\n\n${enrichedStyle}`);
  }

  // [2b] Lanham prescriptive block (only when target is present)
  if (options.lanhamStyleTarget) {
    sections.push(buildLanhamStyleBlock(options.lanhamStyleTarget).join('\n'));
  }

  // [2d] Lanham revision guidance (inter-section correction)
  if (options.lanhamRevisionGuidance) {
    sections.push(`## LANHAM REVISION GUIDANCE\n\n${options.lanhamRevisionGuidance}`);
  }

  // [3] GLOBAL OUTLINE (shows argument trajectory)
  let outlineBlock = `## ARGUMENT OUTLINE (${totalSections} sections — you are writing #${options.currentSectionIndex + 1})\n\n`;
  for (let i = 0; i < options.globalOutline.length; i++) {
    const marker = i === options.currentSectionIndex ? ' ← CURRENT' : '';
    outlineBlock += `${i + 1}. ${options.globalOutline[i]}${marker}\n`;
  }
  sections.push(outlineBlock);

  // [4] CURRENT TASK
  if (options.isConclusion) {
    sections.push(
      `## CURRENT TASK\n\n` +
      `Write the conclusion: "${options.currentSectionHeading}" (~${options.sectionWordTarget} words).\n\n` +
      `Synthesize the argumentative threads from all preceding sections. No new citations required. ` +
      `End with a final synthesis that draws together the core argument.`
    );
  } else {
    sections.push(
      `## CURRENT TASK\n\n` +
      `Write Section ${options.currentSectionIndex + 1}: "${options.currentSectionHeading}" (~${options.sectionWordTarget} words).\n\n` +
      `Continue the argument naturally from where the previous section left off.`
    );
  }

  // [5] CRITICAL CONSTRAINTS (grounding rules, blacklist)
  const uniqueAuthors = new Set(options.chunks.map(c => c.metadata.author || 'Unknown'));
  let constraintBlock = `## CRITICAL CONSTRAINTS\n\n`;
  constraintBlock += `### Grounding Rules\n`;
  constraintBlock += `- ONLY quote and cite from the corpus chunks below.\n`;
  constraintBlock += `- NEVER introduce any author names not in the corpus chunks.\n`;
  constraintBlock += `- Every non-trivial claim must be backed by a citation.\n`;
  if (options.preventionPlan?.blacklistedAuthors?.length) {
    constraintBlock += `\n**BLACKLISTED AUTHORS (DO NOT CITE):** ${options.preventionPlan.blacklistedAuthors.join(', ')}\n`;
  }
  if (options.preventionPlan?.strengthenedConstraints?.length) {
    constraintBlock += `\n**CONSTRAINTS FROM V1 INVESTIGATION:**\n${options.preventionPlan.strengthenedConstraints.map(c => `- ${c}`).join('\n')}\n`;
  }
  if (options.sectionConstraint) {
    constraintBlock += `\n**SECTION-SPECIFIC CONSTRAINT:** ${options.sectionConstraint}\n`;
  }
  constraintBlock += `\n### Citation Format\n`;
  constraintBlock += `- (Author, *Title*, p. X) — MLA-influenced, title in italics\n`;
  constraintBlock += `- Signal-phrase: As Author observes in *Title*, "quotation" (p. X)\n`;
  constraintBlock += `- NEVER use APA-style (Author Year)\n`;
  constraintBlock += `- Aim for 1-2 direct VERBATIM quotations in this section\n`;
  sections.push(constraintBlock);

  // [6] CORPUS CHUNKS (section-specific)
  if (options.chunks.length > 0) {
    sections.push(buildGoldStandardChunkBlock(options.chunks));
  }

  // [7] KNOWLEDGE UNITS + STRUCTURAL EDGES
  if (options.knowledgeUnits.length > 0) {
    sections.push(
      `## KNOWLEDGE UNITS\n\n` + options.knowledgeUnits.join('\n')
    );
  }
  if (options.structuralEdges && options.structuralEdges.length > 0) {
    sections.push(
      `## STRUCTURAL RELATIONSHIPS\n\n` +
      `Express these through analysis, not enumeration:\n\n` +
      options.structuralEdges.join('\n')
    );
  }
    if (options.ontologyNodes && options.ontologyNodes.length > 0) {
      sections.push(`## CANONICAL CONCEPT NODES\n\n` + options.ontologyNodes.join('\n'));
    }
    if (options.crossPipelineHooks && options.crossPipelineHooks.length > 0) {
      sections.push(`## CROSS-PIPELINE HOOKS\n\n` + options.crossPipelineHooks.join('\n'));
    }
    if (options.tensionEdges && options.tensionEdges.length > 0) {
      sections.push(`## CONCEPTUAL TENSIONS\n\n` + options.tensionEdges.join('\n'));
    }

  // [8] PRIOR SECTIONS CONTEXT
  if (options.priorSectionsText) {
    if (options.isConclusion && options.priorSectionSummaries?.length) {
      // Hybrid conclusion context: summaries for early sections + full text for last 2
      let contextBlock = `## WHAT YOU HAVE WRITTEN SO FAR\n\n`;
      contextBlock += `### Section Summaries (argumentative arc)\n`;
      for (let i = 0; i < options.priorSectionSummaries.length; i++) {
        contextBlock += `**Section ${i + 1}**: ${options.priorSectionSummaries[i]}\n`;
      }
      contextBlock += `\n### Recent Sections (full text — continue from here)\n\n`;
      contextBlock += options.priorSectionsText;
      sections.push(contextBlock);
    } else {
      sections.push(
        `## WHAT YOU HAVE WRITTEN SO FAR\n\n` +
        `Below are the most recent sections. Continue naturally — do not repeat ideas already covered.\n\n` +
        options.priorSectionsText
      );
    }
  }

  // [9] CITATION TRACKER
  const tracker = options.citationTracker;
  let trackerBlock = `## CITATION STATUS\n\n`;
  if (tracker.authorsCitedSoFar.length > 0) {
    trackerBlock += `Authors cited so far: ${tracker.authorsCitedSoFar.join(', ')} (${tracker.totalCitationCount} total citations, ${tracker.totalQuotationCount} quotations)\n`;
  } else {
    trackerBlock += `No citations yet (this is the first section).\n`;
  }
  if (tracker.authorsNotYetCited.length > 0) {
    trackerBlock += `**NOT YET CITED (prioritize these):** ${tracker.authorsNotYetCited.join(', ')}\n`;
  }
  sections.push(trackerBlock);

  // [10] TRAILING HOOK (for non-conclusion sections)
  if (!options.isConclusion && options.nextSectionHeading) {
    sections.push(
      `## TRANSITION REQUIREMENT\n\n` +
      `Do NOT write a concluding or summarizing paragraph at the end of this section. ` +
      `End with a forward-looking transitional sentence that naturally bridges into the next topic: "${options.nextSectionHeading}".`
    );
  }

  // [11] OUTPUT FORMAT
  sections.push(
    `## OUTPUT FORMAT\n\n` +
    `Write ONLY the section body (~${options.sectionWordTarget} words). No heading, no appendix, no validation tables. ` +
    `Start directly with the prose.`
  );

  return sections.join('\n\n');
}

// ============================================================================
// Main Builder
// ============================================================================
// Lanham AT/THROUGH Style Control Block
// ============================================================================

/**
 * Build Lanham AT/THROUGH prose style control instructions for the prompt.
 * This is the sole PRESCRIPTIVE Lanham insertion point — it owns behavioral instructions.
 * The DESCRIPTIVE block (axis labels/explanations) lives in style-analyzer.ts.
 */
function buildLanhamStyleBlock(lanhamStyleTarget: LanhamStyleTarget): string[] {
  const lst = lanhamStyleTarget;
  const parts: string[] = [];

  parts.push('\n## PROSE STYLE CONTROL (Lanham framework)');

  switch (lst.atThroughMode) {
    case 'mostly transparent':
      parts.push('AT/THROUGH MODE: mostly transparent');
      parts.push('- Maintain transparent style; the reader should look THROUGH the language to meaning.');
      parts.push('- Minimize style self-consciousness. Keep language invisible.');
      break;
    case 'transparent with AT moments':
      parts.push('AT/THROUGH MODE: transparent with AT moments');
      parts.push('- Maintain a mostly transparent style; the reader should look THROUGH the language to meaning.');
      parts.push('- At key argumentative turns (thesis statements, conceptual pivots, concluding formulations),');
      parts.push('  you are permitted to make the reader look AT the language via:');
      parts.push('  tacit persuasion patterns (parallelism, chiasmus, anaphora),');
      parts.push('  voiced flourishes (rhythmic variation, dynamic range),');
      parts.push('  register elevation (periodic syntax, Latinate diction).');
      parts.push('- These AT moments should be brief and purposeful, not sustained.');
      break;
    case 'oscillating':
      parts.push('AT/THROUGH MODE: oscillating');
      parts.push('- Essayistic style: reader moves between looking AT and THROUGH the language.');
      parts.push('- Alternate between transparent analytical passages and foregrounded reflective moments.');
      break;
    case 'mostly opaque':
      parts.push('AT/THROUGH MODE: mostly opaque');
      parts.push('- Language should be foregrounded throughout; the reader looks AT the words.');
      parts.push('- Use rhythm, sound patterns, and structural devices prominently.');
      break;
  }

  const register = lst.registerTarget || 'high';
  const voice = lst.voiceTarget;
  const tacit = lst.tacitPersuasionLevel || 'moderate';

  parts.push(`REGISTER: ${register}${lst.genre === 'academic' ? ' academic' : ''}`);
  parts.push(
    `VOICE: ${voice} — ${
      voice === 'voiced'
        ? 'your prose should reward reading aloud; vary rhythm and sentence length.'
        : voice === 'moderate'
          ? 'moderate vocal presence; some rhythmic variety.'
          : 'flat, procedural tone appropriate for this context.'
    }`
  );
  parts.push(
    `TACIT PERSUASION BUDGET: ${tacit} — ${
      tacit === 'moderate'
        ? 'deploy 2-3 notable patterns per section, not more.'
        : tacit === 'some'
          ? 'occasional patterns at key turns.'
          : tacit === 'almost none'
            ? 'minimal rhetorical patterning.'
            : 'dense patterning throughout.'
    }`
  );

  return parts;
}

// ============================================================================

/**
 * Build a gold-standard academic writing prompt.
 *
 * This is the single source of truth for prompt construction, used by both
 * the CLI write pipeline and the dashboard API.
 */
export function buildGoldStandardPrompt(options: GoldStandardPromptOptions): string {
  const sections: string[] = [];

  // [1] ROLE FRAMING
  sections.push(
    `You are an academic writing agent generating a scholarly dissertation section of ${options.wordTarget} words. ` +
    `You must write in the trained style profile provided below and draw EXCLUSIVELY ` +
    `from the corpus chunks and knowledge units provided. ` +
    `The target length is ${options.wordTarget} words of scholarly prose — this is a firm requirement.`
  );

  // [2] STYLE PROFILE
  if (options.stylePrompt) {
    let enrichedStyle = options.stylePrompt;

    if (!enrichedStyle.includes('Paragraph') && !enrichedStyle.includes('paragraph')) {
      enrichedStyle += `\n\nStructure:\n- Paragraph length: substantial, approximately 140+ words per paragraph`;
      enrichedStyle += `\n- Question frequency: ~2.8% (use rhetorical questions occasionally to advance argument)`;
      enrichedStyle += `\n- First-person "we" constructions are acceptable for guiding the reader`;
    }

    if (!enrichedStyle.includes('Citation Style') && !enrichedStyle.includes('citation style')) {
      enrichedStyle += `\n\nCitation Style: MLA-influenced. ALWAYS include the work title: (Author, *Title*, p. X) or (Author, "Article Title," p. X). For classical texts use (Aristotle, *De Anima*, 429a1) format. NEVER use APA-style (Author Year) — always include the title.`;
    }

    if (!enrichedStyle.includes('Characteristic') && !enrichedStyle.includes('characteristic')) {
      enrichedStyle += `\n\nCharacteristic stylistic features:\n- Philosophical and declarative opening statements`;
      enrichedStyle += `\n- Use of em-dashes for parenthetical asides`;
      enrichedStyle += `\n- Close engagement with primary texts through direct quotation`;
      enrichedStyle += `\n- Pattern of presenting a concept, then immediately grounding it in textual evidence`;
      enrichedStyle += `\n- Tendency toward long, architectonic sentences followed by shorter declarative ones for emphasis`;
    }

    sections.push(`## STYLE PROFILE\n\n${enrichedStyle}`);
  }

  // [2b] LANHAM PROSE STYLE CONTROL (prescriptive — only when target is present)
  if (options.lanhamStyleTarget) {
    sections.push(buildLanhamStyleBlock(options.lanhamStyleTarget).join('\n'));
  }

  // [2d] LANHAM REVISION GUIDANCE (inter-section correction from Prose Analyst Agent)
  if (options.lanhamRevisionGuidance) {
    sections.push(`## LANHAM REVISION GUIDANCE\n\n${options.lanhamRevisionGuidance}`);
  }

  // [3] WRITING TASK
  let taskSection = `## WRITING TASK\n\n`;
  const topicLines = options.topic.split('\n').map(l => l.trim()).filter(Boolean);
  let titleLine = '';
  const instructionStarts = /^(you are|critical rules|use |every |do not |if a |present |this task |quoted |additionally|generate |ensure )/i;
  for (const line of topicLines) {
    const cleaned = line.replace(/^["']|["']$/g, '').replace(/^write\s+(a\s+)?/i, '');
    if (!instructionStarts.test(cleaned) && cleaned.length > 10 && !/^\d+\.\s/.test(cleaned)) {
      titleLine = cleaned;
      break;
    }
  }
  if (!titleLine && options.subsections.length > 0) {
    titleLine = options.subsections.slice(0, 3).join(', ');
  }
  if (!titleLine) {
    titleLine = topicLines[0]?.replace(/^["']|["']$/g, '') || 'Scholarly Section';
  }
  taskSection += `Write: ${titleLine}\n\n`;
  if (options.subsections.length > 1) {
    const totalTarget = parseInt(options.wordTarget.replace(/,/g, '').split('-')[0]) || 3000;

    // Adaptive section cap: ensure at least ~200 words per section for viable prose
    const maxSections = Math.max(2, Math.floor(totalTarget / 200));
    const effectiveSubsections = options.subsections.length > maxSections
      ? options.subsections.slice(0, maxSections)
      : options.subsections;

    const conclusionIdx = effectiveSubsections.findIndex(s => /conclusion/i.test(s));
    const conclusionWords = Math.min(200, Math.round(totalTarget * 0.2));
    const regularSections = effectiveSubsections.length - (conclusionIdx >= 0 ? 1 : 0);
    const wordsPerSection = Math.round((totalTarget - (conclusionIdx >= 0 ? conclusionWords : 0)) / regularSections);

    taskSection += `### Required Sections (${options.wordTarget} words total — ~${wordsPerSection} words per section)\n`;
    const sectionSourceMap = assignSourcesToSections(effectiveSubsections, options.chunks);
    for (let i = 0; i < effectiveSubsections.length; i++) {
      const isConclusion = i === conclusionIdx;
      const sectionTarget = isConclusion ? conclusionWords : wordsPerSection;
      const sources = sectionSourceMap.get(i);
      taskSection += `${i + 1}. ${effectiveSubsections[i]} (~${sectionTarget} words)\n`;
      if (sources && sources.length > 0) {
        taskSection += `   *Draw from*: ${sources.join('; ')}\n`;
      }
    }
  } else {
    const strippedTopic = topicLines.filter(line => {
      if (/\b\d{1,2},?\d{3}\s+words?\b/i.test(line)) return false;
      if (/\bcitation_lookup\b/i.test(line)) return false;
      if (/\bstress[- ]test\b/i.test(line)) return false;
      if (/\bplaceholder\b/i.test(line)) return false;
      return true;
    }).join('\n');
    taskSection += strippedTopic;
  }
  sections.push(taskSection);

  // [4] CRITICAL CONSTRAINTS
  const relevantChunks = options.chunks.filter(c => c.relevanceScore >= GOLD_STANDARD_CONFIG.relevanceFloor);
  const uniqueChunkSources = new Set(relevantChunks.map(c =>
    `${c.metadata.author}, *${c.metadata.title}*`
  ));
  const uniqueAuthors = new Set(relevantChunks.map(c => c.metadata.author || 'Unknown'));
  const minSourceDiversity = Math.min(Math.max(3, Math.floor(uniqueAuthors.size * 0.5)), 8);

  const workBestScore = new Map<string, { source: string; score: number }>();
  for (const c of relevantChunks) {
    const key = `${c.metadata.author || 'Unknown'}|${c.metadata.title || 'Unknown'}`;
    const source = `${c.metadata.author}, *${c.metadata.title}*`;
    const existing = workBestScore.get(key);
    if (!existing || c.relevanceScore > existing.score) {
      workBestScore.set(key, { source, score: c.relevanceScore });
    }
  }
  const sortedSources = Array.from(workBestScore.entries())
    .sort((a, b) => b[1].score - a[1].score);
  const sourceListFormatted = sortedSources
    .map(([, { source }], i) => `  ${i + 1}. ${source}`)
    .join('\n');

  sections.push(`## CRITICAL CONSTRAINTS

### Grounding Rules (TOP PRIORITY — READ FIRST)
- ONLY quote and cite from the corpus chunks below. No exceptions.
- NEVER introduce any author names that do not appear in the corpus chunks below.
- Every non-trivial claim must be backed by a citation from these chunks.
- Any citation not matching a Source Index author is an error.
${options.preventionPlan?.blacklistedAuthors?.length ? `\n**BLACKLISTED AUTHORS (DO NOT CITE):** ${options.preventionPlan.blacklistedAuthors.join(', ')}\n` : ''}${options.preventionPlan?.strengthenedConstraints?.length ? `\n**ADDITIONAL CONSTRAINTS FROM V1 INVESTIGATION:**\n${options.preventionPlan.strengthenedConstraints.map(c => `- ${c}`).join('\n')}\n` : ''}${options.sectionConstraints?.length ? `\n### Per-Section Citation Requirements (WARNING-LEVEL)\n${options.sectionConstraints.map(c => `- ${c}`).join('\n')}\n` : ''}${options.primaryUnderCoverage?.length ? `\n**PRIMARY AUTHOR UNDER-COVERAGE WARNING:** The corpus has limited material from ${options.primaryUnderCoverage.join(', ')}. You must weaken claims about these authors accordingly — qualify as interpretive/speculative rather than stating definitively.\n` : ''}
### Quotation Fidelity & Requirement (MANDATORY)
You are REQUIRED to include at least 3 direct quotations from the corpus chunks. Quotations must be VERBATIM — copy the exact words from the chunk text.

**Correct example:**
As Aristotle observes, "the soul never thinks without a phantasma" (*De Anima*, 431a17).

**Incorrect example (paraphrase in quotes — NEVER do this):**
As Aristotle observes, "thinking always requires an image" (*De Anima*, 431a17).

- Every direct quotation MUST have a citation immediately following it
- If you cannot find a suitable verbatim passage in the chunks, paraphrase instead and cite normally

### Source Diversity (MANDATORY — THIS IS A HARD REQUIREMENT)
You have chunks from ${uniqueAuthors.size} different authors. You MUST cite from at least ${minSourceDiversity} different authors.

**Available sources (ranked by relevance to your topic):**
${sourceListFormatted}

INSTRUCTIONS FOR SOURCE DIVERSITY:
- You MUST cite at least ${minSourceDiversity} different authors from the list above
- Each major section should cite 2+ different authors
- Do NOT let any single source account for more than 40% of your citations
- When making a claim, check if multiple sources in the chunks support it and cite them together
- Paraphrase and cite even when a source is only tangentially relevant — this demonstrates scholarly breadth

### OVERRIDE STYLE PROFILE — Mandatory Parenthetical Citations
Despite any instructions in the style profile discouraging parenthetical citations, every claim, paraphrase, or use of information from a source MUST include an inline parenthetical citation, even when an author-prominent signal phrase is also present. Signal phrases are encouraged for prose style, but they do NOT replace the parenthetical — both must appear together.
- CORRECT: As Heidegger argues, Dasein is fundamentally Being-in-the-world (Heidegger, *Being and Time*, p. 78).
- CORRECT: Aristotle's account of phantasia reveals that the soul never thinks without an image (Aristotle, *De Anima*, 431a16).
- WRONG: Heidegger argues that Dasein is fundamentally Being-in-the-world.  ← missing parenthetical
- WRONG: As Aristotle shows, the soul never thinks without an image.  ← missing parenthetical

### Citation Requirements
- Citation format: (Author, *Title*, p. X) — MLA-influenced, title in italics
- For signal-phrase citations: As Author observes in *Title*, "quotation" (p. X)
- NEVER use APA-style parenthetical citations like (Author Year), (Author, Year), or (Author Year, p. X). These are WRONG.
- Every parenthetical citation MUST include the work title in italics: (Author, *Title*, p. X).
- Every citation MUST include page number(s). Use the chunk's page range if no specific page is evident.
- 15+ citations total across the document
- ALL citations ONLY from authors listed in the Source Index above
- Do NOT cite any author or work not listed above. If a corpus chunk mentions another scholar's name within its text, cite the CHUNK's author, not the referenced scholar.
- Include at least 3 VERBATIM quotations (exact text from the corpus chunks, in quotation marks)

### Primary-Text Priority (IMPORTANT)
- Prioritize DIRECT ENGAGEMENT with primary texts (e.g. Aristotle, Heidegger) over secondary scholarship.
- Spend time INSIDE crucial passages: quote them at length, then build interpretation from the quoted text.
- Secondary sources (e.g. Bowin, Burke, Rickert) should SUPPLEMENT primary-text close reading, not replace it.
- When a primary text chunk is available in the corpus, prefer quoting and analyzing it over paraphrasing and citing a secondary scholar's summary of the same idea.

### Structure (MANDATORY)
- Print each section heading as a standalone Markdown \`## N. Title\` line, followed by a blank line before the body text.
- Do NOT embed headings inline within paragraphs.
- The Conclusion section must be at least 200 words. Citations in the conclusion are optional unless you introduce a new factual claim or attribution.

### Length (MANDATORY — READ CAREFULLY)
- Target: ${options.wordTarget} words of MAIN TEXT prose (NOT including the Validation Appendix)
- Each section MUST be at least ${GOLD_STANDARD_CONFIG.minSectionWords} words. Do NOT write sections shorter than ${GOLD_STANDARD_CONFIG.minSectionWords} words.
- The Validation Appendix comes AFTER the main text and does NOT count toward the word target.
- Write the full ${options.wordTarget} words of scholarly prose FIRST, then add the appendix.`);

  // [5] CORPUS CHUNKS
  if (options.chunks.length > 0) {
    sections.push(buildGoldStandardChunkBlock(options.chunks));
  }

  // [6] KNOWLEDGE UNITS
  if (options.knowledgeUnits.length > 0) {
    sections.push(
      `## KNOWLEDGE UNITS (additional scholarly context — thematic guidance only, not quotable)\n\n` +
      options.knowledgeUnits.join('\n')
    );
  }

  // [6b] STRUCTURAL RELATIONSHIPS (from reasoning graph)
  if (options.structuralEdges && options.structuralEdges.length > 0) {
    sections.push(
      `## STRUCTURAL RELATIONSHIPS (from reasoning graph)\n\n` +
      `The following concept relationships are established in the corpus analysis. ` +
      `Use these to STRUCTURE your argument — do NOT list or enumerate them. ` +
      `Each relationship should be expressed through the flow of your prose, ` +
      `not stated as "X depends on Y" or "X presupposes Y". ` +
      `Show the relationship through analysis and argumentation.\n\n` +
      `BAD: "Phantasia presupposes aisthesis. Kinesis depends on chronos."\n` +
      `GOOD: "Aristotle's account of phantasia is grounded in the prior operation of sense-perception, ` +
      `such that the image-making faculty cannot function independently of aisthesis."\n\n` +
      `Do not invent relationships not listed here.\n\n` +
      options.structuralEdges.join('\n')
    );
  }

    // [6c] CANONICAL CONCEPT NODES
    if (options.ontologyNodes && options.ontologyNodes.length > 0) {
      sections.push(
        `## CANONICAL CONCEPT NODES (from corpus ontology)\n\n` +
        `These are the established canonical names and definitions for key concepts ` +
        `in the corpus. Use canonical forms and Greek/German terms consistently. ` +
        `Prefer these definitions over paraphrase.\n\n` +
        options.ontologyNodes.join('\n')
      );
    }

    // [6d] MANDATORY THEORETICAL SYNTHESIS (dynamic bridge injection)
    // Computed FIRST so we can filter its ID from the generic hooks in [6e].
    let mandatoryBridgeId: string | null = null;
    try {
      const topicWords = extractTopicWords(options.topic);
      const activeBridges = getActiveBridges(topicWords);
      if (activeBridges.length > 0) {
        const bridge = activeBridges[0];
        mandatoryBridgeId = bridge.id;
        sections.push(
          `## MANDATORY THEORETICAL SYNTHESIS\n\n` +
          `The following established cross-author bridge is directly relevant to this section. ` +
          `You MUST integrate this connection into your argument — it is a verified, ` +
          `high-confidence interpretive link between primary sources in the corpus.\n\n` +
          `**Bridge [${bridge.id}]:** ${bridge.sourceConcept || '?'} (${bridge.sourceAuthor}) ↔ ` +
          `${bridge.targetConcept || '?'} (${bridge.targetAuthor})\n` +
          `${bridge.bridge || ''}\n\n` +
          `Both authors (${bridge.sourceAuthor} and ${bridge.targetAuthor}) MUST be cited ` +
          `with direct textual evidence when integrating this bridge. Do not assert the ` +
          `connection without grounding it in specific passages from both sides.`
        );
      }
    } catch { /* non-fatal: bridge injection is an enhancement, not a requirement */ }

    // [6e] CROSS-PIPELINE INTERPRETIVE HOOKS (generic, excluding mandatory bridge)
    if (options.crossPipelineHooks && options.crossPipelineHooks.length > 0) {
      // Filter out the mandatory bridge to prevent duplicate injection
      const filteredHooks = mandatoryBridgeId
        ? options.crossPipelineHooks.filter(line => !line.includes(`[${mandatoryBridgeId}]`))
        : options.crossPipelineHooks;
      if (filteredHooks.length > 0) {
        sections.push(
          `## CROSS-PIPELINE INTERPRETIVE HOOKS\n\n` +
          `The following are established interpretive bridges between texts in the corpus. ` +
          `These are high-confidence [INTERP-high] connections verified against primary sources. ` +
          `Use them to structure cross-textual argument — do not invent additional bridges.\n\n` +
          filteredHooks.join('\n')
        );
      }
    }

    // [6f] CONCEPTUAL TENSIONS
    if (options.tensionEdges && options.tensionEdges.length > 0) {
      sections.push(
        `## CONCEPTUAL TENSIONS (from corpus analysis)\n\n` +
        `These tensions are productively unresolved in the corpus. ` +
        `Acknowledge and engage them — do not paper over them or collapse them ` +
        `into simple equivalence.\n\n` +
        options.tensionEdges.join('\n')
      );
    }

  // [7] OUTPUT FORMAT + REMEMBER BLOCK
  // Suppress Validation Appendix for short-form requests (under 1,000 words)
  const parsedTarget = parseInt(options.wordTarget.replace(/,/g, '').split('-')[0]) || 3000;
  const isShortForm = parsedTarget < 1000;

  if (isShortForm) {
    sections.push(`## OUTPUT FORMAT

Write a focused scholarly section of ${options.wordTarget} words with proper academic depth.

CONSTRAINT: Generate exactly ${options.wordTarget} words of main body text. Do NOT include a Validation Appendix, claim map, citation ledger, or quotation ledger. Your prose alone must equal ${options.wordTarget} words.

REMEMBER: ${options.wordTarget} words main text, ≥ ${minSourceDiversity} authors cited, ≥ 1 verbatim quotation. Style: long architectonic sentences, semicolons, transitions (thus/indeed/hence/accordingly/specifically/subsequently/similarly). Paragraphs ~140+ words.`);
  } else {
    sections.push(`## OUTPUT FORMAT

Write the complete dissertation section (${options.wordTarget} words) with proper scholarly depth.

After the main text, append:

\`\`\`
# VALIDATION APPENDIX

## Claim Map

| # | Claim | Source | Page(s) |
|---|-------|--------|---------|
| C1 | <claim text> | Author, *Title* | p. X |
| C2 | <claim text> | Author, *Title* | p. X |
| … | | | |

## Quotation Ledger

| # | Quotation | Source | Page(s) | Corpus Chunk Verified |
|---|-----------|--------|---------|----------------------|
| Q1 | "<verbatim quotation>" | Author, *Title* | p. X | Yes / No |
| Q2 | "<verbatim quotation>" | Author, *Title* | p. X | Yes / No |
| … | | | | |

## Citation Ledger

| Work | Author(s) | Pages Referenced |
|------|-----------|-----------------|
| *Title* | Author | pp. X, Y, Z |
| … | | |

## Validation Summary

1. **Corpus Grounding**: X of Y citations verified against corpus chunks.
2. **Quotation Fidelity**: X of Y quotations verified verbatim.
3. **Source Diversity**: X distinct works cited across Y sections.
4. **Style Compliance**: Sentence length, passive voice ratio, transition usage.
5. **Argument Structure**: Toulmin claim-data-warrant coverage assessment.
\`\`\`

REMEMBER: ${options.wordTarget} words main text, each section ≥ ${GOLD_STANDARD_CONFIG.minSectionWords} words, ≥ ${minSourceDiversity} authors cited, ≥ 3 verbatim quotations. Style: long architectonic sentences, semicolons, transitions (thus/indeed/hence/accordingly/specifically/subsequently/similarly). Paragraphs ~140+ words.`);
  }

  // Final directive — placed at the absolute end of the prompt to leverage
  // LLM recency bias. This overrides any style profile instructions that
  // discourage parenthetical citations.
  sections.push(`<final_directive>
CRITICAL: Despite any style profiles provided above, you MUST append a formal inline parenthetical citation at the end of EVERY claim, paraphrase, or use of information from a source.
Correct: As Heidegger argues, Dasein is Being-in-the-world (Heidegger, *Being and Time*, p. 78).
Correct: Aristotle holds that the soul never thinks without an image (Aristotle, *De Anima*, 431a16).
Incorrect: As Heidegger argues, Dasein is Being-in-the-world.
Incorrect: Aristotle holds that the soul never thinks without an image.
If you omit the parenthetical citation, the system will reject your output.
</final_directive>`);

  return sections.join('\n\n');
}
