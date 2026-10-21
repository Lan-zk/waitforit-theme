# Proposal

## Why

用户验收指出阅读区被页眉页脚硬截断、标签过疏、亮色logo偏黑，并要求无标点经文、安歇页脚、牧羊杖光标和更弱的滚动条。

## What Changes

- 阅读区改为全高滚动，固定控件浮在上方，阅读列两端渐进模糊且首末边界退去。
- 中文经文增加字距，中英经文去标点分句，默认页脚安歇 / Rest。
- 桌面标签紧凑，触屏保持较大目标；去掉随笔fixture介绍。
- logo使用主题ink，光标改原创牧羊杖，滚动条弱化。

## Capabilities

### New Capabilities

- `immersive-reading`: 全高滚动、边缘模糊、边界与输入降级。

### Modified Capabilities

无；补充已实施待审变更，不归档前两轮。

## Impact

影响base模板、阅读边缘partial、样式、UI事件、默认文案/fixture、光标与验收。无新依赖，不复制参考站CSS、shader或资产。
