#!/usr/bin/env node
// Track rendered water features across consecutive frames; a pixel-change check alone accepts flicker.
import fs from 'node:fs';
import path from 'node:path';
import { CdpSession, findBrowser, launchBrowser, shutdownBrowser, navigateAndWait, evaluateInPage, sleep } from './probe.mjs';
const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const out = path.resolve(arg('--out', '/tmp/wf-stream-flow'));
const url = new URL(arg('--url', 'http://127.0.0.1:1313/zh/'));
url.searchParams.set('wf-scene-probe', '1');
fs.mkdirSync(out, { recursive: true });
const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1440, height: 900 });
const cdp = new CdpSession(browser.pageWs);
const results = [];
function assess(matches) {
  const patches = matches.flatMap(match => match.patches);
  const tracks = patches.filter(patch => patch.correlation > 0.80 && patch.correlation > patch.stationaryCorrelation + 0.03);
  return { passed: patches.length >= 4 && tracks.length >= Math.ceil(patches.length * 0.80) && tracks.every(track => track.dy > 0), coherentTracks: tracks.length, rejectedTracks: patches.length - tracks.length };
}
try {
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.flowFrames = [];
    window.flowNext = null;
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      const result = draw.apply(this, args);
      const phase = window.wfSceneProbe?.phase();
      if (flowNext === null || typeof phase !== 'number' || phase < flowNext || this.canvas.dataset.wfCanvas !== localStorage.getItem('wf-theme') ||
          args[2] !== 3 || !this.getParameter(this.FRAMEBUFFER_BINDING)) { return result; }
      const vp = this.getParameter(this.VIEWPORT);
      if (vp[2] >= this.canvas.width || vp[3] >= this.canvas.height) { return result; }
      const raw = new Uint8Array(vp[2] * vp[3] * 4);
      this.readPixels(0, 0, vp[2], vp[3], this.RGBA, this.UNSIGNED_BYTE, raw);
      const pixels = new Uint8ClampedArray(raw.length);
      for (let y = 0; y < vp[3]; y += 1) {
        pixels.set(raw.subarray((vp[3] - 1 - y) * vp[2] * 4, (vp[3] - y) * vp[2] * 4), y * vp[2] * 4);
      }
      flowFrames.push({ width: vp[2], height: vp[3], phase, pixels });
      flowNext = flowFrames.length < 3 ? phase + 0.20 : null;
      return result;
    };
  ` });
  for (const width of [1440, 390]) {
    for (const theme of ['day', 'night']) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 900 : 844, deviceScaleFactor: 1, mobile: false });
      await navigateAndWait(cdp, url.href);
      await evaluateInPage(cdp, `localStorage.setItem('wf-theme', '${theme}');true`);
      await navigateAndWait(cdp, url.href);
      await evaluateInPage(cdp, `flowNext = 0;true`);
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        if (await evaluateInPage(cdp, `flowFrames.length === 3`)) { break; }
        await sleep(100);
      }
      for (let frame = 0; frame < 3; frame += 1) {
        if (!(await evaluateInPage(cdp, `flowFrames.length > ${frame}`))) {
          throw new Error(`Water capture timeout: ${width}/${theme}/${frame}`);
        }
        const image = await evaluateInPage(cdp, `(() => {
          const f = flowFrames[${frame}], c = document.createElement('canvas');
          c.width = f.width; c.height = f.height;
          c.getContext('2d').putImageData(new ImageData(f.pixels, f.width, f.height), 0, 0);
          return c.toDataURL('image/png').split(',')[1];
        })()`);
        fs.writeFileSync(path.join(out, `${width}-${theme}-water-${frame}.png`), Buffer.from(image, 'base64'));
      }
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(path.join(out, `${width}-${theme}-live.png`), Buffer.from(shot.data, 'base64'));
      const measurement = await evaluateInPage(cdp, `(() => {
        const measure = (frames) => {
          const matches = [];
          for (let i = 0; i < frames.length - 1; i += 1) {
            const a = frames[i], b = frames[i + 1], w = a.width, h = a.height;
            const patches = [];
            // Fully covered foreground patches exclude the stationary shoreline and transparent horizon.
            for (const fraction of [0.68, 0.78, 0.88]) {
              const cy = Math.floor(h * fraction);
              const interior = [];
              for (let x = 32; x < w - 32; x += 1) {
                if (a.pixels[(cy * w + x) * 4 + 3] > 250) { interior.push(x); }
              }
              if (interior.length < 36) { continue; }
              const cx = interior[Math.floor(interior.length / 2)];
              const score = (dx, dy) => {
                let n = 0, sa = 0, sb = 0, aa = 0, bb = 0, ab = 0;
                for (let y = cy - 10; y <= cy + 10; y += 1) {
                  for (let x = cx - 14; x <= cx + 14; x += 1) {
                    const ai = (y * w + x) * 4, bi = ((y + dy) * w + x + dx) * 4;
                    if (b.pixels[bi + 3] < 250) { return -1; }
                    const av = a.pixels[ai], bv = b.pixels[bi];
                    n += 1; sa += av; sb += bv; aa += av * av; bb += bv * bv; ab += av * bv;
                  }
                }
                return (ab - sa * sb / n) / Math.sqrt(Math.max(1, (aa - sa * sa / n) * (bb - sb * sb / n)));
              };
              let best = { correlation: -1 };
              for (let dy = -32; dy <= 32; dy += 1) {
                for (let dx = -28; dx <= 28; dx += 1) {
                  if (cy + dy - 10 < 0 || cy + dy + 10 >= h) { continue; }
                  const correlation = score(dx, dy);
                  if (correlation > best.correlation) { best = { dx, dy, correlation }; }
                }
              }
              patches.push({ cx, cy, stationaryCorrelation: score(0, 0), ...best });
            }
            matches.push({ phaseDelta: b.phase - a.phase, patches });
          }
          return matches;
        };
        const controls = innerWidth === 1440 && localStorage.getItem('wf-theme') === 'day' ? {
          frozen: measure([flowFrames[0], flowFrames[0], flowFrames[0]]),
          reversed: measure(flowFrames.slice().reverse())
        } : null;
        return { texture: [flowFrames[0].width, flowFrames[0].height], matches: measure(flowFrames), controls };
      })()`);
      // A disappearing glint has no reliable correspondence. Direction is meaningful only for
      // confident tracks; require 80% coverage and reject static and reversed-image controls.
      const flow = assess(measurement.matches);
      const controls = measurement.controls && Object.fromEntries(Object.entries(measurement.controls).map(([name, matches]) => [name, assess(matches)]));
      const passed = flow.passed && (!controls || Object.values(controls).every(control => !control.passed));
      results.push({ width, theme, ...flow, passed, ...measurement, controlResults: controls });
      console.log(JSON.stringify(results.at(-1)));
    }
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  if (results.some((result) => !result.passed)) { process.exitCode = 1; }
} finally {
  cdp.close();
  await shutdownBrowser(browser);
}
