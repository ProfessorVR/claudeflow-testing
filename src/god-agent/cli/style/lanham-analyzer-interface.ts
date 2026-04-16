/**
 * ILanhamAnalyzer - Two-tier analysis architecture interface
 * Tier 1 (heuristic): LanhamProseAnalyzer implements this with POS heuristics + phonemic analysis
 * Tier 2 (deep): AdvancedLanhamAnalyzer (v2) uses dependency parsing + LLM
 * Both return the same LanhamProseMetrics type.
 */
import type { LanhamProseMetrics } from '../../universal/style-analyzer.js';

export interface ILanhamAnalyzer {
  fullAnalysis(text: string): Promise<LanhamProseMetrics>;
  analyzeNounVerbAxis(text: string): Promise<Partial<LanhamProseMetrics>>;
  analyzeParataxisHypotaxis(text: string): Promise<Partial<LanhamProseMetrics>>;
  analyzePeriodicRunning(text: string): Promise<Partial<LanhamProseMetrics>>;
  analyzeVoice(text: string): Promise<Partial<LanhamProseMetrics>>;
  analyzeRegister(text: string): Promise<Partial<LanhamProseMetrics>>;
  analyzeOpacityTransparency(text: string): Promise<Partial<LanhamProseMetrics>>;
  detectTacitPatterns(text: string): Promise<Partial<LanhamProseMetrics>>;
}
