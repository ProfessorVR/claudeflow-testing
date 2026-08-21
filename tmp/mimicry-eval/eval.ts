import { readFileSync, readdirSync } from 'node:fs';
import { LanhamProseAnalyzer } from '../../src/god-agent/cli/style/lanham-prose-analyzer.js';

const ROOT = '/home/dalton/projects/claudeflow-testing';
const DIR = ROOT + '/tmp/mimicry-eval';
const sp = JSON.parse(readFileSync(ROOT + '/.agentdb/universal/style-profiles.json', 'utf8'));
const target = sp.profiles[sp.activeProfile].characteristics.lanhamMetrics;

const SCORE_FIELDS = ['nounVerbRatio','parataxisHypotaxisRatio','periodicRunningRatio','voiceScore','registerMarkednessScore','latinateGermanicRatio','opacityScore','selfConsciousnessScore'] as const;
const LABEL_AXES: [string,string][] = [
  ['nounVerb','nounVerb'], ['parataxisHypotaxis','parataxisHypotaxis'], ['periodicRunning','periodicRunning'],
  ['voice','voice'], ['register','primaryRegister'], ['opacity','opacity'],
];

const analyzer = new LanhamProseAnalyzer('academic');
const scoreDist = (m:any) => { let s=0,n=0; for(const f of SCORE_FIELDS){ const a=m[f],b=target[f]; if(typeof a==='number'&&typeof b==='number'){s+=Math.abs(a-b);n++;} } return s/n; };
const labelMatch = (m:any):[number,number] => { let mt=0,n=0; for(const [,k] of LABEL_AXES){ const a=m.labels?.[k],b=target.labels?.[k]; if(a!=null&&b!=null){n++; if(a===b)mt++;} } return [mt,n]; };
const avg = (a:number[]) => a.reduce((s,x)=>s+x,0)/(a.length||1);

const files = readdirSync(DIR).filter(f=>/^(styled|default)-\d+\.txt$/.test(f)).sort();

(async () => {
  const agg:Record<string,{dist:number[],lm:number[]}> = {styled:{dist:[],lm:[]}, default:{dist:[],lm:[]}};
  const axdiff:Record<string,Record<string,number[]>> = {styled:{}, default:{}};
  for(const f of SCORE_FIELDS){ axdiff.styled[f]=[]; axdiff.default[f]=[]; }
  const rows:any[]=[];
  for(const f of files){
    const cond = f.startsWith('styled')?'styled':'default';
    const text = readFileSync(DIR+'/'+f,'utf8').trim();
    if(text.split(/\s+/).length<40){ console.log('skip',f); continue; }
    const m:any = await analyzer.fullAnalysis(text);
    const d = scoreDist(m); const [mt,n] = labelMatch(m);
    agg[cond].dist.push(d); agg[cond].lm.push(mt);
    for(const fld of SCORE_FIELDS) if(typeof m[fld]==='number') axdiff[cond][fld].push(Math.abs(m[fld]-target[fld]));
    rows.push({f,cond,dist:+d.toFixed(3),label:`${mt}/${n}`,labels:LABEL_AXES.map(([ax,k])=>`${ax}:${m.labels?.[k]}`).join('  ')});
  }
  console.log('\nTARGET labels:', LABEL_AXES.map(([ax,k])=>`${ax}:${target.labels?.[k]}`).join('  '));
  console.log('\n=== PER DRAFT ===');
  for(const r of rows){ console.log(`${r.cond.padEnd(8)} ${r.f}  dist=${r.dist}  labelMatch=${r.label}`); console.log('            '+r.labels); }
  console.log('\n=== PER-AXIS mean |draft - target|  (lower = closer to your voice) ===');
  console.log('axis'.padEnd(26),'target  styled  default  winner');
  for(const fld of SCORE_FIELDS){
    const s=avg(axdiff.styled[fld]), d=avg(axdiff.default[fld]);
    console.log(fld.padEnd(26), String((target[fld]??0).toFixed(2)).padEnd(7), s.toFixed(3).padEnd(7), d.toFixed(3).padEnd(8), s<d?'STYLED':(s>d?'default':'tie'));
  }
  console.log('\n=== AGGREGATE ===');
  for(const c of ['styled','default']) console.log(`${c.padEnd(8)} mean axis-distance ${avg(agg[c].dist).toFixed(3)} | mean label-match ${avg(agg[c].lm).toFixed(2)}/6`);
  const sD=avg(agg.styled.dist),dD=avg(agg.default.dist),sL=avg(agg.styled.lm),dL=avg(agg.default.lm);
  console.log(`\nVERDICT: styled is ${sD<dD?'CLOSER':'NOT closer'} on axis scores (${sD.toFixed(3)} vs ${dD.toFixed(3)}); label-match ${sL.toFixed(2)} vs ${dL.toFixed(2)} / 6.`);
})();
