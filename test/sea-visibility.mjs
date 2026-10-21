#!/usr/bin/env node
// 完整合成画面的可见性回归；只比较侧边海面，另确认中央阅读区保持安静。
import fs from 'node:fs';
import path from 'node:path';
import {CdpSession, findBrowser, launchBrowser, shutdownBrowser, navigateAndWait, reloadAndWait, evaluateInPage, sleep} from './probe.mjs';
const arg=(key,fallback)=>process.argv.includes(key)?process.argv[process.argv.indexOf(key)+1]:fallback;
const base=arg('--url','http://127.0.0.1:8798/');
const out=path.resolve(arg('--out','/tmp/wf-sea-visibility'));
fs.mkdirSync(out,{recursive:true});
const results=[];
const browser=await launchBrowser({browserPath:findBrowser().path,width:1440,height:900});
const cdp=new CdpSession(browser.pageWs);
try {
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  for(const width of [1440,390]) {
    const height=900;
    await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(const theme of ['day','night']) {
      await navigateAndWait(cdp,base);
      await evaluateInPage(cdp,`localStorage.setItem('wf-theme',${JSON.stringify(theme)});true`);
      await reloadAndWait(cdp);
      await evaluateInPage(cdp,'document.fonts.ready.then(()=>true)');
      await sleep(1000);
      const shots=[];
      for(let frame=0;frame<2;frame++) {
        if(frame){await sleep(2000);}
        const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        shots.push(shot.data);
        fs.writeFileSync(path.join(out,`${width}-${theme}-${frame}.png`),Buffer.from(shot.data,'base64'));
      }
      const diff=await evaluateInPage(cdp,`(async()=>{
        const pixels=[];
        for(const shot of ${JSON.stringify(shots)}) {
          const im=new Image();im.src='data:image/png;base64,'+shot;await im.decode();
          const cvs=new OffscreenCanvas(innerWidth,innerHeight),ctx=cvs.getContext('2d');
          ctx.drawImage(im,0,0);pixels.push(ctx.getImageData(0,0,innerWidth,innerHeight).data);
        }
        const measure=(left,right,top,bottom)=>{
          let total=0,strong=0,max=0;
          for(let y=Math.floor(top);y<bottom;y++){for(let x=Math.floor(left);x<right;x++){
            const p=(y*innerWidth+x)*4;let delta=0;
            for(let k=0;k<3;k++){delta=Math.max(delta,Math.abs(pixels[0][p+k]-pixels[1][p+k]));}
            total++;if(delta>=6){strong++;}max=Math.max(max,delta);
          }}
          return{total,strong,max,ratio:strong/total};
        };
        const edge=Math.min(280,innerWidth*.06);
        const left=measure(0,edge,innerHeight*.45,innerHeight*.82);
        const right=measure(innerWidth-edge,innerWidth,innerHeight*.45,innerHeight*.82);
        const hero=document.querySelector('.wf-hero__sentence').getBoundingClientRect();
        const center=measure(Math.max(0,hero.left-16),Math.min(innerWidth,hero.right+16),Math.max(0,hero.top-16),Math.min(innerHeight,hero.bottom+16));
        return{edgeChangedRatio:(left.strong+right.strong)/(left.total+right.total),edgeMax:Math.max(left.max,right.max),centerChangedRatio:center.ratio};
      })()`);
      // 1.2% 是此 fixture 两秒变化的工程下限，不代表通用的人类感知阈值。
      const ok=diff.edgeChangedRatio>=.012&&diff.centerChangedRatio<.001;
      results.push({width,theme,elapsedMs:2000,...diff,ok});
      console.log(`${ok?'PASS':'FAIL'} ${width} ${theme}: edge ${(diff.edgeChangedRatio*100).toFixed(2)}%, center ${(diff.centerChangedRatio*100).toFixed(2)}%`);
    }
  }
} finally {
  cdp.close();
  await shutdownBrowser(browser);
  fs.writeFileSync(path.join(out,'visibility.json'),JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');
}
process.exitCode=results.length===4&&results.every(r=>r.ok)?0:1;
