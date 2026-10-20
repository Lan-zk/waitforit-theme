# 内容模型、集合、输出格式与 Markdown 规则

**用途**：写列表页/文章页/feed/sitemap/robots、或用 `.Pages` 系列、`.Resources`、分页、i18n 渲染时读本文件。基线 Hugo **v0.168.0**（2026-10-20）。标记含义见 `sources.md` §1。

## 1. bundle 与 section（内容长什么样）

- **CNT-01** bundle 由**文件名**决定：目录含 `index.md` = leaf bundle（kind=`page`，不能再嵌套 bundle）；含 `_index.md` = branch bundle（kind ∈ `home`/`section`/`taxonomy`/`term`）。**顶层目录即使没有 `_index.md` 也算 branch**。⟦D⟧ SRC-55
- **CNT-02** branch bundle 的资源不含 `page` 类型；leaf 里其他 `.md` 只能当 page resource 访问、不单独渲染。⟦D⟧ SRC-55, SRC-56
- **CNT-03** `.Resources` 只对 bundle 自身可见，不继承、不跨页；跨页共享靠 headless bundle（`headless: true` = render/list 全 `never`）。⟦D⟧ SRC-56
- **CNT-04** **非顶层**目录必须写 `_index.md` 才成为 section（顶层目录天然是 section）；这是"section 模板不生效"最常见的原因。⟦D⟧ SRC-55
- **CNT-05** taxonomy/term 页**自动生成**，不需要 `content/` 文件就有页面；只有当要给定 term 加标题/元数据/图片时才建 `content/<taxonomy>/<term>/_index.md`。⟦D⟧ SRC-60
- **CNT-06** 默认 taxonomies 是 `tags`、`categories`；只要有该项数据就生成 taxonomy 与 term 页，**没有对应模板时 0.168.0 会各报一条 WARN**（E7），`--panicOnWarning` 下失败。主题必须提供 `taxonomy.html` + `term.html`，或由站点在配置里禁用 taxonomy。⟦D⟧ SRC-60；⟦E⟧ E7

## 2. 页面集合 API（列表页选哪个）

| API | 语义 | 用在哪 |
| --- | --- | --- |
| `.Pages` | 当前 section 的 regular pages **+ 直接子 section 的 section pages** | 首页/分区首页（"regular pages within the current section, and section pages of immediate descendant sections"）⟦D⟧ SRC-61 |
| `.RegularPages` | 当前 section 内的 regular pages（不含子 section 里的页） | 列表页首选 ⟦D⟧ SRC-61 |
| `.RegularPagesRecursive` | 含所有后代 section 的 regular pages | 归档/全站索引 ⟦D⟧ SRC-61 |
| `.Sections` | 直接子 section 页 | 侧栏/子分区导航 ⟦D⟧ SRC-61 |
| `.Site.Pages` | 全站所有页面（含 home/section/taxonomy/term） | 慎用，混 kind ⟦D⟧ SRC-61；E1 实测 6 页 |
| `.Site.RegularPages` | 全站 regular pages | 首页最新文章 ⟦D⟧ SRC-61；E1 实测 2 页 ⟦E⟧ E1 |
| `.Site.AllPages` | 所有语言的页面 | 多语站不要误用 ⟦D⟧ SRC-61 |
| `.Site.Sections` | 顶层 section 页 | 主导航兜底 ⟦D⟧ SRC-61 |
| `.Resources` | bundle 资源集合 | `Get`（精确、大小写敏感）、`GetMatch`（glob）、`Match`、`ByType "image"` ⟦D⟧ SRC-56 |
| `.Translations` | 其它语言版本（**不含当前语言**），按 weight → name 排序 | 语言切换器 ⟦D⟧ SRC-21 |
| `.AllTranslations` | 含自身的全部版本 | 详情页 ⟦D⟧ SRC-21 |
| `.TableOfContents` | 已渲染的 `<nav id="TableOfContents">` | 文章页 ⟦D⟧ SRC-22 |
| `.Summary` / `.Truncated` | 摘要 / 是否被截断 | 列表页 ⟦D⟧ SRC-59 |
| `.Store` | 页面级 scratch（`.Scratch` 已退场，`/methods/page/scratch/` 302 到 `store`） | 跨 shortcode/partial 传值 ⟦D⟧ SRC-20 |
| `.Params` / `.Param` | 自定义参数（front matter 的 `params` 下） | 邮件体字段等 ⟦D⟧ SRC-57 |

- **CNT-07** `.Summary` 的优先级：`<!--more-->` > front matter `summary` > 自动截断（由 `summaryLength` 控制）。⟦D⟧ SRC-59
- **CNT-08** 非保留的 front matter 字段必须写在 `params` 下才进 `.Params`；写在顶层的自定义键会被忽略。⟦D⟧ SRC-57
- **CNT-09** `summarize` 函数/方法在现行索引中**不存在**；需要定长摘要用 `{{ .Content | strings.Truncate 42 }}`。⟦D⟧ SRC-59
- **CNT-10** `.Store` 在内容渲染前读到的是空值：父模板需先触发渲染（`{{ $noop := .Content }}`），再从 `.Store` 取值。⟦D⟧ SRC-20

## 3. 分页

分页 API 与"一次性、不可变"行为见 `templates.md` §8（TPL-20、TPL-21）。此处只记内容侧要点：

- 只能在 `home`/`section`/`taxonomy`/`term` 模板调用；`.Paginate` 可传任意集合与每页条数，`.Paginator` 只能分页当前集合。⟦D⟧ SRC-06, SRC-19
- Pager 可用字段：`.First` `.Prev` `.Next` `.Last` `.PageNumber` `.TotalPages` `.TotalNumberOfElements` `.PagerSize` `.Pages` `.Pagers` `.PageGroups` `.URL` `.HasPrev` `.HasNext` `.NumberOfElements`。⟦D⟧ SRC-06
- 分组分页：`.Paginate ($pages.GroupByDate "Jan 2006")` 后用 `.PageGroups`。⟦D⟧ SRC-06

## 4. 输出格式、RSS、sitemap、robots、JSON

- **CNT-11** 模板命名最高特异度是 `[page kind].[output format].[suffix]`：`layouts/section.html.html`、`layouts/section.rss.xml`、`layouts/section.json.json`。⟦D⟧ SRC-35
- **CNT-12** `permalinkable`：`html`/`amp` 默认 true，其余默认 false。在 `page.json.json` 里 `.RelPermalink` 返回的是**主格式** URL；要拿该格式自己的 URL 用 `.OutputFormats.Get "json"` 再 `.RelPermalink`。⟦D⟧ SRC-35
- **CNT-13** head 里的 feed 声明标准写法：`{{ range .AlternativeOutputFormats }}<link rel="{{ .Rel }}" type="{{ .MediaType.Type }}" href="{{ .Permalink | safeURL }}">{{ end }}`。⟦D⟧ SRC-35
- **CNT-14** RSS 默认给 home/section/taxonomy/term 生成；覆盖用 `layouts/{home,section,taxonomy,term}.rss.xml`（context 同时有 `.Page` 和 `.Site`）；条数 `[services.rss] limit`（`-1` 不限）；全关 `disableKinds = ['rss']`；内建模板读取 `copyright` 与 `params.author.name/email`。⟦D⟧ SRC-11
- **CNT-15** sitemap：单语 `public/sitemap.xml`；多语每语言一份 + 根 `sitemapindex.xml`；覆盖用 `layouts/sitemap.xml`、`layouts/sitemapindex.xml`；页面级 `[sitemap] changefreq/priority/disable`，模板里读 `.Sitemap.ChangeFreq`/`.Priority`；`disableKinds = ['sitemap']` 关闭。⟦D⟧ SRC-10
- **CNT-16** robots.txt：需站点 `enableRobotsTXT = true`；内建内容只有 `User-agent: *`；查找顺序**只有两级**：`layouts/robots.txt` → `themes/<THEME>/layouts/robots.txt`。主题要加 sitemap 行只能交付 `layouts/robots.txt`。⟦D⟧ SRC-12
- **CNT-17** JSON 是内建 output format，但必须自己写 `layouts/<kind>.json.json` 才产出；同时要站点在 `[outputs]` 里加上 `json`。⟦D⟧ SRC-34, SRC-35

## 5. i18n 渲染（模板侧）

- **CNT-18** 翻译函数是 `lang.Translate KEY [CONTEXT]`，别名 `T` 与 `i18n`；缺键返回**空字符串**，不报错。⟦D⟧ SRC-104
- **CNT-19** hreflang 用 `.Language.Locale`（如 `en-US`），**不要**用 `.Language.Lang`（只有 `en`）；文案回退写 `or .Language.Label .Language.Name`。⟦D⟧ SRC-21
- **CNT-20** 当前语言方向写 `<html dir="{{ site.Language.Direction }}">`；`Direction`/`Label`/`Locale` 是 `.Site.Language` 的现行字段（`languageCode`/`languageDirection`/`languageName` 自 v0.158 弃用）。⟦D⟧ SRC-38, SRC-21
- **CNT-21** 内容侧：翻译文件名后缀语言码必须**小写**（`about.en-us.md`）；`translationKey` 可跨路径配对；v0.167.0 起 section/taxonomy/term 的 `slug` 会下传到子页 URL。⟦D⟧ SRC-58
- **CNT-22** 多语单主机默认不复制共享 page resource，此时 Hugo 自动启用内建 link/image render hook；要复制设 `[markup.goldmark] duplicateResourceFiles = true`。⟦D⟧ SRC-58

## 6. Markdown（Goldmark）默认行为

- **CNT-23** 默认启用的扩展：`definitionList`、`footnote`、`linkify`、`strikethrough`、`table`、`taskList`、`typographer`；**默认关闭**：`cjk`（`enable=false`）、`extras`（del/ins/mark/sub/sup）、`passthrough`（数学公式不渲染）。⟦D⟧ SRC-40
- **CNT-24** `typographer` 默认开启：`--` → `&ndash;`、`---` → `&mdash;`、`...` → `&hellip;`、`'` → `&rsquo;`、`<<`/`>>` → `«»`。要显示原始 `--` 必须关掉它（站点配置）或用 code span。⟦D⟧ SRC-40
- **CNT-25** 其他默认：`parser.autoHeadingID = true`、`autoIDType = 'github'`（决定锚点 id，TOC 与 `.Fragments` 依赖）、`attribute.title = true`/`attribute.block = false`、**`renderer.unsafe = false`（Markdown 里的裸 HTML 被丢弃）**、`hardWraps = false`、`renderHooks.image/link` 的 `enableDefault=false`/`useEmbedded='auto'`、`wrapStandAloneImageWithinParagraph = true`。⟦D⟧ SRC-40
- **CNT-26** 主题**不能**改 `markup.*`（CFG-01）：所有 Markdown 行为差异都必须由站点配置或模板内规避（例如用 code span 保护 `--`）。⟦D⟧ SRC-47；⟦I⟧ 结合推论

## 7. shortcode（内容侧调用）

- 内建 shortcode 清单：`details`、`figure`、`highlight`、`instagram`、`param`、`qr`、`ref`、`relref`、`vimeo`、`x`、`youtube`（`tweet` 已被 `x` 取代，`gist` 已不在列）。⟦D⟧ SRC-105
- 主题自定义 shortcode 放 `layouts/_shortcodes/`，实现细节见 `templates.md` §6。⟦D⟧ SRC-05
- **CNT-27** `{{< >}}` 输出原样 HTML、内容**不经过** Markdown 渲染；`{{% %}}` 的内容会被当 Markdown 渲染。主题 shortcode 返回 HTML 时用 `{{< >}}`。⟦D⟧ SRC-05

## 8. 本仓库的内容契约（D5 对齐）

- 文章固定 section `posts`：`content/posts/<slug>/index.md`（leaf bundle，允许图）或 `content/posts/<slug>.md`。
- 邮件体 front matter：`title`、`description`、`date`、`from`、`to`、`subject`；自定义字段放 `params` 下（CNT-08）。
- 列表页用 `.RegularPages`（不递归）；归档类页面用 `.RegularPagesRecursive`（CNT-02、§2）。
- 404 与 taxonomy/term 模板必须存在（CNT-06、TPL-12），否则 `--panicOnWarning` 直接失败。
- 摘要优先用显式 `<!--more-->` 或 front matter `summary`（CNT-07），不依赖自动截断的长度。

## 9. 坑清单

| 症状 | 原因 | 规则 |
| --- | --- | --- |
| 列表页少页/多页 | 用了 `.Pages` 当 `.RegularPages`，或反之 | §2 |
| section 模板不生效 | 非顶层目录缺 `_index.md` | CNT-04 |
| 构建莫名 WARN 两个 kind | 有 taxonomy 数据但缺模板 | CNT-06 |
| 第二次分页结果不变 | 分页一次性、不可变 | TPL-20 |
| JSON 输出 404 | 只写了前端模板，没写 `<kind>.json.json` | CNT-17 |
| RSS 链接跳到主格式 | `permalinkable` 默认值 | CNT-12 |
| 正文里的 `<div>` 消失 | `renderer.unsafe = false` | CNT-25 |
| 语言切换 `hreflang` 少了地区码 | 用了 `.Language.Lang` | CNT-19 |
| i18n 缺词静默空白 | 缺键返回空串 | CNT-18 |

## 10. 来源

`SRC-05`、`SRC-06`、`SRC-10`–`SRC-12`、`SRC-19`–`SRC-22`、`SRC-34`、`SRC-35`、`SRC-38`、`SRC-40`、`SRC-55`–`SRC-61`、`SRC-104`、`SRC-105`；实测 `E1`、`E7`。URL 与未核实项见 `sources.md`。
