#!/usr/bin/env node
// 维护者预生成品牌位图；主题用户构建只发布已打包 PNG，无需 Chrome/Node。
import fs from 'node:fs';
import path from 'node:path';
import { CdpSession, findBrowser, launchBrowser, shutdownBrowser, evaluateInPage } from '../test/probe.mjs';
const root = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(root, 'assets/images/emblem.svg'), 'utf8');
const tokens = fs.readFileSync(path.join(root, 'assets/css/tokens.css'), 'utf8');
const color = (key) => tokens.match(new RegExp(`--wf-${key}:\\s*([^;]+);`))[1].trim();
const grain = fs.readFileSync(path.join(root, 'assets/images/grain-light.png')).toString('base64');
const browser = await launchBrowser({ browserPath: findBrowser().path, width: 1200, height: 630 });
const cdp = new CdpSession(browser.pageWs);
try {
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  for (const [file, width, height, html, transparent] of [
    ['assets/images/og-default.png', 1200, 630, `<body style="margin:0;background:${color('paper')};color:${color('star-dark')}"><div style="position:absolute;inset:0;background-image:url(data:image/png;base64,${grain});background-size:120px;opacity:.06"></div><div style="position:absolute;left:544px;top:40px;width:112px">${svg}</div></body>`, false],
    ['assets/favicon/apple-touch-icon.png', 180, 180, `<body style="margin:0;background:${color('paper')};color:${color('star-dark')};display:grid;place-items:center;width:180px;height:180px"><div style="width:132px">${svg}</div></body>`, false],
    ['assets/images/emblem.png', 558, 375, `<body style="margin:0;color:${color('star-dark')}">${svg}</body>`, true],
  ]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: transparent ? 0 : 1 } });
    await evaluateInPage(cdp, `document.open();document.write(${JSON.stringify(html)});document.close();true`);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(root, file), Buffer.from(shot.data, 'base64'));
    console.log(`${file} ${width}×${height}`);
  }
} finally {
  cdp.close();
  await shutdownBrowser(browser);
}
