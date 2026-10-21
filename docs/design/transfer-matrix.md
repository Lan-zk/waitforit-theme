# 参考系统 → 主题转译矩阵

> 当前场景已按 D26 改为 Resting Lamb 的单色低伏草地与窄溪，地形/岸线静止，仅草梢与水纹缓动；不再追求 Earendil 波面保真。当前契约见根 DESIGN.md，新证据见 [resting-lamb-scene](evidence/resting-lamb-scene/README.md)。下文 P1–P3 海面参数与对照作为历史保留；“字体为唯一观感偏差”等旧表述已由 D26 的场景语义调整补充。


> 状态：`design-contract` 任务 2.1 交付物（证据文档，不新增权威）。设计契约的权威顺序见 `decisions.md` D16（:261）：根 `DESIGN.md`（8 章 + YAML frontmatter）是唯一权威，`.impeccable/design.json` 是其机器可读 sidecar，`assets/css/tokens.css` 是浏览器实际消费的 `--wf-*` 令牌；本文件逐条记录「做什么、不做什么、为什么」，三者冲突时回改它们，而不是改本文件。

**口径**

- 上游指 `E:\File\self\github\website` 的 pin 快照（§7）。文中 `DESIGN.md:<行>`、`.impeccable/design.json:<行>` 都指该快照，仅作证据。
- 主题值以 `assets/css/tokens.css` 为准，变量名逐字照抄。判定基于两个已复核的计数：上游 frontmatter 26 色 / 8 排版角色 / 3 圆角 / 12 间距 / 22 组件键，正文 8 章，sidecar 12 个 `ds-` 片段；本仓契约 13 色 / 8 角色 / 2 圆角 / 11 间距 / 20 组件键 / 9 个 `wf-` 片段。
- 结构可借鉴，字节与像素不可复制（D19 / `decisions.md`:215）：不复制上游 `styles.css`、`prose.css`、`script.js`、WebGL/GLSL shader、`paper.png`、字体、logo、星形 path 与文案。
- 阅读顺序：§0 口径与总览 → §1 颜色 → §2 排版 → §3 组件键 → §4 `ds-` 片段与字体 A/B（4.1 待回填）→ §5 断点/布局/层级/动效 → §6 计数验算 → §7 pin 证据。

## 0. 总览

### 0.1 判定图例

- **采纳**：上游的键、值或形态原样进入主题契约；允许只换资产载体或媒体查询写法，语义与数值不变。
- **替换**：保留角色或形态，替换实现或值（字体族、星形资产、缓动曲线、选择器命名等），理由逐条写。
- **排除**：不进入主题契约，写明理由；`wf- 映射` 写「无」。
- `wf- 映射` 一律写 `tokens.css` 里的变量名。为表格可读，`--wf-type-ui` 是 `--wf-type-ui-family`、`--wf-type-ui-size`、`--wf-type-ui-line` 三个变量的族简写，其他角色（`display/title/reading/body/form/label/code`）同理；sidecar 片段名写成 `wf-<kebab>`，由上游 `ds-<kebab>` 逐词映射（§4.2）。

### 0.2 计数总览

| 维度 | 上游 | 主题 | 差异 | 详见 |
| --- | --- | --- | --- | --- |
| 颜色令牌 | 26 | 13 | 采纳 13；排除 13（`nav-overlap` 1 + `pi-*` 12） | §1 |
| 排版角色 | 8 | 8 | 8/8 替换字体族，字号/行高/字重/字距 8/8 采纳 | §2 |
| 组件键 | 22 | 20 | 采纳 20；排除 2（`pi-terminal`、`pi-terminal-night`） | §3 |
| sidecar 片段 | 12 | 9 | 采纳 9；排除 3（Keycap、Pi replay terminal、Star emblem） | §4.2 |
| 圆角 | 3 | 2 | `none: 0` 是 CSS 默认值，不设令牌 | §5.1 |
| 间距 | 12 | 11 | `hair: 1px` 并入 `--wf-hairline`（颜色与线宽同处声明） | §5.1 |
| 正文 | 8 章 | 8 章 | 章名与顺序沿用（D6） | §6 |

## 1. 颜色令牌：26 = 13 采纳 + 13 排除

上游 frontmatter `colors` 26 键（`DESIGN.md`:5–30），正文规则是「One Palette, Two Lights」（`DESIGN.md`:225）：一个色板，昼夜两种光照，不出现第二个色板。主题保留 13 键（`tokens.css`:23–35），昼夜切换靠 `[data-theme]` 重绑变量（`tokens.css`:159–168），组件不感知光照。

### 1.1 采纳（13）

| 上游键 | 上游值 | 判定 | wf- 映射 | 理由 |
| --- | --- | --- | --- | --- |
| `ink` | `#353431` | 采纳 | `--wf-ink` | 日间正文/标题/控件文字的唯一近黑暖灰；值不改。夜间由 `--wf-ink: var(--wf-night-ink)` 重绑，组件不分支。 |
| `muted-ink` | `rgba(25, 24, 22, 0.6)` | 采纳 | `--wf-muted-ink` | 日期、meta 键名、占位文字的第二次序；60% 在黑字上仍可读，又不会与 hairline 混同。 |
| `hairline` | `rgba(39, 37, 34, 0.18)` | 采纳 | `--wf-hairline` | 全站唯一线宽（1px）颜色：分隔、代码块上下沿、表格线；18% 不构成边框容器。 |
| `paper` | `#faf9f6` | 采纳 | `--wf-paper`；同时是 `--wf-veil-rgb` 的日间值（`250 249 246`，`tokens.css`:41） | 纸色只作「光」与面板底，不作 body 背景（`DESIGN.md`:223「Paper Is Not a Background」）；页面底仍是 scene/veil 层。 |
| `pure-white` | `#ffffff` | 采纳 | `--wf-pure-white` | 日间 chrome 悬停提亮一档；与 `night-bright` 同值但语义不同（日间提亮 vs 夜间文字/标题），保留两个键以免误用。 |
| `night-ink` | `rgba(240, 240, 240, 0.8)` | 采纳 | `--wf-night-ink` | 夜间正文；80% 白在 `#2e2d2b` 上对比度足够，且比纯白柔和。只经 `--wf-ink` 重绑使用。 |
| `night-bright` | `#ffffff` | 采纳 | `--wf-night-bright` | 夜间标题与链接悬停的纯白，与日间 `pure-white` 对称。 |
| `night-muted` | `rgba(240, 240, 240, 0.6)` | 采纳 | `--wf-night-muted` | 夜间弱化文字，与日间 `muted-ink` 对称。 |
| `night-hairline` | `rgba(244, 242, 238, 0.18)` | 采纳 | `--wf-night-hairline` | 夜间分隔线；带暖调而非纯白，避免夜间出现冷灰边框。 |
| `night-paper` | `#2e2d2b` | 采纳 | `--wf-night-paper`；同时是 `--wf-veil-rgb` 的夜间值（`46 45 43`，`tokens.css`:165） | 夜间纸色；与日间同属暖调，夜间整体仍读作「纸」而不是「深色 UI」。 |
| `moonlight` | `rgba(255, 255, 255, 0.95)` | 采纳 | `--wf-moonlight` | 场景上所有 chrome 文字/图标的默认色；95% 白留出 hover 到纯白的提亮空间。 |
| `chrome-scrim` | `rgba(30, 30, 30, 0.95)` | 采纳 | `--wf-chrome-scrim` | 语言菜单浮层底；配 `blur(10px)` 与唯一的 Menu scrim 投影（sidecar shadows），不用于大面积面板。 |
| `star-dark` | `#1c1b1a` | 采纳 | `--wf-star-dark`；`--wf-star` 在 `:root` 取它，夜间取 `--wf-moonlight`（`tokens.css`:38、164） | 日间光标与内联星形的最深色；主题不复制上游 SVG 字节，用原创 8 射线四角星 + 令牌换色（D8）。 |

### 1.2 排除（13）

| 上游键 | 上游值 | 判定 | wf- 映射 | 理由 |
| --- | --- | --- | --- | --- |
| `nav-overlap` | `#3a3a3a` | 排除 | 无 | `DESIGN.md`:219 把它记为「纸上唯一发亮的 chrome 表面」的实测例外，正文已知缺陷清单（:318）自认浅色导航叠底是可访问性缺口。主题的 chrome 恒在 scene/veil 之上，没有「在纸上开亮洞」的形态；D5 明令不在主题令牌里保留它。 |
| `pi-bg-day` | `#f7f6f6` | 排除 | 无 | 终端卡片日间底色（`DESIGN.md`:211 界定 `pi-*` 只服务 Pi 终端预览，never used for page chrome）；主题无终端回放，引入它会与 `--wf-paper` 争用「底色」语义。 |
| `pi-bg-night` | `#21252c` | 排除 | 无 | 夜间终端底色；第二套冷色调会直接破坏「One Palette, Two Lights」（`DESIGN.md`:225），`--wf-night-paper` 是暖调。 |
| `pi-text-day` | `#3b3f41` | 排除 | 无 | 与 `ink` `#353431` 近义但偏冷，会造出第二个「近黑」，维护时无法解释何时用哪个。 |
| `pi-text-night` | `#dee0e1` | 排除 | 无 | 与 `night-ink`（`rgba(240,240,240,.8)`）语义重复。 |
| `pi-accent-day` | `#7459b4` | 排除 | 无 | 紫色 accent；D10 门禁禁止 accent 色，主题的强调只靠字重、斜体与星形。 |
| `pi-accent-night` | `#a798d7` | 排除 | 无 | 夜间紫色 accent；除禁 accent 外，还会与 `moonlight` 抢高亮。 |
| `pi-success-day` | `#337e58` | 排除 | 无 | 成功态语义色；主题是静态文档站，没有成功/失败状态 UI 承载它。 |
| `pi-success-night` | `#68b78d` | 排除 | 无 | 同上，且为「预留未来」引入颜色违反 YAGNI。 |
| `pi-warning-day` | `#8f6802` | 排除 | 无 | 警告色；主题无警告组件（无搜索、无表单校验、无终端），保留即无载体。 |
| `pi-warning-night` | `#cd9a22` | 排除 | 无 | 同上。 |
| `pi-border-day` | `#a2b7e0` | 排除 | 无 | 蓝灰边框；主题的边界只允许 hairline（线，不是容器边框），蓝灰会引入第二种「光」。 |
| `pi-border-night` | `#6185cc` | 排除 | 无 | 同上；夜间也不允许冷色描边。 |

## 2. 排版角色：8

上游 8 角色（`DESIGN.md`:31–79，sidecar `typographyMeta` 8 项）保留角色名、字号、行高、字重、字距，只替换字体族（D1）：`display`/`title`/`reading` 用 Newsreader（OFL，可变字重 200–800，真斜体），`body`/`ui`/`form`/`label`/`code` 用 Commit Mono（OFL，400/700）。字体栈收在 `--wf-font-serif` / `--wf-font-mono`（`tokens.css`:69–72），站点可在 `params` 覆盖。

| 角色 | 上游值（族 / 尺寸 / 字重 / 行高 / 字距 / 斜体） | wf- 映射（主题值） | 判定 | 理由 |
| --- | --- | --- | --- | --- |
| `display` | PlantinNow, 'Plantin MT Pro', Georgia, serif / `clamp(1.25rem, 0.875rem + 1.5vw, 2.5rem)` / 400 / 1.15 / 0 / 斜体 true | `--wf-type-display`；family 指向 `var(--wf-font-serif)`，size 同上游 clamp，line 1.15；weight/tracking 用全局 `--wf-type-weight` 400、`--wf-type-tracking` 0 | 替换（字体族） | 品牌个性最强的角色：Plantin 授权只允许上游自用（upstream-pin §4），必须换可分发衬线；Newsreader 的 6–72px 光学字号让 20–40px 大字保持细节，真斜体保留 hero 的书写感。 |
| `title` | PlantinNow 族 / 1.25rem / 400 / 1.15 / 0 / 斜体 true | `--wf-type-title`；family 指向 serif，size 1.25rem，line 1.15 | 替换（字体族） | 文章标题与正文形成 20px / 18–20px 的弱层级（只差字重与斜体），Newsreader italic 承担标题语气。 |
| `reading` | PlantinNow 族 / `clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)` / 400 / 1.6 / 0 / 斜体 false | `--wf-type-reading`；family 指向 serif，size 同上游 clamp，line 1.6 | 替换（字体族） | 18–20px、行高 1.6 的长文阅读区；Newsreader 为长文设计，比 Plantin 更耐读，中文回退 Noto Serif SC。 |
| `body` | 'Departure Mono', 'SFMono-Regular', ui-monospace, monospace / 0.9375rem / 400 / 1.6 / 0 / 斜体 false | `--wf-type-body`；family 指向 `var(--wf-font-mono)`，size 0.9375rem，line 1.6 | 替换（字体族） | Departure Mono 虽是 OFL，但 AGENTS.md 明令不进仓库与构建（避免克隆观感）；Commit Mono 同为可分发等宽，字面率与 x 高度接近，15px/1.6 度量不变。 |
| `ui` | Departure Mono 族 / 0.9375rem / 400 / 1.25 / 0 | `--wf-type-ui`；size 0.9375rem，line 1.25 | 替换（字体族） | 导航、MENU、页脚的 chrome 行高固定 1.25；等宽大写承载「机械感」，Commit Mono 在 15px 下笔画清晰。 |
| `form` | Departure Mono 族 / 0.9375rem / 400 / 1.6 / 0 | `--wf-type-form`；size 0.9375rem，line 1.6 | 替换（字体族） | 订阅行文字与正文同为 15px，只换族；表单不做视觉重设计。 |
| `label` | Departure Mono 族 / 0.8125rem / 400 / 1.25 / 0 | `--wf-type-label`；size 0.8125rem，line 1.25 | 替换（字体族） | 13px 的眉标签、动作链接、键帽；等宽使大写标签可预测对齐。 |
| `code` | Departure Mono 族 / 0.8125rem / 400 / 1.846 / 0 | `--wf-type-code`；size 0.8125rem，line 1.846 | 替换（字体族） | 13px/24px 代码块；行高 1.846 让中文注释与拉丁代码混排时行距一致。 |

补充三点，避免把「替换字体族」误读成「重做排版」：

- **字重/字距全局化**：上游 8 角色都是 weight 400、letter-spacing 0，主题提为 `--wf-type-weight` 400 与 `--wf-type-tracking` 0。强调用 Newsreader 斜体或 Commit Mono 的 700 真字重，不使用合成粗体（`DESIGN.md`:258），也不再使用 0.5px `text-shadow` 的像素加粗。
- **斜体不进令牌**：sidecar `typographyMeta` 标记 `display`/`title` 的 `italic: true`、`reading` 的 `italic: false`；`tokens.css` 没有 italic 令牌，斜体由组件样式用 Newsreader 真斜体声明（上游同样写在组件 CSS 里）。
- **不引入第三张脸**：上游 KaTeX 是「Two Faces, No Third」（`DESIGN.md`:254）的已知例外；主题 v1 不引入 KaTeX（D14），不为数学公式开第三字体面。

## 3. 组件键：22 组件键 = 20 采纳 + 2 排除

上游 frontmatter `components` 22 键（`DESIGN.md`:97–172）。主题 20 键进入根 `DESIGN.md` frontmatter（D6），删去 `pi-terminal` 与 `pi-terminal-night`。下表按上游顺序；`wf-` 映射是该组件消费的令牌，族简写见 §0.1。

| 上游键 | 上游值 | 判定 | wf- 映射 | 理由 |
| --- | --- | --- | --- | --- |
| `center-logo` | width 125px | 采纳 | `--wf-logo-center` | 首页居中品牌星，主题唯一品牌标记仍由四角星承担；125px 沿用，组件只换星形资产（`assets/images/star-32.svg`）。 |
| `corner-logo` | width 32px | 采纳 | `--wf-logo-corner` | 内页固定框架角落的 32px 星；与居中版共用资产，尺寸进令牌。 |
| `menu-trigger` | `{typography.ui}` + `{colors.moonlight}` | 采纳 | `--wf-type-ui`、`--wf-moonlight`；hover 用 `--wf-pure-white` | 导航唯一入口：等宽大写单词 + 右侧星形；95% 白留出 hover 提亮空间。 |
| `nav-link` | `{typography.ui}` + `{colors.moonlight}` | 采纳 | `--wf-type-ui`、`--wf-moonlight` | 菜单内文字链接继承 chrome 行；不作按钮、不加下划线。 |
| `nav-link-hover` | `{colors.pure-white}` | 采纳 | `--wf-pure-white` | hover 提亮是日间唯一亮色变化；夜间 `#fff` 仍是最高亮档，不需要单独令牌。 |
| `nav-star` | 15px × 15px | 采纳 | `--wf-nav-star` | 跟随导航链接的 15px 小星；尺寸沿用，星形用原创资产。 |
| `theme-toggle` | `{typography.ui}` + `{colors.moonlight}` + padding `6px 10px` | 采纳 | `--wf-type-ui`、`--wf-moonlight`、`--wf-theme-toggle-padding` | 主题切换是 D14 v1 能力；保留 mono 大写与 6/10 内距，不改造成图标按钮。 |
| `lang-menu` | bg `{colors.chrome-scrim}` + `{typography.ui}` + rounded `{menu}` + padding `6px 0` + width 160px | 采纳 | `--wf-chrome-scrim`、`--wf-type-ui`、`--wf-radius-menu`、`--wf-lang-menu-width`；纵内距用 `--wf-space-xs`（6px） | 全站唯一浮层，语言数 >1 才渲染（D6）；160px + 4px 圆角 + scrim 底 + blur，是唯一「叠在场景上的面板」。 |
| `lang-item` | `{typography.ui}` + padding `8px 16px` | 采纳 | `--wf-type-ui`、`--wf-lang-item-padding` | 行高与内边距沿用；选中态用纯白文字 + 代码列，不加底色块。 |
| `footer-mark` | `{typography.ui}` + `{colors.moonlight}` | 采纳 | `--wf-type-ui`、`--wf-moonlight` | 固定框架底部的 mono 标记；文案由 `params`/i18n 提供，不硬编码。 |
| `letter-meta` | `{typography.body}` + `{colors.ink}` + padding `0 0 24px` | 采纳 | `--wf-type-body`、`--wf-ink`、`--wf-space-section`（24px） | 文章信头（from/to/subject，D5）是主题签名；24px 下距对齐 section 间距，36px 到正文见 §4.2。 |
| `reading-body` | `{typography.reading}` + `{colors.ink}` + width 760px | 采纳 | `--wf-type-reading`、`--wf-ink`、`--wf-measure` | 阅读列宽是保真核心：760px 约 70–80 个西文字符或 34–38 个汉字。 |
| `post-date` | `{typography.body}` + `{colors.muted-ink}` | 采纳 | `--wf-type-body`、`--wf-muted-ink` | 列表日期；等宽数字让行内日期对齐，弱化但不小于 15px。 |
| `post-title` | `{typography.title}` + `{colors.ink}` | 采纳 | `--wf-type-title`、`--wf-ink` | 文章名/列表标题用衬线 title；斜体由组件样式声明。 |
| `disclosure` | `{typography.title}` + `{colors.ink}` + padding `7px 0` | 采纳 | `--wf-type-title`、`--wf-ink`；7px 竖内距保留字面量（与 `--wf-disclosure-chevron` 同值但语义不同） | 「Values」折叠项标题；`details`/`summary` 原生交互，无 JS 依赖。 |
| `disclosure-chevron` | 7px × 7px | 采纳 | `--wf-disclosure-chevron` | 展开箭头尺寸；旋转 −45°→45° 的动效在 sidecar `wf-disclosure` 片段里。 |
| `apply-link` | `{typography.label}` + `{colors.ink}` | 采纳 | `--wf-type-label`、`--wf-ink` | 文字级动作链接（join 页申请等）；label 角色让它与正文区分，但不做按钮。 |
| `email-input` | `{typography.form}` + `{colors.ink}` + bg transparent + padding `0` | 采纳 | `--wf-type-form`、`--wf-ink`；`transparent` / `0` 是门禁白名单字面值（D10） | 主题唯一输入形态：透明无边框订阅行（sidecar Subscribe line）；P2 若需要表单直接复用，不引入第二种输入样式。 |
| `code-block` | `{typography.code}` + bg transparent + padding `1.5rem 0` | 采纳 | `--wf-type-code`、`--wf-ink`、`--wf-hairline`（上下 1px 线）；`1.5rem` 纵内距保留字面量 | 代码块不是卡片：透明底 + 上下 hairline + 无圆角；1.5rem 随根字号，与 24px 网格脱钩是上游原意。 |
| `kbd` | `{typography.label}` + rounded `{key}` | 采纳 | `--wf-type-label`、`--wf-radius-key`；键帽环投影见 sidecar shadows 的 Keycap ring | 键盘键帽：5px 圆角是全站仅有的两个圆角之一；ring 阴影只作词汇保留（片段排除见 §4.2）。 |
| `pi-terminal` | bg `{colors.pi-bg-day}` + `{typography.label}` + rounded `{menu}` + padding `12px 14px 10px` + height `30rem` | 排除 | 无 | Pi 产品终端卡片：`pi-*` 色已排除（§1.2），紫色 accent 违反禁 accent，填充卡片+边框形态违反「无卡片」（D10）；主题没有终端回放，保留它会强迫第二套色板与阴影。 |
| `pi-terminal-night` | bg `{colors.pi-bg-night}` | 排除 | 无 | 同上；只是同一终端卡片的夜间底色，不单独存在理由。 |

## 4. 字体 A/B 与 sidecar 片段

### 4.1 字体 A/B 结论（已回填，任务 4.1）

四组合（A Newsreader×Commit Mono、B Source Serif 4×Commit Mono、C Newsreader×系统 mono、D Source Serif 4×系统 mono）实测：字体加载均 2/2（`document.fonts` 4 个 face 全部 `loaded`），1440 与 390 两档 `scrollWidth` 均等于 `clientWidth`（无横向溢出）。结论：**维持 Newsreader + Commit Mono（D1/D9-R）**。

- **衬线**：A/B 字面差异主要在 display/title 尺寸可辨；reading 尺寸（clamp 1.125–1.25rem）下两种衬线的行宽与可读性接近，都不溢出 760px 列。Newsreader 斜体更接近手写书卷气（Source Serif 4 斜体更几何），且 B 组需额外 99,008B（48,464 + 50,544B）临时 woff2 仅作对照，故不引入 Source Serif 4。
- **等宽**：C/D 组的系统 mono（ui-monospace → Windows Consolas）在 code 行的字面与宽度明显不同；Commit Mono 的 0.6em 等宽节奏是排版契约的一部分，且系统栈跨平台不可控（Consolas 仅 Windows）、无真 700，保留 Commit Mono（`ds-code` 的合成加粗已在 §4.2 换成 700）。
- **体积**：Newsreader VF 单文件覆盖 wght 200–800 + 真斜体，自托管子集 125.8KB + 140.7KB；Source Serif 4 完整 VF 1.15MB，A/B 用的只是临时 latin 400（48.5KB，不入库）。
- 证据：`docs/design/spikes/shots/font-ab-1440x900.png`、`font-ab-b-1440x900.png`、`font-ab-390x844.png`、`font-ab-reduced-1440x900.png`；复现方式与全部读数见 `docs/design/spikes/README.md`。

### 4.2 sidecar ds- 片段：12 ds- 片段 = 9 采纳 + 3 排除

上游 sidecar `components` 共 12 个 `ds-` 片段（按原顺序）。主题 sidecar 保留 9 个、排除 3 个，片段必须自包含（class 前缀 `wf-`，不放外部依赖）。转译只动五类东西，不改形态：

- **变量前缀**：`--ds-*` → `--wf-*`；保留 `var(--wf-x, 当前值)` 回退字面值——片段是自包含的文档示例，脱离 `tokens.css` 直接粘贴仍要能渲染（上游同样带回退），回退值必须等于 `tokens.css` 当前值；页面模板与样式表里只允许无回退的 `var(--wf-*)`，颜色字面值由 D10 门禁拦截（sidecar 是文档，不在门禁扫描范围）。
- **夜间选择器**：上游 `.ds-night` 作用域类 → `[data-theme="night"]`（`tokens.css` 的重绑方式）；自动模式由 `prefers-color-scheme` 的同一组声明覆盖。
- **类名**：`ds-` → `wf-`，BEM 子元素同步（如 `ds-code__kw` → `wf-code__kw`）；片段在 sidecar 里的显示名保留上游叫法。
- **字体与星形**：`--ds-serif` → `--wf-font-serif`，`--ds-mono` → `--wf-font-mono`；内联 data-URI 星形换成主题原创 SVG 资产（`assets/images/star-*.svg`，用 `currentColor` 或 mask），不复制上游 path 与 data URI。
- **组件级度量覆盖保留**：Letter meta / Post row 的 `line-height: 1.5`、Language menu 按钮的 `1.4` 是片段对角色默认值的局部覆盖，不是新令牌；主题片段照抄这些覆盖。

| 上游片段 | 形态要点 | 判定 | wf- 映射 | 理由 |
| --- | --- | --- | --- | --- |
| Text link（`ds-text-link`） | 700 字重；dotted 下划线（0.06em 厚、0.14em 偏移）hover 变实线；hover 到 ink / night-bright；`refersTo` 为空 | 采纳 | `wf-text-link`；`--wf-ink`、`--wf-night-bright`、`--wf-hairline` | 全站唯一正文链接形态：不加颜色、不加按钮。700 对 Newsreader（VF 200–800）与 Commit Mono（真 700）都成立，不再需要合成加粗。 |
| Action link（`ds-action-link`） | 13px mono 大写；gap 6px；15px 星形 `opacity 0→1`（0.2s）后以 1150ms linear 持续自旋；hover 虚线；夜间星形换白色 data URI；`refersTo: apply-link` | 采纳 | `wf-action-link`；`--wf-type-label`、`--wf-nav-star`、`--wf-ink`、`--wf-motion-hover` | 文字级动作入口（APPLY/RSS/feed）。替换点是星形载体：data-URI 星形换原创资产（D8 禁止复制上游 path），自旋时长并入 hover 令牌（§5.3）。 |
| Menu trigger + panel（`ds-menu-trigger` / `ds-menu-panel`） | MENU 按钮：ui 角色大写、moonlight→pure-white；面板为右对齐 mono 链接列、gap 8px、hover dotted 下划线；`ds-light-surface` 变体用于浅色表面；描述称移动端变成全屏纸面板（片段 CSS 未含该媒体查询）；`refersTo: nav-link` | 采纳 | `wf-menu-trigger` / `wf-menu-panel`；`--wf-type-ui`、`--wf-moonlight`、`--wf-pure-white`、`--wf-paper`、`--wf-tap-target`、`--wf-motion-menu-open`、`--wf-motion-menu-close` | 导航在 800px 以下收成全屏菜单；全屏面板是「纸」的唯一大面积使用，仍不是 body 背景。`.ds-light-surface` 变体不转译——主题没有「亮表面导航」（`nav-overlap` 已排除）；移动端全屏面板由 P2 按 D7 自写（44px 触控目标 + 纸色 + grain）。 |
| Letter meta（`ds-letter-meta`） | 两列 grid `max-content minmax(0,1fr)`；1ch 列距；`padding-bottom: 24px`；`margin-bottom: 36px`；底部 1px hairline；mono 15px/1.5；键名 `opacity .6`；`refersTo: letter-meta` | 采纳 | `wf-letter-meta`；`--wf-type-body`、`--wf-hairline`、`--wf-space-section`（24px）；36px 无令牌，片段内写字面量 | 文章信头是内容模型（from/to/subject，D5）的视觉表达；键名弱化用 opacity .6 而不是第二个灰色。 |
| Post row（`ds-post-row`） | 标题/日期同基线两列；`column-gap: 0.6em`；日期 mono 15px/1.5 muted-ink；标题 serif 1.25rem/1.15 italic；hover dotted 下划线；夜间 night-bright / night-muted；`refersTo: post-title` | 采纳 | `wf-post-row`；`--wf-type-body`、`--wf-type-title`、`--wf-muted-ink`、`--wf-ink`、`--wf-night-muted`、`--wf-night-bright` | 列表行没有卡片、缩略图、分隔块；行间只靠排版与 hairline，夜间标题提亮到 night-bright。 |
| Values disclosure（`ds-disclosure`） | `details`/`summary`；7px 边框 chevron 旋转 −45°→45°（0.2s ease）；serif italic 标题；列表用 `✶` 字形、`padding-inline-start: 1.4em`、`margin: 6px 0`；`refersTo: disclosure` | 采纳 | `wf-disclosure`；`--wf-disclosure-chevron`、`--wf-type-title`、`--wf-ink`、`--wf-space-xs`（列表 6px 间距） | 折叠内容用原生 details，无 JS 可读；`✶` 是文本字形而不是星形资产，与 D8「星形只作装饰/光标」不冲突。 |
| Subscribe line（`ds-subscribe`） | 唯一表单控件；`field-sizing: content`；`min-width: 17ch`；透明无边框；`↵` 提示（muted、top 2px）；placeholder muted-ink；无按钮、Enter 提交；`refersTo: email-input` | 采纳 | `wf-subscribe`；`--wf-type-form`、`--wf-ink`、`--wf-muted-ink`、`--wf-motion-subscribe`（720ms 确认扫光） | 输入即行，没有按钮和边框；`field-sizing` 属渐进增强，`min-width: 17ch` 兜底不支持它的浏览器（目标浏览器验证见 §5.4）。 |
| Code block（`ds-code`） | 透明、无圆角；上下 1px hairline；13px/1.846；四个语法类：kw、str、com；kw 用 `text-shadow: 0.5px 0` 加粗，str/com muted，com 斜体；`refersTo: code-block` | 采纳（实现替换） | `wf-code`；`--wf-type-code`、`--wf-ink`、`--wf-hairline` | 形态采纳；但 0.5px `text-shadow` 是 Departure Mono 无粗体可用的合成加粗手法（`DESIGN.md`:258 的前提），Commit Mono 有真 700，片段改用 `font-weight: 700`，避免像素级加粗与跨平台差异。 |
| Keycap（`ds-kbd`） | `padding: 0.1875em 0.375em`；5px 圆角；`0.875em`/500；双层 10% ring 阴影（夜间换白色 10%）；`refersTo: kbd` | 排除 | 无（sidecar shadows 保留 Keycap ring 词汇） | 这是 pi 文档的键盘 chrome 片段；主题页面没有 kbd 密集表面，片段会为不存在的场景引入第二套小零件。`kbd` 组件键仍保留样式契约（§3 第 20 行），需要时按 `--wf-radius-key` + ring 词汇拼出。 |
| Pi replay terminal（`ds-pi-terminal`） | pi 12 色第二套色板；4px 圆角；`padding: 12px 14px 10px`；0.75rem/1.5；紫色 accent；`refersTo: pi-terminal` | 排除 | 无 | Pi 终端回放的产品 UI：`pi-*` 12 色已排除，紫色 accent 违反门禁，填充+描边卡片违反「无卡片」。主题无此功能，片段会引入第二色板与终端字体尺寸。 |
| Language menu（`ds-lang-menu`） | 唯一浮层：160px；chrome-scrim 底；4px 圆角；`backdrop-filter: blur(10px)`；`box-shadow: 0 8px 32px rgba(0,0,0,.4)`；边框 `rgba(255,255,255,.15)`；行 `8px 16px`（1fr auto、12px 列距）；hover 白 10% wash；选中纯白；代码列 13px/opacity .5 | 采纳 | `wf-lang-menu`；`--wf-chrome-scrim`、`--wf-radius-menu`、`--wf-lang-menu-width`、`--wf-lang-item-padding`、`--wf-type-ui`；blur/投影/边框在片段内联 | 唯一浮层与唯一「叠在场景上的面板」；保留边框与 blur，因为 scrim 在亮纸上有边缘发虚问题。语言数 ≤1 不渲染（D6），CSS 存在也不影响布局。 |
| Star emblem（`ds-emblem`） | 上游 logo path（viewBox `120 21 84 153`）；32px；`fill: currentColor`；日间 ink / 夜间 `#ffffff`；`refersTo: corner-logo` | 排除 | 无；星形由 `assets/images/star-{18,24,32}.svg` 提供，颜色走 `--wf-star` | 上游 logo 是资产与 path，不是可复用的组件令牌；D8 明令不复制上游星形路径，主题用原创 8 射线四角星。32px 与 `corner-logo` 键一致（§3 第 2 行），品牌标记归 Colors/Shapes 章管。 |

## 5. 参考值 → 主题值：断点、布局、层级、动效

只记录 §1–§4 未覆盖的参考值与差异，全部对齐 `tokens.css`。

### 5.1 断点、布局、圆角与间距

| 上游参考 | 主题值（令牌） | 判定 | 说明 |
| --- | --- | --- | --- |
| `small` 520px | `--wf-bp-mobile: 520px`（注释常量）；媒体条件写字面 `520px` | 采纳 | CSS 变量不能用于媒体查询，常量以注释保留；`520px` 字面量在媒体条件里不算令牌违规（D10 只看颜色/尺寸声明）。 |
| `medium` 800px | `--wf-bp-tablet: 800px`；媒体 `800px` | 采纳 | 框架 75→40px、阅读列 760→680px、display 字号上限 2.5→2rem 都在此切换。 |
| `wide` 1100px | `--wf-bp-desktop: 1100px`；媒体 `1100px` | 采纳 | 801–1100 阅读列改为 `min(680px, calc(100vw - 360px))`，给侧边 chrome 留位。 |
| `post-row` 32.5em | 并入 `--wf-bp-mobile` 520px | 替换（合并） | 32.5em 在 16px 根字号下 = 520px；上游列表行坍缩与手机断点同值，主题用同一个断点，不新增第四个。 |
| `frame` 75px（≤800 40px，≤520 28px） | `--wf-frame-block` 75px / 40px / 28px | 采纳 | 固定框架内缩三档照抄。 |
| `page-top` 151px、`page-bottom` 175px | `--wf-page-top: calc(var(--wf-frame-block) + 76px)`；`--wf-page-bottom: calc(var(--wf-frame-block) + 100px)`；75px 时恰为 151/175 | 采纳 + 外推 | 上游只声明 75px 下的 151/175，未给 ≤800/≤520 的页边距值；主题让页边距随框架联动（推断项，P2 视觉验收如需可回退为固定值）。 |
| `measure` 760px；≤800 680px；801–1100 `min(680px, calc(100vw - 360px))` | `--wf-measure: min(100%, 760px)` + 两条媒体规则 | 采纳 | 阅读列宽是保真核心，三档都照抄。 |
| `horizon` 39.4309vh | `--wf-horizon: 39.4309vh` | 采纳 | 海平线位置决定首屏星与标题的关系，逐字保留。 |
| 触控目标 44px | `--wf-tap-target: 44px` | 采纳 | 移动端所有 chrome 可点区域不小于 44px（D7）。 |
| 圆角 3 项：`none: 0`、`menu: 4px`、`key: 5px` | `--wf-radius-menu: 4px`、`--wf-radius-key: 5px` | 采纳 2 + 排除 1 | `none: 0` 是 CSS 默认值，不设令牌；需要直角处直接不写 `border-radius`。 |
| 间距 12 项 | 11 个令牌：`--wf-space-{xs,sm,md,lg,xl,section,block,horizon-gap}`（8）+ `--wf-frame-block` / `--wf-page-top` / `--wf-page-bottom`（3） | 采纳 11 + 合并 1 | `hair: 1px` 并入 `--wf-hairline`（颜色与线宽同一处声明），不单列线宽间距令牌。 |

### 5.2 层级与纸光/颗粒

- **上游**：没有 body 背景色；页面是 WebGL 海面 + 纸光 veil + 颗粒纹理；veil 是 `72% × 115%` 的椭圆、`50% 48%` 定位、中心 `rgba(250,249,246,.985)` 到 96% 处透明；上游不公布 z-index。
- **主题**：四层固定顺序 `--wf-z-scene: 0` → `--wf-z-veil: 1` → `--wf-z-grain: 2` → `--wf-z-frame: 3`（D3）。veil 的 size/position/stop/alpha 全部令牌化（`tokens.css`:40–54）；夜间 `--wf-veil-rgb: 46 45 43` 与 `--wf-night-paper` 同值（`#2e2d2b`）。grain 用原创 `grain-light.png` / `grain-dark.png`（各 ≤16KB），`120px`、日间 opacity .06 / 夜间 .08。scene 用 Canvas 2D 线场替代 WebGL（D2，声明偏差：视觉目标一致，实现与性能预算不同）。
- **阴影**：上游 4 条，主题保留 3 条词汇 + 替换 1 条。Menu scrim（`0 8px 32px rgba(0,0,0,.4)`）→ 语言菜单唯一投影；Sky-legibility（`0 2px 8px rgba(0,0,0,.5)`）→ 404 星形在亮纸上的可读性；Keycap ring（双层 10%）→ 词汇保留（片段排除，见 §4.2）；Pixel-thickening（`0.5px 0 currentColor`）→ 排除，Commit Mono 有真 700（§2）。
- **面板纹理**：上游用 paper tile 纹理；主题用全页 grain 层 + `--wf-paper` 面板底色，不制作第二套纹理资产（`Grain: static original PNG ≤16KB`，D3）。

### 5.3 动效

| 上游条目（sidecar motion） | 上游值 | 主题令牌 | 判定 | 说明 |
| --- | --- | --- | --- | --- |
| Hover color | 200ms ease | `--wf-motion-hover: 180ms` | 替换 | 统一为 180ms（菜单/链接/星形淡入共用），200ms 与 180ms 在感知阈值内。 |
| Page enter | 520ms ease | `--wf-motion-page-enter: 520ms` | 采纳 | 页面入场。 |
| Page leave | 220ms ease-out | `--wf-motion-page-exit: 220ms` | 采纳 | 页面退场，快于入场。 |
| Content swap | 150ms ease-out | 无 | 排除 | 无 htmx（D7）；原生 MPA + View Transitions 没有「内容交换」这个动作。 |
| Content enter | 300ms ease | `--wf-motion-entrance: 300ms` | 采纳 | View Transitions 的内容入场。 |
| Theme cross-fade | 900ms `cubic-bezier(0.333333,0,0.666667,1)` | `--wf-motion-theme: 900ms` + `--wf-ease` 同曲线 | 采纳 | 昼夜纸光交叉淡变；该曲线成为全站唯一缓动令牌。 |
| Star spin | 1150ms linear infinite | 无 | 替换（不单列令牌） | 星形 hover 自旋并入 `--wf-motion-hover` 驱动（spike 4.3）；若 P2 需要持续慢自旋，再新增一个自旋专用时长令牌并同步 sidecar（§5.4 开放问题）。 |
| Hero star spin | 850ms linear infinite | 无 | 替换（不单列令牌） | 同上；主题没有独立 hero 星形第二态，尺寸/速度与 Action link 星一致。 |
| Mobile menu in | 240ms `cubic-bezier(0.22,1,0.36,1)` | `--wf-motion-menu-open: 240ms` | 替换（缓动） | 时长采纳，缓动统一到 `--wf-ease`，避免三套贝塞尔。 |
| Mobile menu out | 180ms ease-in | `--wf-motion-menu-close: 180ms` | 替换（缓动） | 同上。 |
| Code reveal | 540ms ease-out | 无 | 排除 | 主题代码块不做滚动触发的分块显影；无 JS 时也必须完整可读。 |
| Text sweep | 720ms ease | `--wf-motion-subscribe: 720ms` | 采纳 | 订阅行的确认扫光。 |
| 404 fade | 1000ms ease + 2000ms delay | 无 | 排除 | 主题 404 不做 2s 延迟出现；延迟会惩罚导航失败的用户。 |

汇总：上游 13 条动效收敛为 8 个时长令牌（`--wf-motion-{page-enter,page-exit,theme,entrance,menu-open,menu-close,subscribe,hover}`）+ 1 个缓动 `--wf-ease`；上游的 ease / ease-out / ease-in / linear / 专用贝塞尔收敛为单一 `--wf-ease`。`prefers-reduced-motion: reduce` 下 8 个时长全部归零（`tokens.css`:208–219），与上游行为一致。

### 5.4 开放问题（交 P2）

- `field-sizing: content` 的浏览器支持需在 P2 目标浏览器实测；不支持时 `min-width: 17ch` 兜底已写进 `wf-subscribe` 片段。
- 慢速自旋（1150ms / 850ms）是否值得专用令牌，待 P2 视觉验收决定；当前按 §5.3 用 `--wf-motion-hover` 观察。
- 上游未声明 ≤800 / ≤520 的 `page-top` / `page-bottom` 值；主题按 frame 联动（§5.1），若与上游截图对比出现像素偏差，以主题算式为准并记录到 spike。

## 6. 计数验算

- 颜色：26 = 13 采纳 + 1 nav-overlap 排除 + 12 pi-* 排除。§1.1 恰好 13 行采纳；§1.2 恰好 13 行排除（`nav-overlap` 1 + `pi-*` 12）。
- 排版：8 角色 = 3 衬线替换 + 5 等宽替换（度量 8/8 采纳，§2）。角色总数与上游 frontmatter `typography` 8 及 sidecar `typographyMeta` 8 一致。
- 组件：22 组件键 = 20 采纳 + 2 排除。§3 表格恰好 22 行，排除项为 `pi-terminal`、`pi-terminal-night`。
- sidecar：12 ds- 片段 = 9 采纳 + 3 排除。§4.2 表格恰好 12 行；9 个采纳片段即根 sidecar 的 9 个 `wf-` 片段，与 `upstream-pin.md`:31 的「9 个 `wf-` 片段」一致。
- 行数复核：§1.1 13 行 + §1.2 13 行 + §2 8 行 + §3 22 行 + §4.2 12 行 = 68 行判定；每行都有「采纳/替换/排除」之一、理由、`wf-` 映射或「无」。
- 其他差异：圆角 3 = 2 采纳 + 1 排除（`none: 0` 不设令牌）；间距 12 = 11 采纳 + 1 合并（`hair: 1px` 并入 `--wf-hairline`）；正文 8 章 = 8 章。
- 与契约的一致性：13 色 / 8 角色 / 2 圆角 / 11 间距 / 20 组件键进入根 `DESIGN.md` frontmatter（任务 4）；9 个 `wf-` 片段 + 3 条阴影 + 8 条动效 + 3 个断点进入 `.impeccable/design.json`；本文件出现的每个 `--wf-*` 变量（族简写展开后）都能在 `assets/css/tokens.css` 找到定义。

## 7. 上游 pin 与证据

逐条判定所依据的快照固定如下（证据文件：`docs/design/reference/upstream-pin.md`；`upstream-pin.md`:3 声明的判定依据与本节一致）：

| 项 | 值 |
| --- | --- |
| 仓库 | `https://github.com/earendil-works/website`（本地 clone `E:\File\self\github\website`） |
| pin commit | `31b1b0429425f7d5af914afa4d29165688d71a3f`，subject `Update pi-durable-on-cloudflare.md` |
| commit 作者/时间 | Christian Klotz `<hello@christianklotz.co.uk>`，2026-10-16T20:50:50+01:00 |
| 取用时点 | 2026-10-20T16:20:23+08:00 |
| 许可 | Apache-2.0，`LICENSE` 9,164 B，无 NOTICE 与版权行 |
| `DESIGN.md` | 318 行 / 23,274 B / sha256 `ef6ac366e9db9d68401a67922c2c466c199a3fed4e039b3ea669ec43db28757b` |
| `.impeccable/design.json` | 43,450 B / sha256 `d034ff0bf900765be080b7d0c26977bc13c78b1cfb2cd75fb90597004e02686e` / `schemaVersion: 2` |
| 快照状态 | 脏工作区（`M build.py`；未跟踪 `DESIGN.md`、`PRODUCT.md`、`.impeccable/`）→ `_build/` 不能与远端逐字节对齐，`DESIGN.md` 与 sidecar 只用 sha256 固定 |
| 上游计数 | frontmatter 26 色 / 8 排版角色 / 3 圆角 / 12 间距 / 22 组件键；正文 8 章；sidecar 12 个 `ds-` 片段 |

复算命令（全部只读；不在仓库内落任何文件）：

```powershell
$up = 'E:\File\self\github\website'
Get-FileHash "$up\DESIGN.md", "$up\.impeccable\design.json" -Algorithm SHA256 |
  Format-Table Path, Hash -AutoSize
Get-Item "$up\DESIGN.md", "$up\.impeccable\design.json" | Select-Object Name, Length
(Get-Content "$up\DESIGN.md").Count   # 318

$j = Get-Content "$up\.impeccable\design.json" -Raw | ConvertFrom-Json
$j.schemaVersion                    # 2
$j.components.Count                 # 12
$j.motion.Count                     # 13
$j.breakpoints.Count                # 4
$j.extensions.colorMeta.PSObject.Properties.Count       # 26
$j.extensions.typographyMeta.PSObject.Properties.Count  # 8
```

`DESIGN.md` frontmatter 的 5 个 block 键数由顶层 block 内键行计数复核：`colors` 26、`typography` 8、`rounded` 3、`spacing` 12、`components` 22（`components` 在 l.97–172 连续排列，可直接点行）。

**再同步条件**：若上游 `DESIGN.md` 或 `.impeccable/design.json` 的 sha256 发生变化，本矩阵不自动继承；按 D19 重新逐条判定，并同步根 `DESIGN.md`、sidecar 与 `docs/design/reference/baseline/` 截图（`decisions.md`:221）。
