#!/usr/bin/env node
/**
 * profile-to-output-style.mjs
 *
 * Render a trained god-agent style profile (.agentdb/universal/style-profiles.json)
 * into an Archon output-style `.md` file (~/.archon/output-styles/<name>.md).
 *
 * The profile already carries lanhamMetrics + base characteristics, so this is a
 * pure deterministic data-transform — no analyzer, no LLM, no Node deps.
 *
 * Bakes in two lessons from the 2026-06-24 mimicry-eval:
 *   1. NOISE SCRUB — drop corrupt samplePhrases + doc-header openingPatterns.
 *   2. VOICE FIX — when the trained voice is effaced/unvoiced, dial back the
 *      tacit-persuasion directive and reframe figures as STRUCTURAL (not vocal),
 *      so the style doesn't push the voice axis the wrong way.
 *
 * Usage:
 *   node scripts/profile-to-output-style.mjs [profileName] [--out PATH] [--deploy HOST]
 *     profileName   profile id (default: the active profile)
 *     --out PATH    output file (default: tmp/archon-output-styles/<name>.md)
 *     --deploy HOST scp to HOST:~/.archon/output-styles/ (e.g. daltonsalvo@192.168.50.141)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = '/home/dalton/projects/claudeflow-testing';
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out' && args[args.indexOf(a) - 1] !== '--deploy');

const store = JSON.parse(readFileSync(`${ROOT}/.agentdb/universal/style-profiles.json`, 'utf8'));
const profileKey = positional || store.activeProfile;
const profile = store.profiles[profileKey];
if (!profile) { console.error(`profile not found: ${profileKey}`); process.exit(1); }
const name = profile.metadata?.name || profileKey;   // clean, stable output-style name (e.g. "dalton-philosophical")

// ---- scrub helpers -----------------------------------------------------------
const isCleanPhrase = (p) =>
  typeof p === 'string' &&
  /^[A-Za-z][A-Za-z ,'-]{4,40}$/.test(p.trim()) &&     // letters/spaces only, reasonable length
  p.trim().split(/\s+/).length >= 2 &&                 // ≥2 words
  !/\d/.test(p) &&                                     // no dates/numbers
  !/\bve\b|salvo/i.test(p) &&                          // drop VR-thesis / author-name fragments
  !/(.)\1{3,}|[a-z]{18,}/i.test(p);                    // drop garbled run-together tokens

const isDocHeader = (p) => /\d{1,4}[\/.-]\d/.test(p) || /salvo|\b\d{4}\b/i.test(p);

// ---- derive style facts ------------------------------------------------------
const ch = profile.characteristics || {};
const lm = ch.lanhamMetrics || {};
const labels = lm.labels || {};
const expl = lm.explanations || {};
const slt = profile.metadata?.suggestedLanhamTarget || {};

const genre = slt.derivedFrom || 'academic';
const register = slt.registerTarget || labels.primaryRegister || 'high';   // trust label/target over noisy register explanation
const voiceLabel = labels.voice || 'moderate voice';
const effaced = /unvoiced|effaced/i.test(voiceLabel);
const parataxis = labels.parataxisHypotaxis || 'mixed';
const architecture = labels.periodicRunning || 'mixed';
const opacity = labels.opacity || 'mixed opacity';

// AT/THROUGH mode: academic default = transparent w/ AT moments; effaced keeps AT minimal/structural
const atThrough = genre === 'academic' ? 'transparent with AT moments' : 'oscillating';

// tacit budget, MODULATED by voice (the eval fix)
let tacit = slt.tacitPersuasionLevel || 'moderate';
// eval-tuned (2026-06-24): over-foregrounding spikes self-consciousness, over-suppression
// drifts opacity (the target's opacity/self-consciousness axes are mutually contradictory).
// "some" is the measured sweet spot for an effaced voice — restrained, not suppressed.
if (effaced && (tacit === 'dense' || tacit === 'moderate')) tacit = 'some';

const s = ch.sentences || {};
const avgLen = Math.round(s.averageLength || 0);
const longRatio = s.longSentenceRatio || 0;
const complexRatio = s.complexSentenceRatio || 0;
const tone = ch.tone || {};
const formal = (tone.formalityScore || 0) > 0.55;
const objective = (tone.objectivityScore || 0) > 0.55;
const claim = (ch.argumentPatterns && ch.argumentPatterns.claimStructure) || {};
const hedges = (claim.hedgingPatterns || []).filter((h) => /^[a-z][a-z '-]{1,30}$/i.test(h)).slice(0, 4);
const claimStrength = claim.claimStrength;
const transitions = (ch.commonTransitions || []).filter((t) => /^[a-z][a-z ]{2,20}$/i.test(t)).slice(0, 8);
// off by default: samplePhrases from docs-trained profiles are extraction artifacts of
// unreliable quality (e.g. "the user to") — they slip past grammatical filters and pollute
// the style. Opt in with --phrases only when the profile has curated, clean exemplars.
const samplePhrases = args.includes('--phrases') ? (ch.samplePhrases || []).filter(isCleanPhrase).slice(0, 5) : [];
const openings = (ch.openingPatterns || []).filter((o) => typeof o === 'string' && !isDocHeader(o)).slice(0, 3);

// ---- render ------------------------------------------------------------------
const L = [];
const desc = profile.metadata?.description || `Trained style profile ${name}`;
L.push(`# ${name}`);
L.push(`Description: ${desc} — ${register} register, ${parataxis}, ${voiceLabel}.`);
L.push('');
L.push('When composing prose, write in the following trained scholarly voice. Treat these as binding stylistic constraints.');

L.push('\n## REGISTER & DICTION');
L.push(`- Write in a ${register}${genre === 'academic' ? ', formal academic' : ''} register. Prefer precise${register === 'high' ? ', frequently Latinate' : ''} diction at conceptual turns; avoid colloquialism and contractions.`);
if (formal || objective) L.push(`- Maintain a ${formal ? 'formal' : ''}${formal && objective ? ', ' : ''}${objective ? 'objective' : ''} stance with minimal emotional coloring; keep the authorial "I" rare.`);

L.push('\n## SENTENCES & ARCHITECTURE');
if (avgLen) L.push(`- Favor ${longRatio > 0.45 ? 'long, ' : ''}${complexRatio > 0.45 ? 'syntactically complex ' : ''}sentences (typical length ~${avgLen} words${longRatio > 0.45 ? `; over half should be long and complex` : ''}), but vary length deliberately for rhythm.`);
L.push(`- Architecture is ${architecture}: ${/periodic/.test(architecture) || architecture === 'mixed' ? 'use periodic suspension (delaying the main clause) at argumentative turns, running delivery elsewhere.' : 'lead with the main clause; keep delivery running.'}`);

L.push('\n## CONNECTION');  // parataxis was the strongest measurable effect — keep it prominent
if (/paratactic/.test(parataxis)) L.push('- Connection is predominantly PARATACTIC: link independent clauses in coordinate chains (and / but / or), while admitting subordination only where the thought genuinely requires it.');
else if (/hypotactic/.test(parataxis)) L.push('- Connection is predominantly HYPOTACTIC: build nested subordinate structures; subordinate clauses carry the argumentative weight.');
else L.push('- Balance coordinate (paratactic) chains with subordination as the thought requires.');

L.push('\n## VOICE');
if (effaced) {
  L.push('- Effaced authorial presence ("unvoiced"): foreground the content and the argument over any sense of personality. Keep rhythmic self-display minimal.');
  L.push('- Do NOT add rhetorical flourish for its own sake; the prose should not read as performance.');
} else {
  L.push(`- ${voiceLabel}: let the prose reward reading aloud — vary rhythm and sentence length for vocal presence.`);
}

L.push(`\n## AT/THROUGH MODE — ${atThrough}`);
L.push('- Keep the prose mostly transparent: the reader should look THROUGH the language to the meaning.');
if (effaced) {
  L.push('- Keep the prose mostly transparent; the reader should look THROUGH the language. Brief, restrained emphasis (a balanced or parallel construction) is permissible at major argumentative turns, but kept rare — the language should not become conspicuous or the object of attention.');
} else {
  L.push('- At key argumentative turns (theses, conceptual pivots, conclusions) you may make the reader look AT the language via brief figures, register elevation, or periodic syntax — kept brief and occasional.');
}

L.push(`\n## ${effaced ? 'EMPHASIS' : 'TACIT PERSUASION'} BUDGET — ${tacit}`);
if (effaced) {
  L.push('- Use rhetorical figures sparingly and only where they serve the argument; let emphasis come mainly from sentence architecture and diction. Avoid sustained or decorative patterning.');
} else {
  const budgetCount = tacit === 'dense' ? 'throughout' : tacit === 'moderate' ? '2–3 per section' : 'occasionally, at key turns';
  L.push(`- Deploy notable patterns ${budgetCount}: parallelism, chiasmus, anaphora, polyptoton.`);
}

if (claimStrength || hedges.length) {
  L.push('\n## CLAIMS');
  L.push(`- Advance claims ${claimStrength === 'cautious' ? 'cautiously' : claimStrength === 'strong' ? 'with confidence' : 'with measured confidence'}${hedges.length ? `, hedging where appropriate (${hedges.map((h) => `"${h}"`).join(', ')})` : ''}; reserve strong markers for genuinely settled points.`);
}

if (transitions.length) {
  L.push('\n## TRANSITIONS');
  L.push(`- Prefer these connectives for paragraph and argumentative transitions: ${transitions.join(', ')}.`);
}

if (samplePhrases.length) {
  L.push('\n## CHARACTERISTIC PHRASING');
  L.push(`- Idiom consonant with this voice: ${samplePhrases.map((p) => `"${p}"`).join(', ')}.`);
}

L.push('\n## PROSE STYLE DIMENSIONS (the measured profile to match)');
const dim = (label, val, ex) => val && L.push(`- ${label}: ${val}${ex ? ` — ${ex}` : ''}`);
dim('Noun/Verb', labels.nounVerb, expl.nounVerb);
dim('Architecture', architecture, expl.periodicRunning);
dim('Connection', parataxis, expl.parataxisHypotaxis);
dim('Voice', voiceLabel, effaced ? 'effaced authorial presence; content over personality' : expl.voice);
dim('Register', register === 'high' ? 'high (academic)' : register, undefined);
dim('Opacity', /opaque/.test(opacity) ? 'foreground language only at conceptual pivots' : opacity, undefined);

const body = L.join('\n') + '\n';

// ---- write + (optional) deploy ----------------------------------------------
const out = flag('--out') || `${ROOT}/tmp/archon-output-styles/${name}.md`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, body);

console.log(`rendered ${name} -> ${out}`);
console.log(`  scrubbed: ${(ch.samplePhrases || []).length - samplePhrases.length} noisy samplePhrases, ${(ch.openingPatterns || []).length - openings.length} doc-header openingPatterns`);
console.log(`  voice="${voiceLabel}" -> effaced=${effaced}; tacit budget="${tacit}"; register="${register}" (trusted label/target)`);

const deployHost = flag('--deploy');
if (deployHost) {
  execFileSync('ssh', ['-o', 'BatchMode=yes', deployHost, 'mkdir -p ~/.archon/output-styles']);
  execFileSync('scp', ['-o', 'BatchMode=yes', out, `${deployHost}:.archon/output-styles/${name}.md`]);
  console.log(`  deployed -> ${deployHost}:~/.archon/output-styles/${name}.md`);
}
