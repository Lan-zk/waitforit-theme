# theme-distribution Spec Delta

## MODIFIED Requirements

### Requirement: 最低 Hugo 版本声明

主题 MUST 在根 `hugo.toml` 的 `[module.hugoVersion]` 声明 `min = "0.168.0"`，只支持当前最新稳定版；MUST NOT 在 `theme.toml` 里声明版本（该字段无官方语义）；MUST NOT 承诺旧版本兼容或维护双版本构建矩阵。

#### Scenario: 低于最低版本

- **WHEN** 用低于 0.168.0 的 Hugo 构建站点
- **THEN** Hugo 输出版本不满足的警告，CI 的 `--panicOnWarning` 使构建失败

#### Scenario: 版本声明位置

- **WHEN** 检查仓库根配置
- **THEN** 版本护栏只存在于 `hugo.toml` 的 `[module.hugoVersion]`，`theme.toml` 不声明版本

### Requirement: 配置默认值与覆盖

主题 SHALL 在 `[params.waitforit]` 下提供站点可覆盖的默认值（品牌名、描述、首屏文案、页脚、`features.scene`、`features.transitions` 与默认主题模式）；站点同名键 MUST 优先，嵌套键 MUST 深合并；站点 `menus.main` MUST 整体替换主题内置导航。

#### Scenario: 站点覆盖默认值

- **WHEN** 站点在 `params.waitforit` 下改品牌名与首屏文案
- **THEN** 页面显示站点值，未被覆盖的键仍取主题默认值

#### Scenario: 关闭签名能力

- **WHEN** 站点设置 `params.waitforit.features.scene = false`
- **THEN** 页面不输出场景 canvas 与场景脚本，正文与导航正常，纸光与颗粒保留

#### Scenario: 菜单整体替换

- **WHEN** 站点定义自己的 `menus.main`
- **THEN** 导航只显示站点菜单项，不混入主题内置的 blog、essays、projects 入口

### Requirement: 文案资源与语言回退

主题 SHALL 提供 `i18n/en.toml` 与 `i18n/zh.toml`，键 MUST 使用 `waitforit.` 前缀，并覆盖博客、随笔、作品三类的导航标签、列表空状态与分页文案，MUST NOT 再包含信件字段文案；站点同名键 MUST 覆盖主题值；缺失键 MUST 回退到英文条目不报错。

#### Scenario: 覆盖文案

- **WHEN** 站点在 `i18n/zh.toml` 覆盖 `waitforit.nav.blog`
- **THEN** 中文菜单中的博客入口显示站点文案

#### Scenario: 缺失键回退

- **WHEN** 主题键只在 `en.toml` 存在且站点语言为中文
- **THEN** 中文页面显示英文回退文案，构建无警告

### Requirement: exampleSite fixture

`exampleSite/` SHALL 提供虚构站点配置与内容，覆盖首页、blog 列表与详情、essays 列表与详情、projects 列表与详情、普通页、404、fiction/photography/about 三个占位页、中英双语、长标题与空列表；内容 MUST 不含信件字段与信件文案，MUST NOT 含真实个人信息、真实文章或非虚构品牌。

#### Scenario: fixture 构建通过

- **WHEN** 在仓库根运行构建命令
- **THEN** 构建退出 0，无 WARN，所有 fixture 页面输出到 `public/`

#### Scenario: 虚构内容

- **WHEN** 检查 fixture 的作者名、邮箱、作品链接与文章正文
- **THEN** 全部为虚构内容（示例域名），不含真实个人数据

### Requirement: CI 构建门禁

CI SHALL 用当前最新稳定版 Hugo（本变更固定 0.168.0）执行资产门禁与完整构建，并另设按周对最新稳定版的构建与弃用审计；构建 MUST 开启 `--panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings`，任何 WARN MUST 视为失败。

#### Scenario: 版本矩阵全绿

- **WHEN** 推送提交触发 CI
- **THEN** 当前固定版本的构建与门禁步骤成功，周检任务对最新稳定版构建成功或无弃用警告

#### Scenario: 带警告的模板变更被拦住

- **WHEN** 模板引用了不存在的资源或缺失 i18n 键而产生 WARN
- **THEN** CI 任务非零退出，PR 检查失败
