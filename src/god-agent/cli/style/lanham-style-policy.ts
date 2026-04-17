/**
 * Lanham Style Policy - Single source of truth for genre-specific style assumptions
 * Imported by both prompt building and validation logic.
 * See plan: plans/lanham-module-port-plan.md Phase 1
 */

export interface LanhamThresholdConfig {
  genre: 'academic' | 'legal' | 'narrative' | 'journalistic' | 'technical' | 'general';
  nounVerb: { lowBand: number; highBand: number };
  parataxisHypotaxis: { lowBand: number; highBand: number };
  periodicRunning: { lowBand: number; highBand: number };
  voice: { lowBand: number; highBand: number };
  opacity: { lowBand: number; highBand: number };
  /** Genre-specific register boundaries for Latinate/Germanic ratio.
   *  lowToMiddle: lgr >= this → middle (below → low)
   *  middleToHigh: lgr >= this → high
   *  Function words dilute the Latinate ratio, so academic prose needs
   *  lower boundaries than narrative/journalistic prose. */
  register: { lowToMiddle: number; middleToHigh: number };
  /** Signal-based noun-style override thresholds.
   *  When all three signals exceed these values, override nounVerb label
   *  away from "balanced" toward "predominantly noun-style". */
  nounStyleOverride: {
    nominalizationDensity: number;  // per 100 words
    beVerbRatio: number;            // fraction
    prepositionalPhraseDensity: number; // per sentence
  };
}

export type Genre = 'academic' | 'legal' | 'narrative' | 'journalistic' | 'technical' | 'general';

// NOTE: registerTarget values must stay consistent with GENRE_THRESHOLDS.register boundaries.
// If register boundaries are updated, verify these defaults still make sense.
export const GENRE_DEFAULTS: Record<Genre, { registerTarget: 'high' | 'middle' | 'low' | 'mixed'; allowRegisterPlay: boolean; tacitPersuasionLevel: 'almost none' | 'some' | 'moderate' | 'dense' }> = {
  academic:     { registerTarget: 'high',   allowRegisterPlay: false, tacitPersuasionLevel: 'moderate' },
  legal:        { registerTarget: 'high',   allowRegisterPlay: false, tacitPersuasionLevel: 'almost none' },
  narrative:    { registerTarget: 'mixed',  allowRegisterPlay: true,  tacitPersuasionLevel: 'some' },
  journalistic: { registerTarget: 'middle', allowRegisterPlay: false, tacitPersuasionLevel: 'some' },
  technical:    { registerTarget: 'middle', allowRegisterPlay: false, tacitPersuasionLevel: 'almost none' },
  general:      { registerTarget: 'middle', allowRegisterPlay: false, tacitPersuasionLevel: 'some' },
};

export const GENRE_THRESHOLDS: Record<Genre, LanhamThresholdConfig> = {
  academic: {
    genre: 'academic',
    nounVerb: { lowBand: 0.35, highBand: 0.65 },
    parataxisHypotaxis: { lowBand: 0.35, highBand: 0.65 },
    periodicRunning: { lowBand: 0.35, highBand: 0.65 },
    voice: { lowBand: 0.30, highBand: 0.70 },
    opacity: { lowBand: 0.25, highBand: 0.60 },
    register: { lowToMiddle: 0.15, middleToHigh: 0.30 },
    nounStyleOverride: { nominalizationDensity: 8, beVerbRatio: 0.25, prepositionalPhraseDensity: 3.0 },
  },
  legal: {
    genre: 'legal',
    nounVerb: { lowBand: 0.25, highBand: 0.55 },
    parataxisHypotaxis: { lowBand: 0.40, highBand: 0.70 },
    periodicRunning: { lowBand: 0.30, highBand: 0.60 },
    voice: { lowBand: 0.20, highBand: 0.50 },
    opacity: { lowBand: 0.20, highBand: 0.50 },
    register: { lowToMiddle: 0.15, middleToHigh: 0.30 },
    nounStyleOverride: { nominalizationDensity: 10, beVerbRatio: 0.30, prepositionalPhraseDensity: 4.0 },
  },
  narrative: {
    genre: 'narrative',
    nounVerb: { lowBand: 0.40, highBand: 0.70 },
    parataxisHypotaxis: { lowBand: 0.30, highBand: 0.65 },
    periodicRunning: { lowBand: 0.35, highBand: 0.65 },
    voice: { lowBand: 0.40, highBand: 0.75 },
    opacity: { lowBand: 0.30, highBand: 0.70 },
    register: { lowToMiddle: 0.25, middleToHigh: 0.45 },
    nounStyleOverride: { nominalizationDensity: 10, beVerbRatio: 0.30, prepositionalPhraseDensity: 4.0 },
  },
  journalistic: {
    genre: 'journalistic',
    nounVerb: { lowBand: 0.40, highBand: 0.70 },
    parataxisHypotaxis: { lowBand: 0.35, highBand: 0.65 },
    periodicRunning: { lowBand: 0.40, highBand: 0.70 },
    voice: { lowBand: 0.35, highBand: 0.70 },
    opacity: { lowBand: 0.30, highBand: 0.65 },
    register: { lowToMiddle: 0.25, middleToHigh: 0.45 },
    nounStyleOverride: { nominalizationDensity: 10, beVerbRatio: 0.30, prepositionalPhraseDensity: 4.0 },
  },
  technical: {
    genre: 'technical',
    nounVerb: { lowBand: 0.30, highBand: 0.60 },
    parataxisHypotaxis: { lowBand: 0.35, highBand: 0.65 },
    periodicRunning: { lowBand: 0.40, highBand: 0.70 },
    voice: { lowBand: 0.20, highBand: 0.50 },
    opacity: { lowBand: 0.20, highBand: 0.50 },
    register: { lowToMiddle: 0.20, middleToHigh: 0.40 },
    nounStyleOverride: { nominalizationDensity: 10, beVerbRatio: 0.30, prepositionalPhraseDensity: 4.0 },
  },
  general: {
    genre: 'general',
    // Phase F calibrated: nounVerb bands widened (0.58/0.85) to reduce false verb-style labels
    nounVerb: { lowBand: 0.58, highBand: 0.85 },
    parataxisHypotaxis: { lowBand: 0.35, highBand: 0.65 },
    periodicRunning: { lowBand: 0.35, highBand: 0.65 },
    // Phase F calibrated: voice bands shifted down (0.10/0.31) — voice scores cluster low,
    // old 0.70 threshold was nearly unreachable (15% agreement → 57.5% with new thresholds)
    voice: { lowBand: 0.10, highBand: 0.31 },
    opacity: { lowBand: 0.20, highBand: 0.50 },
    register: { lowToMiddle: 0.25, middleToHigh: 0.45 },
    nounStyleOverride: { nominalizationDensity: 10, beVerbRatio: 0.30, prepositionalPhraseDensity: 4.0 },
  },
};
