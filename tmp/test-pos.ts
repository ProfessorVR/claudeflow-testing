import { tagPOS, isFiniteVerbTag, isThatSubordinator } from '../src/god-agent/cli/style/lanham-shared.js';

const tokens = tagPOS(['the','book','that','fell','from','that','shelf']);
console.log('Tags:', tokens.map(t => t.word + '/' + t.tag).join(' '));
console.log('that[2] subordinator?', isThatSubordinator(tokens[2]?.tag));
console.log('that[5] subordinator?', isThatSubordinator(tokens[5]?.tag));
console.log('fell finite?', isFiniteVerbTag(tokens[3]?.tag));

const tokens2 = tagPOS(['Having','often','found','he','began','to','write']);
console.log('\nFinite verb test:', tokens2.map(t => t.word + '/' + t.tag + (isFiniteVerbTag(t.tag) ? '*' : '')).join(' '));
