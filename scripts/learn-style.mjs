#!/usr/bin/env node
/**
 * Style Learning Script
 * Learns writing style from PDF and DOCX files in specified directories
 */

import { UniversalAgent, PDFExtractor } from '../src/god-agent/universal/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

const profileName = process.argv[2] || 'academic-papers';

// Parse CLI flags from remaining args
const rawArgs = process.argv.slice(3);
const directories = [];
let lanhamMode = 'auto';
let analyzerTier = 'heuristic';

for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--lanham-mode' && i + 1 < rawArgs.length) {
    lanhamMode = rawArgs[++i];
    if (!['auto', 'on', 'off'].includes(lanhamMode)) {
      console.error('Invalid --lanham-mode value:', lanhamMode, '(must be auto|on|off)');
      process.exit(1);
    }
  } else if (rawArgs[i] === '--lanham-tier' && i + 1 < rawArgs.length) {
    analyzerTier = rawArgs[++i];
    if (!['heuristic', 'advanced'].includes(analyzerTier)) {
      console.error('Invalid --lanham-tier value:', analyzerTier, '(must be heuristic|advanced)');
      process.exit(1);
    }
  } else {
    directories.push(rawArgs[i]);
  }
}

if (directories.length === 0) {
  directories.push('style-training');
}

/**
 * Extract text from a .docx file by reading the XML inside the zip.
 */
async function extractDocxText(filePath) {
  const { execSync } = await import('child_process');
  const { writeFileSync, unlinkSync, mkdtempSync } = await import('fs');
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  try {
    const tmpDir = mkdtempSync(join(tmpdir(), 'docx-'));
    const scriptPath = join(tmpDir, 'extract.py');
    writeFileSync(scriptPath, `
import zipfile, xml.etree.ElementTree as ET, sys
z = zipfile.ZipFile(sys.argv[1])
tree = ET.parse(z.open('word/document.xml'))
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
for p in tree.findall('.//w:p', ns):
    line = ''.join(r.text or '' for r in p.findall('.//w:t', ns))
    if line.strip():
        print(line.strip())
`);
    const result = execSync(`python3 "${scriptPath}" "${filePath}"`, {
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8',
    });
    try { unlinkSync(scriptPath); } catch {}
    return result.trim();
  } catch (e) {
    throw new Error(`DOCX extraction failed for ${filePath}: ${e.message}`);
  }
}

console.log('=== God Agent Style Learning ===');
console.log('Profile name:', profileName);
console.log('Directories:', directories.join(', '));
console.log('Lanham mode:', lanhamMode);
console.log('Analyzer tier:', analyzerTier);

const agent = new UniversalAgent({ verbose: false });
await agent.initialize();

const extractor = new PDFExtractor(process.cwd());

const allTexts = [];
let totalPdfs = 0;
let failedPdfs = 0;

for (const dir of directories) {
  const fullPath = path.resolve(dir);
  if (!fs.existsSync(fullPath)) {
    console.warn('Warning: Directory not found:', fullPath);
    continue;
  }

  console.log('\nProcessing:', dir);

  // Extract PDFs
  const result = await extractor.extractFromDirectory(fullPath, { maxFiles: 100 });

  totalPdfs += result.totalFiles;
  failedPdfs += result.failed.length;

  for (const pdf of result.successful) {
    if (pdf.text.length > 500) {
      allTexts.push(pdf.text);
      console.log('  ✓', pdf.filename, '(' + pdf.wordCount + ' words)');
    }
  }

  for (const pdf of result.failed) {
    console.log('  ✗', pdf.filename + ':', pdf.error);
  }

  // Extract DOCX files
  const allFiles = fs.readdirSync(fullPath);
  const docxFiles = allFiles.filter(f => f.toLowerCase().endsWith('.docx') && !f.includes(':Zone.Identifier'));
  for (const docxFile of docxFiles) {
    const docxPath = path.join(fullPath, docxFile);
    try {
      const text = await extractDocxText(docxPath);
      if (text.length > 500) {
        const wordCount = text.split(/\s+/).length;
        allTexts.push(text);
        totalPdfs++;
        console.log('  ✓', docxFile, '(' + wordCount + ' words)');
      }
    } catch (e) {
      failedPdfs++;
      console.log('  ✗', docxFile + ':', e.message);
    }
  }
}

console.log('\n=== Extraction Summary ===');
console.log('Total PDFs found:', totalPdfs);
console.log('Successfully extracted:', allTexts.length);
console.log('Failed:', failedPdfs);

if (allTexts.length === 0) {
  console.error('\nError: No text could be extracted from PDFs.');
  console.error('Try installing poppler-utils: sudo apt install poppler-utils');
  await agent.shutdown();
  process.exit(1);
}

console.log('\n=== Creating Style Profile ===');
const profile = await agent.learnStyle(profileName, allTexts, {
  description: 'Learned from ' + allTexts.length + ' documents in: ' + directories.join(', '),
  tags: ['pdf', ...directories.map(d => path.basename(d))],
  setAsActive: true,
  lanhamMode,
  lanhamTier: analyzerTier,
});

if (!profile) {
  console.error('Failed to create style profile');
  await agent.shutdown();
  process.exit(1);
}

console.log('\nProfile ID:', profile.metadata.id);
console.log('Source documents:', profile.metadata.sourceCount);

const chars = profile.characteristics;

console.log('\n=== Style Characteristics ===');
console.log('\nSentence Structure:');
console.log('  Average length:', Math.round(chars.sentences.averageLength), 'words');
console.log('  Short sentences:', (chars.sentences.shortSentenceRatio * 100).toFixed(0) + '%');
console.log('  Medium sentences:', (chars.sentences.mediumSentenceRatio * 100).toFixed(0) + '%');
console.log('  Long sentences:', (chars.sentences.longSentenceRatio * 100).toFixed(0) + '%');
console.log('  Complex sentences:', (chars.sentences.complexSentenceRatio * 100).toFixed(0) + '%');

console.log('\nVocabulary:');
console.log('  Academic word ratio:', (chars.vocabulary.academicWordRatio * 100).toFixed(1) + '%');
console.log('  Unique word ratio:', (chars.vocabulary.uniqueWordRatio * 100).toFixed(1) + '%');
console.log('  Average word length:', chars.vocabulary.averageWordLength.toFixed(1), 'chars');
console.log('  Contraction usage:', (chars.vocabulary.contractionUsage * 100).toFixed(2) + '%');

console.log('\nTone:');
console.log('  Formality:', (chars.tone.formalityScore * 100).toFixed(0) + '%');
console.log('  Objectivity:', (chars.tone.objectivityScore * 100).toFixed(0) + '%');
console.log('  Hedging frequency:', (chars.tone.hedgingFrequency * 100).toFixed(2) + '%');

console.log('\nStructure:');
console.log('  Avg paragraph length:', Math.round(chars.structure.paragraphLengthAvg), 'words');
console.log('  Passive voice ratio:', (chars.structure.passiveVoiceRatio * 100).toFixed(0) + '%');
console.log('  Transition word density:', (chars.structure.transitionWordDensity * 100).toFixed(2) + '%');

console.log('\nCommon transitions:', chars.commonTransitions.slice(0, 8).join(', '));
console.log('Citation style:', chars.citationStyle);

if (chars.lanhamMetrics) {
  const lm = chars.lanhamMetrics;
  console.log('\nLanham Prose Dimensions:');
  console.log('  Noun/Verb:      ', lm.labels.nounVerb, '—', lm.explanations.nounVerb);
  console.log('  Architecture:   ', lm.labels.periodicRunning, '—', lm.explanations.periodicRunning);
  console.log('  Connection:     ', lm.labels.parataxisHypotaxis, '—', lm.explanations.parataxisHypotaxis);
  console.log('  Voice:          ', lm.labels.voice, '—', lm.explanations.voice);
  console.log('  Register:       ', lm.labels.primaryRegister + (lm.labels.registerMixed ? ' (mixed)' : ''), '—', lm.explanations.register);
  console.log('  Opacity:        ', lm.labels.opacity, '—', lm.explanations.opacity);
  if (lm.explanations.tacitPatterns) console.log('  Tacit Patterns: ', lm.explanations.tacitPatterns);
  console.log('  Analysis depth: ', lm.analysisDepth);
  console.log('  Analyzer tier:  ', profile.metadata.lanhamAnalyzerTier || 'heuristic');
} else {
  console.log('\nLanham Prose Dimensions: not computed (use --lanham-mode on to enable)');
}

console.log('\n=== Usage ===');
console.log('This profile is now ACTIVE. Future /god-write calls will use it.');
console.log('');
console.log('To use explicitly in code:');
console.log('  agent.write("topic", { styleProfileId: "' + profile.metadata.id + '" })');

await agent.shutdown();
console.log('\n✅ Style learning complete!');
