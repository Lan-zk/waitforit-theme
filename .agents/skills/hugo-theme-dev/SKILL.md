---
name: hugo-theme-dev
description: Hugo 主题开发的显式规范与可溯源事实库（基线 v0.168.0，最低支持 0.146.0）。当在本仓库编写或修改 layouts 模板、主题 hugo.toml/theme.toml、_partials/_shortcodes/_markup、assets 资源管线、内容模型与输出格式、i18n、404/分页、CI 构建与发版，或排查"模板不生效、页面静默消失、字体/样式不发布、构建警告"时使用。含 105 条编号规则（TPL/CFG/AST/CNT/REL）、来源注册表、可复跑实测脚本。
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: 需要 Hugo ≥ 0.146（基线 0.168.0，extended 非必需）；复跑实测脚本需 PowerShell 7 与 hugo 可执行文件。
metadata:
  author: waitforit-theme
  version: "1.0"
  generatedBy: "2026-10-20"
---

# Hugo 主题开发规范

本仓库写任何 Hugo 模板、主题配置、资源管线、CI 构建命令之前，先按本文件找到对应规则；规则本身在 `references/`，来源在 `references/sources.md`，实测在 `evidence/`。**不凭记忆写 Hugo**：这套库存在的唯一理由，是把"文档没写清 / 写清但会静默失败 / 版本已变"的地方钉死，避免实现后返工。

## 何时用

- 写/改 `layouts/**`（含 `_partials`、`_shortcodes`、`_markup`）、`hugo.toml`、`theme.toml`、`i18n/`、`archetypes/`。
- 用 `resources.*`/`images.*`/`css.Sass`/`js.Build`/`fingerprint` 处理样式、脚本、字体、图片。
- 定内容模型、输出格式、分页、sitemap/RSS/robots、多语言与 RTL。
- 写 CI、决定 `module.hugoVersion`、发 tag、评估 themes.gohugo.io 上架。
- 排查：模板没被用、页面消失、样式/字体 404、构建有 WARN、本地能过 CI 不能过。

不适用：Hugo 之外的工程问题（Go 代码、Hugo 源码本身）；`exampleSite` 的虚构内容设计（见 `docs/decisions.md`）。

## 追溯协议（规则不是口号）

每条规则都是一行这样的记录：

```text
- **TPL-15** 模板没匹配上不会报错：只有一条 `WARN found no layout file ...`，exit 0，页面静默消失（E4）。⟦E⟧ E4
- **CFG-15** 最低版本用 `[module.hugoVersion] min = "0.146.0"`（主题根 `hugo.toml`）。⟦D⟧ SRC-32
```

从一条规则回到证据，三步：

1. 读规则行尾标记：`⟦D⟧ SRC-xx` = 文档明文；`⟦E⟧ E#` = 本地实测；`⟦I⟧` = 推断；`⟦U⟧` = 未核实。
2. 打开 `references/sources.md`：`SRC-xx` 查到页面 URL 与抓取日期；`E#` 查到情景与一句话结论；`U#` 表示**不得据此写代码**。
3. 需要更细的原文/行为时：`SRC` 回 gohugo.io 对应页；`E` 读 `evidence/2026-10-20-hugo-v0.168.0-smoke.md`，或直接复跑 `evidence/smoke.ps1`。

冲突优先级：**实测 ⟦E⟧ > 文档明文 ⟦D⟧ > 推断 ⟦I⟧**。文档与实测冲突时以实测为准并注释（已知冲突：TPL-02 `_default` 仍能用但报 unused、TPL-15 缺模板不报错、CFG-16 版本不匹配不阻断）。**没有来源标记的规则视为缺陷**：补实测（新增 E#）或降级为 ⟦U⟧，不要留在正文里当依据。

## 规则索引（105 条）

按主题分五个文件；编号连续，可 grep 精确定位：

| 文件 | 编号 | 覆盖 | 什么时候读 |
| --- | --- | --- | --- |
| `references/templates.md` | TPL-01…21 | 新模板系统路径、查找顺序与权重、baseof/block、partial、shortcode、render hook、分页、404 | 写任何模板之前 |
| `references/configuration-modules.md` | CFG-01…29 | 主题配置可合并段、params/menus 合并语义、outputs/mediaTypes、版本护栏、mount、module 分发、i18n、安全 | 写 `hugo.toml`/`theme.toml`、定参数契约、多语言之前 |
| `references/assets-pipeline.md` | AST-01…16 | assets vs static、资源发布与指纹、Sass/PostCSS/js.Build、图像处理、字体交付、可移植性 | 引样式/脚本/字体/图片、写 `assets/` 结构之前 |
| `references/content-output.md` | CNT-01…27 | bundle/section、front matter、taxonomy、输出格式与模板命名、sitemap/RSS/robots、Goldmark 与 shortcode 渲染、i18n/RTL | 定内容模型、输出格式、多语言、Markdown 行为之前 |
| `references/release-ci.md` | REL-01…12 | 版本/edition 事实、0.146 后的破坏性变更、CLI flags、CI 验收命令、gallery 发布规则、安全默认值 | 写 CI、升 Hugo、发版之前 |

## 先守这 16 条（最高频、最容易返工）

- **TPL-01** 不写 `layouts/_default/`，模板文件直接放 `layouts/` 根。
- **TPL-03** 目录名是 `_partials`、`_shortcodes`（带下划线）；`_markup` 放 render hooks。
- **TPL-05** 首页模板是 `home.html`，不是 `index.html`。
- **TPL-07** base 标识符在第一个点后：`baseof.list.html`，不是 `list-baseof.html`。
- **TPL-09** 兜底顺序：page→single→all；section/home/taxonomy/term→list→all；`list` 优先于 `all`。
- **TPL-14** `layouts/` 下不放任何非模板文件（`.bak`、草稿）；它会被当模板解析并让 CI 失败。
- **TPL-15** 缺模板不报错，只 WARN + 页面消失；CI 必须开 `--panicOnWarning`。
- **TPL-16** `page.html`/`section.html` 等子模板只写 `{{ define "main" }}` 等块，不写裸 HTML，否则 base 不套用。
- **CFG-01** 主题根 `hugo.toml` 只有 `params`、`menu(s)`、`outputformats`、`mediatypes` 四段会被合并，其他段写了也不生效。
- **CFG-05** 自定义参数一律命名空间化：`params.waitforit.<key>`。
- **CFG-09** 主题菜单用 `[[menus.main]]` 数组表；不要与 `[menus.main]` 混写。
- **CFG-15** 版本只在主题根 `hugo.toml` 的 `[module.hugoVersion] min` 声明；`theme.toml` 不参与构建。
- **AST-01** `resources.Get` 只认 `assets/`；`static/` 里的文件永远拿不到资源对象。
- **AST-14** 字体走 `assets/fonts` + 显式发布 + `<link rel="preload">`；只写 CSS `url()` 不会发布到 `public/`。
- **REL-01** 不依赖 extended 版（libsass 已废弃），主题要"克隆即构建"。
- **REL-07** CI 跑最低支持版 + 最新稳定版两份矩阵，WARN 即失败。

## 工作流

1. 动手前：读对应 `references/*.md` 的目标小节，确认规则编号与版本线；涉及视觉/内容契约时先看 `docs/decisions.md`。
2. 写代码：按规则写；遇到规则未覆盖的行为，先判 `⟦U⟧` 还是需要新实验——不要凭 Hugo 直觉填。
3. 验证：`hugo --source exampleSite --themesDir ../.. --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings`（完整 CI 命令见 REL-07）。
4. 发现规则错误：修 `references/` 对应行，同时更新 `sources.md` 的 SRC/E 索引；改动记录进 `docs/decisions.md`（追加，不改历史）。
5. 升级 Hugo：先复跑 `evidence/smoke.ps1`；断言失败说明某条结论过期，按失败项逐条复核，再更新规则与证据文件。

## 维护协议

- 新增规则：必须带 `⟦D⟧ SRC-xx` 或 `⟦E⟧ E#`；`SRC` 先登记进 `sources.md` §3（URL + 页面标题 + 抓取日期 + 用途），`E` 先写进 `evidence/` 并补进 `smoke.ps1` 可断言。
- 接入变更：任何涉及 Hugo 的 OpenSpec 变更，其 `design.md` 与 `tasks.md` 必须引用本库规则 ID（如 `AST-14`、`TPL-12`）；实现中遇到本库未覆盖的 Hugo 事实，先补规则与来源再写代码，不允许先写后补。
- 改事实：不删旧结论，改写成"当前事实 + 过期时间/版本"；冲突写进规则行尾。
- 版本升级：更新 `sources.md` 顶部核对基线、`release-ci.md` §1 事实表、`smoke.ps1` 期望值。
- 本库只记规则与指针，**不复制官方文档正文**（gohugo.io 文档为 Apache-2.0，引用时保留来源）。

## 指针

- 来源注册表与未核实清单：`references/sources.md`（§4 未核实项不得作为实现依据；§5 追溯协议；§6 维护协议）。
- 实测：`evidence/2026-10-20-hugo-v0.168.0-smoke.md`（E1–E12，46 条断言）+ `evidence/smoke.ps1`。
- 仓库硬边界与当前阶段：根 `AGENTS.md`；决策：`docs/decisions.md`（Hugo 规范相关决策见 D4、D18）。
