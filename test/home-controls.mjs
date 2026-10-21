#!/usr/bin/env node
// 单屏首页、835px布局与原生双语入口；不依赖JavaScript切换语言。
import fs from 'node:fs';
import path from 'node:path';
import { CdpSession, attachPageState, evaluateInPage, findBrowser, launchBrowser, navigateAndWait, shutdownBrowser } from './probe.mjs';

const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--url', 'http://127.0.0.1:1313/');
const out = path.resolve(arg('--out', '/tmp/wf-home-controls'));
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: Boolean(ok), detail });
  if (!ok) {
    console.error('FAIL', name, JSON.stringify(detail));
  }
};
const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1440, height: 900 });
const cdp = new CdpSession(browser.pageWs);
const ev = (source) => evaluateInPage(cdp, source);
const state = attachPageState(cdp);
const go = (route) => navigateAndWait(cdp, new URL(route, base).href, { state });
try {
  await cdp.connect();
  for (const domain of ['Page', 'Runtime', 'Network']) {
    await cdp.send(`${domain}.enable`);
  }
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [1440, 835, 390]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 978, deviceScaleFactor: 1, mobile: false });
    for (const language of ['', 'zh/']) {
      await go(language);
      const home = await ev(`(() => {
        const main = document.querySelector('main'); main.scrollTop = 10000;
        const logo = document.querySelector('.wf-logo').getBoundingClientRect();
        const controls = document.querySelector('.wf-footer__controls').getBoundingClientRect();
        return { children: main.children.length, links: main.querySelectorAll('a').length, scroll: main.scrollTop, extraHeight: main.scrollHeight - main.clientHeight, markHidden: getComputedStyle(document.querySelector('.wf-footer__mark')).display === 'none', languageCount: document.querySelectorAll('.wf-lang a').length, logoLeft: logo.left, controlsRight: controls.right, width: innerWidth, target: document.querySelector('.wf-lang a').pathname };
      })()`);
      check(`home-${width}-${language || 'en'}`, home.children === 1 && home.links === 0 && home.scroll === 0 && home.extraHeight <= 1 && home.markHidden && home.languageCount === 1 && home.logoLeft < home.width * 0.25 && home.controlsRight > home.width * 0.75 && home.target === (language ? '/' : '/zh/'), home);
    }
    await go('zh/blog/boundary-data/');
    const reading = await ev(`(() => {
      const link = document.querySelector('.wf-lang a');
      const controls = document.querySelector('.wf-footer__controls').getBoundingClientRect();
      return { target: link.pathname, label: link.textContent.trim(), width: controls.width, languageCount: document.querySelectorAll('.wf-lang a').length };
    })()`);
    check(`reading-${width}`, reading.target === '/blog/boundary-data/' && reading.label === 'EN' && reading.languageCount === 1 && reading.width < 130, reading);
  }
  await go('blog/second-post/');
  check('missing-translation-home', await ev(`document.querySelector('.wf-lang a').pathname === '/zh/'`), 'EN-only fixture links to the Chinese home');
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  await go('zh/blog/boundary-data/');
  const destination = await ev(`document.querySelector('.wf-lang a').href`);
  await go(destination);
  check('no-js-native-switch', await ev(`document.documentElement.lang === 'en' && location.pathname === '/blog/boundary-data/'`), destination);
  check('console-errors', state.consoleErrors.length === 0, state.consoleErrors);
} catch (error) {
  check('execution', false, error.stack);
} finally {
  cdp.close();
  await shutdownBrowser(browser);
  const passed = results.filter(result => result.ok).length;
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ passed, total: results.length, results }, null, 2) + '\n');
  console.log(`${passed}/${results.length} passed`);
  process.exitCode = passed === results.length ? 0 : 1;
}
