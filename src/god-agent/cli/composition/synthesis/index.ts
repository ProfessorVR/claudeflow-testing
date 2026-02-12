/**
 * Synthesis Module - Phase 5: Integration with god-write
 *
 * This module provides integration between the staged composition pipeline
 * and the god-write command system. It includes:
 * - SIR-to-prose rendering
 * - Orchestrator integration
 * - Chapter spec mapping
 * - Composition orchestration
 *
 * @module synthesis
 */

// SIR-to-prose rendering
export {
  SIRToProseRenderer,
  type ProseRenderSpec,
  type ProseRenderResult,
  type ProseRenderMetadata
} from './sir-to-prose.js';

// Orchestrator integration
export {
  OrchestratorIntegration,
  type GodWriteIntegrationSpec,
  type GodWriteIntegrationResult,
  type DocumentStructure,
  type SectionStructure,
  type SubsectionStructure,
  type IntegrationMetadata
} from './orchestrator-integration.js';

// Chapter spec mapping
export {
  ChapterSpecMapper,
  type ChapterOutline,
  type SectionOutline
} from './chapter-spec-mapper.js';

// Composition orchestrator
export {
  CompositionOrchestrator,
  compositionOrchestrator,
  type CompositionRequest,
  type CompositionResult
} from './composition-orchestrator.js';

/**
 * Synthesis module metadata
 */
export const SYNTHESIS_METADATA = {
  version: '1.0.0',
  phase: 'Phase 5: Integration with god-write',
  description: 'Integration layer between staged composition and god-write',

  features: {
    sirToProseRendering: true,
    orchestratorIntegration: true,
    chapterSpecMapping: true,
    compositionOrchestration: true,
    styleProfileSupport: true,
    multipleDocumentTypes: true
  },

  documentTypes: [
    'chapter',
    'section',
    'paper',
    'article'
  ],

  renderingStyles: {
    academicStyles: ['formal', 'conversational', 'technical'],
    citationStyles: ['APA', 'MLA', 'Chicago'],
    paragraphDensities: ['sparse', 'moderate', 'dense']
  },

  integrationPoints: {
    godWrite: true,
    styleProfiles: true,
    qualityGauntlet: false, // Future integration
    corpusRetrieval: false  // Future integration
  }
} as const;
