# theme-shell Specification

## Purpose

定义主题骨架对站点作者与读者可见的页面契约：哪些页面类型存在、内容如何组织、页面在桌面与手机上如何排布、无 JS 与键盘用户如何访问、主题模式怎样保留、双语站点怎样导航。视觉取值（颜色、字体、表面、动效）由 `design-system` 定义，本能力只约定结构与行为。

## Requirements

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

### Requirement: 响应式框架与触控目标

页面 MUST 使用 `design-system` 令牌定义的固定框架与阅读列宽；在 1440×900 与 390×844 视口下 MUST NOT 出现横向滚动，可点击控件的命中区域 MUST ≥ 44px。

#### Scenario: 桌面与手机无横向滚动
- **WHEN** 首页与文章详情在 1440×900 和 390×844 下渲染
- **THEN** `scrollWidth` 不超过视口宽度，框架边距分别为 75px 与 28px

#### Scenario: 触控目标
- **WHEN** 在 390 宽视口测量导航链接、主题切换与语言切换链接的命中区域
- **THEN** 每个控件命中区域的高与宽均 ≥ 44px

### Requirement: 无 JS 可读与装饰层语义

禁用 JavaScript 时正文 MUST 保持可读、链接可用；Canvas 场景、纸光与颗粒层 MUST 标记 `aria-hidden`，且页面 MUST NOT 显示空白画布区域。

#### Scenario: 关闭 JS
- **WHEN** 浏览器禁用 JavaScript 后加载首页与文章详情
- **THEN** 标题、正文、导航链接可见可用，页面背景为纸色而非空白或黑色

#### Scenario: 装饰层对辅助技术隐藏
- **WHEN** 屏幕阅读器遍历页面
- **THEN** 场景、纸光、颗粒层不出现在可访问树中，内容顺序从跳过链接与导航开始

### Requirement: 键盘与焦点基线

页面 MUST 提供跳至正文的跳过链接作为首个可聚焦元素，所有交互控件 MUST 可用键盘操作并有可见焦点环；移动端菜单 MUST 暴露展开状态并在 Escape 时关闭。

#### Scenario: 跳过链接
- **WHEN** 键盘用户在页面顶部按 Tab
- **THEN** 第一个焦点落在跳过链接，激活后焦点移到正文主区域

#### Scenario: 移动菜单状态
- **WHEN** 390 宽视口下菜单按钮被激活
- **THEN** 按钮的 `aria-expanded` 变为 `true`，面板可聚焦，按 Escape 关闭并把焦点还给按钮

### Requirement: 主题模式持久化

主题 SHALL 支持自动、日光、夜色三种模式；默认跟随系统，用户显式选择 MUST 在后续页面加载中保留，非法或缺失的存储值 MUST 回退到自动。

#### Scenario: 选择被记住
- **WHEN** 用户选择夜色并跳转到另一页面
- **THEN** 新页面以夜色渲染，且不出现先亮后暗的闪烁

#### Scenario: 系统偏好回退
- **WHEN** 用户从未显式选择且系统为深色
- **THEN** 页面按夜色渲染；显式选择日光后不再跟随系统

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
