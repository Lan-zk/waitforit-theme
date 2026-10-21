# webgl-scene 证据

Canvas 2D 场景迁移到 WebGL2 的前后对照证据。已归档变更 `openspec/changes/archive/2026-10-21-webgl-scene/`，决策记录 `docs/decisions.md` D32。
基线提交：`8db387c`（迁移前 HEAD）。实现与文档同步后的最终证据在 `after/`。

## 目录

| 路径 | 内容 |
| --- | --- |
| `baseline/` | 迁移前确定性静态首帧、Canvas 2D 静态底图、确定性校验、性能基线 |
| `after/static/` | 迁移后同口径静态首帧（`<w>-<theme>.png`）与静态底色层读回（`base-<w>-<theme>.png`） |
| `after/motion/` | 正常动效下相隔 6 秒的合成帧（1440/390 × day/night） |
| `after/crops/` | 草叶、水缘、星点的 4× 放大对照（1440） |
| `after/video/` | 约 8–9 秒昼夜动效录像（headless 软件渲染，帧率低，仅证明行为，不作流畅度结论） |
| `after/visibility/` | `test/scene-visibility.mjs` 的动效/静帧/静态层结果、reduce 截图与上下文丢失恢复 JSON |
| `after/diff.json` | 基线 vs 迁移后的逐像素差异汇总（整体、静态层、局部区域） |
| `after/performance-after.json` | 迁移后同机主线程提交成本采样 |
| `after/signature-results.json`、`after/tuner-results.json` | 迁移后签名套件与调参套件结果 |
| `spikes/` | P1 水面移植与草叶 AA 的 spike 数值、截图与结论 |

## 采集方法

迁移前后均在 headless Chrome（`test/probe.mjs` 启动，`--disable-gpu`，Windows 软件后端 WARP）、
`prefers-reduced-motion: reduce` + `prefers-color-scheme: light`、1440×900 与 390×844、day/night 下采集。
reduce 下场景只画一次静态首帧，因此截图可重复。

```powershell
# 构建（Hugo 0.168.0；本机二进制路径略）
hugo --source exampleSite --themesDir ../.. --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings --destination C:\tmp\wf-webgl\baseline
# 同源静态服务
node scripts/preview-scene.mjs --root C:\tmp\wf-webgl\baseline --port 8841
# （迁移后同理，构建到另一个目录并服务到另一端口）
# 基线/对照静态帧
node test/scene-capture.mjs --url http://127.0.0.1:8841/ --out C:\tmp\wf-webgl\capture-1
# 逐像素比较
node test/scene-diff.mjs --a <基线.png> --b <迁移后.png> [--region x,y,w,h] [--json]
# 动效/静帧/静态层/上下文丢失
node test/scene-visibility.mjs --url http://127.0.0.1:8821/ --out <目录>
# 主线程提交成本（同环境仅作相对比较）
node test/scene-performance.mjs --url http://127.0.0.1:8821/ --out <json>
```

## 基线（迁移前）

- `baseline/1440-day.png`、`1440-night.png`、`390-day.png`、`390-night.png`：最终合成静态首帧。
- `baseline/base-1440-day.png` 等 4 张：Canvas 2D 静态底图（地形 + 固定星点 + 静止远景草），供迁移后静态层对照。
- `baseline/capture.json`：视口、主题、canvas 尺寸与令牌读数。
- `baseline/determinism.json`：两次独立采集的 SHA-256 全部逐字节一致（8/8）。
- `baseline/performance.json`：迁移前性能数据与限制说明。

## 迁移后结果

### 静态首帧与静态层

`after/diff.json`（每像素取 RGB 最大绝对差；越界值按 0–255）：

| 对比 | mean | p99 | max | >2 比例 |
| --- | ---: | ---: | ---: | ---: |
| 1440 day 合成帧 | 0.287 | 5 | 35 | 4.10% |
| 1440 night 合成帧 | 0.233 | 5 | 26 | 3.19% |
| 390 day 合成帧 | 0.370 | 6 | 31 | 5.44% |
| 390 night 合成帧 | 0.308 | 6 | 27 | 4.37% |
| 1440 day 静态层 | 0.004 | 0 | 12 | 0.04% |
| 1440 night 静态层 | 0.007 | 0 | 34 | 0.10% |
| 390 day 静态层 | 0.005 | 0 | 8 | 0.06% |
| 390 night 静态层 | 0.007 | 0 | 20 | 0.11% |

局部区域（1440，合成帧）：

| 区域 | day mean / max | night mean / max |
| --- | ---: | ---: |
| 草带 | 0.842 / 16 | 0.666 / 15 |
| 水道（含浅岸） | 0.704 / 17 | 0.662 / 13 |
| 天空（含星点） | 0.011 / 35 | 0.008 / 26 |
| 中心主句 | 0.003 / 2 | 0.003 / 1 |

静态底色层为像素级近似（p99=0，mean ≤0.007）；剩余差异集中在草叶/星点的亚像素覆盖率与水面 LINEAR 放大。4× 放大对照见 `after/crops/`，肉眼并排无可辨差异。

### 动效与降级

- `after/motion/`：正常动效下相隔 6 秒的两帧；`after/video/motion-1440-{day,night}.mp4` 为约 8–9 秒录像（headless 软件渲染帧率低：day 16 帧/8.22s、night 47 帧/7.45s，仅证明动效存在与空间范围，不用于流畅度判断）。
- `after/visibility/visibility.json`：1440/390 × day/night 四组通过；草叶根部固定、邻居方向一致率 0.986–1.000、草带/水道六秒变化达标、中心阅读区 ratio 0；reduce 六秒零像素变化、零逻辑帧；静态层不重建。
- `after/visibility/context-loss.json`：`WEBGL_lose_context` 丢失后停止绘制，恢复后继续，页面无错误。

### 测试与门禁

- `test/signature.mjs`（含 `--disabled-url` 关闭构建）：38/38。
- `test/scene-tuner.mjs`：15/15；调参事件触发静态层重建与实时重绘。
- `test/scene-visibility.mjs`：4/4 + 上下文丢失恢复。
- `node scripts/check-assets.mjs`：5/5 退出 0。
- Hugo 0.168.0：`--panicOnWarning` 严格构建 0 WARN；`--logLevel info` 无 deprecat。
- `openspec validate webgl-scene --type change --strict` 与主规范 strict 校验通过。
- 本机网络受限，Hugo 0.146.0 二进制不可得，未在本机复核最低支持版；模板、配置与资源管线未改动，仅 `assets/js/scene.js` 内容变化，风险留待 CI 或用户环境复核。

### 性能（同机、非真机结论）

| 指标（10 秒，1440×900 视口 1422×804） | 迁移前 Canvas 2D | 迁移后 WebGL2 |
| --- | ---: | ---: |
| 主线程每逻辑帧提交耗时（中位） | 39.6ms | 0.2ms |
| p95 | 44.7ms | 10.6ms |
| 逻辑帧数 | 112 | 186 |
| 长任务 | 未记录 | 130 次 / 7.56s |

headless + 软件后端（WARP）下，WebGL2 把逐帧 CPU 绘制移到 GPU 进程，主线程提交成本大幅下降；但本机整体窗口/合成环境异常（长任务多、逻辑帧率受限），绝对数值**不能**外推到真机或普通 GPU 浏览。headful GPU 测量在本机也不可信（rAF 间隔中位约 384ms），见 `baseline/performance.json`。真实设备/跨引擎结论仍属 P4。

### P1 spike（选型依据）

- `spikes/results.json`：水面 GLSL 场与 Canvas 2D 在 8-bit 合成层等价（water mean 0.59–0.71、p99 2、max 3）。
- 草叶 AA：Canvas 2D 基线墨量 0.3856；MSAA 4x 为 0.3740（约 −3.0%），2× 超采样层为 0.3848（约 −0.19%）。选择 2× 草层（选型 C）；MSAA 4x 仅作显存受限备选并记录已知偏差。

## 验收阈值（T2 视觉等价）

- 合成帧：p99 ≤ 6/255、>2 比例 ≤6%；静态层 p99 = 0；中心主句区域 mean ≤0.01 且 max ≤2。
- 草/水/星点 4× 放大并排评审无可辨差异；动效与降级沿用 `scene-visibility` 既有阈值，不因迁移放宽。
- 性能只作同环境相对比较；真机与跨引擎在 P4 前不声称通过。

## 限制

- 真实手机、Safari/Firefox、辅助技术与真实 GPU 帧率未验；headless 截图与性能不代表这些环境。
- 本机 headless 软件后端（WARP）下 WebGL2 帧率仍受合成环境限制；headful 本机也不可信。
- 长会话下单精度相位精度可能缓慢下降；隐藏/离页会暂停相位累积，实际影响有限（见变更 design.md）。
- Canvas 2D `drawImage` 双线性放大与 WebGL `LINEAR`、路径覆盖率 AA 与 2× 超采样的差异属于预期亚像素差异。
- Windows 工作区 CRLF 与异步下载导致的测试可移植性修正（`test/signature.mjs`、`test/scene-tuner.mjs`）不属于渲染行为变更，理由已写入 D32。
