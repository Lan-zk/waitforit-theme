# Design

- 全高fixed main原生滚动，header/footer固定叠放；保留首尾padding与无JS文档流（TPL-16、AST-15）。
- 装饰partial输出两端各四个透明层，blur半径1/2/4/8px，mask覆盖范围逐渐缩小；样式使用现有令牌。事件驱动的UI包更新边界强度，末尾为0；不拦截点击，focusin移入清晰区，无JS/不支持时隐藏（AST-02/15、TPL-03）。
- 已有长正文fixture验收初始、滚动中、滚到底；最后一段完整进入清晰区，所有固定控件可用。ResizeObserver处理图片与文字尺寸变化，无连续绘制循环。
- 中英经文去标点、分句；中文0.08em/1.65，footer默认本地化安歇，brand/footer仍支持站点覆盖（CFG-05/23/24）。
- 文字标签桌面24px、coarse pointer44px；更新相关测试语义。删除essays中英fixture正文，不移除主题可选介绍能力（CNT-25）。
- 原创crook保留现有资源路径/显式Publish（AST-02/08）；logo只换token映射，不改几何。

## Acceptance

1440/390昼夜，全高阅读、中段渐进模糊、首末边界退去、末段和键盘目标可见；无JS与UI下载失败可读；紧凑标签不重叠，coarse保持44px；严格构建0WARN、资产门禁5/5。MDN backdrop-filter文档2026-10-21核对，不声称旧浏览器均支持模糊。
