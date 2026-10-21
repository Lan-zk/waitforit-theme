# P1 原型 spikes（design-contract 4.1 / 4.2 / 4.3 + webgl-scene P1）

五个可独立打开的静态原型：三个验证设计契约里最不确定的三处（字体 A/B、纸光场景分层、动效时长来源），两个验证 webgl-scene 迁移的水面公式移植与草叶抗锯齿。
原型按 design.md D11：纯静态 HTML + 内联 CSS/JS，无构建、无运行时网络请求；视觉值唯一来源是 `assets/css/tokens.css`，页面里一律 `var(--wf-*)`，无颜色字面量。

## 文件清单

| 文件 | 字节 | 说明 |
| --- | ---: | --- |
| `font-ab.html` | 17,792 | 4.1 字体组合 A/B/C/D 对比 |
| `surface.html` | 20,442 | 4.2 Canvas 线场 + 径向纸光 + 颗粒，day/night 交叉淡化 |
| `motion.html` | 24,577 | 4.3 动效时长令牌实测与 `?motion-entrance` 覆盖 |
| `water-parity.html` | 33,293 | webgl-scene P1：水面场 Canvas 2D vs WebGL2 并排与逐像素指标 |
| `grass-aa.html` | 28,655 | webgl-scene P1：草叶 AA，Canvas 2D fill vs MSAA 4x vs 2× 超采样 |
| `shots/` | 1,579,879（16 张） | 1440×900 / 390×844 截图，单张 ≤165,222 B |

无 `fonts/` 目录、无临时探针页：A/B 对照字体（Source Serif 4）用后即删，见文末。

## 打开方式

页面用相对路径引用 `../../../assets/css/tokens.css` 与 `../../../assets/`，必须从仓库根起 HTTP 打开（`file://` 下字体加载不可靠）：

```powershell
# 仓库根执行
python -m http.server 8731 --bind 127.0.0.1
```

- 4.1 `http://127.0.0.1:8731/docs/design/spikes/font-ab.html`（`?combo=a|b|c|d` 直开单组合）
- 4.2 `http://127.0.0.1:8731/docs/design/spikes/surface.html`（`?theme=day|night|auto`，默认 auto；`&crossfade=demo` 自动切换夜色并采样）
- 4.3 `http://127.0.0.1:8731/docs/design/spikes/motion.html`（`?motion-entrance=1200ms` 覆盖令牌；`?menu=open` 初始打开移动菜单）
- webgl-scene P1 `http://127.0.0.1:8731/docs/design/spikes/water-parity.html`（水面场 Canvas 2D vs WebGL2，day/night 切换）
- webgl-scene P1 `http://127.0.0.1:8731/docs/design/spikes/grass-aa.html`（草叶 AA：A/B/C + 4× 局部）

每页顶部面板用 `getComputedStyle(document.documentElement)` 实读令牌，不是常量。

## 截图协议

Windows 的 headless Chrome 有最小窗口宽度（约 504px），`--window-size=390,844` 会被拉伸后再裁剪，因此 390 档改用 CDP 覆盖设备尺寸。实际截图命令（Chrome 155.0.8059.82）：

```powershell
# Chrome 启动（Node 24 通过 WebSocket 连 CDP；脚本是 $env:TEMP 下的临时助手，不入库）
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-sandbox `
  --hide-scrollbars --force-device-scale-factor=1 --disable-extensions --no-first-run `
  --remote-debugging-port=0 --user-data-dir="$env:TEMP\wf-cdp-profile" about:blank
# CDP 顺序：Target.createTarget → Target.attachToTarget(flatten) → Page.enable → Runtime.enable
#   → Emulation.setDeviceMetricsOverride{width,height,deviceScaleFactor:1,mobile:false}
#   → Emulation.setEmulatedMedia{media:screen, features:[prefers-reduced-motion reduce|no-preference, prefers-color-scheme light]}
#   → Page.navigate → 轮询页面 waitFor 表达式 → 可选 eval/wait 步骤 → Runtime.evaluate 读面板
#   → Page.captureScreenshot{format:png, fromSurface:true}
```

1440 档也可以直接用等价的单命令（本目录截图统一走 CDP，保证两种宽度同一协议）：

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-sandbox `
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,900 --virtual-time-budget=8000 `
  --screenshot="docs\design\spikes\shots\surface-day-1440x900.png" `
  "http://127.0.0.1:8731/docs/design/spikes/surface.html?theme=day"
```

reduced-motion 档用 CDP 的 `prefers-reduced-motion: reduce` 模拟（等价于 Chrome 的 `--force-prefers-reduced-motion`）。
所有 PNG 均为真视口尺寸，用 Pillow 12.2.0 校验：`Image.open(path).size` 与文件名一致，16 张全部 ≤300KB（最大 165,222B），无需二次压缩。

## 截图清单（尺寸 / 字节）

| 截图 | 尺寸 | 字节 | 内容 |
| --- | --- | ---: | --- |
| `font-ab-1440x900.png` | 1440×900 | 165,222 | 四组合并排 + 令牌面板（A/D 底 841 < 900） |
| `font-ab-390x844.png` | 390×844 | 63,719 | 四组合一屏（D 底 825，docHeight 844），无横向溢出 |
| `font-ab-b-1440x900.png` | 1440×900 | 101,335 | `?combo=b` 单组合，serif 读数为 Source Serif 4 |
| `font-ab-reduced-1440x900.png` | 1440×900 | 164,382 | reduced-motion：hover 令牌 0ms，切组不依赖动效 |
| `surface-day-1440x900.png` | 1440×900 | 132,418 | 三层场景日光 |
| `surface-night-1440x900.png` | 1440×900 | 149,891 | 三层场景夜色 |
| `surface-day-390x844.png` | 390×844 | 95,289 | 光心 50% 40%，无横向溢出 |
| `surface-night-390x844.png` | 390×844 | 98,169 | 夜色窄屏 |
| `surface-reduced-1440x900.png` | 1440×900 | 133,258 | 静态首帧、transition 0s |
| `surface-crossfade-mid-1440x900.png` | 1440×900 | 143,612 | 切换中约 400ms（veil 166.889 165.889 163.297） |
| `surface-crossfade-trace-1440x900.png` | 1440×900 | 153,710 | 59 帧采样 6ms→938ms |
| `motion-default-1440x900.png` | 1440×900 | 46,350 | 六行动效实测表 |
| `motion-default-390x844.png` | 390×844 | 22,758 | 窄屏实测表改为逐行堆叠 |
| `motion-override-1200ms-1440x900.png` | 1440×900 | 47,106 | `?motion-entrance=1200ms` |
| `motion-reduced-1440x900.png` | 1440×900 | 45,762 | 全 0ms、transform none |
| `motion-menu-open-390x844.png` | 390×844 | 16,898 | `?menu=open` 底部菜单已打开（顶 531 / 底 844 / 高 313） |

## 4.1 字体 A/B 结论（可直接回填 transfer-matrix 字体行）

- **A = Newsreader VF（正/斜）+ Commit Mono 400/700 作为默认：成立**。1440 四组并排在一屏内（D 组底边 841px），390 四组也在一屏内（D 组底边 825px，docHeight 844px）；两档 `scrollWidth == clientWidth`（1440=1440、390=390）。
- **A 与 B 的差异只在 display/title 尺寸可辨**：reading 尺寸（clamp 1.125–1.25rem）下两种衬线的行宽与可读性接近；B 组需要额外 99,008 B（48,464 + 50,544 B）两片 woff2，只为对照，**不引入主题**。
- **C/D 的系统 mono 回退（ui-monospace → Consolas 等）在 code 行字面与宽度上明显不同**，Commit Mono 的 0.6em 等宽节奏是排版契约的一部分，保留。
- 组合切换只改 `data`/class 与局部 `--wf-type-*-family`，不消费任何动效；reduced-motion 下 hover 令牌读数为 0ms 而切换仍即时完成。
- 主题字体实测按 `document.fonts` 全部可用：Newsreader 2/2、Commit Mono 2/2、Source Serif 4 2/2（截图时临时字体在位）；面板读数示例 `--wf-font-serif` = `"Newsreader", "Noto Serif SC", …, serif`。

## 4.2 纸光场景结论

- 三层按 D3 叠放：`canvas.scene`（z=0，`--wf-z-scene`）→ `.veil`（z=1）→ `.grain`（z=2）→ `.frame`（z=3）；body 无背景色，场景画布自绘纸面。
- **令牌实读**（getComputedStyle，截图同日）：day `--wf-ink #353431`、`--wf-paper #faf9f6`、`--wf-veil-rgb 250 249 246`、`--wf-veil-position 50% 48%`、颗粒 `grain-light.png · 0.06 · 120px`；night `--wf-paper #2e2d2b`、`--wf-veil-rgb 46 45 43`、`grain-dark.png · 0.08 · 120px`、`--wf-ink rgba(240,240,240,.8)`。
- **断点光心**：390 档 `--wf-veil-position` 读到 `50% 40%`；1440 为 `50% 48%`；两档 `scrollWidth == clientWidth`，无横向滚动。
- **900ms 交叉淡化成立且与场景同步**：rAF 采样 59 帧，6ms = `250 249 246`，938ms = `46 45 43`（进度单调）；约 400ms 的中间帧纸光 = `166.889 165.889 163.297`，同时两张 canvas 的 opacity = 0.593 / 0.426、颗粒 opacity = 0.0344 / 0.0356（`--wf-motion-theme` 过渡 0.9s），纸光/场景/颗粒同一时钟。
- 层序为夜色在下、日光在上：上层淡出即露出下层，中间态不会透出白底（早期版本 day 在下时中间帧发白，已修正）。
- **reduced-motion**：`--wf-motion-theme` 过渡时长 computed 为 `0s`，rAF 循环不启动，只绘制静态首帧（`scene-day` 像素为 `250,249,246`、`scene-night` 为 `46,45,43`），面板读数 "0ms · reduced-motion：场景仅绘制静态首帧（rAF 循环未启动）"。
- Canvas 线场只画在 `--wf-horizon`（39.4309vh）以下，低对比横纹；径向纸光六停点全部读 `--wf-veil-*` 令牌。

## 4.3 动效结论

令牌来源：全部 `transition` 只写 `var(--wf-motion-*)`；页面表格同时显示令牌声明值、`transitionend.elapsedTime` 与 `performance.now()` 墙钟。

- **默认（1440）实测 / 声明**：入场 300ms（elapsedTime 300 / 墙钟 297.2）· 页面进入 520ms（520 / 517.1）· 页面退出 220ms（220 / 216.7）· 星形 hover 180ms（180 / 165.7）· 菜单打开 240ms（240 / 232.7）· 菜单关闭 180ms（180 / 167.2）。elapsedTime 与令牌逐项一致。
- **非硬编码证明**：`?motion-entrance=1200ms` 用 `documentElement.style.setProperty('--wf-motion-entrance','1200ms')` 覆盖同一令牌后，入场声明 1200ms、elapsedTime 1200ms、墙钟 1199.8ms，其余五项保持 520/220/180/240/180ms 不变——时间随令牌变化，不是写死值。
- **reduced-motion**：六项全部 `0ms（instant，无 transition）`，面板 "transition 令牌全部 0ms"；星形/菜单/页面/入场 computed `transform: none`（无位移、无缩放），入场 `transitionDuration: 0s, 0s`。
- **390 菜单**：`?menu=open` 后菜单 `class="motion-menu is-open"`，rect top 531 / bottom 844 / height 313 / opacity 1 / background `rgb(250, 249, 246)`（day 的 `--wf-paper` 令牌），`scrollWidth == clientWidth == 390`；≤640px 时实测表改为逐行堆叠，不再挤压列宽。

## reduced-motion 证据汇总

| 页面 | 证据 |
| --- | --- |
| font-ab | `font-ab-reduced-1440x900.png`：`prefers-reduced-motion: reduce（命中）· hover 令牌取值为 0ms`；切组只改 data/class。 |
| surface | `surface-reduced-1440x900.png`：令牌 0ms、transitionDuration `0s`、rAF 未启动、静态首帧已绘制。 |
| motion | `motion-reduced-1440x900.png`：六项实测 0ms、transform 全部 `none`、`r-reduced` 写明 transition 令牌为 0ms。 |

## A/B 对照字体（Source Serif 4，不入库）

只用于 B/D 组的并排对照。截图时临时下载到 `docs/design/spikes/fonts/`，截完删除整个目录；字体门禁只允许 `assets/fonts/` 下的 4 个主题 woff2。

| 文件 | 字节 | sha256 |
| --- | ---: | --- |
| `source-serif-4.woff2` | 48,464 | `a6608ab32f7090f577e51a3b6d4b4f0609762686b88f9084d65a5623b44da11d` |
| `source-serif-4-italic.woff2` | 50,544 | `e940d556347366d68322f128c89b05a1840da4622c9872b5c2352e3a3410fe25` |

来源（Google Fonts CSS2 API，Chrome 155 UA）：

- 正体：`https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400&display=swap` → `https://fonts.gstatic.com/s/sourceserif4/v15/vEFF2_tTDB4M7-auWDN0ahZJW3IX2iZPwg3BucvUtfykDXr4.woff2`
- 斜体：`https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@1,8..60,400&display=swap` → `https://fonts.gstatic.com/s/sourceserif4/v15/vEFH2_tTDB4M7-auWDN0ahZJW1ge6NmXq2ZbF8zBfb98SUr6aX0.woff2`

删除后重开 `font-ab.html`，B/D 组按 `@font-face` 回退到 `--spike-serif-control` 的下一项 Georgia，面板显示 "Source Serif 4 加载失败 2/2"；A/C 组与主题字体不受影响（已实测：B 组 computed font-family 仍列 `"Source Serif 4", Georgia, …`，实际渲染走 Georgia）。复现对照时把上表两个文件放到 `docs/design/spikes/fonts/` 再按上面的 URL 打开即可。

## 限制与未达成

- 截图协议依赖临时 CDP 脚本（`$env:TEMP`），仓库内不保留该脚本；README 已记录完整 Chrome 参数与 CDP 调用顺序，1440 档可用单命令复现，390 档需 CDP 或 `--force-device-scale-factor` 等替代手段（headless 最小窗口限制无法绕开）。
- surface 交叉淡化只让纸光通道、场景与颗粒透明度做 900ms 过渡；`--wf-ink`/`--wf-paper` 令牌本身在 tokens.css 里是瞬时切换（设计如此），中间帧文字对比度由令牌决定，不在本 spike 处理范围。
- font-ab 的 B/D 组在临时字体删除后不再看到 SS4 字面，这是字体门禁的预期状态，不是缺陷。

## webgl-scene 迁移 spike 结论（P1，2026-10-21）

两个页面服务于已归档变更 `openspec/changes/archive/2026-10-21-webgl-scene/` 的 P1 门禁：先量化水面着色器移植与草叶 AA 的偏差，再决定生产渲染器是否按 design D4/D6 推进。页面内 GLSL 全部内联，不新增 `.glsl/.frag/.vert`；`node scripts/check-assets.mjs` 退出 0。

打开方式（仓库根）：

```powershell
python -m http.server 8842 --bind 127.0.0.1
```

- `http://127.0.0.1:8842/docs/design/spikes/water-parity.html`
- `http://127.0.0.1:8842/docs/design/spikes/grass-aa.html`

两页在 headless Chrome 155（`test/probe.mjs` 启动，`--disable-gpu` → ANGLE/Microsoft Basic Render Driver 软件渲染）、1440×900、DPR1、reduce + light 下采集；无外部请求、无 console error。证据在 `docs/design/evidence/webgl-scene/spikes/`：`water-parity-1440.png`、`grass-aa-1440.png`、`results.json`（含两页 `window.spikeWaterResult` / `window.spikeGrassResult`、环境与资源清单）。软件渲染只用于公式与 AA 对比，不作性能结论。

### 水面（water-parity）

1440×900；streamBounds 798/495 · 461×405；ripple 289×254、step 1.6；phase 0。比较最终合成（纸底 + 水面 alpha 混合），day/night 各一次：

| 主题 | 区域 | mean | p99 | max | >2 |
| --- | --- | ---: | ---: | ---: | ---: |
| day | all | 0.033 | 1 | 3 | 0.007% |
| day | water | 0.588 | 2 | 3 | 0.127% |
| night | all | 0.041 | 1 | 3 | 0.021% |
| night | water | 0.714 | 2 | 3 | 0.365% |

结论：GLSL 场与 Canvas 2D `paintRipples()` 在 8-bit 合成层面等价——最大差 3/255、均值 <1，差异只来自纹理放大与混合舍入，不是公式或坐标偏差。两侧都在纯纸底上合成水面（不含地形底图；地形层在 P2 单独对照）。P3 可按“同分辨率 289×254 FBO + LINEAR 放大 + premultiplied 合成”推进，不改公式；`clip(streamPath)` 可以删（alpha 在裁剪边之前已归零）。

### 草叶 AA（grass-aa）

720×420、400 片、phase 0。为得到局部 AA 样本，生成时跳过 scene.js 的水道/密度剔除；`x/depth/length/lean/breadth/opacity` 的随机数消费顺序与草叶参数公式保持。A = Canvas 2D fill；B = 实例化 + MSAA 4x（`antialias:true`，本机 `SAMPLES=4`）；C = 同一实例化渲染到 2× FBO 后 LINEAR 降采样。逐像素取 RGB 最大通道绝对差：

| 比较 | 区域 | mean | p99 | max | >2 | 完全一致 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| A↔B | all | 0.086 | 3 | 16 | 1.291% | 96.63% |
| A↔B | edge | 2.316 | 9 | 16 | 36.97% | 13.50% |
| A↔C | all | 0.100 | 4 | 23 | 1.527% | 96.59% |
| A↔C | edge | 2.784 | 10 | 17 | 46.42% | 12.57% |

草带平均墨量（每像素平均 ink，越大越深）：A 0.3856、B 0.3740、C 0.3848；Δ(A−B)=0.0115（约 −3.0%），Δ(A−C)=0.0007（约 −0.19%）。截图下半部 4× 局部可见 B 的弱草叶略淡，C 更接近 A。

判定阈值（本 spike 固定）：墨量差 |Δ|≤0.005（约 1.3%）、edge mean≤3.0、p99≤12、max≤24。B 因墨量差 0.0115 不达标；C 全部达标（0.0007 / 2.784 / 10 / 17）。**选择 C：草叶层用 2× 离屏 FBO + LINEAR 降采样**；B（MSAA 4x）作为实现简化或显存受限时的备选，代价是约 3% 墨量偏浅。生产上只对草层做 2×（base/water 保持 1×），以控制填充率与显存；全屏 2× 的成本需在 P2 用真实 GPU 复测。

剩余风险：

- B 的 MSAA 采样位置与解析依赖驱动，WARP 之外的 GPU 可能给出不同墨量；C 的 2× 也只在 WARP 验证过。
- 2× 草层在 1440×900 × 两个昼夜上下文下的显存/填充预算未测（本 spike 只有 720×420 单上下文）；P2 需实测，必要时限制到草带范围。
- alpha-to-coverage 未实现（对不透明纯色填充不适用）；解析覆盖率仍未验证。
- C 的 2×2 采样相位与 Skia 解析覆盖率仍有 17/255 量级的边缘差；若 T2 的 4× 放大评审要求更严，可再评估 4× 超采样或解析覆盖率。
- 真实手机/跨引擎（P4）与 headful GPU 性能不在本 spike 范围。
