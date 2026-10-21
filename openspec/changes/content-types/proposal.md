# Proposal

## Why

主题当前的内容模型与规范建立在"信件式博客"上：文章 front matter 有发件人、收件人、主题字段，详情页有信件元信息组件，文案与导航都围绕"信"组织。用户从未要求信件模型；产品定位实际是**六类内容的个人站点主题**：blog（博客）、essays（随笔）、projects（作品，以 GitHub 开源项目为主）、fiction（小说）、photography（摄影）与 about（个人介绍，取代原先提议的"简历"）。同时用户明确不需要兼容旧版 Hugo。

## What Changes

- **BREAKING** 移除信件内容模型：删除 `params.from`/`params.to`/`params.subject` 契约、信件元信息组件与样式、`letter` 类文案与 i18n 键；文章改为普通博客文章（标题、日期、摘要、正文）。
- **BREAKING** 内容目录更名：`posts` → `blog`，`notes` → `essays`，新增 `projects`。三型目录名从此成为主题契约；旧目录不保留兼容。
- 新增 essays（随笔列表/详情）与 projects（作品卡片网格/详情）两类的模板、内容契约与 i18n 键；blog 列表与详情去掉信件字段，保留分页。
- 六类目录名固定为 `blog`、`essays`、`projects`、`fiction`、`photography`、`about`；其中 `fiction`、`photography`、`about` 本变更只记录，不设计、不实现。
- 默认导航改为固定顺序的六类型清单，当前只渲染已实现三项；站点声明 `menus.main` 时仍整体替换。
- blog 与 essays 列表加入分页（`.Paginate`，页大小由站点 `pagination.pagerSize` 控制，Hugo 默认 10），路径 `page/N`。
- **BREAKING** Hugo 版本策略：只支持当前最新稳定版（本次 0.168.0），删除最低版 0.146 声明与双版本 CI 矩阵，改为单版本构建 + 定期最新版校验。
- 设计契约同步：`DESIGN.md` 移除 letter meta、新增 project card，重生成 sidecar；`exampleSite`、`scripts/check-assets.mjs` 与浏览器探针同步更新。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `theme-shell`: 页面类型、内容模型、列表分页与默认导航随六类型定义修改；移除信件内容模型。
- `theme-distribution`: Hugo 版本策略、参数与 i18n 键、CI 门禁与 fixture 定义修改。
- `design-system`: 组件形态允许平铺卡片网格（project card），移除信件元信息组件。

## Impact

影响 `layouts/`、`assets/css/`、`i18n/`、`archetypes/`、`exampleSite/`、`DESIGN.md`、`.impeccable/design.json`、`scripts/check-assets.mjs`、`hugo.toml`、`.github/workflows/ci.yml`、`test/*.mjs`、`docs/decisions.md` 与 OpenSpec 主规范。不改变字体、场景渲染、OG、转场与无 JS 降级机制；不引入运行时依赖、构建工具或远程资源；fixture 仍只用虚构内容。
