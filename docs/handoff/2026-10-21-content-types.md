# 六类内容模型与首版三型交接

日期：2026-10-21。活动变更：`openspec/changes/content-types/`（未归档，等待用户审核）。决策：`docs/decisions.md` D33。验收证据：`docs/design/evidence/content-types/README.md`。

## 已完成

- **设计契约**：`DESIGN.md` 删除 letter meta 组件与信件叙事，新增 project card（无填充/圆角/阴影的平铺卡片）；`.impeccable/design.json` 同步重生成（9 个片段：Letter meta → Project card）；`scripts/check-assets.mjs` 5/5 通过。DESIGN 的 North Star 改为 "Words at Rest Beside Still Waters"。
- **版本与 CI**：根 `hugo.toml` 的 `[module.hugoVersion] min = "0.168.0"`；`ci.yml` 改为固定 0.168.0 + 每周一 latest 校验，保留四 flags 与 INFO 弃用审计。
- **模板**：`layouts/posts/` → `layouts/blog/`；新增 `layouts/essays/`、`layouts/projects/`、`layouts/_partials/project-card.html`、`layouts/_partials/pagination.html`；blog/essays 列表接 `.Paginate`；`layouts/page.html` 显示可见标题；删除 `layouts/_partials/letter-meta.html`。
- **样式**：移除 `.wf-letter*`；新增 `.wf-entry-title`、`.wf-entry-meta`、`.wf-entry-links`、`.wf-project-grid`、`.wf-project-card*`、`.wf-pagination*`。
- **i18n**：删除 `waitforit.letter.*` 与 `nav.posts/purpose/values/join`；新增六类型导航标签、`waitforit.list.*`、`waitforit.home.recent`、`waitforit.projects.*`、`waitforit.pagination.*`；中英键集合一致。
- **导航**：`mobile-menu.html` 内置固定六项（blog、essays、projects、fiction、photography、about），未实现的三个指向占位页；站点 `menus.main` 仍整体替换。
- **fixture**：exampleSite 去掉全部信件文案与 `from/to/subject`；`posts`→`blog`（3 篇，含中文翻译页与空列表验收）、`notes`→`essays`（2 篇中英）、新增 `projects`（3 个虚构仓库，中英）、`fiction`/`photography`/`about` 占位页；删除 purpose/values/join；`pagination.pagerSize = 2`；移除站点 menus 以实际构建默认导航。
- **archetypes**：`archetypes/posts.md` → `blog.md` 与 `projects.md`。
- **OG**：`article` 类型与发布时间改为 blog/essays/projects 三类。
- **测试**：`test/signature.mjs`、`test/fidelity.mjs` 的路由与代码断言改为 blog/essays；`probe.mjs` 无需改动。

## 验证

- 0.168.0 严格构建：退出 0，无 WARN；EN 35 / ZH 27 页。
- 资产门禁 5/5、`openspec validate --specs --strict` 5/5、`openspec validate content-types --strict` 通过。
- `probe` 1440/390 各 9/9；`signature` 37/37；`fidelity` 23/23；`scene-visibility` 4/4 + context-loss（第 3 轮；前两轮 1440 day 有过 grass max delta 66 对阈值 64 的抖动，场景代码未改动，已记入证据 README）。
- 构建产物抽查：EN 首页六项导航；`/blog/page/2/`；projects 3 张卡片；`/zh/blog/` 空状态；`/fiction/` 占位页。

## 未完成 / 下一轮

- **发布契约**：`README.md` 与 `CHANGELOG.md` 未写；无 tag；`theme.toml` 未建（取决于是否上架 themes.gohugo.io）。主题显示名仍待用户最终确认（建议沿用 waitforit）。
- **真实环境验证**：真机、Safari/Firefox、辅助技术、真实 GPU 未测；无头 Chrome 的性能与画面不能代表这些环境。
- **CI 浏览器门禁**：现有 probe/signature/fidelity 仍需手工起静态服务；尚未接入 CI。
- **站点菜单替换**：`menus.main` 整体替换场景没有 fixture 覆盖（默认六项导航已覆盖），可在 CI 用配置变体补。
- **分页 UI**：目前只有上一页/下一页与页码状态，没有页码列表；如真实站点需要再补。
- **场景每页成本**：未改动；仍建议在真机上评估是否只在首页动画。

## 复跑

```powershell
C:\tmp\wf-tools\hugo.exe --source exampleSite --themesDir ../.. `
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings `
  --destination C:\tmp\wf-build
node scripts/check-assets.mjs
# 静态服务（任选；先启动再跑浏览器测试）
node scripts/preview-scene.mjs --root C:\tmp\wf-build --port 8843
node test/probe.mjs --url http://127.0.0.1:8843/ --width 1440
node test/probe.mjs --url http://127.0.0.1:8843/ --width 390
node test/signature.mjs --url http://127.0.0.1:8843/ --out C:\tmp\wf-sig
node test/fidelity.mjs --url http://127.0.0.1:8843/ --build-root C:\tmp\wf-build --out C:\tmp\wf-fid
node test/scene-visibility.mjs --url http://127.0.0.1:8843/ --out C:\tmp\wf-vis
openspec validate --specs --strict
openspec validate content-types --strict
```
