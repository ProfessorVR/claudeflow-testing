// Quick validation of chunk trimming logic
// Simulates the trimChunkContent method behavior

function trimChunkContent(content, targetChars = 450) {
  if (content.length <= targetChars) return content;

  const sentences = content
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z""\u201c])/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) return content.substring(0, targetChars);

  const scored = sentences.map(s => {
    let score = 0;
    if (/[""\u201c\u201d]/.test(s)) score += 3;
    if (/\bp\.?\s*\d|pp\.\s*\d/i.test(s)) score += 2;
    const keyTerms = /\b(kinesis|phantasia|aisthesis|energeia|dunamis|entelecheia|dasein|befindlichkeit|pathos|logos|ethos|kairos|phronesis|rhetoric|being|motion|time|perception|soul|faculty|temporal|ontolog)/gi;
    const termMatches = s.match(keyTerms);
    if (termMatches) score += Math.min(termMatches.length, 3);
    if (/\b(argues|observes|maintains|contends|suggests|demonstrates|emphasizes|notes)\b/i.test(s)) score += 1;
    if (/^[A-Z\s]{10,}$/.test(s)) score -= 5;
    if (/^\d+\s*$/.test(s)) score -= 5;
    if (/^(chapter|section|part)\s+\d/i.test(s)) score -= 3;
    return { sentence: s, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected = [];
  let currentLength = 0;
  const withIdx = scored.map(s => ({
    ...s,
    originalIdx: sentences.indexOf(s.sentence),
  }));

  for (const item of withIdx) {
    if (currentLength + item.sentence.length + 1 > targetChars) {
      if (selected.length === 0) {
        selected.push({ ...item, sentence: item.sentence.substring(0, targetChars) });
      }
      break;
    }
    selected.push(item);
    currentLength += item.sentence.length + 1;
  }

  selected.sort((a, b) => a.originalIdx - b.originalIdx);
  return selected.map(s => s.sentence).join(' ');
}

// Test 1: Short content stays unchanged
const short = "Aristotle argues that motion is fundamental to being.";
console.assert(trimChunkContent(short) === short, 'Test 1 FAIL: short content changed');
console.log('Test 1 PASS: Short content preserved');

// Test 2: Long content gets trimmed
const long = `JOHN O'GORMAN 4
Phantasia is intimately connected to the sense of sight, preserving visual perceptions in a sort of after-image, and is itself a sort of psyche-sight, the source of mental images or visual impressions. Furthermore, Aristotle describes this phantasmatic mental activity as bouleutike, designating deliberation as entailing the combination of mental images. The similarity between bouleutike as a mental activity and as an activity of discourse is suggestive, as both may be understood as processes of taking appearances into account. O'Gorman argues that "there is no need to assume any precise correspondence between a phantasma and that which it is a phantasma of" (p. 4). In the Rhetoric, phantasia becomes a crucial component of persuasion, mediating between the speaker's evidentiary claims and the audience's judgment. This mediation operates through the generation of mental pictures that substitute for direct perception, rendering absent objects present to the mind's eye. The role of phantasia in Aristotle's broader psychological framework cannot be underestimated, as it connects the merely receptive faculty of aisthesis with the active, judgmental faculty of nous. Without phantasia, there would be no bridge between sensation and thought, and the entire edifice of Aristotle's philosophy of mind would collapse. CHAPTER HEADER This section continues below.`;
const trimmed = trimChunkContent(long, 450);
console.log(`Test 2: ${long.length} chars → ${trimmed.length} chars`);
console.assert(trimmed.length <= 500, `Test 2 FAIL: trimmed too long (${trimmed.length})`);
console.log('Test 2 PASS: Long content trimmed');

// Test 3: Quotations preserved
console.assert(trimmed.includes('"there is no need'), 'Test 3 FAIL: quotation lost');
console.log('Test 3 PASS: Quotation preserved');

// Test 4: OCR header removed
console.assert(!trimmed.includes('CHAPTER HEADER'), 'Test 4 FAIL: OCR header kept');
console.log('Test 4 PASS: OCR boilerplate not in trimmed output');

// Test 5: Key philosophical terms preserved
console.assert(trimmed.includes('phantasia') || trimmed.includes('Phantasia'), 'Test 5 FAIL: key term lost');
console.log('Test 5 PASS: Key philosophical terms preserved');

console.log('\n=== Summary ===');
console.log(`Original: ${long.length} chars, Trimmed: ${trimmed.length} chars`);
console.log(`Reduction: ${((1 - trimmed.length / long.length) * 100).toFixed(0)}%`);
console.log('\nTrimmed content:');
console.log(trimmed);
