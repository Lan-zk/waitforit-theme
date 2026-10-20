# Proposal

## Why

P1（design-contract）产出了三件套设计契约（根 `DESIGN.md`、`.impeccable/design.json`、`docs/design/tokens.css`）、原创资产、字体子集与门禁脚本，但仓库里还没有任何 Hugo 模板、主题配置、i18n 与 `exampleSite`。契约目前只被三份静态 spike 和截图验证，没有在真实 Hugo 渲染管线里跑过，主题也还不能被站点引用。

P2 需要一个能被 Hugo 加载、能被 `exampleSite` 构建、能通过 CI 门禁的最小完整主题骨架：让设计契约第一次落地到模板与资源管线，同时给 P3（动态海面、页面转场、代码块、OG）留下不需要返工的页面结构。

## What Changes

- **主题壳**：`baseof.html` + `head`/`header`/`footer` 分部、固定框架（frame 75/40/28px、page-top/bottom、measure 760/680px）、首页/普通页/section/posts 列表/posts 详情/404 模板按新模板路径落地；taxonomy/term 提供兜底列表模板，避免带 tags 的站点在 `--panicOnWarning` 下构建失败。
- **内容模型落地**：文章固定 `content/posts/`，`layouts/posts/page.html` 按 section 自动匹配；信件字段 `from/to/subject` 按 Hugo 约定放进 front matter `params` 下（修正 D5 的字段位置，追加决策记录）；`archetypes/posts.md` 提供骨架。
- **表面层静态首帧**：四层结构（Canvas 线场 z0 → 径向纸光 veil z1 → 颗粒 z2 → 框架 z3）在模板中固化为元素；场景用与 reduced-motion 相同的 `phase=0` 代码路径绘制一次；主题三态（auto/day/night）通过 `data-theme` + 令牌切换，纸光/场景/颗粒 900ms 交叉淡化，reduced-motion 下无过渡。时间驱动的海面动画与页面转场留 P3，同一个渲染器只增加时间驱动，不是一次性的临时实现。
- **令牌与资产迁移**：`docs/design/tokens.css` 移到 `assets/css/tokens.css` 并删除原文件（DESIGN.md/`.impeccable` 与 gate 同步更新路径）；grain/cursor/star/favicon 发布到稳定路径；字体经 `resources.Get` → `fingerprint` → `.RelPermalink` + `preload` 发布，OFL 文本与字体同目录。
- **主题配置与公共契约**：根 `hugo.toml` 只写 `module.hugoVersion`（min 0.146.0）与 `[params.waitforit]` 默认值；默认导航由模板提供（站点声明 `menus.main` 即整体替换）；新增 `go.mod`（module `github.com/Lan-zk/waitforit-theme`）与 `LICENSE`（MIT）；不写 `theme.toml`（显示名未定）。
- **i18n 与双语**：`i18n/en.toml` + `i18n/zh.toml`，键前缀 `waitforit.`；语言切换入口仅当站点语言数 > 1 时显示；`<html lang>`/`dir`、hreflang alternate、语言切换按翻译页对应。
- **exampleSite fixture**：虚构人物与内容，覆盖首页、列表、详情、静态页、404、中英双语、长标题、空列表；同时是视觉回归基线。
- **CI**：Hugo 0.146.0 与 0.168.0 矩阵构建（`--panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings`，WARN 视为失败）、`node scripts/check-assets.mjs` 资产门禁、`--logLevel info` 弃用审计。
- **明确不做**（留 P3/P4）：README 安装段与「可安装」声明、`theme.toml`/gallery 元数据、时间驱动海面动画、页面/入场/菜单转场、View Transitions、代码块与复制、OG/Twitter meta、站内搜索/评论/分析。本变更不破坏现有契约：`design-system` 与 `asset-licensing` 主 spec 的取值与门禁一条不改。

## Capabilities

### New Capabilities

- `theme-shell`：主题页面壳与内容契约——页面类型与模板落点、posts 信件内容模型、固定框架与响应式、无 JS 可读、键盘与焦点基线、三态主题持久化、双语导航与语言切换入口。视觉取值遵循 `design-system`，不在本能力里重述令牌与表面数值。
- `theme-distribution`：主题分发与构建契约——可被 Hugo 加载的包结构（`go.mod`/根 `hugo.toml`/最低版本）、`params.waitforit.*` 默认与覆盖语义、i18n 资源、资产发布与许可文本、`exampleSite` fixture 与 CI 构建门禁。

### Modified Capabilities

无。`design-system` 与 `asset-licensing` 只在实现层被引用与验证，不修改其需求。

## Impact

- **新增**：`go.mod`、`LICENSE`、`hugo.toml`；`layouts/`（baseof/home/page/section/404、posts 两个模板、taxonomy/term 兜底、`_partials/`）；`assets/css/{tokens,style}.css`、`assets/js/{scene,ui}.js`（主题启动脚本内联在 head，避免首帧闪烁）；`i18n/{en,zh}.toml`；`archetypes/posts.md`；`exampleSite/`；`.github/workflows/ci.yml`；`docs/design/evidence/theme-skeleton/` 与 `docs/handoff/` 新文件。
- **移动/删除**：`docs/design/tokens.css` → `assets/css/tokens.css`（删原文件，CSS `url()` 相对路径改为 `../images/`）。
- **修改**：`AGENTS.md`（阶段、布局、构建命令）、`docs/decisions.md`（追加 D5 修订与 P2 实施决策）、`docs/design/fidelity-matrix.md`（补 P2 列与静态场景偏差声明）、`scripts/check-assets.mjs`（扫描路径与新目录对齐）。
- **依赖**：Hugo ≥ 0.146（CI 矩阵 0.146.0 / 0.168.0，不需要 extended），Node ≥ 22 仅用于门禁脚本；主题构建不需要 npm。本地验证需要临时获取两个 Hugo 版本二进制，不进入仓库。
- **风险**：静态首帧与参考的动态海面在「气质」上有可感差异，必须在 fidelity matrix 声明；字体/图片经 assets 管线发布后 CSS `url()` 与 `RelPermalink` 的产物路径必须实测（AST-02/AST-08）；`menus` 不合并（CFG-11），站点一旦自定义菜单就会整体覆盖主题默认菜单。README 安装段仍未写，主题继续不声称可安装。
