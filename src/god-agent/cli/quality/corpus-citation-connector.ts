/**
 * CorpusCitationConnector - Connects CitationCompletenessVerifier to ChromaDB corpus
 *
 * Implements high-impact improvement #1 from phd-pipeline-improvement-proposal.md:
 * - Query corpus during verification to validate page numbers
 * - Suggest relevant sources from rhetorical_ontology collection
 * - Verify citation content against indexed chunks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

export interface CorpusChunk {
  chunkId: string;
  content: string;
  metadata: ChunkMetadata;
  similarity?: number;
}

export interface ChunkMetadata {
  source?: string;
  pathRel?: string;
  docId?: string;
  pageStart?: number;
  pageEnd?: number;
  author?: string;
  title?: string;
  year?: number;
  collection?: string;
}

export interface CitationVerificationResult {
  isValid: boolean;
  confidence: number;
  matchedChunks: CorpusChunk[];
  suggestedCitation?: string;
  issues: string[];
}

export interface CorpusSuggestion {
  author: string;
  title: string;
  year?: number;
  relevantChunks: CorpusChunk[];
  relevanceScore: number;
}

// ============================================================================
// Manifest Parser
// ============================================================================

interface ManifestEntry {
  pathAbs: string;
  pathRel: string;
  collection: string;
  docId: string;
  chunks: number;
  meta: {
    authorRaw: string;
    titleRaw: string;
    year?: number;
  };
}

function parseManifest(projectRoot: string): Map<string, ManifestEntry> {
  const manifestPath = path.join(projectRoot, 'scripts/ingest/manifest.jsonl');
  const entries = new Map<string, ManifestEntry>();

  if (!fs.existsSync(manifestPath)) {
    return entries;
  }

  const lines = fs.readFileSync(manifestPath, 'utf-8').split('\n').filter(l => l.trim());

  for (const line of lines) {
    try {
      const raw = JSON.parse(line);
      if (raw.status === 'ok' && raw.doc_id) {
        entries.set(raw.doc_id, {
          pathAbs: raw.path_abs,
          pathRel: raw.path_rel,
          collection: raw.collection,
          docId: raw.doc_id,
          chunks: raw.chunks,
          meta: {
            authorRaw: raw.meta?.author_raw || '',
            titleRaw: raw.meta?.title_raw || '',
            year: raw.meta?.year,
          },
        });
      }
    } catch {
      // Skip malformed lines
    }
  }

  return entries;
}

// ============================================================================
// CorpusCitationConnector Class
// ============================================================================

export class CorpusCitationConnector {
  private readonly projectRoot: string;
  private readonly chromaDbPath: string;
  private readonly manifest: Map<string, ManifestEntry>;
  private pythonAvailable: boolean | null = null;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.chromaDbPath = path.join(this.projectRoot, 'vector_db_1536');
    this.manifest = parseManifest(this.projectRoot);
  }

  /**
   * Check if ChromaDB Python interface is available
   */
  private async checkPythonAvailable(): Promise<boolean> {
    if (this.pythonAvailable !== null) {
      return this.pythonAvailable;
    }

    try {
      await execAsync('python3 -c "import chromadb"');
      this.pythonAvailable = true;
    } catch {
      this.pythonAvailable = false;
    }

    return this.pythonAvailable;
  }

  /**
   * Query ChromaDB for chunks matching a search query
   *
   * Note: Uses where_document filtering instead of embedding-based query
   * because the collection uses 1536-dim embeddings from the project's model
   */
  async searchCorpus(query: string, topK: number = 5): Promise<CorpusChunk[]> {
    if (!await this.checkPythonAvailable()) {
      return [];
    }

    // Extract key search terms
    const searchTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 5);

    if (searchTerms.length === 0) {
      return [];
    }

    // Write Python script to temp file to avoid escaping issues
    const tmpDir = path.join(this.projectRoot, '.tmp');
    try {
      await fs.promises.mkdir(tmpDir, { recursive: true });
    } catch {
      // Ignore mkdir errors
    }

    const scriptPath = path.join(tmpDir, 'corpus_search.py');
    const configPath = path.join(tmpDir, 'corpus_search_config.json');

    const config = {
      chromaDbPath: this.chromaDbPath,
      searchTerms,
      topK,
    };

    const pythonScript = `
import chromadb
import json
import sys

with open("${configPath.replace(/\\/g, '/')}") as f:
    config = json.load(f)

try:
    client = chromadb.PersistentClient(path=config["chromaDbPath"])
    collection = client.get_collection("knowledge_chunks")

    all_results = []
    seen_ids = set()

    for term in config["searchTerms"][:3]:
        try:
            results = collection.get(
                where_document={"$contains": term},
                limit=config["topK"] * 2,
                include=["documents", "metadatas"]
            )
            if results and results["ids"]:
                for i, chunk_id in enumerate(results["ids"]):
                    if chunk_id not in seen_ids:
                        seen_ids.add(chunk_id)
                        all_results.append({
                            "chunkId": chunk_id,
                            "content": results["documents"][i] if results.get("documents") else "",
                            "metadata": results["metadatas"][i] if results.get("metadatas") else {},
                            "matchedTerm": term
                        })
        except Exception:
            pass

    # Score results by term match count
    for r in all_results:
        content_lower = (r.get("content") or "").lower()
        r["score"] = sum(1 for t in config["searchTerms"] if t in content_lower)

    # Sort by score and limit
    all_results.sort(key=lambda x: x.get("score", 0), reverse=True)
    print(json.dumps(all_results[:config["topK"]]))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

    try {
      await fs.promises.writeFile(configPath, JSON.stringify(config));
      await fs.promises.writeFile(scriptPath, pythonScript);

      const { stdout } = await execAsync(`python3 "${scriptPath}"`, {
        timeout: 30000,
      });

      const raw = JSON.parse(stdout.trim());

      if (raw.error) {
        console.error('[CorpusCitationConnector] ChromaDB error:', raw.error);
        return [];
      }

      return raw.map((r: { chunkId: string; content: string; metadata: Record<string, unknown>; score?: number }) => ({
        chunkId: r.chunkId,
        content: r.content,
        metadata: this.normalizeMetadata(r.metadata),
        similarity: r.score != null ? Math.min(1, r.score / 5) : 0.5,
      }));
    } catch (error) {
      console.error('[CorpusCitationConnector] Search failed:', error);
      return [];
    } finally {
      // Clean up temp files
      try {
        await fs.promises.unlink(scriptPath);
        await fs.promises.unlink(configPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Verify a citation against the corpus
   */
  async verifyCitation(
    citationText: string,
    surroundingContext: string
  ): Promise<CitationVerificationResult> {
    const result: CitationVerificationResult = {
      isValid: false,
      confidence: 0,
      matchedChunks: [],
      issues: [],
    };

    // Extract author and year from citation
    const authorMatch = citationText.match(/([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)*)/);
    const yearMatch = citationText.match(/(\d{4})/);

    const author = authorMatch?.[1] || '';
    const year = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : undefined;

    // Search corpus for matching content
    const searchQuery = `${author} ${surroundingContext.substring(0, 200)}`;
    const chunks = await this.searchCorpus(searchQuery, 10);

    if (chunks.length === 0) {
      result.issues.push('No matching content found in corpus');
      return result;
    }

    // Check for author/year match in chunk metadata
    const matchingChunks = chunks.filter(chunk => {
      const meta = chunk.metadata;
      const authorMatches = meta.author?.toLowerCase().includes(author.toLowerCase()) || false;
      const yearMatches = year === undefined || meta.year === year;
      return authorMatches || yearMatches;
    });

    if (matchingChunks.length > 0) {
      result.isValid = true;
      result.confidence = Math.min(1, matchingChunks[0].similarity || 0.7);
      result.matchedChunks = matchingChunks;

      // Suggest proper citation format
      const bestMatch = matchingChunks[0];
      if (bestMatch.metadata.author && bestMatch.metadata.year) {
        result.suggestedCitation = `(${bestMatch.metadata.author}, ${bestMatch.metadata.year})`;
      }
    } else {
      result.matchedChunks = chunks.slice(0, 3);
      result.confidence = 0.3;
      result.issues.push(
        `Author "${author}" not found in top corpus matches. ` +
        `Closest matches: ${chunks.slice(0, 3).map(c => c.metadata.author).filter(Boolean).join(', ')}`
      );
    }

    return result;
  }

  /**
   * Suggest relevant sources from corpus for a given topic
   */
  async suggestSourcesForTopic(
    topic: string,
    existingCitations: string[] = []
  ): Promise<CorpusSuggestion[]> {
    const chunks = await this.searchCorpus(topic, 20);

    if (chunks.length === 0) {
      return [];
    }

    // Group chunks by author/title
    const bySource = new Map<string, CorpusChunk[]>();

    for (const chunk of chunks) {
      const key = `${chunk.metadata.author || 'Unknown'}|${chunk.metadata.title || 'Unknown'}`;
      if (!bySource.has(key)) {
        bySource.set(key, []);
      }
      bySource.get(key)!.push(chunk);
    }

    // Convert to suggestions, filtering out already-cited sources
    const suggestions: CorpusSuggestion[] = [];

    for (const [key, sourceChunks] of bySource) {
      const [author, title] = key.split('|');

      // Skip if already cited
      const alreadyCited = existingCitations.some(
        c => c.toLowerCase().includes(author.toLowerCase())
      );
      if (alreadyCited) continue;

      const avgSimilarity =
        sourceChunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / sourceChunks.length;

      suggestions.push({
        author,
        title,
        year: sourceChunks[0].metadata.year,
        relevantChunks: sourceChunks.slice(0, 3),
        relevanceScore: avgSimilarity,
      });
    }

    // Sort by relevance
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return suggestions.slice(0, 5);
  }

  /**
   * Get all available sources in corpus for a specific author
   */
  async getSourcesByAuthor(authorName: string): Promise<ManifestEntry[]> {
    const matches: ManifestEntry[] = [];
    const searchLower = authorName.toLowerCase();

    for (const entry of this.manifest.values()) {
      if (entry.meta.authorRaw.toLowerCase().includes(searchLower)) {
        matches.push(entry);
      }
    }

    return matches;
  }

  /**
   * Get corpus statistics
   */
  getCorpusStats(): { totalDocuments: number; totalChunks: number; authors: string[] } {
    let totalChunks = 0;
    const authors = new Set<string>();

    for (const entry of this.manifest.values()) {
      totalChunks += entry.chunks;
      if (entry.meta.authorRaw) {
        authors.add(entry.meta.authorRaw);
      }
    }

    return {
      totalDocuments: this.manifest.size,
      totalChunks,
      authors: Array.from(authors).sort(),
    };
  }

  /**
   * Normalize metadata from ChromaDB to consistent format
   */
  private normalizeMetadata(raw: Record<string, unknown>): ChunkMetadata {
    // Look up in manifest for additional metadata
    const docId = (raw.doc_id as string) || (raw.docId as string);
    const manifestEntry = docId ? this.manifest.get(docId) : undefined;

    return {
      source: (raw.source as string) || undefined,
      pathRel: (raw.path_rel as string) || (raw.pathRel as string) || undefined,
      docId: docId || undefined,
      pageStart: (raw.page_start as number) || (raw.pageStart as number) || (raw.page as number) || undefined,
      pageEnd: (raw.page_end as number) || (raw.pageEnd as number) || (raw.page as number) || undefined,
      author: (raw.author as string) || manifestEntry?.meta.authorRaw || undefined,
      title: (raw.title as string) || manifestEntry?.meta.titleRaw || undefined,
      year: (raw.year as number) || manifestEntry?.meta.year || undefined,
      collection: (raw.collection as string) || manifestEntry?.collection || undefined,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let connectorInstance: CorpusCitationConnector | null = null;

export function getCorpusCitationConnector(projectRoot?: string): CorpusCitationConnector {
  if (!connectorInstance) {
    connectorInstance = new CorpusCitationConnector(projectRoot);
  }
  return connectorInstance;
}

// ============================================================================
// CLI Test
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const connector = new CorpusCitationConnector();

    console.log('=== Corpus Stats ===');
    console.log(connector.getCorpusStats());

    console.log('\n=== Testing Citation Verification ===');
    const verification = await connector.verifyCitation(
      '(Aristotle, 2014)',
      'the soul is the form of the body'
    );
    console.log(JSON.stringify(verification, null, 2));

    console.log('\n=== Testing Source Suggestions ===');
    const suggestions = await connector.suggestSourcesForTopic('phantasia perception imagination');
    console.log(JSON.stringify(suggestions.slice(0, 3), null, 2));
  })();
}
