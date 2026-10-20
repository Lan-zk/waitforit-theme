# 上游参考快照（upstream pin）

本文件固定 `design-contract` 所依据的参考站点快照。转译判断（`docs/design/transfer-matrix.md`）以此快照、`DESIGN.md` 的 sha256 与下述字体许可结论为准；上游改版不会自动改变本仓契约。

## 1. 仓库与提交

| 项 | 值 |
| --- | --- |
| 仓库 | `https://github.com/earendil-works/website` |
| 本地克隆 | `E:\File\self\github\website` |
| commit | `31b1b0429425f7d5af914afa4d29165688d71a3f` |
| commit 主题 | `Update pi-durable-on-cloudflare.md` |
| 作者 / 提交时间 | Christian Klotz `<hello@christianklotz.co.uk>` / `2026-10-16T20:50:50+01:00` |
| 取用时间 | `2026-10-20T16:20:23+08:00` |
| 许可 | Apache-2.0（`LICENSE` 9,164 B）；无 `NOTICE`，无版权行 |

取用时工作区并非干净状态：`M build.py`，未跟踪 `DESIGN.md`、`PRODUCT.md`、`.impeccable/`。由此有两个可复现性限制：

- `_build/`（25 个 HTML 的预构建站点）由该提交加上**未提交**的 `build.py` 改动生成，是「本地可浏览」证据，不保证与远端提交逐字节对应。
- `DESIGN.md` 与 `.impeccable/design.json` 是未入库工作区文件，只能靠下面的 sha256 固定，不能靠 commit 复现。

## 2. DESIGN.md 与 sidecar 快照

| 文件 | 行数 | 字节 | SHA-256 |
| --- | --- | --- | --- |
| `DESIGN.md` | 318 | 23,274 | `ef6ac366e9db9d68401a67922c2c466c199a3fed4e039b3ea669ec43db28757b` |
| `.impeccable/design.json` | — | 43,450 | `d034ff0bf900765be080b7d0c26977bc13c78b1cfb2cd75fb90597004e02686e` |

`DESIGN.md` frontmatter 计数：26 colors / 8 typography / 3 rounded / 12 spacing / 22 components；正文 `##` 章节数 8（Overview、Colors、Typography、Layout、Elevation & Depth、Shapes、Components、Do's and Don'ts）。sidecar 为 schemaVersion 2，含 12 个 `ds-` 组件片段。

本仓契约采用 13 色 / 8 角色 / 2 圆角 / 11 间距 / 20 组件键 / 9 个 `wf-` 片段，与快照计数的差异及逐条判定见 `docs/design/transfer-matrix.md`。

复算：`Get-FileHash DESIGN.md -Algorithm SHA256`，结果应与上表一致。

## 3. 关键参考产物

| 文件 | 字节 | SHA-256 |
| --- | --- | --- |
| `_build/index.html` | 11,715 | `37f6e64965df51925e71837b7fd58548bc66ee18c0d9417e2a80f8c5663c0b65` |
| `_build/404.html` | 11,474 | `e7ed8aaf6048be50c4ac23cfcd85cebd0e03544791eabb463879bb84a9984283` |
| `_build/static/styles.css` | 49,959 | `ed84aee6557320246289a1912f23ef718633e9b978dae2c3f81244df4955420c` |
| `_build/static/prose.css` | 44,010 | `203793dc4ec3aad864cacab09524cd991a4acd3c75465447c7ac9c41ead4f317` |
| `_build/static/script.js` | 97,680 | `42f72c8323987df491428076b344e7c3d6ac57d9c69bb05b316e7046279eed35` |
| `_build/static/paper.png` | 121,359 | `8fc31f1d9844a77d74f9b5cb40312bbf2f5ca79ed582cbed9b4135833137c6ae` |
| `_build/static/paper-dark.png` | 104,542 | `e67a302a8a5f4e8eb2383d66e46dd45dc24337a13f280a2aeef8b1e00a293848` |

参考站点无打包器、无压缩、无内容哈希：页面直接引用 `/static/styles.css`、`/static/prose.css`、`/static/script.js`，Canvas 线场参数内联在页面脚本中。

## 4. 字体许可结论

| 字体 | 上游角色 | 许可证据 | 结论 |
| --- | --- | --- | --- |
| Plantin Now Variable | serif（display / title / reading）；`PlantinNowVariable-Upright.woff2` 83,136 B、`-Italic.woff2` 94,676 B | `_build/static/fonts/plantin-now-variable-license.txt` 770 B，正文写明 "All other parties are explicitly restricted from using the Licensed Webfonts(s)." | 专属商业授权，不可自托管、不可再分发 → **不进入本仓库与构建产物** |
| Departure Mono | mono（body / ui / form / label / code）；`DepartureMono-Regular.woff2` 22,496 B | SIL Open Font License 1.1，版本 v1.500；上游 `_static/fonts/` 未随字体附 license 文本（只有 css/woff/otf） | OFL11 允许再分发，但本变更字体策略只采用 Newsreader + Commit Mono → **不进入本仓库** |
| Commit Mono | 上游「死资源」：`_build/static/fonts/` 有 `commit-mono.css` 与 400/700 otf+woff2，但构建出的页面只引用 `departure-mono.css` 与 `plantin-mt-pro.css`，未引用 Commit Mono | `commit-mono-license.txt` 1,856 B，SIL OFL 1.1，`Copyright (c) 2023 Eigil Nikolajsen` | OFL → **可用**，作为主题 mono 自托管（`--wf-font-mono`） |
| Newsreader | 上游未使用 | Google Fonts 仓库 `ofl/newsreader/OFL.txt`（SIL OFL 1.1） | OFL → **可用**，作为主题 serif 自托管（`--wf-font-serif`） |

汇总：本仓只允许 Newsreader（含 italic 变量字体）与 Commit Mono（400/700）两族；Plantin Now 与 Departure Mono 禁止进入仓库与构建产物（见 `openspec/changes/design-contract/specs/asset-licensing/spec.md`）。

## 5. `_build/` 完整性验证

- HTML 页面 25 个：`index.html`、`404.html`、`api/README/index.html`、`join/`、`posts/`（列表）与 18 个 posts 子页（含 `posts/pi-1-0/`、`posts/what-is-a-harness/`、`posts/pi-durable-on-cloudflare/`）、`purpose/`、`unsubscribe/`、`values/`。
- 静态资源齐全：`styles.css` 49,959 B、`prose.css` 44,010 B、`script.js` 97,680 B、`paper.png` / `paper-dark.png`、`static/fonts/`（Plantin、Departure Mono、Commit Mono 的 css/woff2/otf）、htmx / purify / i18n 脚本。
- 本地静态 serve：`python -m http.server 8471 --bind 127.0.0.1 --directory 'E:\File\self\github\website\_build'`，`GET /` 返回 HTTP 200；页面实际渲染出 Plantin 衬线标题、Departure Mono 界面标签、纸光与 Canvas 线场（见 `baseline/` 截图）。
- 结论：`_build/` 是完整预构建站点，可直接静态 serve 取证，不需要 Node/pnpm 构建链。

## 6. 基线截图（任务 1.3）

- 服务：`python -m http.server 8471 --bind 127.0.0.1 --directory 'E:\File\self\github\website\_build'`（仅 127.0.0.1）。
- 浏览器：`C:\Program Files\Google\Chrome\Application\chrome.exe`，参数：
  `--headless=new --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --window-size=<W>,<H> --virtual-time-budget=15000 --blink-settings=preferredColorScheme=1 --screenshot=<png> <url>`。
- 强制 light：headless Chrome 默认 `prefers-color-scheme` 为 dark，参考站 `auto` 模式会渲染成夜间主题；`--blink-settings=preferredColorScheme=1` 固定为 light，六个页面在同一光照下对比。
- 六个页面：`/`（home）、`/posts/`（posts 列表）、`/posts/pi-1-0/`（post 详情）、`/purpose/`、`/join/`、`/404.html`（404）。
- 视口：1440×900 与 390×844，`deviceScaleFactor=1`，PNG 像素尺寸与视口逐一核对一致。
- 压缩：未压缩原图 12 张合计 4,644,805 B。为满足仓库默认 ≤2 MB 预算，用 Pillow 做 median(3) 去噪 + 每通道 4 级 posterize（保留 64 级色调）+ `optimize=True` 保存；**不缩放、不裁切、不改版式**，字号/行高/层叠位置不变，颜色仍保留纸色暖调。压缩会轻微削弱极细笔画，色值判断以 `tokens.css` 与 `DESIGN.md` 为准。

清单（`docs/design/reference/baseline/`，合计 1,502,526 B = 1.43 MiB）：

| 文件 | 视口 | 字节 |
| --- | --- | --- |
| `home-1440x900.png` | 1440×900 | 209,263 |
| `home-390x844.png` | 390×844 | 61,983 |
| `posts-1440x900.png` | 1440×900 | 159,045 |
| `posts-390x844.png` | 390×844 | 66,237 |
| `post-1440x900.png` | 1440×900 | 214,237 |
| `post-390x844.png` | 390×844 | 96,669 |
| `purpose-1440x900.png` | 1440×900 | 179,199 |
| `purpose-390x844.png` | 390×844 | 85,485 |
| `join-1440x900.png` | 1440×900 | 98,784 |
| `join-390x844.png` | 390×844 | 19,410 |
| `404-1440x900.png` | 1440×900 | 242,349 |
| `404-390x844.png` | 390×844 | 69,865 |

截图可辨认：Plantin 衬线标题 / Departure Mono 界面标签、纸光径向渐变与水平线位置、Canvas 线场在 horion 以下的分布。参考站页面在 headless 环境下以中文渲染（`Accept-Language` 语言协商 + 构建期 i18n），不影响版式判断。

## 7. 引用边界

- 上游为 Apache-2.0，但**没有 NOTICE 与版权行**；引用其结构、命名与设计判断时必须在 `CREDITS.md` 注明来源 commit，不得复制代码、文案、资产字节。
- 不复制 `styles.css`、`prose.css`、`script.js`、Canvas/GLSL shader、`paper.png` / `paper-dark.png`、任何字体文件、logo、图片或文章文本。
- 截图只存 `docs/design/reference/`，不进入构建产物；`scripts/check-assets.mjs` 的产物扫描必须排除参考目录，并把上表字体/纸纹/脚本哈希视为禁入名单。
- Commit Mono 在上游是未被引用的死资源；观察到的字体行为来自 Plantin Now + Departure Mono。

## 8. 复现命令

```powershell
git -C 'E:\File\self\github\website' log -1 --format='%H %cd %s' --date=iso-strict
(Get-Content 'E:\File\self\github\website\DESIGN.md').Count
(Get-FileHash 'E:\File\self\github\website\DESIGN.md' -Algorithm SHA256).Hash.ToLower()
python -m http.server 8471 --bind 127.0.0.1 --directory 'E:\File\self\github\website\_build'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$ws = '--window-size=1440,900'
& $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=1 $ws --virtual-time-budget=15000 --blink-settings=preferredColorScheme=1 --user-data-dir="$env:TEMP\wf-profile" --screenshot="$env:TEMP\home-1440.png" 'http://127.0.0.1:8471/'
```

压缩脚本（Pillow 12）：`Image.open(raw).convert('RGB')` → `filter(ImageFilter.MedianFilter(3))` → 每通道 `point(lambda v: (v // 4) * 4)` → `save(path, optimize=True, compress_level=9)`。
