#!/usr/bin/env node
// 资产与设计契约门禁。
// 5 项检查（P2 接入 CI）：1 令牌字面值 2 字体白名单 3 组件形态 4 装饰 SVG 白名单 5 sidecar 与 frontmatter 一致。
// 用法: node scripts/check-assets.mjs [--verbose]；任何一项失败退出 1，失败项给文件:行。
// 设计约束：无第三方依赖（Node ≥ 22，仓库基线 Node 24）；只读不写。
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, basename, extname } from 'node:path';

const ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose');
const failures = [];

function fail(check, message) {
  failures.push({ check, message });
}

function report(check, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${check}] ${detail}`);
}

// 递归收集文件；跳过符号链接、node_modules、.git 与 Hugo 构建产物（public/、resources/），保持顺序稳定。
// 构建产物不参与门禁：先把 exampleSite 构建过再跑门禁时，public/ 里的指纹字体/图片会被误判（P2 实测）。
const BUILD_OUTPUT_DIRS = new Set(['node_modules', '.git', 'public', 'resources']);

function walk(dir, filter) {
  if (!existsSync(dir)) {
    return [];
  }
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      continue;
    }
    if (entry.isDirectory()) {
      if (BUILD_OUTPUT_DIRS.has(entry.name)) {
        continue;
      }
      out.push(...walk(full, filter));
    } else if (entry.isFile() && filter(full)) {
      out.push(full);
    }
  }
  return out;
}

function readText(file) {
  return readFileSync(file, 'utf8');
}

function rel(file) {
  return relative(ROOT, file).replaceAll('\\', '/');
}

// 返回 text 中每个匹配的行号（1-based），用于报文件:行。
function matchLines(text, pattern) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    pattern.lastIndex = 0;
    if (pattern.test(line)) {
      hits.push(i + 1);
    }
  });
  return hits;
}

// 逐行执行正则并返回 [行号, 行内容]；用于收集具体命中。
function grep(text, pattern) {
  return text
    .split(/\r?\n/)
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });
}

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\blab\(|\blch\(/;
// 令牌组合写法 rgb(var(--wf-x) / var(--wf-a)) 不是字面色值：探测前先折叠成 var(...)。
const TOKEN_COLOR_CALL = /\b(?:rgba?|hsla?|oklch|lab|lch)\(\s*var\(/g;
const NAMED_COLOR_VALUE = /:\s*(white|black)\b/;
// CSS 中允许的非令牌值：透明、继承、无背景等。
const ALLOWED_VALUE = /:(?:\s*)(transparent|currentcolor|inherit|none|0|0px)\b/i;

// 从 HTML 中抽出 <style> 块与 style="..." 属性，返回 [{ line, css }]。
function extractCssFromHtml(text) {
  const chunks = [];
  const lines = text.split(/\r?\n/);
  const styleBlock = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleBlock.exec(text)) !== null) {
    const before = text.slice(0, match.index);
    const line = before.split(/\r?\n/).length;
    chunks.push({ line, css: match[1] });
  }
  for (let i = 0; i < lines.length; i += 1) {
    const attr = /style="([^"]*)"/g;
    let m;
    while ((m = attr.exec(lines[i])) !== null) {
      chunks.push({ line: i + 1, css: m[1] });
    }
  }
  return chunks;
}

// 从令牌文件里读全部 --wf-* 颜色值，作为资产 SVG 允许的字面值来源。
function tokenColorValues() {
  const file = join(ROOT, 'assets/css/tokens.css');
  if (!existsSync(file)) {
    return new Set(['#353431', '#faf9f6', '#ffffff', '#1c1b1a', '#2e2d2b']);
  }
  const values = new Set();
  const re = /(--wf-[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(readText(file))) !== null) {
    const value = m[2].trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^rgba?\(/.test(value)) {
      values.add(value.toLowerCase());
    }
  }
  return values;
}

// ---------- 1. 令牌门禁：模板/样式不得出现字面色值 ----------
function checkTokenLiterals() {
  const styles = [
    ...walk(join(ROOT, 'assets/css'), (f) => extname(f) === '.css' && basename(f) !== 'tokens.css'),
    ...walk(join(ROOT, 'layouts'), (f) => ['.html', '.css'].includes(extname(f))),
    ...walk(join(ROOT, 'exampleSite'), (f) => ['.html', '.css'].includes(extname(f))),
  ];
  const htmlSources = [
    ...walk(join(ROOT, 'layouts'), (f) => extname(f) === '.html'),
    ...walk(join(ROOT, 'exampleSite'), (f) => extname(f) === '.html'),
    ...walk(join(ROOT, 'docs/design/spikes'), (f) => extname(f) === '.html'),
  ];

  const scan = (file, css, lineOffset) => {
    css.split(/\r?\n/).forEach((line, i) => {
      const probe = line.replace(TOKEN_COLOR_CALL, 'var(');
      if (ALLOWED_VALUE.test(probe)) {
        return;
      }
      if (COLOR_LITERAL.test(probe) || NAMED_COLOR_VALUE.test(probe)) {
        fail('token-literals', `${file}:${lineOffset + i + 1} 出现字面色值（应使用 var(--wf-*)，白名单仅 transparent/currentColor/inherit/none/0）: ${line.trim()}`);
      }
    });
  };

  for (const file of styles) {
    scan(rel(file), readText(file), 0);
  }
  for (const file of htmlSources) {
    for (const { line, css } of extractCssFromHtml(readText(file))) {
      scan(rel(file), css, line - 1);
    }
  }
  report('token-literals', true, `扫描 ${styles.length} 个 CSS 文件与 ${htmlSources.length} 个 HTML 的样式块`);
}

// ---------- 2. 字体门禁：仓库内字体文件 ⊆ Newsreader / Commit Mono ----------
const ALLOWED_FONTS = new Set([
  'newsreader-latin-var.woff2',
  'newsreader-italic-latin-var.woff2',
  'commit-mono-400-latin.woff2',
  'commit-mono-700-latin.woff2',
]);
const BUILD_FONTS = new Map([
  ['assets/fonts/og/newsreader-400.ttf', 'assets/fonts/og/newsreader-OFL.txt'],
  ['assets/fonts/og/noto-serif-sc-400.ttf', 'assets/fonts/og/noto-serif-sc-OFL.txt'],
]);
const FONT_EXTS = new Set(['.woff2', '.woff', '.otf', '.ttf']);
const FONT_MAX_BYTES = 300 * 1024;

function checkFonts() {
  const fontsDir = join(ROOT, 'assets/fonts');
  const fontFiles = [];
  for (const ext of FONT_EXTS) {
    fontFiles.push(...walk(ROOT, (f) => extname(f).toLowerCase() === ext));
  }
  for (const file of fontFiles) {
    const name = basename(file);
    const lower = name.toLowerCase();
    if (!ALLOWED_FONTS.has(name) && !BUILD_FONTS.has(rel(file))) {
      fail('fonts', `${rel(file)} 不在字体白名单（只允许 ${[...ALLOWED_FONTS].join(', ')}）`);
    }
    if (lower.includes('plantin') || lower.includes('departure')) {
      fail('fonts', `${rel(file)} 是被禁字体（Plantin / Departure Mono 不得进入仓库）`);
    }
    if (!rel(file).startsWith('assets/fonts/')) {
      fail('fonts', `${rel(file)} 字体文件必须放在 assets/fonts/（实际在 ${rel(file)}），否则不会随主题分发`);
    }
  }
  const woff2 = walk(fontsDir, (f) => extname(f).toLowerCase() === '.woff2');
  const total = woff2.reduce((sum, file) => sum + statSync(file).size, 0);
  if (woff2.length > 0 && total > FONT_MAX_BYTES) {
    fail('fonts', `woff2 总量 ${total}B 超过 300KB 上限（${woff2.length} 个文件）`);
  }
  for (const required of ALLOWED_FONTS) {
    if (!existsSync(join(fontsDir, required))) {
      fail('fonts', `缺少字体文件 assets/fonts/${required}（5.3 交付）`);
    }
  }
  for (const [file, license] of BUILD_FONTS) {
    if (!existsSync(join(ROOT, file))) {
      fail('fonts', `缺少构建专用字体 ${file}`);
    }
    if (!existsSync(join(ROOT, license))) {
      fail('fonts', `构建专用字体缺少同目录OFL许可 ${license}`);
    }
  }
  const licenseRe = /^.+-(OFL|LICENSE)\.txt$/i;
  const licenses = existsSync(fontsDir) ? readdirSync(fontsDir).filter((n) => licenseRe.test(n)) : [];
  if (licenses.length < 2) {
    fail('fonts', `assets/fonts/ 下许可文本不足（需 newsreader-OFL.txt 与 commit-mono-OFL.txt，实际 ${licenses.length} 个）`);
  }
  report('fonts', true, `字体文件 ${fontFiles.length} 个，网页woff2 ${(total / 1024).toFixed(1)}KB，另有${BUILD_FONTS.size}个构建专用TTF`);
}

// ---------- 3. 形态门禁：无 accent、无填充按钮、无卡片圆角+阴影、无 chip 类名 ----------
function checkComponentForms() {
  const sources = [
    ...walk(join(ROOT, 'assets/css'), (f) => ['.css', '.scss'].includes(extname(f))),
    ...walk(join(ROOT, 'layouts'), (f) => extname(f) === '.html'),
    ...walk(join(ROOT, 'exampleSite'), (f) => ['.html', '.css'].includes(extname(f))),
  ].map((file) => ({ file: rel(file), text: readText(file) }));

  const rules = [
    { name: 'accent 变量', pattern: /--[\w-]*accent[\w-]*\s*:/i, message: '禁止 accent 变量/色（本系统无强调色）' },
    { name: '填充按钮', pattern: /(?:\.|#)(?:button|btn|wf-button|wf-btn)\b[^{}]*\{[^}]*\bbackground(?:-color)?\s*:\s*(?!transparent|none|inherit|currentcolor)/is, message: '禁止填充按钮背景（按钮只用文字链/文字按钮形态）' },
    { name: 'chip 类名', pattern: /\.(?:chip|badge|pill|tag)\b/i, message: '禁止标签/chip 类名（本系统无 chip 组件）' },
    { name: '卡片圆角+阴影', pattern: /(?:card|panel)[^{}]*\{[^}]*border-radius[^}]*box-shadow/is, message: '禁止卡片形态（圆角+阴影组合）' },
  ];

  for (const { file, text } of sources) {
    for (const rule of rules) {
      for (const [line, content] of grep(text, rule.pattern)) {
        fail('component-forms', `${file}:${line} ${rule.message}: ${content.trim()}`);
      }
    }
  }
  report('component-forms', true, `扫描 ${sources.length} 个样式/模板源`);
}

// ---------- 4. 装饰门禁：SVG 白名单 + 原创资产边界 ----------
const ALLOWED_SVGS = new Set([
  'assets/images/emblem.svg',
  'assets/images/star-18.svg',
  'assets/images/star-24.svg',
  'assets/images/star-32.svg',
  'assets/cursors/cursor-dark.svg',
  'assets/cursors/cursor-light.svg',
  'assets/favicon/favicon-light.svg',
  'assets/favicon/favicon-dark.svg',
]);
// 上游关键产物的 sha256：任何字节复制都会被这条拦住。
const UPSTREAM_HASHES = new Set([
  '8fc31f1d9844a77d74f9b5cb40312bbf2f5ca79ed582cbed9b4135833137c6ae', // paper.png
  'e67a302a8a5f4e8eb2383d66e46dd45dc24337a13f280a2aeef8b1e00a293848', // paper-dark.png
  'ed84aee6557320246289a1912f23ef718633e9b978dae2c3f81244df4955420c', // styles.css
  '203793dc4ec3aad864cacab09524cd991a4acd3c75465447c7ac9c41ead4f317', // prose.css
  '42f72c8323987df491428076b344e7c3d6ac57d9c69bb05b316e7046279eed35', // script.js
]);

function checkDecoration() {
  const svgs = [
    ...walk(join(ROOT, 'assets/images'), (f) => extname(f).toLowerCase() === '.svg'),
    ...walk(join(ROOT, 'assets/cursors'), (f) => extname(f).toLowerCase() === '.svg'),
    ...walk(join(ROOT, 'assets/favicon'), (f) => extname(f).toLowerCase() === '.svg'),
  ];
  for (const file of svgs) {
    if (!ALLOWED_SVGS.has(rel(file))) {
      fail('decoration', `${rel(file)} 不在 SVG 白名单（内置 SVG 只允许品牌轮廓、四角星变体与 favicon/光标）`);
    }
  }
  for (const file of svgs) {
    const name = rel(file);
    const text = readText(file);
    if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(text)) {
      fail('decoration', `${name} 不是合法 SVG 根元素（缺 xmlns）`);
    }
    if (/<(script|foreignObject)\b/i.test(text)) {
      fail('decoration', `${name} 含脚本/foreignObject，禁止`);
    }
    if (name.startsWith('assets/images/') && /#[0-9a-fA-F]{3,8}\b/.test(text)) {
      fail('decoration', `${name} 星形资产必须用 currentColor，不得写死颜色`);
    }
    if (name.startsWith('assets/images/') && !/currentColor/.test(text)) {
      fail('decoration', `${name} 未使用 currentColor（星形需要继承主题色）`);
    }
    if (name.startsWith('assets/cursors/') || name.startsWith('assets/favicon/')) {
      for (const [line, content] of grep(text, /#[0-9a-fA-F]{6}\b/)) {
        const hex = content.match(/#[0-9a-fA-F]{6}\b/)[0].toLowerCase();
        if (!tokenColorValues().has(hex)) {
          fail('decoration', `${name}:${line} 颜色 ${hex} 不在设计令牌调色板内: ${content.trim()}`);
        }
      }
    }
  }

  const assetFiles = walk(join(ROOT, 'assets'), () => true);
  for (const file of assetFiles) {
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (UPSTREAM_HASHES.has(hash)) {
      fail('decoration', `${rel(file)} 与上游参考资产字节相同（sha256 ${hash.slice(0, 12)}…），禁止复制`);
    }
  }
  const shaders = walk(ROOT, (f) => ['.glsl', '.frag', '.vert'].includes(extname(f).toLowerCase()));
  for (const file of shaders) {
    fail('decoration', `${rel(file)} 是独立 shader 文件；GLSL 必须内联在 assets/js/scene.js（D32、AST-16）`);
  }
  report('decoration', true, `SVG ${svgs.length} 个、资产 ${assetFiles.length} 个，均通过白名单/哈希边界`);
}

// ---------- 5. sidecar 门禁：frontmatter 与 DESIGN.md 一致 ----------
// 最小 YAML 解析：只支持 5 组标准块 + 2 空格嵌套映射，值一律字符串。
function parseFrontmatterLoose(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!match) {
    throw new Error('DESIGN.md 缺少以 --- 包裹的 YAML frontmatter');
  }
  const data = {};
  const stack = [data];
  const indents = [0];
  const unquote = (raw) => raw.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  const lines = match[1].split(/\r?\n/);
  let current = data;
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }
    const m = /^(\s*)([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!m) {
      throw new Error(`无法解析的 frontmatter 行: ${line}`);
    }
    const indent = m[1].length;
    const key = m[2];
    const rawValue = m[3].trim();
    while (indents.length > 1 && indent < indents[indents.length - 1]) {
      indents.pop();
      stack.pop();
    }
    current = stack[stack.length - 1];
    if (rawValue === '') {
      current[key] = {};
      indents.push(indent + 2);
      stack.push(current[key]);
    } else {
      current[key] = unquote(rawValue);
    }
  }
  return data;
}

function checkSidecar() {
  const designPath = join(ROOT, 'DESIGN.md');
  const sidecarPath = join(ROOT, '.impeccable/design.json');
  if (!existsSync(designPath)) {
    fail('sidecar', '缺少根 DESIGN.md');
    report('sidecar', false, '缺少根 DESIGN.md');
    return;
  }
  if (!existsSync(sidecarPath)) {
    fail('sidecar', '缺少 .impeccable/design.json');
    report('sidecar', false, '缺少 .impeccable/design.json');
    return;
  }
  let frontmatter;
  let sidecar;
  try {
    frontmatter = parseFrontmatterLoose(readText(designPath));
  } catch (error) {
    fail('sidecar', `DESIGN.md frontmatter 解析失败: ${error.message}`);
    return;
  }
  try {
    sidecar = JSON.parse(readText(sidecarPath));
  } catch (error) {
    fail('sidecar', `.impeccable/design.json 不是合法 JSON: ${error.message}`);
    return;
  }

  const expectCounts = { colors: 13, typography: 8, rounded: 2, spacing: 11, components: 20 };
  for (const [group, expected] of Object.entries(expectCounts)) {
    const actual = Object.keys(frontmatter[group] ?? {}).length;
    if (actual !== expected) {
      fail('sidecar', `DESIGN.md frontmatter ${group} 键数应为 ${expected}，实际 ${actual}`);
    }
  }
  const sections = [...readText(designPath).matchAll(/^## /gm)].length;
  if (sections !== 8) {
    fail('sidecar', `DESIGN.md 应有 8 个 ## 章节，实际 ${sections}`);
  }
  if (sidecar.schemaVersion !== 2) {
    fail('sidecar', `sidecar schemaVersion 应为 2，实际 ${sidecar.schemaVersion}`);
  }
  const extensions = sidecar.extensions ?? {};
  const compareKeys = (label, expectedKeys, actualKeys) => {
    const expected = [...expectedKeys].sort();
    const actual = [...actualKeys].sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      fail('sidecar', `${label} 键不一致: frontmatter=${expected.join(',')} sidecar=${actual.join(',')}`);
    }
  };
  compareKeys('colorMeta', Object.keys(frontmatter.colors ?? {}), Object.keys(extensions.colorMeta ?? {}));
  compareKeys('typographyMeta', Object.keys(frontmatter.typography ?? {}), Object.keys(extensions.typographyMeta ?? {}));

  // rounded/spacing 只存在于 frontmatter（document.md 的 extensions 分组只有 shadow/motion/breakpoint），
  // 这里不做 sidecar 比对，靠 frontmatter 计数 2/11 与 3.1 的验收句保证。
  const shadows = extensions.shadows ?? [];
  if (shadows.length !== 3) {
    fail('sidecar', `extensions.shadows 应为 3 层阴影词汇，实际 ${shadows.length}`);
  }
  const motion = extensions.motion ?? [];
  if (motion.length < 8) {
    fail('sidecar', `extensions.motion 至少 8 条动效令牌，实际 ${motion.length}`);
  }
  const breakpoints = extensions.breakpoints ?? [];
  if (breakpoints.length !== 3) {
    fail('sidecar', `extensions.breakpoints 应为 3 档（520/800/1100），实际 ${breakpoints.length}`);
  }

  const components = sidecar.components ?? [];
  if (components.length !== 9) {
    fail('sidecar', `sidecar 组件片段应为 9 个，实际 ${components.length}`);
  }
  for (const component of components) {
    const label = component.name ?? '(未命名片段)';
    for (const field of ['name', 'kind', 'description', 'html', 'css']) {
      if (typeof component[field] !== 'string' || component[field].trim() === '') {
        fail('sidecar', `组件片段 ${label} 缺少字段 ${field}`);
      }
    }
    if (!/wf-/.test(component.html ?? '') || !/\.wf-/.test(component.css ?? '')) {
      fail('sidecar', `组件片段 ${label} 未使用 wf- 类名前缀`);
    }
    const external = /(?:https?:)?\/\//.test((component.html ?? '').replaceAll('http://www.w3.org/2000/svg', ''))
      || /@import|url\(\s*['"]?(?:https?:)?\/\//.test(component.css ?? '');
    if (external) {
      fail('sidecar', `组件片段 ${label} 引用了外部资源，片段必须自包含`);
    }
    if (component.refersTo) {
      if (!(component.refersTo in (frontmatter.components ?? {}))) {
        fail('sidecar', `组件片段 ${label} 的 refersTo="${component.refersTo}" 不在 frontmatter 组件键内`);
      }
    }
  }
  const narrative = sidecar.narrative ?? {};
  for (const field of ['northStar', 'overview']) {
    if (typeof narrative[field] !== 'string' || narrative[field].trim() === '') {
      fail('sidecar', `sidecar narrative.${field} 缺失`);
    }
  }
  if (!Array.isArray(narrative.keyCharacteristics) || narrative.keyCharacteristics.length < 4) {
    fail('sidecar', 'sidecar narrative.keyCharacteristics 至少 4 条');
  }
  if (!Array.isArray(narrative.rules) || narrative.rules.length < 6) {
    fail('sidecar', 'sidecar narrative.rules 至少 6 条');
  }
  for (const field of ['dos', 'donts']) {
    if (!Array.isArray(narrative[field]) || narrative[field].length !== 8) {
      fail('sidecar', `sidecar narrative.${field} 应为 8 条`);
    }
  }
  report('sidecar', true, `frontmatter 13/8/2/11/20 与 sidecar ${components.length} 片段、${motion.length} 动效、${breakpoints.length} 断点、${shadows.length} 阴影`);
}

// ---------- 执行 ----------
console.log('waitforit-theme 资产与设计契约门禁');
console.log(`仓库根: ${ROOT}`);
checkTokenLiterals();
checkFonts();
checkComponentForms();
checkDecoration();
checkSidecar();

if (failures.length > 0) {
  console.error(`\n${failures.length} 项失败：`);
  for (const item of failures) {
    console.error(`  [${item.check}] ${item.message}`);
  }
  process.exit(1);
}
console.log('\n全部通过：令牌 / 字体 / 形态 / 装饰 / sidecar 5 项门禁');
if (VERBOSE) {
  const scanned = ['assets/css', 'layouts', 'exampleSite', 'docs/design/spikes', 'assets/fonts', 'assets/images', 'assets/cursors', 'assets/favicon'].filter((dir) => existsSync(join(ROOT, dir)));
  console.log(`已扫描目录: ${scanned.join(', ')}`);
}
