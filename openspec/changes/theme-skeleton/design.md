# Design

## Context

P1 已交付设计契约三件套（根 `DESIGN.md` 8 章 + frontmatter、`.impeccable/design.json`、`docs/design/tokens.css`）、原创资产（星形 SVG、光标、favicon、颗粒 PNG）、OFL 字体子集（4 个 woff2，289.7KB）与 5 项门禁脚本 `scripts/check-assets.mjs`；三个静态 spike 已验证字体、表面、令牌与动效取值。仓库目前没有 `go.mod`、`hugo.toml`、`layouts/`、`i18n/`、`exampleSite/`、`.github/`，也没有 `LICENSE` 与 `README.md`。Hugo 未安装在本机（Node 24 可用，`go` 在 `C:\Program Files\Go\bin\go.exe`），需要临时获取 0.146.0 与 0.168.0 两个标准版二进制做本地验证。

约束来源：`AGENTS.md` 的硬边界与先读清单、`docs/decisions.md`（D1–D19 + D5 待修订）、主 spec `design-system`（7 条）与 `asset-licensing`（4 条）、`docs/handoff/2026-10-20-design-contract.md` 的 P2 入口 5 步、`.agents/skills/hugo-theme-dev/` 的编号规则（基线 v0.168.0 / 最低 0.146.0）。动机与范围见 `proposal.md`，需求见 `specs/theme-shell`、`specs/theme-distribution`。

关键现状补充：官方 front matter 文档规定自定义字段必须写在 `params` 下（CNT-08），因此 D5 里 `from/to/subject` 顶层字段的写法不成立，本变更以追加方式修订（见 D2、D12）。参考基线截图 12 张（1.43MiB）在 `docs/design/reference/baseline/`，用于保真对照，不进入产物。

## Goals / Non-Goals

**Goals:**

- 单一模板树：文件命名本身决定页面类型与版式，posts 与普通页都不需要逐篇 `layout`；所有页面共享一个 `baseof.html` 骨架（TPL-05、TPL-10、TPL-16）。
- 令牌单一来源贯穿模板与脚本：`--wf-*` 只存在于 `assets/css/tokens.css`；模板、CSS、场景脚本都不出现颜色/尺寸字面量；纸光通道插值用 CSS `@property` 声明，不靠 JS 注册。
- 能在产物目录里自洽的资产模型：字体经 `resources.Get` → `fingerprint` → `.RelPermalink` 发布并用 `preload` 声明；字体 `@font-face` 由构建期生成的小 CSS 提供；颗粒/光标/favicon 发布到稳定路径，CSS 相对 `url()` 与产物位置对齐（AST-01、AST-02、AST-04、AST-08、AST-14）。
- 表层实现一次成型：P2 用与 reduced-motion 完全相同的 `phase = 0` 路径画静态首帧；P3 只加时间驱动与转场，不改标记结构、不改 CSS 层级。
- `exampleSite/` 既是可构建的 fixture，也是视觉回归与门禁的证据来源；CI 用两个 Hugo 版本证明「标准版 + 离线 + 无 Node 构建依赖」（REL-01、REL-07、REL-09）。

**Non-Goals:**

- 不做 `theme.toml` / gallery 元数据（显示名未定）、不做 README 安装段、不声称可安装。
- 不做时间驱动的海面动画、页面/入场/菜单转场、View Transitions、代码块与复制、OG/Twitter meta、站内搜索/评论/分析（P3/P4）。
- 不做 `outputFormats`/`mediatypes` 定制：Hugo 默认输出已含 RSS 与 sitemap，主题不自建输出格式（CFG-13、CFG-14）。
- 不做 CJK 字体打包、不做运行时翻译、不做 i18n 菜单名翻译机制（菜单由站点按语言声明，见 D3）。
- 不改 `DESIGN.md`、sidecar 与两份主 spec 的任何取值；P2 只是消费它们。

## Decisions

### D1 模板树与页面映射

```text
layouts/
  baseof.html                 # 唯一骨架：head / 跳过链接 / 表层 / header / main / footer
  home.html                   # 首页（TPL-05）
  page.html                   # 普通页与静态页
  section.html                # 通用 section 列表
  posts/section.html          # posts 列表（信件索引）
  posts/page.html             # posts 详情（信件版式）
  taxonomy.html  term.html    # 兜底列表，避免带 tags 的站点 WARN（TPL-06）
  404.html                    # 根级 404（TPL-12）
  _partials/                  # head / styles / scene / header / nav / theme-toggle
                              # lang-switch / mobile-menu / footer / letter-meta /
                              # post-row / star / scripts
```

- 所有子模板只写 `define "main"`（内容区），骨架、head、header、footer 全在 `baseof.html`；子模板里出现的任何 `define` 之外的赋值都会让 base 失效且不报错（TPL-16、TPL-17），因此子模板不允许写变量。
- `posts/section.html` / `posts/page.html` 由目录映射自动命中（TPL-04、TPL-10），fixture 与将来的站点都不写 `layout`。
- `taxonomy.html` 与 `term.html` 只做「标题 + 页面行列表」，复用同一 partial；这样启用默认 taxonomy 的站点不会因缺模板产生 WARN（TPL-06）。`list.html`、`all.html` 一律不建（TPL-09 的兜底留给 Hugo，缺失模板在 CI 下会变成硬失败，见 D10）。
- 404 用单一 `layouts/404.html`：Hugo 按语言渲染并注入 `.Language`，文案从 i18n 取；不建 `404.<lang>.html`，避免两份内容漂移（TPL-12）。
- 替代方案：旧 `layouts/_default/`（弃用，TPL-01/02）与逐篇 `layout`（违背 D5，加维护面）都被排除。

### D2 内容模型：`params` 下的信件字段

- 文章固定 `content/posts/`；信封字段读 `.Params.from` / `.Params.to` / `.Params.subject`，日期用顶层 `.Date`，摘要用顶层 `.Description`；缺失字段只隐藏对应元信息，不输出空标签（CNT-08）。
- `archetypes/posts.md` 生成 `title` / `description` / `date` / `params.from/to/subject` 骨架；`hugo new content` 的默认路径由站点 `contentDir` 决定。
- 需要把 D5 的字段位置写进决策记录：`docs/decisions.md` 追加 `D5-R 信件字段位于 front matter params 下（supersedes D5 的字段位置表述）`，说明保留字段不能自定义、`.Params` 读取路径、旧写法迁移方式（顶层改到 `params` 下）。历史条目不改写（AGENTS 的 append-only 约定）。
- 日期显示用 `.Date | time.Format ":date_long"`（按语言本地化）；若 CI 的 0.146.0 输出不稳定，退回 i18n 里的固定布局键（见 Open Questions）。

### D3 主题配置、参数契约与默认导航

根 `hugo.toml` 只写两类内容：`[module.hugoVersion] min = "0.146.0"`（CFG-15，版本语义唯一来源；`theme.toml` 不写版本）与 `[params.waitforit]` 默认值（CFG-01、CFG-02、CFG-05、CFG-06）：

```toml
[module.hugoVersion]
  min = "0.146.0"

[params.waitforit]
  brand = ""          # 空则用 site.Title
  defaultTheme = "auto"  # auto | day | night
  hero = ""           # 空则用 i18n waitforit.hero
  footer = ""         # 空则用 i18n waitforit.footer.note
  [params.waitforit.features]
    sea = true
    transitions = false  # P3 启用
```

- 参数命名沿用 D13 的 `params.waitforit.*` 命名空间；模板一律 `site.Params.waitforit.<key>`（CFG-08），嵌套按深合并取站点值（CFG-07）。
- **默认导航不在主题配置里声明 `menus.main`**：菜单条目不支持按语言命名，主题级菜单会把英文名带进中文站点；改为 header partial 的兜底：`.Site.Menus.main` 非空时渲染站点菜单，为空时渲染内置的四个站内入口（posts / purpose / values / join），链接用 `relLangURL` 生成、标签用 i18n 键。站点一旦声明 `menus.main` 就整体替换默认导航（CFG-11 的语义不变）。这同时避免主题 `pageRef` 指向站点不存在的页面时可能产生的构建警告（CFG-10：`url` 只给外部链接）。
- 站点自建菜单用 `[[languages.<lang>.menus.main]]`（`pageRef` + 按语言命名），`exampleSite` 就是这样演示的；`AGENTS.md` 布局里「默认 menus」的表述在本变更里改为「默认导航由模板提供，菜单由站点声明」并记入 D20。
- 不写 `outputFormats`/`mediatypes`：默认输出已包含 RSS/sitemap，主题无权也不需要改站点输出（CFG-13、CFG-14）。
- `go.mod`：`module github.com/Lan-zk/waitforit-theme` + `go 1.22`（CFG-19）；本变更只建立包形状，不加依赖、不打 tag、不写 README 安装说明。
- `LICENSE`：MIT，版权方沿用仓库 owner `Lan-zk`（D17）；`CREDITS.md` 已声明代码许可，本变更补齐 LICENSE 文件。

### D4 资源发布与字体 CSS 生成

- 样式分三块：`assets/css/tokens.css`（从 `docs/design/tokens.css` 原样迁移，只改 grain 相对路径为 `../images/…`，并补 `@property --wf-veil-rgb` 注册）、`assets/css/style.css`（主题样式）、构建期生成的 `fonts.css`。
- `head.html` 里：`$tokens` 与 `$style` 用 `resources.Concat "css/main.css"` 串联 → `minify` → `fingerprint` → 单个 `<link rel="stylesheet" integrity="{{ .Data.Integrity }}" crossorigin="anonymous">`（AST-02、AST-04；integrity 必须与 crossorigin 同写）。
- 字体：对 4 个 woff2 执行 `resources.Get` → `fingerprint`，用 `resources.FromString` 生成 `fonts.css`（`@font-face` 的 `src` 用指纹后的 `.RelPermalink`，字体 URL 是站点绝对路径，不受 CSS 所在目录影响；CSS `url()` 不会被管线重写，AST-08）；`fonts.css` 也 `fingerprint` 后在主样式之前链接。首屏字体 `Newsreader` regular 与 `Commit Mono` 400 另发 `<link rel="preload" as="font" type="font/woff2" crossorigin>`；斜体与 700 不 preload（AST-13、AST-14）。
- OFL 文本与字体同目录进入产物（AST-15）：用 `resources.Get "fonts/newsreader-OFL.txt"` + `.Publish`/`.RelPermalink` 的显式发布，保证 `public/fonts/` 里与 woff2 同级；`CREDITS.md` 仍只在仓库根，不发布。
- 图片类资产发布到稳定路径：`resources.Get "images/grain-light.png" | resources.Copy "images/grain-light.png"` 后取 `.RelPermalink` 触发发布（AST-02），光标、favicon 同理；favicon 另有 `apple-touch-icon.png`。CSS 里的 `url("../images/grain-light.png")` 相对主样式表 `/css/main.<hash>.css` 解析为 `/images/…`，与发布路径一致（AST-08，产物实测见任务）。
- 星形 SVG 用 partial 内联输出（保留 `currentColor`），不做资源发布；SVG 不需要图像管线处理（AST-10）。
- 替代方案：把 `@font-face` 写进 `style.css`（指纹后路径未知，排除）；用静态 `static/fonts/`（`resources.Get` 读不到，且失去指纹，AST-01/02 排除）；用 `resources.PostCSS`/npm（引入 Node 构建依赖，违背 REL-09 与主题零构建依赖目标，排除）。

### D5 表面层结构与场景静态首帧

- 结构固定在 `_partials/scene.html`：`.wf-scene`（内含 day/night 两张 `<canvas aria-hidden="true">`，CSS 背景 `var(--wf-paper)` 保证无 JS 时仍是纸色）→ `.wf-veil` → `.wf-grain`（day/night 两层，各自 `data-theme` 以便读到对应令牌）→ 框架层（header/main/footer）。z-index 全部走 `--wf-z-*` 令牌，和 P1 契约的 0/1/2/3 一致。
- 场景脚本 `assets/js/scene.js`：读 day 与 night 两套调色板（`getComputedStyle` 实读 `--wf-paper`、`--wf-hairline`、`--wf-horizon`，读法沿用 spike：临时设 `documentElement[data-theme]` 再恢复），把两组画布各画一次 `phase = 0` 的静态首帧；`devicePixelRatio` 上限 2，resize 重绘。绘制函数保留 `phase` 参数并在 P3 接 `requestAnimationFrame`，P2 只调用 `draw(0)`。
- 主题切换的视觉过渡完全由 CSS 完成：两张画布与两层颗粒的 `opacity` 用 `var(--wf-motion-theme)` 线性过渡，纸光用 `--wf-veil-rgb` 通道过渡（`tokens.css` 里 `@property --wf-veil-rgb { syntax: "<number>+"; inherits: true; initial-value: 250 249 246 }` 才能插值；这不是新取值，只是注册既有令牌）。场景颜色随 `data-theme` 切换由 CSS opacity 选择哪张已画好的画布承担，JS 不在切换时重绘——减少一次主线程长任务，也让无 JS 的 `auto` 模式仍能靠媒体查询正确显示。
- `features.sea = false` 时模板不输出 `<canvas>`，`.wf-scene` 仍保留并铺纸色，正文照常可读；veil 与 grain 不受影响。
- 这与 `design-system`「三层页面表面」「纸光与主题模式」「动效时序与降级」一致：值不改，只把「时间驱动」这一维留到 P3；`reduced-motion` 下 `--wf-motion-*` 归零（令牌层已有），静态首帧本就是最终形态。

### D6 三态主题与无闪烁启动

- `head.html` 里在样式表之前输出一小段内联脚本：读 `localStorage["wf-theme"]`，值为 `day`/`night` 时设 `documentElement.dataset.theme`；非法或缺失保持 `auto`（由 CSS `prefers-color-scheme` 接管）；同时给 `documentElement.classList` 加 `js`（供 CSS 启用 JS 版控件）与 `is-boot`（首帧关闭过渡，`requestAnimationFrame` 两次后移除，避免载入时 900ms 渐变）。内联脚本是最小必要的，因为外部脚本会晚于首帧执行而产生闪烁。
- 切换控件：header 里一个按钮循环 `auto → day → night`，可见标签用 i18n（`waitforit.theme.auto/day/night`），另有 `aria-label` 说明当前模式；点击写 localStorage 并改 `data-theme`。无 JS 时按钮由 `.js` 缺失规则隐藏，页面按系统偏好显示（`prefers-color-scheme`）。
- 切换按钮的键盘可达与焦点环沿用 `--wf-focus-*` 与 `--wf-tap-target` 令牌；移动端隐藏主菜单时它仍留在顶栏。

### D7 无 JS 与 reduced-motion 降级矩阵

| 能力 | 有 JS | 无 JS | reduced-motion |
| --- | --- | --- | --- |
| 纸色 + 纸光 + 颗粒 | 令牌驱动 | 同左（纯 CSS） | 同左，无过渡 |
| 海面线场 | `phase=0` 静态首帧 | 无线条，只剩纸色（`.wf-scene` CSS 背景） | 静态首帧，无 rAF |
| 主题三态 | auto/day/night + 记忆 | 仅 auto（系统偏好） | 同有 JS，但无 900ms 过渡 |
| 移动菜单 | 按钮折叠 + aria-expanded + Escape | 导航链接直接可见（CSS 仅在 `.js` 下隐藏） | 同有 JS，无过渡 |
| 语言切换 | 链接列表 | 同左（无需 JS） | 同左 |

- 无 JS 时正文、导航链接、语言切换全部可用；场景缺线条是已声明降级，不修（P3 也不修，服务端渲染海面超出范围）。
- 媒体查询 `prefers-reduced-motion: reduce` 在令牌层把动效时长归零，组件不需要各自写 `@media`。

### D8 i18n、双语导航与 hreflang

- 主题提供 `i18n/en.toml`（必需回退）与 `i18n/zh.toml`（CFG-23、CFG-24），键统一 `waitforit.` 前缀：`hero`、`footer.note`、`nav.menu`、`nav.close`、`theme.auto/day/night`、`theme.label`、`lang.label`、`posts.empty`、`posts.read`、`404.title`、`404.body`、`skip`、`letter.from/to/subject`、`home.posts` 等。站点同名键覆盖（CFG-23）；模板用 `T`，缺失键为空字符串（CNT-18），所以每个键都必须两边都写，CI 的 `--printI18nWarnings` 兜底。
- `<html lang="{{ site.Language.LanguageCode }}" dir="{{ site.Language.Direction }}">`（CNT-20）；`head.html` 用 `range .AllTranslations` 输出 `<link rel="alternate" hreflang="{{ .Language.Locale }}" href="{{ .Permalink }}">`（CNT-19，用 Locale 不用 Lang）。
- 语言切换：`range site.Languages`；当前页在 `.AllTranslations` 里有对应语言就链到该翻译，否则链到 `relLangURL "/"`（语言首页）。只有一种语言时不渲染。两个语言的场景用内联链接列表，不引入 disclosure/ARIA menu（少于 3 种语言时更简单，也无 JS 依赖）；语言数量增多再评估折叠。
- 菜单名不做 i18n 键翻译：站点在 `[[languages.<lang>.menus.main]]` 里按语言命名；主题默认导航的四个入口用 i18n 键（见 D3）。
- 内容翻译按 Hugo 约定用文件名后缀（`purpose.zh.md`，CNT-21）。`404` 文案走主题 i18n，不建每语言模板。

### D9 exampleSite fixture

```text
exampleSite/
  hugo.toml                    # theme = "waitforit-theme"、en/zh、站点菜单、params 覆盖
  content/_index.md            # 英文首页
  content/_index.zh.md         # 中文首页
  content/posts/_index.md      # 英文 posts section 标题
  content/posts/_index.zh.md   # 中文 posts section，故意 0 篇文章 → 空状态
  content/posts/2026-09-12-…  # 3 篇英文信件，1 篇超长标题，params.from/to/subject
  content/purpose.md           # 故意加一篇（英文静态页）
  content/purpose.zh.md
  content/values.md / .zh.md
  content/join.md / .zh.md
```

- 全部人物、邮箱、机构均为虚构（示例域名邮箱）；站点标题与品牌用虚构名，不出现真实个人信息（D11）。
- `hugo.toml` 演示：站点 `params.waitforit` 覆盖品牌与首屏；`features.sea` 保持默认；每语言分别声明菜单，演示 CFG-11 的整体替换语义。
- fixture 同时是回归基线：P2 证据截图（home/post/list/404 × 1440/390、home 另出 night）放 `docs/design/evidence/theme-skeleton/`，与 `docs/design/reference/baseline/` 并排评估，偏差写进 `docs/design/fidelity-matrix.md`。

### D10 CI 与门禁

- `.github/workflows/ci.yml`：`ubuntu-latest`，矩阵 `hugo: ["0.146.0", "0.168.0"]`（REL-07 的最低支持版 + 当前稳定版）；步骤：checkout → `actions/setup-node@v4`（node 22，门禁脚本用）→ `peaceiris/actions-hugo@v3`（`hugo-version: ${{ matrix.hugo }}`，`extended: false`）→ `node scripts/check-assets.mjs` → 构建 → 弃用审计。
- 构建命令（仓库根执行，锁死 WARN 为失败）：

```bash
hugo --source exampleSite --themesDir ../.. \
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings \
  --gc --cleanDestinationDir
```

- 弃用审计单独一步：`hugo --source exampleSite --themesDir ../.. --logLevel info 2>&1 | tee /tmp/hugo-info.log` 后 `! grep -qi deprecat /tmp/hugo-info.log`（REL-05、REL-08：INFO 级弃用不受 `--panicOnWarning` 管控）。
- `check-assets.mjs` 的扫描集本来就包含 `layouts/` 与 `exampleSite/`（P1 预埋），本变更只需把令牌文件路径从 `docs/design/tokens.css` 改到 `assets/css/tokens.css`；新模板里只允许 `var(--wf-*)`，内联样式属性同样受令牌门禁约束。`tokens.css` 自身仍跳过字面值检查（它定义值）。
- 不做 extended、不装 npm 依赖、构建不发网络请求（REL-01、REL-09）；`hugo mod` 相关步骤本变更不需要（无依赖、未打 tag）。
- 视觉回归的自动像素对比留 P4；P2 用证据截图 + 人工并排（D12 的「1440/390 截图回归」在 P2 以 fixture + 证据目录满足，工具化在 P4）。

### D11 P3 接口与不返工约束

- 场景脚本的外形固定为「读令牌 → `draw(phase)` → P2 调一次 `draw(0)`」；P3 只把调用改成 `requestAnimationFrame` 循环并读 `--wf-motion-*` 决定何时启用，模板、CSS 层级、画布数量不变。
- 页面/入场/菜单转场在 P3 通过 `features.transitions` 开关接 View Transitions 与 CSS 过渡；P2 已有 `--wf-motion-*` 令牌与 `is-boot` 机制，P3 不需要改 `baseof.html` 结构（可能只加一个 class 钩子）。
- 代码块与 OG 在 P3 加 partial 与 head 输出，不改变现有 partial 的命名与职责。

### D12 决策、文档与证据同步

- `docs/decisions.md` 追加：`D5-R`（信件字段在 `params` 下）与 `D20 P2 主题骨架实施决策`（静态首帧边界；默认导航由模板提供；字体 CSS 构建期生成；`@property` 注册在 tokens.css；tokens.css 移到 `assets/css/`；主题不改 outputFormats；LICENSE 版权方）。历史条目不改写。
- `AGENTS.md` 更新：阶段改为「P2 主题骨架已完成」、布局树加入 `go.mod`/`hugo.toml`/`layouts/`/`assets/js`/`i18n/`/`archetypes/`/`exampleSite/`/`test/`/`.github/`、设计指针里的 tokens 路径改为 `assets/css/tokens.css`、构建命令指向带 `--themesDir` 的完整版本。
- 迁移 `docs/design/tokens.css` 后所有活文档的路径同步：`DESIGN.md`（第 196 行的路径句）、`scripts/check-assets.mjs`、`docs/design/fidelity-matrix.md`、`docs/design/transfer-matrix.md`；历史 handoff 与归档 change 不改（冻结记录）。三个 spike 的 `../tokens.css` 相对路径改为 `../../assets/css/tokens.css` 并重跑一次 spike 验证，保持证据可复现。
- `docs/handoff/` 新增 `2026-10-20-theme-skeleton.md`：完成状态、P3 入口、仍需 P4 的清单、Open Questions 结转。

## Risks / Trade-offs

- [静态首帧与参考的动态海面气质不同] → 在 `fidelity-matrix.md` 的「动效与降级」行声明偏差与 P3 关闭路径；证据截图对照基线。
- [CSS 相对 `url()` 与产物目录错位导致颗粒/光标 404] → 构建后实际请求 `public/` 文件验证；若主样式不在 `/css/`，改为生成 CSS 用绝对 `.RelPermalink`。
- [默认导航 `relLangURL` 与站点 `menus.main` 替换语义混淆] → 文档写清「站点菜单存在即整体替换」，fixture 演示两种路径，spec 场景覆盖。
- [`@property` 在旧浏览器不支持，纸光不做通道插值] → 仍能瞬时换色且无报错；支持目标为现代 Chrome/Safari/Firefox，`is-boot` 与 reduced-motion 不受影响。
- [Hugo 0.146.0 与 0.168.0 的日期本地化输出不同] → 用 fixture 断言日期文案存在而非精确串；必要时退回 i18n 固定布局。
- [无 JS 用户看不到海面线条] → 明示降级（D7），正文可读优先；不值得为此引入服务端渲染。
- [tokens.css 迁移造成证据/文档路径失效] → 改动清单固定在 D12，迁移后跑门禁 + spike 复验。
- [门禁误报新模板的内联 style] → 现有白名单（transparent/currentColor/inherit/none/0）与 `rgb(var(--wf-…))` 折叠规则已覆盖，新增模板只写 `var(--wf-*)`；若出现误报改扫描规则而不是放宽门禁。
- [fixture 英文 3 篇、中文 0 篇造成双语不对称] → 这是刻意覆盖空状态；在 fixture README/注释里写明。

## Migration Plan

1. 先补包形状：`go.mod`、`LICENSE`、根 `hugo.toml`（含 `module.hugoVersion` 与 params 默认值）。
2. 迁令牌：`git mv docs/design/tokens.css assets/css/tokens.css`，改 grain 相对路径与 `@property`；同步 `scripts/check-assets.mjs`、`DESIGN.md`、`fidelity-matrix.md`、`transfer-matrix.md` 与三个 spike 的相对路径。
3. 写模板与样式：`baseof` + 页面模板 + partials + `assets/css/style.css` + `assets/js/{scene,ui}.js`（主题启动内联） + 字体 CSS 生成逻辑；此时可先用最小 fixture 构建。
4. 写 fixture 与 i18n：`exampleSite/`、`i18n/en.toml`、`i18n/zh.toml`、`archetypes/posts.md`。
5. 本地用临时 Hugo 0.146.0 / 0.168.0 跑完整构建与门禁，修到零 WARN；出证据截图并更新矩阵。
6. 加 `.github/workflows/ci.yml`，让 CI 在远端证明矩阵与门禁；写 handoff、更新 AGENTS/decisions（D5-R、D20）。
7. 回滚策略：本变更没有站点消费者与数据迁移，回滚即 revert 该次提交；`docs/design/tokens.css` 在 git 历史中保留。

## Open Questions

- `.Date | time.Format ":date_long"` 在 CI 两个 Hugo 版本与 en/zh 下是否稳定输出预期文案？（若不稳定，改用 i18n 日期布局键，不改 spec。）
- 默认导航的四个入口在实际站点缺页时是否会产生可感知问题（链接 404）？P2 只在 exampleSite 验证；若风险大，P4 文档要求站点显式声明菜单，或缺省导航缩为「文章 + 首页」。
- 两个语言的切换在「当前页没有翻译」时落到语言首页是否符合预期？spec 已如此约定，P4 可用真实站点反馈调整。
- `exampleSite` 的虚构站点名与人物是否需要长期保留同一套，还是 P4 换成更中性的名字？（只是内容选择，不影响实现。）
