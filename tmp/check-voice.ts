import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
const analyzer = new LanhamProseAnalyzer('general');
const RHETORICAL = 'We shall not flag or fail. We shall go on to the end. We shall fight in France, we shall fight on the seas and oceans, we shall fight with growing confidence and growing strength in the air, we shall defend our island, whatever the cost may be.';
const result = await analyzer.fullAnalysis(RHETORICAL);
console.log('voice score:', result.voiceScore.toFixed(4));
console.log('voice label:', result.labels.voice);
console.log('voice bands: lowBand=0.30, highBand=0.70');
console.log('dynamic range:', result.dynamicRange.toFixed(4));
console.log('register score:', result.registerMarkednessScore.toFixed(4));
