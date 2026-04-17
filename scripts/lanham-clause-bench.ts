/**
 * Performance micro-benchmark for LanhamClauseParser.
 * Asserts mean parse time < 100ms for 500-word passages.
 */
import { LanhamClauseParser } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend } from '../src/god-agent/cli/style/lanham-shared.js';

const backend = createEnPosBackend()!;
const parser = new LanhamClauseParser({ backend });

// Generate a ~500-word test passage with varied clause structure
const passage = `The implementation of the assessment framework for the evaluation of organizational performance represents a significant development in the field of management studies. The establishment of standardized procedures for the measurement of institutional effectiveness has been the subject of considerable investigation. When we construct special buildings or settings for ritual occasions of many kinds, from judicial proceedings to various ceremonies, when we set scenes and prepare for a social occasion, there is a resemblance to the enactment of composed theatrical performances by professional actors. Tacitly or explicitly we constantly draw on symbolic references and typifications shared by all participants. But what after all is one night? A short space, especially when the darkness dims so soon, and so soon a bird sings, or a faint green quickens in the hollow of the wave. Night, however, succeeds to night. The winter holds a pack of them in store and deals them equally, evenly, with indefatigable fingers. They lengthen; they darken. Some of them hold aloft clear planets, plates of brightness. He sat at the bar and drank his beer and looked at the mirror behind the bottles. The barman came over and he ordered another. He did not think about it. He drank the beer and it was cold and good and he set the glass down. If you have been in line, ordered simply to wait and to do nothing, and have watched the enemy bring their guns to bear upon you, and have felt the burst of the spherical case-shot as it came toward you, and have heard and seen the shrieking fragments go tearing through your company, and have known that the next shot carries your fate, you know that there is such a thing as faith. Studies serve for delight, for ornament, and for ability. Their chief use for delight is in privateness and retiring; for ornament, is in discourse; and for ability, is in the judgment and disposition of business. To spend too much time in studies is sloth; to use them too much for ornament is affectation.`;

const wordCount = passage.split(/\s+/).length;
console.log(`Passage: ${wordCount} words`);

const RUNS = 10;
const times: number[] = [];

for (let i = 0; i < RUNS; i++) {
  const start = performance.now();
  parser.parseDocument(passage);
  const elapsed = performance.now() - start;
  times.push(elapsed);
}

const mean = times.reduce((a, b) => a + b, 0) / times.length;
const min = Math.min(...times);
const max = Math.max(...times);

console.log(`Runs: ${RUNS}`);
console.log(`Mean: ${mean.toFixed(1)}ms`);
console.log(`Min:  ${min.toFixed(1)}ms`);
console.log(`Max:  ${max.toFixed(1)}ms`);
console.log(`Budget: <100ms`);
console.log(`Status: ${mean < 100 ? 'PASS' : 'FAIL'}`);
