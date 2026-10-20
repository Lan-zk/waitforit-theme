# 实测纪要：Hugo 语言字段的版本边界与版本中立写法（E13）

- **日期**：2026-10-20（Asia/Shanghai）
- **Hugo**：`v0.146.0 windows/amd64` 与 `v0.168.0 windows/amd64`（标准版，非 extended；二进制位置 `%TEMP%\wf-hugo\v146\hugo.exe`、`%TEMP%\wf-hugo\v168\hugo.exe`）
- **夹具**：最小站点 `%TEMP%\wf-lang-probe\site`（`hugo.toml` + 单行 `layouts/home.html` + `content/_index.md`），一次性探针，未入库
- **目的**：`docs/design/design.md` D8 与 `references/content-output.md` CNT-19 原写「hreflang 用 `.Language.Locale`」「`<html lang="{{ site.Language.LanguageCode }}" dir="{{ .Language.Direction }}">`」。实现时发现这两套字段在最低支持版与当前稳定版之间互斥，必须钉死两端行为与可行写法。

结论回填：`references/content-output.md` CNT-19/CNT-20（版本边界 + 配方）、`references/release-ci.md` 0.158 行、`references/templates.md` base 示例；可复跑断言见 `smoke.ps1` 的 E13 段。

## 1. 探针与命令

每个探针重建最小站点后执行（两版同一命令，仅换二进制）：

```powershell
Select-String -Path $site\layouts\home.html -Pattern 'PROBE'
& $hugo --source $site --destination $out
# 读取 $out\index.html 里的 PROBE: 标记与 exit code
```

## 2. 字段可用性（P1–P3）

| 探针 | 模板表达式 | v0.146.0 | v0.168.0 |
| --- | --- | --- | --- |
| P1 | `{{ .Language.Locale }}` | **exit 1**：`can't evaluate field Locale in type *langs.Language` | exit 0，输出 `en`（未配置时回退 `Lang`） |
| P2 | `{{ .Language.Direction }}` | **exit 1**：`can't evaluate field Direction in type *langs.Language` | exit 0，输出空串（未配置 `languageDirection` 时） |
| P3 | `{{ .Language.LanguageCode }}` / `{{ .Language.LanguageDirection }}` | exit 0，输出 `code=en`、`dir=`（空） | exit 0，但各报一条 deprecation WARN（见下） |

0.168.0 的弃用 WARN 原文（`--panicOnWarning` 下升级为构建失败）：

```text
WARN  deprecated: .Language.LanguageCode was deprecated in Hugo v0.158.0 and will be removed in a future release. Use .Language.Locale instead.
WARN  deprecated: .Language.LanguageDirection was deprecated in Hugo v0.158.0 and will be removed in a future release. Use .Language.Direction instead.
WARN  deprecated: .Language.LanguageName was deprecated in Hugo v0.158.0 and will be removed in a future release. Use .Language.Label instead.
WARN  deprecated: .Site.Languages was deprecated in Hugo v0.156.0 and will be removed in a future release.
```

## 3. 配置键与回退（P4–P6、Q4）

| 探针 | 配置 | v0.168.0 结果 |
| --- | --- | --- |
| P4 | `[languages.en] languageCode = 'en-US'` | `.Locale` = `en-US`、`.LanguageCode` = `en-US`、`.Language.Lang` = `en`；但构建日志报 `WARN deprecated: project config key languages.en.languageCode … Use languages.en.locale instead` |
| P5 | `[languages.en] languageDirection = 'rtl'` | `.Direction` = `rtl`、`.LanguageDirection` = `rtl` |
| — | 两个键都不写 | `.Locale` 取 `Lang`（`en`）；`.Direction` 为空 |

结论：配置键 `languageCode`/`languageDirection`/`languageName` 在 0.168.0 同样是弃用项（`--panicOnWarning` 与 `--logLevel info` 的弃用审计都会暴露），主题与 fixture 都不应写；未配置时 `.Locale` 回退 `Lang`，所以 `<html lang="zh">` 这类场景不依赖弃用键也能成立，只要显式给 `[languages.<lang>.params] locale = "zh"`。

## 4. 两版同时通过的版本中立写法（仓库最终实现）

`--panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings` 下，`exampleSite` + 主题模板在两端均为 **exit 0、零 WARN、Pages 21/16**：

```powershell
& $hugo --source exampleSite --themesDir ../.. `
  --destination C:\Users\lzk\AppData\Local\Temp\wf-build\docs-check `
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings
```

- v0.146.0：exit 0，零 WARN，`Pages | 21 | 16`，`zh/index.html` 输出 `<html lang="zh" dir="ltr">`、`hreflang="en"`/`"zh"`、语言切换 `English`/`中文`。
- v0.168.0：同上，输出逐字一致。

配方（不按 `hugo.Version` 分支）：

```go-html-template
{{/* layouts/baseof.html */}}
{{- $lang := site.Language.Params.locale | default site.Language.Lang -}}
{{- $dir := site.Language.Params.dir | default `ltr` -}}
<html lang="{{ $lang }}" dir="{{ $dir }}">
```

```go-html-template
{{/* layouts/_partials/head.html：语言数用 site.Home.AllTranslations（site.Languages 在 0.168 弃用） */}}
{{- if gt (len site.Home.AllTranslations) 1 }}
  {{- range .AllTranslations }}
<link rel="alternate" hreflang="{{ .Language.Params.locale | default .Language.Lang }}" href="{{ .Permalink }}">
  {{- end }}
{{- end }}
```

语言切换同法迭代 `site.Home.AllTranslations`：默认链到各语言首页（无翻译页不再落到 `/`），当前页有对应翻译再覆盖为该页 permalink；显示名取 `$home.Language.Params.label | default (upper $home.Language.Lang)`。

站点侧（`exampleSite/hugo.toml`）：

```toml
[languages.en.params]
label = "English"
locale = "en"
[languages.zh.params]
label = "中文"
locale = "zh"
```

## 5. 被否决的替代方案：按 `hugo.Version` 分支

实测可行但否决：`hugo.Version` 两版都返回纯版本号（`0.146.0` / `0.168.0`），`{{ if ge hugo.Version "0.158.0" }}{{ .Language.Locale }}{{ else }}{{ .Language.LanguageCode }}{{ end }}` 在 v0.146.0 与 v0.168.0 均 exit 0、输出 `loc=en|dir=`。

否决理由：模板行为随 Hugo 版本漂移，两套分支都要长期维护；上面的 params + `AllTranslations` 配方版本中立、无分支，且语言集合不再依赖 `site.Languages`（0.168 已弃用）。规则层记录为「0.146.0 没有 Locale/Direction/Label（用即 exit 1）；0.168.0 已弃用 LanguageCode/LanguageDirection/LanguageName；跨两端用版本中立配方」，而不是「统一改用 Locale」或「统一改用 LanguageCode」。

## 6. 复跑记录

- `smoke.ps1` 新增 E13 段，断言版本中立配方（`[languages.en.params] locale/label` + `site.Language.Params.* | default .Lang`，且输出无 `deprecated`）：v0.168.0 整脚本 **49/49 通过**；v0.146.0 上 E13 的 3 条断言通过。
- v0.146.0 整脚本唯一失败项是既有 E8 断言（`_default/page.html is unused`）：0.146.0 用旧路径回退渲染但**不报 unused 告警**，0.168.0 才报。该差异属 E8 的版本边界，与语言字段无关；后续维护应把 E8 结论限定为 0.168 基线，或拆成版本条件断言。
- 复跑命令：`pwsh -File .agents/skills/hugo-theme-dev/evidence/smoke.ps1 -Hugo <v146|v168>\hugo.exe`。
- 断言失败即表示本文档某条结论过期：先按失败项复核两端字段，再同步 `content-output.md` 的 CNT-19/CNT-20 与 `sources.md` 的 E13 行。
