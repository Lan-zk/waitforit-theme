## ADDED Requirements

### Requirement: 单屏slogan首页

首页 SHALL 只渲染slogan和出处，不显示Recent或首页正文，MUST NOT 产生第二屏；菜单 SHALL 为内容入口。

#### Scenario: 尝试向下滚动

- **WHEN** 用户在首页向下滚动
- **THEN** 不出现最近内容、文章链接或额外正文

### Requirement: 精简语言与页脚控件

footer标识 SHALL 隐藏。双语站点 SHALL 只输出一个切换到另一语言的原生链接，优先跳对应译文，缺译文回到目标首页。多语 SHALL 用一个原生disclosure入口，单语 SHALL 不显示语言切换。

#### Scenario: 当前文章切换

- **WHEN** 当前页有另一语言译文且用户切换
- **THEN** 到达对应译文，控件不再同时显示两个语言选项

### Requirement: 溪流与草地材质

WebGL2溪流 SHALL 结合宽波、细波和视角反光，过滤远处高频；岸边 SHALL 有平静浅水和固定的草地/湿润带过渡。草根、地形和岸线 MUST NOT 随时间漂移，局部运动与24fps上限、降级与恢复 SHALL 保留。

#### Scenario: 昼夜与减少动效

- **WHEN** 用户切换昼夜或开启reduce
- **THEN** 溪流路径一致，反光适配主题，reduce静帧不持续绘制

#### Scenario: 持续下游流动

- **WHEN** 观察昼夜与窄屏下的连续帧
- **THEN** 宽波、细波和反光沿共同坐标向下游推进，多个水面局部能追踪到形状相关的定向位移，不能仅靠原地闪烁满足运动验收
