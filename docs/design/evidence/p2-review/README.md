# P2 审查与优化（2026-10-20）

依据：根 `DESIGN.md`；范围是已完成的 P2 页面与交互。P3 的动态海面、跨页转场、代码复制、OG 不在本轮实现范围。

## 验收句

- 1440×900、390×844 及中间断点下，正文在固定框架内阅读，不与页脚文字叠印；原生滚动、跳过链接和浏览器返回可用。
- 小屏菜单打开后有名称和模态语义，Tab / Shift+Tab 留在面板内，背景不可操作；Escape 关闭并回焦，切换到桌面后解除模态状态。
- 无 JS 时导航、正文、页脚按文档顺序排列，互不遮挡。
- UI 脚本下载失败时撤销增强布局，恢复同一套普通导航，不留下失效的菜单按钮。
- 列表行、独立动作链接与 chrome 的触控区域至少为 44×44；段内链接保留自然排版。
- 信件元信息后留出 section 间距；缺少 Subject 的信件显示标题；长链接与放大的正文不横向溢出。
- 默认主题配置生效，用户选择优先，非法存储回退 auto；日夜颗粒分别保留各自纹理。
- 两个 Hugo 版本零 WARN，资产门禁与浏览器探针通过；减少动效时保持静态首帧。

`exampleSite/content/reading-check.md` 覆盖长链接、强调、列表与引用；现有 second-letter 覆盖缺少 Subject，中文 posts 覆盖空列表。

## 首轮实测

- 390px 首页正文与固定页脚重叠；禁用 JS 后右侧导航与信件元信息处于相同纵向区域。
- 小屏菜单无模态语义，Tab 离开最后一个菜单项后进入被遮住的正文；页脚仍显示在面板上。
- READ 命中高度 19.25px；信件元信息与正文间距为 0；缺少 Subject 的信件标题仅供屏幕阅读器访问。
- 桌面列表每一行独立计算日期列宽，导致标题起点不齐；day 颗粒层在 night 模式下也读取 dark 图片。
- 本机 Chromium 首次内容绘制为 56ms（本地静态服务、无网络节流，单次观察，不代表线上或移动设备性能）。

## 结果

实现保持既有视觉语言：Newsreader / Commit Mono、纸光几何、四层表面、75/40/28px 框架、760px 阅读列与静态海面均保留。未添加依赖、真实内容或第三方素材。实现与取舍见 [D21](../../../decisions.md)。

按 Impeccable audit 的五个维度评价，当前为 **17/20（Good）**。这是有范围限制的工程审查评分，不是 WCAG 合规认证。

| 维度 | 分数 | 结论 |
| --- | --- | --- |
| 可访问性 | 3/4 | 键盘、焦点、模态隔离、减少动效与无 JS 实测通过；尚未以屏幕阅读器走完整路径 |
| 性能 | 3/4 | 零运行时依赖，静态场景无持续 rAF；真实低端设备和线上 Web Vitals 尚未测量 |
| 响应式 | 3/4 | 106 组页面/重排检查通过，含合成触控；尚未覆盖真实手机、Firefox 与 WebKit |
| 主题 | 4/4 | 日夜、配置默认值、显式 auto、保存值、非法值与颗粒映射通过 |
| 实现一致性 | 4/4 | 既有令牌和原创资产边界保持，五项资产门禁通过，未引入卡片、填充按钮或新色相 |

### 确认并修复的问题

本轮确认 10 组问题：P1 五组、P2 五组，均已修复；没有确认的 P0。

| 优先级 | 问题与影响 | 修复位置与结果 |
| --- | --- | --- |
| P1 | 正文穿过固定页脚，窄屏出现文字叠印 | `assets/css/style.css`：三行 grid 分配 chrome 与正文，只有 main 原生滚动；桌面 main 为 y=119..781，390px 为 y=72..772 |
| P1 | 全屏菜单没有模态语义，焦点进入被遮住的正文，页脚仍露在面板上 | `assets/js/ui.js`、菜单 partial：具名 dialog、背景 inert、双向 Tab 循环、Escape 回焦、跨断点解除隔离；关闭面板在淡出期间也 inert |
| P1 | 无 JS 导航与信件元信息占用同一区域 | `style.css`：无 JS 使用文档流，导航、正文、页脚互不相交 |
| P1 | UI 包下载失败后仍显示无处理器的菜单按钮，读者无法打开导航 | head 捕获带 data-wf-ui 的脚本资源错误，撤销 js 标记并恢复普通导航；新增 ui-load-fallback 探针，阻断 ui.js 的回归从失败转为通过 |
| P1 | 320px / 200% 字体下页脚横向溢出 46px | `style.css`：控件可换行，标记可断行；相同条件下根与 main 溢出均为 0 |
| P2 | READ 等独立动作只有约 19px 高，桌面短文章行也未保证 44px | `style.css`、`test/probe.mjs`：独立动作、文章行与 chrome 至少 44×44；段内链接保留自然排版 |
| P2 | 元信息分隔线紧贴正文；缺少 Subject 时标题不可见；日期长短导致标题起点不齐 | 既有 24px section 间距、缺少 Subject 时显示 title、列表共享日期列；分别保留原有信件字段降级与字体角色 |
| P2 | `defaultTheme` 未被读取；显式 auto 无法覆盖 day/night 默认值；按钮可访问名称没有当前状态 | `baseof.html`、head、`theme.js`：服务端默认模式、保存值优先、显式 auto 持久化、名称如 `Theme: Day` |
| P2 | day 颗粒层在夜间继承 dark 图片，破坏两层交叉淡化 | `tokens.css`、`style.css`：日夜图像与透明度分别绑定到既有值；首帧 veil 也禁用过渡 |
| P2 | CJK 可能合成斜体；关闭动作使用额外的 × 图形；部分 hover 仍是点线 | 禁用字体合成，关闭改为 i18n 文字，动作点线在 hover/focus 转实线；文本选择与原生滚动条使用既有配色 |

### 验证

| 检查 | 结果与证据 |
| --- | --- |
| OpenSpec 归档 | `theme-skeleton` / `spec-driven`；29/29 任务、4/4 产物完成；16 条要求同步到两个新主规范，4 份主规范严格校验通过；归档于 `openspec/changes/archive/2026-10-20-theme-skeleton/` |
| Hugo 0.146.0 / 0.168.0 | 标准版，两版均零 WARN、零弃用命中；fixture 计数 EN 22 / ZH 16（包含非 HTML 输出） |
| 常驻浏览器探针 | 两版本 × 1440×900 / 390×844，每组 9/9 通过，见四份 `probe-*.json` |
| 全页面与主题 | 24 个渲染 HTML 页面 × 两尺寸 × day/night = 96 组；无横向滚动、chrome 叠印、标题层级数量或独立动作尺寸失败 |
| 重排 | reading-check 在 320、520、800、801、1100px × 100%/200% 字体 = 10 组，均通过；总计 106 组，逐项读数见 [browser-review.json](browser-review.json) |
| 触控与历史 | Chromium CDP 合成触控滚动 main=285px，触控打开菜单成功；跨到桌面后解除模态；浏览器返回恢复 main scrollTop=200 → 200 |
| 主题与缺省 | 站点默认 day 生效，按钮名称 `Theme: Day`；保存 auto 后重新加载移除显式 data-theme；非法保存值由常驻探针验证回退 auto |
| 减少动效与无 JS | 1200ms 稳定窗口中 rAF=0，两张 canvas 快照不变；无 JS 导航和正文可见且不叠印 |
| 链接与资源 | 546 个站内链接、资源及锚点引用，0 失败，见 [links.json](links.json)；浏览器脚本错误和 HTTP 资源错误均为 0 |
| 资产门禁 | 令牌字面值、OFL 字体、组件形态、装饰 SVG、DESIGN frontmatter 与 sidecar 一致性五项全部通过 |
| Impeccable detector | 对 `layouts assets` 扫描返回 `[]`，见 [detector.json](detector.json)。工具不能解析 Hugo 的 stylesheet 模板表达式，颜色/自定义属性检查不完整；这部分另用资产门禁、源码审查和渲染读数验证，不能将空结果理解为完整检测证明 |

并发收尾检查曾出现一次桌面菜单未展开，原记录保留于 [load-observation.json](load-observation.json)。16 次带事件记录的并发复现均能开菜单、每个按钮只有一个点击处理器，但观测到一次脚本 `ERR_CONNECTION_RESET`（[诊断记录](menu-load-diagnostics.json)）；原失败未记录资源错误，不能断定其具体原因。主动禁用缓存并阻断 ui.js 可稳定重现同类失效导航；修复后的新增回归通过，修复前证据见 [ui-load-fallback-before.json](ui-load-fallback-before.json)。最终双版本四组探针按顺序运行，均为 9/9；资源阻断是该测试主动注入的预期条件。

对比度按既有纸色合成计算：day 正文 **11.82:1**、弱化文字 **4.57:1**；night 正文 **8.30:1**、弱化文字 **5.38:1**。这不替代所有渐变位置、交互状态与辅助技术的正式审计。

资源保持轻量：压缩后 JS 约 4.2KiB，CSS 约 22KiB，四份字体合计 289.7KiB。冷加载首轮 FCP 56ms；确认中的 24ms 命中缓存，不能直接比较为性能提升。本轮未发现值得重写资源管线的加载瓶颈，未添加预取、缓存层或构建依赖。

### 截图

全部为 macOS 上 Chromium 155 headless、DPR 1、原始视口 PNG，无拼接和图片编辑。404 通过静态服务器直接访问 `/404.html`，未验证部署平台的状态码或兜底路由。

| 场景 | 桌面 | 手机 |
| --- | --- | --- |
| 首页日光 | [1440×900](home-1440x900.png) | [390×844](home-390x844.png)，[修复前对照](before-home-390x844.png) |
| 首页夜色 | [1440×900](home-night-1440x900.png) | — |
| 信件日光 | [1440×900](post-1440x900.png) | [390×844](post-390x844.png) |
| 中文信件夜色 | — | [390×844](zh-post-night-390x844.png) |
| 列表 / 404 | — | [列表](list-390x844.png) / [404](404-390x844.png) |
| 菜单 / 无 JS | — | [菜单](menu-390x844.png) / [无 JS](no-js-390x844.png) |

### 可复跑的常驻检查

仓库根执行，分别将 `hugo` 换成 0.146.0 与 0.168.0 的二进制路径；destination 使用新的临时目录，避免把旧指纹文件当成当前引用的资源。

```sh
node scripts/check-assets.mjs
hugo --source exampleSite --themesDir ../.. --destination /tmp/wf-review-public \
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings \
  --gc --cleanDestinationDir
python3 -m http.server 8794 --bind 127.0.0.1 --directory /tmp/wf-review-public
# 在另一个终端执行：
node test/probe.mjs --url http://127.0.0.1:8794/ --width 1440 --height 900
node test/probe.mjs --url http://127.0.0.1:8794/ --width 390 --height 844
openspec validate --specs --strict
```

额外 106 组是本轮 CDP 检查；完整页面清单、条件与读数已保存，尚未接入 CI。常驻探针现在含 9 项，可直接复跑。完整屏幕阅读器、Firefox/WebKit、真实手机、慢网与低端 CPU 验证留到发布门禁，当前结果不作这些平台的通过声明。

## 下一步

1. P3 先做动态海面：保持现有标记和 draw(phase)，明确帧率、后台暂停、减少动效与省电降级；用当前日夜截图对照可见度，不能仅增加 rAF 就认定海面已完成。
2. 补代码块/复制和 OG/Twitter meta，各先写 fixture；跨页 View Transitions 最后接入，回归本文验证过的原生滚动、焦点与浏览器返回恢复。
3. P4 把浏览器探针、链接检查和截图回归加入 CI，并补 Firefox/WebKit 与真实手机验证；写 README 安装与参数契约后再进入对外发布。

Impeccable 提示 sidecar 的生成时间早于 DESIGN.md；语义一致性门禁已通过。本轮没有改写这两个文件，可另用 `$impeccable document` 刷新 sidecar。
