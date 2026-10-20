# Handoff — theme-skeleton 收尾（2026-10-20）

下一会话目标：归档 P2 `theme-skeleton`，进入 P3（签名能力：场景时间驱动、页面转场、代码块、OG）。本文件记录 P2 的完成内容与验证结果、P3 入口、P4 遗留与结转的 Open Questions。

## 当前状态

- 仓库：`E:\File\self\github\waitforit-theme`（main）。P0 文档、P1 设计契约、P2 主题骨架均已完成；本变更改动尚未提交/推送（等用户确认）。
- **主题可构建但不可安装**：`README.md` 尚未创建，其安装段仍未写，主题不声称可安装——`README.md` 的安装段仍是主题可用的唯一标志。
- 本变更落地（已入库）：
  - 包形状：`go.mod`（`github.com/Lan-zk/waitforit-theme`）、`LICENSE`（MIT，`Copyright (c) 2026 Lan-zk`）、根 `hugo.toml`（只含 `[module.hugoVersion].min = "0.146.0"` 与 `[params.waitforit]` 默认值，不写 `menus`）。
  - 模板：`layouts/{baseof,home,page,section,404}.html`、`layouts/posts/{section,page}.html`、`layouts/{taxonomy,term}.html`（兜底防 WARN）、`layouts/_partials/`（head/styles/scene/header/nav/theme-toggle/mobile-menu/footer/lang-switch/letter-meta/post-row/star/scripts）。
  - 资产：`assets/css/{tokens,style}.css`（`tokens.css` 从 `docs/design/` 迁入，docs 副本已删）、`assets/js/{scene,theme,ui}.js`；字体/图片/光标/favicon 沿用 P1 资产。
  - i18n 与内容契约：`i18n/{en,zh}.toml`、`archetypes/posts.md`、`exampleSite/`（虚构站点 "The Night Post"，en+zh）。
  - 验证工具与 CI：`test/probe.mjs`（零依赖 CDP 探针）、`test/shoot.mjs`（零依赖 CDP 截图脚本，任务 7.1 只要求 `probe.mjs`，声明为小范围补充）、`.github/workflows/ci.yml`（Hugo 0.146.0 / 0.168.0 矩阵）。
  - 文档：`AGENTS.md` 更新（阶段 P2 完成、布局树、`assets/css/tokens.css` 指针、默认导航表述）、`docs/decisions.md` 追加 D5-R 与 D20、`docs/design/transfer-matrix.md` 的 `tokens.css` 行号随 `@property` 块 +6 刷新、知识库 E13（见下）。
- P2 证据已入库：`docs/design/evidence/theme-skeleton/` 含 10 张 PNG（home/post/list/404 × 1440×900 与 390×844、home-night-1440×900、post-long-title-390x844）+ README（构建/截图命令、逐图观察、偏差 A–G）；截图取自修完纸光语法后的 v0.146.0 构建。`docs/design/fidelity-matrix.md` 的「偏差声明」列按该证据回填。

## 本变更结论（已实测）

- **页面与内容模型**：所有子模板只写 `define "main"`，骨架/head/header/footer 全在 `baseof.html`；`posts` 固定 section 自动命中 `posts/page.html`；信件字段 `from`/`to`/`subject` 按 D5-R 放在 front matter `params` 下，模板读 `.Params.*`，缺字段只隐藏对应元信息；`hugo new content posts/x.md` 经 `archetypes/posts.md` 生成 `title`/`description`/`date`/`params.from/to/subject`；`taxonomy.html`/`term.html` 兜底避免带 tags 的站点在 `--panicOnWarning` 下失败。
- **页面表面**：四层固定 z 序 `--wf-z-scene:0` → veil 1 → grain 2 → frame 3；day/night 两张 canvas 各画一次 `phase = 0` 静态首帧（2 张、尺寸=视口、有绘制像素、层切换正确）；主题三态 auto/day/night 由 `data-theme` + 令牌切换，`localStorage["wf-theme"]` 持久化、非法值回落 auto；`is-boot` 在启动两帧后移除；`prefers-reduced-motion` 下 `--wf-motion-theme: 0ms`、无 rAF 循环；跳过链接是首个可聚焦元素且目标 `#main`；`features.sea = false` 时不输出 canvas，`.wf-scene` 仍铺纸色，veil/grain 保留。
- **实现修正（P2 实测发现）**：`assets/css/style.css` 的纸光渐变最初写 `rgba(var(--wf-veil-rgb), var(--wf-veil-alpha-*))`；`--wf-veil-rgb` 是空格分隔的通道值（`250 249 246`），该语法非法，浏览器会丢弃整条 `background` 声明、纸光实际未绘制。已改为 `rgb(var(--wf-veil-rgb) / var(--wf-veil-alpha-*))`（与 `docs/design/spikes/surface.html` 同一写法）；无令牌或模板改动。
- **声明偏差（交 fidelity matrix）**：在契约的纸光几何下（全视口 `72% 115%` 径向渐变），P2 的静态首帧 + 不透明纸光让海面读起来像极淡的水印，而不是参考站那样清晰可见的水面；P3 用动画场景重新评估，P2 不改令牌、不调纸光几何。`docs/design/evidence/theme-skeleton/` 的 README 偏差 A–G 记录了该观感差异。
- **资源管线**：`tokens.css` + `style.css` → `resources.Concat "css/main.css"` → `minify` → `fingerprint`，单个 `<link>` 带 `integrity` + `crossorigin="anonymous"`；`@font-face` 由 `resources.FromString "css/fonts.css"` 构建期生成后再指纹并先于主样式链接；4 个 woff2 走 `resources.Get` → `fingerprint` → `.RelPermalink`，Newsreader regular 与 Commit Mono 400 另发 `preload`；OFL 文本与字体同目录发布；grain/cursor/favicon 显式发布到稳定路径。**最终资产名以实现为准**：`assets/css/{tokens,style}.css` + `assets/js/{scene,theme,ui}.js`（design.md D1 原列 ui.js 承担 chrome 交互；实现把主题启动/切换拆到 `theme.js`，菜单与焦点留在 `ui.js`）。
- **主题分发**：默认导航由模板提供——站点未声明 `menus.main` 时渲染内置四个入口（posts/purpose/values/join，`relLangURL` + i18n 标签），站点声明 `menus.main` 即整体替换（CFG-11）；主题不改 `outputFormats`/`mediatypes`。
- **双语与语言字段**：`<html lang>`/`dir`、hreflang 与语言切换用 D20 的版本中立配方——`site.Language.Params.locale | default site.Language.Lang`、`site.Language.Params.dir | default "ltr"`、`site.Home.AllTranslations`、`hreflang`/`label` 取 `[languages.<lang>.params]`；单语言站点不渲染语言切换、无 hreflang；无翻译页的语言切换落到该语言首页。**不要**改回 `.Language.Locale` 或 `.Language.LanguageCode`（0.146 与 0.168 两端互斥，见 D20 / 知识库 E13）。
- **门禁与 CI**：`node scripts/check-assets.mjs` 五项（令牌字面值、字体白名单、组件形态、装饰白名单、DESIGN.md ↔ sidecar 一致性）全 PASS；`.github/workflows/ci.yml` 为 `ubuntu-latest` + `hugo: ["0.146.0","0.168.0"]` 矩阵、`extended: false`，步骤 checkout → setup-node 22 → `peaceiris/actions-hugo@v3` → 门禁 → 构建（`--panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings --gc --cleanDestinationDir`）→ 弃用审计（`--logLevel info` 后 `! grep -qi deprecat`）。
- **范围补充（声明）**：`scripts/check-assets.mjs` 在任务 2.2 的字面范围之外多做了一处 P2 修正——`walk()` 现在跳过 Hugo 构建产物目录 `public/`、`resources/`。原因是实测默认 `hugo` 构建会写出 `exampleSite/public/`，其指纹字体/图片会让门禁误判失败；该改动只影响扫描集，不放宽任何门禁规则。
- **知识库修正**：`docs/decisions.md` 追加 D5-R 与 D20（含语言字段两端实测矩阵、版本中立配方、被否决的 `hugo.Version` 分支、2.3 的 `../../../` 路径修正）；`.agents/skills/hugo-theme-dev/` 新增证据 E13（`evidence/2026-10-20-language-fields.md`），修正 `references/content-output.md` 的 CNT-19/CNT-20、`references/release-ci.md` 0.158 行、`references/templates.md` 的 base 示例与 `SKILL.md` 指针，`evidence/smoke.ps1` 增加 E13 段（共 49 条断言）。

## 两处 off-by-one 修正（本变更实测）

- **spike 的令牌相对路径**：三个 spike 位于 `docs/design/spikes/`（仓库根下三层），令牌在 `assets/css/tokens.css`，正确 href 是 `../../../assets/css/tokens.css`；`design.md`/`tasks.md` 原写的 `../../assets/css/tokens.css` 会解析到 `docs/assets/` 并 404（headless Chrome 实测 404 → 修正后 `--wf-ink` = `#353431`）。
- **hreflang / lang 字段**：D8 / CNT-19 原写 `.Language.Locale`（及 `.Direction`），只在 ≥0.158 成立；两版 CI 矩阵下改用 D20 的 params 配方（`site.Language.Params.locale | default .Language.Lang` 等，详见「双语与语言字段」），不按 `hugo.Version` 分支。

## 验证结果（最终）

```powershell
# 仓库外两个标准版二进制：%TEMP%\wf-hugo\v146\hugo.exe、%TEMP%\wf-hugo\v168\hugo.exe
# 修完纸光语法后重建：
<v146|v168>\hugo.exe --source exampleSite --themesDir ../.. `
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings
# → v0.146.0 与 v0.168.0 均 exit 0、零 WARN、Pages 21 | 16；
#   zh 首页 <html lang="zh" dir="ltr">，hreflang en/zh，语言切换显示 English / 中文。

# 弃用审计（REL-05 / REL-08）：
<v146|v168>\hugo.exe --source exampleSite --themesDir ../.. --logLevel info 2>&1 | Select-String deprecat
# → 两版均 0 命中。

node scripts/check-assets.mjs                 # 5 项 PASS，exit 0
node test/probe.mjs --url <本地构建站点> --width 1440 --height 900   # 7/7 PASS，exit 0（两版均跑）
node test/probe.mjs --url <本地构建站点> --width 390 --height 844    # 7/7 PASS，exit 0（两版均跑）
openspec validate theme-skeleton --strict     # exit 0（"Change 'theme-skeleton' is valid"）
```

- `test/probe.mjs` 的 7 项检查（两版 × 1440×900 与 390×844 均 PASS、exit 0）：`no-horizontal-overflow`（scrollWidth ≤ clientWidth）、`design-tokens`（`--wf-ink/--wf-paper/--wf-veil-rgb/--wf-frame-block/--wf-motion-theme` 实读非空）、`hit-targets`（10/11 个 chrome 控件命中区域 ≥44×44）、`menu-toggle`（真实指针点击后 `aria-expanded=true`，Escape 关闭并回焦按钮）、`theme-persistence`（`wf-theme=night` 刷新保持、非法值回落 auto）、`reduced-motion`（`--wf-motion-theme: 0ms` 且 0 rAF）、`no-js`（禁用 JS 后正文与 8 个导航链接可见）。
- 其他任务级实测：canvas 两张（day/night）、尺寸=视口、有绘制像素且层切换正确；`is-boot` 两帧后移除；skip link 首个可聚焦且指向 `#main`；`features.sea=false` 构建无 canvas 但 scene/veil/grain 保留；archetype 字段齐全；单语言站点无语言切换/hreflang 且导航回退四个内置入口；默认 destination 构建写出 `exampleSite/public/index.html` 且 `.gitignore` 覆盖 `public/`。
- 知识库复跑：`smoke.ps1` 在 v0.168.0 基线 49/49 通过；v0.146.0 上 E13 3/3 通过，整脚本仅 E8 的 unused 告警断言失败（0.146 用 `_default/page.html` 回退但不报 unused），见 Open Questions。

## P3 入口（按序）

1. **场景时间驱动**：`assets/js/scene.js` 已按 `draw(canvas, palette, phase)` 写好，P2 只调用 `draw(..., 0)`；P3 接 `requestAnimationFrame`、读 `--wf-motion-*` 决定何时启用，`prefers-reduced-motion`/省电下保持静态首帧。不改标记结构、画布数量与 CSS 层级（D11 不返工约束）。
2. **页面/入场/菜单转场**：通过 `features.transitions` 开关接 View Transitions 与 CSS 过渡；`is-boot` 机制与现有令牌已就位，不重写 `baseof.html` 结构。
3. **代码块与复制**：新增 partial/样式/JS，保持现有 partial 命名与职责不变。
4. **OG/Twitter meta**：在 `head.html` 增加输出，不改现有 head 结构。
5. 验证沿用：双版本零 WARN 构建 + `node scripts/check-assets.mjs` + `test/probe.mjs`（可扩展 checks）+ 1440/390 截图；新能力先写 `exampleSite` fixture 与验收句。

## P4 遗留

- `theme.toml`（主题显示名未定；不声称 gallery 就绪）。
- `README.md` 安装段（**安装段是主题可安装的唯一标志；当前未写，主题不声称可安装**）。
- 自动截图回归（`test/shoot.mjs` 目前只是生成证据图的 helper；像素 diff 工具化留 P4）。
- 链接检查（CI 尚未加入）。
- 是否投递 themes.gohugo.io（用户未定）。

## Open Questions 结转

1. **日期本地化**：`.Date | time.Format ":date_long"` 在 0.146.0 / 0.168.0 与 en/zh 下的输出稳定性；P2 fixture 只断言日期文案存在，若 CI 不稳定则退回 i18n 固定布局。
2. **默认导航的缺页风险**：站点缺 purpose/values/join 页面时，内置四个入口可能指向 404；P2 只在 `exampleSite` 验证，P4 决定是否要求站点显式声明菜单或把默认入口缩为「文章 + 首页」。
3. **语言切换落点**：当前页无翻译时落到该语言首页（实现如此，spec 已约定）；P4 用真实站点反馈调整。
4. **fixture 虚构名**：`The Night Post` 等虚构名长期保留还是 P4 换更中性的名字（纯内容选择，不影响实现）。
5. **知识库 E8 的版本边界**：0.146.0 上旧路径 `_default/page.html` 可用但**不报 unused**，0.168.0 才报；E8 结论应限定为 0.168 基线或拆成版本条件断言。本轮只记录在 E13 证据 §6 与 `smoke.ps1` 头注释，未改 E8 正文。

## 上游 pin 位置与设计契约

- 上游证据：`docs/design/reference/upstream-pin.md` — earendil-works/website commit `31b1b0429425f7d5af914afa4d29165688d71a3f`，DESIGN.md / sidecar 哈希与许可结论；基线截图 12 张在 `docs/design/reference/baseline/`（1.43MiB，≤2MB 预算，只作内部对照，不进发布产物）。
- 设计契约权威：根 `DESIGN.md`（8 章 + frontmatter）+ `.impeccable/design.json`（sidecar）+ `assets/css/tokens.css`（浏览器实际消费的 `--wf-*`）；三者口径由 `scripts/check-assets.mjs` 检查。设计判定见 `docs/design/transfer-matrix.md` 与 `docs/design/fidelity-matrix.md`。
- 决策与规则：`docs/decisions.md`（D5-R、D20 为本变更新增）、`.agents/skills/hugo-theme-dev/SKILL.md`（105 条规则 + E13 证据）。

## 不要做的事

- 在 `README.md` 安装段写出来之前，不要声称主题可安装、不要发 tag / 推送。
- 不要重新引入 `.Language.Locale`/`.Language.Direction`/`.LanguageCode` 之类的单端写法、`site.Languages`，或用 `hugo.Version` 分支——用 D20 的 `params` + `AllTranslations` 配方。
- 不要提交 `public/`、`resources/`、`.hugo_build.lock`；门禁虽已跳过构建产物，`.gitignore` 仍须生效。
- 不要改 `DESIGN.md` 而不重生 sidecar、不过 `node scripts/check-assets.mjs`。
- 不要复制上游 `styles.css`/shader/文案/logo/图片/字体；参考截图不进构建产物。
- P3 不要把场景重写成一次性实现：保持「读令牌 → `draw(phase)`」外形，只增加时间驱动与转场（D11）。
