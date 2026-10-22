#!/usr/bin/env node
// 全高阅读的首尾、真实模糊像素与输入验收；截图辅助仍使用零依赖 CDP。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CdpSession, attachPageState, evaluateInPage, findBrowser, launchBrowser, navigateAndWait, shutdownBrowser, sleep } from './probe.mjs';

const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--url', 'http://127.0.0.1:1313/');
const out = path.resolve(arg('--out', '/tmp/wf-immersive-reading'));
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: Boolean(ok), detail });
  if (!ok) {
    console.error('FAIL', name, JSON.stringify(detail));
  }
};
const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1440, height: 900, hideScrollbars: false });
const cdp = new CdpSession(browser.pageWs);
const ev = (source) => evaluateInPage(cdp, source);
const state = attachPageState(cdp);
const go = (route) => navigateAndWait(cdp, new URL(route, base).href, { state });
const shot = async (name, clip) => {
  const png = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, ...(clip ? { clip } : {}) });
  const file = path.join(out, name + '.png');
  fs.writeFileSync(file, Buffer.from(png.data, 'base64'));
  return file;
};

try {
  await cdp.connect();
  for (const domain of ['Page', 'Runtime', 'Network']) {
    await cdp.send(`${domain}.enable`);
  }
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [1440, 390]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const theme of ['day', 'night']) {
      await go('zh/');
      await ev(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)}); document.fonts.ready.then(() => true)`);
      const home = await ev(`(() => {
        const title = document.querySelector('.wf-hero__sentence');
        return { copy: title.textContent, tracking: parseFloat(getComputedStyle(title).letterSpacing), fontSize: parseFloat(getComputedStyle(title).fontSize), footerHidden: getComputedStyle(document.querySelector('.wf-footer__mark')).display === 'none', languages: document.querySelectorAll('.wf-lang a').length, logo: getComputedStyle(document.querySelector('.wf-logo')).color, ink: getComputedStyle(document.body).color, cursor: getComputedStyle(document.body).cursor };
      })()`);
      check(`home-${width}-${theme}`, !/[，；,;]/.test(home.copy) && home.tracking / home.fontSize > 0.07 && home.footerHidden && home.languages === 1 && home.logo === home.ink && home.cursor.includes(theme === 'day' ? 'cursor-dark.svg' : 'cursor-light.svg') && home.cursor.includes('23 3'), home);
      await shot(`home-${width}-${theme}`);

      await go('zh/essays/');
      await ev(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)});true`);
      const tags = await ev(`({ height: document.querySelector('.wf-tags a').getBoundingClientRect().height, intro: Boolean(document.querySelector('.wf-index__intro')) })`);
      check(`compact-tags-${width}-${theme}`, tags.height >= 24 && tags.height < 30 && !tags.intro, tags);
      await shot(`essays-${width}-${theme}`);

      await go('zh/blog/boundary-data/');
      await ev(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)}); document.fonts.ready.then(() => true)`);
      await sleep(100);
      const read = () => ev(`(() => {
        const main = document.querySelector('main'), box = main.getBoundingClientRect();
        const top = document.querySelector('.wf-reading-edge--top'), bottom = document.querySelector('.wf-reading-edge--bottom');
        const title = document.querySelector('main h1').getBoundingClientRect();
        const last = document.querySelector('.wf-prose').lastElementChild.getBoundingClientRect();
        return { full: Math.abs(box.top) < 1 && Math.abs(box.bottom - innerHeight) < 1, overflow: main.scrollWidth > main.clientWidth, position: main.scrollTop, scrollHeight: main.scrollHeight, clientHeight: main.clientHeight, top: Number(top.style.getPropertyValue('--wf-edge-strength')), bottom: Number(bottom.style.getPropertyValue('--wf-edge-strength')), edgeHeight: top.getBoundingClientRect().height, titleTop: title.top, lastTop: last.top, lastBottom: last.bottom, viewport: innerHeight, layerFilters: [...top.children].map(layer => getComputedStyle(layer).backdropFilter), pointer: getComputedStyle(document.querySelector('.wf-reading-edges')).pointerEvents };
      })()`);
      const first = await read();
      check(`first-${width}-${theme}`, first.full && !first.overflow && first.top === 0 && first.titleTop > first.edgeHeight && first.pointer === 'none', first);
      await shot(`reading-first-${width}-${theme}`);

      // 滚动区中点是 (scrollHeight - clientHeight) / 2；直接除以 scrollHeight 会在短页面上被 clamp 到末端，底部边缘被判为到底。
      await ev(`(() => { const main = document.querySelector('main'); main.scrollTop = (main.scrollHeight - main.clientHeight) / 2; return true; })()`);
      await sleep(150);
      const middle = await read();
      check(`middle-${width}-${theme}`, middle.top === 1 && middle.bottom === 1 && new Set(middle.layerFilters).size === 4, middle);
      await shot(`reading-middle-${width}-${theme}`);
      if (width === 1440 && theme === 'day') {
        const clip = await ev(`(() => { const r = document.querySelector('.wf-column').getBoundingClientRect(); return { x: Math.ceil(r.x), y: 0, width: Math.floor(r.width), height: 90, scale: 1 }; })()`);
        const blurred = await shot('edge-with-blur', clip);
        await ev(`document.querySelector('.wf-reading-edges').style.visibility = 'hidden';true`);
        const plain = await shot('edge-without-blur', clip);
        await ev(`document.querySelector('.wf-reading-edges').style.visibility = '';true`);
        const diff = JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL('./scene-diff.mjs', import.meta.url)), '--a', plain, '--b', blurred, '--json'], { encoding: 'utf8' }));
        check('rendered-blur-pixels', diff.max > 1, diff);
      }

      await ev(`document.querySelector('main').scrollTop = document.querySelector('main').scrollHeight;true`);
      await sleep(150);
      const end = await read();
      check(`last-${width}-${theme}`, end.bottom === 0 && end.lastTop >= end.edgeHeight && end.lastBottom <= end.viewport - end.edgeHeight, end);
      await shot(`reading-last-${width}-${theme}`);
      const focus = await ev(`(() => {
        const target = document.querySelector('.wf-entry .wf-tags a'); target.focus();
        const rect = target.getBoundingClientRect(), edge = document.querySelector('.wf-reading-edge--top').getBoundingClientRect().height;
        return { focused: document.activeElement === target, top: rect.top, bottom: rect.bottom, edge, height: innerHeight };
      })()`);
      check(`focus-clear-${width}-${theme}`, focus.focused && focus.top >= focus.edge && focus.bottom <= focus.height - focus.edge, focus);
    }
  }
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await go('zh/essays/');
  const touch = await ev(`({ coarse: matchMedia('(pointer: coarse)').matches, sizes: [...document.querySelectorAll('.wf-tags a')].map(a => ({ width: a.getBoundingClientRect().width, height: a.getBoundingClientRect().height })) })`);
  check('coarse-targets', touch.coarse && touch.sizes.every(size => size.width >= 44 && size.height >= 44), touch);
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  await go('zh/blog/boundary-data/');
  const fallback = await ev(`({ edgeDisplay: getComputedStyle(document.querySelector('.wf-reading-edges')).display, mainPosition: getComputedStyle(document.querySelector('main')).position, footerPosition: getComputedStyle(document.querySelector('footer')).position, text: document.querySelector('.wf-prose').textContent.length })`);
  check('no-js-readable', fallback.edgeDisplay === 'none' && fallback.mainPosition === 'relative' && fallback.footerPosition === 'relative' && fallback.text > 100, fallback);
  check('console-errors', state.consoleErrors.length === 0, state.consoleErrors);
} catch (error) {
  check('execution', false, error.stack);
} finally {
  cdp.close();
  await shutdownBrowser(browser);
  const passed = results.filter(result => result.ok).length;
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ passed, total: results.length, results }, null, 2) + '\n');
  console.log(`${passed}/${results.length} passed; evidence: ${out}`);
  process.exitCode = passed === results.length ? 0 : 1;
}
