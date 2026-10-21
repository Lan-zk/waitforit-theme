#!/usr/bin/env node
// 新的外部契约：首屏构图、原生滚动、逐篇OG安全区域及构建字体隔离。
import fs from 'node:fs';
import path from 'node:path';
import {CdpSession,findBrowser,launchBrowser,shutdownBrowser,navigateAndWait,reloadAndWait,evaluateInPage,sleep} from './probe.mjs';
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d;
const base=arg('--url','http://127.0.0.1:8798/');
const out=path.resolve(arg('--out','/tmp/wf-fidelity'));
const build=arg('--build-root',null);
fs.mkdirSync(out,{recursive:true});
const results=[];
const check=(name,ok,detail)=>{results.push({name,ok:Boolean(ok),detail});if(!ok){console.error('FAIL',name,detail);}};
const browser=await launchBrowser({browserPath:findBrowser().path,width:1440,height:900});
const cdp=new CdpSession(browser.pageWs);
try {
  await cdp.connect();for(const d of ['Page','Runtime','Network']){await cdp.send(d+'.enable');}
  const ev=s=>evaluateInPage(cdp,s);
  for(const width of [1440,390]) {
    await cdp.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const theme of ['day','night']) {
      await navigateAndWait(cdp,base);
      await ev(`localStorage.setItem('wf-theme',${JSON.stringify(theme)});true`);await reloadAndWait(cdp);
      const frame=await ev(`(()=>{const h=document.querySelector('.wf-hero__sentence').getBoundingClientRect(),m=document.querySelector('main'),r=m.getBoundingClientRect(),p=document.querySelector('.wf-home-posts').getBoundingClientRect();return{heroCenter:(h.top+h.bottom)/2,viewport:innerHeight,postsBelow:p.top>=r.bottom-1,overflow:document.documentElement.scrollWidth>innerWidth||m.scrollWidth>m.clientWidth,fonts:performance.getEntriesByType('resource').filter(e=>e.name.includes('.ttf')).map(e=>e.name)};})()`);
      check(`home-${width}-${theme}`,Math.abs(frame.heroCenter-450)<60&&frame.postsBelow&&!frame.overflow&&frame.fonts.length===0,frame);
      const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,`home-${width}-${theme}.png`),Buffer.from(shot.data,'base64'));
      const scroll=await ev(`(()=>{const m=document.querySelector('main');m.scrollTop=500;const p=document.querySelector('.wf-home-posts').getBoundingClientRect(),r=m.getBoundingClientRect();return{top:m.scrollTop,visible:p.top<r.bottom&&p.bottom>r.top,links:document.querySelectorAll('.wf-home-posts a').length};})()`);
      check(`home-scroll-${width}-${theme}`,scroll.top>0&&scroll.visible&&scroll.links>=4,scroll);
    }
  }
  const seen=[];
  for(const route of ['signature-check/','posts/first-letter/','og-long-check/','zh/og-long-check/','og-edge-check/','og-check/']) {
    await navigateAndWait(cdp,new URL(route,base).href);
    const meta=await ev(`({title:document.querySelector('meta[property="og:title"]').content,image:document.querySelector('meta[property="og:image"]').content,width:document.querySelector('meta[property="og:image:width"]').content,height:document.querySelector('meta[property="og:image:height"]').content})`);
    const local=new URL(new URL(meta.image).pathname,base).href;
    const image=await fetch(local);check(`og-resource-${route}`,image.ok&&meta.width==='1200'&&meta.height==='630',meta);
    const buffer=Buffer.from(await image.arrayBuffer());fs.writeFileSync(path.join(out,'og-'+route.replaceAll('/','-')+'.png'),buffer);
    if(route==='og-check/') {
      check('local-cover-priority',meta.image.includes('/og-check/cover.'),meta.image);continue;
    }
    seen.push(meta.image);
    const bounds=await ev(`(async()=>{const im=new Image();im.src=${JSON.stringify(local)};await im.decode();const cvs=new OffscreenCanvas(1200,630),ctx=cvs.getContext('2d');ctx.drawImage(im,0,0);const p=ctx.getImageData(0,0,1200,630).data;let minX=1200,maxX=0,minY=630,maxY=0,count=0;for(let y=190;y<630;y++){for(let x=0;x<1200;x++){const i=(y*1200+x)*4;if(p[i]<140&&p[i+1]<140&&p[i+2]<140){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;}}}return{minX,maxX,minY,maxY,count};})()`);
    check(`og-title-safe-${route}`,bounds.count>300&&bounds.minX>=80&&bounds.maxX<=1120&&bounds.maxY<=600&&bounds.minY>=190,bounds);
    if(route==='og-edge-check/'){check('full-long-title-in-meta',meta.title.length>300,meta.title.length);}
  }
  check('unique-per-page-images',new Set(seen).size===seen.length,seen.length);
  if(build) {
    const exposed=fs.readdirSync(path.resolve(build),{recursive:true}).filter(f=>f.endsWith('.ttf')||f.includes('fonts/og/'));
    check('build-fonts-unpublished',exposed.length===0,exposed);
  }
} catch(error) {check('execution',false,error.stack);}
finally {
  cdp.close();await shutdownBrowser(browser);
  const report={base,date:new Date().toISOString(),passed:results.filter(r=>r.ok).length,total:results.length,results};
  fs.writeFileSync(path.join(out,'fidelity-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`${report.passed}/${report.total} passed`);process.exitCode=results.every(r=>r.ok)?0:1;
}
