# 标签与六类边界内容验收

日期：2026-10-21。决策 D34，活动变更 `content-taxonomy-review`；在待审的 `content-types` 上追加，不替代前轮证据。

## 范围与结果

- Hugo 0.168.0 darwin/arm64 严格构建退出 0、零 WARN；EN 67 / ZH 59 页，分页 EN 11 / ZH 9。
- 资产门禁 5/5；主规范 5/5、`content-types` 与 `content-taxonomy-review` 严格验证通过。
- `test/content-boundaries.mjs`：116/116。覆盖 1440/390、day/night、双语经文、长标题、无分隔长词、长标签与 C#/C++ 的真实链接、标签点击区域、无日期/无标签/缺作品外链、图片比例与小图不放大、空列表、跨五类分页归档及无 JS 标签浏览。
- `test/probe.mjs`：1440/390 各 9/9。首轮发现 #C# 与 #C++ 点击宽度不足 44px，已补齐最小宽度，复验通过；未修改门禁阈值。
- `test/fidelity.mjs`：23/23（最终标签最小宽度修正前运行；该修正不改变其首页构图和 OG 验收对象）。
- 站点自定义 hero 的配置变体：中英首页均显示覆盖文案，不附加默认经文出处。

## 验收路径

路径均可在英文根目录或 `/zh/` 下访问。

| 类型 | 样本 | 检查点 |
| --- | --- | --- |
| blog | `/blog/boundary-data/`、`/blog/minimal/` | 长标题、多标签、长代码、宽表格、长正文；缺日期/摘要/标签 |
| essays | `/essays/many-tags/`、`/essays/one-line/` | 标签换行、长标题与极短正文、列表分页 |
| projects | `/projects/local-study/`、`/projects/minimal/` | 无分隔长标题与长摘要；缺仓库时进入站内详情；缺日期/摘要/所有外链 |
| fiction | `/fiction/last-train/`、`/fiction/fragment/` | 长章节、短片段；通用模板，不含小说专属设计 |
| photography | `/photography/ratio-check/`、`/photography/text-only/` | 横图1600×900、竖图600×900、小图96×64；长说明与无图笔记 |
| about | `/about/` | 虚构人物个人介绍、长段落、列表、双语混排、示例链接 |
| tags | `/tags/`、`/tags/grace/`、`/zh/tags/恩典/` | 名称与数量、跨五类型、分页、站内详情链接 |
| empty | `/empty-check/` | 单独保留空列表验收入口 |

摄影图片是本地生成的几何测试图，不是实拍；没有真实人物、邮箱、私照或新字体。所有新增样本只在 exampleSite 内。作品外链延续原有虚构仓库及保留的 example.com 示例地址。

## 环境与限制

内容边界、probe 与 fidelity 使用本机无头 Chrome 默认启动参数；该路径带 `--disable-gpu`，本机没有获得 WebGL2 上下文，验证的是背景不可用时的内容降级。截图中的背景不能代表真实 GPU 的场景效果。

signature 首轮 33/37：四个场景动画断言因 WebGL2 上下文不可用失败（`signature-without-webgl.json`），其余 33 项通过。使用仓库已有 `WF_SOFTWARE_WEBGL=1` 开关后，首轮为35/37：场景断言全部通过，跨文档转场中止及相应 runtime-errors 失败（`signature-software-first.json`）。单独重跑37/37通过（`signature-results.json`）。这是前轮交接已记录的转场不稳定表现，本轮未确认根因；不修改场景/转场代码或放宽断言，不以重跑通过认定该抖动已解决。

尚未覆盖真机、Safari/Firefox、读屏或真实 GPU 性能。跨类型标签页目前是全站主题聚合，不提供多标签组合筛选；小说、摄影和个人介绍的专属设计仍未开展。

## 复跑

先使用 Hugo 0.168.0 执行：

```bash
hugo --source exampleSite --themesDir ../.. \
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings \
  --destination /tmp/wf-content-review-build
node scripts/check-assets.mjs
node scripts/preview-scene.mjs --root /tmp/wf-content-review-build --port 8843
```

另一个终端执行：

```bash
node test/content-boundaries.mjs --url http://127.0.0.1:8843/ --out /tmp/wf-content-boundaries
node test/probe.mjs --url http://127.0.0.1:8843/ --width 1440 --json
node test/probe.mjs --url http://127.0.0.1:8843/ --width 390 --json
node test/fidelity.mjs --url http://127.0.0.1:8843/ --build-root /tmp/wf-content-review-build --out /tmp/wf-content-fidelity
WF_SOFTWARE_WEBGL=1 node test/signature.mjs --url http://127.0.0.1:8843/ --out /tmp/wf-content-signature-software
openspec validate --specs --strict
openspec validate content-taxonomy-review --strict
```

PNG 为最终修正后的两档内容截图；JSON 保留原始断言与结果。
