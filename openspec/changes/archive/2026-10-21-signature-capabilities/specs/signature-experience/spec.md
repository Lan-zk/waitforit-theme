## Purpose

为主题提供统一的品牌轮廓、时间驱动海面、可复制代码、分享元数据与原生页面转场，使阅读体验完整，同时在减少动效、无脚本、权限拒绝或浏览器不支持时保持内容和导航可用。

## ADDED Requirements

### Requirement: 用户轮廓品牌

主题 MUST 以用户图片主体轮廓作为基本 logo，透明底单色，保持负形与比例；首页/内页/404/favicon/默认分享图 MUST 使用同一轮廓，并适配昼夜模式。

#### Scenario: 昼夜品牌一致
- **WHEN** 在 1440 与 390 视口切换昼夜
- **THEN** 品牌清晰、比例稳定、无白色矩形背景且不遮挡正文

### Requirement: 时间驱动海面

海面 MUST 呈现远密近疏的透视波面与连续灰阶明暗，MUST NOT 仅由稀疏线条表示；海面 MUST 缓慢连续漂移，在1440/390两档昼夜的正常浏览下两秒内可察觉边缘运动，中央阅读区保持稳定；每秒绘制不超过 24 帧；后台、离页、减少动效或 saveData 时 MUST 停止循环并保留静态画面；features.sea=false MUST 不加载海面脚本。

#### Scenario: 动画与恢复
- **WHEN** 正常页面经过时间后进入后台再恢复
- **THEN** 画面先变化，后台无持续绘制，恢复后平滑继续

#### Scenario: 静态降级
- **WHEN** reduce motion、saveData 或关闭海面
- **THEN** 无持续动画，正文与导航正常可用

### Requirement: 代码阅读与复制

Markdown fenced code MUST 显示透明细线单色代码块与语言标签，长行只在代码内横滚。增强后 MUST 提供本地化、键盘可达的复制操作，复制原始代码，不含行号/标签/按钮且保留换行；失败 MUST 明确提示并支持手动选取；无 JS MUST 仍可读。

#### Scenario: 完整原文复制
- **WHEN** 用户通过键盘或指针复制含缩进、HTML 字符和尾换行的代码
- **THEN** 剪贴板与原始代码完全一致，并宣布复制成功

#### Scenario: 拒绝与降级
- **WHEN** 剪贴板拒绝、未知语言、空代码或禁用 JS
- **THEN** 页面无错误，代码完整；拒绝时提供手动复制提示，无 JS 不出现无效复制控件

### Requirement: 社交分享元数据

每个 HTML 页面 MUST 提供 OG 与 Twitter large-card 的标题、摘要、绝对 URL、图片、alt；默认图片 MUST 为1200×630品牌与当前页面标题构成的逐页图片，中文、英文及长标题 MUST 保持在安全区；构建专用OFL字体 MUST NOT 自动发布给浏览器；页面 MUST 能以 bundle 或 assets 本地图片覆盖；文章 MUST 带类型与发布时间；构建 MUST 离线且无需额外工具。

#### Scenario: 默认与覆盖
- **WHEN** 渲染中文或英文文章以及具有图片覆盖的 fixture
- **THEN** 元数据对应当前页面与语言，图片 URL 可请求、尺寸正确且覆盖优先

### Requirement: 原生页面转场

features.transitions=true MUST 为支持的同源跨文档导航提供正文纵向退出/入场，时长取 220/520ms 令牌；框架与背景 MUST 保持静止。reduce motion MUST 即时导航；关闭、不支持、无 JS MUST 保持原生链接、锚点、历史与滚动恢复。

#### Scenario: 原生导航保持
- **WHEN** 用户导航、前进后退或访问片段
- **THEN** URL、正文、焦点/片段与原生滚动行为正确，转场结束无残留覆盖层

#### Scenario: 减少与关闭
- **WHEN** 启用 reduce 或关闭 transitions
- **THEN** 不出现转场位移，导航完整可用

### Requirement: 首页首屏聚焦

首页 MUST 以居中主句与海面作为首屏焦点，近期文章与附加正文 MUST 在下一可滚动区域完整可达；MUST 保持原生滚动及无JS阅读。

#### Scenario: 首屏与下方内容
- **WHEN** 在1440或390视口访问首页并向下滚动
- **THEN** 首屏聚焦主句，随后可访问全部近期文章与正文，固定框架无叠印或横向溢出
