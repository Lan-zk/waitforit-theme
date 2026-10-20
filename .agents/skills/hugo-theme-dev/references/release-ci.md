# 版本、破坏性变更、CLI、CI 与发布规则

**用途**：定 `module.hugoVersion`、写 CI、打 tag 发版、决定要不要 extended 版时读本文件。基线 Hugo **v0.168.0**（2026-10-13 发布，文档抓取 2026-10-20），主题最低支持 0.146.0。标记含义见 `sources.md` §1。

## 1. 版本事实

| 项 | 事实 | 来源 |
| --- | --- | --- |
| 最新稳定版 | **v0.168.0**（2026-10-13） | SRC-90 |
| 2026 年序列 | v0.155.1(2026-01-30) → v0.168.0；patch：0.155.2/.3、0.159.1/.2、0.160.1、0.161.1、0.162.1、0.163.1/.2/.3 | SRC-90 |
| 发布节奏 | minor 约 3–6 周一个 | SRC-90 |
| Edition | `standard`、`deploy`（v0.159.2 起）、`extended`、`extended+deploy` | SRC-91 |
| LibSass | **仅 extended**；v0.153.0 弃用、未来移除 | SRC-91 |
| WebP | v0.153.0 起**所有 edition** 可用（WASM libwebp） | SRC-92 |
| `hugoVersion.extended` | v0.153.0 废弃；0.153.2 起不再检查 | SRC-32 |

- **REL-01** 主题**不需要 extended 版**：extended 如今只剩 libsass 一条实质理由，而 libsass 已废弃且将移除；改用不依赖 libsass 的路径（`assets-pipeline.md` AST-05/AST-16）即可全 edition 兼容。⟦D⟧ SRC-91, SRC-66
- **REL-02** 不要写 `module.hugoVersion.extended`，也不要把它当版本护栏。⟦D⟧ SRC-32
- **REL-03** 版本护栏语义 = `module.hugoVersion.min`，且**只 WARN 不失败**（`configuration-modules.md` CFG-16 / E6），必须靠 `--panicOnWarning` 才成为硬失败。⟦E⟧ E6

## 2. 0.146 之后的破坏性变更（主题相关）

| 版本 | 变更 | 旧写法 → 新写法 | 来源 |
| --- | --- | --- | --- |
| 0.146.0 | 模板系统重写（文档承认 "some reported breakages have occurred"） | `layouts/_default/single.html` → `layouts/single.html`/`page.html` | SRC-01, SRC-93 |
| 0.146.0 | partials/shortcodes 目录改名 | `layouts/partials/` → `layouts/_partials/` | SRC-01 |
| 0.146.0 | baseof 前缀反转 | `list-baseof.html` → `baseof.list.html` | SRC-01 |
| 0.146.0 | taxonomy 与 term 拆分 | 只用 `taxonomy.html` → 加 `term.html` | SRC-01 |
| 0.146.0 | `_internal` 模板删除 | `template "_internal/opengraph.html"` → `partial "opengraph.html"` | SRC-01 |
| 0.146.0 | home 不再认 `index.html` | `index.html` → `home.html` | SRC-01 |
| 0.146.0 | 新增 `all.html` 兜底 | — | SRC-01 |
| 0.153.0 | `lang` 维度废弃 | mount/segments 的 `lang` → `sites.matrix` | SRC-93 |
| 0.153.0 | mount 过滤字段废弃 | `includeFiles`/`excludeFiles` → `files`（支持 `!`） | SRC-93 |
| 0.153.0 | libsass 废弃 | `resources.ToCSS` → `css.Sass` | SRC-93, SRC-66 |
| 0.153.0 | `hugoVersion.extended` 废弃 | `extended = true` → 删除 | SRC-93 |
| 0.158.0 | `.Site.Language` 字段改名 | `languageCode`/`languageDirection`/`languageName` → `LanguageCode`/`Direction`/`Label` | SRC-38 |
| 0.161.0 | 安全配置支持 `!` 否定语法、`security.node.permissions` 新增 | — | SRC-39 |
| 0.164.0 | `resources.PostProcess` 弃用 | → `templates.Defer` | SRC-76 |
| 0.166.0 | `.Render` 增加可选 context；`return` 可用于任意模板；`http.proxyFromEnvironment` 新增 | `.Render "view"` → `.Render "view" $ctx` | SRC-17, SRC-93 |
| 0.167.0 | `cleanDestinationDir` 挪到 `build.*`；相对 partial 路径 | 根级 `cleanDestinationDir` → `build.cleanDestinationDir.enable`；`{{ partial "./x.html" . }}` | SRC-93, SRC-15 |
| 0.168.0 | **主题里的 `module.replacements` 被忽略** | 只能由项目侧 replace | SRC-93 |

- **REL-04** 本项目基线是 0.146.0，上表**所有**新写法都可用；不要写任何旧路径（`templates.md` TPL-01/TPL-02）。⟦D⟧ SRC-01；`docs/decisions.md` D4
- **REL-05** 弃用政策：INFO（3 个 minor）→ WARN（12 个 minor）→ ERROR（构建失败）；**新弃用项初期只是 INFO**，`--panicOnWarning` 抓不到，必须额外跑 `--logLevel info` 并 grep "deprecat"。⟦D⟧ SRC-101

## 3. CLI flags（主题开发实际会用的）

| Flag / 命令 | 效果 | 用途 |
| --- | --- | --- |
| `hugo --source exampleSite --themesDir ../..` | 用 exampleSite 作为站点、主题来自上级目录 | 本仓库标准构建（AGENTS.md） |
| `--panicOnWarning` | 第一条 WARNING 即 panic（exit 2） | CI 核心开关（E5、E6） |
| `--printPathWarnings` | 重复目标路径等警告 | CI 核心开关 |
| `--printUnusedTemplates` | 报告未使用模板（旧路径/备份文件会被点名） | CI 核心开关（E3、E8、E12） |
| `--printI18nWarnings` | 缺失翻译 | CI 核心开关 |
| `--minify` | 压缩所有支持的输出格式 | 发布构建 |
| `--gc` | 构建后清理未使用缓存文件 | 发布构建 |
| `--cleanDestinationDir` | 构建前清理目标目录（0.167.0 起映射到 `build.cleanDestinationDir.enable`） | 防止残留旧文件 |
| `--logLevel info` | 输出 INFO（含弃用项） | 弃用审计 |
| `--renderToMemory` | 只渲染到内存 | 快速测试 |
| `--templateMetrics` / `--templateMetricsHints` | 模板耗时统计 | 性能排查 |
| `--ignoreVendorPaths` | 忽略 `_vendor` 部分模块 | 本地覆盖调试 |
| `--disableFastRender` | server 关闭快速渲染 | 模板改动不生效时 |
| `hugo config` / `hugo config mounts` | 打印合并后配置 / 挂载表 | 验证主题默认值是否生效 |
| `hugo env` / `hugo version` | 环境与版本 | CI 断言 |
| `hugo mod tidy` / `mod vendor` | 整理依赖 / 生成 `_vendor` | 离线构建 |
| `hugo new theme NAME` | 生成主题骨架 | 初始化（本仓库已手工建） |
| `hugo gen chromastyles` | 生成 Chroma CSS | 若需代码高亮配色 |

- **REL-06** `hugo` 与 `hugo build` 两个入口的差异未核实（U4），CI 统一写 `hugo`（等价于 `hugo build` 的默认行为，见 SRC-95）。⟦U⟧ U4

## 4. CI 验收命令（本仓库 P2 落地）

```powershell
# 固定版本安装（standard 版足够）
CGO_ENABLED=0 go install github.com/gohugoio/hugo@v0.168.0
CGO_ENABLED=0 go install github.com/gohugoio/hugo@0.146.0   # 最低支持版

# 主验收：WARN 即失败
hugo --source exampleSite --themesDir ../.. `
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings `
  --minify --gc --cleanDestinationDir

# 弃用审计（--panicOnWarning 抓不到 INFO）
hugo --source exampleSite --themesDir ../.. --logLevel info 2>&1 | Select-String -Pattern "deprecat" -CaseSensitive:$false

# 站内审计：裸 HTML 被吞 / 模板注入 / 缺翻译 / <nil>
$env:HUGO_MINIFY_TDEWOLFF_HTML_KEEPCOMMENTS="true"
$env:HUGO_ENABLEMISSINGTRANSLATIONPLACEHOLDERS="true"
hugo --source exampleSite --themesDir ../..
Select-String -Path public\*.html,public\**\*.html -Pattern "raw HTML omitted|ZgotmplZ|i18n|&lt;nil&gt;|\(<nil>\)"
```

- **REL-07** CI 矩阵 = 最低支持版（0.146.0）+ 最新稳定版（0.168.0）各跑一遍完整命令；WARN 一律视为失败（AGENTS.md 已有此约定，这里是可执行版本）。⟦D⟧ `docs/decisions.md` D4；⟦I⟧ 落地命令
- **REL-08** `--panicOnWarning` 只升级 WARNING；INFO 级弃用必须另跑 `--logLevel info` + 关键字检查。⟦D⟧ SRC-101
- **REL-09** 离线可构建是硬要求：不引入 `resources.GetRemote`，需要模块依赖时先 `hugo mod vendor` 并提交 `_vendor/`。⟦D⟧ SRC-77, SRC-100；⟦I⟧ 本仓库原则

## 5. 发布到 themes.gohugo.io（如果决定投递）

官方规则在 SRC-200（gohugo.io/contribute/themes/ 只做跳转）。硬条件：

- 根目录 `theme.toml`（**只支持 TOML**，`theme.yaml`/`theme.json` 不认），字段见 `configuration-modules.md` §6。⟦D⟧ SRC-200
- 根目录 `hugo.toml` 里 `[module.hugoVersion]` 声明支持版本（`extended`/`min`/`max` 可省略）。⟦D⟧ SRC-200
- `README.md` 渲染到详情页，建议英文；图片必须用**绝对 URL**。⟦D⟧ SRC-200
- `images/screenshot.{png,jpg}` ≥1500×1000、`images/tn.{png,jpg}` ≥900×600，均 **3:2**，且不得带浏览器/设备样机。⟦D⟧ SRC-200
- 提交流程：fork `hugoThemesSiteBuilder` → 按字典序把 `github.com/Lan-zk/waitforit-theme` 加入 `themes.txt` → commit `Add theme waitforit` → PR 并通过 Netlify deploy preview。⟦D⟧ SRC-200
- 验收硬条件：必须"notably different"、必须有开源许可证、衍生作品满足原许可、拒付费与营销型 README；18 个月未更新下架。⟦D⟧ SRC-200
- **REL-10** 发版陷阱：gallery 取**最新 release 的元数据**，发版后补截图会报 `error: no image found for "images/tn"`，需重新打 tag；官方要求**不要删 tag/ref**（Go modules 拉取会失败）；站点每天 UTC 00:00 重建。⟦D⟧ SRC-200
- **REL-11** module 分发与上架无关但可并存：用户可用 `theme = "..."`（submodule）或 Hugo Module 引入；module 分发拿到的是打 tag 的快照。⟦D⟧ SRC-46, SRC-200

## 6. 安全默认值（发布前自检）

| 键 | 默认 | 主题要遵守 |
| --- | --- | --- |
| `security.exec.allow` | `^(dart-)?sass$`、`^go$`、`^git$`、`^node$`、`^postcss$` | 不依赖额外二进制 |
| `security.funcs.getenv` | `^HUGO_`、`^CI$` | 不用 `os.Getenv` 读自定义变量 |
| `security.http.urls` | 默认禁 IP/localhost，校验解析地址 | 不在构建期联网 |
| `security.enableInlineShortcodes` | `false` | 不依赖内联 shortcode |
| `security.node.permissions` | `allowRead=["."]`、`allowWrite=[]` | 不用 Node 写盘管线 |

- **REL-12** 主题若需要站点放宽任何 `security` 项才能构建，属于发布级缺陷（安装成本不可接受）。⟦D⟧ SRC-39；⟦I⟧ 结论

## 7. 陷阱清单

1. **Windows**：0.168.0 修了 `CVE-2026-56857`（`os.Root.Mkdir` 的 junction 逃逸）；Windows CI 上不要默认 extended。⟦D⟧ SRC-93
2. **模块缓存**：缓存在 `cacheDir/modules`；CI 缓存该目录；全离线走 `hugo mod vendor`；`themes/` 下的模块**不会**被 vendor。⟦D⟧ SRC-100, SRC-32
3. **`--gc` 不清 `public/`**：只清缓存文件，替代不了 `--cleanDestinationDir`。⟦D⟧ SRC-95
4. **mount 与 vendor**：模块里定义 mount 会移除该模块全部默认 mount；项目根同名文件覆盖 vendored 文件。⟦D⟧ SRC-32
5. **`hugo server` fast render**：模板改动不生效时用 `--disableFastRender`（失效机制属 U11）。⟦D⟧ SRC-96
6. **主题内 `module.replacements` 在 0.168.0 静默失效**。⟦D⟧ SRC-93
7. **`--panicOnWarning` 抓不到 INFO 弃用**。⟦D⟧ SRC-101

## 8. 本仓库发版决策（沿用 D12/D15）

- 版本号语义化：`v0.x.y`；`module.hugoVersion.min` 只随实际用到的特性提升（`templates.md` §9 表）。
- 发布前必过：`--panicOnWarning` 双版本矩阵 + 弃用审计 + `exampleSite` 视觉基线（1440/390 两档截图）。
- 是否投递 themes.gohugo.io 仍是待定项（`docs/decisions.md` 待定表），投递则需额外维护截图规格与 `theme.toml` 字段。

## 9. 来源

`SRC-01`、`SRC-15`、`SRC-17`、`SRC-32`、`SRC-38`–`SRC-39`、`SRC-46`、`SRC-66`、`SRC-76`、`SRC-90`–`SRC-101`、`SRC-200`；实测 `E5`、`E6`、`E8`、`E12`。URL 与未核实项见 `sources.md`。
