# 模板系统规则（Hugo ≥ 0.146 新模板系统）

**用途**：写 `layouts/` 下任何文件前读本文件。主题最低支持 Hugo 0.146.0（`docs/decisions.md` D4），规则核对至 **v0.168.0**（2026-10-20）。
标记含义见 `sources.md` §1：`⟦D⟧` 文档明文、`⟦E⟧` 本地实测、`⟦I⟧` 推断、`⟦U⟧` 未核实。

## 1. 文件放在哪（唯一正确的路径）

| 要写的东西 | 路径 | 备注 |
| --- | --- | --- |
| 基模板 | `layouts/baseof.html` | 必须配 `{{ block "main" . }}` |
| 首页 | `layouts/home.html` | **不是** `index.html` |
| 普通内容页 | `layouts/page.html` | `single.html` 是它的回退 |
| section 列表 | `layouts/section.html` | 缺失时回退 `list.html` → `all.html` |
| 特定 section 的版式 | `layouts/posts/page.html`、`layouts/posts/section.html` | 目录名 = Page path 根，可任意嵌套 |
| taxonomy 列表 / 术语页 | `layouts/taxonomy.html`、`layouts/term.html` | 两者**不再**由同一文件兼任 |
| 兜底 | `layouts/all.html` | 只在没有更具体模板时生效 |
| 404 | `layouts/404.html`，多语言 `layouts/404.<lang>.html` | 必须在 `layouts` 根 |
| partial | `layouts/_partials/…` | 旧 `layouts/partials/` 已废弃 |
| shortcode | `layouts/_shortcodes/…` | 旧 `layouts/shortcodes/` 已废弃 |
| render hook | `layouts/_markup/render-<kind>.html` | 固定 7 个文件名 |
| RSS / sitemap / robots 覆盖 | `layouts/home.rss.xml`、`layouts/sitemap.xml`、`layouts/robots.txt` | 按输出格式后缀命名 |
| 旧 `_default/` | **禁止** | 见 TPL-02 与 E8 |

## 2. 硬规则

- **TPL-01** `layouts/_default/` 目录已删除，其内容上移到 `layouts/` 根；旧教程的 `_default/single.html` 写法一律不写。⟦D⟧ SRC-01
- **TPL-02** 0.168.0 实测旧路径 `_default/page.html` **仍会被渲染**，但 `--printUnusedTemplates` 报 `Template /_default/page.html is unused`，加 `--panicOnWarning` 直接 panic；因此本项目禁用旧路径的理由是**约定 + 构建会红**，不是"Hugo 不支持"。⟦E⟧ E8
- **TPL-03** `layouts/partials` → `layouts/_partials`；`layouts/shortcodes` → `layouts/_shortcodes`。⟦D⟧ SRC-01；旧目录在 0.168.0 实测仍可用（E9），同样因 `--panicOnWarning`/审计而禁用。⟦E⟧ E9
- **TPL-04** `layouts` 下**任何不以 `_` 开头的目录**都视作 Page path 的根，可任意深度嵌套；不再有特殊的顶层 `layouts/taxonomy/`、`layouts/section/` 语义。⟦D⟧ SRC-01
- **TPL-05** 首页模板是 `home.html`；"`index.html` 是首页模板"已不成立。⟦D⟧ SRC-01
- **TPL-06** `taxonomy.html` 只服务 kind=`taxonomy`；term 页需要 `term.html`，或用 `list.html`/`all.html` 兜底。⟦D⟧ SRC-01；缺模板时 0.168.0 会为两个 kind 各报一条 WARN（E7）。⟦E⟧ E7
- **TPL-07** base 模板的标识符写在第一个点**之后**：`baseof.list.html`（不是 `list-baseof.html`）、`baseof.term.html`。⟦D⟧ SRC-01
- **TPL-08** `_internal` 模板已移除：`{{ template "_internal/opengraph.html" . }}` → `{{ partial "opengraph.html" . }}`；要改内建 partial，在 `layouts/_partials/` 放同名文件即可覆盖。⟦D⟧ SRC-01, SRC-07
- **TPL-09** `all.html` 是最后的兜底，可渲染所有 HTML 页面；同时存在 `list.html` 时 `list` 胜（E3 实测 `all.html` 被报 unused）。⟦D⟧ SRC-01, SRC-02；⟦E⟧ E3
- **TPL-10** 模板文件名允许的标识符只有：Page kind（`home`/`page`/`section`/`taxonomy`/`term`）、标准 layout（`list`/`single`/`all`）、自定义 layout（front matter `layout`）、语言、输出格式、媒体类型后缀，例如 `all.en.html`、`home.rss.xml`。⟦D⟧ SRC-01
- **TPL-11** 主题模板与项目模板**交错查找**，"最具体者胜"，项目不因"覆盖"而整体遮蔽主题。⟦D⟧ SRC-03
- **TPL-12** 404 模板放 `layouts` 根：`layouts/404.html`；多语言 `404.<lang>.html`。⟦D⟧ SRC-09
- **TPL-13** render hook 只对 **Markdown** 生效；其他内容格式没有钩子。⟦D⟧ SRC-13
- **TPL-14** 任何被放进 `layouts/` 的文件都会被当作模板解析：残留的 `.bak`、草稿、旧目录文件会被报 unused 并让 `--panicOnWarning` 构建失败（E12）。⟦E⟧ E12
- **TPL-15** 模板没匹配上不会报错：只有一条 `WARN found no layout file for "html" for kind "page"`，构建 exit 0，页面静默消失（E4）；本项目 CI 用 `--panicOnWarning` 把它变成 exit 2 的失败（E5）。⟦E⟧ E4, E5

## 3. 查找顺序（决定文件该叫什么名字）

权重从高到低（同一页面同时存在多个候选时，胜出者在上）：⟦D⟧ SRC-01, SRC-03

| # | 维度 | 例子 |
| --- | --- | --- |
| 1 | Layout custom（front matter `layout`） | `layouts/posts/special.html` |
| 2 | Page kind | `home`/`section`/`taxonomy`/`term`/`page` |
| 3 | 标准 layout（第一优先组） | `list`、`single` |
| 4 | Output format | `html`、`rss` |
| 5 | 标准 layout（第二优先组） | `all` |
| 6 | 语言 | `en`、`zh` |
| 7 | Media type | `text/html` |
| 8 | Page path | `/blog/mypost`，越靠近目标越具体者胜 |
| 9 | Type（front matter `type`） | 查找时替换 Page path 中的 section 目录 |

补充规则：

- 语言与输出格式的相对权重：`index.fr.amp.html` > `index.amp.html` > `index.fr.html`。⟦D⟧ SRC-03
- Page path 就近匹配：`layouts/docs/baseof.html` 服务 `/docs` 及以下；`layouts/tags/term.html` 服务 tags 的全部 term，而 `blue` 这种单个 term 可被 `layouts/tags/blue/list.html` 更具体地接管。⟦D⟧ SRC-01
- 输出格式 name+suffix 双匹配优先；媒体类型有多个后缀时**只用第一个**（主后缀决定模板文件名后缀）。⟦D⟧ SRC-03, SRC-36

**回退链（实测成立）**：`page → single → all`；`section`/`home`/`taxonomy`/`term` → `list → all`。⟦D⟧ SRC-02；`single.html` 作为 page kind 回退已实测（E8b）。⟦E⟧ E8b

## 4. base 模板合约（最容易静默失败的地方）

base 只有在被解析模板**同时满足**两个条件时才套用：⟦D⟧ SRC-02

1. 包含至少一个 `define`；
2. 除了 `define`、空白、模板注释外不含任何东西。

套用时，base 里的 `block` 被对应同名 `define` 的内容替换。**`block` 名与 `define` 名必须逐字一致**；不一致不会报错，只会渲染 base 内 `block` 的默认内容（常见表现：整页只剩导航和页脚，正文消失）。⟦D⟧ SRC-02；⟦I⟧ 静默失败机制

本项目的固定写法：

```go-html-template
{{/* layouts/baseof.html */}}
<!doctype html>
{{- $lang := site.Language.Params.locale | default site.Language.Lang }}
{{- $dir := site.Language.Params.dir | default `ltr` }}
<html lang="{{ $lang }}" dir="{{ $dir }}">
  {{ partial "head.html" . }}
  <body>
    {{ partial "header.html" . }}
    <main>{{ block "main" . }}{{ end }}</main>
    {{ partial "footer.html" . }}
  </body>
</html>
```

语言字段不要直接写 `.Language.LanguageCode` 或 `.Language.Locale`：0.146.0 没有 `.Locale`/`.Direction`/`.Label`（用即 exit 1），0.168.0 又弃用 `.LanguageCode`/`.LanguageDirection`/`.LanguageName`（WARN）；跨两端用 `[languages.<lang>.params]` 的 `locale`/`dir`/`label` + 回退 `.Language.Lang`（CNT-19/CNT-20、E13）。

```go-html-template
{{/* layouts/page.html：只允许 define 与注释 */}}
{{ define "main" }}
  <article>{{ .Content }}</article>
{{ end }}
```

- **TPL-16** `page.html`、`section.html`、`home.html` 等"子模板"里除 `define` 之外不要写裸 HTML 或其他 action，否则 base 完全不套用、整页按原样输出，且**不报错**。⟦D⟧ SRC-02
- **TPL-17** 变量赋值要放进 `{{ define }}` 内：`{{ $x := partial "a.html" . }}` 写在 define 外会 `parse of template failed: undefined variable "$x"`（E10）。⟦E⟧ E10

## 5. partial、view 与内容渲染

- `partial NAME [CONTEXT]`：⟦D⟧ SRC-15
  - 有 `return` 时返回任意类型；**无 `return` 时返回 `template.HTML`**。
  - `CONTEXT` 可省略（省略后 partial 内的 `.` 不再是当前 Page，用 `.Title`/`.Params` 会失败）——需要 Page 就显式传 `.`，或传 `dict`。
  - `./`、`../` 相对路径自 **v0.167.0** 起可用，且**只能在 partial 内**使用，越出 `_partials` 报错。
- `partialCached LAYOUT CONTEXT [VARIANT...]`：⟦D⟧ SRC-16
  - 每个站点/语言各一份缓存；variant 参数**不会传给** partial，只参与缓存键。
  - 并行渲染时同一 partial 可能被执行两次（不要在 partial 内做副作用）。
- `PAGE.Render VIEW [CONTEXT]`：视图模板可放 `layouts` 任意层级（`_views/` 只是社区约定），默认把当前 Page 当 context；斜杠路径自 **v0.164.0**、`CONTEXT` 自 **v0.166.0**。⟦D⟧ SRC-17
- `PAGE.RenderString [OPTIONS] MARKUP`：`display` 取 `inline`（默认，去掉外层 `<p>`）或 `block`。⟦D⟧ SRC-18
- **TPL-18** partial 查找**不看** kind/type/path/语言/输出格式，只按名字具体度递降：`footer.section.de.html` → `footer.section.html` → `footer.de.html` → `footer.html`。⟦D⟧ SRC-02

## 6. shortcode

- 放 `layouts/_shortcodes/<name>.html`，可分子目录，调用 `{{< media/audio path=… >}}`。⟦D⟧ SRC-05
- 可用方法：`Get`、`Inner`、`InnerDeindent`、`IsNamedParams`、`Name`、`Ordinal`、`Page`、`Params`、`Parent`、`Position`、`Ref`、`RelRef`、`Site`、`Store`（**没有 `.Attributes`**）。⟦D⟧ SRC-05
- 命名参数 → `.Params` 是 map；位置参数 → slice，用 `.Get 0` 取。⟦D⟧ SRC-05
- 渲染顺序：Markdown 记法 `{{% %}}` 在 Markdown 渲染器**之前**，标准记法 `{{< >}}` 在**之后**。⟦D⟧ SRC-05
- **TPL-19** 标准记法下 `.Inner` 是原始 Markdown，必须 `{{ .Inner | .Page.RenderString }}` 才会转成 HTML。⟦D⟧ SRC-05
- 嵌套用 `.Parent`；页面是否用到某 shortcode 用 `.HasShortcode "audio"`；报错信息带 `.Name` 与 `.Position`（形如 `content/example/index.md:7:1`）。⟦D⟧ SRC-05
- `templates.Inner`（包裹组件）自 **v0.154.0**：partial 内写 `{{ templates.Inner . }}`，调用处用 `{{ with partial "components/wrapper.html" . }}…{{ end }}`。⟦D⟧ SRC-08

## 7. render hook

固定 7 个文件名，放 `layouts/_markup/`（可出现在 `layouts` 任意层级的 `_markup` 目录）：⟦D⟧ SRC-13

`render-blockquote.html`、`render-codeblock.html`、`render-heading.html`、`render-image.html`、`render-link.html`、`render-passthrough.html`、`render-table.html`

- 可按 type/kind/语言/输出格式细分：`render-link.rss.xml`、`layouts/books/_markup/render-link.html`。⟦D⟧ SRC-13
- image hook 的 context 字段：`Attributes`（需 `markup.goldmark.parser.attribute.block = true`）、`Destination`、`IsBlock`、`Ordinal`（0.160+）、`Page`、`PageInner`、`PlainText`、`Position`（0.160+）、`Text`、`Title`。⟦D⟧ SRC-14
- 内建 image hook 由 `markup.goldmark.renderHooks.image.useEmbedded`（`auto`/`always`/`fallback`/`never`）控制，`auto` 只在多语言单主机且关闭共享资源复制时启用；项目/主题自定义钩子优先。⟦D⟧ SRC-14
- 做 figure 式图片 hook 时注意 `markup.goldmark.parser.wrapStandAloneImageWithinParagraph = false`，否则图被包在 `<p>` 里。⟦D⟧ SRC-40

## 8. 分页

- 只能在 `home`/`section`/`taxonomy`/`term` 模板调用。⟦D⟧ SRC-06
- `.Paginate COLLECTION [SIZE]`：可先过滤/排序/分组，可覆盖每页条数；`.Paginator`：只能分页模板收到的集合，不能改条数也不能排序。⟦D⟧ SRC-06, SRC-19
- **TPL-20** 分页是**一次性、不可变**的：先调用 `.Paginator` 再调用 `.Paginate` 不会重新分页，第二次静默返回第一次结果；需要两处复用请走 `.Paginator.Pagers`。⟦D⟧ SRC-06
- 写法：`{{ range (.Paginate $pages 7).Pages }}` + `{{ partial "pagination.html" . }}`；内建 partial 等价 `(dict "page" . "format" "default")`，另一格式 `"terse"`，覆盖方式是复制到 `layouts/_partials/pagination.html`。⟦D⟧ SRC-06, SRC-07
- URL 形如 `/posts/page/2/`；配置 `[pagination] pagerSize`（默认 10）、`path`（默认 `page`）、`disableAliases`（第一页的 alias 重定向）。⟦D⟧ SRC-06
- **TPL-21** 条件分页不要用 `compare.Conditional`（参数急切求值会在判断前执行 `Paginate`），用 if/else 各写一遍。⟦D⟧ SRC-06

## 9. 版本最低要求（写特性声明/`module.hugoVersion` 时用）

| 特性 | 最低版本 | 来源 |
| --- | --- | --- |
| 新模板系统（本库基线） | 0.146.0 | SRC-01 |
| `templates.Inner` 包裹组件 | 0.154.0 | SRC-08 |
| `Page.Render` 斜杠路径 | 0.164.0 | SRC-17 |
| `Page.Render` 自定义 CONTEXT | 0.166.0 | SRC-17 |
| `./`、`../` 相对 partial 路径 | 0.167.0 | SRC-15 |
| `return` 可用于任意模板位置 | 0.166.0 | SRC-93（0.166.0-relnotes） |

本项目最低支持定在 0.146.0（D4），上表所有特性都在支持范围内；`module.hugoVersion.min` 只能写 `0.146.0`（见 `configuration-modules.md` CFG-10）。⟦E⟧ E6 证明该字段不匹配时只 WARN。

## 10. 本仓库的模板约定（与 D4/D5 对齐）

- 主题不交付 `content/`；模板只消费站点内容。
- 固定 section 名叫 `posts`：`layouts/posts/page.html`、`layouts/posts/section.html`；缺失时回退 `layouts/page.html`、`layouts/section.html`。⟦D⟧ 见 `docs/decisions.md` D5
- 页面级版式不靠 front matter `layout` 决定，靠目录/section 匹配（查找权重表中第 8、9 项）。
- 所有页面共用 `layouts/baseof.html` + `define "main"`；`block` 名统一 `main`。
- 不在模板里写死语言文案：全部走 `T`（`lang.Translate`），见 `content-output.md` CNT-16。

## 11. 坑清单（对照实测）

| 症状 | 原因 | 规则 |
| --- | --- | --- |
| 页面消失、构建仍成功 | 没有匹配模板，只有 WARN | TPL-15 |
| 整页只剩 base 外壳 | 子模板里混了裸 HTML/其他 action，或 block 名与 define 名不一致 | TPL-16 |
| `undefined variable "$x"` | 变量赋值写在 `{{ define }}` 外 | TPL-17 |
| `_default` 里的文件不被使用 | 新系统不认 `_default` 为主查找路径（实测仍能渲染但报 unused） | TPL-02 |
| `list-baseof.html` 不生效 | base 标识符应在第一个点后 | TPL-07 |
| term 页没样式 | 只写了 `taxonomy.html` | TPL-06 |
| CSS/JS 里改了没生效 | 见 `assets-pipeline.md`（管线缓存键） | AST-02 |

## 12. 来源

`SRC-01`–`SRC-22`、`SRC-36`、`SRC-40`；实测 `E1`–`E10`、`E12`。URL 与未核实项见 `sources.md`。
