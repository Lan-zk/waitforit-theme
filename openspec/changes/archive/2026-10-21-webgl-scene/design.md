# Design

## Context

现状与迁移依据见 [proposal.md](proposal.md)。实现层面的关键事实：

- 当前渲染在 [assets/js/scene.js](../../../assets/js/scene.js)：静态地形逐像素烘焙（[cacheGround](../../../assets/js/scene.js#L211-L257)）、水面标量场（[paintRipples](../../../assets/js/scene.js#L302-L369)，289×254 = 73,406 px/帧）、草叶 path fill（[drawGrass](../../../assets/js/scene.js#L190-L209)，1440×900 下 5,031 片 active ×2 画布 = 10,062 次/帧），合成见 [paint](../../../assets/js/scene.js#L371-L391)。
- 双画布与 CSS 900ms 交叉淡化在 [layouts/_partials/scene.html](../../../layouts/_partials/scene.html) 与 [assets/css/style.css](../../../assets/css/style.css#L110-L147)；24fps 门控与暂停在 [scene.js#L393-L468](../../../assets/js/scene.js#L393-L468)。
- 现有测试直接观察 Canvas 2D 内部：`moveTo/quadraticCurveTo/clip/drawImage`（[test/scene-visibility.mjs](../../../test/scene-visibility.mjs#L16-L30)）、`drawImage` 计数与 `canvas.toDataURL()`（[test/signature.mjs](../../../test/signature.mjs#L22-L40)）、调参页 `toDataURL`（[test/scene-tuner.mjs](../../../test/scene-tuner.mjs#L28-L30)）、性能脚本 `putImageData/drawImage`（[test/scene-performance.mjs](../../../test/scene-performance.mjs#L11-L24)）。
- 测试浏览器以 `--disable-gpu` 启动（[test/probe.mjs](../../../test/probe.mjs#L501-L514)），实测为软件渲染：WebGL2 可创建（WARP）但不能代表真机性能；仓库历史 5.1ms 证据来自 macOS 环境，本机不可复现。
- 约束：视觉契约（DESIGN.md 场景段、`assets/css/tokens.css` 的 16 项场景参数、12s 相位、24fps 上限）不变；无新增依赖/构建步骤/远程资源（AST-16）；Hugo 资源管线仍用 `resources.Get` → `minify` → `fingerprint`（AST-02）；`features.scene` 开关与无 JS 行为不变（CFG-05/CFG-07）；资产门禁目前禁止独立 shader 文件（[scripts/check-assets.mjs](../../../scripts/check-assets.mjs#L310-L313)），需在本变更内改为"GLSL 内联"口径。

## Goals / Non-Goals

**Goals:**

- 把逐帧渲染搬到 GPU：主线程每逻辑帧只更新 uniform 与少量 draw call，静态地形/星点/远景草只烘焙一次。
- 视觉数据源不变：同一 PRNG 序列、同一 `stream/edge/waterCoverage/windAt` 公式、同一实例顺序与排序、同一相位函数。
- 保持全部可观察契约：24 逻辑帧上限、暂停/恢复、reduce/saveData 确定性静帧、双画布 900ms 交叉淡化、`wf:scene-update`、`features.scene`、无 JS 可读。
- 达到 T2 视觉等价：确定性静态首帧差异指标达标，动效行为与现有测试阈值一致。
- 单文件、原创、零依赖、可回滚。

**Non-Goals:**

- 不提高 fps 上限，不改变周期/速度/风场/构图/颜色参数。
- 不引入 DPR 渲染或更高内部栅格（保持 CSS 像素栅格；"更清晰"会构成视觉变化）。
- 不保留 Canvas 2D 后备渲染器，不做 WebGL1/WebGPU 兼容层。
- 不改模板结构、CSS 交叉淡化、纸光/颗粒/框架，不引入渲染库或外部 shader 文件。
- 不在本变更内完成 P4 的真机/跨引擎验收与 CI 浏览器门禁，只记录限制与接口。

## Decisions

### D1 全量 WebGL2，删除 Canvas 2D 渲染路径

水面、草叶、静态层全部 GPU 化。草叶 path fill 是主线程大头（约 1 万次/帧），只搬水面无法释放主线程。不保留双渲染器：无 WebGL2 环境已有"纸面 + 纸光 + 颗粒"静态降级路径，双路径维护成本与规范歧义更高。代价是约 2% 环境失去动态景观（BREAKING，已在 proposal 与规范 delta 声明）。

### D2 两个 WebGL2 上下文，保留 CSS 交叉淡化

day/night 各一个 canvas、各一个上下文，同一 phase 各渲一帧；CSS opacity 900ms 过渡不动。替代方案是单上下文 + `mix` uniform，需要 JS 重建主题过渡并监听系统配色（`prefers-color-scheme`），行为漂移风险大，不采用。成本是显存翻倍：实测实现 @1440×900 约 63MB（草层 2× 纹理约 41MB、静态纹理约 10MB、水面与默认帧缓冲约 12MB；默认帧缓冲关闭 MSAA），@390×844 约 11MB。静态层烘焙用的 4× MSAA 缓冲在解析后立即释放，不常驻。

### D3 静态层 GPU 烘焙

地形、固定星点、静止远景草在尺寸/参数/主题变化时渲染到 RGBA8 纹理（每主题一张），每帧一次 NEAREST 全屏 blit。公式与颜色完全照搬 `cacheGround`；`paper/ink` 颜色改用 `getComputedStyle` 的 `rgb()/rgba()` 解析，不再借 1×1 Canvas 2D 取色。替代方案"每帧重算地形"浪费电热；"Canvas 2D 烘焙后上传纹理"保留 2D 路径，仅在 AA spike 不达标时作为兜底记录，不作为首选。

### D4 水面：289×254 FBO + LINEAR 放大

片元着色器复刻 `paintRipples` 的公式、常量、按主题着色与 alpha；合成时 LINEAR 采样，保持当前"低分辨率采样 + 双线性放大"的观感。替代方案"全分辨率计算"更锐利，属于视觉变化，T2 下不采用。裁剪可删：`waterCoverage` 在几何裁剪边之前已归零，水面 quad 的 alpha 自然收边（当前 `clip(streamPath)` 边从未可见）。

### D5 草叶：实例化条带 + 顶点着色器风场

单位草叶是一段三角形带（沿 t 采样两条二次贝塞尔，段数按长度 8–24）；逐实例属性 `x/y/depth/length/lean/breadth/opacity`。顶点着色器逐项复刻 `drawGrass` 的 `windAt`、`tip/top/bend/sway`、根部固定与压低；片元输出 ink × alpha（含 `--wf-ink` 自身 alpha、`footerFade`、深度增益）。保留 seed 271021、`Math.imul` 随机序列、剔除条件、按 y 排序与实例顺序；缓冲区只在尺寸/参数变化时重建，逐帧只更新相位等 uniform。

### D6 抗锯齿：spike 分级选择

P1 spike 结论（`docs/design/evidence/webgl-scene/spikes/`）：MSAA 4x 草层边缘误差较低但墨量比 Canvas 2D 基线少约 3.0%，2× 离屏超采样层的墨量差约 0.19%，4× 放大更接近。最终实现采用 **2× 草层 + LINEAR 降采样**；`alpha-to-coverage` 对不透明纯色填充不适用（MSAA 本身已提供几何覆盖率），解析覆盖率留作未启用备选。固定星点在静态烘焙时用 4×4 子采样圆盘覆盖率。若后续真实设备上 2× 草层显存/填充成为问题，可退回 MSAA 4x 并记录约 3% 墨量偏浅的已知偏差。

### D7 失败、降级与上下文恢复

- 启动：`getContext('webgl2')` 为 null 或着色器编译失败 → 静默停止，不启动 RAF、不产生 console error；canvas 保持透明，露出 `.wf-scene` 纸色与上层纸光/颗粒。
- 运行中：`webglcontextlost` 调 `preventDefault()` 并停 RAF；`webglcontextrestored` 重建资源（program/静态纹理/实例缓冲）后按当前暂停状态继续，不丢相位。
- 不使用 `preserveDrawingBuffer`（性能与移动端代价）；测试用截图而非 `toDataURL`。

### D8 光栅尺度不变

`canvas.width` 仍为 `min(1440, round(cssWidth))`，不引入 DPR；避免迁移顺带改变清晰度。DPR 渲染作为以后独立决策，不进入本变更。

### D9 测试探针改造

- 帧计数：patch `WebGL2RenderingContext.prototype.clear`（实现每帧一次 clear），或等价的只读计数；不再依赖 2D `drawImage` 计数。
- 动画/草根/邻域一致性：`?wf-scene-probe=1` 时暴露只读 `window.wfSceneProbe = { phase(), frames(), staticBuilds(), blades() }`（结构数据，不含渲染路径）；默认页面不输出。替代方案（patch `bufferData/uniform` 反推）与实现耦合、脆弱，不采用。
- 静态底图不变：断言 6s 内 `staticBuilds` 不增长，必要时 `readPixels` 对比。
- 无 WebGL2 模拟：`getContext` 对 `webgl2`/`webgl` 返回 null，断言无 RAF、正文可读、无 console error。
- 调参页：iframe 内截图替代 `toDataURL`，`wf:scene-update` 后重建/重绘行为不变。

### D10 性能验收环境

迁移前后在同机 headful Chrome（启用 GPU）用同一脚本各采 10s：主线程每逻辑帧提交耗时、逻辑帧数、长任务、帧间隔；headless/软件渲染只用于正确性与保真验证，不出性能结论。GPU 计时（`EXT_disjoint_timer_query`）可选，不作门禁（支持率约 66%）。同时记录显存预算与启动首帧时间。

## Risks / Trade-offs

- [草叶 AA 与基线不同] → D6 分级方案；P1 spike 先量化，未达标不进入正式实现。
- [星点/远景草小图元发硬] → 静态烘焙用解析圆盘覆盖率；4× 放大评审。
- [双上下文显存/上下文数量] → 2 个在浏览器上限内；@1440 约 50MB 已记录；移动端档更小。
- [上下文丢失/驱动差异] → D7 处理；P4 真机/跨引擎前不声称通过。
- [测试环境是软件渲染，测不出收益] → D10 另建环境；若不可得，性能证据降级为主线程提交时间 + 架构论证，并如实记录限制。
- [长会话单精度相位精度] → 隐藏时已暂停，相位只在可见时累积；记录为已知限制，不做会跳变的相位 wrap。
- [测试改写面大，最后集中返工] → 探针契约随 P2 骨架同步落地（D9），后续阶段只做增量。
- [资产门禁与实现矛盾] → 同变更更新 `check-assets` 说明与 D32，GLSL 内联，不新增 shader 文件（AST-16）。
- [兼容性下降] → 规范 delta 已声明；无 WebGL2 走静态降级，无 JS 行为不变。

## Migration Plan

1. P0 基线与口径：确认 T2 与测量环境；从当前 HEAD 抓确定性静态首帧与静态底图基线。
2. P1 两个 spike（water-parity、grass-aa）Go/No-Go，未达标先调整 AA 方案。
3. P2 骨架：WebGL2 初始化、双上下文、静态烘焙、失败/恢复、resize/tuner、reduce/saveData；先只画静态层并与基线底图对比。
4. P3 水面、P4 草叶；每阶段做静态帧 diff 与动效回归。
5. P5 契约回归：现有测试全量 + 无 WebGL2、无 JS、features off、上下文丢失。
6. P6 性能、证据、文档（DESIGN/sidecar/decisions D32/spec 同步）、交接。

回滚：改动集中在 `assets/js/scene.js`；`features.scene=false` 可即时关闭；`git revert` 恢复 Canvas 2D；无数据或构建迁移。Hugo 双版本构建与资产门禁按 REL-07 执行，无新增依赖（AST-16），`scene.js` 仍走指纹发布（AST-02）。

## Open Questions

- P0 已确认：本机 headful GPU 测量不可信（rAF 间隔中位约 384ms），性能证据按降级路径记录为主线程提交耗时 + 环境说明（`docs/design/evidence/webgl-scene/README.md`）；真实设备结论留待 P4。Hugo 0.146.0 因本机网络受限未复核，由 CI 双版本矩阵覆盖。
