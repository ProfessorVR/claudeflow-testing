import * as fs from 'fs';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
const S='/tmp/claude-1000/-home-dalton-projects-claudeflow-testing/6304d5a4-a19f-4469-bf69-d5a2e0a40627/scratchpad/budweiser';
const files:Record<string,string>={'CS1':`${S}/cs1.txt`,'CS2':`${S}/cs2.txt`,'Bud_OLD':`${S}/bud.txt`,'Bud_NEW':`${S}/bud_styled.txt`};
const a=new LanhamProseAnalyzer();
const f=(n:number)=>(Math.round(n*1000)/1000).toString();
(async()=>{
 const r:Record<string,any>={};
 for(const[n,p]of Object.entries(files)) r[n]=await a.fullAnalysis(fs.readFileSync(p,'utf8'));
 const rows=['nounVerbRatio','parataxisHypotaxisRatio','periodicRunningRatio','voiceScore','dynamicRange','latinateGermanicRatio','registerMarkednessScore','opacityScore'];
 const names=Object.keys(files);
 const tgt=(k:string)=>((r['CS1'][k]+r['CS2'][k])/2);
 console.log('metric'.padEnd(26)+names.map(n=>n.padStart(11)).join('')+'   TARGET(avg)');
 for(const k of rows){
   console.log(k.padEnd(26)+names.map(n=>f(r[n][k]).padStart(11)).join('')+'   '+f(tgt(k)).padStart(8));
 }
 console.log('\nLABELS                    '+names.map(n=>n.padStart(14)).join(''));
 for(const lk of ['parataxisHypotaxis','periodicRunning','voice','primaryRegister','opacity']){
   console.log(lk.padEnd(26)+names.map(n=>String(r[n].labels[lk]).slice(0,13).padStart(14)).join(''));
 }
 console.log('\nantithesisCount           '+names.map(n=>String(r[n].tacitPatterns.antithesisCount).padStart(14)).join(''));
 // simple L2 distance to target on rows (lower=closer)
 const dist=(n:string)=>Math.sqrt(rows.reduce((s,k)=>s+Math.pow(r[n][k]-tgt(k),2),0));
 console.log('\nDistance to target style (lower = closer):');
 for(const n of ['Bud_OLD','Bud_NEW']) console.log('  '+n.padEnd(10)+f(dist(n)));
})();
