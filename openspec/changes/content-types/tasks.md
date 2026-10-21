# Tasks

## 1. 设计契约与门禁

- [x] 1.1 更新 `DESIGN.md`：删除 "The letter meta block" 一节与 frontmatter 的 `letter-meta` 组件键，新增 project card 组件与卡片形态说明；重生成 `.impeccable/design.json`；更新 `scripts/check-assets.mjs` 的组件键与片段期望数量，5 项门禁退出 0。
- [x] 1.2 把六类目录名、顺序与首版实现范围写进 `docs/decisions.md` 新条目（supersedes D4/D5/D5-R/D14/D20/D21 的相关条款），并更新 `AGENTS.md` 的当前阶段描述。

## 2. 版本与 CI

- [x] 2.1 主题根 `hugo.toml` 的 `[module.hugoVersion] min` 改为 `"0.168.0"`，只保留 `params.waitforit.*` 默认值（CFG-15）。
- [x] 2.2 `.github/workflows/ci.yml` 改为固定 0.168.0 单版本 + 每周对最新稳定版校验；保留 `--panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings` 与 `--logLevel info` 弃用审计（REL-05/07/08）；删除 0.146 矩阵。同步知识库 REL-07 与发版清单的冲突说明。
- [x] 2.3 复跑 `evidence/smoke.ps1`，确认 0.168.0 基线下的规则仍成立；失败项按知识库维护协议逐条复核并更新规则、来源与证据文件。

## 3. 内容模型与路由

- [x] 3.1 `layouts/posts/` 改为 `layouts/blog/`；详情模板去掉 `wf-letter-title` 与信件元信息，显示标题、日期、摘要与正文；删除 `layouts/_partials/letter-meta.html` 与 `.wf-letter*` 样式（TPL-09/16、CNT-08）。
- [x] 3.2 新增 `layouts/essays/section.html` 与 `layouts/essays/page.html`，复用 `post-row`，列表标题与空态取 i18n（TPL-09/16）。
- [x] 3.3 新增 `layouts/projects/section.html`、`layouts/projects/page.html` 与 `project-card` partial；卡片优先链接 `params.repo`，详情渲染摘要与仓库/演示链接（TPL-09/16、CNT-08）。
- [x] 3.4 blog 与 essays section 模板接入 `.Paginate`（页大小由站点 `pagination.pagerSize` 控制）与 `layouts/_partials/pagination.html`，第一页不渲染分页控件（TPL-20/21）。
- [x] 3.5 i18n 中英：删除 `waitforit.letter.*`，新增 `waitforit.nav.{blog,essays,projects,fiction,photography,about}`、三类列表空态与分页文案；两语言键集合一致（CFG-23/24）。
- [x] 3.6 默认导航改为固定顺序清单并渲染六项；未实现的 fiction、photography、about 指向占位页，站点 `menus.main` 整体替换（CFG-11）。
- [x] 3.7 `archetypes/posts.md` 改为 `archetypes/blog.md` 与 `archetypes/projects.md`，删除信件骨架（CNT-08）。

## 4. 内容与 fixture

- [x] 4.1 `exampleSite`：`posts` 改为 `blog` 并去掉信件字段，`notes` 改为 `essays`，新增 3 个 projects（虚构仓库链接），保留一个普通页，并为 fiction、photography、about 各建一个占位页（本地化"建设中"文案）；覆盖中英双语、长标题与空列表（D11）。
- [x] 4.2 全仓库清理信件文案（首页 hero、页脚、DESIGN 叙事、示例内容、参数注释），历史决策与归档记录保留原文。

## 5. 验收与文档

- [x] 5.1 0.168.0 严格构建 0 WARN、资产门禁 5/5、`openspec validate --specs --strict` 通过。
- [x] 5.2 更新浏览器探针 `test/{signature,probe,fidelity}.mjs` 的路由与断言（移除 letter-meta，增加分页与 project card），跑 1440/390 昼夜、无 JS、reduce 与场景降级。
- [x] 5.3 同步 `docs/decisions.md`、`docs/signature-capabilities.md` 与 handoff；本变更保留活动状态，等待用户审核。
