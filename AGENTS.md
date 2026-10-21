# waitforit-theme Agent Guide

## 目标

这是一个独立、可分发的 Hugo 主题仓库：提供 waitforit-theme 的表现层与内容契约，供个人站点或其他人通过 Hugo Module / git submodule 引用。视觉语言受 Earendil（earendil.com；earendil-works/website）启发，代码、文案为原创；主题标志按用户提供轮廓重绘，素材来源见 `CREDITS.md`。

真实站点内容不在本仓库。本仓库只允许 `exampleSite/` 下的虚构 fixture；真实个人数据、文章、图片、品牌素材不进入。

当前阶段：P3 签名能力已实现并通过本地验收，`signature-capabilities` 已同步主规范并于 2026-10-21 归档；P2 `theme-skeleton` 已同步规范并归档。品牌轮廓、动态海面、代码复制、OG 与原生页面转场的契约见 `docs/signature-capabilities.md`，最新实站差距优化证据见 `docs/design/evidence/p3-fidelity/`。下一步 P4 跨引擎/真实设备/辅助技术、CI 浏览器门禁与发布文档；`README.md` 安装段仍未写，主题不声称可安装。

## 硬边界

- 主题不带 `content/`：内容归站点仓库。这是本仓库约定（Hugo 对主题 `content/` 的实际挂载行为未核实，见 `.agents/skills/hugo-theme-dev/references/sources.md` 的 U3），不是 Hugo 的强制规则。主题只交付 `layouts/`、`assets/`、`i18n/`、`archetypes/`、默认 `params`/`outputFormats`，以及 `exampleSite/` fixture；默认导航由模板提供（站点声明 `menus.main` 即整体替换），主题配置不写 `menus`。
- 用新模板系统路径（Hugo ≥ 0.146）：`layouts/home.html`、`layouts/page.html`、`layouts/section.html`、`layouts/posts/…`、`layouts/_partials/`、`layouts/_shortcodes/`。`layouts/list.html`、`layouts/all.html` 只作回退，不作主模板。不使用 `layouts/_default/`、`layouts/partials/`。
- 字体只用可再分发的 OFL 字体：衬线 Newsreader、等宽 Commit Mono，中文回退 Noto Serif SC / Noto Sans Mono CJK SC；逐篇OG允许 `assets/fonts/og/` 中两个明确白名单的OFL TrueType，仅供构建、不发布为网页字体（D24）。PlantinNow / Plantin、Departure Mono 不进入仓库与构建产物。
- 不复制 Earendil 的 `styles.css`、WebGL/GLSL shader、文案、logo、图片。设计对照截图只放 `docs/design/reference/` 并标注来源，不进入发布产物。
- 代码许可 MIT；`CREDITS.md` 记录灵感来源、第三方许可与引用 commit。Earendil 仓库的 Apache-2.0 没有 NOTICE 与版权行，引用其结构时也必须注明来源。
- `exampleSite/` 只用虚构人物与内容；不出现真实邮箱、真实文章或私人照片。

## 先读哪里

- 设计、边界、依赖、字体、许可、内容模型：先读 `docs/decisions.md`。它是决策的唯一来源；改决策时追加新条目，不改写历史。
- 接手会话：读 `docs/handoff/` 下最新文件。
- 对外契约（参数、内容模型、降级行为）：`README.md` 写成后以它为准，之前以 `docs/decisions.md` 为准。
- 设计实现：仓库根 `DESIGN.md` 是设计契约的唯一权威（8 章 + YAML frontmatter），`.impeccable/design.json` 是它的机器可读 sidecar（OKLCH 色阶、阴影/动效/断点、`wf-` 组件片段），`assets/css/tokens.css` 是浏览器实际消费的 `--wf-*` 令牌（P2 从 `docs/design/` 迁入，docs 副本已删）。三者口径必须一致，冲突时回改 DESIGN.md 再重生 sidecar。
- Hugo 模板、主题配置、资源管线、内容/输出、CI 与发版：读 `.agents/skills/hugo-theme-dev/SKILL.md`（107 条编号规则 TPL/CFG/AST/CNT/REL + 来源注册表 + 可复跑实测）。规则与出处一一对应，不凭记忆写 Hugo。

## 工作方式

- 改模板前先读 `.agents/skills/hugo-theme-dev/SKILL.md` 与 `references/templates.md`，按规则编号落地；旧教程的 `_default` 写法与查找顺序不作依据。
- 涉及 Hugo 的 OpenSpec 变更，其 `design.md` 与 `tasks.md` 必须用规则 ID 标注依据（如 `AST-14`、`TPL-05`）；没有引用的 Hugo 相关决策或任务视为未完成。
- 用 `exampleSite` 验证，不接真实站点。仓库根目录的构建命令：

```bash
hugo --source exampleSite --themesDir ../.. \
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings
```

`WARN` 视为失败。CI 同时测当前稳定版与最低支持版（完整命令见知识库 REL-07）。

- 视觉改动截 1440 与 390 两档；动效验证 `prefers-reduced-motion` 降级；无 JS 时正文可读。
- 改 `DESIGN.md` 必须重生成 `.impeccable/design.json`：frontmatter 与 sidecar 漂移视为缺陷；改动后跑 `node scripts/check-assets.mjs`（5 项门禁：令牌字面值、字体白名单、组件形态、装饰 SVG 白名单、sidecar 与 frontmatter 一致），必须退出 0。
- 新能力先写 `exampleSite` fixture 和验收句，再写模板；fixture 同时是视觉回归基线。
- 改动后确认没有把站点内容、真实数据或非 OFL 字体带进来。

## 仓库布局

```text
DESIGN.md                    # 设计契约（唯一权威，8 章 + frontmatter）
.impeccable/design.json      # DESIGN.md 的 sidecar（机器可读扩展与组件片段）
go.mod                       # Hugo Module 路径（github.com/Lan-zk/waitforit-theme）
hugo.toml                    # 主题默认配置：module.hugoVersion.min + params.waitforit
LICENSE                      # MIT（Copyright (c) 2026 Lan-zk）
CREDITS.md
.gitignore                   # public/、resources/、.hugo_build.lock
assets/css/{tokens,style,transitions}.css
assets/js/{scene,theme,ui,code}.js
assets/{fonts,images,cursors,favicon}/
layouts/{baseof,home,page,section,404}.html
layouts/posts/{section,page}.html
layouts/{taxonomy,term}.html # fallback 列表，避免带 tags 的站点 WARN
layouts/_partials/
i18n/{en,zh}.toml
archetypes/posts.md
exampleSite/{hugo.toml,content/}
test/{probe,signature,fidelity,sea-visibility,shoot}.mjs # 零依赖 CDP 验收与截图（Node ≥ 22）
.github/workflows/ci.yml     # Hugo 0.146.0 / 0.168.0 矩阵 + 资产门禁 + 弃用审计
docs/{decisions.md,handoff/,design/}
docs/design/{transfer-matrix.md,fidelity-matrix.md,spikes/,reference/,evidence/}
docs/design/reference/{upstream-pin.md,baseline/}
.agents/skills/hugo-theme-dev/{SKILL.md,references/,evidence/}
scripts/check-assets.mjs     # 5 项设计门禁，必须退出 0
README.md                    # 待写（P4：安装段是主题可安装的唯一标志）
theme.toml                   # 未创建（P4，主题显示名确定后）
```

## 待定

仓库已确定为 `https://github.com/Lan-zk/waitforit-theme.git`，本地 `origin` 已配置，Hugo Module 路径为 `github.com/Lan-zk/waitforit-theme`（见 `docs/decisions.md` D17），`LICENSE` 版权方为 `Lan-zk`（D20）。主题显示名、是否投递 themes.gohugo.io 尚未确定；确定后写入 `docs/decisions.md` 的「待定项」，并同步更新本文件的布局与命令。
