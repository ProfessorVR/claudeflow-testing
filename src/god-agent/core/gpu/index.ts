/**
 * GPU Server Management Module
 *
 * Exports GPU server manager for switching between:
 * - AWQ model (code generation)
 * - Embedding server (document ingestion)
 */

export {
  GPUServerManager,
  getGPUServerManager,
  activateAwqMode,
  activateEmbeddingMode,
  getGPUStatus,
  withEmbeddingMode,
  type ServerMode,
  type GPUServerConfig,
  type ServerStatus,
} from './gpu-server-manager.js';
