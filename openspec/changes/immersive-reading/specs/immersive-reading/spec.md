## ADDED Requirements

### Requirement: 全高阅读与边缘渐进模糊

增强后的正文滚动区 SHALL 占据视窗全高，固定控件 SHALL 不切出页眉页脚带。阅读列两端 SHALL 使用多个不同半径与遮罩范围的backdrop模糊层，SHALL 不截获输入。首末内容 SHALL 保留清晰阅读空间，边缘效果 SHALL 在对应滚动边界归零。

#### Scenario: 长文滚到底

- **WHEN** 用户从正文中部滚动到结尾
- **THEN** 下边缘模糊逐渐退去，最后一段完整可见，不被固定页脚遮住

#### Scenario: 键盘与降级

- **WHEN** 焦点进入边缘或JavaScript不可用
- **THEN** 焦点目标进入清晰区；无JS时无模糊覆盖，普通导航和内容可用

### Requirement: 安歇排版与紧凑标签

默认中英文经文 SHALL 无标点并分句排版，中文 SHALL 使用更宽字距。默认页脚 SHALL 为安歇 / Rest。桌面文字标签 SHALL 使用紧凑24px目标，触屏 SHALL 保留44px目标；固定控件 SHALL 保持44px。

#### Scenario: 双语首页

- **WHEN** 打开中文或英文首页
- **THEN** 显示对应经文与出处，页脚只显示安歇或Rest

### Requirement: 主题标识和低干扰滚动条

角落logo SHALL 使用主题ink。原生光标 SHALL 使用原创牧羊杖几何、亮暗配色与准确hotspot。主滚动条 SHALL 使用透明轨道和弱thumb，保留原生滚动与键盘行为。

#### Scenario: 切换主题

- **WHEN** 用户切换昼夜
- **THEN** logo和光标配色同步变化，正文可继续原生滚动
