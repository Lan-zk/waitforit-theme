#!/usr/bin/env node
// Build consumer variants and run the existing browser gates against isolated local servers.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CdpSession, findBrowser, launchBrowser, shutdownBrowser, navigateAndWait, evaluateInPage } from './probe.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const out = path.resolve(arg('--out', fs.mkdtempSync(path.join(os.tmpdir(), 'wf-ci-'))));
const hugo = process.env.HUGO_BIN || 'hugo';
const fixtures = path.join(root, 'exampleSite/test-fixtures');
const servers = [];
const results = [];
fs.mkdirSync(out, { recursive: true });

async function run(name, command, args) {
  const log = fs.createWriteStream(path.join(out, `${name}.log`));
  const child = spawn(command, args, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  try {
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });
    results.push({ name, ok: code === 0, code });
    if (code !== 0) {
      throw new Error(`${name} failed (${code}); see ${path.join(out, `${name}.log`)}`);
    }
    console.log(`PASS ${name}`);
  } finally {
    await new Promise(resolve => log.end(resolve));
  }
}

async function serve(directory) {
  const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const server = http.createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = path.resolve(directory, '.' + pathname);
      if (!file.startsWith(directory + path.sep) && file !== directory) {
        response.writeHead(403).end();
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html');
      }
      if (!fs.existsSync(file)) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(response);
    } catch {
      response.writeHead(400).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}/`;
}

async function variants(urls) {
  const checks = [];
  const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });
  const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1440, height: 900 });
  const cdp = new CdpSession(browser.pageWs);
  try {
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    for (const [name, url] of Object.entries(urls)) {
      await navigateAndWait(cdp, url);
      const actual = await evaluateInPage(cdp, `(() => ({
        language: document.documentElement.lang,
        links: [...document.querySelectorAll('.wf-menu-link')].map(a => ({ name: a.textContent.trim(), path: a.pathname })),
        languages: document.querySelectorAll('.wf-lang a').length,
        hero: document.querySelector('.wf-hero__sentence')?.textContent.trim(),
        mainHeight: document.querySelector('main').clientHeight,
        viewport: innerHeight,
        canvases: document.querySelectorAll('canvas').length,
        sceneScript: [...document.scripts].some(s => s.src.includes('scene.')),
        transition: getComputedStyle(document.querySelector('main')).viewTransitionName,
        css: getComputedStyle(document.documentElement).getPropertyValue('--wf-paper').trim()
      }))()`);
      if (name === 'default' || name === 'single') {
        check(`${name}-navigation`, actual.links.map(link => link.path).join(',') === '/blog/,/essays/,/projects/,/fiction/,/photography/,/about/', actual);
        for (const link of actual.links) {
          check(`${name}-${link.path}`, (await fetch(new URL(link.path, url))).status === 200, link);
        }
      }
      if (name === 'single') {
        check('single-language', actual.language === 'en' && actual.languages === 0, actual);
      }
      if (name === 'custom') {
        check('custom-menu-replaces-default', JSON.stringify(actual.links) === JSON.stringify([{ name: 'Fixture about', path: '/about/' }, { name: 'Fixture writing', path: '/blog/' }]), actual);
      }
      if (name === 'minimal') {
        check('minimal-defaults', actual.language === 'en' && actual.languages === 0 && actual.hero.includes('He makes me lie down') && actual.links.length === 1 && actual.links[0].name === 'Home' && actual.mainHeight === actual.viewport && actual.css.length > 0 && actual.transition === 'none', actual);
        await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
        await navigateAndWait(cdp, url);
        check('minimal-no-js', await evaluateInPage(cdp, `getComputedStyle(document.querySelector('.wf-menu-link')).visibility !== 'hidden' && document.querySelector('main').textContent.includes('He makes me lie down')`), url);
        await cdp.send('Emulation.setScriptExecutionDisabled', { value: false });
      }
      if (name === 'disabled') {
        check('features-disabled', actual.canvases === 0 && !actual.sceneScript && actual.transition === 'none', actual);
      }
      const assets = await evaluateInPage(cdp, `[...document.querySelectorAll('link[rel="stylesheet"], script[src], link[rel="preload"]')].map(el => el.href || el.src)`);
      for (const asset of assets) {
        check(`${name}-asset-${new URL(asset).pathname}`, (await fetch(new URL(new URL(asset).pathname, url))).status === 200, asset);
      }
      const tree = await cdp.send('Accessibility.getFullAXTree');
      const visible = tree.nodes.filter(node => !node.ignored);
      const roles = visible.map(node => node.role?.value);
      check(`${name}-accessibility-structure`, roles.includes('main') && roles.includes('banner') && roles.includes('contentinfo') && !roles.includes('Canvas') && visible.filter(node => node.role?.value === 'button').every(node => node.name?.value?.trim()), { roles, unnamedButtons: visible.filter(node => node.role?.value === 'button' && !node.name?.value?.trim()).length });
    }
  } finally {
    cdp.close();
    await shutdownBrowser(browser);
    fs.writeFileSync(path.join(out, 'variants.json'), JSON.stringify(checks, null, 2) + '\n');
  }
  results.push({ name: 'consumer-variants', ok: checks.every(check => check.ok), passed: checks.filter(check => check.ok).length, total: checks.length });
  if (checks.some(check => !check.ok)) {
    throw new Error(`Consumer variants failed; see ${path.join(out, 'variants.json')}`);
  }
  console.log(`PASS consumer-variants (${checks.length})`);
}

try {
  const urls = {};
  for (const name of ['default', 'single', 'custom', 'minimal', 'disabled']) {
    const directory = path.join(out, 'sites', name);
    const source = name === 'minimal' ? path.join(fixtures, 'minimal') : path.join(root, 'exampleSite');
    const args = ['--source', source, '--themesDir', path.dirname(root), '--theme', path.basename(root), '--destination', directory, '--panicOnWarning', '--printPathWarnings', '--printI18nWarnings'];
    // An empty consumer need not exercise every render hook; the complete fixture audits unused templates.
    if (name !== 'minimal') {
      args.push('--printUnusedTemplates');
    }
    const config = { single: 'single-language', custom: 'custom-menu', disabled: 'disabled' }[name];
    if (config) {
      args.push('--config', `${path.join(root, 'exampleSite/hugo.toml')},${path.join(fixtures, `${config}.toml`)}`);
    }
    await run(`build-${name}`, hugo, args);
    urls[name] = await serve(directory);
  }
  await variants(urls);
  if (!process.argv.includes('--variants-only')) {
    for (const width of [1440, 390]) {
      await run(`probe-${width}`, process.execPath, ['test/probe.mjs', '--url', urls.default, '--width', String(width), '--height', width === 1440 ? '900' : '844', '--json']);
    }
    for (const suite of ['home-controls', 'content-boundaries', 'immersive-reading', 'signature', 'scene-visibility', 'stream-flow']) {
      const args = [`test/${suite}.mjs`, '--url', urls.default, '--out', path.join(out, suite)];
      if (suite === 'signature') {
        args.push('--disabled-url', urls.disabled);
      }
      await run(suite, process.execPath, args);
    }
  }
} catch (error) {
  results.push({ name: 'execution', ok: false, error: error.stack });
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(`Results: ${out}`);
}
