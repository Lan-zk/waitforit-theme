# waitforit-theme Agent Guide

## 目标

这是一个独立、可分发的 Hugo 主题仓库：提供 waitforit-theme 的表现层与内容契约，供个人站点或其他人通过 Hugo Module / git submodule 引用。视觉语言受 Earendil（earendil.com；earendil-works/website）启发，代码、文案为原创；主题标志按用户提供轮廓重绘，素材来源见 `CREDITS.md`。

真实站点内容不在本仓库。本仓库只允许 `exampleSite/` 下的虚构 fixture；真实个人数据、文章、图片、品牌素材不进入。

当前阶段（2026-10-21 起）：**六类内容的个人站点主题**，目录固定为 `blog`、`essays`、`projects`、`fiction`、`photography`、`about`。前三类有专属模板；小说、摄影用通用模板提供虚构边界样本，个人介绍是普通页，后三类专属设计仍未开展。默认六项导航全部显示，站点可整体替换。`content-types` 已同步主规范并归档至 `openspec/changes/archive/2026-10-21-content-types/`；后续标签、全高阅读、单屏首页与溪流调整见三个独立活动变更。信件模型与旧 Hugo 兼容已移除。

历史阶段：P3签名能力、P2骨架和WebGL2迁移均已归档，既有证据保留。当前P4仅测试Chrome（用户明确缩小范围，D38），包括窄屏模拟、键盘与可访问树；不开展其他浏览器或真机验收，不把可访问树检查称为读屏实测。CI入口为 `test/ci.mjs`；README已提供安装与契约，但尚未发布首个tag，远端CI结果与本地结果分开报告。

## 回应方式

- 不自行评估工作量：回复里不出现人日、天数、工期、发布日期或成本估算。
- 需要说明"怎么推进"时，只给顺序、依赖关系、风险与可验收条件；这些才是可验证的部分。
- 用户要求排期时，说明缺少哪些决定或数据，不编造时间数字。

## 硬边界

- 主题不带 `content/`：内容归站点仓库。这是本仓库约定（Hugo 对主题 `content/` 的实际挂载行为未核实，见 `.agents/skills/hugo-theme-dev/references/sources.md` 的 U3），不是 Hugo 的强制规则。主题只交付 `layouts/`、`assets/`、`i18n/`、`archetypes/`、默认 `params`/`outputFormats`，以及 `exampleSite/` fixture；默认导航由模板提供（站点声明 `menus.main` 即整体替换），主题配置不写 `menus`。
- 用新模板系统路径（Hugo ≥ 0.146）：`layouts/home.html`、`layouts/page.html`、`layouts/section.html`、`layouts/<section>/…`（当前 `blog`、`essays`、`projects`）、`layouts/_partials/`、`layouts/_shortcodes/`。`layouts/list.html`、`layouts/all.html` 只作回退，不作主模板。不使用 `layouts/_default/`、`layouts/partials/`。
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

`WARN` 视为失败。CI 固定当前稳定版 Hugo（0.168.0）并每周对最新稳定版校验；最低版本只声明、不维护旧版兼容（见 D33）。

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
layouts/{blog,essays,projects}/{section,page}.html
layouts/{taxonomy,term}.html # fallback 列表，避免带 tags 的站点 WARN
layouts/_partials/
i18n/{en,zh}.toml
archetypes/{blog,projects}.md
exampleSite/{hugo.toml,content/}
test/{probe,signature,fidelity,scene-visibility,scene-performance,scene-tuner,scene-capture,scene-diff,shoot}.mjs # 零依赖 CDP 验收与截图（Node ≥ 22）
.github/workflows/ci.yml     # 固定 Hugo 0.168.0 + 每周 latest 校验 + 资产门禁 + 弃用审计
docs/{decisions.md,handoff/,design/}
docs/design/{transfer-matrix.md,fidelity-matrix.md,spikes/,reference/,evidence/}
docs/design/reference/{upstream-pin.md,baseline/}
.agents/skills/hugo-theme-dev/{SKILL.md,references/,evidence/}
scripts/check-assets.mjs     # 5 项设计门禁，必须退出 0
README.md                    # 安装、参数、内容契约与Chrome验证边界
theme.toml                   # 显示名waitforit；运行时默认值仍在hugo.toml
```

## 待定

仓库为 `https://github.com/Lan-zk/waitforit-theme.git`，Module路径为 `github.com/Lan-zk/waitforit-theme`（D17），版权方为 `Lan-zk`（D20）。用户已确定显示名 `waitforit`，首轮仓库发布、暂不投递 themes.gohugo.io（D38）。
