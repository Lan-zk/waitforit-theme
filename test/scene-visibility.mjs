#!/usr/bin/env node
// WebGL2 场景最终合成画面：六秒局部运动、阅读区安静、reduce 静帧、静态层不变、上下文丢失恢复。
// 探针：?wf-scene-probe=1 暴露只读 phase/frames/staticBuilds/tips/staticImage；帧计数由 day 画布 clear 次数得到。
import fs from 'node:fs';
import path from 'node:path';
import { CdpSession, findBrowser, launchBrowser, shutdownBrowser, navigateAndWait, reloadAndWait, evaluateInPage, sleep } from './probe.mjs';

const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--url', 'http://127.0.0.1:8821/');
const out = path.resolve(arg('--out', '/tmp/wf-scene-visibility'));
fs.mkdirSync(out, { recursive: true });

const probeUrl = (() => {
  const url = new URL(base);
  url.searchParams.set('wf-scene-probe', '1');
  return url.href;
})();

const results = [];
const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1440, height: 900 });
const cdp = new CdpSession(browser.pageWs);

async function waitForProbe(minFrames) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const state = await evaluateInPage(cdp, `(() => {
      const probe = window.wfSceneProbe;
      if (!probe) { return null; }
      if (probe.error) { return { error: probe.error }; }
      return { ready: probe.ready(), frames: probe.frames(), builds: probe.staticBuilds() };
    })()`);
    if (state && state.error) {
      throw new Error('场景初始化失败: ' + state.error);
    }
    if (state && state.ready && state.frames >= minFrames) {
      return state;
    }
    await sleep(100);
  }
  throw new Error('场景在 20s 内未就绪');
}

async function snapshot() {
  return evaluateInPage(cdp, `(() => {
    const probe = window.wfSceneProbe;
    if (!probe) { return null; }
    return {
      frames: probe.frames(),
      builds: probe.staticBuilds(),
      tips: probe.tips().filter((tip) => tip.active),
      draws: window.wfSceneDraws
    };
  })()`);
}

async function screenshot() {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  return shot.data;
}

async function decodeAndMeasure(shots) {
  return evaluateInPage(cdp, `(async () => {
    const pixels = [];
    for (const shot of ${JSON.stringify(shots)}) {
      const image = new Image();
      image.src = 'data:image/png;base64,' + shot;
      await image.decode();
      const canvas = new OffscreenCanvas(innerWidth, innerHeight);
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      pixels.push(context.getImageData(0, 0, innerWidth, innerHeight).data);
    }
    // 场景几何复算只用于水面 mask（与 assets/js/scene.js 的 waterCoverage 一致）。
    const rootStyles = getComputedStyle(document.documentElement);
    const width = Math.min(1440, Math.round(innerWidth));
    const height = Math.round(width * innerHeight / innerWidth);
    const scale = width / innerWidth;
    const small = innerWidth <= 520;
    const horizon = height * (parseFloat(rootStyles.getPropertyValue('--wf-horizon')) / 100);
    const origin = parseFloat(rootStyles.getPropertyValue('--wf-stream-origin')) / 100;
    const drift = parseFloat(rootStyles.getPropertyValue('--wf-stream-drift')) / 100;
    const bend = parseFloat(rootStyles.getPropertyValue('--wf-stream-bend')) / 100;
    const curve = parseFloat(rootStyles.getPropertyValue('--wf-stream-curve'));
    const shore = parseFloat(rootStyles.getPropertyValue('--wf-shore-softness'));
    const streamWidth = parseFloat(rootStyles.getPropertyValue('--wf-stream-width')) / 100;
    const stream = (depth) => ({
      x: width * (origin - (small ? 0.10 : 0) + depth * drift + Math.sin(depth * curve) * bend * (small ? 4 / 3 : 1)),
      half: width * (0.0025 + streamWidth * 0.5 * Math.pow(Math.max(0, depth), 1.4)) * (1 + Math.sin(depth * 27) * 0.07 + Math.sin(depth * 61) * 0.035)
    });
    const shoreWidth = (depth) => shore * scale * (0.3 + Math.max(0, depth) * 0.7);
    const isWater = (x, y) => {
      const depth = (y - horizon) / (height - horizon);
      if (!(depth >= 0)) { return false; }
      const creek = stream(depth);
      const shoreHere = shoreWidth(depth);
      const irregularity = Math.sin(depth * 47 + x / width * 13) * 0.16 + Math.sin(depth * 119) * 0.08;
      const mix = Math.max(0, Math.min(1, (creek.half - Math.abs(x - creek.x)) / shoreHere + 0.45 + irregularity));
      return mix * mix * (3 - 2 * mix) > 0.5;
    };
    const measure = (left, right, top, bottom, mask) => {
      let total = 0, strong = 0, max = 0, sum = 0;
      for (let y = Math.floor(top); y < Math.floor(bottom); y += 1) {
        for (let x = Math.floor(left); x < Math.floor(right); x += 1) {
          if (mask && !mask(x, y)) { continue; }
          const offset = (y * innerWidth + x) * 4;
          let delta = 0;
          for (let k = 0; k < 3; k += 1) { delta = Math.max(delta, Math.abs(pixels[0][offset + k] - pixels[1][offset + k])); }
          total += 1;
          sum += delta;
          if (delta >= 4) { strong += 1; }
          max = Math.max(max, delta);
        }
      }
      return { total, strong, max, meanDelta: sum / total, ratio: strong / total };
    };
    const grass = measure(innerWidth * 0.08, innerWidth * 0.55, innerHeight * 0.70, innerHeight * 0.84);
    const water = measure(innerWidth * (innerWidth <= 520 ? 0.58 : 0.69), innerWidth * 0.9, innerHeight * 0.70, innerHeight * 0.84, isWater);
    const hero = document.querySelector('.wf-hero__sentence').getBoundingClientRect();
    const center = measure(Math.max(0, hero.left - 16), Math.min(innerWidth, hero.right + 16), Math.max(0, hero.top - 16), Math.min(innerHeight, hero.bottom + 16));
    return { grass, water, center };
  })()`);
}

async function countChangedPixels(shots) {
  return evaluateInPage(cdp, `(async () => {
    const buffers = [];
    for (const shot of ${JSON.stringify(shots)}) {
      const image = new Image();
      image.src = 'data:image/png;base64,' + shot;
      await image.decode();
      const canvas = new OffscreenCanvas(innerWidth, innerHeight);
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      buffers.push(context.getImageData(0, 0, innerWidth, innerHeight).data);
    }
    let changed = 0;
    for (let i = 0; i < buffers[0].length; i += 1) {
      if (buffers[0][i] !== buffers[1][i]) { changed += 1; }
    }
    return changed;
  })()`);
}

try {
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.wfSceneDraws = 0;
    window.wfErrors = [];
    const clear = WebGL2RenderingContext.prototype.clear;
    WebGL2RenderingContext.prototype.clear = function (...args) {
      if (this.canvas && this.canvas.matches && this.canvas.matches('[data-wf-canvas="day"]') &&
          this.getParameter(this.FRAMEBUFFER_BINDING) === null) { window.wfSceneDraws += 1; }
      return clear.apply(this, args);
    };
    addEventListener('error', (event) => wfErrors.push(event.message));
  `});

  for (const width of [1440, 390]) {
    const height = width === 390 ? 844 : 900;
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    for (const theme of ['day', 'night']) {
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
      await navigateAndWait(cdp, probeUrl);
      await evaluateInPage(cdp, `localStorage.setItem('wf-theme', ${JSON.stringify(theme)});true`);
      await reloadAndWait(cdp);
      await evaluateInPage(cdp, 'document.fonts.ready.then(() => true)');
      await waitForProbe(2);

      const before = await snapshot();
      const staticBefore = await evaluateInPage(cdp, `window.wfSceneProbe.staticImage(${JSON.stringify(theme)})`);
      const shots = [await screenshot()];
      await sleep(6000);
      shots.push(await screenshot());
      const after = await snapshot();
      const staticAfter = await evaluateInPage(cdp, `window.wfSceneProbe.staticImage(${JSON.stringify(theme)})`);
      const staticGround = staticBefore === staticAfter && before.builds === after.builds;

      const scale = await evaluateInPage(cdp, `document.querySelector('[data-wf-canvas="day"]').width / innerWidth`);
      const tipsBefore = before.tips;
      const tipsAfter = after.tips;
      let rootsFixed = tipsBefore.length === tipsAfter.length;
      const motion = [];
      for (let i = 0; i < tipsBefore.length; i += 1) {
        const a = tipsBefore[i];
        const b = tipsAfter[i];
        if (!b || Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 1e-6) {
          rootsFixed = false;
          continue;
        }
        if (Math.abs(b.tipX - a.tipX) > 0.1 * scale) {
          motion.push({ x: a.x, y: a.y, dx: b.tipX - a.tipX });
        }
      }
      let pairs = 0;
      let sameDirection = 0;
      for (let i = 0; i < motion.length; i += 1) {
        for (let j = i + 1; j < motion.length; j += 1) {
          if (Math.abs(motion[i].x - motion[j].x) <= 24 * scale && Math.abs(motion[i].y - motion[j].y) <= 8 * scale) {
            pairs += 1;
            if (motion[i].dx * motion[j].dx > 0) { sameDirection += 1; }
          }
        }
      }
      const wind = {
        rootsFixed,
        movingBlades: motion.length,
        observedBlades: tipsBefore.length,
        neighborPairs: pairs,
        neighborAgreement: pairs ? sameDirection / pairs : 0
      };
      const diff = await decodeAndMeasure(shots);

      await evaluateInPage(cdp, `window.wfReduced = new Promise((resolve) => matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => requestAnimationFrame(() => resolve(true)), { once: true }));true`);
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await evaluateInPage(cdp, 'wfReduced');
      await evaluateInPage(cdp, `new Promise((resolve, reject) => {
        let last = wfSceneDraws, quiet = 0;
        const start = performance.now();
        const timer = setInterval(() => {
          quiet = wfSceneDraws === last ? quiet + 50 : 0;
          last = wfSceneDraws;
          if (quiet >= 300) { clearInterval(timer); resolve(true); }
          else if (performance.now() - start > 3000) { clearInterval(timer); reject(new Error('scene did not settle after reduce')); }
        }, 50);
      })`);
      const still = await screenshot();
      const draws = await evaluateInPage(cdp, 'wfSceneDraws');
      await sleep(6000);
      const stillAfter = await screenshot();
      fs.writeFileSync(path.join(out, `${width}-${theme}-reduce-0.png`), Buffer.from(still, 'base64'));
      fs.writeFileSync(path.join(out, `${width}-${theme}-reduce-1.png`), Buffer.from(stillAfter, 'base64'));
      const reducedDraws = (await evaluateInPage(cdp, 'wfSceneDraws')) - draws;
      const reducedPixels = await countChangedPixels([still, stillAfter]);
      const reducedStable = reducedPixels === 0 && reducedDraws === 0;

      // 基于本场景视觉复核后的局部区域；上下界同时约束可辨运动与运动范围。
      const ok = staticGround && reducedStable && wind.rootsFixed && wind.neighborPairs >= 50 && wind.neighborAgreement >= 0.75 &&
        diff.grass.ratio >= 0.001 && diff.grass.meanDelta <= 10 && diff.grass.max <= 64 &&
        diff.water.ratio >= 0.02 && diff.water.meanDelta <= 12 && diff.water.max <= 64 &&
        diff.center.ratio < 0.001;
      results.push({ width, height, theme, elapsedMs: 6000, staticGround, reducedStable, reducedPixels, reducedDraws, wind, ...diff, ok });
      console.log(`${ok ? 'PASS' : 'FAIL'} ${width} ${theme}: grass ${diff.grass.ratio}, water ${diff.water.ratio}, center ${diff.center.ratio}, neighbors ${wind.neighborAgreement.toFixed(3)}, roots ${rootsFixed}, static ${staticGround}, reduce ${reducedStable}`);
    }
  }

  // 上下文丢失/恢复：丢失后停止绘制，恢复后继续且无页面错误。
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigateAndWait(cdp, probeUrl);
  await waitForProbe(2);
  const lossBefore = await evaluateInPage(cdp, 'window.wfSceneDraws');
  await evaluateInPage(cdp, `(() => { const gl = document.querySelector('[data-wf-canvas="day"]').getContext('webgl2'); window.__lose = gl.getExtension('WEBGL_lose_context'); __lose.loseContext(); return true; })()`);
  await sleep(600);
  const lossDuring = await evaluateInPage(cdp, 'window.wfSceneDraws');
  await sleep(400);
  const lossStill = await evaluateInPage(cdp, 'window.wfSceneDraws');
  await evaluateInPage(cdp, `(() => { window.__lose.restoreContext(); return true; })()`);
  await sleep(1500);
  const lossRestored = await evaluateInPage(cdp, 'window.wfSceneDraws');
  const errors = await evaluateInPage(cdp, 'window.wfErrors');
  const contextLoss = {
    before: lossBefore,
    during: lossDuring,
    stableWhileLost: lossStill === lossDuring,
    restored: lossRestored,
    resumed: lossRestored > lossStill,
    errors
  };
  fs.writeFileSync(path.join(out, 'context-loss.json'), `${JSON.stringify(contextLoss, null, 2)}\n`);
  if (!(contextLoss.stableWhileLost && contextLoss.resumed && errors.length === 0)) {
    results.push({ width: 1440, height: 900, theme: 'day', contextLoss, ok: false });
  }
  console.log(`${contextLoss.stableWhileLost && contextLoss.resumed && errors.length === 0 ? 'PASS' : 'FAIL'} context-loss: ${JSON.stringify(contextLoss)}`);
} finally {
  cdp.close();
  await shutdownBrowser(browser);
  fs.writeFileSync(path.join(out, 'visibility.json'), `${JSON.stringify({ date: new Date().toISOString(), thresholdDelta: 4, results }, null, 2)}\n`);
}
const groups = results.filter((result) => result.theme);
process.exitCode = groups.length === 4 && groups.every((result) => result.ok) ? 0 : 1;
