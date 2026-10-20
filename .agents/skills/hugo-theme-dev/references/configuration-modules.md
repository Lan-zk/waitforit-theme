# 配置、Hugo Modules 与主题分发规则

**用途**：写主题根 `hugo.toml`、`theme.toml`、`go.mod`、`i18n/`，或回答"这个默认值该放哪"时读本文件。基线 Hugo **v0.168.0**（2026-10-20），最低支持 0.146.0。标记含义见 `sources.md` §1。

## 1. 主题配置能写什么（硬边界）

- **CFG-01** 主题根 `hugo.toml` 里**只有 4 个段会被合并**：`params`、`menu`/`menus`、`outputformats`、`mediatypes`。写其他段（`markup`、`security`、`languages`、`outputs`、`cascade`、`build`…）**静默不生效**。原文："only the `params`, `menu`, `outputformats`, and `mediatypes` sections will be added from the theme's config file"。⟦D⟧ SRC-47
- **CFG-02** 主题配置必须放主题根（`themes/<name>/hugo.toml`），不是 `config/_default/`，否则不参与合并。⟦D⟧ SRC-47
- **CFG-03** 合并优先级：项目配置 > 主题/模块配置；多主题时 `theme = ['a','b']` **左边优先**。⟦D⟧ SRC-30, SRC-47
- **CFG-04** 因此主题只能提供**表现层默认值**：默认 `params`、默认菜单、额外输出格式；主题无法替站点设置 build 参数、markup 选项、taxonomy 开关。需要站点配合的项（例如是否启用 RSS）必须在 README 里写成安装契约。⟦D⟧ SRC-47；⟦I⟧ 契约推论

## 2. params

- **CFG-05** 主题自定义参数必须**命名空间化**，官方要求 "namespace any custom parameters specific to their module or theme"；本项目用 `[params.waitforit]`（与 `docs/decisions.md` D13 的 params 命名空间一致）。⟦D⟧ SRC-31
- **CFG-06** 键名只能 camelCase 或 snake_case；kebab-case 无法链式访问（`.Site.Params.kebab-case.x` 解析失败）。⟦D⟧ SRC-31
- **CFG-07** params 的嵌套 map **深合并**、站点同键胜、主题独有键保留——E1 实测：站点设 `params.shared` 覆盖主题值，主题 `params.themeDefault` 保留，`params.nested.a` 取站点、`params.nested.b` 取主题。⟦E⟧ E1（文档页合并小节被截断，属 U6）
- **CFG-08** 模板读取统一 `site.Params.waitforit.<key>`；站点覆盖时**整键覆盖**是最安全的心智模型（深合并虽可用，但不要依赖跨层默认值级联）。⟦E⟧ E1；⟦I⟧ 使用建议

## 3. menus

- **CFG-09** 菜单在主题里用 `[[menus.main]]`（**数组表**）声明；同一文件里 `[menus.main]` 与 `[[menus.main]]` 混用会 `unmarshal failed: toml: key main already exists as a table, but should be an array table`（E1 副产品）。⟦E⟧ E1
- **CFG-10** 菜单条目字段：`identifier`（同名/本地化时必需，首字符须字母）、`name`、`pageRef`（站内逻辑路径）、`url`（**只给外部链接**）、`parent`、`weight`（非零整数，轻者在上）、`pre`/`post`、`params`、`title`。模板用 `.Site.Menus.main`。⟦D⟧ SRC-33
- **CFG-11** **菜单不合并**：站点定义了同名菜单（`menus.main`）时，主题的 `menus.main` 被**整体替换**（E1 实测只剩站点条目）。⟦E⟧ E1
  - 后果：主题不能靠"默认菜单 + 站点补充"的写法；主题默认菜单只在站点**完全没有** `menus.main` 时生效。README 要写清"站点需自行定义 main 菜单，否则用主题默认"。

## 4. 输出格式与媒体类型

- **CFG-12** 三处配置的依赖顺序与位置（都在**站点**配置）：`[mediaTypes.<type>]`（`delimiter` + `suffixes`，**第一个后缀是主后缀，决定模板文件名后缀**）→ `[outputFormats.<fmt>]`（必须指 `mediaType`）→ `[outputs]`（按 page kind 指定，**第一个是主输出格式**）。⟦D⟧ SRC-34, SRC-35, SRC-36
- **CFG-13** 默认 `outputs`：`home=[html rss]`、`page=[html]`、`section=[html rss]`、`taxonomy=[html rss]`、`term=[html rss]`。front matter 的 `outputs` 是**追加**，不替换。⟦D⟧ SRC-34
- **CFG-14** 主题只能在自己的 `hugo.toml` 里加 `outputFormats`/`mediaTypes`，不能改站点 `outputs`（CFG-01）；要新增 JSON 等格式必须文档化让站点配置。⟦D⟧ SRC-47

## 5. Hugo Modules 与版本护栏

- **CFG-15** 最低版本用 `[module.hugoVersion] min = "0.146.0"` 声明（放主题根 `hugo.toml`），这是版本语义的唯一位置；`theme.toml` 没有官方 `min_version` 字段（PaperMod 里出现的属 gallery 惯例，非构建语义）。⟦D⟧ SRC-32, SRC-200；修正 `docs/decisions.md` D4 后果段的 "theme.toml 的 min_version" 说法（见 D18）。
- **CFG-16** **版本不匹配不是硬失败**：E6 实测 `min = 0.999.0` 只产生 `WARN Module "wt-smoke" is not compatible with this Hugo version: Min 0.999.0; run "hugo mod graph" for more information.`，构建 exit 0；只有 `--panicOnWarning` 才让它变成失败。⟦E⟧ E6
  - 本仓库 CI 必须带 `--panicOnWarning`，否则最低版本护栏形同虚设。
- **CFG-17** `module.hugoVersion.extended` 自 v0.153.0 废弃、"The extended version check is disabled in v0.153.2 and later"；**新主题不要再写 extended 要求**，也不需要 extended 版（libsass 已废弃，见 `release-ci.md` REL-03）。⟦D⟧ SRC-32, SRC-91
- **CFG-18** mount 语义：`source` 相对模块根、`target` 相对项目根；组件只能是 `static|archetypes|content|data|i18n|layouts|assets`；**一旦为某组件自定义 mount，该组件的默认 mount 全部失效**（漏写会导致 `assets`/`layouts` 丢失）。⟦D⟧ SRC-32
- **CFG-19** 主题作为 module 分发：仓库根 `go.mod` 的 module path 必须等于引用路径 `github.com/Lan-zk/waitforit-theme`（D17），站点侧 `hugo mod get` + `theme = 'github.com/Lan-zk/waitforit-theme'`，版本靠 git tag。常用命令：`hugo mod init`、`mod get`、`mod tidy`、`mod vendor`（离线构建，生成 `_vendor/`）、`mod clean`、`mod graph`。⟦D⟧ SRC-45, SRC-46, SRC-100
- **CFG-20** `module.replacements` 自 **0.168.0** 起**主题里的写法被忽略**，只有项目配置生效；不要用主题内 replace 打补丁。⟦D⟧ SRC-93（0.168.0-relnotes）

## 6. theme.toml（给 gallery 看的元数据，不参与构建）

字段来自 `hugo new theme` 生成的模板：⟦D⟧ SRC-48, SRC-200

| 字段 | 说明 | 本仓库 |
| --- | --- | --- |
| `name` | 主题显示名 | 待定项（`decisions.md` 待定） |
| `license` | SPDX 名 | `MIT` |
| `licenselink` | 许可证文件 URL | `https://github.com/Lan-zk/waitforit-theme/blob/main/LICENSE` |
| `description` | 一句话简介 | 写视觉定位，不吹功能 |
| `homepage` | 源码主页 | 仓库地址 |
| `demosite` | 演示站 | `exampleSite` 部署地址（未定则留待 P2） |
| `tags` | 分类标签 | `blog`、`minimal` 等 |
| `features` | 功能标签 | `multilingual`、`dark-mode` 等 |
| `min_version` | gallery 惯例字段 | **不写**，版本语义走 `module.hugoVersion.min`（CFG-15） |
| `[author]` | `name`/`homepage` | 待定 |
| `[original]` | 移植来源 | 不适用（原创主题） |

- **CFG-21** `theme.toml` 未知字段被静默忽略（E1 里写了 `bogus_field` 构建正常）——因此拼错字段名不会报错，必须靠 gallery/CI 检查。⟦E⟧ E1
- **CFG-22** 主题运行时默认值**不能**放 `theme.toml`（它不参与构建），只能放主题根 `hugo.toml` 的 4 个允许段。⟦D⟧ SRC-47；⟦E⟧ E1（`theme.toml` 只在 `hugo new theme` 场景被读取）

## 7. i18n 表

- **CFG-23** 主题提供 `i18n/en.toml`（回退必需）与 `i18n/zh.toml`（或 `zh-CN.toml`），文件名按 RFC 5646；主题与站点同名表**深合并、项目优先**。⟦D⟧ SRC-46, SRC-104
- **CFG-24** 查找顺序：当前语言 `locale` → 当前语言 key → `defaultContentLanguage` 的 locale → 其 key → **空字符串**（缺键不报错）。⟦D⟧ SRC-104；E1 实测主题 i18n 生效。⟦E⟧ E1
- **CFG-25** 保留键 `id`/`description`/`hash`/`leftdelim`/`rightdelim`/`zero`/`one`/`two`/`few`/`many`/`other` 不能直接当文案 key，需加下划线前缀（`_one`）。⟦D⟧ SRC-104
- **CFG-26** 复数走 CLDR 类别表；`{{ T "day" 2 }}` 或 `{{ T "day_with_count" (dict "count" 2 "name" "x") }}`。⟦D⟧ SRC-104
- **CFG-27** 多语言相关：`languages.<key>.<setting>` 覆盖根级同名键，未定义则回退根级；可本地化的键包括 `params`、`menus`、`outputs`、`outputFormats`、`mediaTypes`、`markup`、`security`。⟦D⟧ SRC-38

## 8. 安全默认值（决定主题能做什么）

安全默认"拒绝优先"，不匹配即构建失败：⟦D⟧ SRC-39

| 键 | 默认 | 对主题的影响 |
| --- | --- | --- |
| `security.exec.allow` | `^(dart-)?sass$`、`^go$`、`^git$`、`^node$`、`^postcss$` | 主题内调其他二进制会被拒 |
| `security.funcs.getenv` | `^HUGO_`、`^CI$` | 主题内 `os.Getenv "FOO"` 会构建失败 |
| `security.http.urls` | 禁止 IP 主机、`localhost`、含 `@` 的 URL，并校验解析后地址 | 主题**不要**在构建期抓远程资源 |
| `security.http.proxyFromEnvironment` | `false`（v0.166.0 起） | 走代理需站点显式开启 |
| `security.enableInlineShortcodes` | `false` | 内联 shortcode 需站点开启 |
| `security.node.permissions` | `allowRead=["."]`、`allowWrite=[]`（v0.161.0 起） | 用 Node 工具时写盘被禁 |

- **CFG-28** 主题不得依赖任何需要放宽 `security` 的功能（否则站点装主题要改安全配置，属硬伤）。⟦D⟧ SRC-39；⟦I⟧ 设计原则

## 9. 配置文件组织与覆盖

- `--config a.toml,b.toml` 后者覆盖前者；`config/<environment>/` 覆盖 `config/_default/`；`HUGO_*` 环境变量覆盖文件值。⟦D⟧ SRC-30
- `hugo config` / `hugo config mounts` / `hugo config --printZero` 用来核对"合并后到底生效了什么"，排查主题默认值是否被站点覆盖。⟦D⟧ SRC-98
- **CFG-29** `params` 是否深合并这一事实（CFG-07）用 `hugo config` 验证最稳；改主题默认值时先跑一次，确认站点没把它盖掉。⟦E⟧ E1 + ⟦D⟧ SRC-98

## 10. 坑清单

| 症状 | 原因 | 规则 |
| --- | --- | --- |
| 主题设置项不生效 | 写进了非 4 个允许段 | CFG-01 |
| 主题默认参数不生效 | 放在 `theme.toml` | CFG-22 |
| 版本护栏没拦住旧 Hugo | `hugoVersion` 只 WARN | CFG-16 |
| 模板里参数取不到 | kebab-case 或没命名空间化 | CFG-05, CFG-06 |
| 站点菜单盖掉主题全部菜单 | 菜单按名整体替换 | CFG-11 |
| 自定义 mount 后样式丢失 | 默认 mount 被失效 | CFG-18 |
| i18n 部分语言空白 | 文件名用了语言 key 而站点用 locale（或反之） | CFG-23, CFG-24 |
| 构建因 getenv/exec 失败 | 主题碰了安全默认值 | CFG-28 |

## 11. 本仓库要交付的配置文件（P2 落地清单）

- 主题根 `hugo.toml`：`[module.hugoVersion] min='0.146.0'`、`[params.waitforit]` 全部默认值、`[[menus.main]]` 默认菜单、必要时 `[outputFormats]`。
- `theme.toml`：按 §6 填，`min_version` 不写。
- `go.mod`：`module github.com/Lan-zk/waitforit-theme`。
- `i18n/en.toml`、`i18n/zh.toml`。
- `exampleSite/hugo.toml`：作为**站点**配置示范，只放站点该放的段（`markup`、`outputs` 等）。

## 12. 来源

`SRC-30`–`SRC-40`、`SRC-45`–`SRC-49`、`SRC-93`、`SRC-98`、`SRC-100`、`SRC-104`、`SRC-200`；实测 `E1`、`E6`。URL 与未核实项见 `sources.md`。
