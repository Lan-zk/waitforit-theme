#!/usr/bin/env node
// 同机场景绘制成本采样：记录主线程每逻辑帧提交耗时与帧数；记录实际视口与浏览器。
// 注意：headless/软件渲染环境不代表普通 GPU 浏览的性能；GPU 侧耗时不可移植测量，
// 本脚本的绝对数值只用于同环境迁移前后对比，不作为真机结论。
import fs from 'node:fs';
import { CdpSession, findBrowser, launchBrowser, navigateAndWait, shutdownBrowser, evaluateInPage, sleep } from './probe.mjs';
const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--url', 'http://127.0.0.1:8821/');
const out = arg('--out', '/tmp/wf-scene-performance.json');
const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1440, height: 900 });
const cdp = new CdpSession(browser.pageWs);
try {
  await cdp.connect();
  for (const domain of ['Page', 'Runtime']) { await cdp.send(domain + '.enable'); }
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.wfPerf = { draws: 0, samples: [], errors: [], longTasks: [] };
    addEventListener('error', (event) => wfPerf.errors.push(event.message));
    // 每逻辑帧 day 画布恰好 clear 一次；以此计帧，不再依赖 Canvas 2D 绘制调用。
    const clear = WebGL2RenderingContext.prototype.clear;
    WebGL2RenderingContext.prototype.clear = function (...args) {
      if (this.canvas && this.canvas.matches && this.canvas.matches('[data-wf-canvas="day"]') &&
          this.getParameter(this.FRAMEBUFFER_BINDING) === null) {
        wfPerf.draws += 1;
      }
      return clear.apply(this, args);
    };
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = function (callback) {
      return raf.call(window, now => {
        const count = wfPerf.draws, start = performance.now();
        callback(now);
        if (wfPerf.draws > count) { wfPerf.samples.push(performance.now() - start); }
      });
    };
    if (window.PerformanceObserver) {
      try {
        new PerformanceObserver((list) => { for (const entry of list.getEntries()) wfPerf.longTasks.push(entry.duration); }).observe({ entryTypes: ['longtask'] });
      } catch (error) {}
    }
  `});
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await navigateAndWait(cdp, base);
  await sleep(1000);
  await evaluateInPage(cdp, 'wfPerf.samples=[];wfPerf.draws=0;wfPerf.longTasks=[];true');
  await sleep(10000);
  const result = await evaluateInPage(cdp, `(() => {
    const sorted = wfPerf.samples.slice().sort((a, b) => a - b);
    const longTasks = wfPerf.longTasks.slice();
    return {
      userAgent: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      devicePixelRatio,
      durationMs: 10000,
      hidden: document.hidden,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      cycle: getComputedStyle(document.documentElement).getPropertyValue('--wf-motion-wind-cycle'),
      errors: wfPerf.errors,
      logicalFrames: wfPerf.draws,
      medianMs: sorted[Math.floor(sorted.length * 0.5)],
      p95Ms: sorted[Math.floor(sorted.length * 0.95)],
      samples: sorted.length,
      longTasks: longTasks.length,
      longTaskTotalMs: longTasks.reduce((sum, value) => sum + value, 0),
      webglRenderer: (() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        const debug = gl && gl.getExtension('WEBGL_debug_renderer_info');
        return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null;
      })()
    };
  })()`);
  if (result.samples < 20) {
    throw new Error('Not enough active drawing samples: ' + JSON.stringify(result));
  }
  fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  console.log(result);
} finally {
  cdp.close();
  await shutdownBrowser(browser);
}
