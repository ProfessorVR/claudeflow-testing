#!/usr/bin/env npx tsx
/**
 * Dissertation Indexer for AgentDB Cold Storage
 *
 * Parses a dissertation PDF and indexes its content into the AgentDB
 * cold storage for semantic search via the tiered context system.
 *
 * Usage:
 *   npx tsx src/god-agent/cli/dissertation/index-dissertation.ts \
 *     --pdf "/path/to/dissertation.pdf" \
 *     --output ".agentdb/dissertation-chunks.bin" \
 *     --verbose
 *
 * Features:
 * - Parses PDF documents
 * - Detects chapter/section boundaries using patterns
 * - Chunks content with configurable overlap
 * - Stores embeddings for semantic search
 * - Provides progress reporting
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createInitializedAgentDBColdAccessor } from '../context/agentdb-cold-accessor.js';

// ============================================================================
// Types
// ============================================================================

interface SectionMatch {
  type: 'chapter' | 'section' | 'subsection';
  chapterNum: number;
  sectionNum?: string;
  title: string;
  startIndex: number;
  content?: string;
}

interface IndexingResult {
  success: boolean;
  chaptersIndexed: number;
  sectionsIndexed: number;
  totalChunks: number;
  citationsIndexed: number;
  errors: string[];
  duration: number;
}

// ============================================================================
// Section Detection Patterns
// ============================================================================

/**
 * Patterns to detect chapter and section boundaries in the dissertation
 * These are tuned for the "Rhetorical Phantasia" dissertation structure
 */
const SECTION_PATTERNS = {
  // Chapter patterns: "Chapter 1:", "CHAPTER 1:", "1. Chapter Title"
  chapter: [
    /^(?:Chapter|CHAPTER)\s+(\d+)[\s:.-]+(.+?)(?:\n|$)/gim,
    /^(\d+)\.\s+(?:Chapter\s+)?(.+?)(?:\n|$)/gim,
  ],

  // Section patterns: "1.1 Section Title", "Section 1.1:", "(T1)", "(T2-T3)"
  section: [
    /^(\d+)\.(\d+)[\s:.-]+(.+?)(?:\n|$)/gim,
    /^Section\s+(\d+)\.(\d+)[\s:.-]+(.+?)(?:\n|$)/gim,
    /^\(T(\d+(?:-T\d+)?)\)\s+(.+?)(?:\n|$)/gim,
  ],

  // Subsection patterns: "1.1.1 Subsection", "1.3.1:", etc.
  subsection: [
    /^(\d+)\.(\d+)\.(\d+)[\s:.-]+(.+?)(?:\n|$)/gim,
  ],
};

// ============================================================================
// PDF Parsing (using pdf-parse or pdfjs-dist fallback)
// ============================================================================

/**
 * Extract text from PDF file
 */
async function extractPdfText(pdfPath: string): Promise<string> {
  // Try pdf-parse first (preferred - simpler API)
  try {
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse.default(dataBuffer);
    return data.text;
  } catch (pdfParseError) {
    console.log(`[IndexDissertation] pdf-parse failed: ${pdfParseError}, trying pdfjs-dist...`);

    // Fall back to pdfjs-dist with legacy build
    try {
      // Use legacy build for Node.js
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const dataBuffer = fs.readFileSync(pdfPath);
      // Convert Buffer to Uint8Array for pdfjs-dist
      const uint8Array = new Uint8Array(dataBuffer);
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      return fullText;
    } catch (innerError) {
      throw new Error(`Failed to parse PDF. Install pdf-parse: npm install pdf-parse. Error: ${innerError}`);
    }
  }
}

// ============================================================================
// Section Parsing
// ============================================================================

/**
 * Parse dissertation text to extract chapters and sections
 */
function parseDissertationStructure(text: string): SectionMatch[] {
  const matches: SectionMatch[] = [];

  // Find all chapter matches
  for (const pattern of SECTION_PATTERNS.chapter) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const chapterNum = parseInt(match[1], 10);
      matches.push({
        type: 'chapter',
        chapterNum,
        title: match[2].trim(),
        startIndex: match.index,
      });
    }
  }

  // Find all section matches
  for (const pattern of SECTION_PATTERNS.section) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      // Handle (T1), (T2-T3) style sections
      if (match[0].startsWith('(T')) {
        // These are in Chapter 1 based on dissertation structure
        matches.push({
          type: 'section',
          chapterNum: 1,
          sectionNum: `T${match[1]}`,
          title: match[2].trim(),
          startIndex: match.index,
        });
      } else {
        const chapterNum = parseInt(match[1], 10);
        matches.push({
          type: 'section',
          chapterNum,
          sectionNum: match[2],
          title: match[3].trim(),
          startIndex: match.index,
        });
      }
    }
  }

  // Find subsection matches
  for (const pattern of SECTION_PATTERNS.subsection) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const chapterNum = parseInt(match[1], 10);
      matches.push({
        type: 'subsection',
        chapterNum,
        sectionNum: `${match[2]}.${match[3]}`,
        title: match[4].trim(),
        startIndex: match.index,
      });
    }
  }

  // Sort by position in text
  matches.sort((a, b) => a.startIndex - b.startIndex);

  // Assign content to each section (from start to next section start)
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextStart = i < matches.length - 1 ? matches[i + 1].startIndex : text.length;
    current.content = text.substring(current.startIndex, nextStart).trim();
  }

  return matches;
}

/**
 * Extract citations from text
 * Looks for common citation patterns: (Author, Year), Author (Year), etc.
 */
function extractCitations(text: string): Map<string, string> {
  const citations = new Map<string, string>();

  // Pattern for inline citations
  const inlineCitationPattern = /\(([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?),?\s*(\d{4}[a-z]?)\)/g;

  let match;
  while ((match = inlineCitationPattern.exec(text)) !== null) {
    const author = match[1];
    const year = match[2];
    const key = `${author.toLowerCase().replace(/\s+/g, '')}${year}`;
    if (!citations.has(key)) {
      citations.set(key, `${author} (${year})`);
    }
  }

  // Look for bibliography section
  const bibPattern = /(?:Bibliography|References|Works Cited)\n+([\s\S]+?)(?:\n\n|\Z)/i;
  const bibMatch = bibPattern.exec(text);

  if (bibMatch) {
    const bibText = bibMatch[1];
    // Split by line breaks and parse each entry
    const entries = bibText.split(/\n(?=[A-Z])/);
    for (const entry of entries) {
      const trimmed = entry.trim();
      if (trimmed.length > 10) {
        // Extract author/year from beginning
        const authorYearMatch = trimmed.match(/^([A-Z][a-z]+(?:,\s*[A-Z]\.?)?)\s*(?:\(|,\s*)(\d{4})/);
        if (authorYearMatch) {
          const author = authorYearMatch[1];
          const year = authorYearMatch[2];
          const key = `${author.toLowerCase().replace(/[,.\s]+/g, '')}${year}`;
          citations.set(key, trimmed);
        }
      }
    }
  }

  return citations;
}

// ============================================================================
// Indexing Logic
// ============================================================================

/**
 * Index a dissertation PDF into AgentDB cold storage
 */
async function indexDissertation(
  pdfPath: string,
  outputPath: string,
  verbose: boolean = false
): Promise<IndexingResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const log = (msg: string) => {
    if (verbose) console.log(`[IndexDissertation] ${msg}`);
  };

  log(`Starting indexing of: ${pdfPath}`);

  // Initialize AgentDB cold accessor
  const accessor = await createInitializedAgentDBColdAccessor({
    persistencePath: outputPath,
    verbose,
  });

  log(`AgentDB accessor initialized. Embedding available: ${accessor.isEmbeddingAvailable()}`);

  try {
    // Extract text from PDF
    log('Extracting text from PDF...');
    const text = await extractPdfText(pdfPath);
    log(`Extracted ${text.length} characters`);

    // Parse structure
    log('Parsing dissertation structure...');
    const sections = parseDissertationStructure(text);
    log(`Found ${sections.length} sections/chapters`);

    if (sections.length === 0) {
      // If no structure found, index as single chapter
      log('No structure detected, indexing as single document');
      const chunks = await accessor.addChapterContent(1, text);
      return {
        success: true,
        chaptersIndexed: 1,
        sectionsIndexed: 0,
        totalChunks: chunks,
        citationsIndexed: 0,
        errors,
        duration: Date.now() - startTime,
      };
    }

    // Index each section
    let chaptersIndexed = 0;
    let sectionsIndexed = 0;
    let totalChunks = 0;

    for (const section of sections) {
      if (!section.content || section.content.length < 100) {
        continue; // Skip very short sections
      }

      try {
        if (section.type === 'chapter') {
          log(`Indexing Chapter ${section.chapterNum}: ${section.title}`);
          const chunks = await accessor.addChapterContent(section.chapterNum, section.content);
          totalChunks += chunks;
          chaptersIndexed++;
        } else {
          const sectionName = section.sectionNum
            ? `${section.sectionNum} ${section.title}`
            : section.title;
          log(`Indexing Section ${section.chapterNum}.${section.sectionNum || '?'}: ${section.title}`);
          const chunks = await accessor.addSectionContent(
            section.chapterNum,
            sectionName,
            section.content
          );
          totalChunks += chunks;
          sectionsIndexed++;
        }
      } catch (error) {
        const errMsg = `Failed to index ${section.type} ${section.chapterNum}: ${error}`;
        errors.push(errMsg);
        log(`ERROR: ${errMsg}`);
      }
    }

    // Extract and index citations
    log('Extracting citations...');
    const citations = extractCitations(text);
    log(`Found ${citations.size} citations`);

    for (const [key, citation] of citations) {
      try {
        await accessor.addCitation(key, citation);
      } catch (error) {
        errors.push(`Failed to index citation ${key}: ${error}`);
      }
    }

    // Get final stats
    const stats = accessor.getStats();
    log(`Final stats: ${JSON.stringify(stats)}`);

    return {
      success: errors.length === 0,
      chaptersIndexed,
      sectionsIndexed,
      totalChunks: stats.totalChunks,
      citationsIndexed: citations.size,
      errors,
      duration: Date.now() - startTime,
    };

  } finally {
    await accessor.close();
  }
}

// ============================================================================
// CLI
// ============================================================================

const program = new Command();

program
  .name('index-dissertation')
  .description('Index a dissertation PDF into AgentDB cold storage for semantic search')
  .requiredOption('-p, --pdf <path>', 'Path to the dissertation PDF file')
  .option('-o, --output <path>', 'Output path for AgentDB storage', '.agentdb/dissertation-chunks.bin')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--json', 'Output results as JSON', false)
  .action(async (options) => {
    try {
      // Validate PDF exists
      const pdfPath = path.resolve(options.pdf);
      if (!fs.existsSync(pdfPath)) {
        console.error(`Error: PDF file not found: ${pdfPath}`);
        process.exit(1);
      }

      // Run indexing
      const result = await indexDissertation(pdfPath, options.output, options.verbose);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n=== Dissertation Indexing Complete ===\n');
        console.log(`PDF: ${pdfPath}`);
        console.log(`Output: ${options.output}`);
        console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
        console.log(`\nIndexed:`);
        console.log(`  - Chapters: ${result.chaptersIndexed}`);
        console.log(`  - Sections: ${result.sectionsIndexed}`);
        console.log(`  - Total chunks: ${result.totalChunks}`);
        console.log(`  - Citations: ${result.citationsIndexed}`);

        if (result.errors.length > 0) {
          console.log(`\nErrors (${result.errors.length}):`);
          for (const err of result.errors) {
            console.log(`  - ${err}`);
          }
        }

        console.log(`\nStatus: ${result.success ? '✓ Success' : '⚠ Completed with errors'}`);
      }

      process.exit(result.success ? 0 : 1);

    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  });

program.parse();

export { indexDissertation, parseDissertationStructure, extractCitations };
