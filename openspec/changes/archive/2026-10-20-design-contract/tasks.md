# Tasks

本变更只产出文档、令牌、原型与原创资产，**不写** Hugo 模板、主题样式或 `exampleSite/` 内容（属 P2 `theme-skeleton`）。每个任务的完成标准写在任务行内。

## 1. 基线与参考证据

- [x] 1.1 提交现有文档基线（`docs/`、`AGENTS.md`、`openspec/`），使后续 diff 可审阅；验证：`git log --oneline` 出现首个提交，`git status` 仅剩本变更产物未跟踪
- [x] 1.2 写 `docs/design/reference/upstream-pin.md`：上游 commit `31b1b04`、取用时间、`DESIGN.md` 行数与 sha256、字体许可结论（Plantin 专属授权 / Departure Mono OFL11 / Commit Mono OFL）、`_build/` 为完整预构建站点的验证记录；验证：文件存在且其中 sha256 可复算
- [x] 1.3 采集参考基线截图：本地静态 serve 参考仓库 `_build/`，用 headless Chrome 截 home / posts / post / purpose / join / 404 六页的 1440×900 与 390×844 两档，存 `docs/design/reference/baseline/`；验证：12 张 PNG 非空且能辨认字体与纸光层次；若 headless 不可用，在 upstream-pin.md 记录失败原因并改存上游静态图链接

## 2. 转译矩阵与设计令牌

- [x] 2.1 写 `docs/design/transfer-matrix.md`：26 个颜色令牌（13 个采纳、12 个 `pi-*` 与 `nav-overlap` 排除及理由）、8 个排版角色、22 个组件键、12 个 `ds-` 片段逐条给出「采纳 / 替换 / 排除 + 理由 + `wf-` 映射」；验证：文件内计数与 DESIGN.md frontmatter 的 13/8/22 及 sidecar 的 12 片段逐条对齐，且每行都有判定
- [x] 2.2 写 `docs/design/tokens.css`：`--wf-*` 全量令牌（13 色 + night 反转、8 角色字号/行高/字重、11 间距、2 圆角、断点常量注释、`--wf-frame-block`/`--wf-page-top`/`--wf-page-bottom`/`--wf-measure`/`--wf-horizon`、动效时长、纸光参数、颗粒参数），含 `:root`、`[data-theme="night"]`、`prefers-color-scheme: dark` 与 `auto/day/night` 三态选择器；验证：在 4.2 的 surface.html 中 `getComputedStyle(document.documentElement).getPropertyValue('--wf-ink')` 返回 `#353431`，且切到 night 后 `--wf-paper` 变为夜色值；P2 消费约束：该 CSS 须由模板 `.RelPermalink` 后发布（AST-02），其内部字体 `url()` 不会被资源管线重写（AST-08）
- [x] 2.3 写门禁脚本 `scripts/check-assets.mjs`（Node 24，无依赖），实现 5 项检查：令牌字面值、字体白名单、组件形态（accent/填充按钮/卡片/shadow 组合/chip 类名）、装饰（白名单外 SVG）、sidecar 与 frontmatter 一致；验证：`node scripts/check-assets.mjs` 在当前仓库退出 0，人为写入一个 `#ff0000` 字面值后退出 1 且指出文件行

## 3. 设计契约：DESIGN.md 与 sidecar

- [x] 3.1 写仓库根 `DESIGN.md`：8 章（Overview / Colors / Typography / Layout / Elevation & Depth / Shapes / Components / Do's and Don'ts）+ YAML frontmatter（13 色、8 角色、2 圆角、11 间距、20 组件键），文字层采用 Newsreader/Commit Mono 叙述并显式声明字体偏差与 `--wf-font-*` 覆盖；验证：check-assets 的 frontmatter 解析通过、`grep -c '^## '` 得 8 个章节、组件键计数为 20
- [x] 3.2 生成并入库 `.impeccable/design.json`：用 impeccable `document` 产出 schemaVersion 2 sidecar，含 OKLCH 色阶、阴影/动效/断点 extensions 与 9 个自包含 `wf-` 组件片段；验证：`node -e "JSON.parse(...)"` 通过，check-assets 报 sidecar 与 frontmatter 一致，extensions 四个段与 9 个片段齐全
- [x] 3.3 更新 `AGENTS.md`：设计文档指针改为根 `DESIGN.md` + `.impeccable/design.json`，写明「DESIGN.md 改动必须重生 sidecar」，hard boundary 保持禁止 Plantin/Departure Mono 并把字体角色写为 Newsreader/Commit Mono；验证：`grep` 能在 AGENTS.md 找到三处新表述，且无「可安装」承诺
- [x] 3.4 决策回写 `docs/decisions.md`（追加不改写历史）：修订 D7（动效时序）、D8（纸光覆盖 Canvas 2D 场景）、D9（字体角色与子集化）、D16（契约落点移到仓库根），新增 D19（参考转译原则与上游 pin 策略）；验证：四条修订记录与 D19 条目存在，且 D16 正文已标明根 `DESIGN.md` 为唯一权威

## 4. 原型 spike（证明契约成立）

- [x] 4.1 `docs/design/spikes/font-ab.html`：同一段文字在 Newsreader 与 Source Serif 4、Commit Mono 与系统 monospace 四组合下并排对比，含 1440/390 两档截图与 reduced-motion 记录；验证：四组合可切换、截图中文字可读、偏差结论回填 transfer-matrix.md 的字体行
- [x] 4.2 `docs/design/spikes/surface.html`：Canvas 2D 线场 + 径向纸光 + 颗粒三层叠加，全部由 `tokens.css` 驱动，切换 light/night 时 900ms 交叉淡化，断点移动光心；验证：`getComputedStyle` 读到令牌值、1440/390 截图无横向溢出、`prefers-reduced-motion` 下场景冻结为静态首帧
- [x] 4.3 `docs/design/spikes/motion.html`：页面纵向过渡 520/220ms、入场 300ms、星形 hover、移动菜单 240/180ms、reduced-motion 降级；验证：改动 `tokens.css` 中的时长令牌后动效随之变化（证明非硬编码），reduced-motion 下无位移与缩放
- [x] 4.4 回填 spike 结论：把字体 A/B 结果、表面层级与动效实测写回 `docs/design/transfer-matrix.md` 与 `design.md` 的对应决策；验证：每个 spike 至少有一条结论落在矩阵或决策文档中，且与实测一致

## 5. 原创资产与许可

- [x] 5.1 绘制原创四角星与光标/favicon：`assets/images/` 下 18/24/32 三档星形 SVG、`assets/cursors/` 昼夜双态星形 SVG、favicon light/dark 与 apple-touch-icon；验证：check-assets 装饰门禁通过（仅白名单 SVG），四角星可见且昼夜光标颜色正确
- [x] 5.2 生成纸纹颗粒并入库：light/dark 各一张 ≤16KB 的无缝平铺 PNG（自行生成，不使用参考仓库 `paper.png` 字节）；验证：两文件存在、在 surface.html 中平铺无缝、check-assets 产物扫描不含参考截图或上游资产
- [x] 5.3 字体子集与许可文本：用 fonttools 生成 Newsreader（含斜体）与 Commit Mono（400/700）latin 子集 woff2 放入 `assets/fonts/`，并把 OFL 文本复制为 `assets/fonts/*-OFL.txt`；验证：check-assets 字体门禁通过、浏览器 test 页面渲染正确、字体文件总量 ≤300KB；P2 交接须写明发布方式：`resources.Get` → `fingerprint` → `.RelPermalink` + `<link rel="preload">`（AST-14/AST-02），许可文本与字体同目录（AST-15），integrity 时同写 `crossorigin`（AST-04）
- [x] 5.4 写 `CREDITS.md` 字体与参考段落：每款字体的名称 / 版权持有者 / 许可全称 / 获取来源，参考站点 commit 与许可说明，注明代码 MIT 不覆盖字体；验证：逐款字体可追溯，check-assets 的许可检查通过

## 6. 集成验证

- [x] 6.1 运全量门禁并填保真矩阵：`node scripts/check-assets.mjs` 五项全绿；填 5 列保真矩阵（字体 A/B、表面与纸光、导航与 chrome、动效与降级、a11y 基线），逐项写参考值 / 主题值 / 偏差声明；验证：脚本退出 0，矩阵每行三栏非空，偏差项与 `design.md` 的 Risks 对应
- [x] 6.2 写 `docs/handoff/` 新交接文件：记录本变更结论、遗留 Open Questions、P2 入口（消费 `assets/css/tokens.css`）与上游 pin 位置；验证：交接文件列出 4 条 Open Questions 与 P2 任务入口，附「P2 必守规则 ID」清单（至少 AST-01/AST-02/AST-04/AST-14、CFG-01/CFG-02、TPL-05/TPL-12），README 仍无安装承诺
- [x] 6.3 运行 `openspec validate design-contract --strict` 并修正所有告警（需求描述长度、场景格式、Purpose 等）；验证：命令退出 0 且无 strict 警告

## Workflow follow-up

- 按仓库评审要求审阅本变更产物与 `git diff` 后再进入实现。
- `openspec apply-change design-contract` 执行清单；P2 另开 `theme-skeleton` 变更消费令牌与契约。
- 完成后 `openspec archive-change design-contract` 归档，并确认 `openspec/specs/design-system` 与 `openspec/specs/asset-licensing` 已生成。
