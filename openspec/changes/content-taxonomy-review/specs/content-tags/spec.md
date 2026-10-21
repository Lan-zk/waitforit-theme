## ADDED Requirements

### Requirement: 原生标签导航

主题 SHALL 从 front matter 的 tags 集合输出 #标签链接，在内容列表和详情展示，并提供标签总览入口；未设置标签的内容 MUST NOT 输出空标签容器。所有路径 MUST 使用 Hugo 返回的地址，标签链接 MUST NOT 嵌套在条目或仓库链接内。

#### Scenario: 多标签与特殊字符

- **WHEN** 内容带有中文、空格、标点及超长标签
- **THEN** 标签按内容声明顺序显示、可换行，链接到当前语言的实际标签页

### Requirement: 跨类型标签归档

标签总览 SHALL 列出名称和数量。单标签页 SHALL 显示可见标签标题、内容类型、站内详情链接和按日期倒序排列的分页结果；无 JavaScript 时仍可浏览。

#### Scenario: 共享主题

- **WHEN** 博客、随笔、作品、小说和摄影使用同一标签
- **THEN** 标签页汇总这些类型并标明类型，翻页链接保持语言路径

### Requirement: 六类边界样本

exampleSite SHALL 包含六类虚构测试内容、长短标题、多标签与无标签、缺日期、作品缺外链、宽表格、长代码和横竖及小尺寸图像。小说与摄影 SHALL 使用通用模板，不增加专属版式；个人介绍 SHALL 使用普通页模板。缺日期 MUST NOT 显示公元 1 年，宽内容 MUST NOT 撑宽正文。

#### Scenario: 通用模板验收

- **WHEN** 浏览小说、摄影和个人介绍样本
- **THEN** 内容可读且导航可用，图片保持比例，窄屏无页面横向溢出

### Requirement: 双语经文 slogan

默认首页 SHALL 完整显示用户提供的中英文诗篇 23:2，并在其下方单独显示出处；允许自然换行。站点覆盖 hero 时 MUST NOT 附加默认经文出处。

#### Scenario: 默认与覆盖

- **WHEN** 站点未覆盖 hero
- **THEN** 英文和中文首页分别显示对应经文与出处

- **WHEN** 站点设置自定义 hero
- **THEN** 显示站点文案，不显示默认出处
