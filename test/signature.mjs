#!/usr/bin/env node
// P3 真实浏览器验收：零依赖，复用 CDP 生命周期；--url 为开启增强的 exampleSite。
import fs from 'node:fs';
import path from 'node:path';
import { CdpSession, attachPageState, evaluateInPage, findBrowser, launchBrowser, navigateAndWait, reloadAndWait, shutdownBrowser, sleep } from './probe.mjs';
const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--url', 'http://127.0.0.1:8798/');
const disabled = arg('--disabled-url', null);
const out = path.resolve(arg('--out', 'docs/design/evidence/p3-signature'));
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
    const clear=CanvasRenderingContext2D.prototype.putImageData;
    CanvasRenderingContext2D.prototype.putImageData=function(...args){window.wfDraws++;return clear.apply(this,args);};
    window.wfTransition=null;
    addEventListener('pagereveal',event=>{
      window.wfTransition={active:!!event.viewTransition};
      if(event.viewTransition){event.viewTransition.ready.then(()=>{
        window.wfTransition.animations=document.getAnimations().map(a=>({name:a.animationName,pseudo:a.effect?.pseudoElement,duration:a.effect?.getTiming().duration}));
      }).catch(()=>{});}
    });
  ` });
  await go('signature-check/');
  const before = await ev(`({draws:wfDraws,image:document.querySelector('canvas').toDataURL()})`);
  await sleep(1100);
  const after = await ev(`({draws:wfDraws,image:document.querySelector('canvas').toDataURL()})`);
  check('sea-time-and-budget', before.image !== after.image && after.draws > before.draws && after.draws - before.draws <= 54, { drawsIn1100ms: after.draws - before.draws, changed: before.image !== after.image });
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
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(100); const reduce = await ev(`({draws:wfDraws,image:document.querySelector('canvas').toDataURL(),name:getComputedStyle(document.querySelector('main')).viewTransitionName})`); await sleep(250);
  check('live-reduce-freeze', await ev('wfDraws') === reduce.draws && reduce.name === 'none', reduce.name);
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  const saveData = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(navigator,'connection',{value:{saveData:true,addEventListener(){}}});` });
  await reloadAndWait(cdp, { state }); const save = await ev('wfDraws'); await sleep(250);
  check('save-data-freeze', await ev('wfDraws') === save, { initialDraws: save });
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: saveData.identifier });
  await reloadAndWait(cdp, { state });
  const original = fs.readFileSync(new URL('../exampleSite/content/signature-check.md', import.meta.url), 'utf8').match(/```js[^\n]*\n([\s\S]*?)```/)[1];
  const source = await ev(`document.querySelector('[data-wf-source]').value`);
  check('copy-source-whitespace', source === original, { length: source.length, expected: original.length, finalNewline: source.endsWith('\n') });
  await cdp.send('Browser.grantPermissions', { origin: new URL(base).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  const copyTarget = await ev(`(()=>{const b=document.querySelector('[data-wf-copy]');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', button:'left', clickCount:1, ...copyTarget });
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseReleased', button:'left', clickCount:1, ...copyTarget });
  await sleep(100);
  const clipboard = await ev('navigator.clipboard.readText()');
  check('real-clipboard-pointer-copy', clipboard === original, { length: clipboard.length, exact: clipboard === original });
  await ev(`window.wfCopied=null;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.wfCopied=text;}}});document.querySelector('[data-wf-copy]').focus();true`);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(100);
  check('keyboard-copy-success', await ev('wfCopied') === original && await ev(`document.querySelector('[role=status]').textContent`) === 'Copied.', { copiedLength: await ev('wfCopied?.length') });
  await ev(`navigator.clipboard.writeText=async()=>{throw new DOMException('Denied','NotAllowedError');};document.querySelector('[data-wf-copy]').click();true`); await sleep(100);
  check('copy-denial-selection', await ev(`document.querySelector('[role=status]').textContent.includes('Code selected') && getSelection().toString().includes('const letter')`), await ev(`document.querySelector('[role=status]').textContent`));
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
  await ev(`document.querySelector('.wf-logo').click();true`);
  await sleep(1000);
  const nav = await ev(`({active:wfTransition?.active,animations:wfTransition?.animations,name:getComputedStyle(document.querySelector('main')).viewTransitionName})`);
  check('cross-document-transition', nav.active && nav.name === 'wf-reading' && nav.animations.some(a => a.name === 'wf-page-in' && a.duration === 520) && nav.animations.some(a => a.name === 'wf-page-out' && a.duration === 220), nav);
  await go('signature-check/');
  await ev(`document.querySelector('main').scrollTop=200;true`); await sleep(100);
  await go('purpose/');
  const hist = await cdp.send('Page.getNavigationHistory');
  await cdp.send('Page.navigateToHistoryEntry', { entryId: hist.entries[hist.currentIndex - 1].id });
  await sleep(900);
  check('history-scroll-restoration', await ev(`location.pathname.endsWith('/signature-check/') && document.querySelector('main').scrollTop===200`), await ev(`({path:location.pathname,scroll:document.querySelector('main').scrollTop})`));
  await ev(`document.querySelector('a[href$="#a-small-program"]').click();true`); await sleep(100);
  check('fragment-navigation', await ev(`location.hash==='#a-small-program' && document.querySelector('main').scrollTop<100`), await ev(`({hash:location.hash,scroll:document.querySelector('main').scrollTop})`));
  for (const route of ['', 'posts/first-letter/', 'signature-check/', 'zh/signature-check/', 'og-check/', '404.html']) {
    await go(route);
    const meta = await ev(`(()=>{const p=k=>document.querySelector('meta[property="'+k+'"]')?.content,n=k=>document.querySelector('meta[name="'+k+'"]')?.content;return {title:p('og:title'),description:p('og:description'),url:p('og:url'),image:p('og:image'),width:p('og:image:width'),height:p('og:image:height'),alt:p('og:image:alt'),locale:p('og:locale'),type:p('og:type'),date:p('article:published_time'),twitter:n('twitter:card'),sameImage:n('twitter:image')===p('og:image')};})()`);
    // OG uses configured production baseURL, so request its pathname from the local build.
    const image = await fetch(new URL(new URL(meta.image).pathname, base));
    check(`social-${route || 'home'}`, meta.title && meta.description && /^https?:/.test(meta.url) && meta.width === '1200' && meta.height === '630' && meta.alt && image.ok && meta.twitter === 'summary_large_image' && meta.sameImage && (!route.startsWith('posts') || (meta.type === 'article' && meta.date)) && (route !== 'og-check/' || (meta.image.includes('/og-check/cover.') && meta.alt.includes('Fictional tide-desk'))), meta);
  }
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  await go('signature-check/');
  check('no-js-code', await ev(`document.querySelector('code').textContent.includes('const letter') && Array.from(document.querySelectorAll('[data-wf-copy]')).every(b=>getComputedStyle(b).display==='none')`), 'Readable code; copy controls hidden');
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: false });
  if (disabled) {
    await navigateAndWait(cdp, new URL('signature-check/', disabled).href, { state });
    check('features-off', await ev(`!document.querySelector('canvas') && !Array.from(document.scripts).some(s=>s.src.includes('scene.')) && !Array.from(document.styleSheets).some(s=>s.href?.includes('transitions.')) && getComputedStyle(document.querySelector('main')).viewTransitionName==='none'`), 'No sea markup/script or transition stylesheet');
  }
  check('runtime-errors', state.consoleErrors.length === 0, state.exceptions);
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
