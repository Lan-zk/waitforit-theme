# waitforit

Hugo 个人站点主题，提供博客、随笔、作品、小说、摄影和个人介绍六个入口。首页只显示诗篇 23:2，经菜单进入内容；背景为原创 WebGL2 草地与溪流。

首个版本 `v0.1.0` 已发布，以下安装示例锁定该 tag。测试范围为桌面 Chrome，以及 Chrome 中的窄屏模拟；不声明其他浏览器、手机真机或读屏软件已经通过验收。

## 要求

- Hugo **0.168.0**。标准版即可；只支持当前基线，不维护旧版兼容。
- Hugo Module 安装另需 Go；git submodule 安装不需要 Go。
- 站点构建无需 Node、npm、浏览器或远程素材请求。Node 22 和 Chrome 仅供仓库维护者运行测试。

## 安装

先建立站点，再从以下两种方式中选择一种。

```bash
hugo new site my-site
cd my-site
```

### Hugo Module

```bash
hugo mod init example.invalid/my-site
```

在站点 `hugo.toml` 中添加模块，不设置 `theme`：

```toml
[module]
  [[module.imports]]
    path = "github.com/Lan-zk/waitforit-theme"
```

锁定主题版本：

```bash
hugo mod get github.com/Lan-zk/waitforit-theme@v0.1.0
```

提交站点的 `go.mod` 和 `go.sum`。以后升级时显式选择新的提交或已发布版本。

### Git submodule

```bash
git init
git submodule add https://github.com/Lan-zk/waitforit-theme.git themes/waitforit-theme
git -C themes/waitforit-theme checkout v0.1.0
```

在站点 `hugo.toml` 中添加：

```toml
theme = "waitforit-theme"
```

提交 `.gitmodules` 和子模块指针。其他人克隆站点时使用 `git clone --recurse-submodules`。

### 最小站点配置

以下根级字段放在模块表之前；submodule 方式同时保留 `theme` 字段。

```toml
baseURL = "https://example.com/"
title = "My fictional site"
defaultContentLanguage = "zh"

[[menus.main]]
  name = "首页"
  url = "/"
```

建立 `content/_index.md`：

```yaml
---
title: "首页"
---
```

运行 `hugo server` 预览，运行 `hugo --panicOnWarning` 构建。单页站点无需使用主题的所有可选模板；`--printUnusedTemplates` 是本仓完整 fixture 的覆盖审计，不是最小消费者的安装要求。

## 内容与导航

内容属于你的站点仓库。本主题不会把示例文章自动加入站点。`exampleSite/` 全部为虚构测试内容，包含故意过长的标题、标签、代码、表格和校准图片。

未声明 `menus.main` 时，菜单按以下顺序固定显示六项。使用默认菜单前，应建立对应分区或页面；已有自定义 `menus.main` 会整体替换六项，不进行混合。

| 目录 | 用途 | 当前模板 |
| --- | --- | --- |
| `content/blog/` | 博客 | 分页列表与文章详情 |
| `content/essays/` | 随笔 | 分页列表与文章详情 |
| `content/projects/` | 作品、开源项目 | 卡片列表与详情 |
| `content/fiction/` | 小说 | 通用分页列表与详情，专属设计待后续 |
| `content/photography/` | 摄影 | 通用分页列表与详情，专属设计待后续 |
| `content/about.md` | 个人介绍 | 普通页面 |

为每个分区创建 `_index.md`。文章 front matter 使用 Hugo 原生字段：

```yaml
---
title: "沿溪记录"
description: "一段虚构的摘要"
date: 2026-10-21
draft: false
tags: ["大数据", "恩典"]
---

正文。
```

摘要、日期、标签均可省略。标签名称不写 `#`；主题在列表与详情显示 `#标签`，并提供标签总览及跨类型、分页的标签归档。标签是共享主题，不是嵌套目录。列表页大小由站点 `[pagination] pagerSize` 控制。

作品可以增加以下可选字段。提供 `repo` 时，列表卡片直接前往仓库；省略时前往站内详情。

```yaml
params:
  repo: "https://example.com/fictional-project"
  demo: "https://example.com/fictional-demo"
  year: "2026"
```

`hugo new content blog/name.md` 和 `hugo new content projects/name.md` 可使用主题 archetype；初始为草稿，发布前设置 `draft: false`。

摄影可以使用 page bundle 存放图片。主题提供通用 Markdown 图片展示，不提供相册、照片管理或小说章节导航。

## 参数

所有主题参数位于站点的 `[params.waitforit]` 下。

| 参数 | 默认值 | 行为 |
| --- | --- | --- |
| `defaultTheme` | `"auto"` | `auto`、`day`、`night`；读者保存的选择优先 |
| `hero` | `""` | 空时使用本地化经文和出处；自定义时不附加默认出处 |
| `brand` | `""` | 页脚标识数据；当前标识块隐藏 |
| `footer` | `""` | 页脚补充数据；当前随标识块隐藏 |
| `features.scene` | `true` | 是否输出 WebGL2 场景及其脚本 |
| `features.transitions` | `false` | 是否启用原生跨文档页面转场 |

```toml
[params.waitforit]
  defaultTheme = "auto"
  hero = ""
  [params.waitforit.features]
    scene = true
    transitions = false
```

站点标题取 `title`，描述取 `[params] description` 或单页 `description`。分享图由 Hugo 本地生成；单页可在 `params.waitforit` 中设置 `image`（bundle 或 assets 内 PNG/JPEG/WebP）与 `imageAlt`。详见 [签名能力契约](docs/signature-capabilities.md)。

## 语言

主题提供英文和中文界面；双语时用一个链接切换到当前页译文，缺少译文时进入目标语言首页。单语不显示切换，多语使用原生折叠菜单。

双语配置与文件命名可参考 [exampleSite/hugo.toml](exampleSite/hugo.toml)。语言代码与显示名可在 `[languages.<key>.params]` 设置 `locale` 和 `label`；相同 translation key 的 `name.md`、`name.zh.md` 对应两种语言。

## 降级与边界

- 无 JavaScript 时正文、普通导航和语言链接仍可用；场景和阅读边缘模糊不显示。
- WebGL2 不可用、初始化失败或上下文丢失时保留纸面背景与正文；恢复后可重建场景。
- 减少动效或 Save-Data 生效时场景为静帧；页面隐藏时暂停。场景有 24 逻辑帧/秒上限，并继续在内容页运行。
- 不支持原生页面转场的浏览器使用普通导航；不支持 backdrop-filter 时移除边缘装饰。
- 网页只自托管 Newsreader、Commit Mono 的拉丁子集；中文使用本地字体回退。构建分享图的中文字体单独随主题分发。
- 当前未验证 Safari、Firefox、手机真机与读屏软件；Chrome 可访问树检查不等于读屏实测。

## 开发与验证

```bash
hugo --source exampleSite --themesDir ../.. \
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings
node scripts/check-assets.mjs
WF_SOFTWARE_WEBGL=1 node test/ci.mjs --out /tmp/waitforit-browser-evidence
```

`HUGO_BIN` 可指定 Hugo 路径，`CHROME_PATH` 可指定 Chrome。前两条是 CI 每次推送执行的门禁；`test/ci.mjs` 是发版前的浏览器验收，CI 不执行（D40），由维护者本地运行。失败返回非零并保留结果；软件 WebGL 用于功能检查，性能采样应另外使用 `WF_NATIVE_GPU=1 node test/scene-performance.mjs --url <preview-url>` 并核对实际 renderer。

## 许可

主题代码为 [MIT](LICENSE)，字体为各自的 OFL。灵感、品牌轮廓与第三方来源见 [CREDITS.md](CREDITS.md)。主题首轮不投递 themes.gohugo.io。
