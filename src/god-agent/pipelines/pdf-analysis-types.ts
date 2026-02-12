/**
 * Type definitions for Hybrid PDF Analysis System
 */

export interface PreprocessOptions {
  pagesPerChunk?: number;
  verbose?: boolean;
  outputDir?: string;
}

export interface Chunk {
  id: number;
  filename: string;
  content: string;
  lines: number;
  estimatedPages: string;
  metadata?: Record<string, any>;
}

export interface ChunkMetadata {
  chunk_id: number;
  filename: string;
  lines: number;
  estimated_pages: string;
}

export interface PDFMetadata {
  source_pdf: string;
  source_path: string;
  processed_at: string;
  total_pages: number;
  total_lines: number;
  pages_per_chunk: number;
  lines_per_chunk: number;
  chunk_count: number;
  title: string | null;
  author: string | null;
  chunks: ChunkMetadata[];
}

export interface ChunkAnalysis {
  chunkId: number;
  filename: string;
  analysis: string;
  keyFindings: string[];
  timestamp: string;
  tokens?: number;
  corpusContext?: {
    used: boolean;
    chunkCount: number;
    collections: string[];
  };
}

export interface AnalysisResult {
  objective: string;
  pdfPath: string;
  totalChunks: number;
  analyzedChunks: number;
  skippedChunks: number[];
  chunkAnalyses: ChunkAnalysis[];
  synthesis: string;
  timestamp: string;
  mode: 'auto' | 'manual' | 'hybrid';
  trajectoryId?: string;
}

export interface ReviewableChunks {
  metadata: PDFMetadata;
  chunks: Chunk[];
  suggestions: {
    skip: number[];
    priority: number[];
    reason: string;
  };
}

export interface AnalysisCheckpoint {
  sessionId: string;
  pdfPath: string;
  objective: string;
  mode: 'auto' | 'manual' | 'hybrid';
  currentChunk: number;
  totalChunks: number;
  completedAnalyses: ChunkAnalysis[];
  timestamp: string;
  canResume: boolean;
}

export interface AnalysisConfig {
  mode: 'auto' | 'manual' | 'hybrid';
  objective: string;
  pagesPerChunk?: number;
  pageRange?: string;
  skipChunks?: number[];
  reviewBeforeAnalysis?: boolean;
  reviewAfterAnalysis?: boolean;
  saveCheckpoints?: boolean;
  maxTokensPerChunk?: number;
  useCorpus?: boolean;
  contextChunks?: number;
  targetCollections?: string[];
}

export type AnalysisMode = 'auto' | 'manual' | 'hybrid';

export interface PipelineProgress {
  phase: 'preprocessing' | 'analysis' | 'synthesis' | 'complete';
  currentChunk?: number;
  totalChunks: number;
  message: string;
  percentage: number;
}
