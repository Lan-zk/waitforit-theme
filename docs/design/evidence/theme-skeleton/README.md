# P2 主题骨架视觉证据（theme-skeleton）

本目录是 OpenSpec `theme-skeleton` 任务 6.3 的证据包：用 `test/shoot.mjs`（零依赖 CDP，`Page.captureScreenshot`）对 `exampleSite` 构建产物截图，并与 [`docs/design/reference/baseline/`](../../reference/baseline/) 的参考基线并排评估。所有截图都是**首屏静态首帧**，viewport 精确等于尺寸、`deviceScaleFactor=1`、不滚动拼接、不裁剪。

- 证据版本：Hugo **0.146.0**（standard，非 extended）构建产物；同一产物的行为断言在 0.146.0 与 0.168.0 两版上各跑一遍（见「构建、探针与门禁结果」）。**所有 probe 数字均取自 post-veil-fix 构建**（`assets/css/style.css` 纸光修复后；两版产物 CSS 指纹相同：`main.min.3fa64f33…css`）。
- 截图工具：`test/shoot.mjs`（复用 `test/probe.mjs` 的 CDP 会话）；浏览器 Google Chrome **155.0.8059.82**（`C:\Program Files\Google\Chrome\Application\chrome.exe`），headless-new。
- 截图日期：2026-10-20。

## 构建

仓库根执行（写仓库外临时目录，不碰 `exampleSite/public`）：

```powershell
$hugo146 = 'C:\Users\lzk\AppData\Local\Temp\wf-hugo\v146\hugo.exe'
$hugo168 = 'C:\Users\lzk\AppData\Local\Temp\wf-hugo\v168\hugo.exe'
$out146  = 'C:\Users\lzk\AppData\Local\Temp\wf-build\verify-146'
$out168  = 'C:\Users\lzk\AppData\Local\Temp\wf-build\verify-168'

& $hugo146 --source exampleSite --themesDir ../.. --destination $out146 `
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings `
  --gc --cleanDestinationDir
& $hugo168 --source exampleSite --themesDir ../.. --destination $out168 `
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings `
  --gc --cleanDestinationDir
```

两版均 **exit 0、零 WARN**（0.146.0/0.168.0 的 `--logLevel info` 日志分别为 26/27 行，其中 INFO 行 11/12；详见下节弃用审计）。截图取自 0.146.0 产物；0.168.0 产物只用于行为断言，两版渲染结果一致（CSS 指纹相同，均为 `main.min.3fa64f33…css`，即 post-veil-fix 产物）。

## 静态服务

截图与探针都走 http（不用 `file://`，保证 localStorage / hreflang / 绝对路径与生产一致）。服务的是**构建产物目录**，不是仓库根：

```powershell
python -m http.server 8790 --bind 127.0.0.1 --directory C:\Users\lzk\AppData\Local\Temp\wf-build\verify-146
```

页面 URL 都是该服务下的站内路径（下表逐条给出；404 用 `/404.html` 直接访问，静态服务器对其返回 200，与真实主机的 404 路由行为不同）。

## 探针（行为断言）与门禁结果

```powershell
node test/probe.mjs --url http://127.0.0.1:8790/ --width 1440 --height 900
node test/probe.mjs --url http://127.0.0.1:8790/ --width 390 --height 844
# 0.168.0 产物换成 http://127.0.0.1:8791/
```

| 组合 | 结果 |
| --- | --- |
| 0.146.0 × 1440×900 | 7/7 PASS，exit 0（`no-horizontal-overflow`、`design-tokens`、`menu-toggle`、`hit-targets`、`theme-persistence`、`reduced-motion`、`no-js`） |
| 0.146.0 × 390×844 | 7/7 PASS，exit 0；`scrollWidth=390 <= clientWidth=390` |
| 0.168.0 × 1440×900 | 7/7 PASS，exit 0 |
| 0.168.0 × 390×844 | 7/7 PASS，exit 0；`scrollWidth=390 <= clientWidth=390` |

关键断言摘要：真实鼠标点击菜单按钮 → `aria-expanded=true`；Escape → `false` 且焦点回到按钮；可见 chrome 控件（1440 下 10 个 / 390 下 11 个）命中区均 ≥44×44；`wf-theme=night` 刷新后 `data-theme=night`，非法值 `zzz` 回落到无 `data-theme`（auto）且 0 条脚本错误；`prefers-reduced-motion: reduce` 下 `--wf-motion-theme=0ms`、稳定 1200ms 窗口内 rAF 调用 0 次、两张 canvas 快照一致；禁用脚本后正文 575/520 字符、8 个导航链接全部可见。

门禁与弃用审计（同一构建树）：

```powershell
node scripts/check-assets.mjs
# PASS 5 项（token-literals / fonts / component-forms / decoration / sidecar），exit 0

& $hugo146 --source exampleSite --themesDir ../.. --destination C:\Users\lzk\AppData\Local\Temp\wf-build\audit-146 --logLevel info 2>&1 | tee C:\Users\lzk\AppData\Local\Temp\wf-build\hugo-info-146.log
Select-String -Path C:\Users\lzk\AppData\Local\Temp\wf-build\hugo-info-146.log -Pattern 'deprecat' -CaseSensitive:$false   # 0 命中
# 0.168.0 同上：0 命中
```

## 截图命令

主题必须**显式**指定：headless Chrome 继承本机 OS 深色偏好，`auto` 会解析成 night。`test/shoot.mjs --theme day|night` 的做法是向 `localStorage["wf-theme"]` 写入 `day`/`night` 后 reload，由 head 内联启动脚本在首帧前把 `data-theme` 写到 `<html>` 上（与真实用户选择路径一致；截图输出会自报 `data-theme`、`--wf-paper`、`scrollWidth/clientWidth` 供核对）。

```powershell
node test/shoot.mjs --url http://127.0.0.1:8790/ --out home-1440x900.png --width 1440 --height 900 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/ --out home-390x844.png --width 390 --height 844 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/ --out home-night-1440x900.png --width 1440 --height 900 --theme night
node test/shoot.mjs --url http://127.0.0.1:8790/posts/first-letter/ --out post-1440x900.png --width 1440 --height 900 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/posts/first-letter/ --out post-390x844.png --width 390 --height 844 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/posts/third-letter/ --out post-long-title-390x844.png --width 390 --height 844 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/posts/ --out list-1440x900.png --width 1440 --height 900 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/posts/ --out list-390x844.png --width 390 --height 844 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/404.html --out 404-1440x900.png --width 1440 --height 900 --theme day
node test/shoot.mjs --url http://127.0.0.1:8790/404.html --out 404-390x844.png --width 390 --height 844 --theme day
```

## 逐图观察

| 文件 | URL | 主题 | 拍摄事实（工具自报） | 观察结论 |
| --- | --- | --- | --- | --- |
| [`home-1440x900.png`](home-1440x900.png) | `/` | day | `--wf-paper=#faf9f6`、`--wf-ink=#353431`，`scrollWidth=clientWidth=1440` | 固定框架：左上 32px 星标 logo、右上 `MENU`；首屏句子居中（衬线斜体，display 字阶 `clamp(1.25rem, .875rem + 1.5vw, 2.5rem)` 在 1440 宽为约 35.6px，未到 2.5rem 上限）；`RECENT LETTERS` 三行按日期倒序（日期等宽、标题衬线斜体，144 字符长标题在列内换行不外溢）；`READ` 链接；底栏左侧品牌 + note、右侧 `ENGLISH / 中文 / DAY`。页面下缘可见纸面淡纹理（海面线在纸光之下，见偏差 A、B）。与基线 [`home-1440x900.png`](../../reference/baseline/home-1440x900.png) 对照：框架位置、列宽、层级一致，字体族不同（偏差 C）。 |
| [`home-390x844.png`](home-390x844.png) | `/` | day | `scrollWidth=clientWidth=390` | 框架收缩为 28px；标题换两行；列表项改为日期在上、标题在下；长标题 5 行不溢出，**390 宽无横向滚动**。首屏底部固定底栏覆盖在滚动正文之上（参考基线 [`post-1440x900.png`](../../reference/baseline/post-1440x900.png) 的固定框架同样压在正文上；属于固定 chrome 行为，不是本主题新增缺陷）。 |
| [`home-night-1440x900.png`](home-night-1440x900.png) | `/` | night | `data-theme=night`、`--wf-paper=#2e2d2b`、`--wf-ink=rgba(240, 240, 240, 0.8)`，`scrollWidth=clientWidth=1440` | 夜间纸色读数为 **#2e2d2b**（契约 `--wf-night-paper` 命中）；星标、文字、底栏反白；海面纹理在夜间保持淡层。与基线 night 对照口径沿用 P1 spike 截图（reference baseline 只提供 light）。 |
| [`post-1440x900.png`](post-1440x900.png) | `/posts/first-letter/` | day | `--wf-paper=#faf9f6`，`scrollWidth=clientWidth=1440` | 信件版式：`Date / From / To / Subject` 四行等宽元信息 + 分隔线，正文 reading 字阶（`clamp(1.125rem, 1.05rem + .375vw, 1.25rem)`/1.6）落在 760px 列内；页面不显示大标题（`h1` 为 `wf-sr-only`，参考基线同样以 Date/From/To/Subject 呈现，属形态一致）。底栏固定并压在滚动正文上，与基线 [`post-1440x900.png`](../../reference/baseline/post-1440x900.png) 的固定框架行为一致。 |
| [`post-390x844.png`](post-390x844.png) | `/posts/first-letter/` | day | `scrollWidth=clientWidth=390` | 元信息键值上下排列；正文单列 `measure:100%`；无横向滚动。 |
| [`post-long-title-390x844.png`](post-long-title-390x844.png) | `/posts/third-letter/` | day | `scrollWidth=clientWidth=390` | 超长标题（144 字符）只出现在 `<title>` 与 `sr-only` 的 `h1`，letter 版式不渲染可见标题行，因此不参与视觉行宽；390 下正文/元信息无溢出。这是超长标题“不横向溢出”的间接证据（页面内可见文本不含该标题）。 |
| [`list-1440x900.png`](list-1440x900.png) | `/posts/` | day | `--wf-paper=#faf9f6`，`scrollWidth=clientWidth=1440` | 信件索引：三行按日期倒序（Sep 12 / Jul 1 / Mar 14）；section 标题为 `sr-only`，列表行沿用日期 + 标题两栏；页面大面积留白 + 海面淡层。与基线 [`posts-1440x900.png`](../../reference/baseline/posts-1440x900.png) 的层级与行节奏一致。 |
| [`list-390x844.png`](list-390x844.png) | `/posts/` | day | `scrollWidth=clientWidth=390` | 日期与标题堆叠、无横向滚动；底栏固定。 |
| [`404-1440x900.png`](404-1440x900.png) | `/404.html` | day | `--wf-paper=#faf9f6`，`scrollWidth=clientWidth=1440` | 居中：125px 星标 + `404` + `This is not a letter we sent.` + `BACK TO THE START`；顶栏/底栏与其它页一致。 |
| [`404-390x844.png`](404-390x844.png) | `/404.html` | day | `scrollWidth=clientWidth=390` | 同一 404 布局在 390 下居中不溢出；底栏固定。 |

## 偏差声明（与 `docs/design/fidelity-matrix.md`「主题值/偏差声明」列对应）

以下偏差均为**已声明**，证据截图不对像素做验收；P2 不做动态海面/转场，偏差对应 `design.md` 的 Risks 与 D7 降级矩阵。

- **A. 静态首帧：** 场景只画 `phase=0` 的静态首帧（`assets/js/scene.js` 调一次 `draw(0)`），没有参考站点的动态波光/海面时间驱动；截图即最终形态。P3 把调用改成 rAF 循环并接 `--wf-motion-*` 后重新评估观感。
- **B. 海面在纸光下呈淡纹理（veil 几何导致）：** 按契约的纸光几何（`--wf-veil-size: 72% 115%` 全视口径向渐变，中心 alpha .985 → 96% 处 0）叠加静态首帧，海面读数是“很淡的水印”，而不是参考基线里底部清晰可见的水面；这是静态首帧 + 不透明纸光的组合结果，令牌未改；P3 的时间驱动场景是重新评估这一观感的时机。
- **C. 字体替换：** Plantin Now → Newsreader（含真斜体、wght 200–800），Departure Mono → Commit Mono；字号/行高/字重/角色映射不变（`--wf-type-*`），CJK 走系统回退。这是唯一允许的观感偏差来源。
- **D. 无 JS 无线条：** 禁用脚本时场景 canvas 不绘制，只剩 `.wf-scene` 的纸色背景 + 纸光 + 颗粒；正文、导航链接、语言切换全部可用（探针 `no-js` 检查：正文 575/520 字符、8 个导航链接可见）。这是已声明的降级（D7），P3 也不改服务端渲染。
- **E. 菜单开合只有透明度过渡：** 菜单面板开合使用 `opacity/visibility`（`--wf-motion-menu-open/close` 240/180ms），没有位移、缩放或逐项入场动画；截图是关闭态首帧。页面/菜单的转场动画按 D11 留到 P3。
- **F. chrome 文字在 day 模式用 ink 而不是 moonlight：** 为保证纸面上的可读性，顶栏/底栏文字在 day 模式使用 ink 色（`--wf-ink`）而不是参考的 moon-white；夜间模式仍使用 moonlight/反白。
- **G. 颗粒为全页静态纹理：** 颗粒从参考的“移动菜单面板纹理”升级为全页静态平铺（`--wf-grain-*`，原创 120×120 PNG），属 P1 已声明的扩展，不是像素级保真对象。

非偏差说明：参考基线同样使用固定顶/底栏，长内容会在滚动时穿过固定栏下方（见基线 [`post-1440x900.png`](../../reference/baseline/post-1440x900.png)），本主题复现这一框架行为；参考站点的已知缺陷（缺 skip link、英文闪烁、light 模式导航重叠）按设计契约作为反例修复，不计入保真。

## 设备与工具版本

- Windows 11 / pwsh；Node **24.14.0**（探针脚本要求 Node ≥ 22，使用内置 `WebSocket`）。
- Google Chrome **155.0.8059.82**（headless=new，`--remote-debugging-port=0`，临时 `--user-data-dir`，退出时 CDP `Browser.close` + 进程树兜底清理）。
- Hugo **0.146.0** / **0.168.0**（standard，非 extended）。
- 截图 PNG 为视口原尺寸（1440×900 / 390×844），未压缩、未标注。
