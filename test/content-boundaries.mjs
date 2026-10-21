#!/usr/bin/env node
// 六类虚构内容的真实浏览器验收；复用零依赖 CDP，并保存两档视口证据。
import fs from 'node:fs';
import path from 'node:path';
import { CdpSession, attachPageState, evaluateInPage, findBrowser, launchBrowser, navigateAndWait, shutdownBrowser } from './probe.mjs';

const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--url', 'http://127.0.0.1:1313/');
const out = path.resolve(arg('--out', '/tmp/wf-content-boundaries'));
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
const go = (route) => navigateAndWait(cdp, new URL(route, base).href, { state, settleMs: 150 });
const routes = ['', 'zh/', 'blog/', 'zh/blog/', 'essays/', 'projects/', 'fiction/', 'photography/', 'about/', 'blog/boundary-data/', 'zh/blog/boundary-data/', 'blog/minimal/', 'projects/minimal/', 'projects/local-study/', 'fiction/last-train/', 'photography/ratio-check/', 'tags/', 'zh/tags/', 'empty-check/'];
const captures = new Set(['', 'zh/', 'zh/blog/', 'projects/', 'photography/ratio-check/', 'zh/tags/']);

try {
  await cdp.connect();
  for (const domain of ['Page', 'Runtime', 'Network']) {
    await cdp.send(`${domain}.enable`);
  }
  // Freeze the scene while inspecting content; the existing probe verifies motion separately.
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('wf-theme', 'day');` });
  for (const width of [1440, 390]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const theme of ['day', 'night']) {
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: theme === 'night' ? 'dark' : 'light' }] });
      for (const route of routes) {
        await go(route);
        await ev(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)}); document.fonts.ready.then(() => true)`);
        const layout = await ev(`(() => {
          const main = document.querySelector('main');
          const frame = main.getBoundingClientRect();
          const tags = [...document.querySelectorAll('.wf-tags a, .wf-tag-index a')];
          return {
            overflow: document.documentElement.scrollWidth > innerWidth || main.scrollWidth > main.clientWidth,
            title: document.querySelector('main h1')?.textContent.trim(),
            emptyTagContainers: [...document.querySelectorAll('.wf-tags')].filter(list => !list.children.length).length,
            tagTargets: tags.every(a => {
              const minimum = a.closest('.wf-tags') && !matchMedia('(pointer: coarse)').matches ? 24 : 44;
              return a.getBoundingClientRect().height >= minimum && a.getBoundingClientRect().width >= minimum && a.getBoundingClientRect().width <= frame.width;
            }),
            nestedLinks: document.querySelectorAll('a a').length,
            images: [...document.querySelectorAll('.wf-prose img')].map(image => ({ loaded: image.complete && image.naturalWidth > 0, natural: [image.naturalWidth, image.naturalHeight], rendered: [image.width, image.height] })),
            tables: [...document.querySelectorAll('.wf-prose table')].map(table => ({ width: table.clientWidth, scroll: table.scrollWidth, max: frame.width })),
          };
        })()`);
        check(`layout-${width}-${theme}-${route || 'home'}`, !layout.overflow && layout.title && layout.emptyTagContainers === 0 && layout.tagTargets && layout.nestedLinks === 0 && layout.images.every(image => image.loaded && Math.abs(image.rendered[0] / image.rendered[1] - image.natural[0] / image.natural[1]) < 0.01), layout);
        if (route === '' || route === 'zh/') {
          const copy = await ev(`({ verse: document.querySelector('.wf-hero__sentence').textContent.trim(), source: document.querySelector('.wf-hero__source')?.textContent.trim() })`);
          check(`verse-${width}-${theme}-${route || 'en'}`, copy.verse === (route ? '他使我躺卧在青草地上\n领我在可安歇的水边' : 'He makes me lie down in green pastures\nhe leads me beside quiet waters') && copy.source === (route ? '诗篇 23:2' : 'Psalms 23:2'), copy);
        }
        if (route.endsWith('minimal/')) {
          const absence = await ev(`({ tags: document.querySelectorAll('.wf-entry > .wf-tags').length, date: document.querySelector('.wf-entry > .wf-entry-meta')?.textContent || '' })`);
          check(`absent-fields-${width}-${theme}-${route}`, absence.tags === 0 && absence.date === '', absence);
        }
        if (route === 'photography/ratio-check/') {
          const tiny = layout.images.find(image => image.natural[0] === 96);
          check(`small-image-${width}-${theme}`, tiny?.rendered[0] === 96 && tiny?.rendered[1] === 64, tiny);
        }
        if (route === 'empty-check/') {
          check(`empty-${width}-${theme}`, await ev(`Boolean(document.querySelector('.wf-empty')?.textContent.trim())`), route);
        }
        if (captures.has(route) && (theme === 'day' || route === 'zh/')) {
          const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
          fs.writeFileSync(path.join(out, `${route.replaceAll('/', '-') || 'home'}-${width}-${theme}.png`), Buffer.from(shot.data, 'base64'));
        }
      }
    }
  }

  // Follow the generated URLs (including C# and C++) instead of guessing slugs.
  for (const locale of ['', 'zh/']) {
    await go(`${locale}blog/boundary-data/`);
    const tags = await ev(`[...document.querySelectorAll('.wf-entry .wf-tags a')].map(a => ({ text: a.textContent, href: a.href }))`);
    const statuses = await Promise.all(tags.map(async tag => ({ ...tag, status: (await fetch(tag.href)).status })));
    check(`tag-links-${locale || 'en'}`, statuses.every(tag => tag.status === 200 && new URL(tag.href).pathname.startsWith(`/${locale}tags/`)), statuses);
    const grace = tags.find(tag => tag.text === (locale ? '#恩典' : '#Grace'));
    const types = new Set();
    const visited = new Set();
    let next = grace.href;
    while (next && !visited.has(next)) {
      visited.add(next);
      await go(next);
      const page = await ev(`({ types: [...document.querySelectorAll('.wf-term-entry > .wf-entry-meta')].map(p => p.textContent.trim()), next: document.querySelector('a[rel="next"]')?.href, links: [...document.querySelectorAll('.wf-term-entry .wf-post-row')].map(a => a.href) })`);
      page.types.forEach(type => types.add(type));
      check(`archive-local-${locale || 'en'}-${visited.size}`, page.links.every(href => new URL(href).origin === new URL(base).origin), page.links);
      next = page.next;
    }
    const expected = locale ? ['博客', '随笔', '作品', '小说', '摄影'] : ['Blog', 'Essays', 'Projects', 'Fiction', 'Photography'];
    check(`cross-type-pagination-${locale || 'en'}`, visited.size > 1 && expected.every(type => types.has(type)), { pages: visited.size, types: [...types] });
  }
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  await go('zh/blog/boundary-data/');
  const nativeTag = await ev(`document.querySelector('.wf-entry .wf-tags a').href`);
  await go(nativeTag);
  check('no-js-tag-navigation', await ev(`Boolean(document.querySelector('main h1')?.textContent.includes('大数据') && document.querySelector('.wf-post-row'))`), nativeTag);
  check('console-errors', state.consoleErrors.length === 0, state.consoleErrors);
} finally {
  cdp.close();
  await shutdownBrowser(browser);
  const failed = results.filter(result => !result.ok).length;
  const report = { passed: results.length - failed, failed, results };
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.passed}/${results.length} passed; evidence: ${out}`);
  process.exitCode = failed ? 1 : 0;
}
