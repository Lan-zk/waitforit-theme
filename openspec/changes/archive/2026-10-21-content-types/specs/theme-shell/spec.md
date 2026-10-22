# theme-shell Spec Delta

## MODIFIED Requirements

### Requirement: 列表排序与空状态

blog 与 essays 列表 SHALL 按日期倒序列出文章，projects 列表 SHALL 按日期倒序列出作品；没有内容时 MUST 显示本地化的空状态文案，而不是留白或报错。

#### Scenario: 有文章的列表

- **WHEN** blog section 有 3 篇日期不同的文章
- **THEN** 列表按日期从新到旧展示，每项链接到详情页并显示日期

#### Scenario: 空列表

- **WHEN** 某语言的 blog 或 essays section 没有任何文章
- **THEN** 列表页显示该语言的空状态文案，构建无警告

#### Scenario: projects 排序

- **WHEN** projects section 有多个带 `date` 的作品
- **THEN** 列表按日期从新到旧展示，卡片显示标题与摘要，并可跳转到外部仓库

### Requirement: 双语导航与语言声明

多语言站点 SHALL 在导航中提供语言切换入口，链接到当前页面的对应翻译；单语言站点 MUST NOT 渲染语言切换；默认导航 SHALL 为固定顺序的六类内容入口且六项全部渲染，尚未实现的类型 MUST 链接到站点提供的占位页，站点声明 `menus.main` 时 MUST 整体替换内置清单；页面 MUST 输出正确的 `lang`、`dir` 与 hreflang alternate，界面文案 MUST 来自 i18n 键而非硬编码。

#### Scenario: 切换语言保持位置

- **WHEN** 多语言站点在文章详情页选择另一种语言
- **THEN** 跳转到该文章的翻译页；没有翻译时跳转到该语言的首页

#### Scenario: 单语言不渲染语言切换

- **WHEN** 站点只配置一种语言
- **THEN** 导航中不出现任何语言切换链接

#### Scenario: 语言声明正确

- **WHEN** 检查中文页面的输出
- **THEN** `<html lang="zh">` 与对应 hreflang alternate 存在，导航与页脚文案为中文

#### Scenario: 默认导航顺序

- **WHEN** 站点未声明 `menus.main`
- **THEN** 导航按固定顺序列出 blog、essays、projects、fiction、photography、about 六项

#### Scenario: 未实现类型有占位页

- **WHEN** 构建尚未实现 fiction、photography、about 的站点
- **THEN** 三个入口分别指向存在的占位页，页面显示本地化"建设中"文案，不出现死链

## REMOVED Requirements

### Requirement: 页面类型与模板落点

**Reason**: 页面类型从 posts 文章与信件版式改为 blog、essays、projects 三类内容模型，旧模板落点与场景名不再成立。

**Migration**: 站点把内容移入 `content/blog/`、`content/essays/` 或 `content/projects/`，模板按新路径提供；主题不提供旧路径兼容层。

### Requirement: 信件内容模型

**Reason**: 用户从未要求信件模型；主题定位为六类内容的个人站点主题，文章是普通博客文章，发件人、收件人、主题字段与信件元信息组件不再存在。

**Migration**: 旧内容把文章移入 `content/blog/` 并删除 `params.from`、`params.to`、`params.subject`；主题不提供兼容层，仓库当前没有外部消费者。

## ADDED Requirements

### Requirement: 内容类型与模板落点

主题 SHALL 用新模板路径为首页、普通页、blog/essays/projects 的列表与详情、404 提供模板；三型页面 MUST NOT 需要逐篇声明 `layout`；未匹配的 section MUST 回退到通用列表模板，普通页 MUST 回退到通用页面模板。

#### Scenario: 首页渲染

- **WHEN** 站点构建含 `content/_index.md` 的首页
- **THEN** 首页由 `layouts/home.html` 渲染，输出包含首屏标题与导航框架

#### Scenario: blog 详情自动匹配

- **WHEN** 文章位于 `content/blog/` 且 front matter 未写 `layout`
- **THEN** 该页由 `layouts/blog/page.html` 渲染，呈现标题、日期、摘要与正文

#### Scenario: essays 与 projects 自动匹配

- **WHEN** 内容位于 `content/essays/` 或 `content/projects/`
- **THEN** 分别由各自的 section 与 page 模板渲染，列表与详情均正常输出，构建无 WARN

#### Scenario: 普通页与 404

- **WHEN** 站点构建 `content/colophon.md` 与 404 页
- **THEN** 普通页由 `layouts/page.html` 渲染，`/404.html` 存在且内容非空

#### Scenario: 未知 section 回退

- **WHEN** 站点使用六类之外的 section 且未提供专属模板
- **THEN** 该 section 的列表与详情由通用模板渲染，构建无 WARN

### Requirement: 文章与作品内容模型

blog 与 essays 文章 SHALL 只依赖 Hugo 保留字段（`title`、`description`、`date`、`draft`、`tags`）；projects SHALL 使用 `title`、`description`、`date` 与可选的 `params.repo`、`params.demo`、`params.year`；可选字段缺失时 MUST 降级隐藏对应信息，不渲染空标签；信件字段 MUST NOT 被读取或渲染。

#### Scenario: 完整文章

- **WHEN** blog 文章的 front matter 提供 `title`、`description` 与 `date`
- **THEN** 详情页显示标题、按站点语言格式化的日期、摘要与正文

#### Scenario: 缺失可选字段

- **WHEN** 文章只有 `title` 与正文
- **THEN** 页面正常构建，不出现空日期、空摘要或空标签

#### Scenario: 作品卡片链接

- **WHEN** projects 条目提供 `params.repo`
- **THEN** 卡片链接到该仓库地址；未提供时链接到站内详情页

#### Scenario: 信件字段被忽略

- **WHEN** 旧文章的 front matter 仍带 `params.from`、`params.to`、`params.subject`
- **THEN** 页面构建不报错，但详情页不渲染这三个字段

### Requirement: 列表分页

blog 与 essays 列表 SHALL 分页，页大小取站点 `pagination.pagerSize`（Hugo 默认 10），页码路径为 `page/N`；只有一页时 MUST NOT 显示分页控件；分页链接 MUST 是键盘可达的原生链接并保留当前语言前缀。

#### Scenario: 翻到第二页

- **WHEN** blog 文章数超过页大小
- **THEN** 列表页出现指向第二页的原生链接，第二页列出剩余文章

#### Scenario: 单页列表无分页控件

- **WHEN** 文章数不超过页大小
- **THEN** 列表页不渲染分页控件，也不产生空的页码区域

#### Scenario: 分页保留语言

- **WHEN** 中文站点翻到 blog 第二页
- **THEN** 链接指向中文路径下的 `page/2`，不跳转到默认语言
