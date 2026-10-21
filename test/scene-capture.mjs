#!/usr/bin/env node
// 确定性静态首帧截图：reduce 偏好下按视口 × 主题抓页面与场景底图，供迁移前后像素对照。
// 零依赖：复用 test/probe.mjs（Node >= 22，headless Chrome 软件渲染）。
// 用法: node test/scene-capture.mjs --url <url> --out <dir>
//        [--sizes 1440x900,390x844] [--themes day,night] [--browser <path>]
// 说明: 只在 prefers-reduced-motion: reduce 下运行；场景只画一次静态首帧，因此截图可重复。
//       Canvas 2D 基线会额外导出每主题静态底图（base-<w>-<theme>.png）；WebGL 版本没有该底图，跳过即可。
import fs from 'node:fs';
import path from 'node:path';
import {
  CdpSession,
  evaluateInPage,
  findBrowser,
  launchBrowser,
  navigateAndWait,
  reloadAndWait,
  shutdownBrowser,
  sleep,
} from './probe.mjs';

const arg = (key, fallback) => {
  const index = process.argv.indexOf(key);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const has = (key) => process.argv.includes(key);

const USAGE = `scene-capture: 抓确定性静态首帧（reduce）与 Canvas 2D 静态底图

选项:
  --url <url>          页面 URL（必需）
  --out <dir>          输出目录（必需）
  --sizes <list>       视口列表，默认 1440x900,390x844
  --themes <list>      主题列表，默认 day,night
  --browser <path>     浏览器可执行文件；缺省同 test/probe.mjs 的发现顺序
  --wait <ms>          首帧后的额外等待，默认 350
  --help, -h           显示帮助

输出: <width>-<theme>.png、base-<width>-<theme>.png（若可）、capture.json。`;

function parseSizes(raw) {
  return String(raw)
    .split(',')
    .map((item) => {
      const match = /^(\d+)x(\d+)$/.exec(item.trim());
      if (!match) {
        throw new Error(`--sizes 需要 WxH 列表，收到 ${item}`);
      }
      return { width: Number(match[1]), height: Number(match[2]) };
    });
}

function parseThemes(raw) {
  const themes = String(raw).split(',').map((item) => item.trim());
  for (const theme of themes) {
    if (!['day', 'night'].includes(theme)) {
      throw new Error(`--themes 只接受 day,night，收到 ${theme}`);
    }
  }
  return themes;
}

const BASE_HOOK = `
  window.wfBaseCanvases = {};
  const wfDraw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
    const canvas = this.canvas;
    if (canvas && canvas.matches && canvas.matches('[data-wf-canvas]') && source &&
        source.width === canvas.width && source.height === canvas.height) {
      window.wfBaseCanvases[canvas.getAttribute('data-wf-canvas')] = source;
    }
    return wfDraw.call(this, source, ...args);
  };
`;

async function waitForScene(cdp) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const ready = await evaluateInPage(
      cdp,
      `(() => {
        const canvases = Array.from(document.querySelectorAll('[data-wf-canvas]'));
        if (!canvases.length) { return false; }
        const painted = canvases.every((canvas) => canvas.width > 0 && canvas.height > 0);
        return painted && document.fonts ? document.fonts.status === 'loaded' : painted;
      })()`,
    );
    if (ready) {
      return true;
    }
    await sleep(100);
  }
  throw new Error('场景在 15s 内未就绪');
}

async function capturePage(cdp, out, size, theme, waitMs) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: size.width,
    height: size.height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: size.width,
    screenHeight: size.height,
  });
  await navigateAndWait(cdp, capturePage.url);
  await evaluateInPage(cdp, `(() => { try { localStorage.setItem('wf-theme', ${JSON.stringify(theme)}); } catch (error) {} return true; })()`);
  await reloadAndWait(cdp);
  await waitForScene(cdp);
  await sleep(waitMs);
  const meta = await evaluateInPage(
    cdp,
    `(() => {
      const canvases = Array.from(document.querySelectorAll('[data-wf-canvas]')).map((canvas) => ({
        theme: canvas.getAttribute('data-wf-canvas'),
        width: canvas.width,
        height: canvas.height,
      }));
      const base = window.wfBaseCanvases || {};
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
        scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        paper: getComputedStyle(document.documentElement).getPropertyValue('--wf-paper').trim(),
        ink: getComputedStyle(document.documentElement).getPropertyValue('--wf-ink').trim(),
        canvas: canvases,
        baseAvailable: Object.keys(base),
      };
    })()`,
  );
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  const shotPath = path.join(out, `${size.width}-${theme}.png`);
  fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  const base = {};
  for (const name of meta.baseAvailable) {
    const dataUrl = await evaluateInPage(cdp, `window.wfBaseCanvases[${JSON.stringify(name)}].toDataURL('image/png')`);
    // 底图按画布主题命名，避免同一页里 day/night 互相覆盖。
    const basePath = path.join(out, `base-${size.width}-${name}.png`);
    fs.writeFileSync(basePath, Buffer.from(String(dataUrl).split(',')[1], 'base64'));
    base[name] = path.basename(basePath);
  }
  return { viewport: [size.width, size.height], theme, screenshot: path.basename(shotPath), base, meta };
}

async function main() {
  if (has('--help') || has('-h')) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const url = arg('--url');
  const out = path.resolve(arg('--out', ''));
  if (!url || !has('--out')) {
    process.stderr.write(`参数错误: 缺少 --url 或 --out\n\n${USAGE}\n`);
    return 2;
  }
  const sizes = parseSizes(arg('--sizes', '1440x900,390x844'));
  const themes = parseThemes(arg('--themes', 'day,night'));
  const waitMs = Number(arg('--wait', '350'));
  fs.mkdirSync(out, { recursive: true });
  capturePage.url = url;

  let browser = null;
  let cdp = null;
  const records = [];
  try {
    const discovered = findBrowser(arg('--browser', null));
    browser = await launchBrowser({ browserPath: discovered.path, width: sizes[0].width, height: sizes[0].height });
    cdp = new CdpSession(browser.pageWs);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: BASE_HOOK });
    await cdp.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'prefers-color-scheme', value: 'light' },
      ],
    });
    for (const size of sizes) {
      for (const theme of themes) {
        records.push(await capturePage(cdp, out, size, theme, waitMs));
      }
    }
    fs.writeFileSync(
      path.join(out, 'capture.json'),
      `${JSON.stringify({ url, date: new Date().toISOString(), waitMs, records }, null, 2)}\n`,
    );
    process.stdout.write(`captured ${records.length} frames into ${out}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`截图失败: ${error && error.stack ? error.stack : error}\n`);
    return 1;
  } finally {
    if (cdp) {
      cdp.close();
    }
    await shutdownBrowser(browser);
  }
}

process.exitCode = await main();
