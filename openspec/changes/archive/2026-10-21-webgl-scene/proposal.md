# Proposal

## Why

场景目前是 Canvas 2D：每逻辑帧在 CPU 上计算 289×254 的水面标量场，并在两个昼夜画布上各画约 5,000 片尖叶（合计约 1 万次 path fill）；静态地形也由逐像素 CPU 循环烘焙。可扩展性受主线程限制：低端设备与软件渲染下掉帧，且在 24fps 预算内继续提高草水细节的空间有限。用户要求把渲染迁移到 WebGL，并保证当前效果、样式、动效不变。

本变更只替换渲染实现，不改变视觉契约：同一 PRNG 几何、同一风场公式、同一 12s 相位、同一 24 逻辑帧上限、同一暂停与降级行为。

## What Changes

- `assets/js/scene.js` 从 Canvas 2D 重写为 WebGL2：地形/星点/远景草静态烘焙成纹理；水面在 289×254 FBO 用片元着色器计算后双线性放大；中近景草叶改为单次实例化绘制，风在顶点着色器求值。
- 保持两个昼夜画布与 CSS 900ms opacity 交叉淡化；两个 WebGL2 上下文各渲染一种主题。
- 保持全部生命周期：24 逻辑帧上限、时间步长封顶、hidden/pagehide/pageshow、reduce/saveData 确定性静态首帧、ResizeObserver、`wf:scene-update` 调参事件、`features.scene` 开关。
- 新增 WebGL2 不可用/初始化失败/上下文丢失的处理：不可用时退回现有纸面 + 纸光 + 颗粒静态层，不启动 RAF、不产生 console error；上下文丢失后可恢复。
- **BREAKING**：无 WebGL2 的浏览器不再显示动态景观（此前 Canvas 2D 可用即显示）。
- 渲染器约束：GLSL 内联在 `scene.js`，不新增 shader 文件、不引入渲染库/远程资源/构建步骤（AST-16）；shader 为原创，不复制上游（asset-licensing 边界不变）。
- 同步更新测试探针、资产门禁说明、设计契约与决策记录；性能证据改用可信的 GPU 环境采集。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `signature-experience`: 「安歇草地与窄溪」要求的渲染与降级条件从“Canvas 2D / Canvas 不可用”改为“原创 WebGL2 / WebGL2 不可用或初始化失败”；构图、统一风场、24fps、确定性静态首帧、六至八秒可见性、调参工具与 `features.scene` 开关等行为保持不变。

## Impact

- 代码：`assets/js/scene.js` 单文件重写（约 800–1000 行）；`scripts/check-assets.mjs` 的 shader 文件禁令改为“GLSL 内联在 scene.js”并更新 D8-R 引用；预期不改模板与 CSS。
- 测试：`test/scene-visibility.mjs`、`test/signature.mjs`、`test/scene-tuner.mjs`、`test/scene-performance.mjs` 中依赖 Canvas 2D 内部的探针改写；`test/probe.mjs` 启动参数按需调整（CI 浏览器门禁仍属 P4）。
- 文档：`DESIGN.md` 场景段、`.impeccable/design.json`、`docs/decisions.md` 追加 D32（supersede D2/D8-R/D26–D31 的渲染器条款与 `docs/design/resting-lamb-scene-brief.md` 的“不使用 WebGL”）、`docs/signature-capabilities.md`、`docs/design/fidelity-matrix.md`、新交接与证据。
- 依赖/构建：无新增依赖，Hugo 资源管线不变；仅 `scene.js` 指纹变化。
- 兼容性：WebGL2 支持约 97.9%（2026-10-21 抓取），其余环境按静态降级处理。
- 假设：保真等级取 T2「视觉等价」（确定性静态首帧差异指标 + 4× 放大并排评审，接受亚像素 AA 差异，阈值在基线阶段标定）；性能结论只在启用 GPU 的普通 Chrome 采集，headless 软件渲染不作性能依据。
- 回滚：改动集中在单个文件，`features.scene=false` 可整体关闭，revert 即恢复 Canvas 2D。
