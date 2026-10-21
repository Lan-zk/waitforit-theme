# Earendil 实站对照（2026-10-21）

来源：https://earendil.com/ ，列表 https://earendil.com/posts/ ，文章 https://earendil.com/posts/pi-durable-on-cloudflare/ ，OG https://earendil.com/static/og/posts/pi-durable-on-cloudflare.png 。抓取UTC时间见live.json等记录。截图仅供内部设计对照，不属于主题资产，不进入发布产物。

1440×900与390×900使用相同Chromium/CDP、DPR1、无减少动效、light系统偏好。站点按环境自动选择中文UI，文章正文仍是源站英文。首次使用禁GPU浏览器时canvas未初始化，出现灰色回退；该画面不作为对照依据。最终开启软件WebGL（SwiftShader），确认canvas为shader-ready且渲染尺寸已初始化；因此可比较渲染形态，不比较源站GPU性能或帧率。

home-*-0/1.png：两秒间隔首页，包含真实波面变化。posts-1440-*.png：列表。article-*-0.png：文章首屏，article-*-1.png：首个代码块附近。og-1200-*.png：浏览器直接打开该文章分享图的截图。对应JSON保留DOM与代码样式/元数据事实。

分析及本主题修复前后画面见 ../../evidence/p3-signature/earendil-comparison.md 。本记录不覆盖实时站点将来的变化，也不替代2026-10-20固定仓库快照。
