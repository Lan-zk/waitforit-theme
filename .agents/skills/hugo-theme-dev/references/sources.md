# 来源注册表与追溯协议

本文件是 `hugo-theme-dev` 知识库的**溯源底座**：所有规则文档（`templates.md`、`configuration-modules.md`、`content-output.md`、`assets-pipeline.md`、`release-ci.md`）里的每条规则都挂着本文件定义的标记，任何人（人或 agent）都能从一条规则回到原始出处，或回到可重跑的本地实验。

核对基线：**Hugo v0.168.0（2026-10-13 发布）**；文档抓取日期 **2026-10-20**；主题最低支持 **0.146.0**（新模板系统起点）。文档站页脚自称 "Built with Hugo v0.168.0"，与发布页一致。

## 1. 依据等级（每条规则行尾都带）

| 标记 | 含义 | 使用要求 |
| --- | --- | --- |
| `⟦D⟧ SRC-xx` | **文档明文**。gohugo.io（或官方仓库 README）写明的事实，附来源编号 | 可直接据此写代码 |
| `⟦E⟧ E#` | **本地实测**。本仓库在 Hugo v0.168.0 上跑过的实验，见 `../evidence/2026-10-20-hugo-v0.168.0-smoke.md` | 可直接据此写代码；Hugo 升级后重跑脚本复核 |
| `⟦I⟧` | **推断**。文档未明说，按语义/实现惯例推得 | 落地前先验证，不单独作为设计依据 |
| `⟦U⟧` | **未核实**。本次未取得原文，也未实测 | **不得据此写代码**，只能当待查项 |

规则与来源冲突时，优先级：`⟦E⟧`（实测）> `⟦D⟧`（明文）> `⟦I⟧`。冲突本身就是结论，应写进规则的「冲突」字段并在维护时上报。

## 2. 实测证据索引

详见 `../evidence/2026-10-20-hugo-v0.168.0-smoke.md`；可重跑脚本 `../evidence/smoke.ps1`。实验环境：Windows，Hugo `v0.168.0-...-extended windows/amd64`，夹具位于 `%TEMP%\hugo-smoke`。

| 编号 | 验证的问题 | 一句话结论 |
| --- | --- | --- |
| E1 | 全新模板系统下 kind→模板选择、params 深合并、主题 menus/i18n 是否生效 | 选择规则全部按文档工作；`params` 嵌套 map **深合并**、站点胜；主题 `menus.main` 被站点同名菜单**整体替换**（非合并）；主题 i18n 生效 |
| E2 | 只留 `all.html` | `all.html` 兜底渲染 page 与 section 页 |
| E3 | `list.html` 与 `all.html` 并存 | `list` 优先于 `all`，且 `all.html` 被 `--printUnusedTemplates` 报 unused |
| E4 | 无匹配模板 | 只有 `WARN found no layout file ...`，构建 **exit 0**，页面静默消失 |
| E5 | 同上 + `--panicOnWarning` | `panic: found no layout file ...`，**exit 2**，不产出 `public/` |
| E6 | 主题 `module.hugoVersion.min = 0.999.0` | 仅 `WARN Module "..." is not compatible with this Hugo version`，**exit 0**；不是硬失败 |
| E7 | 有 taxonomy 数据但无 taxonomy/term 模板 | 分别 `WARN` kind "taxonomy" 与 kind "term"；补模板后正常渲染 |
| E8 | 旧路径 `layouts/_default/page.html` | 0.168.0 **仍能渲染**，但被报 `Template /_default/page.html is unused`；加 `--panicOnWarning` 会 panic |
| E8b | 根目录 `single.html` | 可作为 page kind 的回退模板（`page → single → all` 链成立） |
| E9 | 旧目录 `layouts/partials/` | 0.168.0 **仍能找到** partial 且无警告（文档称已移除） |
| E10 | `partial` 的 `return` 返回值与变量作用域 | `return` 值可用；把 `$v := partial ...` 写在 `{{ define }}` 外会 `parse of template failed: undefined variable "$v"` |
| E12 | `layouts/` 下残留 `page.html.bak` | 被当模板解析并报 `Template /page.html.bak is unused`；`--panicOnWarning` 下 exit 2 |

（E11 编号保留未使用，避免与既有报告交叉引用时错位。）

## 3. 官方文档来源（gohugo.io，2026-10-20 实测 HTTP 200）

### 3.1 模板系统与渲染

| ID | 页面 | 本库用途 |
| --- | --- | --- |
| SRC-01 | `/templates/new-templatesystem-overview/` | 新模板系统变更清单、查找权重总表 |
| SRC-02 | `/templates/types/` | 模板类型、fallback 链、baseof/define 条件、partial/view 查找 |
| SRC-03 | `/templates/lookup-order/` | 查找顺序细节（语言/输出格式/路径权重） |
| SRC-04 | `/templates/introduction/` | context/dot 语义、常见模板错误 |
| SRC-05 | `/templates/shortcode/` | shortcode 方法与渲染顺序 |
| SRC-06 | `/templates/pagination/` | 分页 API 与内建分页 partial |
| SRC-07 | `/templates/embedded/` | 内建 partials 清单与覆盖方式 |
| SRC-08 | `/templates/partial-decorators/` | `templates.Inner` 包裹组件（≥0.154.0） |
| SRC-09 | `/templates/404/` | 404 模板位置与多语言命名 |
| SRC-10 | `/templates/sitemap/` | sitemap 覆盖与多语言 index |
| SRC-11 | `/templates/rss/` | RSS 覆盖与条数配置 |
| SRC-12 | `/templates/robots/` | robots.txt 模板查找 |
| SRC-13 | `/render-hooks/introduction/` | render hook 目录、7 个文件名、仅 Markdown 生效 |
| SRC-14 | `/render-hooks/images/` | image hook context 字段、`useEmbedded` 语义 |
| SRC-15 | `/functions/partials/include/` | `partial` 签名、返回值、相对路径 |
| SRC-16 | `/functions/partials/includecached/` | `partialCached` 缓存键与变体语义 |
| SRC-17 | `/methods/page/render/` | `Page.Render` 签名与版本 |
| SRC-18 | `/methods/page/renderstring/` | `RenderString` 的 `display` 选项 |
| SRC-19 | `/methods/page/paginate/` | `Paginate` 语义与不可变集合 |
| SRC-20 | `/methods/page/store/` | `.Store` 取代 `.Scratch` |
| SRC-21 | `/methods/page/translations/` | `.Translations`、hreflang 用 `.Locale` |
| SRC-22 | `/methods/page/tableofcontents/` | `.TableOfContents` 与 TOC 配置 |

### 3.2 配置、模块、多语言

| ID | 页面 | 本库用途 |
| --- | --- | --- |
| SRC-30 | `/configuration/introduction/` | 配置合并优先级、环境与 `HUGO_*` 覆盖 |
| SRC-31 | `/configuration/params/` | params 命名空间化、键名限制 |
| SRC-32 | `/configuration/module/` | `module` 段、`hugoVersion`、mount 语义 |
| SRC-33 | `/configuration/menus/` | 菜单条目属性、`pageRef` vs `url` |
| SRC-34 | `/configuration/outputs/` | 按 kind 的输出格式、主格式语义 |
| SRC-35 | `/configuration/output-formats/` | output format 属性与对模板命名的影响 |
| SRC-36 | `/configuration/media-types/` | 主后缀决定模板后缀 |
| SRC-37 | `/configuration/cascade/` | cascade 语义与 target |
| SRC-38 | `/configuration/languages/` | 语言级覆盖、可本地化键清单 |
| SRC-39 | `/configuration/security/` | 安全默认值（exec/http/getenv/node） |
| SRC-40 | `/configuration/markup/` | Goldmark 默认扩展与渲染选项 |
| SRC-45 | `/hugo-modules/` | Modules 总览 |
| SRC-46 | `/hugo-modules/use-modules/` | 引入模块、data/i18n 深合并 |
| SRC-47 | `/hugo-modules/theme-components/` | **唯一记载主题配置限制**的页面（旧页但仍在线） |
| SRC-48 | `/commands/hugo_new_theme/` | `hugo new theme` 生成的 `theme.toml` 模板 |
| SRC-49 | `/contribute/themes/` | 上架 themes.gohugo.io 的入口页（正文只剩跳转） |
| SRC-104 | `/functions/lang/translate/` | `lang.Translate`/`T`/`i18n` 查找顺序与复数 |

### 3.3 内容模型与输出

| ID | 页面 | 本库用途 |
| --- | --- | --- |
| SRC-55 | `/content-management/page-bundles/` | leaf/branch bundle 判定 |
| SRC-56 | `/content-management/page-resources/` | 资源集合 API |
| SRC-57 | `/content-management/front-matter/` | front matter 字段、`params` 下的自定义字段 |
| SRC-58 | `/content-management/multilingual/` | 翻译文件、`translationKey`、共享资源 |
| SRC-59 | `/content-management/summaries/` | `.Summary` 优先级、`strings.Truncate` |
| SRC-60 | `/content-management/taxonomies/` | taxonomy/term 页生成 |
| SRC-61 | `/quick-reference/page-collections/` | `.Pages`/`.RegularPages` 等集合语义 |
| SRC-105 | `/shortcodes/` | 内建 shortcode 清单 |

### 3.4 资源管线与图像

| ID | 页面 | 本库用途 |
| --- | --- | --- |
| SRC-65 | `/hugo-pipes/introduction/` | Pipes 总览（现已拆到 functions/methods 页） |
| SRC-66 | `/functions/css/sass/` | `css.Sass`、libsass/dartsass、弃用状态 |
| SRC-67 | `/functions/css/postcss/` | PostCSS 的 Node 依赖与 allowlist |
| SRC-68 | `/functions/js/` | `js.*` 命名空间 |
| SRC-69 | `/functions/js/build/` | `js.Build`（esbuild）、`jsconfig.json` |
| SRC-70 | `/functions/resources/get/` | `resources.Get` 只认 `assets/` |
| SRC-71 | `/functions/resources/match/` | `resources.Match`/`GetMatch` |
| SRC-72 | `/functions/resources/concat/` | `resources.Concat` 的同媒体类型限制 |
| SRC-73 | `/functions/resources/copy/` | `resources.Copy` |
| SRC-74 | `/functions/resources/minify/` | `resources.Minify` |
| SRC-75 | `/functions/resources/fingerprint/` | 指纹文件名与 `.Data.Integrity` |
| SRC-76 | `/functions/resources/postprocess/` | 弃用 → `templates.Defer`（≥0.164.0） |
| SRC-77 | `/functions/resources/getremote/` | 远程资源与 `security.http` 限制 |
| SRC-78 | `/content-management/image-processing/` | 图像处理支持格式与选项 |
| SRC-79 | `/methods/resource/process/` | `.Process` 过滤器 |
| SRC-80 | `/methods/resource/resize/` | `.Resize`/`.Fit`/`.Fill` |
| SRC-81 | `/functions/images/autoorient/` | `images.AutoOrient` 必须首位 |
| SRC-82 | `/configuration/imaging/` | `imaging` 默认值与质量 |
| SRC-83 | `/getting-started/directory-structure/` | `assets/`、`static/`、`layouts/` 语义 |

### 3.5 CLI、版本、发布、安全

| ID | 页面 | 本库用途 |
| --- | --- | --- |
| SRC-90 | `/news/` | 版本序列与发布节奏 |
| SRC-91 | `/installation/linux/` | 四种 edition、libsass 仅 extended |
| SRC-92 | `/news/0.153.0-relnotes/` | WebP 全 edition 可用 |
| SRC-93 | `/news/<version>-relnotes/` | 各版本破坏性变更（按版本号取页） |
| SRC-94 | `/commands/` | 命令树 |
| SRC-95 | `/commands/hugo/` | 构建命令与 flags |
| SRC-96 | `/commands/hugo_server/` | server flags |
| SRC-97 | `/commands/hugo_new_content/` | 新建内容 |
| SRC-98 | `/commands/hugo_config/` | 查看合并后配置 |
| SRC-99 | `/commands/hugo_gen_chromastyles/` | 代码高亮 CSS |
| SRC-100 | `/commands/hugo_mod_vendor/` | 离线构建 |
| SRC-101 | `/troubleshooting/deprecation/` | 弃用政策（INFO 3 minor → WARN 12 minor → ERROR） |
| SRC-102 | `/troubleshooting/audit/` | 站内审计命令与可疑输出模式 |
| SRC-103 | `/configuration/security/` 同 SRC-39 | 安全默认值（内容注入/HTTP/exec/node） |

### 3.6 非 gohugo.io 来源

| ID | 来源 | 用途 |
| --- | --- | --- |
| SRC-200 | <https://github.com/gohugoio/hugoThemesSiteBuilder#readme> | 上架 themes.gohugo.io 的官方硬条件（`theme.toml` 字段、图片规格、PR 流程） |
| SRC-201 | <https://github.com/gohugoio/hugo/issues/4355> | CSS `url()` 不被重写（issue 长期 open） |
| SRC-202 | <https://themes.gohugo.io/themes/ananke/> | 主题列表页实际展示的字段（License/Author/Tags/Demo） |
| SRC-203 | PaperMod 的 `theme.toml` 实例 | 在用主题的字段实况（含 `min_version`） |
| SRC-204 | <https://github.com/gohugoio/hugo/releases.atom> | 版本发布流（核对节奏用） |

## 4. 未核实总表（不得作为实现依据）

来源文档里凡标 `⟦U⟧` 的条目汇总在此，便于集中补证：

| # | 待查项 | 影响 |
| --- | --- | --- |
| U1 | 模板查找「彻底未命中」时的官方文档行为（本库用 E4/E5 补齐：仅 WARN + 静默缺页） | 已被实测覆盖，文档层面仍缺 |
| U2 | `theme.toml` 官方**必填**字段清单；Hugo 构建是否读取 `theme.toml` | gallery 校验口径 |
| U3 | 主题 `content/` 是否真被挂载合并（默认 mount 表含 content） | 仓库「主题不带 content」是设计约定，不是 Hugo 强制 |
| U4 | `hugo build` 与 `hugo` 两个入口的行为差异 | CI 命令选择 |
| U5 | `hugo mod verify` 语义 | 依赖校验步骤 |
| U6 | `params` 深合并的**文档**表述（E1 已实测出深合并，但文档页被截断） | 契约说明措辞 |
| U7 | `markup.highlight.*` 细节与语法高亮页 | 代码块配色 |
| U8 | 内建 shortcode `.Attributes` 是否存在（无文档页、方法清单无） | 自定义 shortcode 设计 |
| U9 | `.InnerDeindent` 去缩进的具体行为 | shortcode 输出缩进 |
| U10 | shortcode 查找表中 `foo.html.en.html` 的排序（疑文档笔误） | 极少用 |
| U11 | Windows 路径/长路径专门页；server 模板缓存失效机制 | 本地开发体验 |
| U12 | `.File` 属性集合、`.Fragments` 结构与 `.Scratch` 移除版本 | 高级 API |
| U13 | `related-content/`、`content-adapters/`、`mathematics/`、`urls/`、`sections/` 原文 | 内容层细节 |
| U14 | `security.node` 与 `GONOSUMDB`/`GOPRIVATE` 在 Hugo 中的处理 | 私有模块 |
| U15 | 各 `css.Sass`/`resources.*` 函数引入的最低版本 | 版本矩阵 |
| U16 | `resources.PostProcess` 之后的 `templates.Defer` 完整迁移规则 | 渐进增强脚本 |

## 5. 追溯协议（agent 必读）

写主题代码前、遇到规则疑问时，按顺序执行：

1. **看规则 ID**：在对应 reference 文档里找到 `TPL-`/`CFG-`/`CNT-`/`AST-`/`REL-` 编号的规则行，读行尾标记。
2. **`⟦D⟧`**：按 `SRC-xx` 在 §3 表里定位 URL，用 `web_fetch` 取原文确认措辞；文档已改版时以原文为准并回写规则（见 §6 维护协议）。
3. **`⟦E⟧`**：打开 `../evidence/2026-10-20-hugo-v0.168.0-smoke.md` 的对应实验，读原始命令与原始 WARN/ERROR 文本；需要复核时运行 `../evidence/smoke.ps1`（Windows PowerShell 7）。
4. **`⟦I⟧` / `⟦U⟧`**：先补证（抓文档或加一条实测），再决定实现；不得跳过。
5. **冲突**：`⟦E⟧` 与 `⟦D⟧` 冲突时以实测为准，同时在规则行写明「文档称 X，0.168.0 实测 Y」——历史上有两例：`_default` 旧路径仍可用（E8）、旧 `partials/` 目录仍可用（E9）；本仓库仍**禁用**旧路径，原因是项目约定与 `--printUnusedTemplates` 会报错，而不是"Hugo 不支持"。

## 6. 维护协议（Hugo 升级时）

1. 记录新版本号与抓取日期（本文件头部），重跑 `../evidence/smoke.ps1`，把新结果追加为新纪要文件 `../evidence/<日期>-hugo-v<版本>-smoke.md`，不要改写旧纪要。
2. 逐条复查标 `⟦D⟧` 但影响构建结果的规则（模板路径、配置段限制、安全默认值、CLI flags），改动的写进新 reference 版本并在 `docs/decisions.md` 追加修正条目（该文件只追加，不改写历史）。
3. `⟦U⟧` 表中已被新文档回答的条目，移出待查表并升级为 `⟦D⟧`。
4. 更新 `SKILL.md` 的「基线版本」一行与 `AGENTS.md` 的指针说明；若最低支持版本变化，同步 `module.hugoVersion.min` 与 CI 矩阵。
