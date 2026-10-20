# Design

## Context

见 `proposal.md` 的 Why。以下是决定实现方式、且不易从别处读到的现状与约束。

**仓库状态**：P0 文档阶段，git 已有 main 分支但无提交；`layouts/`、`assets/`、`i18n/`、`exampleSite/` 尚不存在；未安装 Hugo。因此本变更的所有产物都必须是**不依赖 Hugo 构建**即可审阅的静态文档/原型，模板消费推迟到 P2。

**参考系统的事实**（earendil.com，pin commit `31b1b04`）：

- `DESIGN.md` 318 行：YAML frontmatter（13 个站点颜色 + 12 个 `pi-*` 颜色、8 个排版角色、2 个圆角、11 个间距、22 个组件键）+ 8 章正文（Overview / Colors / Typography / Layout / Elevation & Depth / Shapes / Components / Do's and Don'ts）。
- `.impeccable/design.json` 是 DESIGN.md 的 sidecar（schemaVersion 2，含 OKLCH 色阶、动效/断点/阴影扩展段与 12 个自包含组件片段）。
- 这两份契约文件在该 commit 中是**未跟踪的辅助资产**（`git ls-tree` 不含），即它们不是构建产物、没有版本化历史，只能作为一次性参考；上游改动不会自动同步。
- 站点实现事实：`_templates/styles.css`（49,959B）+ `prose.css`（44,010B）+ `script.js`（97,680B），无 bundler/minifier/hash；WebGL 海面 shader 内联在页面中；页面表面是 `ellipse 72% 115% at 50% 48%` 的径向纸光（`rgba(250,249,246,.985)` 中心 → 96% 处透明），覆盖在场景之上，`body` 无背景色；固定 75px 框架、内容列 760px、页面顶部留 151px、底部 175px；海平线 `39.4309vh`。
- 字体证据：Plantin Now Variable 的 `plantin-now-variable-license.txt` 明确 "All other parties are explicitly restricted from using the Licensed Webfonts(s)"（站点专属 MyFonts 授权）；Departure Mono 为 SIL OFL 1.1（freshports `License: OFL11`，v1.500）；Commit Mono 为 SIL OFL 1.1（`commit-mono-license.txt`，© 2023 Eigil Nikolajsen）。参考仓库同时存在 `_static/fonts/` 与 `_templates/fonts/` 两份字体，且 CSS 只 preload Departure Mono/Plantin Now，Commit Mono 是未引用死资源。

**本仓库边界**（`AGENTS.md`）：只允许 OFL 字体；Plantin Now/Plantin、Departure Mono 不进入仓库与构建产物；不复制上游 `styles.css`、shader/GLSL、文案、logo、图片；新模板系统路径；构建 WARN 视为失败。

**Hugo 实现约束**（P2 消费，规则来源 `.agents/skills/hugo-theme-dev/`，基线 v0.168.0；本变更不写模板，但这些事实决定 P1 产物怎么被消费）：

- 资源发布：`resources.Get` 只读 `assets/`（AST-01），其中的文件不会自动发布，只有在模板里调用 `.Permalink`/`.RelPermalink`/`.Publish` 才写进 `public/`（AST-02）；字体须走 `assets/fonts` + 显式发布 + `preload`（AST-14），只在 CSS `url()` 里引用会线上 404。
- 指纹与完整性：`integrity` 必须与 `crossorigin` 同写（AST-04）；CSS 内 `url()` 不被管线重写（AST-08，⟦U⟧ 以产物验证）。
- 配置合并：主题根 `hugo.toml` 只有 `params`/`menu(s)`/`outputformats`/`mediatypes` 四段参与合并（CFG-01），且必须放主题根而非 `config/_default/`（CFG-02）；自定义参数命名空间化（CFG-05）+ camelCase/snake_case 键名（CFG-06）；站点定义同名菜单时主题菜单被整体替换（CFG-11）。
- 模板落点：5 类页面 → `home.html`/`page.html`/`section.html`/`posts/page.html`/根 `404.html`（TPL-05、TPL-12）；taxonomy 若启用需 `term.html` 或用 `list.html` 兜底（TPL-06）。

**用户已确认的方案边界**（ask_user_question）：字体保持现边界（衬线用 Newsreader、等宽用 Commit Mono）；场景层 v1 用 Canvas 2D；页面类型 5 种（home / posts / post / 通用页 / 404）；设计契约落仓库根。

## Goals / Non-Goals

**Goals:**

- 让设计决策可被机器读取和生活消费：一份 frontmatter 令牌文件 + 一份 CSS 令牌文件 + 一份 sidecar，三者口径一致。
- 把「参考系统 → 本主题」的每一处取舍记录成可追溯的映射（采纳/替换/排除 + 理由 + 精确值），使 P2 模板无需二次猜测。
- 提供 3 个可双击打开的静态原型，证明字体组合、纸光/场景层级、动效时序在真实浏览器里成立。
- 建立可执行的资产与许可门禁，使非 OFL 字体、上游像素资产、参考截图永远进不了构建产物。

**Non-Goals:**

- 不写任何 Hugo 模板、`assets/css` 主题样式或 `exampleSite/` 内容（P2 才消费本契约）。
- 不打包中文字体，不做运行时 i18n（主题用 Hugo `i18n/`，见 D12）。
- 不实现 WebGL/GLSL shader，不复制上游 `styles.css`/`script.js` 的任何字节。
- 不订阅 newsletter API、不生成 OG 卡片、不运行上游 `build.py`。
- 不追求与参考站点的像素级一致：只保证「组件形态 + 层级 + 节奏」一致，字体与海面实现是声明的偏差。

## Decisions

### D1 字体角色：Newsreader（衬线）+ Commit Mono（等宽），自托管 latin 子集

- 衬线角色（display/title/reading）用 Newsreader VF（OFL，opsz 6–72 / wght 200–800，含真斜体，VF 0.43MB）；等宽角色（body/ui/form/label/code）用 Commit Mono（OFL，© Eigil Nikolajsen）。
- 自托管 `woff2`：衬线 latin 子集 + 真斜体、等宽 latin 子集；中文走系统回退链（`"Noto Serif SC", "Songti SC"` / `"Noto Sans Mono CJK SC"`）。CJK 不打包（Noto Serif SC VF 23.96MB、Noto Sans Mono CJK 15.6MB/字重）。
- 语义角色映射保持参考系统不变：`display|title|reading` → `--wf-font-serif`；`body|ui|form|label|code` → `--wf-font-mono`；同时暴露 `--wf-font-serif` / `--wf-font-mono` 供站点覆盖（站点若自持 Plantin，可 1:1 获得参考观感）。
- **替代方案与否决**：Departure Mono 虽为 OFL 且许可允许随包，但被 `AGENTS.md` 明令禁止（避免克隆观感），用户选择保持该边界 → 等宽改 Commit Mono；Source Serif 4（OFL，VF 1.15MB）作为衬线备选，但 Newsreader 更接近 Plantin 的书卷感且体积小 2.7 倍；Plantin Now 许可仅限站点，不可分发。
- **P2 落地约束**：字体必须由模板显式发布——`resources.Get "fonts/*.woff2"` → `fingerprint` → `.RelPermalink` 写进 `<link rel="preload">`，只写在 CSS `url()` 里不会产出文件（AST-01/AST-02/AST-14）；许可文本与字体同目录随包（AST-15）。

### D2 场景层：Canvas 2D 线场，WebGL 延后

- v1 用 Canvas 2D 绘制原创海面线场（正弦波线组 + 稀疏点光 + 视差），完全由令牌参数化（海平线位置、振幅、周期、光点密度、纸光强度），单文件、无依赖，`prefers-reduced-motion` 时冻结为首帧。
- 参考站点的 WebGL shader 有物理相机与星光层，复刻它不属于 P1 价值；Canvas 2D 能证明「场景层在页下、纸光在场景上」这一结构成立即可。
- **替代方案**：直接 WebGL（复杂度/移动端性能/无障碍成本过高，v0.2 再评估）；静态 PNG 场景（失去「场景常动、纸面安静」的对比叙事）；不实现场景只留纸光（失去唯一真实深度来源）。

### D3 表面三层与纸光参数

- 层级固定：`canvas.scene`（z0，`aria-hidden`、`pointer-events:none`）→ `.veil`（z1，径向纸光）→ `.grain`（z2，颗粒纹理）→ `.frame`（z3，固定框架与内容）。页面 `body` 不设背景色；无法绘制场景时纸光单独成像，内容仍可读。
- 纸光用 CSS 多重 `radial-gradient`（`ellipse 72% 115% at 50% 48%`，纸色 `.985` 中心 → `0` 于 `96%`），light/night 两套令牌值 + 900ms 交叉淡化；断点移动光心（桌面居中偏下、移动端上移）。
- 颗粒用**静态原创平铺 PNG**（≤16KB，8-bit 灰度、低对比）而非运行时 `filter`/`feTurbulence`；参考站的 `paper.png`（260px seamless）仅作纹理观感参考，字节不复制。
- **替代方案**：复制 `paper.png`/`paper-dark.png`（版权；且它们是「chrome 面板纹理」而非页面表面）；CSS 实时噪声（移动端整屏 filter 掉帧）；不设颗粒（纸光过于干净，丢掉「纸」的质感）。

### D4 动效：令牌时长 + CSS transition，View Transitions 渐进增强

- 时长令牌：页面纵向过渡 520ms/220ms、主题交叉淡化 900ms、入场 300ms、移动菜单 240ms/180ms、订阅确认扫光 720ms；缓动沿用参考系统（ease-out 系）。
- 实现只用 CSS `transition`，页面切换在支持 `View Transitions API` 时增强，不支持时退化为淡入淡出；`prefers-reduced-motion: reduce` 下位移/缩放/视差一律归零，仅保留即时状态切换。
- **替代方案**：引入 JS 动效库（新增依赖，违背 KISS 与上游无 bundler 的取向）；纯瞬时切换（失去纵向过渡的「翻信」隐喻）。
- **P2 落点**：5 类页面分别对应 `home.html`、`page.html`、`section.html`、`posts/page.html`、根 `404.html`（TPL-05、TPL-12）；场景层与纸光在 `baseof.html` 中一次性挂载，不按页面重复实现。

### D5 令牌文件与最终落点

- P1 产出 `docs/design/tokens.css`（`--wf-*` 自定义属性，含 `:root` 与 `[data-theme="night"]`、`prefers-color-scheme` 双通道）；P2 把它原样移入 `assets/css/tokens.css` 并删除 docs 副本，避免双源。
- 命名：颜色沿用语义名（`--wf-ink`、`--wf-paper`、`--wf-muted-ink`、`--wf-hairline`、`--wf-night-*`、`--wf-moonlight`、`--wf-chrome-scrim`、`--wf-star-dark`）；尺寸/间距 `--wf-space-*`；布局 `--wf-frame-block`、`--wf-page-top`、`--wf-page-bottom`、`--wf-measure`、`--wf-horizon`；断点 `--wf-bp-*`（520/800/1100）以注释常量形式给出（CSS 变量不能用于媒体查询，文档化即可）。
- 排除 `--wf-nav-overlap`（`#3a3a3a`）：DESIGN.md:219 已把它记为「测量出的例外 + 已知可访问性缺口」，不是被采纳的令牌。
- **替代方案**：直接用 `assets/css/tokens.css`（P1 无 Hugo 构建环境，无法验证被主题消费）；引入 SCSS（多一层工具链，无收益）。
- **P2 落地约束**：`assets/css/tokens.css` 须由模板 `.RelPermalink` 后才发布（AST-02）；其内部对字体的 `url()` 不会被资源管线重写（AST-08），因此路径须与 AST-14 的发布方案一致；主题默认值只能写主题根 `hugo.toml`（CFG-02）。

### D6 DESIGN.md 契约结构与 sidecar 生成

- 仓库根 `DESIGN.md` = 上游 8 章模板 + YAML frontmatter；frontmatter 严格限制在工具可识别的四组标准块：`colors` / `typography` / `rounded` / `spacing` / `components`（13 颜色、8 角色、2 圆角、11 间距、20 组件键）。
- 站点专属的扩展（OKLCH 色阶、3 层阴影词汇、动效表、断点表、9 个自包含 `wf-` 组件片段）落 sidecar 的 `extensions`；浏览器实际消费的是 CSS 变量，sidecar 不参与运行。
- 生成：P1 用 impeccable 技能 `document` 一次性生成 `.impeccable/design.json` 入库（工具在本机技能环境可用）；CI/门禁用**不依赖技能的比对脚本**检查 sidecar 的 colors/typography 键值与 frontmatter 一致、schemaVersion=2、组件片段齐全，漂移即失败。
- **替代方案**：手写 sidecar（与 frontmatter 双源、必漂移）；CI 内运行生成器（CI 无技能环境、不可复现）。

### D7 断点与布局参数

- 断点 520 / 800 / 1100（对齐参考 DESIGN.md 的 ≤520、≤800、801–1100 三档）；框架 75px（≤800 为 40px、≤520 为 28px）；内容列 `min(100%, 760px)`、≤800 为 680px、801–1100 为 `min(680px, calc(100vw - 360px))`。
- 移动端触控目标 ≥44px（参考站移动菜单即 44px）；所有逻辑属性（`inline-size`/`margin-inline`）以兼容将来 RTL。

### D8 原创资产清单与星形规范

- 四角星：8 射线（4 长轴 + 4 对角 + 菱形核心 + 中心点），导出 18/24/32px 三档 SVG；仅作 hover/focus 奖励与 logo/cursor，不作静态装饰；列表标记用文字 `✶` 而非图形。
- 光标：昼夜双态星形 SVG（`cursor-dark/light`），颜色随 light 切换而非 CSS filter。
- favicon：light/dark 两套 SVG + `apple-touch-icon`。
- 纸纹/颗粒：自行生成的平铺 PNG；海面线场：Canvas 参数化，无 GLSL。
- **替代方案**：直接沿用上游星形 SVG 路径（版权；且是「被看见的资产」，最容易被识别为复制）。

### D9 参考基线采集与 pin 策略

- 上游 pin 到 `31b1b04`，记录在 `docs/design/reference/upstream-pin.md`（commit、取用时间、DESIGN.md 行数/哈希、许可结论）。
- 保真基线截图不需要跑 `build.py`：参考仓库的 `_build/` 是完整预构建站点（含全部页面与 `static/` 资产，已验证 `404.html`/`index.html`/`posts/`/`locales/`/`static/` 齐全），本地静态 serve 后用 headless Chrome 截 1440 与 390 两档即可得真实字体基线。
- 上游更新时：人工 diff DESIGN.md → 决定是否跟进 → 重生成 sidecar → 重截基线，不做自动同步（上游契约本身不版本化）。

### D10 验收门禁（本变更交付的可执行部分）

5 项静态检查 + 1 份保真矩阵，全部写成脚本后接 CI（P2 接入）：

1. 令牌门禁：任何模板/样式出现字面色值（白名单 `transparent`/`currentColor`/`0`）即失败。
2. 字体门禁：仓库与产物内字体文件 ⊆ {Newsreader, Commit Mono}；出现 Plantin / Departure Mono 即失败。
3. 形态门禁：无 `accent` 变量、无填充按钮背景、无卡片圆角+阴影组合、无标签/chip 类名。
4. 装饰门禁：内置 SVG 仅四角星变体（白名单文件）。
5. sidecar 门禁：frontmatter 与 sidecar 键值一致、schemaVersion=2、9 个组件片段齐全。

保真矩阵 5 列（字体 A/B、表面与纸光、导航与 chrome、动效与降级、a11y 基线）逐项给「参考值 / 主题值 / 偏差声明」。

### D11 原型形态

- `docs/design/spikes/font-ab.html`、`surface.html`、`motion.html`：纯静态 HTML + 内联 CSS/JS，无构建步骤、无网络依赖（字体以相对路径引用占位文件名，由 P1 末补齐；缺字体时回退仍可评审结构）。
- 每个 spike 附 1440/390 截图与 `reduced-motion` 记录；spike 只用于决策，不进入主题布局，稳定后其结论搬进 tokens.css/DESIGN.md。

## Risks / Trade-offs

- **观感偏差（字体）**：Newsreader/Commit Mono 与 Plantin/Departure Mono 的气质差异可感知（尤其 Departure 的像素感被放弃）。→ 站点可用 `--wf-font-serif`/`--wf-font-mono` 覆盖为自持字体；A/B spike 量化偏差；在 DESIGN.md 的 Do/Don't 里声明这是唯一允许的偏差来源。
- **参考契约不可版本化**：上游 DESIGN.md/PRODUCT.md/`.impeccable` 未跟踪，pin 之外无法自动发现变更。→ pin + 快照 + 行数/哈希记录；升级走人工 diff（D9）。
- **sidecar 生成依赖技能环境**：impeccable 技能不在 CI 可用。→ 生成物入库 + 独立比对脚本（D6）。
- **全屏纸光/颗粒性能**：移动端整屏渐变 + 平铺 PNG 有合成成本。→ 颗粒为静态小图、纸光为纯渐变无 filter；spike 在真机/节流下验证；仅在 `prefers-reduced-motion` 之外启用场景动画。
- **字体自托管体积**：Newsreader VF 0.43MB、Commit Mono 多字重。→ 只出 latin 子集 woff2 并 `preload` 正文关键面；等宽只保留 400/700（参考站也只 preload 400）。
- **CJK 回退不可控**：系统字体在 Windows/macOS/Linux 上形态不同。→ 仅在中文站点上暴露；在 DESIGN.md 记录差异；不把 CJK 回退当设计资产。
- **子集化工具链**：需要 `fonttools`（pyftsubset）在开发机一次性生成，仓内不引入运行时依赖。→ 记入 tasks；生成产物入库。
- **范围膨胀**：本变更只产出文档/资产/原型，若有人顺势写模板，会跳过 P2 的骨架验证。→ 在 tasks.md 明确「不写模板」；P2 变更名 `theme-skeleton`。

## Migration Plan

- 无外部消费者、无已发布模板，属纯新增；迁移顺序：本变更（契约与资产）→ P2 `theme-skeleton` 消费 `assets/css/tokens.css` → P3 内容模型 → P4 签名能力 → P5 发布。
- 回滚：本变更全部为新增文件 + 三处文档修订，`git revert` 单个提交即可回滚；不影响任何已发布产物。

## Open Questions

- 参考基线截图是否入库：体积与「不复制」边界之间如何取舍（默认只入库 6 张关键页 × 2 档，≤2MB；P1 末定）。
- 站点覆盖字体的示例是否写入 README（属对外契约，P2 定）。
- `--wf-font-*` 覆盖通过纯 CSS 还是 Hugo params 注入（P2 实测 Hugo Pipes 后定；若走 params 须 `[params.waitforit.*]` 命名空间 + camelCase，CFG-05/CFG-06）。
- 上游 DESIGN.md 若发布新版本，转译矩阵的再同步是否需要自动化（当前人工，P3 再评估）。
