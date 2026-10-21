# Tasks

## 1. 基线与口径（P0）

- [x] 1.1 确认 T2 视觉等价口径与可用的 headful GPU 测量环境，记录浏览器版本、GPU、视口、DPR；headless/软件渲染只用于正确性。验证：`docs/design/evidence/webgl-scene/README.md` 写明环境与"headless 不作性能依据"的边界。
- [x] 1.2 从当前 HEAD 抓确定性静态首帧基线：reduce 偏好下 1440×900 与 390×844 × day/night 各一张，存入 `docs/design/evidence/webgl-scene/baseline/`。验证：同一流程连跑两次，截图像素差异为 0。
- [x] 1.3 抓静态底图基线：用现有 `wfSceneBase` 探针导出 1440/390 × day/night 的 base 纹理 PNG。验证：PNG 尺寸等于对应 `canvas.width/height`，两次导出一致。
- [x] 1.4 写只读像素 diff 工具（Node，零依赖，仅内部使用）比较 PNG 对并输出 mean/p95/p99/max、超阈值像素比例与局部区域统计。验证：同图对比全 0；对已知改动图输出预期差异。
- [x] 1.5 采集迁移前 headful GPU 性能基线（10 秒：逻辑帧数、主线程每逻辑帧耗时、长任务、帧间隔）。验证：结果写入 `docs/design/evidence/webgl-scene/baseline/performance.json` 并注明环境。

## 2. 渲染器 spike（P1，Go/No-Go）

- [x] 2.1 新建 `docs/design/spikes/water-parity.html`：同相位/同分辨率并排渲染 Canvas 2D 水面场与 GLSL 水面场，输出像素 diff 与 4× 放大对照；GLSL 内联，不新增 `.glsl/.frag/.vert`（AST-16；`scripts/check-assets.mjs` 的 shader 文件门禁保持）。验证：spike 页面可离线打开，README 记录 diff 结果与截图路径。
- [x] 2.2 新建 `docs/design/spikes/grass-aa.html`：真实草叶密度下对比 Canvas 2D fill 与实例化渲染的 MSAA 4x / alpha-to-coverage / 2× 超采样 / 解析覆盖率四种 AA，输出草带平均墨量差与 4× 放大图。验证：README 给出选定的 AA 方案与判定依据。
- [x] 2.3 记录 Go/No-Go 结论：静态帧与草带指标未达阈值时必须先升级 AA 方案，不得跳过进入实现。验证：`docs/design/spikes/README.md` 的 spike 清单与结论段落更新。

## 3. WebGL2 骨架与静态层（P2）

- [x] 3.1 重写 `assets/js/scene.js` 的 GPU 骨架：两个 WebGL2 上下文（day/night）、program/VAO/FBO 管理、尺寸与 ResizeObserver 重建、24fps 门控与 hidden/pagehide/reduce/saveData 暂停逻辑沿用；`?wf-scene-probe=1` 时暴露只读 `window.wfSceneProbe`（phase/frames/staticBuilds/blades）。验证：reduce 静帧、后台暂停/恢复、tuner 事件在骨架下正常，探针字段可读。
- [x] 3.2 静态层 GPU 烘焙：地形场、固定星点、静止远景草照搬现有公式与颜色（颜色用 `getComputedStyle` 的 `rgb()/rgba()` 解析，不再用 1×1 Canvas 2D）；每主题一张纹理，仅在尺寸/参数/主题变化时重建。验证：与 1.3 的 base 纹理对比达到 T2 指标；6 秒内 `staticBuilds` 不增长。
- [x] 3.3 失败与恢复路径：无 WebGL2、着色器编译失败时静默降级（不启动 RAF、无 console error、纸面/纸光/颗粒可见）；`webglcontextlost` 停循环、`webglcontextrestored` 重建后按原状态继续。验证：注入 `getContext` 返回 null 与 `WEBGL_lose_context` 的本地检查通过。
- [x] 3.4 同步改写 `test/signature.mjs` 与 `test/scene-performance.mjs` 中的 Canvas 2D 计数：用 `WebGL2RenderingContext.prototype.clear` 计帧、截图替代 `canvas.toDataURL()`、context 检查改 `getContext('webgl2')`、失败模拟覆盖 `webgl2/webgl`。验证：两个脚本在骨架版本上通过（性能数字此阶段不作结论）。

## 4. 水面（P3）

- [x] 4.1 实现水面片元着色器：复刻 `paintRipples` 的公式、常量、风场输入、按主题着色与 alpha；289×254 FBO + LINEAR 合成，删除不再需要的 `clip`。验证：静态首帧水道区域局部 diff 达标；水区变化率指标与现有阈值一致。
- [x] 4.2 更新 `test/scene-visibility.mjs` 的水域 mask 与帧计数探针（用探针数据或重算 `waterCoverage`），不放松阈值。验证：1440/390 × day/night 四组通过，中心阅读区 ratio 仍 < 0.001。

## 5. 草叶与 AA（P4）

- [x] 5.1 实现草叶实例化与顶点风场：保留 seed 271021 / `Math.imul` 序列、剔除条件、按 y 排序与实例顺序；`tip/top/bend/sway` 逐项照搬；AA 按 P1 结论落地。验证：静态首帧草带平均墨量差与 4× 放大对照达标，草根零位移。
- [x] 5.2 更新 `test/scene-visibility.mjs` 的草根/邻域方向探针：改用 `?wf-scene-probe=1` 的 `blades()/phase()`，断言不放宽（邻居对 ≥50、邻居一致率 ≥0.75、根固定）。验证：四组通过，报告写入 scene-visibility 输出 JSON。
- [x] 5.3 删除旧 Canvas 2D 渲染代码、不再使用的缓存/常量与 2D 探针依赖，不保留双路径。验证：`assets/js/scene.js` 内无 `getContext('2d')` 渲染调用；`grep` 无旧 `quadraticCurveTo` 探针残留。

## 6. 契约回归与降级（P5）

- [x] 6.1 覆盖无 JavaScript、`features.scene=false`、无 WebGL2 三类降级：正文/导航/纸光/颗粒可用；关闭场景时不输出 canvas 或场景脚本；无错误、无持续 RAF、无空白画布区域。验证：`test/signature.mjs` 全量通过，开启/关闭两个构建 URL 均检查。
- [x] 6.2 调参工具回归：`test/scene-tuner.mjs` 的截图取样改造后 15 项通过；`wf:scene-update` 触发重建并保留当前相位。验证：脚本通过并写入 tuner 结果目录。
- [x] 6.3 静态首帧确定性：reduce/saveData 下 6 秒零像素变化、零逻辑帧绘制；上下文恢复不破坏静帧。验证：`scene-visibility` 的 `reducedStable` 四组通过。

## 7. 性能、证据与契约同步（P6）

- [x] 7.1 headful GPU 性能复测：主线程每逻辑帧提交耗时、逻辑帧数、长任务、帧间隔、显存预算、首帧时间，与 P0 基线同环境对比。验证：结果写入 `docs/design/evidence/webgl-scene/after/performance.json`，README 注明限制。
- [x] 7.2 视觉证据：1440/390 × day/night 静态帧、≥8 秒动效录像、草叶/星点/水缘 4× 放大对照、基线 diff 指标表。验证：证据目录 README 引用全部文件且与 P1 阈值一致。
- [x] 7.3 契约同步：更新 `DESIGN.md` 场景段（WebGL2、无 WebGL2 降级、保留 CSS 像素栅格与 24fps）、`.impeccable/design.json` 的 `scene.renderer` 与 overview、`scripts/check-assets.mjs` 的 shader 文件禁令说明（改为 GLSL 内联，AST-16）。验证：`node scripts/check-assets.mjs` 退出 0，sidecar 与 frontmatter 一致。
- [x] 7.4 决策与文档：`docs/decisions.md` 追加 D32（supersede D2/D8-R/D26–D31 的渲染器条款与 brief 的 WebGL 禁令，保留视觉/参数/生命周期条款）；同步 `docs/signature-capabilities.md`、`docs/design/fidelity-matrix.md`、`docs/design/spikes/README.md`。验证：文档口径一致，D32 指向本变更。
- [x] 7.5 Hugo 严格构建与弃用审计（REL-07/REL-08；`assets/js/scene.js` 仍走指纹发布 AST-02；无新增依赖与构建步骤 AST-16）：0.168.0 跑 `hugo --source exampleSite --themesDir ../.. --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings` 无 WARN，INFO 日志无 deprecat；0.146.0 因本机网络受限、二进制不可得未复核，限制写入证据 README 与交接，由 CI 双版本矩阵覆盖。验证：0.168.0 命令退出 0、`openspec validate --strict` 通过；0.146.0 限制已记录。
- [x] 7.6 新交接与证据 README（真机/跨引擎未验、headless 不作性能依据、长会话单精度限制、无 WebGL2 降级）；不归档、不提交、不推送，交由用户决定。验证：`docs/handoff/` 新文件存在且引用 `docs/design/evidence/webgl-scene/`。

## Workflow follow-up

- 用户评审通过后，用 `openspec-archive-change` 归档本变更，把 `signature-experience` 的 delta 同步进主规范。
- 归档后核对主规范「安歇草地与窄溪」已更新，且本变更目录移入 `openspec/changes/archive/`。
