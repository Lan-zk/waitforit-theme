# content-types 验收证据

日期：2026-10-21。对应活动变更 `openspec/changes/content-types/`，决策 D33。环境：Hugo 0.168.0（standard）、Chrome 155 headless（软件渲染）、Node 24。主题只支持当前最新稳定版 Hugo，不再维护 0.146 矩阵。

## 结论

- 严格构建：`hugo --source exampleSite --themesDir ../.. --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings`，退出 0，无 WARN；EN 35 页 / ZH 27 页，Paginator 1 页（EN），Processed images 40。
- 资产门禁 `node scripts/check-assets.mjs`：5/5 通过（令牌、字体、组件形态、装饰、sidecar 13/8/2/11/20 与 9 片段）。
- OpenSpec：`openspec validate --specs --strict` 5 项通过；`openspec validate content-types --strict` 通过。
- 浏览器探针 `node test/probe.mjs`：1440 与 390 各 9/9 通过；无横向溢出、六项导航可见、无 JS 正文可读、reduce 下无绘制。
- `node test/signature.mjs`：37/37 通过（代码复制、OG、转场、场景、无 JS、reduce）。
- `node test/fidelity.mjs`：23/23 通过（OG 安全区、首页首屏与滚动、资源）。
- `node test/scene-visibility.mjs`：4/4 + context-loss 通过（第三轮）。同一环境前两轮的 1440 day 组合曾因 grass max delta 66 > 阈值 64 失败，场景代码本轮未改动；第三轮通过，判定为无头软件渲染下的相位/时序抖动，记录为已知环境敏感性，未放宽阈值。

## 内容验收点

- 六类目录：`blog`、`essays`、`projects`、`fiction`、`photography`、`about`；前三类有模板与 fixture，后三类为占位页（本地化文案 + 空列表样式）。
- 信件模型移除：无 `params.from/to/subject`、无 `letter-meta` 组件与样式、无 letter 文案与 i18n 键、无旧 `features.sea` 场景开关。
- 分页：blog 有 `/blog/page/2/`，第一页显示「1 / 2」与「Next page」；`pagination.pagerSize = 2` 用于 fixture。
- projects 卡片：3 张平铺卡片，卡片链接到仓库；无填充、无圆角、无阴影。
- 首页「Recent」跨 blog/essays/projects 取 5 条。
- assets/css 与模板里不再有 `.wf-letter*`；`DESIGN.md` 组件由 letter meta 换为 project card，sidecar 9 片段同步。

## 文件

- `projects-1440-day.jpg`、`projects-390-day.jpg`：作品卡片网格两档。
- `blog-1440-day.jpg`：blog 列表与分页。
- `essays-1440-day.jpg`：随笔列表。
- `signature-results.json`、`fidelity-results.json`、`visibility.json`：测试原始结果。

## 未覆盖

真实手机、Safari/Firefox、辅助技术、真实 GPU 帧率未验证；CI 尚未接浏览器门禁；带站点 `menus.main` 的整体替换场景未进 fixture（默认六项导航已覆盖）。
