# Hugo 主题开发知识库的实测脚本（Hugo v0.168.0；E13 段也可在 v0.146.0 单独复跑）
# 目的：把 evidence/2026-10-20-hugo-v0.168.0-smoke.md 的 E1–E12 与
#       evidence/2026-10-20-language-fields.md 的 E13 变成可重跑断言。
# 注：E8 的 unused 告警断言只在基线 0.168.0 成立；0.146.0 上旧路径可用但不报 unused，
#     整脚本跑 0.146 会仅因此失败（E13 段本身通过），见 evidence 里的两版对照。
# 用法：
#   pwsh -File .agents/skills/hugo-theme-dev/evidence/smoke.ps1
#   pwsh -File .agents/skills/hugo-theme-dev/evidence/smoke.ps1 -Hugo C:\path\to\hugo.exe -Root D:\tmp\smoke
# 退出码：0 = 全部通过；1 = 有断言失败或环境缺失。

param(
  [string]$Hugo = '',
  [string]$Root = ''
)

$ErrorActionPreference = 'Stop'

# ---- 环境 ----
if (-not $Hugo) {
  $candidate = Join-Path $env:TEMP 'hugo168\hugo.exe'
  if (Test-Path $candidate) { $Hugo = $candidate }
  else {
    $cmd = Get-Command hugo -ErrorAction SilentlyContinue
    if ($cmd) { $Hugo = $cmd.Source }
  }
}
if (-not $Hugo -or -not (Test-Path $Hugo)) {
  Write-Host '找不到 hugo 可执行文件。用 -Hugo 指定，或把 hugo 放入 PATH。' -ForegroundColor Red
  exit 1
}
if (-not $Root) { $Root = Join-Path $env:TEMP 'hugo-smoke' }

$script:hugo = $Hugo
$script:root = $Root
$script:site = Join-Path $Root 'site'
$script:theme = Join-Path $Root 'themes\wt-smoke'
$script:results = @()

Write-Host ("hugo: " + (& $Hugo version | Select-Object -First 1))

# ---- 工具函数 ----
function Set-Text([string]$Path, [string]$Text) {
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function Get-Text([string]$Path) {
  if (-not (Test-Path $Path)) { return '' }
  return [System.IO.File]::ReadAllText($Path)
}

function Record([string]$Name, [bool]$Ok, [string]$Detail = '') {
  $script:results += [pscustomobject]@{ Name = $Name; Ok = $Ok; Detail = $Detail }
  if ($Ok) { Write-Host ("  PASS  " + $Name) }
  else { Write-Host ("  FAIL  " + $Name + "  " + $Detail) -ForegroundColor Red }
}

function Assert-Contains([string]$Text, [string]$Needle, [string]$Name) {
  Record $Name ($Text.Contains($Needle)) ("缺少: " + $Needle)
}

function Assert-Exists([string]$Path, [string]$Name) {
  Record $Name (Test-Path $Path) ("文件不存在: " + $Path)
}

function Assert-Missing([string]$Path, [string]$Name) {
  Record $Name (-not (Test-Path $Path)) ("文件仍存在: " + $Path)
}

function Assert-Exit([object]$Result, [int]$Expected, [string]$Name) {
  Record $Name ($Result.Exit -eq $Expected) ("exit=" + $Result.Exit + "，期望 " + $Expected + "；输出尾部: " + $Result.Output.Substring([Math]::Max(0, $Result.Output.Length - 400)))
}

# 每次构建前删 public，避免上一次的产物污染"文件应不存在"类断言。
function Invoke-Build([string[]]$Extra = @()) {
  $public = Join-Path $script:site 'public'
  if (Test-Path $public) { Remove-Item -Recurse -Force $public }
  $hugoArgs = @('--source', $script:site, '--themesDir', (Join-Path $script:root 'themes'),
    '--printUnusedTemplates', '--printPathWarnings') + $Extra
  $output = (& $script:hugo @hugoArgs 2>&1 | Out-String)
  return [pscustomobject]@{ Exit = $LASTEXITCODE; Output = $output }
}

function Remove-Tpl([string]$RelPath) {
  $p = Join-Path $script:theme ('layouts\' + $RelPath)
  if (Test-Path $p) { Remove-Item -Force $p }
}

function Write-Tpl([string]$RelPath, [string]$Text) {
  Set-Text (Join-Path $script:theme ('layouts\' + $RelPath)) $Text
}

# ---- 基线夹具 ----
function New-Fixture {
  if (Test-Path $script:root) { Remove-Item -Recurse -Force $script:root }

  Set-Text (Join-Path $script:site 'hugo.toml') @'
baseURL = 'https://example.org/'
title = 'Smoke Site'
theme = 'wt-smoke'

[params]
shared = 'site-shared'
siteOnly = 'site-value'

[params.nested]
a = 'site-a'
'@

  Set-Text (Join-Path $script:site 'content\_index.md') "---`ntitle: Home`n---`n`nhome body`n"
  Set-Text (Join-Path $script:site 'content\about.md') "---`ntitle: About`n---`n`nabout body`n"
  Set-Text (Join-Path $script:site 'content\posts\_index.md') "---`ntitle: Posts`n---`n`nposts body`n"
  Set-Text (Join-Path $script:site 'content\posts\a.md') "---`ntitle: Post A`n---`n`n{{< note >}}inside{{< /note >}}`n"

  Set-Text (Join-Path $script:theme 'hugo.toml') @'
[params]
themeDefault = 'theme-value'
shared = 'theme-shared'

[params.nested]
a = 'theme-a'
b = 'theme-b'

[[menus.main]]
name = 'Theme Menu'
pageRef = '/'

[module.hugoVersion]
min = '0.100.0'
'@

  Set-Text (Join-Path $script:theme 'theme.toml') @'
name = 'WT Smoke'
license = 'MIT'
licenselink = 'https://example.org/license'
description = 'smoke fixture theme'
homepage = 'https://example.org/'
demosite = 'https://example.org/'
tags = ['smoke']
features = ['baseline']
min_version = '0.146.0'
bogus_field = 'ignored'
'@

  Write-Tpl 'baseof.html' @'
<!doctype html>
<html lang="en">
<head>{{ partial "head.html" . }}</head>
<body>
<main>{{ block "main" . }}{{ end }}</main>
</body>
</html>
'@
  Write-Tpl '_partials\head.html' '<title>{{ .Site.Title }} | {{ .Title }}</title>'
  Write-Tpl 'home.html' @'
{{ define "main" }}
<h1>HOME-BODY</h1>
<div id="params">shared={{ site.Params.shared }}|themeDefault={{ site.Params.themeDefault }}|a={{ site.Params.nested.a }}|b={{ site.Params.nested.b }}|siteOnly={{ site.Params.siteOnly }}</div>
<div id="i18n">hello={{ i18n "hello" }}</div>
<div id="menus">{{ range site.Menus.main }}{{ .Name }};{{ end }}</div>
<div id="counts">reg={{ len site.RegularPages }}|pages={{ len site.Pages }}</div>
{{ end }}
'@
  Write-Tpl 'page.html' '{{ define "main" }}<p>PAGE-BODY</p>{{ end }}'
  Write-Tpl 'section.html' '{{ define "main" }}<p>SECTION-BODY</p>{{ end }}'
  Write-Tpl '404.html' '{{ define "main" }}<p>NOTFOUND-BODY</p>{{ end }}'
  Write-Tpl 'posts\page.html' '{{ define "main" }}<p>POST-PAGE-BODY</p>{{ .Content }}{{ end }}'
  Write-Tpl '_shortcodes\note.html' '<aside class="note">{{ .Inner }}</aside>'
  Set-Text (Join-Path $script:theme 'i18n\en.toml') "hello = 'Hello from theme i18n'`n"
}

$homeHtml = Join-Path $script:site 'public\index.html'
$about = Join-Path $script:site 'public\about\index.html'
$postA = Join-Path $script:site 'public\posts\a\index.html'
$postsIndex = Join-Path $script:site 'public\posts\index.html'

# ---- E1 基线：模板选择 + params 合并 + 主题 menus/i18n ----
Write-Host "`n[E1] 基线"
New-Fixture
$r = Invoke-Build
Assert-Exit $r 0 'E1 构建成功'
Assert-Contains (Get-Text $about) 'PAGE-BODY' 'E1 about 用 page.html'
Assert-Contains (Get-Text $about) '<main>' 'E1 baseof 包裹生效'
Assert-Contains (Get-Text $postA) 'POST-PAGE-BODY' 'E1 posts/a 用 posts/page.html'
Assert-Contains (Get-Text (Join-Path $script:site 'public\404.html')) 'NOTFOUND-BODY' 'E1 404.html'
Assert-Contains (Get-Text (Join-Path $script:site 'public\posts\index.html')) 'SECTION-BODY' 'E1 posts 用 section.html'
$h = Get-Text $homeHtml
Assert-Contains $h 'shared=site-shared' 'E1 params 站点覆盖'
Assert-Contains $h 'themeDefault=theme-value' 'E1 主题默认保留'
Assert-Contains $h 'a=site-a' 'E1 nested.a 站点胜'
Assert-Contains $h 'b=theme-b' 'E1 nested.b 主题保留'
Assert-Contains $h 'hello=Hello from theme i18n' 'E1 主题 i18n 生效'
Assert-Contains $h 'Theme Menu;' 'E1 主题 menus 生效'
Assert-Contains $h 'reg=2' 'E1 RegularPages=2'
Assert-Contains $h 'pages=6' 'E1 Pages=6'
Assert-Contains (Get-Text (Join-Path $script:site 'public\posts\a\index.html')) '<aside class="note">inside' 'E1 shortcode 展开'

# ---- E2 只保留 all.html ----
Write-Host "`n[E2] 只保留 all.html"
New-Fixture
Remove-Tpl 'page.html'
Remove-Tpl 'posts\page.html'
Write-Tpl 'all.html' '{{ define "main" }}<p>ALL-BODY</p>{{ end }}'
$r = Invoke-Build
Assert-Exit $r 0 'E2 构建成功'
Assert-Contains (Get-Text $about) 'ALL-BODY' 'E2 about 回退 all.html'
Assert-Contains (Get-Text $postA) 'ALL-BODY' 'E2 posts/a 回退 all.html'

# ---- E3 list 优先于 all ----
Write-Host "`n[E3] list.html 与 all.html 共存"
New-Fixture
Remove-Tpl 'section.html'
Write-Tpl 'list.html' '{{ define "main" }}<p>LIST-BODY</p>{{ end }}'
Write-Tpl 'all.html' '{{ define "main" }}<p>ALL-BODY</p>{{ end }}'
$r = Invoke-Build
Assert-Exit $r 0 'E3 构建成功'
Assert-Contains (Get-Text $postsIndex) 'LIST-BODY' 'E3 list 优先'
Assert-Contains $r.Output 'all.html is unused' 'E3 all.html 被报 unused'

# ---- E4 缺模板：静默 WARN，exit 0 ----
Write-Host "`n[E4] 缺 page 模板（无 panic）"
New-Fixture
Remove-Tpl 'page.html'
Remove-Tpl 'posts\page.html'
$r = Invoke-Build
Assert-Exit $r 0 'E4 构建仍 exit 0'
Assert-Contains $r.Output 'found no layout file for "html" for kind "page"' 'E4 出现 no layout WARN'
Assert-Missing $about 'E4 about 页面静默消失'

# ---- E5 缺模板 + --panicOnWarning ----
Write-Host "`n[E5] 缺 page 模板 + --panicOnWarning"
New-Fixture
Remove-Tpl 'page.html'
Remove-Tpl 'posts\page.html'
$r = Invoke-Build @('--panicOnWarning')
Assert-Exit $r 2 'E5 panic exit 2'
Assert-Contains $r.Output 'panic: found no layout file for "html" for kind "page"' 'E5 panic 文案'

# ---- E6 module.hugoVersion 只警告 ----
Write-Host "`n[E6] 版本不匹配只 WARN"
New-Fixture
$cfg = Get-Text (Join-Path $script:theme 'hugo.toml')
Set-Text (Join-Path $script:theme 'hugo.toml') ($cfg -replace "min = '0.100.0'", "min = '0.999.0'")
$r = Invoke-Build
Assert-Exit $r 0 'E6 构建成功'
Assert-Contains $r.Output 'is not compatible with this Hugo version' 'E6 版本 WARN'

# ---- E7 taxonomy / term ----
Write-Host "`n[E7] taxonomy 与 term 模板"
New-Fixture
Set-Text (Join-Path $script:site 'content\about.md') "---`ntitle: About`ntags: [`"red`"]`n---`n`nabout body`n"
$r = Invoke-Build
Assert-Contains $r.Output 'kind "taxonomy"' 'E7 缺 taxonomy 模板 WARN'
Assert-Contains $r.Output 'kind "term"' 'E7 缺 term 模板 WARN'
Write-Tpl 'taxonomy.html' '{{ define "main" }}<p>TAXONOMY-BODY</p>{{ end }}'
Write-Tpl 'term.html' '{{ define "main" }}<p>TERM-BODY</p>{{ end }}'
$r = Invoke-Build
Assert-Exit $r 0 'E7 补模板后构建成功'
Assert-Exists (Join-Path $script:site 'public\tags\red\index.html') 'E7 term 页产出'

# ---- E8 旧路径 _default/ ----
Write-Host "`n[E8] 旧路径 _default/"
New-Fixture
Remove-Tpl 'page.html'
Remove-Tpl 'posts\page.html'
Write-Tpl '_default\page.html' '{{ define "main" }}<p>LEGACY-BODY</p>{{ end }}'
$r = Invoke-Build
Assert-Exit $r 0 'E8 构建成功'
Assert-Contains (Get-Text $about) 'LEGACY-BODY' 'E8 旧路径确实被用作回退'
Assert-Contains $r.Output '_default/page.html is unused' 'E8 旧路径被报 unused'

# ---- E8b 根目录 single.html ----
Write-Host "`n[E8b] 根目录 single.html"
New-Fixture
Remove-Tpl 'page.html'
Remove-Tpl 'posts\page.html'
Write-Tpl 'single.html' '{{ define "main" }}<p>SINGLE-BODY</p>{{ end }}'
$r = Invoke-Build
Assert-Exit $r 0 'E8b 构建成功'
Assert-Contains (Get-Text $about) 'SINGLE-BODY' 'E8b single.html 兜底'

# ---- E9 旧目录 partials/ ----
Write-Host "`n[E9] 旧目录 partials/"
New-Fixture
$headSrc = Join-Path $script:theme 'layouts\_partials\head.html'
$headDst = Join-Path $script:theme 'layouts\partials\head.html'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $headDst) | Out-Null
Move-Item -Force $headSrc $headDst
$r = Invoke-Build
Assert-Exit $r 0 'E9 构建成功'
Assert-Contains (Get-Text $homeHtml) 'Smoke Site' 'E9 旧 partials 目录仍被查找'

# ---- E10 partial return 与变量作用域 ----
Write-Host "`n[E10] partial return"
New-Fixture
Write-Tpl '_partials\ret.html' '{{ return "ret-value" }}'
Write-Tpl 'home.html' @'
{{ define "main" }}
HOME-BODY
{{ $v := partial "ret.html" . }}ret=[{{ $v }}]
{{ end }}
'@
$r = Invoke-Build
Assert-Exit $r 0 'E10 构建成功'
Assert-Contains (Get-Text $homeHtml) 'ret=[ret-value]' 'E10 partial return 生效'

Write-Host "`n[E10b] define 外的变量赋值"
New-Fixture
Write-Tpl '_partials\ret.html' '{{ return "ret-value" }}'
Write-Tpl 'home.html' @'
{{ $v := partial "ret.html" . }}
{{ define "main" }}
HOME-BODY ret=[{{ $v }}]
{{ end }}
'@
$r = Invoke-Build
Assert-Exit $r 1 'E10b 构建失败 exit 1'
Assert-Contains $r.Output 'undefined variable' 'E10b 报 undefined variable'

# ---- E12 layouts 下的残留文件 ----
Write-Host "`n[E12] layouts 下的 .bak"
New-Fixture
Write-Tpl 'page.html.bak' '{{ define "main" }}BAK{{ end }}'
$r = Invoke-Build
Assert-Exit $r 0 'E12 构建成功'
Assert-Contains $r.Output 'page.html.bak is unused' 'E12 残留文件被报 unused'
$r = Invoke-Build @('--panicOnWarning')
Assert-Exit $r 2 'E12 --panicOnWarning 失败'

# ---- E13 语言字段的版本中立写法 ----
Write-Host "`n[E13] 语言字段版本中立写法（params.locale/label）"
New-Fixture
$siteCfg = Get-Text (Join-Path $script:site 'hugo.toml')
Set-Text (Join-Path $script:site 'hugo.toml') ($siteCfg + "`n[languages.en.params]`nlocale = 'en'`nlabel = 'English'`n")
Write-Tpl 'home.html' @'
{{ define "main" }}
<p id="lang">lang={{ site.Language.Params.locale | default site.Language.Lang }}|label={{ site.Language.Params.label | default site.Language.Lang }}</p>
{{ end }}
'@
$r = Invoke-Build
Assert-Exit $r 0 'E13 版本中立语言字段写法构建成功'
Assert-Contains (Get-Text $homeHtml) 'lang=en|label=English' 'E13 params.locale/label 生效'
Record 'E13 无弃用告警' (-not $r.Output.Contains('deprecated')) '输出含 deprecated'

# ---- 汇总 ----
$failed = @($script:results | Where-Object { -not $_.Ok })
Write-Host ""
Write-Host ("断言 " + $script:results.Count + " 条，失败 " + $failed.Count + " 条。")
if ($failed.Count -gt 0) {
  $failed | ForEach-Object { Write-Host ("  FAIL " + $_.Name + " :: " + $_.Detail) -ForegroundColor Red }
  exit 1
}
Write-Host '全部通过。' -ForegroundColor Green
exit 0
