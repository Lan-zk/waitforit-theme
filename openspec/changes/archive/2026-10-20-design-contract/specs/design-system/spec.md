# Spec Delta

## Purpose

为 waitforit-theme 定义全站视觉的唯一机器可读契约：设计令牌、排版角色映射、页面表面构成、动效时序与降级行为。它让视觉改动可判定、可回归，而不是靠观感评审。

## ADDED Requirements

### Requirement: 设计令牌唯一来源

主题 MUST 在单一令牌文件中以 `--wf-*` 自定义属性给出全部视觉原子值（颜色、字阶、间距、断点、圆角、动效时长），且主题模板与样式 MUST NOT 硬编码令牌已定义的值。

#### Scenario: 令牌改动全局生效

- **WHEN** 修改令牌文件中 `--wf-ink` 的值
- **THEN** 所有引用该令牌的页面渲染出新值，且无需同步修改任何模板或样式文件

#### Scenario: 无重复字面值

- **WHEN** 扫描主题模板与 CSS
- **THEN** 不存在与令牌文件中颜色值重复的字面色值（`transparent`、`currentColor`、`0` 除外）

### Requirement: 双字体排版角色

全站 MUST 只使用两个字体族：衬线角色（展示、标题、正文阅读）与等宽角色（导航、UI、元信息、代码）；MUST NOT 引入第三种字体族，且必须通过 `--wf-font-serif`、`--wf-font-mono` 暴露站点级覆盖能力。

#### Scenario: 字体缺失时回退

- **WHEN** 自托管字体文件未加载或加载失败
- **THEN** 正文落到系统 serif、界面落到系统 monospace 回退，页面仍可读且布局不塌陷

#### Scenario: 站点覆盖字体

- **WHEN** 站点在站点级 CSS 中覆盖 `--wf-font-serif` 或 `--wf-font-mono`
- **THEN** 全站对应角色字体随之改变，行高与字阶其它令牌保持不变

### Requirement: 三层页面表面

每个页面 MUST 由「场景层 + 径向纸光覆盖 + 颗粒/纸纹层」叠加构成，层序固定且场景层在最底；MUST NOT 以纯色不透明背景作为整页表面。

#### Scenario: 层级存在且顺序固定

- **WHEN** 页面渲染完成并检查层叠结构
- **THEN** 场景层位于最底层，其上是纸光渐变覆盖，最上是颗粒层，且三者可独立开关

#### Scenario: 无纯色整页

- **WHEN** 对任一页面在 1440 与 390 两档截图
- **THEN** 页面大面积区域同时呈现纸光渐变与颗粒纹理，不出现不带任何覆盖层的纯色背景页

### Requirement: 纸光与主题模式

纸光覆盖 MUST 由令牌控制（纸色、光心位置与强度、颗粒强度），并随 `auto/day/night` 三态模式切换；模式切换 MUST 在 900ms 内完成且与场景层主题过渡同步。

#### Scenario: 三态模式切换

- **WHEN** 用户切换 light 与 night 模式
- **THEN** 纸色、夜色与纸光参数随模式变化，过渡时长取自令牌且不超过 900ms

#### Scenario: 断点下的光心位置

- **WHEN** 视口宽度从 1440 变为 390
- **THEN** 纸光光心按设计规范移动且不产生横向滚动或内容遮挡

### Requirement: 动效时序与降级

所有过渡与入场动画 MUST 使用令牌中的时长（页面纵向过渡 520ms / 220ms、主题交叉淡化 900ms、入场 300ms）；当 `prefers-reduced-motion: reduce` 生效时 MUST 降级为无位移、无缩放的即时状态变化。

#### Scenario: 减少动效偏好

- **WHEN** 用户系统偏好为 reduce motion
- **THEN** 页面不出现位移、缩放或视差动画，所有内容与状态仍完整可达

#### Scenario: 时长来源唯一

- **WHEN** 检视样式中的 transition 与 animation 声明
- **THEN** 全部时长引用令牌变量，不存在与令牌冲突的字面时长

### Requirement: 克制的组件形态

主题 MUST 不使用卡片容器、标签/徽章、填充按钮与强调色；唯一装饰图形 MUST 是四角星（含其变体）；链接与按钮 MUST 为文字级形态（下划线、细边框、箭头或字符变化）。

#### Scenario: 禁止的视觉形态

- **WHEN** 审查主题提供的组件样式
- **THEN** 不存在带填充背景的按钮、带圆角阴影的卡片容器与 accent 颜色变量

#### Scenario: 装饰只有四角星

- **WHEN** 审查主题内置 SVG 与图形资产
- **THEN** 只有四角星及其尺寸变体，没有 logo、插画或图标字体

### Requirement: 设计契约与 sidecar 同步

仓库根 `DESIGN.md` 的 YAML frontmatter MUST 是机器可读设计令牌来源，`.impeccable/design.json` MUST 是其生成的 sidecar（schemaVersion 2，含 OKLCH 色阶、动效与断点表、组件片段与叙事）；`DESIGN.md` 每次改动后 MUST 重新生成 sidecar，漂移 MUST 被检测并阻断合入。

#### Scenario: sidecar 漂移被检测

- **WHEN** 修改 `DESIGN.md` 后未重新生成 sidecar 就提交
- **THEN** 一致性检查报告漂移并以非零退出码阻断

#### Scenario: sidecar 内容完整

- **WHEN** 重新生成 `.impeccable/design.json`
- **THEN** 其结果包含 schemaVersion 2、颜色/排版/阴影/动效/断点扩展段，以及主题自有组件的自包含片段
