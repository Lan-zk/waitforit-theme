# 保真矩阵：参考系统 → waitforit-theme（P1 结论）

本矩阵是 `design-contract` 的 L2 保真判定记录，也是 P2 `theme-skeleton` 的验收基线。它回答一个问题：哪些东西必须像参考站点，哪些东西是我们声明的偏差，偏差对应哪条 Risk。

- **参考侧**：上游 pin `31b1b0429425f7d5af914afa4d29165688d71a3f`（earendil-works/website，取用于 2026-10-20），证据与哈希见 [`docs/design/reference/upstream-pin.md`](reference/upstream-pin.md)；基线截图 12 张在 [`docs/design/reference/baseline/`](reference/baseline/)（1440×900 与 390×844，light 模式）。
- **主题侧**：契约 [`DESIGN.md`](../../DESIGN.md)、令牌 [`tokens.css`](tokens.css)、sidecar [`.impeccable/design.json`](../../.impeccable/design.json)；实测来自三个 spike（[`docs/design/spikes/`](spikes/)，命令与结果见其 README）。
- **判定口径**：形态、层级、节奏一致；字体族与海面实现是声明偏差；不把像素一致性当验收目标。参考站点已知缺陷（缺 skip link、英文闪烁、light 模式导航重叠）是缺陷，不是保真对象。

| 保真面 | 参考值（pin 31b1b04 / 12 张基线截图） | 主题值（契约 + P1 实测） | 偏差声明（对应 design.md Risks） | 证据 |
| --- | --- | --- | --- | --- |
| **字体 A/B** | Plantin Now VF（upright/italic 83,136/94,676B，专属许可不可分发）+ Departure Mono（22,496B，OFL 但按仓库边界禁入）；衬线角色 display/title/reading、等宽角色 body/ui/form/label/code；8 组字号/行高（display `clamp(1.25rem, .875rem + 1.5vw, 2.5rem)`/1.15、title 1.25rem/1.15、reading `clamp(1.125rem, 1.05rem + .375vw, 1.25rem)`/1.6、body .9375rem/1.6、ui .9375rem/1.25、form .9375rem/1.6、label .8125rem/1.25、code .8125rem/1.846，weight 400）。 | Newsreader VF latin 子集 125,812 + 140,676B（含真斜体、wght 200–800）+ Commit Mono latin 400/700 15,100 + 15,080B，合计 296,668B ≤ 300KB；角色映射与 8 组字号/行高逐项保持（`--wf-type-*`）；`--wf-font-serif` / `--wf-font-mono` 是唯一允许的覆盖点。A/B 实测：四组合字体加载均 2/2，1440 与 390 均无横向溢出；A/B 字面差异主要在 display/title 尺寸可辨、reading 尺寸行宽与可读性接近，系统 mono 在 code 行字面与宽度明显不同，Commit Mono 有真 700。 | 字族替换是唯一允许的观感偏差来源（Departure Mono 的像素感放弃）；字号、行高、字重、角色映射不变；CJK 走系统回退，形态随平台变化。→ Risks：观感偏差（字体）、字体自托管体积、CJK 回退不可控、子集化工具链。 | `upstream-pin.md` 字体表、`CREDITS.md`、`spikes/shots/font-ab-*.png` |
| **表面与纸光** | WebGL 海面 shader（页面内联）+ `paper.png`/`paper-dark.png`（121,359/104,542B，260px 平铺，实际只作移动菜单面板纹理）；纸光 `radial-gradient(ellipse 72% 115% at 50% 48%, …)`，中心 `.985` → 96% 处 0，`--page-veil-rgb` 250 249 246（夜 46 45 43）经 `@property` 900ms 通道插值；`body` 不设背景色。 | Canvas 2D 原创线场（正弦波线组 + 稀疏点光 + 视差，全部由令牌参数化），四层 z 序 canvas 0 → veil 1 → grain 2 → frame 3；原创无缝颗粒 7,229/7,065B（120×120，≤16KB），light 透明度 .06 / night .08；纸光参数与参考一致，≤520 光心移到 `50% 40%`。实测：日/夜令牌值全部命中，veil 从 7ms 到 938ms 连续插值，`reduce` 只绘制静态首帧。 | 场景实现换 Canvas 2D（无 WebGL 物理相机与星光层，v0.2 再议）；颗粒从「菜单面板纹理」升级为全页静态纹理；无 htmx 页面增强。→ Risks：全屏纸光/颗粒性能。 | 12 张基线截图、`upstream-pin.md`、`spikes/shots/surface-*.png` |
| **导航与 chrome** | 固定框架 75px（≤800 40 / ≤520 28）；page-top 151px、page-bottom 175px、measure 760px（≤800 680 / 801–1100 `min(680px, calc(100vw - 360px))`）；logo 居中 125 / 角落 32；nav-star 15px；theme-toggle 内距 6px 10px；lang-menu 160px + 4px 圆角 + scrim 底 + blur + 投影；letter-meta 下距 24px / 36px；触控 ≥44px；horizon 39.4309vh。 | `tokens.css` 逐项同值，并用媒体查询重绑：frame 40/28px、measure 680px、display 最大 2rem；`--wf-page-top: calc(75px + 76px) = 151px`、`--wf-page-bottom: calc(75px + 100px) = 175px`；8 个字体角色、24 个色值中的 13 个、2 个圆角、11 个间距全部进令牌；`--wf-tap-target: 44px`。 | `page-top/page-bottom` 以 `calc(frame + 常量)` 表达（断点下随框架自动收缩，参考为定值）；`nav-overlap` 色与移动全屏纸面板不在 P1，P2 按 D7 自写；参考缺陷（light 模式导航重叠、缺 skip link）不保真。→ Risks：参考契约不可版本化（上游值可能变）。 | `DESIGN.md` frontmatter、`tokens.css`、基线 `home/posts/post/purpose/join/404` × 2 档 |
| **动效与降级** | 13 条 motion 记录（page-enter 520ms / exit 220ms、theme 900ms、entrance 300ms、menu 240/180ms、subscribe 720ms、hover 200ms、star spin 1150/850ms、content-swap、code-reveal 200ms、404-fade 300ms 等），多种 easing；htmx 增强页面切换；`reduce` 下部分动效仍在。 | 8 个时长令牌 + 1 条 easing（`cubic-bezier(0.333333, 0, 0.666667, 1)`）：进入 520 / 退出 220 / 主题 900 / 入场 300 / 菜单 240・180 / 订阅 720 / hover 180ms。实测声明 vs `transitionend` 墙钟：300/300、520/520、220/220、180/180、240/240、180/180（差 ≤15ms）；`--wf-motion-entrance` 覆盖为 1200ms 后实测同步 1200ms；`reduce` 下全部 0ms、星形 `transform: none`。 | hover 200→180ms（并入参考的 0.18–0.2s 档）；星形自旋 1150/850ms 未单列令牌，映射到 hover 180ms（矩阵 §5.3 开放问题）；content-swap / code-reveal / 404-fade 排除（主题无 htmx 与对应场景）；缓动统一为一条。→ Risks：无（页面切换增强依赖浏览器 View Transitions 支持）。 | `spikes/shots/motion-*.png`、`transfer-matrix.md` §5.3 |
| **a11y 基线** | 参考站已知缺陷：无 skip link、首屏英文闪烁（客户端 i18n 切换）、light 模式下导航与场景重叠；装饰 canvas 有 `aria-hidden`；对比度未系统声明。 | 主题把参考缺陷当反例修复：skip link 作为 P2 必做项（DESIGN.md Do）；44px 触控、focus ring 1px/3px 偏移、`reduce` 全量降级、无 JS 正文可读、装饰层 `aria-hidden` + `pointer-events:none`、`details/summary` 原生交互；Hugo 构建期 i18n 避免英文闪烁。对比度计算：ink `#353431` on paper `#faf9f6` = 11.82:1（AAA），night ink 合成 8.31:1，muted ink 4.57:1（AA）。 | 参考缺陷被明确修复，记为「优于参考」而非偏差；CJK 系统回退影响换行但不影响可读性；无 WebGL shader 的合成层负担更小。→ Risks：仅 CJK 回退不可控。 | `DESIGN.md` Do's/Don'ts、基线截图、`spikes/shots/*-reduced-*.png` |

## 偏差汇总（与 design.md Risks 一一对应）

| 偏差 | 类型 | 对应 Risk |
| --- | --- | --- |
| 衬线 Plantin Now → Newsreader；等宽 Departure Mono → Commit Mono | 声明偏差（唯一允许的观感偏差） | 观感偏差（字体） |
| 海面 WebGL shader → Canvas 2D 线场 | 声明偏差（实现替换，结构不变） | 全屏纸光/颗粒性能；字体自托管体积（资源预算） |
| 颗粒从「菜单面板纹理」→ 全页静态平铺 | 扩展（仍是原创资产） | 全屏纸光/颗粒性能 |
| hover 200→180ms；自旋 1150/850ms → hover 180ms | 声明偏差（时序归并） | —（矩阵 §5.3 开放问题） |
| page-top/page-bottom 用 `calc` 表达 | 表达方式差异 | 参考契约不可版本化 |
| 参考缺陷（skip link 缺失等）不保真 | 修复 | —（优于参考） |
| CJK 走系统回退 | 声明偏差 | CJK 回退不可控 |

## 验收用法（P2）

1. 先按本矩阵的「主题值」列核对 `assets/css/tokens.css`（从 `docs/design/tokens.css` 迁移并删除 docs 副本）。
2. 在 1440 与 390 两档截图对照基线；偏差只允许出现在「偏差声明」列列出的项。
3. 每次新增保真面或修改偏差，先改本矩阵再改实现；`node scripts/check-assets.mjs` 必须退出 0。
