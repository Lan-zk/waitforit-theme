#!/usr/bin/env node
// 同机10秒场景绘制比较；记录实际视口与浏览器，不作为真机性能结论。
import fs from 'node:fs';
import {CdpSession,findBrowser,launchBrowser,shutdownBrowser,navigateAndWait,evaluateInPage,sleep} from './probe.mjs';
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d;
const base=arg('--url','http://127.0.0.1:8821/'),out=arg('--out','/tmp/wf-scene-performance.json');
const browser=await launchBrowser({browserPath:findBrowser().path,width:1440,height:900});
const cdp=new CdpSession(browser.pageWs);
try{
 await cdp.connect();for(const d of ['Page','Runtime']){await cdp.send(d+'.enable');}
 await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.wfPerf={draws:0,samples:[],errors:[]};
 addEventListener('error',event=>wfPerf.errors.push(event.message));
 for(const method of ['putImageData','drawImage']){
  const original=CanvasRenderingContext2D.prototype[method];
  CanvasRenderingContext2D.prototype[method]=function(...args){if(this.canvas.matches?.('[data-wf-canvas="day"]')&&args[0].width===this.canvas.width&&args[0].height===this.canvas.height){wfPerf.draws++;}return original.apply(this,args);};
 }
 const raf=window.requestAnimationFrame;
 window.requestAnimationFrame=function(callback){return raf.call(window,now=>{const count=wfPerf.draws,start=performance.now();callback(now);if(wfPerf.draws>count){wfPerf.samples.push(performance.now()-start);}});};
 `});
 await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await navigateAndWait(cdp,base);await sleep(1000);await evaluateInPage(cdp,'wfPerf.samples=[];wfPerf.draws=0;true');
 await sleep(10000);
 const result=await evaluateInPage(cdp,`(()=>{const s=wfPerf.samples.slice().sort((a,b)=>a-b);return{userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],durationMs:10000,hidden:document.hidden,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,cycle:getComputedStyle(document.documentElement).getPropertyValue('--wf-motion-wind-cycle'),errors:wfPerf.errors,logicalFrames:wfPerf.draws,medianMs:s[Math.floor(s.length*.5)],p95Ms:s[Math.floor(s.length*.95)],samples:s.length};})()`);
 if(result.samples<100){throw new Error('Not enough active drawing samples: '+JSON.stringify(result));}
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{cdp.close();await shutdownBrowser(browser);}
