# Tasks

## 1. 环境与包形状

- [x] 1.1 在仓库外临时获取标准版 Hugo 0.146.0 与 0.168.0（优先 `CGO_ENABLED=0 go install github.com/gohugoio/hugo@vX.Y.Z`，失败则下载官方 zip）；验证：两个可执行文件分别跑 `hugo version`，输出包含 `v0.146.0` 与 `v0.168.0` 且不带 `extended`，仓库内无二进制残留。
- [x] 1.2 新增根 `go.mod`：`module github.com/Lan-zk/waitforit-theme` + `go 1.22`，无依赖、无 `require`；验证：`go list -m` 输出该模块路径，`go mod tidy` 不新增任何行（CFG-19）。
- [x] 1.3 新增根 `LICENSE`（MIT，版权行 `Copyright (c) 2026 Lan-zk`）；验证：文件存在且 `LICENSE` 全文为标准 MIT 文本，`CREDITS.md` 的「代码许可 MIT」与之一致。
- [x] 1.4 新增根 `hugo.toml`：只含 `[module.hugoVersion] min = "0.146.0"` 与 `[params.waitforit]` 默认值（`brand`、`defaultTheme`、`hero`、`footer`、`features.sea`、`features.transitions`），不写 outputFormats/mediatypes/menus（CFG-01、CFG-02、CFG-05、CFG-15）；验证：临时最小站点里 `hugo config` 输出包含 `module.hugoVersion.min` 与合并后的 `params.waitforit` 键。
- [x] 1.5 建立 `exampleSite/` 最小骨架（`hugo.toml` 指向 `theme = "waitforit-theme"` 与 `content/_index.md`），先用临时空模板跑通 `hugo --source exampleSite --themesDir ../..`；验证：构建退出 0，`exampleSite/public/index.html` 生成，`git status` 不显示 `public/`（.gitignore 已覆盖 `public/`、`resources/`、`.hugo_build.lock`）。

## 2. 令牌迁移与门禁同步

- [x] 2.1 `git mv docs/design/tokens.css assets/css/tokens.css`，把 grain 的 `url("../../assets/images/…")` 改为 `url("../images/…")`，并在 `:root` 前补 `@property --wf-veil-rgb { syntax: "<number>+"; inherits: true; initial-value: 250 249 246; }`（注册既有令牌，不新增取值；AST-08 产物对齐前提）；验证：文件仍在 `git ls-files` 中（不是删除+新增），`grep -n "@property\|../images/grain"` 命中新内容，旧路径无残留。
- [x] 2.2 更新 `scripts/check-assets.mjs` 的令牌来源路径为 `assets/css/tokens.css`；验证：`node scripts/check-assets.mjs` 五项全 PASS 且退出 0；临时放 `assets/css/_probe.css`（`.probe { color: #FF0000; }`）后退出 1 并报出文件名与行号，删除探针后恢复退出 0。
- [x] 2.3 同步活文档与 spike 的令牌路径：`DESIGN.md`（“the stylesheet the theme actually loads”那句）、`docs/design/fidelity-matrix.md`、`docs/design/transfer-matrix.md` 改指 `assets/css/tokens.css`；三个 spike 的 `../tokens.css` 改为 `../../assets/css/tokens.css`；验证：全仓 `grep -rn "docs/design/tokens.css"` 只剩历史 handoff 与归档 change，headless Chrome 打开 `docs/design/spikes/surface.html?theme=day` 读到的 `--wf-ink` 仍为 `#353431`。

## 3. i18n 与布局骨架

- [x] 3.1 新增 `i18n/en.toml` 与 `i18n/zh.toml`，键统一 `waitforit.` 前缀（`hero`、`footer.note`、`nav.menu`、`nav.close`、`theme.auto/day/night`、`theme.label`、`lang.label`、`posts.empty`、`404.title`、`404.body`、`skip`、`letter.from/to/subject`、`home.posts`、`nav.posts/purpose/values/join`），两文件键集合完全一致（CFG-23、CFG-24）；验证：用 Python 比较两侧键集合无差集，构建带 `--printI18nWarnings` 时无缺失告警。
- [x] 3.2 写 `layouts/baseof.html` 与 `_partials/head.html`、`_partials/styles.html`、`_partials/scripts.html`：head 输出 title/description/canonical/hreflang 占位、CSS bundle（tokens+style `resources.Concat` → `minify` → `fingerprint` + `integrity` + `crossorigin`）、构建期生成的 `fonts.css`（`@font-face` 用 fingerprint 后 `.RelPermalink`）、首屏 `preload`（Newsreader regular、Commit Mono 400）、favicon light/dark + apple-touch-icon、内联主题启动脚本占位（AST-02、AST-04、AST-13、AST-14、AST-15）；`baseof.html` 提供 `define "main"` 插槽、跳过链接与表层容器（TPL-16、TPL-17）；验证：临时模板渲染首页，产物含至少一个 `/css/main.<hash>.css`、`/css/fonts.<hash>.css`、`/fonts/*.woff2` 与两个 `preload`，`integrity` 与 `crossorigin="anonymous"` 同时出现。
- [x] 3.3 写 `_partials/{header,nav,theme-toggle,mobile-menu,footer,star}.html` 与 `assets/css/style.css` 的 chrome 部分（固定框架、顶栏、logo 中心/角落、导航、页脚、焦点环、`--wf-tap-target`）；无站点菜单时渲染内置默认导航（`relLangURL` 生成链接、i18n 标签），站点有 `menus.main` 时整体替换（CFG-11）；验证：最小站点构建后首页 DOM 含 `header`/`nav`/`footer` 与 4 个默认导航链接，1440 截图顶栏与页脚位置符合框架令牌。
- [x] 3.4 写 `layouts/{home,page,section,404}.html`（子模板只含 `define "main"`）与正文版式样式（reading/body 字阶、measure、letter 版式留到 posts 模板）；404 用根级模板（TPL-05、TPL-12）；验证：fixture 加最小 `content/purpose.md` 后 `/`、`/purpose/`、`/404.html` 三个输出存在且非空，构建无 WARN。
- [x] 3.5 写 `layouts/posts/{page,section}.html` 与 `archetypes/posts.md`：详情读 `.Params.from/to/subject`（缺失不输出空标签）、列表按日期倒序、空列表显示 `waitforit.posts.empty`；`hugo new content` 生成的骨架字段正确（CNT-08、CNT-07）；验证：fixture 的 3 篇英文帖子按日期倒序出现在列表，日期文案存在；临时文章缺 `params` 时构建仍通过；“/zh/posts/” 为空时显示中文空状态。
- [x] 3.6 写 `layouts/taxonomy.html` 与 `layouts/term.html` 兜底列表（复用 `_partials` 的行列表），避免启用默认 taxonomy 的站点产生缺模板 WARN（TPL-06）；验证：fixture 里给一篇文章加 `tags: ["test"]` 后构建，`/tags/` 与 `/tags/test/` 输出存在且无 `found no layout file` 告警。

## 4. 三态主题、场景与降级

- [x] 4.1 实现主题启动与切换：`head` 内联脚本读 `localStorage["wf-theme"]` 设 `data-theme`、加 `js`/`is-boot` 类并在两帧后移除 `is-boot`；`_partials/theme-toggle.html` 按钮循环 auto→day→night、写 localStorage、i18n 标签与 `aria-label`；`tokens.css` 的 `@property` 让纸光通道 900ms 插值，画布/颗粒用 `opacity var(--wf-motion-theme)` 同步（D6；值来自 `design-system`）；验证：用 CDP 探针选择 night 后刷新另一页面，`documentElement.dataset.theme` 仍为 `night` 且首帧无过渡类；非法 storage 值（`"zzz"`）时回到 auto 且不报错。
- [x] 4.2 写 `_partials/scene.html`、`_partials/scripts.html` 的脚本发布与 `assets/js/scene.js`：四层 z 顺序、day/night 两张画布、`.wf-scene` CSS 背景 `var(--wf-paper)`、`draw(phase)` 读令牌画 `phase=0` 静态首帧、dpr≤2、resize 重绘；`features.sea=false` 时不输出 canvas 但保留纸色层；验证：构建后页面的两张 canvas 尺寸等于视口（绘制非空，`getImageData` 存在非纸色像素），`[data-theme]` 与媒体查询下可见画布正确；`prefers-reduced-motion: reduce` 下 `--wf-motion-theme` 为 `0ms` 且无 rAF 循环（页面无持续绘制）。
- [x] 4.3 完成无 JS 与 a11y 基线：导航链接在无 `.js` 类时直接可见（CSS 只在 `.js` 下隐藏移动菜单）、跳过链接为首个可聚焦元素、焦点环用 `--wf-focus-*`、移动菜单按钮 `aria-expanded`/`aria-controls` + Escape 关闭并回焦、装饰层 `aria-hidden`；写 `assets/js/ui.js`（移动菜单与焦点管理，经 `_partials/scripts.html` 发布）；验证：`--blink-settings=scriptEnabled=false` 的 headless 截图/`--dump-dom` 显示正文与导航链接、`/css` 规则中无 `.js` 时面板可见；CDP 探针在 390 宽测导航链接/主题按钮命中区域 ≥44px，菜单按钮点击后 `aria-expanded="true"`，Escape 后为 `"false"` 且焦点回按钮。

## 5. 双语与 hreflang

- [x] 5.1 实现 `_partials/lang-switch.html` 与 head 的 hreflang：`range site.Languages`，当前页在 `.AllTranslations` 有翻译则链到翻译，否则 `relLangURL "/"`；仅 `len site.Languages > 1` 渲染；`<html lang>` 用 `site.Language.LanguageCode`、`dir` 用 `.Language.Direction`；head 输出 `range .AllTranslations` 的 `hreflang` 用 `.Language.Locale`（CNT-19、CNT-20）；验证：中文页面 DOM 含 `<html lang="zh"` 与对应 `rel="alternate"`，语言链接指向 `/zh/...`；单语言最小站点不渲染语言切换。
- [x] 5.2 在 fixture 加中文内容（`_index.zh.md`、三篇静态页 `.zh.md`、`posts/_index.zh.md`），并让英文文章只有部分翻译；验证：中文首页与中文静态页可访问且文案为中文；无翻译的英文文章页上语言切换落到 `/zh/`；`/zh/posts/` 显示空状态。

## 6. 完整 fixture 与视觉证据

- [x] 6.1 补全 fixture：英文 3 篇信件（含 1 篇超长标题，`params.from/to/subject` 齐全，其中 1 篇缺 `params`）、中文 posts 空 section、三组静态页双语、虚构品牌与示例域名邮箱；验证：全站页面可访问，超长标题在 1440/390 下不横向溢出；`grep -r "@" exampleSite/content` 只出现 `@example.com`。
- [x] 6.2 在 `exampleSite/hugo.toml` 演示站点契约：`params.waitforit` 覆盖品牌与 hero、每语言 `[[languages.<lang>.menus.main]]`（`pageRef` + 对应语言名）、`features` 默认；验证：导航显示站点菜单而非内置默认四项；把各语言 `menus.main` 删掉后（临时）导航回退到内置默认导航，证明 CFG-11 两种路径都工作。
- [x] 6.3 产出证据并更新矩阵：`docs/design/evidence/theme-skeleton/` 放 home/post/list/404 × 1440×900 与 390×844（home 另出 night）截图 + README（构建命令、截图命令、每张图的观察结论）；把静态首帧、字体替换、无 JS 无线条、菜单无动画等偏差写入 `docs/design/fidelity-matrix.md` 的「主题值/偏差声明」列；验证：截图 390 宽无横向滚动、night 首页纸色为 `#2e2d2b`；矩阵每行三栏非空且引用证据文件名。

## 7. 验证工具与 CI

- [x] 7.1 写 `test/probe.mjs`（Node 24，零依赖，用内置 `WebSocket` 走 Chrome DevTools Protocol）：打开指定 URL，返回 `scrollWidth/clientWidth`、关键令牌实读值、`aria-expanded`、命中区域尺寸、`prefers-reduced-motion` 模拟下的场景状态、localStorage 持久化检查；验证：`node test/probe.mjs --help` 可用；对本地构建站点跑一次输出 JSON，其中 1440 与 390 的 `scrollWidth <= clientWidth` 均为 true。
- [x] 7.2 新增 `.github/workflows/ci.yml`：`ubuntu-latest`，矩阵 `hugo: ["0.146.0","0.168.0"]`，步骤 checkout → setup-node(22) → `peaceiris/actions-hugo@v3`（`extended: false`）→ `node scripts/check-assets.mjs` → 完整构建命令（`--panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings --gc --cleanDestinationDir`）→ 弃用审计（`--logLevel info` 后 `! grep -qi deprecat`）（REL-01、REL-07、REL-08、REL-09）；验证：YAML 可被 `python -c "import yaml"` 解析（或 GitHub Actions schema 眼检），两个版本号与构建命令逐字匹配设计 D10。
- [x] 7.3 本地跑双版本验证：用 1.1 的两个 Hugo 分别执行 CI 的构建命令与门禁，再用 `test/probe.mjs` 对构建站点跑桌面/手机断言；验证：两个版本均零 WARN 退出 0、门禁五项 PASS、探针全部断言通过；失败项修到通过（不降低门禁强度）。

## 8. 决策、文档与交接

- [x] 8.1 追加决策：`docs/decisions.md` 加 `D5-R`（信件字段 `from/to/subject` 在 front matter `params` 下，`.Params` 读取；顶层写法不成立）与 `D20 P2 主题骨架实施决策`（静态首帧边界、内置默认导航、字体 CSS 构建期生成、`@property` 注册在 tokens.css、tokens 移至 `assets/css/`、不改 outputFormats、LICENSE 版权方）；历史条目不改写；验证：`grep -n "D5-R\|D20" docs/decisions.md` 命中，`git diff` 只新增段落不改旧行。
- [x] 8.2 更新 `AGENTS.md`：阶段改 P2 完成、布局树加入新文件、设计指针 tokens 路径改 `assets/css/tokens.css`、构建命令改为带 `--themesDir` 的完整命令、默认菜单表述改为「默认导航由模板提供」；验证：`grep -n "assets/css/tokens.css" AGENTS.md` 命中，文档内命令可在仓库根直接执行成功。
- [x] 8.3 写 `docs/handoff/2026-10-20-theme-skeleton.md`：完成内容与验证结果、P3 入口（场景 rAF、转场、代码块、OG）、P4 遗留（theme.toml、README 安装段、自动截图回归、链接检查）、Open Questions 结转、上游 pin 位置；验证：文件含 P3 入口清单与「README 安装段仍未写、主题不声称可安装」的明确句子。
- [x] 8.4 集成验证：`node scripts/check-assets.mjs` 五项 PASS、两个 Hugo 版本构建零 WARN、`test/probe.mjs` 断言通过、`openspec validate theme-skeleton --strict` 退出 0、`git status` 无临时文件/构建产物；验证：上述命令逐条执行并记录结果。

## Workflow follow-up

- 按项目评审要求检查本次 diff 后，归档 `theme-skeleton`，确认 `theme-shell` 与 `theme-distribution` 落入 `openspec/specs/`。
- 归档后核对主 spec 的 Purpose 与需求计数，再规划 P3（签名能力）。
