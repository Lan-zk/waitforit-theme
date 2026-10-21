# WebGL2 场景迁移交接

日期：2026-10-21。变更已归档：`openspec/changes/archive/2026-10-21-webgl-scene/`；主规范已同步；本轮已提交并推送。用户要求把场景从 Canvas 2D 迁移到 WebGL2，保持当前效果、样式、动效不变。实现与证据已完成；决策记录为 `docs/decisions.md` D32，证据入口 `docs/design/evidence/webgl-scene/README.md`，P1 spike 在 `docs/design/spikes/water-parity.html` 与 `grass-aa.html`。

## 实现

`assets/js/scene.js` 已重写为单文件、零依赖 WebGL2 渲染器（1000 行）：

- day/night 各一个 WebGL2 上下文，保留双画布与 CSS 900ms 交叉淡化；默认帧缓冲关闭 MSAA。
- 静态地形、固定星点、远端草叶在尺寸/令牌/主题变化时以 4× MSAA 烘焙为纹理，解析后释放 MSAA 缓冲；每帧只做一次 NEAREST 全屏合成。
- 水面在 289×254 FBO 用片元着色器复刻原 `paintRipples` 公式与按主题着色，按预乘 alpha + LINEAR 放大合成；原 `clip(streamPath)` 已删除（alpha 在裁剪边前已归零）。
- 中近景草叶实例化，风在顶点着色器求值；先画进 2× 离屏层，再按 LINEAR 做 2×2 平均降采样。AA 选型来自 P1 spike：MSAA 4x 草层约损失 3% 墨量，2× 超采样层与 Canvas 2D 基线差 0.19%。
- 几何/随机数/风场公式/排序与 Canvas 2D 版本逐项一致；16 个 CSS 令牌、12s 相位、24 逻辑帧上限、时间步长封顶、hidden/pagehide/pageshow、reduce/saveData 静帧、`wf:scene-update`、`features.scene`、无 JS 行为保持不变。
- 无 WebGL2、初始化失败或上下文丢失时静默退回纸面 + 纸光 + 颗粒（不启动 RAF、不产生 console error）；`webglcontextrestored` 重建资源后继续。
- 只读调试探针 `?wf-scene-probe=1` 暴露 `phase()/frames()/staticBuilds()/blades()/tips()/staticImage(theme)`；正常页面不输出。
- GLSL 内联，未新增 shader 文件、渲染库或远程资源（AST-16）；shader 为原创，未复制上游 GLSL。

## 结果

- T2 视觉等价：确定性静态首帧 1440/390 × day/night 与迁移前差异 mean 0.23–0.37/255、p99 5–6、>2 比例 3.1–5.4%；静态底色层 mean ≤0.007、p99 0；中心主句区域 mean 0.003、max ≤2；4× 草/水/星点对照并排无可辨差异。
- 动效：六秒局部变化与降低动效静帧沿用原阈值；四组 `scene-visibility` 通过（根固定、邻居一致率 0.986–1.000、reduce 六秒零像素/零帧）；上下文丢失恢复通过。
- 测试：`signature` 38/38（含关闭构建 URL）、`scene-tuner` 15/15、`scene-visibility` 4/4 + context-loss；`check-assets` 5/5；OpenSpec change 与主规范 strict 通过。
- 性能（同机 headless 软件后端，仅相对）：主线程每逻辑帧提交中位 0.2ms（迁移前 39.6ms）、p95 10.6ms（迁移前 44.7ms）、逻辑帧 186（迁移前 112）；长任务偏高，headless/软件渲染不代表真机。真实设备/跨引擎仍属 P4。

## 同步的文档与测试

- `DESIGN.md` 场景段与 sidecar `.impeccable/design.json`：Canvas 2D → WebGL2，补静态烘焙/水面片元场/2× 草层/无 WebGL2 降级。
- `docs/decisions.md` D32：supersede D2/D8-R/D26–D31 的渲染器条款与 brief 的 WebGL 禁令；保留视觉/参数/生命周期条款。
- `docs/signature-capabilities.md`、`docs/design/fidelity-matrix.md`：对外契约与历史矩阵口径。
- `scripts/check-assets.mjs`：独立 shader 文件门禁信息改为“GLSL 内联在 scene.js”（行为不变）。
- 测试：`test/scene-visibility.mjs`（探针/清楚 mask/上下文丢失）、`test/signature.mjs`（clear 计帧、截图代替 toDataURL、WebGL2 上下文与失败模拟）、`test/scene-performance.mjs`（clear 计帧 + 主线程提交耗时）、`test/scene-tuner.mjs`（iframe 截图代替 toDataURL）；`test/probe.mjs` 在 Linux/CI 加 `--enable-unsafe-swiftshader`。Windows CRLF 与异步下载的测试可移植性修正不属于渲染行为变更，已写入 D32。
- 新增 `test/scene-capture.mjs`、`test/scene-diff.mjs`（零依赖 PNG 解码）与证据目录。

## 限制与未完成

- 本机网络受限，Hugo 0.146.0 二进制不可得，最低支持版未在本机复核（0.168.0 严格构建 0 WARN、INFO 无 deprecat）；模板/配置未改，风险由 CI 双版本矩阵（REL-07）覆盖。
- 真实手机、Safari/Firefox、辅助技术与真实 GPU 帧率未验（P4）；headless 截图与性能不代表这些环境。
- 长会话下单精度相位精度可能缓慢下降；隐藏/离页暂停相位累积，实际影响有限。
- 2× 草层显存：@1440 两上下文约 41MB（草层）+ 10MB（静态）+ 默认缓冲，另加水面小纹理；@390 约 11MB。未做低端设备专项调优。
- 变更已归档并同步主规范；本轮已提交并推送（见最新提交）。

## 复跑

```powershell
# 构建（Hugo 0.168.0）
hugo --source exampleSite --themesDir ../.. --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings --destination C:\tmp\wf-webgl\after
# 服务主题与 /tune/（preview-scene 同时托管调参页）
node scripts/preview-scene.mjs --root C:\tmp\wf-webgl\after --port 8843
# 关闭 features 的构建（用于 signature --disabled-url）
hugo --source exampleSite --themesDir ../.. --config "hugo.toml,C:\tmp\wf-webgl\disabled.toml" --destination C:\tmp\wf-webgl\disabled
node scripts/preview-scene.mjs --root C:\tmp\wf-webgl\disabled --port 8844
# 验收
node test/signature.mjs --url http://127.0.0.1:8843/ --disabled-url http://127.0.0.1:8844/ --out C:\tmp\wf-signature
node test/scene-visibility.mjs --url http://127.0.0.1:8843/ --out C:\tmp\wf-visibility
node test/scene-tuner.mjs --url http://127.0.0.1:8843/tune/ --out C:\tmp\wf-tuner
node test/scene-performance.mjs --url http://127.0.0.1:8843/ --out C:\tmp\wf-perf.json
node scripts/check-assets.mjs
openspec validate --specs --strict
```
