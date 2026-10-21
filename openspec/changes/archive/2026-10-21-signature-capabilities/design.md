## Context

见 proposal.md。P2 已提供四层表面、原生滚动框架与双版本 Hugo 管线，当前工作区已有审查修复，必须保留。

## Goals / Non-Goals

交付品牌、海面、代码/分享、转场完整闭环；不引入 SPA 路由、第三方运行时、远程构建或真实内容。用户授权本轮从提案直接实施，无中途确认，最终审核前保留活动变更。

## Decisions

1. 品牌使用用户图片主轮廓，提取透明底并以 SVG 重建干净边界，currentColor 昼夜共用；星形限交互。同步 DESIGN、sidecar、资产门禁（AST-01/02/10）。不将生成图的阴影/模糊带入标志。
2. Canvas 2D 沿用双昼夜层，每秒最多 24 帧，时间增量限制防止恢复跳跃；reduce、saveData、hidden、pagehide 取消 RAF；pageshow 恢复。24秒周期、2.4vh近景幅度、远0.10/近0.28墨色强度均独立令牌化；完整合成画面两秒需在侧边可察觉、中央阅读区安静。静态初帧随时可用，海面关闭不加载脚本（CFG-05/07，AST-02/04/16）。不引入 WebGL。
3. Markdown render hook 使用 transform.HighlightCodeBlock、noClasses=false 的覆盖选项，读取 Inner 输出到自主 pre/code，强制关闭行号避免复制混入；未知语言回退纯文本。复制从原始 .Inner 的隐藏 textarea 读取，保留尾换行，以 Clipboard API 为优先，失败提示选取代码，禁用 JS 时隐藏复制按钮。单色语义高亮只用 ink/muted，不加入 accent（TPL-03/13，CNT-18/25/26）。
4. OG 使用打包的 1200×630 PNG 默认品牌海面底图，页面允许 params.waitforit.image 指向 bundle 或 assets 图片；生成绝对 URL、宽高、alt、标题摘要、locale、article/date 与 Twitter large card（AST-01/02/10/16，CNT-03/08/19）。不要求额外字体、Node 或 SVG 栅格化工具参与用户构建。默认图可复用，文章元信息逐页独立。
5. 转场独立 CSS 资源，仅 features.transitions=true 时加载。@view-transition navigation:auto；仅 main 命名独立快照，chrome/surface 保持静止，内容按令牌 220ms 退出/520ms 入场。reduce 下 navigation:none。无链接拦截、无 history/scroll 脚本，浏览器不支持即正常 MPA（AST-02/04/16、TPL-16）。

## Risks / Trade-offs

- 跨文档转场依赖浏览器 → 渐进增强，测试支持和禁用两条路径。
- 默认 OG 不嵌入动态文章标题 → 页面标题/摘要元数据独立，站点可提供每篇图片；避免把 CJK 字体/图片生成工具加入构建依赖。
- Clipboard 被权限或安全上下文拒绝 → 明确失败、选中原文供手动复制，绝不误报成功。
- 用户图片来源未声明许可 → CREDITS 仅如实注明用户提供，主题 MIT 不为原图来源作额外断言。

## Migration Plan

新增 fixture 后按海面→代码与 OG→转场顺序实施。Hugo 0.146/0.168 严格构建，1440/390 昼夜截图、reduce/noJS、复制成功/失败/原文、后台暂停/恢复、前进后退/锚点/开关验证。用户审核前不归档本变更、不推送。

## 用户授权的实站差距优化（2026-10-21）

用户要求按实站对照建议继续减少差距，以下选择取代上文二维细线、共享默认OG与首页列表首屏的安排：

- 仍用原创Canvas 2D，不引入shader/WebGL。透视高度场采样三组不同方向的波，解析坡度产生灰阶明暗；一份标量场映射双昼夜颜色，内部尺寸有上限，保持24fps/暂停/静态首帧。首页在海平线以下渐退纸光，阅读页继续保留中央纸光保护。
- 首页主句在首屏中心，近景海面在首屏下部；近期文章移到可滚动的下一段，不删除内容或接管滚动（TPL-16）。
- 使用Hugo images.Text原生生成逐篇标题OG，默认图为原创纸纹品牌底，站点本地覆盖优先（AST-01/02/10）。字体以build-only TrueType打包，Latin用既有Newsreader派生，中文用OFL Noto Serif SC；不请求字体Permalink/Publish，不增加网页字体负载（AST-15/16）。更新门禁区分web字体预算与build-only许可/白名单；不要求用户安装图片工具或联网。
- 中文/英文长标题必须有明确换行与缩小规则，生成结果不超安全区；保留原始标题在元数据中。新增fixture先验证，再接入模板（CNT-08/19）。
