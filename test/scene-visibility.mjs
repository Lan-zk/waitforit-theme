#!/usr/bin/env node
// 最终合成画面：六秒局部运动、阅读区安静，reduce 静帧；静态缓存保持不变。
import fs from 'node:fs';
import path from 'node:path';
import {CdpSession, findBrowser, launchBrowser, shutdownBrowser, navigateAndWait, reloadAndWait, evaluateInPage, sleep} from './probe.mjs';
const arg=(key,fallback)=>process.argv.includes(key)?process.argv[process.argv.indexOf(key)+1]:fallback;
const base=arg('--url','http://127.0.0.1:8821/');
const out=path.resolve(arg('--out','/tmp/wf-scene-visibility'));
fs.mkdirSync(out,{recursive:true});
const results=[];
const browser=await launchBrowser({browserPath:findBrowser().path,width:1440,height:900});
const cdp=new CdpSession(browser.pageWs);
try {
  await cdp.connect();
  await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    const move=CanvasRenderingContext2D.prototype.moveTo;
    const curve=CanvasRenderingContext2D.prototype.quadraticCurveTo;
    window.wfGrassFrame=[];
    CanvasRenderingContext2D.prototype.moveTo=function(x,y){if(this.canvas.matches('[data-wf-canvas="day"]')){this.wfRoot=[x,y];}return move.call(this,x,y);};
    CanvasRenderingContext2D.prototype.quadraticCurveTo=function(cx,cy,x,y){if(this.canvas.matches('[data-wf-canvas="day"]')&&this.wfRoot){wfGrassFrame.push([this.wfRoot[0],this.wfRoot[1],x,y]);this.wfRoot=null;}return curve.call(this,cx,cy,x,y);};
    const clip=CanvasRenderingContext2D.prototype.clip;
    CanvasRenderingContext2D.prototype.clip=function(path,...args){if(this.canvas.matches('[data-wf-canvas="day"]')){window.wfWaterPath=path;}return clip.call(this,path,...args);};
    window.wfSceneDraws=0;
    CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
      if(this.canvas.matches('[data-wf-canvas="day"]')&&source.width===this.canvas.width&&source.height===this.canvas.height){window.wfSceneBase=source;wfSceneDraws++;wfGrassFrame=[];}
      return draw.call(this,source,...args);
    };
  `});
  for(const width of [1440,390]) {
    const height=width===390?844:900;
    await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(const theme of ['day','night']) {
      await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await navigateAndWait(cdp,base);
      await evaluateInPage(cdp,`localStorage.setItem('wf-theme',${JSON.stringify(theme)});true`);
      await reloadAndWait(cdp);
      await evaluateInPage(cdp,'document.fonts.ready.then(()=>true)');await sleep(1000);
      const cached=await evaluateInPage(cdp,'wfSceneBase.toDataURL()');
      const tipsBefore=await evaluateInPage(cdp,'wfGrassFrame');
      const shots=[];
      for(let frame=0;frame<2;frame++) {
        if(frame){await sleep(6000);}
        const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        shots.push(shot.data);fs.writeFileSync(path.join(out,`${width}-${theme}-${frame}.png`),Buffer.from(shot.data,'base64'));
      }
      const staticGround=cached===await evaluateInPage(cdp,'wfSceneBase.toDataURL()');
      const tipsAfter=await evaluateInPage(cdp,'wfGrassFrame');
      const scale=await evaluateInPage(cdp,`document.querySelector('[data-wf-canvas="day"]').width/innerWidth`);
      let rootsFixed=tipsBefore.length===tipsAfter.length,pairs=0,sameDirection=0;
      const motion=[];
      for(let i=0;i<tipsBefore.length;i++) {
        const a=tipsBefore[i],b=tipsAfter[i];
        if(!b||Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])>1e-6){rootsFixed=false;continue;}
        if(Math.abs(b[2]-a[2])>.1*scale){motion.push({x:a[0],y:a[1],dx:b[2]-a[2]});}
      }
      for(let i=0;i<motion.length;i++) {
        for(let j=i+1;j<motion.length;j++) {
          if(Math.abs(motion[i].x-motion[j].x)<=24*scale&&Math.abs(motion[i].y-motion[j].y)<=8*scale){pairs++;if(motion[i].dx*motion[j].dx>0){sameDirection++;}}
        }
      }
      const wind={rootsFixed,movingBlades:motion.length,observedBlades:tipsBefore.length,neighborPairs:pairs,neighborAgreement:pairs?sameDirection/pairs:0};
      const diff=await evaluateInPage(cdp,`(async()=>{
        const pixels=[];
        for(const shot of ${JSON.stringify(shots)}) {
          const im=new Image();im.src='data:image/png;base64,'+shot;await im.decode();
          const cvs=new OffscreenCanvas(innerWidth,innerHeight),ctx=cvs.getContext('2d');
          ctx.drawImage(im,0,0);pixels.push(ctx.getImageData(0,0,innerWidth,innerHeight).data);
        }
        const canvas=document.querySelector('[data-wf-canvas="day"]'),waterContext=canvas.getContext('2d');
        const measure=(left,right,top,bottom,mask=false)=>{
          let total=0,strong=0,max=0,sum=0;
          for(let y=Math.floor(top);y<Math.floor(bottom);y++){for(let x=Math.floor(left);x<Math.floor(right);x++){
            if(mask&&!waterContext.isPointInPath(wfWaterPath,x/innerWidth*canvas.width,y/innerHeight*canvas.height)){continue;}
            const p=(y*innerWidth+x)*4;let delta=0;
            for(let k=0;k<3;k++){delta=Math.max(delta,Math.abs(pixels[0][p+k]-pixels[1][p+k]));}
            total++;sum+=delta;if(delta>=4){strong++;}max=Math.max(max,delta);
          }}return{total,strong,max,meanDelta:sum/total,ratio:strong/total};
        };
        const grass=measure(innerWidth*.08,innerWidth*.55,innerHeight*.70,innerHeight*.84);
        const water=measure(innerWidth*(innerWidth<=520?.58:.69),innerWidth*.9,innerHeight*.70,innerHeight*.84,true);
        const hero=document.querySelector('.wf-hero__sentence').getBoundingClientRect();
        const center=measure(Math.max(0,hero.left-16),Math.min(innerWidth,hero.right+16),Math.max(0,hero.top-16),Math.min(innerHeight,hero.bottom+16));
        return{grass,water,center};
      })()`);
      await evaluateInPage(cdp,`window.wfReduced=new Promise(resolve=>matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>requestAnimationFrame(()=>resolve(true)),{once:true}));true`);
      await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await evaluateInPage(cdp,'wfReduced');
      await evaluateInPage(cdp,`new Promise((resolve,reject)=>{let last=wfSceneDraws,quiet=0;const start=performance.now();const timer=setInterval(()=>{quiet=wfSceneDraws===last?quiet+50:0;last=wfSceneDraws;if(quiet>=300){clearInterval(timer);resolve(true);}else if(performance.now()-start>3000){clearInterval(timer);reject(new Error('scene did not settle after reduce'));}},50);})`);
      const still=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      const draws=await evaluateInPage(cdp,'wfSceneDraws');await sleep(6000);
      const stillAfter=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      fs.writeFileSync(path.join(out,`${width}-${theme}-reduce-0.png`),Buffer.from(still.data,'base64'));
      fs.writeFileSync(path.join(out,`${width}-${theme}-reduce-1.png`),Buffer.from(stillAfter.data,'base64'));
      const reducedDraws=await evaluateInPage(cdp,'wfSceneDraws')-draws;
      const reducedPixels=await evaluateInPage(cdp,`(async()=>{const shots=${JSON.stringify([still.data,stillAfter.data])},p=[];for(const s of shots){const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=new OffscreenCanvas(innerWidth,innerHeight),x=c.getContext('2d');x.drawImage(im,0,0);p.push(x.getImageData(0,0,innerWidth,innerHeight).data);}let changed=0;for(let i=0;i<p[0].length;i++){if(p[0][i]!==p[1][i]){changed++;}}return changed;})()`);
      const reducedStable=reducedPixels===0&&reducedDraws===0;
      // 基于本场景视觉复核后的局部区域；上下界同时约束可辨运动与运动范围。
      const ok=staticGround&&reducedStable&&wind.rootsFixed&&wind.neighborPairs>=50&&wind.neighborAgreement>=.75&&diff.grass.ratio>=.001&&diff.grass.meanDelta<=10&&diff.grass.max<=64&&diff.water.ratio>=.02&&diff.water.meanDelta<=12&&diff.water.max<=64&&diff.center.ratio<.001;
      results.push({width,height,theme,elapsedMs:6000,staticGround,reducedStable,reducedPixels,reducedDraws,wind,...diff,ok});
      console.log(`${ok?'PASS':'FAIL'} ${width} ${theme}: grass ${diff.grass.ratio}, water ${diff.water.ratio}, center ${diff.center.ratio}, neighbors ${wind.neighborAgreement.toFixed(3)}, roots ${rootsFixed}, static ${staticGround}, reduce ${reducedStable}`);
    }
  }
} finally {
  cdp.close();await shutdownBrowser(browser);
  fs.writeFileSync(path.join(out,'visibility.json'),JSON.stringify({date:new Date().toISOString(),thresholdDelta:4,results},null,2)+'\n');
}
process.exitCode=results.length===4&&results.every(r=>r.ok)?0:1;
