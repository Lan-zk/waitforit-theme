# Handoff — design-contract 收尾（2026-10-20）

下一会话目标：进入 P2 `theme-skeleton`，把本变更冻结的设计契约变成第一版可构建的 Hugo 主题骨架。本文件记录 `design-contract` 的结论、证据位置、遗留问题与 P2 必须遵守的规则。

## 当前状态

- 仓库：`E:\File\self\github\waitforit-theme`（main），P0 文档阶段已结束，P1 设计契约已完成。**仍无 Hugo 模板、`assets/css/` 主题样式、`exampleSite/`、`go.mod`、`README.md`、`theme.toml`**；`README.md` 尚无安装段，主题不可安装。
- 设计契约三件套已入库且口径一致：
  - `DESIGN.md`（仓库根，8 章 + YAML frontmatter：13 colors / 8 typography / 2 rounded / 11 spacing / 20 components）是唯一权威；
  - `.impeccable/design.json`（schemaVersion 2：colorMeta 13、typographyMeta 8、shadows 3、motion 8、breakpoints 3、9 个自包含 `wf-` 片段、narrative 与 DESIGN.md 逐字一致）是机器可读 sidecar；
  - `docs/design/tokens.css` 是浏览器实际消费的 `--wf-*` 令牌（P2 迁移到 `assets/css/tokens.css` 后删除 docs 副本）。
- 上游证据固定在 `docs/design/reference/upstream-pin.md`：earendil-works/website `31b1b0429425f7d5af914afa4d29165688d71a3f`，DESIGN.md 23,274B / sha256 `ef6ac366e9db9d68401a67922c2c466c199a3fed4e039b3ea669ec43db28757b`，sidecar 43,450B / sha256 `d034ff0bf900765be080b7d0c26977bc13c78b1cfb2cd75fb90597004e02686e`。基线截图 12 张在 `docs/design/reference/baseline/`（1440×900 / 390×844，light），合计 1,502,526B ≤ 2MB，只作内部对照，不进发布产物。
- 判定与取舍记录：`docs/design/transfer-matrix.md`（26 色 = 13 采纳 + 13 排除、8 角色、22 组件键 = 20 采纳 + 2 排除、12 个 `ds-` 片段 = 9 采纳 + 3 排除、68 条判定）与 `docs/design/fidelity-matrix.md`（5 个保真面 × 参考值/主题值/偏差声明，偏差与 Risks 对应）。
- 原型与实测证据：`docs/design/spikes/`（font-ab / surface / motion 三个可独立打开的静态 HTML + 16 张截图与全部令牌实读/时序读数，说明与结论见其 README）。原创资产在 `assets/images/`（18/24/32 星形 SVG、无缝颗粒 PNG）、`assets/cursors/`（昼夜星形光标）、`assets/favicon/`（light/dark SVG + apple-touch-icon）；字体与许可文本在 `assets/fonts/`（Newsreader latin 含斜体、Commit Mono 400/700、`*-OFL.txt`），来源与许可见 `CREDITS.md`。

## 本变更结论（已实测）

- **字体**：Newsreader（display/title/reading，真斜体）+ Commit Mono（body/ui/form/label/code，真 700），自托管 latin 子集共 296,668B（≤300KB）；CJK 走系统回退；`--wf-font-serif` / `--wf-font-mono` 是唯一允许的覆盖点。A/B 实测四组合加载 2/2、1440/390 无横向溢出，维持选型（结论见 `docs/design/transfer-matrix.md` §4.1 与 design.md D1）。
- **表面**：四层 z 序 canvas 0 → veil 1 → grain 2 → frame 3；纸光参数与参考一致（`ellipse 72% 115% at 50% 48%`，中心 .985 → 96% 处 0，900ms 交叉淡化，≤520 光心 50% 40%）；颗粒为原创 120×120 无缝 PNG，light 7,229B / night 7,065B。
- **动效**：8 个时长令牌 + 1 条 easing；`transitionend` 实测入场 300/300、页面进入 520/520、退出 220/220、hover 180/180、菜单 240/240・180/180 ms；覆盖令牌后实测同步改变（非硬编码）；`prefers-reduced-motion: reduce` 下全部 0ms。
- **门禁**：`node scripts/check-assets.mjs` 五项（令牌字面值、字体白名单、组件形态、装饰白名单、DESIGN.md ↔ sidecar 一致性）全部通过、退出 0；植入 `#ff0000` 字面值时退出 1 并报 `文件:行号`。`openspec validate design-contract --strict` 退出 0。

## 遗留 Open Questions（4 条，P2 起逐条关闭）

1. **基线截图是否长期入库**：当前 12 张共 1.43MiB 入库（`docs/design/reference/baseline/`），在 2MB 预算内；若 P2 需要更多参考页，先定「按需重截 + 保留关键 6 页」策略，避免仓库膨胀。
2. **字体覆盖示例是否写进 README**：`--wf-font-serif/-mono` 已作为契约暴露；是否对外展示覆盖方法（README 属对外契约）留给 P2 决定。
3. **覆盖通过纯 CSS 还是 Hugo params 注入**：P2 实测 Hugo Pipes 后定；若走 params 必须 `[params.waitforit.*]` 命名空间 + camelCase/snake_case（CFG-05/CFG-06）。
4. **上游再同步是否自动化**：上游 DESIGN.md/sidecar 未入版本控制，当前靠 pin + 哈希 + 人工 diff；自动化留到 P3 评估。

## P2 入口（按序）

1. **迁移令牌**：`docs/design/tokens.css` → `assets/css/tokens.css`，删除 docs 副本；CSS 内 `url("../../assets/images/grain-*.png")` 改 `url("../images/...")`（AST-08：CSS `url()` 不被管线重写，必须按产物目录写相对路径并验证）。
2. **字体发布**：模板里 `resources.Get "fonts/*.woff2"` → `fingerprint` → `.RelPermalink` 写 `<link rel="preload">`（AST-01/AST-02/AST-14）；许可文本 `newsreader-OFL.txt`、`commit-mono-OFL.txt` 与字体同目录随包（AST-15）；若启用 integrity，同时写 `crossorigin="anonymous"`（AST-04）。
3. **主题配置**：主题根 `hugo.toml` 只放 `params`/`menu(s)`/`outputFormats`/`mediatypes`（CFG-01），不放 `config/_default/`（CFG-02）；自定义参数 `params.waitforit.<key>`（CFG-05）。
4. **模板落点**：`layouts/home.html`（TPL-05）、`layouts/page.html`、`layouts/section.html`、`layouts/posts/page.html`、根 `layouts/404.html`（TPL-12）；先写 `exampleSite` fixture 与验收句，再写模板。
5. **实现完成判定**：按 `docs/design/fidelity-matrix.md` 在 1440/390 对照基线截图；偏差只允许出现在「偏差声明」列；视觉改动必须过 `node scripts/check-assets.mjs`。

### P2 必守规则 ID 清单

| 规则 | 约束 |
| --- | --- |
| **AST-01** | `resources.Get` 只认 `assets/`；`static/` 里的文件拿不到资源对象。 |
| **AST-02** | `assets/` 不自动发布；只有 `.Permalink` / `.RelPermalink` / `.Publish` 才写进 `public/`。 |
| **AST-04** | 用 subresource integrity 时，`integrity` 必须与 `crossorigin="anonymous"` 同写。 |
| **AST-14** | 字体走 `assets/fonts` + 显式发布 + `<link rel="preload">`；只写 CSS `url()` 不会发布。 |
| **AST-15** | 字体 license 文件与字体同目录交付；字体不得按 MIT 再许可。 |
| **CFG-01** | 主题根 `hugo.toml` 只有 `params`、`menu(s)`、`outputFormats`、`mediatypes` 四段参与合并。 |
| **CFG-02** | 主题配置放主题根 `themes/<name>/hugo.toml`，不是 `config/_default/`。 |
| **TPL-05** | 首页模板是 `layouts/home.html`，不是 `index.html`。 |
| **TPL-12** | 404 模板放 `layouts/404.html`；对应决策须引用规则 ID。 |
| **CFG-05/06** | 自定义参数 `params.waitforit.<key>`；键名 camelCase/snake_case。 |

## 验证命令（本会话实际运行）

```powershell
node scripts/check-assets.mjs           # exit 0，五项全绿
node scripts/check-assets.mjs --verbose # 每项文件数/片段数/计数明细
openspec validate design-contract --strict  # exit 0
```

字体、表面、动效的浏览器实测命令见 `docs/design/spikes/README.md`（headless Chrome + 本地 `python -m http.server`，无网络依赖）。基线截图生成方式见 `docs/design/reference/upstream-pin.md` 的复现段。

## 不要做的事

- 不要在 P1 收尾前声称主题可安装；`README.md` 的安装段是主题可用的唯一标志。
- 不要复制上游 `styles.css` / `script.js` / shader / logo / 图片字节；结构可借，字节不可借（`CREDITS.md` 已声明边界）。
- 不要引入 Plantin Now / Plantin / Departure Mono；不要为 CJK 打包字体。
- 不要把参考截图或上游资产放进构建产物或 `assets/`。
