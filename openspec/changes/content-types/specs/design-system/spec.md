# design-system Spec Delta

## MODIFIED Requirements

### Requirement: 克制的组件形态

主题 MUST NOT 使用填充背景按钮、带圆角或阴影的卡片容器、标签/徽章与强调色；projects 列表 MAY 使用平铺卡片网格，但卡片 MUST 只由细线分隔、留白与文字级链接构成，MUST NOT 有填充背景、圆角或阴影；品牌标志 MUST 使用用户提供主体轮廓，交互装饰图形 MUST 仅使用四角星（含其变体）；链接与按钮 MUST 为文字级形态（下划线、细边框、箭头或字符变化）。

#### Scenario: 禁止的视觉形态

- **WHEN** 审查主题提供的组件样式
- **THEN** 不存在带填充背景的按钮、带圆角或阴影的卡片容器与 accent 颜色变量

#### Scenario: 平铺卡片受限

- **WHEN** 审查 projects 卡片样式与截图
- **THEN** 卡片边界只有细线或留白，无填充底色、无圆角、无投影或悬浮阴影

#### Scenario: 装饰只有四角星

- **WHEN** 审查主题内置 SVG 与图形资产
- **THEN** 只有用户轮廓品牌标志、四角星交互变体与对应 favicon，没有其它插画或图标字体；程序化草地、窄溪与固定天空星点仅属于最底部场景层，不增加 SVG 图标或交互装饰
