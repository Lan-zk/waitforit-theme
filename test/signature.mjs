#!/usr/bin/env node
// P3 真实浏览器验收：零依赖，复用 CDP 生命周期；--url 为开启增强的 exampleSite。
import fs from 'node:fs';
import path from 'node:path';
import { CdpSession, attachPageState, evaluateInPage, findBrowser, launchBrowser, navigateAndWait, reloadAndWait, shutdownBrowser, sleep } from './probe.mjs';
const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--url', 'http://127.0.0.1:8798/');
const disabled = arg('--disabled-url', null);
const out = path.resolve(arg('--out', '/tmp/wf-signature'));
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: Boolean(ok), detail }); if (!ok) { console.error('FAIL', name, detail); } };
const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1440, height: 900 });
const cdp = new CdpSession(browser.pageWs);
const ev = (js) => evaluateInPage(cdp, js);
const url = (p) => new URL(p, base).href;
try {
  await cdp.connect();
  for (const domain of ['Page', 'Runtime', 'Network']) { await cdp.send(`${domain}.enable`); }
  const state = attachPageState(cdp);
  const go = (p) => navigateAndWait(cdp, url(p), { state });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.wfDraws=0;
    // 每逻辑帧 day 画布只对默认帧缓冲 clear 一次；以此计帧，不统计离屏 FBO 与 night。
    const clear=WebGL2RenderingContext.prototype.clear;
    WebGL2RenderingContext.prototype.clear=function(...args){if(this.canvas&&this.canvas.matches&&this.canvas.matches('[data-wf-canvas="day"]')&&this.getParameter(this.FRAMEBUFFER_BINDING)===null){window.wfDraws++;}return clear.apply(this,args);};
    window.wfTransition=null;
    addEventListener('pagereveal',event=>{
      window.wfTransition={active:!!event.viewTransition, ready:false, revealedAt:performance.now()};
      if(event.viewTransition){event.viewTransition.ready.then(()=>{
        window.wfTransition.ready=true;
        window.wfTransition.readyAt=performance.now();
        window.wfTransition.animations=document.getAnimations().map(a=>({name:a.animationName,pseudo:a.effect?.pseudoElement,duration:a.effect?.getTiming().duration}));
      }).catch(error=>{window.wfTransition.error={name:error.name,message:error.message};});}
    });
  ` });
  await cdp.send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await go('signature-check/');
  // 场景是否在动：用截图代替 WebGL canvas.toDataURL（不启用 preserveDrawingBuffer）。
  const sceneState = async () => ev(`({draws:wfDraws,hidden:document.hidden,reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,cycle:getComputedStyle(document.documentElement).getPropertyValue('--wf-motion-wind-cycle'),size:[document.querySelector('canvas').width,document.querySelector('canvas').height],context:!!document.querySelector('canvas').getContext('webgl2')})`);
  const sceneShot = async () => (await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })).data;
  const imageBefore = await sceneShot();
  const initial = await sceneState();
  // 在页面内计时，避免 CDP 往返/截图延迟混入帧间隔。
  const budget = await ev(`new Promise((resolve) => {
    const draws0 = wfDraws;
    const start = performance.now();
    setTimeout(() => resolve({ draws: wfDraws - draws0, elapsedMs: performance.now() - start }), 1100);
  })`);
  const imageAfter = await sceneShot();
  check('scene-time-and-budget', imageBefore !== imageAfter && budget.draws > 0 && budget.draws <= 28, { drawsIn1100ms: budget.draws, observedMs: budget.elapsedMs, changed: imageBefore !== imageAfter, initial: {hidden:initial.hidden,reduce:initial.reduce,cycle:initial.cycle,size:initial.size,context:initial.context} });
  await ev(`Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));true`);
  const paused = await ev('wfDraws'); await sleep(250);
  check('hidden-pause', await ev('wfDraws') === paused, { draws: paused, mechanism: 'visibilitychange with deterministic hidden state' });
  await ev(`delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));true`); await sleep(250);
  check('visible-resume', await ev('wfDraws') > paused, await ev('wfDraws'));
  await ev(`dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));true`);
  const away = await ev('wfDraws'); await sleep(220);
  check('pagehide-pause', await ev('wfDraws') === away, away);
  await ev(`dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));true`); await sleep(220);
  check('pageshow-resume', await ev('wfDraws') > away, await ev('wfDraws'));
  await ev(`window.wfReduced=new Promise(resolve=>matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>requestAnimationFrame(()=>resolve(true)),{once:true}));true`);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await ev('wfReduced');
  await ev(`new Promise((resolve,reject)=>{let last=wfDraws,quiet=0;const start=performance.now();const timer=setInterval(()=>{quiet=wfDraws===last?quiet+50:0;last=wfDraws;if(quiet>=300){clearInterval(timer);resolve(true);}else if(performance.now()-start>3000){clearInterval(timer);reject(new Error('scene did not settle after reduce'));}},50);})`);
  const reduce = await ev(`({draws:wfDraws,name:getComputedStyle(document.querySelector('main')).viewTransitionName})`); await sleep(250);
  check('live-reduce-freeze', await ev('wfDraws') === reduce.draws && reduce.name === 'none', reduce.name);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{name:'prefers-reduced-motion',value:'no-preference'}] });
  await sleep(250);
  check('live-reduce-resume', await ev('wfDraws') > reduce.draws, await ev('wfDraws'));
  const saveData = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(navigator,'connection',{value:{saveData:true,addEventListener(){}}});` });
  await reloadAndWait(cdp, { state }); const save = await ev('wfDraws'); await sleep(250);
  check('save-data-freeze', await ev('wfDraws') === save, { initialDraws: save });
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: saveData.identifier });
  await reloadAndWait(cdp, { state });
  // Windows 工作区可能以 CRLF 检出内容；页面源码经 Hugo 统一为 LF，比较前归一化换行。
  const original = fs.readFileSync(new URL('../exampleSite/content/signature-check.md', import.meta.url), 'utf8').match(/```js[^\n]*\n([\s\S]*?)```/)[1].replace(/\r\n/g, '\n');
  const source = await ev(`document.querySelector('[data-wf-source]').value`);
  check('copy-source-whitespace', source === original, { length: source.length, expected: original.length, finalNewline: source.endsWith('\n') });
  await cdp.send('Browser.grantPermissions', { origin: new URL(base).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  const copyTarget = await ev(`(()=>{const b=document.querySelector('[data-wf-copy]');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', button:'left', clickCount:1, ...copyTarget });
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseReleased', button:'left', clickCount:1, ...copyTarget });
  await sleep(100);
  const clipboard = await ev('navigator.clipboard.readText()');
  // Windows 剪贴板以 CRLF 往返；页面源码为 LF，比较前只归一化换行。
  check('real-clipboard-pointer-copy', clipboard.replace(/\r\n/g, '\n') === original, { length: clipboard.length, exact: clipboard.replace(/\r\n/g, '\n') === original });
  await ev(`window.wfCopied=null;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.wfCopied=text;}}});document.querySelector('[data-wf-copy]').focus();true`);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(100);
  check('keyboard-copy-success', await ev('wfCopied') === original && await ev(`document.querySelector('[role=status]').textContent`) === 'Copied.', { copiedLength: await ev('wfCopied?.length') });
  await ev(`navigator.clipboard.writeText=async()=>{throw new DOMException('Denied','NotAllowedError');};document.querySelector('[data-wf-copy]').click();true`); await sleep(100);
  check('copy-denial-selection', await ev(`document.querySelector('[role=status]').textContent.includes('Code selected') && getSelection().toString().includes('const note')`), await ev(`document.querySelector('[role=status]').textContent`));
  const blocks = await ev(`Array.from(document.querySelectorAll('[data-wf-code]')).map(b=>({source:b.querySelector('textarea').value,text:b.querySelector('code').textContent,button:!!b.querySelector('button'),styles:!!b.querySelector('[style]')}))`);
  check('unknown-empty-and-no-inline-colors', blocks.length === 4 && blocks[2].source.trimEnd() === blocks[2].text.trimEnd() && !blocks[3].button && blocks.every(b => !b.styles), blocks.map(b => ({ length: b.source.length, button: b.button, styles: b.styles })));
  for (const width of [1440, 390]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const theme of ['day', 'night']) {
      for (const route of ['', 'signature-check/', 'zh/signature-check/']) {
        await go(route);
        await ev(`localStorage.setItem('wf-theme',${JSON.stringify(theme)});true`); await reloadAndWait(cdp, { state });
        await ev('document.fonts.ready.then(()=>true)');
        const layout = await ev(`(()=>{const main=document.querySelector('main'),logo=document.querySelector('.wf-logo__mark'),pre=document.querySelectorAll('.wf-code__pre');return {overflow:document.documentElement.scrollWidth>innerWidth||main.scrollWidth>main.clientWidth,longScroll:Array.from(pre).some(p=>p.scrollWidth>p.clientWidth),logoRatio:logo.getBoundingClientRect().width/logo.getBoundingClientRect().height,buttons:Array.from(document.querySelectorAll('[data-wf-copy]')).every(b=>b.getBoundingClientRect().height>=44),paper:getComputedStyle(document.documentElement).getPropertyValue('--wf-paper')};})()`);
        check(`layout-${width}-${theme}-${route || 'home'}`, !layout.overflow && Math.abs(layout.logoRatio - 558 / 375) < .01 && layout.buttons && (route === '' || layout.longScroll), layout);
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.writeFileSync(path.join(out, `${route.startsWith('zh') ? 'code-zh' : route ? 'code' : 'home'}-${width}-${theme}.png`), Buffer.from(shot.data, 'base64'));
      }
    }
  }
  // Wait for the destination's transition result, not a fixed delay in the old document.
  const destination = await ev(`document.querySelector('.wf-logo').href`);
  await ev(`document.querySelector('.wf-logo').click();true`);
  let nav;
  const transitionDeadline = Date.now() + 10000;
  while (Date.now() < transitionDeadline) {
    try {
      nav = await ev(`({url:location.href,...wfTransition,name:getComputedStyle(document.querySelector('main')).viewTransitionName})`);
      if (nav.url === destination && (nav.ready || nav.error)) {
        break;
      }
    } catch {
      // Navigation can replace the execution context between two CDP requests.
    }
    await sleep(50);
  }
  check('cross-document-transition', nav?.url === destination && nav.active && nav.ready && nav.name === 'wf-reading' && nav.animations?.some(a => a.name === 'wf-page-in' && a.duration === 520) && nav.animations?.some(a => a.name === 'wf-page-out' && a.duration === 220), nav);
  await go('signature-check/');
  await ev(`document.querySelector('main').scrollTop=200;true`); await sleep(100);
  await go('essays/');
  const hist = await cdp.send('Page.getNavigationHistory');
  await cdp.send('Page.navigateToHistoryEntry', { entryId: hist.entries[hist.currentIndex - 1].id });
  await sleep(900);
  check('history-scroll-restoration', await ev(`location.pathname.endsWith('/signature-check/') && document.querySelector('main').scrollTop===200`), await ev(`({path:location.pathname,scroll:document.querySelector('main').scrollTop})`));
  await ev(`document.querySelector('a[href$="#a-small-program"]').click();true`); await sleep(100);
  check('fragment-navigation', await ev(`location.hash==='#a-small-program' && document.querySelector('main').scrollTop<100`), await ev(`({hash:location.hash,scroll:document.querySelector('main').scrollTop})`));
  for (const route of ['', 'blog/first-post/', 'signature-check/', 'zh/signature-check/', 'og-check/', '404.html']) {
    await go(route);
    const meta = await ev(`(()=>{const p=k=>document.querySelector('meta[property="'+k+'"]')?.content,n=k=>document.querySelector('meta[name="'+k+'"]')?.content;return {title:p('og:title'),description:p('og:description'),url:p('og:url'),image:p('og:image'),width:p('og:image:width'),height:p('og:image:height'),alt:p('og:image:alt'),locale:p('og:locale'),type:p('og:type'),date:p('article:published_time'),twitter:n('twitter:card'),sameImage:n('twitter:image')===p('og:image')};})()`);
    // OG uses configured production baseURL, so request its pathname from the local build.
    const image = await fetch(new URL(new URL(meta.image).pathname, base));
    check(`social-${route || 'home'}`, meta.title && meta.description && /^https?:/.test(meta.url) && meta.width === '1200' && meta.height === '630' && meta.alt && image.ok && meta.twitter === 'summary_large_image' && meta.sameImage && (!route.startsWith('blog') || (meta.type === 'article' && meta.date)) && (route !== 'og-check/' || (meta.image.includes('/og-check/cover.') && meta.alt.includes('Fictional tide-desk'))), meta);
  }
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  await go('signature-check/');
  check('no-js-code', await ev(`document.querySelector('code').textContent.includes('const note') && Array.from(document.querySelectorAll('[data-wf-copy]')).every(b=>getComputedStyle(b).display==='none')`), 'Readable code; copy controls hidden');
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: false });
  const noCanvas = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const context=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...args){return this.matches('[data-wf-canvas]')?null:context.apply(this,args);};
    window.wfRafs=0;const raf=requestAnimationFrame;
    window.requestAnimationFrame=function(callback){wfRafs++;return raf.call(window,callback);};
  ` });
  await go('signature-check/');await sleep(250);
  const unsupported=await ev(`({rafs:wfRafs,readable:document.querySelector('main').textContent.includes('const note')})`);
  await sleep(250);
  check('canvas-unavailable-readable-and-idle', unsupported.readable && await ev('wfRafs')===unsupported.rafs, unsupported);
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', {identifier:noCanvas.identifier});
  if (disabled) {
    await navigateAndWait(cdp, new URL('signature-check/', disabled).href, { state });
    check('features-off', await ev(`!document.querySelector('canvas') && !Array.from(document.scripts).some(s=>s.src.includes('scene.')) && !Array.from(document.styleSheets).some(s=>s.href?.includes('transitions.')) && getComputedStyle(document.querySelector('main')).viewTransitionName==='none'`), 'No scene markup/script or transition stylesheet');
  }
  check('runtime-errors', state.consoleErrors.length === 0, state.consoleErrors);
} catch (error) {
  check('execution', false, error.stack);
} finally {
  cdp.close();
  await shutdownBrowser(browser);
  const report = { base, date: new Date().toISOString(), passed: results.filter(r => r.ok).length, total: results.length, results };
  fs.writeFileSync(path.join(out, 'signature-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.passed}/${report.total} passed`);
  process.exitCode = results.every(r => r.ok) ? 0 : 1;
}
