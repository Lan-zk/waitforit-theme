# P3 审核记录（2026-10-21）

**用户反馈后的复核**：原验收证明海面在绘制，却未保证最终合成画面中运动可察觉。现已调整海面专属周期/幅度/墨色并增加完整画面回归；最新画面与8秒动态预览见 [实站对照与修复](earendil-comparison.md)。下列首轮截图/结果保留为历史；最新海面证据以 sea-after/ 为准。实时对照还确认了二维线场、默认OG与参考的明显形态差距，不能将原功能通过数字理解为视觉保真完成。

活动 OpenSpec 变更：`signature-capabilities`，spec-driven。实现与本地验证完成，保留活动状态等待最终审核。旧 P2 工作区改动全部保留，本轮未提交或推送。

## 交付

- 用户图片主体平面重绘为透明单色 SVG/PNG，接入 header、404、昼夜 favicon、Apple 图标及默认 OG。保留比例、三块深色区域与曲线负形；不是逐像素无损转换。星形保留为交互装饰。处理过程、内置 imagegen 提示及最终路径见 [logo.md](logo.md)。
- 海面保持四层结构，缓慢时间漂移，24fps 上限；reduce/saveData、后台与离页停止 RAF，恢复平滑继续。关闭 sea 不加载画布/脚本。
- 透明细线单色代码块、语言标签、44px 复制按钮、真实原文复制、本地化可见与读屏反馈。未知语言纯文本，长行局部横滚；拒绝时选中代码供手动复制，无 JS/脚本下载失败时按钮隐藏。
- OG/Twitter 逐页标题、摘要、URL、语言、alt、文章类型/发布时间；共享1200×630品牌图、bundle/assets本地图覆盖。默认图不自动绘制逐篇标题，不引入用户构建依赖。
- 纯 CSS 原生跨文档 View Transitions，正文220/520ms退入场，背景与框架静止；reduce关闭，开关默认false，exampleSite开启供审核。无路由、history或scroll脚本。

使用与参数：[能力说明](../../../signature-capabilities.md)。验收入口：`/signature-check/`、`/zh/signature-check/`、`/og-check/`。[验收句](acceptance.md)。设计契约、sidecar、门禁与决策D22已同步。

## 验证结果

| 范围 | 结果 | 证据 |
| --- | --- | --- |
| Hugo 0.146.0 / 0.168.0 标准版严格构建 | 两版通过，EN24/ZH17，无 WARN | build-146.log / build-168.log |
| INFO 弃用审计 | 两版无 deprecat/WARN/error 命中 | info-146.log / info-168.log |
| 基础探针 | 两版 × 1440/390，均9/9 | probe-{146,168}-{1440,390}.json |
| P3 专项 | 两版均36/36 | signature-results.json / signature-results-146.json |
| 全页面布局 | 27条非重定向HTML路由 × 两尺寸 × 昼夜 + 10组320–1100px/100–200%重排，共118组，零失败 | browser-review.json |
| 站内引用 | 28个HTML含重定向，559项本地链接/资源/片段/OG引用，零失败 | links.json |
| 资产门禁 | 令牌/字体/形态/装饰/sidecar五项通过 | assets-gate.log |
| OpenSpec | 活动变更strict通过 | openspec-validation.log |

长链接 fixture 中刻意使用的虚构外部 `https://example.org/letters/averylongunbrokenaddressfromthefictionalharbourpostoffice` 不作为本地内容路径检查；其余本地引用无例外。基础 probe-390.json 为早期通过记录，最终四份带版本名结果为准。

专项包含：1100ms内46次双Canvas清屏（约23复合帧）、画面变化；visibilitychange 的确定性 hidden 状态注入、pagehide/pageshow、实时reduce与saveData暂停；真实指针调用Clipboard并读回137字符原文、键盘Enter复制、拒绝选区；空块/未知语言；1440/390昼夜/中文局部横滚；真实链接触发pagereveal转场，记录520/220ms CSS动画；返回正文scrollTop200→200；片段定位；逐页默认/覆盖OG；无JS及sea/transitions关闭。

全页面复核另验证模拟触控正文滚动285px、触控开菜单、跨断点清除模态、无JS文档流；零脚本错误、零HTTP错误。这里是Chromium/CDP模拟触控，未冒充真机测试。

22张截图包含首页、代码中英文两尺寸昼夜，以及404、正文、菜单、无JS。图片中的品牌主轮廓与代码透明表面已人工检查，代码块长行不会把正文推出屏幕。

## 已修正的问题与验证边界

- 代码hook的`.Inner`去掉一个末尾换行，首轮复制比原文少1字符；现已补回，真实剪贴板与137字符源文本一致。
- 测试首次使用CDP地址导航，按浏览器规则不触发跨文档转场；改用真实页面链接后记录到转场。键盘测试首次缺少Enter的字符事件，补齐协议事件后验证原生按钮行为。测试服务首次拒绝根路径，已修正测试服务；这些不是产品导航缺陷。
- Impeccable detector返回`[]`，但不能解析Hugo的stylesheet模板表达式，明确报告颜色/自定义属性检查不完整；见detector.log。该范围由资产门禁和真实渲染检查补充，空结果不等于全覆盖。
- 未在真实手机、Firefox、WebKit或读屏软件上验证；未测线上Core Web Vitals。省流仅识别浏览器暴露的saveData，不声称识别所有OS省电模式。默认OG为通用品牌图；逐篇标题在元数据中，想要逐篇图需提供本地覆盖。
- 主题仍未声明可安装；P4安装README、发布/版本与跨引擎门禁保留为下一阶段。

## 下一步

用户先审核logo轮廓、海面速度、代码复制反馈和转场节奏；通过后同步主规范并归档本变更。随后P4优先增加跨引擎/真机/辅助技术验收与CI浏览器、链接检查，再写README安装契约与发布清单。
