#!/usr/bin/env node
// waitforit-theme 证据截图辅助（OpenSpec theme-skeleton task 6.3）。
//
// 零依赖：复用 test/probe.mjs 的 CDP 会话与浏览器生命周期，用 Page.captureScreenshot 出图；
// 不引入 puppeteer/playwright，也不依赖外部截图工具。
// 用法: node test/shoot.mjs --url <url> --out <png> [--width 1440] [--height 900] [--theme auto|day|night]
//                          [--browser <path>] [--wait <ms>]
// 退出码: 0 成功；1 失败；2 参数错误。

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  CdpSession,
  attachPageState,
  evaluateInPage,
  findBrowser,
  launchBrowser,
  navigateAndWait,
  reloadAndWait,
  shutdownBrowser,
  sleep,
} from './probe.mjs';

const USAGE = `waitforit-theme 证据截图工具（零依赖 CDP，Node >= 22）

用法:
  node test/shoot.mjs --url <url> --out <png> [选项]

选项:
  --url <url>         要截图的页面 URL
  --out <png>         输出 PNG 路径（目录不存在会创建）
  --width <px>        视口宽，默认 1440
  --height <px>       视口高，默认 900
  --theme <mode>      显式主题：auto（默认，不写 localStorage）| day | night
  --browser <path>    浏览器可执行文件；缺省同 test/probe.mjs 的发现顺序
  --wait <ms>         字体就绪后的额外等待，默认 500
  --help, -h          显示本帮助并退出 0

截图严格等于 --width x --height（deviceScaleFactor=1），不整页滚动拼接。`;

function parseDimension(value, flag) {
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new Error(`${flag} 需要正整数，收到 ${JSON.stringify(value)}`);
  }
  return Number(value);
}

function parseArgs(argv) {
  const options = {
    url: null,
    out: null,
    width: 1440,
    height: 900,
    theme: 'auto',
    browserPath: null,
    waitMs: 500,
    help: false,
  };
  const errors = [];
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const equals = raw.indexOf('=');
    const name = equals >= 0 ? raw.slice(0, equals) : raw;
    const inlineValue = equals >= 0 ? raw.slice(equals + 1) : undefined;
    const takeValue = () => {
      if (inlineValue !== undefined) {
        return inlineValue;
      }
      const next = argv[index + 1];
      if (next === undefined || next.startsWith('--')) {
        throw new Error(`${name} 缺少取值`);
      }
      index += 1;
      return next;
    };
    try {
      switch (name) {
        case '--url':
          options.url = takeValue();
          break;
        case '--out':
          options.out = takeValue();
          break;
        case '--width':
          options.width = parseDimension(takeValue(), '--width');
          break;
        case '--height':
          options.height = parseDimension(takeValue(), '--height');
          break;
        case '--theme': {
          const mode = takeValue();
          if (!['auto', 'day', 'night'].includes(mode)) {
            throw new Error('--theme 只接受 auto|day|night');
          }
          options.theme = mode;
          break;
        }
        case '--browser':
          options.browserPath = takeValue();
          break;
        case '--wait':
          options.waitMs = parseDimension(takeValue(), '--wait');
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
        default:
          throw new Error(`未知参数 ${raw}`);
      }
    } catch (error) {
      errors.push(error && error.message ? error.message : String(error));
    }
  }
  if (errors.length > 0) {
    return { ...options, error: errors.join('; ') };
  }
  if (!options.help && (!options.url || !options.out)) {
    return { ...options, error: '缺少 --url 或 --out' };
  }
  return options;
}

function readPngSize(buffer) {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('截图不是有效 PNG');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (options.error) {
    process.stderr.write(`参数错误: ${options.error}\n\n${USAGE}\n`);
    return 2;
  }

  let browser = null;
  let cdp = null;
  try {
    const discovered = findBrowser(options.browserPath);
    browser = await launchBrowser({ browserPath: discovered.path, width: options.width, height: options.height });
    cdp = new CdpSession(browser.pageWs);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    const state = attachPageState(cdp);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: options.width,
      height: options.height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: options.width,
      screenHeight: options.height,
    });
    await navigateAndWait(cdp, options.url, { state });

    // 主题必须在 head 内联脚本执行前写入 localStorage，所以设完再 reload。
    if (options.theme !== 'auto') {
      await evaluateInPage(cdp, `(() => { localStorage.setItem('wf-theme', ${JSON.stringify(options.theme)}); return true; })()`);
      await reloadAndWait(cdp, { state });
    } else {
      await evaluateInPage(cdp, `(() => { try { localStorage.removeItem('wf-theme'); } catch (error) {} return true; })()`);
    }
    await evaluateInPage(cdp, 'document.fonts ? document.fonts.ready.then(() => true) : true');
    await sleep(options.waitMs);

    const meta = await evaluateInPage(
      cdp,
      `(() => ({
        title: document.title,
        dataTheme: document.documentElement.getAttribute('data-theme'),
        paper: getComputedStyle(document.documentElement).getPropertyValue('--wf-paper').trim(),
        ink: getComputedStyle(document.documentElement).getPropertyValue('--wf-ink').trim(),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))()`,
    );

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.resolve(options.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buffer);
    const size = readPngSize(buffer);
    process.stdout.write(
      `saved ${outPath}\n` +
        `  png ${size.width}x${size.height}, ${(buffer.length / 1024).toFixed(1)} KiB\n` +
        `  title="${meta.title}" data-theme=${meta.dataTheme ?? '<absent>'} --wf-paper=${meta.paper} --wf-ink=${meta.ink}\n` +
        `  scrollWidth=${meta.scrollWidth} clientWidth=${meta.clientWidth}\n`,
    );
    return 0;
  } catch (error) {
    process.stderr.write(`截图失败: ${error && error.message ? error.message : error}\n`);
    return 1;
  } finally {
    if (cdp) {
      cdp.close();
    }
    await shutdownBrowser(browser);
  }
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`截图异常: ${error && error.stack ? error.stack : error}\n`);
      process.exitCode = 1;
    });
}
