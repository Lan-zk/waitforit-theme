#!/usr/bin/env node
// waitforit-theme 浏览器验收探针（OpenSpec theme-skeleton task 7.1）。
//
// 零依赖：直接用 Node 内置 WebSocket 走 Chrome DevTools Protocol（CDP），不引入
// puppeteer/playwright；浏览器进程与临时 profile 由本脚本拉起和清理。
// 用法: node test/probe.mjs --url <url> [--width 1440] [--height 900] [--browser <path>] [--json] [--help]
// 退出码: 0 全部检查通过；1 有检查失败或浏览器/页面不可用；2 参数错误。
//
// 可被 test/shoot.mjs 复用：findBrowser / launchBrowser / shutdownBrowser / CdpSession /
// evaluateInPage / navigateAndWait / waitUntilReady / sleep 均为导出。

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;
const LOAD_TIMEOUT_MS = 30_000;
const LAUNCH_TIMEOUT_MS = 30_000;
const SETTLE_MS = 500;
const HIT_TARGET_PX = 44;
const TOKEN_NAMES = ['--wf-ink', '--wf-paper', '--wf-veil-rgb', '--wf-frame-block', '--wf-motion-theme'];

// 排查浏览器生命周期问题时用 WF_PROBE_DEBUG=1 打开；正常运行不输出。
const DEBUG = process.env.WF_PROBE_DEBUG === '1';

function debugLog(message) {
  if (DEBUG) {
    process.stderr.write(`[probe] ${message}\n`);
  }
}

export const USAGE = `waitforit-theme 浏览器验收探针（零依赖 CDP，Node >= 22）

用法:
  node test/probe.mjs --url <url> [选项]

选项:
  --url <url>         要探测的页面（建议 http:// 本地静态服务；file:// 也能跑但 localStorage 受限）
  --width <px>        视口宽，默认 ${DEFAULT_WIDTH}
  --height <px>       视口高，默认 ${DEFAULT_HEIGHT}
  --browser <path>    浏览器可执行文件；缺省依次查找 $CHROME_PATH、PATH 上的
                      chrome/msedge、Windows/macOS/Linux 常见安装路径
  --json              只向 stdout 输出一个 JSON 对象，供脚本/后续回归消费
  --help, -h          显示本帮助并退出 0

检查项（每项输出 {name, ok, detail}）:
  no-horizontal-overflow  documentElement.scrollWidth <= clientWidth
  design-tokens           --wf-ink/--wf-paper/--wf-veil-rgb/--wf-frame-block/--wf-motion-theme 实读非空
  hit-targets             chrome、文章行与独立动作链接命中区域 >= 44x44（不含段内链接）
  reader-frame            正文滚动区域不与 chrome 相交，跳过链接可将焦点交给正文
  menu-toggle             菜单开合、移动端模态与双向 Tab 循环、Escape 回焦
  theme-persistence       localStorage wf-theme=night 刷新后 data-theme=night；非法值回落 auto 且无脚本错误
  reduced-motion          prefers-reduced-motion: reduce 下 --wf-motion-theme=0ms 且场景静态（无持续 rAF）
  ui-load-fallback        UI 脚本下载失败时恢复可见、可操作的普通导航
  no-js                   禁用脚本后导航、正文和页脚可见且不互相遮挡

退出码: 0 全部通过；1 有检查失败或浏览器/页面不可用；2 参数错误。`;

// ---------- 通用工具 ----------

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tail(text, max = 1500) {
  return text.length > max ? `…${text.slice(-max)}` : text;
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function parseDimension(value, flag) {
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new Error(`${flag} 需要正整数，收到 ${JSON.stringify(value)}`);
  }
  return Number(value);
}

export function parseArgs(argv) {
  const options = {
    url: null,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    browserPath: null,
    json: false,
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
        case '--width':
          options.width = parseDimension(takeValue(), '--width');
          break;
        case '--height':
          options.height = parseDimension(takeValue(), '--height');
          break;
        case '--browser':
          options.browserPath = takeValue();
          break;
        case '--json':
          options.json = true;
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
        default:
          throw new Error(`未知参数 ${raw}`);
      }
    } catch (error) {
      errors.push(errorMessage(error));
    }
  }
  if (errors.length > 0) {
    return { ...options, error: errors.join('; ') };
  }
  if (!options.help) {
    if (!options.url) {
      return { ...options, error: '缺少 --url' };
    }
    try {
      const parsed = new URL(options.url);
      if (!['http:', 'https:', 'file:', 'data:'].includes(parsed.protocol)) {
        return { ...options, error: `--url 协议不受支持: ${parsed.protocol}` };
      }
    } catch {
      return { ...options, error: `--url 不是合法 URL: ${options.url}` };
    }
  }
  return options;
}

// ---------- 浏览器发现 ----------

function findOnPath(name) {
  const lookup = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(lookup, [name], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0 || !result.stdout) {
    return null;
  }
  const first = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)[0];
  return first && fs.existsSync(first) ? first : null;
}

function commonBrowserPaths() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      path.join(home, 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(home, 'AppData', 'Local', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ];
  }
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
  }
  return [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ];
}

export function findBrowser(explicitPath) {
  const tried = [];
  const notes = [];
  if (explicitPath) {
    const candidate = path.resolve(explicitPath);
    if (!fs.existsSync(candidate)) {
      throw new Error(`--browser 指定的浏览器不存在: ${candidate}`);
    }
    return { path: candidate, source: '--browser' };
  }
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv) {
    const candidate = path.resolve(fromEnv);
    tried.push(`$CHROME_PATH=${candidate}`);
    if (fs.existsSync(candidate)) {
      return { path: candidate, source: '$CHROME_PATH' };
    }
    notes.push('$CHROME_PATH 指向的文件不存在，继续查找');
  }
  for (const name of [
    'chrome',
    'chrome.exe',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'msedge',
    'msedge.exe',
  ]) {
    const found = findOnPath(name);
    if (found) {
      return { path: found, source: `PATH (${name})` };
    }
  }
  for (const candidate of commonBrowserPaths()) {
    tried.push(candidate);
    if (fs.existsSync(candidate)) {
      return { path: candidate, source: '常见安装路径' };
    }
  }
  const detail = [...tried, ...commonBrowserPaths()].join(', ');
  throw new Error(
    `未找到 Chrome/Edge。已尝试: ${detail}${notes.length ? `（${notes.join('；')}）` : ''}。可用 --browser 或 $CHROME_PATH 指定。`,
  );
}

// ---------- CDP 会话 ----------

export class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.closed = false;
  }

  async connect(timeoutMs = 10_000) {
    if (typeof WebSocket !== 'function') {
      throw new Error('当前 Node 没有全局 WebSocket，需要 Node >= 22');
    }
    const socket = new WebSocket(this.wsUrl);
    this.ws = socket;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`CDP WebSocket 连接超时: ${this.wsUrl}`));
      }, timeoutMs);
      const onOpen = () => {
        clearTimeout(timer);
        socket.removeEventListener('error', onError);
        resolve();
      };
      const onError = (event) => {
        clearTimeout(timer);
        socket.removeEventListener('open', onOpen);
        reject(new Error(`CDP WebSocket 连接失败: ${event && event.message ? event.message : this.wsUrl}`));
      };
      socket.addEventListener('open', onOpen, { once: true });
      socket.addEventListener('error', onError, { once: true });
    });
    socket.addEventListener('message', (event) => this.#dispatch(event.data));
    socket.addEventListener('close', () => {
      this.closed = true;
      for (const pending of this.pending.values()) {
        pending.reject(new Error('CDP 连接已关闭'));
      }
      this.pending.clear();
    });
  }

  #dispatch(data) {
    let message;
    try {
      message = JSON.parse(typeof data === 'string' ? data : Buffer.from(data).toString('utf8'));
    } catch {
      return;
    }
    if (message.id !== undefined) {
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        const extra = message.error.data ? ` — ${message.error.data}` : '';
        pending.reject(new Error(`${pending.method}: ${message.error.message}${extra}`));
      } else {
        pending.resolve(message.result || {});
      }
      return;
    }
    if (typeof message.method !== 'string') {
      return;
    }
    const listeners = this.listeners.get(message.method);
    if (!listeners) {
      return;
    }
    for (const listener of listeners.slice()) {
      if (listener.once) {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      }
      try {
        listener.fn(message.params || {});
      } catch {
        // 监听器错误不应中断 CDP 消息循环。
      }
    }
  }

  on(method, fn) {
    let listeners = this.listeners.get(method);
    if (!listeners) {
      listeners = [];
      this.listeners.set(method, listeners);
    }
    listeners.push({ fn, once: false });
  }

  once(method, timeoutMs = LOAD_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      let listeners = this.listeners.get(method);
      if (!listeners) {
        listeners = [];
        this.listeners.set(method, listeners);
      }
      const listener = {
        once: true,
        fn: (params) => {
          clearTimeout(timer);
          resolve(params);
        },
      };
      const timer = setTimeout(() => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
        reject(new Error(`等待 CDP 事件超时: ${method}`));
      }, timeoutMs);
      listeners.push(listener);
    });
  }

  send(method, params = {}, timeoutMs = 30_000) {
    if (this.closed || !this.ws) {
      return Promise.reject(new Error('CDP 连接未建立或已关闭'));
    }
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP 命令超时: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        method,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // 已关闭的连接无需处理。
      }
    }
    this.closed = true;
  }
}

// ---------- 浏览器进程 ----------

function readDevToolsActivePort(profileDir) {
  const file = path.join(profileDir, 'DevToolsActivePort');
  try {
    const lines = fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length >= 2 && /^\d+$/.test(lines[0]) && lines[1].startsWith('/devtools/')) {
      return { port: Number(lines[0]), wsPath: lines[1] };
    }
    if (lines.length >= 1 && /^\d+$/.test(lines[0])) {
      return { port: Number(lines[0]), wsPath: null };
    }
  } catch {
    // 文件尚未写出。
  }
  return null;
}

function parseDevToolsBanner(text) {
  const match = text.match(/DevTools listening on (ws:\/\/\S+)/);
  if (!match) {
    return null;
  }
  try {
    const url = new URL(match[1]);
    return { port: Number(url.port), wsPath: url.pathname };
  } catch {
    return null;
  }
}

function waitForChildExit(child, timeoutMs) {
  if (!child || child.exitCode !== null) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      child.removeListener('exit', onExit);
      resolve(false);
    }, timeoutMs);
    child.once('exit', onExit);
  });
}

async function waitForPageTarget(browser) {
  const deadline = Date.now() + LAUNCH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (browser.exit) {
      throw new Error(`浏览器在 DevTools 就绪前退出 (code=${browser.exit.code})${browser.stderr ? `\n${tail(browser.stderr)}` : ''}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${browser.port}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
        if (page) {
          return page;
        }
      }
    } catch {
      // HTTP 端点尚未就绪。
    }
    await sleep(150);
  }
  throw new Error(`DevTools HTTP 端点上没有页面目标（port=${browser.port}）`);
}

async function fetchBrowserWebSocketUrl(browser) {
  try {
    const response = await fetch(`http://127.0.0.1:${browser.port}/json/version`);
    if (response.ok) {
      const version = await response.json();
      if (version.webSocketDebuggerUrl) {
        return version.webSocketDebuggerUrl;
      }
    }
  } catch {
    // 忽略，退回 DevToolsActivePort 里的路径。
  }
  return browser.wsPath ? `ws://127.0.0.1:${browser.port}${browser.wsPath}` : null;
}

export async function launchBrowser({ browserPath, width, height }) {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wf-probe-profile-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    // Linux/CI 无 GPU 时允许软件 WebGL；Windows 保持系统软件后端（WARP），与迁移前证据口径一致。
    ...(process.platform === 'linux' || process.env.WF_SOFTWARE_WEBGL === '1' ? ['--enable-unsafe-swiftshader'] : []),
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    `--window-size=${width},${height}`,
    'about:blank',
  ];
  const child = spawn(browserPath, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  debugLog(`launch: child.pid=${child.pid} profile=${profileDir}`);
  const browser = {
    child,
    profileDir,
    stderr: '',
    stdout: '',
    exit: null,
    spawnError: null,
    port: null,
    wsPath: null,
    browserWs: null,
    pageWs: null,
    closed: false,
  };
  const append = (current, chunk) => (current + chunk.toString('utf8')).slice(-8000);
  child.stdout.on('data', (chunk) => {
    browser.stdout = append(browser.stdout, chunk);
  });
  child.stderr.on('data', (chunk) => {
    browser.stderr = append(browser.stderr, chunk);
  });
  child.on('error', (error) => {
    browser.spawnError = error;
  });
  child.on('exit', (code, signal) => {
    browser.exit = { code, signal };
    debugLog(`launch: child.pid=${child.pid} exited code=${code} signal=${signal}`);
  });

  const deadline = Date.now() + LAUNCH_TIMEOUT_MS;
  let devtools = null;
  while (Date.now() < deadline) {
    if (browser.spawnError) {
      forceKillSync(browser);
      throw new Error(`无法启动浏览器 ${browserPath}: ${browser.spawnError.message}`);
    }
    if (browser.exit) {
      throw new Error(`浏览器提前退出 (code=${browser.exit.code})${browser.stderr ? `\n${tail(browser.stderr)}` : ''}`);
    }
    devtools = readDevToolsActivePort(profileDir) || parseDevToolsBanner(browser.stderr + browser.stdout);
    if (devtools) {
      break;
    }
    await sleep(120);
  }
  if (!devtools) {
    forceKillSync(browser);
    throw new Error(
      `等待 DevTools 端口超时（${LAUNCH_TIMEOUT_MS}ms）${browser.stderr ? `\n浏览器输出:\n${tail(browser.stderr)}` : ''}`,
    );
  }
  browser.port = devtools.port;
  browser.wsPath = devtools.wsPath;
  const pageTarget = await waitForPageTarget(browser);
  browser.pageWs = pageTarget.webSocketDebuggerUrl;
  browser.browserWs = await fetchBrowserWebSocketUrl(browser);
  return browser;
}

function forceKillSync(browser) {
  if (!browser || !browser.child || browser.child.exitCode !== null) {
    return true;
  }
  debugLog(`forceKillSync: child.pid=${browser.child.pid} exitCode=${browser.child.exitCode}`);
  if (process.platform === 'win32') {
    const result = spawnSync('taskkill', ['/pid', String(browser.child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    debugLog(`forceKillSync: taskkill status=${result.status} error=${result.error ? result.error.message : 'none'}`);
    // 128 = 目标进程已不存在：Chrome 已退出，只是 Node 没收到 exit 事件，视为清理完成。
    return result.status === 0 || result.status === 128;
  }
  try {
    browser.child.kill('SIGKILL');
    return true;
  } catch {
    return false;
  }
}

export async function shutdownBrowser(browser) {
  if (!browser || browser.closed) {
    return;
  }
  browser.closed = true;
  const startedAt = Date.now();
  // 先走 CDP 的 Browser.close（优雅，且会一并结束渲染进程）；每步限时，避免清理阶段被挂住。
  if (browser.browserWs && browser.port) {
    const socket = new CdpSession(browser.browserWs);
    try {
      await socket.connect(1500);
      debugLog(`shutdown: browser ws connected (${browser.browserWs})`);
      try {
        await socket.send('Browser.close', {}, 1500);
        debugLog(`shutdown: Browser.close acked (+${Date.now() - startedAt}ms)`);
      } catch (error) {
        debugLog(`shutdown: Browser.close failed: ${error.message}`);
      }
    } catch {
      // 无法优雅关闭时直接杀进程树。
      debugLog(`shutdown: graceful close failed (+${Date.now() - startedAt}ms)`);
    } finally {
      socket.close();
    }
  }
  // 不等自带退出流程：Browser.close 后限时确认，超时就杀整棵进程树。
  // Chrome 的退出是异步的（逐个渲染进程收尾，高负载机器上可能 >5s），探针不应为此长时间挂住。
  let exited = await waitForChildExit(browser.child, 1200);
  debugLog(`shutdown: after Browser.close exited=${exited} exitCode=${browser.child && browser.child.exitCode}`);
  if (!exited) {
    let killed = forceKillSync(browser);
    if (!killed) {
      await sleep(300);
      killed = forceKillSync(browser);
    }
    debugLog(`shutdown: force kill done (killed=${killed}, +${Date.now() - startedAt}ms)`);
  }
  // 主动释放 stdio 管道并把子进程 unref：否则残留句柄会让 Node 事件循环不退出。
  for (const stream of [browser.child && browser.child.stdout, browser.child && browser.child.stderr]) {
    try {
      if (stream) {
        stream.destroy();
      }
    } catch {
      // 已关闭。
    }
  }
  if (browser.child) {
    try {
      browser.child.unref();
    } catch {
      // 已退出。
    }
  }
  // 临时 profile：浏览器退出后文件锁释放有延迟，最多重试 3 次；仍被锁就留给系统临时目录（不阻塞探针）。
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      fs.rmSync(browser.profileDir, { recursive: true, force: true, maxRetries: 0 });
      break;
    } catch {
      await sleep(attempt === 0 ? 200 : 500);
    }
  }
  debugLog(`shutdown: done (+${Date.now() - startedAt}ms)`);
}

// ---------- 页面辅助 ----------

export async function evaluateInPage(cdp, expression, { timeoutMs = 30_000 } = {}) {
  const response = await cdp.send(
    'Runtime.evaluate',
    {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    },
    timeoutMs,
  );
  if (response.exceptionDetails) {
    const description = response.exceptionDetails.exception
      ? response.exceptionDetails.exception.description || response.exceptionDetails.exception.value
      : response.exceptionDetails.text;
    throw new Error(`页面脚本异常: ${description || 'unknown'}`);
  }
  return response.result ? response.result.value : undefined;
}

export async function waitUntilReady(cdp, { settleMs = SETTLE_MS, state = null } = {}) {
  const deadline = Date.now() + LOAD_TIMEOUT_MS;
  let readyState = 'unknown';
  let consecutiveFailures = 0;
  while (Date.now() < deadline) {
    try {
      readyState = await evaluateInPage(cdp, 'document.readyState', { timeoutMs: 5000 });
      consecutiveFailures = 0;
      if (readyState === 'complete') {
        break;
      }
    } catch {
      consecutiveFailures += 1;
      // 脚本执行被 CDP 禁用时 evaluate 可能不可用：退化为固定等待，由调用方用 DOM 域兜底。
      if (consecutiveFailures >= 3) {
        readyState = 'unknown';
        break;
      }
    }
    await sleep(120);
  }
  try {
    await evaluateInPage(cdp, 'document.fonts ? document.fonts.ready.then(() => true) : true', { timeoutMs: 10_000 });
  } catch {
    // 字体 API 不可用时继续。
  }
  if (settleMs > 0) {
    await sleep(settleMs);
  }
  return readyState;
}

export function attachPageState(cdp) {
  const state = { consoleErrors: [], lastDocumentResponse: null };
  cdp.on('Runtime.consoleAPICalled', (params) => {
    if (params.type !== 'error') {
      return;
    }
    const args = (params.args || []).map((arg) => (arg.value !== undefined ? String(arg.value) : arg.description || arg.type));
    state.consoleErrors.push(args.join(' ').slice(0, 400));
  });
  cdp.on('Runtime.exceptionThrown', (params) => {
    const details = params.exceptionDetails || {};
    const description = details.exception ? details.exception.description : details.text;
    state.consoleErrors.push(String(description || 'uncaught exception').slice(0, 400));
  });
  cdp.on('Network.responseReceived', (params) => {
    if (params.type === 'Document') {
      state.lastDocumentResponse = {
        status: params.response.status,
        url: params.response.url,
        fromDiskCache: Boolean(params.response.fromDiskCache),
      };
    }
  });
  // 页面弹出 alert/confirm 会阻塞导航；一律 dismiss。
  cdp.on('Page.javascriptDialogOpening', () => {
    cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
  });
  return state;
}

export async function navigateAndWait(cdp, url, { settleMs = SETTLE_MS, state = null } = {}) {
  if (state) {
    state.lastDocumentResponse = null;
  }
  // loadEventFired 偶发缺失时退回 readyState 轮询，不把「事件没抓到」误报成「页面没加载」。
  const loaded = cdp.once('Page.loadEventFired', LOAD_TIMEOUT_MS).then(
    () => 'event',
    (error) => {
      debugLog(`navigate: loadEventFired 超时，改用 readyState 判定（${error.message}）`);
      return 'timeout';
    },
  );
  const result = await cdp.send('Page.navigate', { url }, LOAD_TIMEOUT_MS);
  if (result.errorText) {
    throw new Error(`导航失败（${url}）: ${result.errorText}`);
  }
  await loaded;
  const readyState = await waitUntilReady(cdp, { settleMs, state });
  if (readyState !== 'complete') {
    const response = state && state.lastDocumentResponse ? `，最后文档响应 HTTP ${state.lastDocumentResponse.status}` : '';
    throw new Error(`页面在 ${LOAD_TIMEOUT_MS}ms 内没有进入 readyState=complete（${url}）${response}`);
  }
  if (state && state.lastDocumentResponse && state.lastDocumentResponse.status >= 400) {
    throw new Error(`页面返回 HTTP ${state.lastDocumentResponse.status}（${url}）——确认地址与本地静态服务器`);
  }
}

export async function reloadAndWait(cdp, { settleMs = SETTLE_MS, state = null } = {}) {
  if (state) {
    state.lastDocumentResponse = null;
  }
  const loaded = cdp.once('Page.loadEventFired', LOAD_TIMEOUT_MS).then(
    () => 'event',
    (error) => {
      debugLog(`reload: loadEventFired 超时，改用 readyState 判定（${error.message}）`);
      return 'timeout';
    },
  );
  await cdp.send('Page.reload', {}, LOAD_TIMEOUT_MS);
  await loaded;
  const readyState = await waitUntilReady(cdp, { settleMs, state });
  if (readyState !== 'complete') {
    throw new Error(`刷新后 ${LOAD_TIMEOUT_MS}ms 内没有进入 readyState=complete`);
  }
}

// ---------- 单项检查 ----------

const TRIGGER_SELECTOR = '.wf-menu-trigger, [data-wf-menu-trigger]';

const COLLECT_INTERACTIVES = `(() => {
  const isVisible = (el) => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || el.closest('[inert]')) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const labelOf = (el) => {
    const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g, ' ').trim();
    return text.slice(0, 32);
  };
  const seen = new Set();
  const containers = Array.from(new Set(document.querySelectorAll('header, footer, nav, .wf-header, .wf-footer, .wf-menu, .wf-index__list, .wf-home-posts__more, .wf-404__home')));
  const items = [];
  for (const container of containers) {
    for (const el of container.querySelectorAll('a[href], button, [role="button"]')) {
      if (seen.has(el)) {
        continue;
      }
      seen.add(el);
      if (!isVisible(el)) {
        continue;
      }
      const rect = el.getBoundingClientRect();
      const className = typeof el.className === 'string' ? el.className : '';
      items.push({
        tag: el.tagName.toLowerCase(),
        cls: className.split(/\\s+/).filter(Boolean).slice(0, 2).join('.'),
        label: labelOf(el),
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      });
    }
  }
  return items;
})()`;

async function findMenuTrigger(cdp) {
  return evaluateInPage(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(TRIGGER_SELECTOR)}) || document.querySelector('button[aria-expanded][aria-controls]');
      if (!el) {
        return { found: false };
      }
      el.setAttribute('data-wf-probe-trigger', '');
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        found: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
        expanded: el.getAttribute('aria-expanded'),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    })()`,
  );
}

async function readMenuState(cdp) {
  return evaluateInPage(
    cdp,
    `(() => {
      const el = document.querySelector('[data-wf-probe-trigger]');
      if (!el) {
        return { found: false };
      }
      const active = document.activeElement;
      const className = active && typeof active.className === 'string' ? active.className.trim().split(/\\s+/)[0] : '';
      return {
        found: true,
        expanded: el.getAttribute('aria-expanded'),
        focusOnTrigger: active === el,
        activeElement: active ? active.tagName.toLowerCase() + (className ? '.' + className : '') : null,
      };
    })()`,
  );
}

async function clickTaggedTrigger(cdp) {
  return evaluateInPage(
    cdp,
    `(() => {
      const el = document.querySelector('[data-wf-probe-trigger]');
      if (!el) {
        return false;
      }
      el.click();
      return true;
    })()`,
  );
}

async function mouseClick(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
}

async function pressEscape(cdp) {
  const key = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
}

async function checkOverflow(cdp) {
  const metrics = await evaluateInPage(
    cdp,
    `(() => {
      const root = document.documentElement;
      let widest = { right: root.scrollWidth, label: null };
      for (const el of document.body ? document.body.querySelectorAll('*') : []) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          continue;
        }
        if (rect.right > widest.right) {
          const className = typeof el.className === 'string' ? el.className.trim().split(/\\s+/)[0] : '';
          widest = { right: Math.round(rect.right * 10) / 10, label: el.tagName.toLowerCase() + (className ? '.' + className : '') };
        }
      }
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        innerWidth: window.innerWidth,
        bodyScrollWidth: document.body ? document.body.scrollWidth : null,
        mainScrollWidth: document.querySelector('main')?.scrollWidth,
        mainClientWidth: document.querySelector('main')?.clientWidth,
        widest,
      };
    })()`,
  );
  const ok = metrics.scrollWidth <= metrics.clientWidth && metrics.mainScrollWidth <= metrics.mainClientWidth;
  let detail = `scrollWidth=${metrics.scrollWidth} <= clientWidth=${metrics.clientWidth} (main=${metrics.mainScrollWidth}/${metrics.mainClientWidth}, innerWidth=${metrics.innerWidth}, body.scrollWidth=${metrics.bodyScrollWidth})`;
  if (!ok && metrics.widest.label) {
    detail += `；最宽元素右缘 ${metrics.widest.right}px: ${metrics.widest.label}`;
  }
  return { name: 'no-horizontal-overflow', ok, detail };
}

async function checkTokens(cdp) {
  const tokens = await evaluateInPage(
    cdp,
    `(() => {
      const style = getComputedStyle(document.documentElement);
      const values = {};
      for (const name of ${JSON.stringify(TOKEN_NAMES)}) {
        values[name] = style.getPropertyValue(name).trim();
      }
      return values;
    })()`,
  );
  const missing = TOKEN_NAMES.filter((name) => !tokens[name]);
  const ok = missing.length === 0;
  const values = TOKEN_NAMES.map((name) => `${name}=${tokens[name] || '<empty>'}`).join('; ');
  return {
    name: 'design-tokens',
    ok,
    detail: missing.length > 0 ? `缺失或为空: ${missing.join(', ')}；${values}` : values,
  };
}

async function checkHitTargets(cdp) {
  const closedItems = await evaluateInPage(cdp, COLLECT_INTERACTIVES);
  const trigger = await findMenuTrigger(cdp);
  let openedByCheck = false;
  if (trigger.found && trigger.visible && trigger.expanded !== 'true') {
    openedByCheck = (await clickTaggedTrigger(cdp)) === true;
    if (openedByCheck) {
      await sleep(400);
    }
  }
  const openItems = await evaluateInPage(cdp, COLLECT_INTERACTIVES);
  const items = Array.from(new Map([...closedItems, ...openItems].map((item) => [`${item.cls}:${item.label}`, item])).values());
  if (openedByCheck) {
    await pressEscape(cdp);
    await sleep(300);
  }
  const offenders = items.filter((item) => item.width < HIT_TARGET_PX || item.height < HIT_TARGET_PX);
  const smallest = items.length > 0 ? Math.min(...items.map((item) => Math.min(item.width, item.height))) : null;
  let detail;
  if (items.length === 0) {
    detail = '未找到可见的 chrome 交互控件（header/footer/nav 内没有可见的 a[href]/button）';
  } else if (offenders.length === 0) {
    detail = `${items.length} 个可见控件全部 >= ${HIT_TARGET_PX}x${HIT_TARGET_PX}（最小边 ${smallest}px）`;
  } else {
    detail = `${items.length} 个可见控件中有 ${offenders.length} 个小于 ${HIT_TARGET_PX}px: ` +
      offenders
        .map((item) => `${item.tag}${item.cls ? '.' + item.cls : ''}${item.label ? ` "${item.label}"` : ''} ${item.width}x${item.height}`)
        .join('; ');
  }
  return { name: 'hit-targets', ok: items.length > 0 && offenders.length === 0, detail };
}

async function checkReaderFrame(cdp) {
  const result = await evaluateInPage(cdp, `(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('header').getBoundingClientRect();
    const footer = document.querySelector('footer').getBoundingClientRect();
    const rect = main.getBoundingClientRect();
    const skip = document.querySelector('a[href="#main"]');
    const first = document.querySelector('a[href], button, [tabindex="0"]');
    skip.focus();
    skip.click();
    return {
      separated: rect.top >= header.bottom - 1 && rect.bottom <= footer.top + 1,
      scrollable: getComputedStyle(main).overflowY === 'auto',
      skipFirst: first === skip,
      skipFocus: document.activeElement === main,
      top: rect.top, bottom: rect.bottom, headerBottom: header.bottom, footerTop: footer.top,
    };
  })()`);
  return {
    name: 'reader-frame',
    ok: result.separated && result.scrollable && result.skipFirst && result.skipFocus,
    detail: `main=${result.top}..${result.bottom}, chrome=${result.headerBottom}/${result.footerTop}; 原生滚动=${result.scrollable}; 首个焦点为 skip=${result.skipFirst}, skip 激活后焦点在 main=${result.skipFocus}`,
  };
}

async function checkMenuToggle(cdp) {
  const trigger = await findMenuTrigger(cdp);
  if (!trigger.found || !trigger.visible) {
    return {
      name: 'menu-toggle',
      ok: true,
      detail: 'SKIP: 当前视口没有可见的菜单触发按钮（例如无 JS 或桌面布局不提供折叠菜单）',
    };
  }
  // 确保从关闭状态开始。
  if (trigger.expanded === 'true') {
    await pressEscape(cdp);
    await sleep(300);
  }
  const x = trigger.rect.x + trigger.rect.width / 2;
  const y = trigger.rect.y + trigger.rect.height / 2;
  await mouseClick(cdp, x, y);
  await sleep(400);
  let afterClick = await readMenuState(cdp);
  // 真实指针点击必须生效：如果被其它层遮住，这是主题缺陷（用户点不开菜单），不能靠 DOM click 掩盖。
  const pointerWorked = afterClick.expanded === 'true';
  let pointerDetail = `真实鼠标点击 -> aria-expanded=${afterClick.expanded ?? '<missing>'}`;
  if (!pointerWorked) {
    const hit = await evaluateInPage(
      cdp,
      `(() => {
        const el = document.querySelector('[data-wf-probe-trigger]');
        if (!el) {
          return { hit: '<trigger missing>' };
        }
        const rect = el.getBoundingClientRect();
        const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        const describe = (node) => {
          if (!node) {
            return '<none>';
          }
          const className = typeof node.className === 'string' ? node.className.trim().split(/\\s+/)[0] : '';
          return node.tagName.toLowerCase() + (className ? '.' + className : '');
        };
        return { hit: describe(top), reachable: top === el || el.contains(top) };
      })()`,
    );
    pointerDetail += `（点击位置 elementFromPoint=${hit.hit}，触发按钮${hit.reachable ? '可达' : '被遮挡'}）`;
    // 仍然走一次 DOM click，确认点击处理器本身与 Escape/焦点逻辑是否正常，便于区分「实现缺失」与「被遮挡」。
    if (await clickTaggedTrigger(cdp)) {
      await sleep(400);
      afterClick = await readMenuState(cdp);
      pointerDetail += `；DOM click -> aria-expanded=${afterClick.expanded ?? '<missing>'}`;
    }
  }
  const focus = await evaluateInPage(cdp, `(() => {
    const panel = document.querySelector('[data-wf-menu-panel]');
    const mobile = matchMedia('(max-width: 800px)').matches;
    return {
      mobile,
      inside: panel.contains(document.activeElement),
      modal: panel.getAttribute('role') === 'dialog' && panel.getAttribute('aria-modal') === 'true',
      inert: document.querySelector('main').inert && document.querySelector('footer').inert,
    };
  })()`);
  let wrapped = true;
  if (focus.mobile) {
    for (const shift of [false, true]) {
      await evaluateInPage(cdp, `(() => {
        const items = document.querySelector('[data-wf-menu-panel]').querySelectorAll('a[href], button');
        items[${shift ? '0' : 'items.length - 1'}].focus();
        return true;
      })()`);
      const key = { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: shift ? 8 : 0 };
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
      wrapped = wrapped && await evaluateInPage(cdp, `(() => {
        const items = document.querySelector('[data-wf-menu-panel]').querySelectorAll('a[href], button');
        return document.activeElement === items[${shift ? 'items.length - 1' : '0'}];
      })()`);
    }
  }
  await pressEscape(cdp);
  await sleep(350);
  const afterEscape = await readMenuState(cdp);
  const released = await evaluateInPage(cdp, '!document.querySelector("main").inert && !document.querySelector("footer").inert');
  const ok = pointerWorked && afterClick.expanded === 'true' && focus.inside && (!focus.mobile || (focus.modal && focus.inert && wrapped)) && released && afterEscape.expanded === 'false' && afterEscape.focusOnTrigger;
  const detail =
    `${pointerDetail}` +
    `; 面板内焦点=${focus.inside}, mobile=${focus.mobile}, modal=${focus.modal}, inert=${focus.inert}, 双向 Tab=${wrapped}, 解除 inert=${released}` +
    `; Escape -> aria-expanded=${afterEscape.expanded ?? '<missing>'}, focus=${afterEscape.focusOnTrigger ? 'trigger' : afterEscape.activeElement || '<none>'}`;
  return { name: 'menu-toggle', ok, detail };
}

async function checkThemePersistence(cdp, state) {
  // 重置为 auto 后再写入，避免上一次运行残留。
  await evaluateInPage(cdp, `(() => { try { localStorage.removeItem('wf-theme'); } catch (error) {} return true; })()`);

  const readTheme = () =>
    evaluateInPage(
      cdp,
      `(() => {
        const root = document.documentElement;
        let stored = null;
        try {
          stored = localStorage.getItem('wf-theme');
        } catch (error) {
          stored = '<localStorage unavailable>';
        }
        return {
          dataset: root.getAttribute('data-theme'),
          stored,
          paper: getComputedStyle(root).getPropertyValue('--wf-paper').trim(),
          bootClass: root.classList.contains('is-boot'),
        };
      })()`,
    );

  await evaluateInPage(cdp, `(() => { localStorage.setItem('wf-theme', 'night'); return true; })()`);
  await reloadAndWait(cdp, { state });
  const night = await readTheme();

  const errorsBeforeInvalid = state.consoleErrors.length;
  await evaluateInPage(cdp, `(() => { localStorage.setItem('wf-theme', 'zzz'); return true; })()`);
  await reloadAndWait(cdp, { state });
  const invalid = await readTheme();
  const invalidErrors = state.consoleErrors.slice(errorsBeforeInvalid);

  await evaluateInPage(cdp, `(() => { try { localStorage.removeItem('wf-theme'); } catch (error) {} return true; })()`);

  const nightOk = night.dataset === 'night' && night.stored === 'night';
  const invalidOk = (invalid.dataset === null || invalid.dataset === 'auto') && invalidErrors.length === 0;
  const detail =
    `night 刷新后 data-theme=${night.dataset ?? '<absent>'} (--wf-paper=${night.paper}, localStorage=${night.stored ?? '<absent>'})` +
    `; zzz 刷新后 data-theme=${invalid.dataset ?? '<absent>'} (脚本错误 ${invalidErrors.length} 条` +
    `${invalidErrors.length > 0 ? ': ' + invalidErrors.slice(0, 3).join(' | ') : ''})`;
  return { name: 'theme-persistence', ok: nightOk && invalidOk, detail };
}

async function checkReducedMotion(cdp, state, url) {
  await evaluateInPage(cdp, `(() => { try { localStorage.removeItem('wf-theme'); } catch (error) {} return true; })()`);
  const { identifier } = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const raf = window.requestAnimationFrame.bind(window);
      window.__wfProbe = { rafCalls: 0 };
      window.requestAnimationFrame = (callback) => {
        window.__wfProbe.rafCalls += 1;
        return raf(callback);
      };
    })();`,
  });
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  try {
    await navigateAndWait(cdp, url, { state });
    await sleep(800);
    const token = await evaluateInPage(
      cdp,
      `getComputedStyle(document.documentElement).getPropertyValue('--wf-motion-theme').trim()`,
    );
    const snapshot = () =>
      evaluateInPage(
        cdp,
        `(() => {
          const hashCanvas = (canvas) => {
            const data = canvas.toDataURL();
            let hash = 2166136261;
            for (let i = 0; i < data.length; i += 1) {
              hash ^= data.charCodeAt(i);
              hash = Math.imul(hash, 16777619);
            }
            return { label: canvas.getAttribute('data-wf-canvas') || '', width: canvas.width, height: canvas.height, length: data.length, hash: (hash >>> 0).toString(16) };
          };
          return {
            rafCalls: window.__wfProbe ? window.__wfProbe.rafCalls : -1,
            mediaMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            canvases: Array.from(document.querySelectorAll('canvas')).map(hashCanvas),
          };
        })()`,
      );
    const first = await snapshot();
    await sleep(1200);
    const second = await snapshot();
    const rafDelta = second.rafCalls - first.rafCalls;
    const canvasesStable =
      first.canvases.length === second.canvases.length &&
      first.canvases.every(
        (canvas, index) =>
          canvas.hash === second.canvases[index].hash &&
          canvas.length === second.canvases[index].length &&
          canvas.width === second.canvases[index].width &&
          canvas.height === second.canvases[index].height,
      );
    const ok = token === '0ms' && first.mediaMatches && rafDelta <= 1 && canvasesStable;
    const detail =
      `--wf-motion-theme=${token || '<empty>'}; prefers-reduced-motion=${first.mediaMatches}` +
      `; settle 后 1200ms 内 rAF=${rafDelta} 次; canvas=${first.canvases.length} 张${canvasesStable ? '（快照一致）' : '（快照变化）'}`;
    return { name: 'reduced-motion', ok, detail };
  } finally {
    await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier }).catch(() => {});
    await cdp.send('Emulation.setEmulatedMedia', { media: '', features: [] }).catch(() => {});
  }
}

async function checkUiLoadFallback(cdp, state, url) {
  let blocked = false;
  cdp.on('Network.loadingFailed', (event) => {
    if (event.type === 'Script' && event.blockedReason === 'inspector') {
      blocked = true;
    }
  });
  const uiUrl = await evaluateInPage(cdp, 'Array.from(document.scripts).find(script => script.src.includes("/js/ui.min.")).src');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.setBlockedURLs', { urls: [uiUrl] });
  try {
    await navigateAndWait(cdp, url, { state });
    const result = await evaluateInPage(cdp, `(() => {
      const panel = document.querySelector('[data-wf-menu-panel]');
      const trigger = document.querySelector('[data-wf-menu-trigger]');
      const links = Array.from(panel.querySelectorAll('a[href]'));
      return {
        enhanced: document.documentElement.classList.contains('js'),
        triggerHidden: getComputedStyle(trigger).display === 'none',
        linksUsable: !panel.inert && links.length > 0 && links.every(link => {
          const style = getComputedStyle(link);
          const rect = link.getBoundingClientRect();
          return style.visibility === 'visible' && rect.width >= 44 && rect.height >= 44;
        }),
      };
    })()`);
    return {
      name: 'ui-load-fallback',
      ok: blocked && !result.enhanced && result.triggerHidden && result.linksUsable,
      detail: `UI 下载已阻断=${blocked}; html.js=${result.enhanced}; 失效按钮隐藏=${result.triggerHidden}; 普通导航可操作=${result.linksUsable}`,
    };
  } finally {
    await cdp.send('Network.setBlockedURLs', { urls: [] });
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  }
}

async function checkNoJs(cdp, state, url) {
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  try {
    await navigateAndWait(cdp, url, { state, settleMs: 400 });
    const probe = await evaluateInPage(
      cdp,
      `(() => {
        const isVisible = (el) => {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };
        const links = Array.from(document.querySelectorAll('header a[href], footer a[href], nav a[href]'));
        const visibleLinks = links.filter(isVisible).length;
        const bodyText = document.body ? document.body.innerText.replace(/\\s+/g, ' ').trim() : '';
        const panel = document.querySelector('.wf-menu-panel, [data-wf-menu-panel]');
        const main = document.querySelector('main').getBoundingClientRect();
        const header = document.querySelector('header').getBoundingClientRect();
        const footer = document.querySelector('footer').getBoundingClientRect();
        return {
          jsClass: document.documentElement.classList.contains('js'),
          bodyTextLength: bodyText.length,
          bodyTextSample: bodyText.slice(0, 60),
          links: links.length,
          visibleLinks,
          panelVisible: panel ? isVisible(panel) : null,
          separated: main.top >= header.bottom - 1 && main.bottom <= footer.top + 1,
        };
      })()`,
    );
    const ok = probe.jsClass === false && probe.bodyTextLength >= 20 && probe.visibleLinks >= 1 && probe.separated;
    const detail =
      `html.js=${probe.jsClass}（应为 false）; 正文 ${probe.bodyTextLength} 字符` +
      `${probe.bodyTextSample ? ` ("${probe.bodyTextSample}…")` : ''}` +
      `; 导航链接 ${probe.links} 个，可见 ${probe.visibleLinks} 个` +
      `; 菜单面板可见=${probe.panelVisible === null ? '<none>' : probe.panelVisible}; 导航/正文/页脚无重叠=${probe.separated}`;
    return { name: 'no-js', ok, detail };
  } finally {
    await cdp.send('Emulation.setScriptExecutionDisabled', { value: false }).catch(() => {});
  }
}

// ---------- 主流程 ----------

let activeBrowser = null;

function browserSummary(browser, userAgent) {
  return {
    path: browser && browser.path ? browser.path : null,
    source: browser && browser.source ? browser.source : null,
    userAgent: userAgent || null,
  };
}

function summarize(checks) {
  const passed = checks.filter((check) => check.ok).length;
  return { passed, failed: checks.length - passed, total: checks.length };
}

export async function runProbe(options) {
  const checks = [];
  const startedAt = Date.now();
  let browser = null;
  let cdp = null;
  let userAgent = null;
  const viewport = { width: options.width, height: options.height };
  const out = (text) => process.stdout.write(text);

  const report = (check) => {
    checks.push({ name: check.name, ok: Boolean(check.ok), detail: check.detail });
    if (!options.json) {
      out(`${check.ok ? '[PASS]' : '[FAIL]'} ${check.name}: ${check.detail}\n`);
    }
  };
  const runCheck = async (name, fn) => {
    try {
      report(await fn());
    } catch (error) {
      report({ name, ok: false, detail: `检查执行出错: ${errorMessage(error)}` });
    }
  };

  try {
    const discovered = findBrowser(options.browserPath);
    if (!options.json) {
      out(`waitforit probe\n  url      ${options.url}\n  viewport ${viewport.width}x${viewport.height} (dpr=1)\n  browser  ${discovered.path}\n  来源     ${discovered.source}\n`);
    }
    browser = await launchBrowser({ browserPath: discovered.path, width: options.width, height: options.height });
    browser.path = discovered.path;
    browser.source = discovered.source;
    activeBrowser = browser;

    cdp = new CdpSession(browser.pageWs);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    const state = attachPageState(cdp);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });
    await navigateAndWait(cdp, options.url, { state });
    userAgent = await evaluateInPage(cdp, 'navigator.userAgent');
    if (!options.json) {
      out(`  userAgent ${userAgent}\n\n`);
    }

    // 顺序：静态断言 → 菜单交互 → 主题持久化 → 动效降级 → 无 JS。
    await runCheck('no-horizontal-overflow', () => checkOverflow(cdp));
    await runCheck('design-tokens', () => checkTokens(cdp));
    await runCheck('reader-frame', () => checkReaderFrame(cdp));
    await runCheck('menu-toggle', () => checkMenuToggle(cdp));
    await runCheck('hit-targets', () => checkHitTargets(cdp));
    await runCheck('theme-persistence', () => checkThemePersistence(cdp, state));
    await runCheck('reduced-motion', () => checkReducedMotion(cdp, state, options.url));
    await runCheck('ui-load-fallback', () => checkUiLoadFallback(cdp, state, options.url));
    await runCheck('no-js', () => checkNoJs(cdp, state, options.url));

    const summary = summarize(checks);
    const result = {
      ok: summary.failed === 0,
      url: options.url,
      viewport,
      browser: browserSummary(browser, userAgent),
      checks,
      summary,
      durationMs: Date.now() - startedAt,
    };
    if (options.json) {
      out(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      const failed = checks.filter((check) => !check.ok);
      out(`\nsummary: ${summary.passed} passed, ${summary.failed} failed (${result.durationMs}ms)\n`);
      if (failed.length > 0) {
        out(`失败项: ${failed.map((check) => check.name).join(', ')}\n`);
      }
    }
    return result.ok ? 0 : 1;
  } catch (error) {
    const summary = summarize(checks);
    const result = {
      ok: false,
      url: options.url,
      viewport,
      browser: browserSummary(browser, userAgent),
      error: errorMessage(error),
      checks,
      summary,
      durationMs: Date.now() - startedAt,
    };
    if (options.json) {
      out(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      process.stderr.write(`\nprobe 失败: ${errorMessage(error)}\n`);
    }
    return 1;
  } finally {
    debugLog('runProbe: cleanup begin');
    if (cdp) {
      cdp.close();
    }
    await shutdownBrowser(browser);
    activeBrowser = null;
    debugLog('runProbe: cleanup done');
  }
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (parsed.error) {
    process.stderr.write(`参数错误: ${parsed.error}\n\n${USAGE}\n`);
    return 2;
  }
  return runProbe(parsed);
}

// 进程被中断时也要关掉浏览器，避免残留 headless Chrome。
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    forceKillSync(activeBrowser);
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  // stdout 写完后若仍有 WebSocket/子进程句柄残留，3s 后强制退出，避免探针把 CI/终端挂住。
  const armExitGuard = (code) => {
    const guard = setTimeout(() => process.exit(code), 3000);
    guard.unref();
  };
  main()
    .then((code) => {
      process.exitCode = code;
      armExitGuard(code);
    })
    .catch((error) => {
      process.stderr.write(`probe 异常: ${error && error.stack ? error.stack : error}\n`);
      process.exitCode = 1;
      armExitGuard(1);
    });
}
