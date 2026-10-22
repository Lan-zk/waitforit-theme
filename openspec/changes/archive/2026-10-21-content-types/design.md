# Design

## Context

见 `proposal.md`。当前主题以单一文章类型与信件版式交付；本变更新增两类内容（essays、projects）、把文章恢复为普通博客文章、固定六类目录名，并放弃旧 Hugo 版本兼容。设计契约以仓库根 `DESIGN.md` 为唯一权威（D16-R），Hugo 实现依据 `.agents/skills/hugo-theme-dev/` 的规则编号。

## Goals / Non-Goals

目标：六类目录名与顺序固化；blog / essays / projects 三型可用、可构建、可验收；信件模型彻底移除；版本策略与 CI 同步；设计与门禁契约同步。

非目标：fiction / photography / about 的模板与设计；真实内容与发布；README、CHANGELOG 与主题站投递；评论、搜索、多作者。

## Decisions

1. **模板落点与回退**：三型各自使用 `layouts/blog/{section,page}.html`、`layouts/essays/{section,page}.html`、`layouts/projects/{section,page}.html`；未匹配的 section 回退 `layouts/section.html`，普通页回退 `layouts/page.html`，404 保持 `layouts/404.html`；不写 `_default` 路径，`layouts/` 下不放非模板文件（TPL-01/09/14/16）。blog 与 essays 共用 `post-row` partial；projects 使用独立 `project-card` partial。
2. **内容模型**：blog 与 essays 只使用 Hugo 保留字段（`title`、`description`、`date`、`draft`、`tags`），不新增自定义必填字段；`description`、`date` 缺失时降级隐藏对应信息（CNT-08）。projects 使用 `title`、`description`、`date` 与 `params.repo`（外部仓库 URL）、`params.demo`（可选演示地址）、`params.year`（可选年份）；卡片优先链接 `params.repo`，没有时链接站内详情页。
3. **列表与分页**：blog 与 essays 按日期倒序使用 `.Pages.ByDate.Reverse`，用 `.Paginate` 生成分页，页大小由站点 `pagination.pagerSize` 控制（Hugo 默认 10），路径 `page/N`；分页 UI 放 `layouts/_partials/pagination.html`。分页只调用一次，禁止 `.Paginator` 与 `.Paginate` 混用造成静默返回同一结果（TPL-20/21）。projects 按日期倒序，不分页。
4. **默认导航**：主题内置固定顺序 `blog → essays → projects → fiction → photography → about`，六项全部渲染；尚未实现的 fiction、photography、about 链接到站点提供的占位页（`exampleSite` 提供三个占位页 fixture，用通用模板与本地化"建设中"文案），不隐藏入口、不产生死链；标签取 i18n 键 `waitforit.nav.<type>`；站点声明 `menus.main` 时整体替换内置清单（CFG-11）。
5. **版本策略**：主题根 `hugo.toml` 只声明 `[module.hugoVersion] min = "0.168.0"`（CFG-15）；CI 只跑当前稳定版，另设每周对最新版的构建与弃用审计；`--panicOnWarning` 与 INFO 级弃用审计保留（REL-05/07/08）；不声明 extended（REL-01/02）。0.146 专用的版本中立写法可以保留，但不再作为验收条件。
6. **设计契约**：`DESIGN.md` 删除 "The letter meta block" 一节与 frontmatter 的 `letter-meta` 组件键，新增 project card 组件（无填充背景、无阴影、细线分隔的平铺卡片，不违反"禁止卡片容器"的既有语义）；重生成 `.impeccable/design.json`；`scripts/check-assets.mjs` 的组件键与片段期望数量按新契约更新并保持退出码 0。
7. **fixture**：`exampleSite` 保留虚构人物与内容；包含 blog 3 篇、essays 2 篇（长短各一）、projects 3 个（仓库链接使用虚构域名）、1 个普通页验证 `page.html` 回退、404 与中英双语；覆盖长标题与空列表；删除全部信件字段与信件文案。
8. **探针与验收**：更新 `test/signature.mjs`、`test/probe.mjs`、`test/fidelity.mjs` 的路由与断言（移除 letter-meta，增加分页与 project card）；保留 1440/390、昼夜、无 JS、reduce、场景降级与关闭构建的既有断言。

## Risks / Trade-offs

- 删除信件模型是破坏性变更；当前没有外部消费者，按仓库约定直接删除，不保留兼容层。
- 放弃旧 Hugo 版本会拒绝使用旧版本的用户；换取最新 API（图片 WebP、页面构建选项等）与更少的版本分支。
- projects 卡片使用外链时，站内详情页可能只有简短正文；站点可以只维护卡片信息，详情页作为可选补充。
- 分页引入 `page/N` URL；旧 fixture 路由与探针需同步，否则出现 404 或断言失效。
- 设计门禁对组件键与片段数量做硬检查；任务顺序必须是契约先于模板，否则 CI 直接失败。

## Migration Plan

实施顺序：设计契约（DESIGN / sidecar / 门禁）→ 版本与 CI → i18n / 导航 / 参数 → blog 去信件并改名 → essays → projects → fixture 与 archetypes → 探针与截图 → 决策与交接文档 → `openspec validate --specs --strict`、0.168.0 严格构建（0 WARN）、资产门禁与浏览器验收。本变更保留活动状态，等待用户审核后再归档。
