# theme-shell Specification

## Purpose

定义主题骨架对站点作者与读者可见的页面契约：哪些页面类型存在、内容如何组织、页面在桌面与手机上如何排布、无 JS 与键盘用户如何访问、主题模式怎样保留、双语站点怎样导航。视觉取值（颜色、字体、表面、动效）由 `design-system` 定义，本能力只约定结构与行为。

## Requirements

### Requirement: 页面类型与模板落点

主题 SHALL 用 Hugo ≥ 0.146 的新模板路径为首页、普通页、section 列表、posts 列表、posts 详情与 404 各提供模板，posts 页面 MUST NOT 需要逐篇声明 `layout`。

#### Scenario: 首页渲染
- **WHEN** 站点构建含 `content/_index.md` 的首页
- **THEN** 首页由 `layouts/home.html` 渲染，输出包含首屏标题与导航框架

#### Scenario: posts 详情自动匹配
- **WHEN** 文章位于 `content/posts/` 且 front matter 未写 `layout`
- **THEN** 该页由 `layouts/posts/page.html` 渲染，呈现信件版式

#### Scenario: 普通页与 404
- **WHEN** 站点构建 `content/purpose.md` 与 404 页
- **THEN** 普通页由 `layouts/page.html` 渲染，`/404.html` 存在且内容非空

### Requirement: 信件内容模型

posts 文章的信件字段 MUST 从 front matter 的 `params` 下读取（`params.from`、`params.to`、`params.subject`）；`title`、`description`、`date` 保持顶层保留字段。字段缺失 MUST 降级为不显示对应元信息，而不是渲染空标签或报错。

#### Scenario: 完整信件元信息
- **WHEN** 文章的 `params` 下提供 `from`、`to`、`subject` 与顶层 `date`
- **THEN** 详情页显示发件人、收件人、主题与日期，日期按站点语言格式化

#### Scenario: 缺失信件字段
- **WHEN** 文章只有 `title` 与 `date`
- **THEN** 页面正常构建，不出现空的收件人或主题占位

#### Scenario: archetype 骨架
- **WHEN** 作者执行 `hugo new content posts/<name>.md`
- **THEN** 生成的文件包含 `title`、`description`、`date` 与 `params.from/to/subject` 骨架

### Requirement: 列表排序与空状态

posts 列表 SHALL 按日期倒序列出全部文章；没有文章时 MUST 显示本地化的空状态文案，而不是留白或报错。

#### Scenario: 有文章的列表
- **WHEN** posts section 有 3 篇日期不同的文章
- **THEN** 列表按日期从新到旧展示，每项链接到详情页并显示日期

#### Scenario: 空列表
- **WHEN** 某语言的 posts section 没有任何文章
- **THEN** 列表页显示该语言的空状态文案，构建无警告

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

多语言站点 SHALL 在导航中提供语言切换入口，链接到当前页面的对应翻译；单语言站点 MUST NOT 渲染语言切换；页面 MUST 输出正确的 `lang`、`dir` 与 hreflang alternate，界面文案 MUST 来自 i18n 键而非硬编码。

#### Scenario: 切换语言保持位置
- **WHEN** 多语言站点在文章详情页选择另一种语言
- **THEN** 跳转到该文章的翻译页；没有翻译时跳转到该语言的首页

#### Scenario: 单语言不渲染语言切换
- **WHEN** 站点只配置一种语言
- **THEN** 导航中不出现任何语言切换链接

#### Scenario: 语言声明正确
- **WHEN** 检查中文页面的输出
- **THEN** `<html lang="zh">` 与对应 hreflang alternate 存在，导航与页脚文案为中文
