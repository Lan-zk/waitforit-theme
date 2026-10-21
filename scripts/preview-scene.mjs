#!/usr/bin/env node
// 本地专用：将调参页与实际 Hugo 产物放在同源；不进入主题发布产物。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args[i + 1];
};
const root = path.resolve(option('--root', 'exampleSite/public'));
const port = Number(option('--port', '8821'));
const tuner = fileURLToPath(new URL('../docs/design/spikes/scene-tuner.html', import.meta.url));
if (!fs.existsSync(path.join(root, 'index.html')) || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('需要有效的 Hugo 构建目录与端口：node scripts/preview-scene.mjs --root <目录> --port 8821');
}
const tokens = fileURLToPath(new URL('../assets/css/tokens.css', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let target = pathname === '/tune/' || pathname === '/tune' ? tuner : pathname === '/tune/tokens.css' ? tokens : path.resolve(root, '.' + pathname);
    if (target !== tuner && target !== tokens && target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }
    const data = fs.readFileSync(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Scene tuner: http://127.0.0.1:${port}/tune/\nPreview root: ${root}\n`);
});
