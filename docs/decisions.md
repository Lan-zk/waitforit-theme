# 决策记录

范围：本仓库的产品目标、工程边界、技术选型与对外契约。写作对象是后续接手的 agent 与人，不是对外宣传材料。

维护规则：一条决策只在这里写一次；改主意时追加新条目并注明 `supersedes`，不改写历史。状态含义：**已确认**＝用户明确拍板；**默认采用**＝已提出且用户未反对，可在对应阶段开始前改；**硬约束**＝许可或安全原因不可选；**待定**＝需要用户提供信息。

阅读提示（2026-10-21）：本文件是追加式历史，旧条目中的实现性描述可能已被后续决策取代。**场景渲染器以 D32 为准**；D2/D8/D8-R 及 D26–D31 中「Canvas 2D 渲染、不引入 shader、WebGL 移到 v0.2、Canvas 2D 静态缓存」等实现性条款已被 D32 取代，这些条目中的视觉、材质、16 项参数、统一风场、24fps、字体、OG、导航与降级条款仍有效。

依据：上一阶段的 Earendil 拆解与 Hugo 研究在旧仓库 `waitforit-site/reload/`（`_research/earendil/NOTES.md`、`_research/earendil/sources.md`、`_research/earendil-website/`、`_research/hugo/NOTES.md`、`earendil-hugo.html`、`poc/`）。本文件只留结论与理由，不复制证据。

## D1 独立主题仓库，内容隔离

**状态：已确认**（2026-10-20）。

决定：主题单独成一个可分发仓库 `waitforit-theme`，真实上线站点的 `content/`、`static/`、域名与部署配置放在另一个仓库。主题只包含表现层、内容契约、默认配置与 `exampleSite` fixture。

理由：用户要的是“类似 kiyomi 的独立、可分发 theme”，而不是把一套站点样式抽出来复用；隔离后主题可以单独打版本、被别人的站点引用，也不会把私人内容混进发布包。

后果：两个仓库、两条版本线；站点通过 Module 或 submodule 锁主题版本。主题不得携带任何真实内容；`exampleSite` 是唯一的内容样例。

## D2 视觉来源与保真等级：L2

**状态：默认采用**（可改，但需在 P1 开始前定）。

决定：视觉语言派生自 Earendil，目标是 L2：排版、纸面质感、海面氛围、信件式文章、主题切换与转场“像”，但不逐像素复刻，也不照搬其 shader 与运行时 i18n。

理由：L3（高保真）需要 htmx 导航、27 语运行时翻译、约 1300 行手写 GLSL 与配套服务端约定，既超出“可分发主题”的合理职责，也把工期推到不可控。L2 能保留辨识度，同时允许原创实现与降级。

后果：验收用“并排看气质是否一致”而不是像素 diff；不复制 `styles.css`、shader、文案与图片。细节规格见 P1 的 `docs/design/DESIGN.md`。

## D3 消费方式：Hugo Module 为主，git submodule 为备

**状态：默认采用**。

决定：主题仓库提供 `go.mod` 与 semver tag，站点用 `module.imports` + `hugo mod get <path>@vX.Y.Z` 锁定版本；README 同时给 git submodule 路径（不需要 Go）。开发期用 Go `replace` 或 `--themesDir` 指向本地主题目录。

理由：Module 的版本锁定和依赖解析最干净，也是现代 Hugo 主题的主流分发方式；submodule 覆盖不想装 Go 的用户。

后果：每次对外契约（params、front matter、i18n 键）变更都要发 minor/major tag 并写 `CHANGELOG.md`。`go.mod` 的 module path 依赖 GitHub owner，见「待定项」。

## D4 Hugo 版本与模板系统：≥ 0.146，新路径

**状态：默认采用**。

决定：最低支持 Hugo 0.146.0（新模板系统）。模板只用 `layouts/home.html`、`layouts/page.html`、`layouts/list.html`、`layouts/posts/…`、`layouts/_partials/`、`layouts/_shortcodes/`。CI 测最低版本与当前稳定版两个矩阵。

理由：新路径是当前官方规则；0.168 虽仍兼容 `_default` 旧路径，但本仓库没有历史包袱，不写旧路径。

后果：0.146 以下直接不可用，README 与 `theme.toml` 的 `min_version` 都要写明。

## D5 内容模型

**状态：默认采用**。

决定：站点内容按固定契约组织：

- 首页：`content/_index.md`，hero 文案来自 i18n 键，可在 `params.waitforit.hero` 覆盖。
- 静态页：`content/{purpose,values,join}.md`，用普通 `page` 版式；页面清单由站点决定，主题不写死导航之外的页面。
- 文章：固定 section `content/posts/`，front matter 含 `title`、`description`、`date`、`from`、`to`、`subject`；`layouts/posts/page.html` 按 section 自动匹配邮件体版式，文章不用逐篇写 `layout`。
- 列表与 404：`layouts/posts/section.html`（缺失时回退 `layouts/list.html`）、`layouts/404.html`。
- 新建文章的骨架放 `archetypes/posts.md`。

理由：固定 section 名让主题可以自动选版式，减少站点配置；邮件体字段是 Earendil 文章版式的核心，提前定义成契约。

后果：站点若想把文章放进别的 section，需要覆盖模板；README 必须明确 `posts` 是契约的一部分。

## D6 多语言：构建期，en + zh 默认

**状态：默认采用**。

决定：用 Hugo 原生 i18n 与多语言站点，构建期产出各语言 HTML，带 hreflang；主题提供 `i18n/en.toml`、`i18n/zh.toml` 默认键，站点可覆盖或扩展；语言切换器只在站点语言数大于 1 时显示。

理由：Hugo 原生方案对 SEO、首屏、可分发都更稳；Earendil 的运行时 27 语方案依赖大量 JS 与 `/locales/**`，不适合作为主题默认。

后果：不做运行时翻译；新增语言 = 站点加语言配置 + 可选覆盖 i18n 键，不改主题代码。

## D7 导航与转场：原生 MPA + View Transitions 渐进增强

**状态：默认采用**。

决定：v1 不引入 htmx。页面是普通多页导航；有跨文档 View Transitions 的浏览器获得 150–220ms 过渡，其他浏览器直接跳转。主题不接管滚动位置与历史状态。

理由：主题要对所有消费者可预测；htmx 的 `hx-boost`、`hx-history-elt`、脚本事件顺序会把主题和特定前端架构绑定，且无 JS 时必须仍可读。

后果：放弃 Earendil 的部分“整页无刷新”手感；用 CSS/`view-transition-name` 还原氛围，行为更简单。

## D8 海面：v1 用 Canvas 2D

**状态：默认采用**。

决定：第一版用 Canvas 2D 绘制分层正弦/噪声波线，参数化（高度、强度、地平线位置、FPS 上限）；`prefers-reduced-motion` 或省电模式下降级为静态纹理或关闭。WebGL 移植排到 v0.2，不阻塞 v1。

理由：Canvas 2D 代码量小、无 shader fixture、移动端更稳，足以撑起“纸面上海面”的气氛；高保真 GLSL 是独立工程，先验证需求。

后果：视觉上接受“波线”而非“有光照的水体”；shader 端口作为后续可选增强，不能成为 v1 验收门槛。

## D9 字体与排版：只用 OFL

**状态：默认采用**（最终正文字体在 P1 排版 spike 后定）。

决定：正文候选 Newsreader 或 Source Serif 4，等宽 Commit Mono，中文回退 Noto Serif SC / 系统衬线；全部自托管 woff2，按字符子集与需要的字重加载。PlantinNow / Plantin 与 Departure Mono 不使用、不写入 CSS。

理由：Earendil 正文 Plantin 是商业字体（仓库内附 license，但不可再分发），Departure Mono 许可未验证；可分发主题必须换成 OFL。

后果：字形气质会有差异，需要用字号、行高、字距补偿；字体文件进 `assets/fonts/` 并在 `CREDITS.md` 保留 OFL 文本。

## D10 许可与归属

**状态：硬约束**。

决定：代码用 MIT。`CREDITS.md` 写明“设计语言受 Earendil 启发”、参考的仓库与 commit、第三方依赖许可；Earendil 的 Apache-2.0 没有 NOTICE 与版权行，引用结构时同样注明来源。截图只作为 `docs/design/reference/` 内部对照并标注 URL，发布包排除该目录。Earendil 的文案、logo、`styles.css`、shader、字体、文章正文一律不复制。

理由：代码许可宽松不等于品牌与内容可复用；字体尤其不能随主题分发。

后果：`exampleSite` 的文案必须原创；设计对照与实现之间保留清晰的“灵感/复制”边界。

## D11 exampleSite 是 fixture，也是视觉回归基线

**状态：默认采用**。

决定：`exampleSite/` 用虚构人物与短文章覆盖首页、文章列表、文章详情、静态页、404、中英双语与长标题/空列表等边界；截图基线由 `test/` 生成，不手工替换。

理由：主题仓库没有真实站点可测，fixture 是唯一可重复的验收对象；同时避免把真实内容带进来。

后果：新增能力必须扩 fixture；fixture 变更要同步更新截图基线。

## D12 工程化最低要求

**状态：默认采用**。

决定：CI 在 `exampleSite` 上跑 `hugo --panicOnWarning --printPathWarnings`（WARN 失败），矩阵覆盖最低与当前 Hugo；链接检查；关键页 1440/390 截图回归；semver tag、`CHANGELOG.md`；为 themes.gohugo.io 准备 `images/screenshot.png`（以官方提交指南为准）。

理由：可分发主题的失败模式是“在作者机器上好看、在别人机器上报警告”；把 WARN 和截图都变成门禁。

后果：每次改动可能更慢，但主题对外承诺更可靠。CI 文件从 P2 开始建立。

## D13 主题公共契约与默认配置

**状态：默认采用**（命名空间随主题最终名调整）。

决定：参数用命名空间 `params.waitforit.*`（brand、hero、footer、features.sea、features.transitions 等）；i18n 键统一前缀 `waitforit.`；内容契约见 D5。主题自己的 `hugo.toml` 只放 Hugo 允许主题提供的默认值：`params`、`menus`、`outputFormats`、`mediatypes`；站点配置始终优先。

理由：主题不能替站点决定 `baseURL`、语言和内容，但可以给一组可用默认值，降低接入成本。

后果：README 要给完整参数表与覆盖示例；参数改名属于破坏性变更。

## D14 v1 范围与非目标

**状态：默认采用**。

决定：v1 做首页、静态页、文章列表/详情、404、en/zh、主题切换、海面、View Transitions、RSS/OG 基础 meta。不做：搜索、评论、分析、多作者、CMS、运行时 27 语翻译、私有播放器格式、WebGL 海面（v0.2）、htmx 导航。

理由：这些能力要么与主题定位无关，要么依赖服务端，超出“可分发主题”的边界。

后果：需求进入非目标清单时，先评估是否应该由站点仓库实现，而不是塞进主题。

## D15 阶段与估算

**状态：参考估算**（不是承诺）。

决定：P0 决策与仓库骨架 0.5 人日；P1 设计契约与三个 spike 1.5–2；P2 主题骨架 + fixture 2–3；P3 签名能力（海面、切换、转场、代码块、OG）2–4；P4 a11y/响应式/性能/CI/发布 1–2。合计 7–11 人日，不含站点真实内容。

理由：与上一阶段可行性报告的估算一致（MVP 5–8 + 完整化 5–8 的交集区间取中）。

后果：排期以 spike 结果为准；海面或字体 spike 失败时优先降级，不拖垮整体。

## D16 文档结构

**状态：已确认**（2026-10-20，用户要求）。

决定：`AGENTS.md` 常驻入口，写目标、硬边界、指针与工作方式；`docs/decisions.md` 是本文件；`docs/handoff/` 放会话交接；`docs/design/`（P1）放 `DESIGN.md`、`tokens.css`、`reference/` 对照截图。对外契约在 `README.md`。

理由：agent 每轮都读 `AGENTS.md`，细节按需展开；“会话交接”与“决策”分开，避免历史流水污染长期规则。

后果：新决策先落 `decisions.md`，再改 `AGENTS.md` 的指针或边界（如需要）。

## D17 仓库归属与 Git remote

**状态：已确认**（2026-10-20，用户提供仓库地址）。

决定：仓库为 `https://github.com/Lan-zk/waitforit-theme.git`，本地 `origin` 指向该地址；GitHub owner 为 `Lan-zk`，Hugo Module 路径据此确定为 `github.com/Lan-zk/waitforit-theme`（P2 建 `go.mod` 时写入）。推送代码前由用户确认，不自动 push。

理由：Module 路径必须与站点 `module.imports` 和目标仓库一致；晚确定会让 README 安装命令与 `go.mod` 返工。

后果：「待定项」移除 GitHub owner 与 Module 路径；README 安装段（P2）直接使用该 Module 路径；远端已加 `origin`，首次推送前需用户确认。

## D18 Hugo 主题开发规范与溯源机制

**状态：已确认**（2026-10-20，用户要求；前提：规则必须可溯源，避免抽象后的歧义）。

决定：以 `.agents/skills/hugo-theme-dev/` 作为 Hugo 相关实现的唯一规范来源，结构与内容如下：

- `SKILL.md`：入口（何时用、追溯协议、105 条规则索引、16 条最高频必守规则）；`AGENTS.md` 只放一句话指针，不复制规则正文（渐进式披露）。
- `references/templates.md`（TPL-01…21）、`configuration-modules.md`（CFG-01…29）、`assets-pipeline.md`（AST-01…16）、`content-output.md`（CNT-01…27）、`release-ci.md`（REL-01…12）：规则正文，每条带依据标记。
- `references/sources.md`：来源注册表（`SRC-*` = gohugo.io 页面 URL/标题/抓取日期，`E#` = 实测，`U#` = 未核实清单）与追溯、维护协议。
- `evidence/2026-10-20-hugo-v0.168.0-smoke.md` + `evidence/smoke.ps1`：E1–E12 实测纪要，46 条可复跑断言。

依据等级与冲突优先级：实测 `⟦E⟧` > 文档明文 `⟦D⟧` > 推断 `⟦I⟧`；`⟦U⟧` 未核实项不得作为实现依据。核对基线 Hugo v0.168.0，最低支持 0.146.0。

理由：官方文档与实现存在不一致或缺口（旧路径仍生效但报 unused、缺模板只 WARN 导致页面静默消失、`module.hugoVersion` 不匹配不阻断、主题配置只有 4 个段参与合并），仅凭文档实现会在落地期返工；规则若不挂来源编号，后续无法判断是否过期。

后果：

- 写模板、主题配置、资源管线、内容/输出、CI 与发版前先查该库；新建规则必须带 `SRC` 或 `E` 编号，缺来源即视为缺陷。
- 升级 Hugo 先复跑 `evidence/smoke.ps1`；断言失败说明规则过期，须逐条复核并同步更新规则、`sources.md` 与证据文件。
- 与本文档冲突时以决策为准，同时改知识库并在规则行尾记录冲突；知识库不反向覆盖决策。
- 澄清 D4 的后果句：`theme.toml` 的 `min_version` 只是主题画廊元数据，构建期版本护栏在主题根 `hugo.toml` 的 `[module.hugoVersion] min`，且只 WARN 不阻断（CFG-15/CFG-16/REL-03）。
- 编号让位：`design-contract` change 中「参考转译原则与上游 pin 策略」决策顺延为 **D19**（该 change 的 `proposal.md` 与 `tasks.md` 已同步）。

## D19 参考转译原则与上游 pin 策略

**状态：已确认**（2026-10-20，`design-contract` change）。

决定：参考站点（Earendil）的契约与实现按「转译」处理，不照搬：

- 上游 pin 到 commit `31b1b04`，完整证据（commit/取用时间、`DESIGN.md` 23,274B 与 sha256 `ef6ac366…`、`.impeccable/design.json` 43,450B 与 sha256 `d034ff0b…`、许可结论、基线截图）记录在 `docs/design/reference/upstream-pin.md`。
- 转译判定逐条记录在 `docs/design/transfer-matrix.md`：每个颜色/排版角色/组件键/`ds-` 片段都给出「采纳 / 替换 / 排除 + 理由 + `wf-` 映射」。结构可借鉴，字节与像素不可复制；上游 `styles.css`、WebGL/GLSL、文案、logo、图片、字体一律不进仓库。
- 上游契约文件（`DESIGN.md`、`.impeccable/design.json`）在该 commit 中是未跟踪的辅助资产，不随上游版本化；升级时人工 diff 上游 → 决定是否跟进 → 重生成 sidecar → 重截基线，不做自动同步。
- 基线截图只作内部对照：本地静态 serve `_build/` + headless Chrome 采集，存 `docs/design/reference/baseline/`，总大小控制在 2MB 内，发布包排除该目录。

理由：设计语言可以学习，但许可证不允许复制字体与素材；参考契约本身没有版本历史，只能靠 pin + 快照 + 哈希保证可追溯，避免「下次再看已经变了」。

后果：每次上游升级或本仓库契约变更，都要同步 `transfer-matrix.md`、sidecar 与基线截图；这三处与 `tokens.css` 的口径一致性由门禁脚本检查。

## 决策修订（design-contract，2026-10-20）

按维护规则以「追加 + `supersedes`」方式修订既有决策，原始条目正文不改写。

### D7-R 动效时序（supersedes D7）

**状态：已确认**（2026-10-20，`design-contract` change）。

决定：v1 仍是原生 MPA，不引入 htmx；有跨文档 View Transitions 的浏览器获得渐进增强，但时长不再写 150–220ms，而是引用令牌：页面进入 `--wf-motion-page-enter: 520ms`、退出 `--wf-motion-page-exit: 220ms`、主题切换交叉淡化 `--wf-motion-theme: 900ms`、入场 `--wf-motion-entrance: 300ms`、移动菜单开 `240ms` / 关 `180ms`、订阅横线扫过 `720ms`、hover 反馈 `180ms`；统一缓动 `cubic-bezier(0.333333, 0, 0.666667, 1)`（smoothstep 近似）。`prefers-reduced-motion: reduce` 下所有时长归零，并禁用位移、缩放与视差；主题不接管滚动位置与历史状态。

理由：参考站实测时序是 520/220/900/300/240/180/720ms，令牌化后降级与站点覆盖可测；原「150–220ms」是未经验证的估算，且没有把 reduced-motion 写进契约。

后果：P2 实现用 `--wf-motion-*` 变量驱动全部动效；`docs/design/spikes/motion.html` 必须证明改令牌即改时序，不接受硬编码时长。

### D8-R 页面表面：径向纸光覆盖 Canvas 2D 场景（supersedes D8）

**状态：已确认**（2026-10-20，`design-contract` change）。

决定：v1 场景仍用 Canvas 2D 绘制线场，但页面不再直接露出场景，而是固定四层合成：`canvas.scene`（z 0）→ `.veil` 径向纸光（z 1）→ `.grain` 静态平铺颗粒（z 2）→ `.frame` 固定框架（z 3）；`body` 不设背景色。纸光为 `radial-gradient(ellipse 72% 115% at 50% 48%)`，纸色 `.985` 中心 → 96% 处透明，6 档停点；light/night 双通道用 `--wf-veil-rgb` 切换，900ms 交叉淡化；颗粒用原创无缝 PNG（≤16KB，light/dark 各一张）低透明度平铺。`prefers-reduced-motion` 或省电模式冻结为静态首帧。WebGL 移植仍排到 v0.2。

理由：参考站「深度不是 elevation 而是真实层叠」——场景在纸面后面；纯渐变 + 静态小图无 filter/shader 成本，移动端可控，也让无 JS 时正文仍可读。

后果：P2 层序与 z 索引由 `--wf-z-*` 固定；全屏纸光/颗粒的性能假设由 `surface.html` spike 验证；Canvas 2D 代码保持小体积，不引入 shader。

### D9-R 字体角色与子集化（supersedes D9）

**状态：已确认**（2026-10-20，字体 A/B spike 与 `design-contract` change）。

决定：字体最终定为 **Newsreader**（衬线：display / title / reading，latin 子集 + 真斜体）与 **Commit Mono**（等宽：body / ui / form / label / code，400/700），两者均 OFL，随主题自托管 latin 子集 woff2；中文一律系统回退（`Noto Serif SC` / `Noto Sans Mono CJK SC`），不打包 CJK。主题暴露 `--wf-font-serif` / `--wf-font-mono` 供站点用自持字体覆盖（这是唯一允许的字体偏差来源）。Source Serif 4 只作 A/B 对照，不采用、不进入仓库；PlantinNow / Plantin 与 Departure Mono 禁止进入仓库与构建产物。字体文件总量 ≤300KB，发布方式为 `resources.Get` → `fingerprint` → `.RelPermalink` + `<link rel="preload">`（AST-14/AST-02），OFL 文本与字体同目录（AST-15），integrity 时同写 `crossorigin`（AST-04）。

理由：Newsreader 更接近 Plantin 的书卷气质，latin 子集体积约为 Source Serif 4 的 1/2.7；Commit Mono 的 OFL 许可与版权行明确；CJK 打包体积不可接受。

后果：Source Serif 4 从「待定项」移除；字体产物由 `assets/fonts/` 入库并在 `CREDITS.md` 记录版权/许可/来源；站点换字体只能通过 `--wf-font-*`，不许改主题字体文件。

### D16-R 设计契约落点移到仓库根（supersedes D16）

**状态：已确认**（2026-10-20，`design-contract` change）。

决定：设计契约的落点改为：仓库根 `DESIGN.md` 是设计契约的**唯一权威**（8 章 + YAML frontmatter：13 色 / 8 排版角色 / 2 圆角 / 11 间距 / 20 组件键）；`.impeccable/design.json` 是其 machine-readable sidecar（schemaVersion 2，OKLCH 色阶 + 阴影/动效/断点扩展 + 9 个 `wf-` 组件片段），`DESIGN.md` 改动必须重生成 sidecar，漂移由 `scripts/check-assets.mjs` 判失败；`docs/design/tokens.css` 是浏览器实际消费的 `--wf-*` 令牌；`docs/design/transfer-matrix.md`、`docs/design/reference/`、`docs/design/spikes/` 是证据与原型；`docs/handoff/` 放会话交接。原 D16 中「`docs/design/` 放 `DESIGN.md`」的安排废止。

理由：契约文件放在仓库根才能被工具与 CI 默认发现；`docs/` 只留证据、原型与交接，避免「哪个 DESIGN.md 才算数」的歧义。

后果：`AGENTS.md` 的设计文档指针同步改到根 `DESIGN.md` + sidecar；P2 消费 `docs/design/tokens.css` 时移到 `assets/css/tokens.css` 并删除 docs 副本；本文档 D10/D12 中引用设计文档路径的句子按本修订理解。

## 决策修订（theme-skeleton，2026-10-20）

按维护规则以「追加 + `supersedes`」方式修订既有决策，原始条目正文不改写。

### D5-R 信件字段位于 front matter `params` 下（supersedes D5 的字段位置表述）

**状态：已确认**（2026-10-20，`theme-skeleton` change）。

决定：D5 的文章 front matter 契约中，信件字段 `from`/`to`/`subject` 写在 `params` 下（`[params]` 表内），模板一律读 `.Params.from` / `.Params.to` / `.Params.subject`；`title`、`description`、`date` 仍用顶层保留字段。`from`/`to`/`subject` 不是 Hugo 保留字段，写在顶层会被忽略、不进入 `.Params`（CNT-08，官方 front matter 文档明文）。`archetypes/posts.md` 生成 `params.from/to/subject` 骨架。

理由：D5 原文把三个字段写在顶层；Hugo 只把 `params` 下的自定义键暴露给 `.Params`，照原文写会静默丢字段。

后果：已有站点若用顶层写法，迁移动作是把三个键移进 `params`；D5 其余内容（section 名、列表/404 模板、`archetypes/posts.md`）不变。

### D20 P2 主题骨架实施决策

**状态：已确认**（2026-10-20，`theme-skeleton` change）。

决定：

- **静态首帧边界**：`assets/js/scene.js` 只在启动与 `resize` 时调用一次 `draw(phase = 0)`（与 `prefers-reduced-motion` 同一代码路径），不启 `requestAnimationFrame` 循环；时间驱动海面与页面/入场/菜单转场留给 P3，P3 只把调用换成时间驱动，不改标记结构与 CSS 层级（D11 不返工约束）。
- **默认导航由模板提供**：主题根 `hugo.toml` 不声明 `menus`；nav/header partial 在 `.Site.Menus.main` 非空时渲染站点菜单，为空时渲染内置四个入口（posts/purpose/values/join，`relLangURL` + i18n 标签）。站点声明 `menus.main` 即整体替换（CFG-11）；`AGENTS.md` 的旧「默认 `menus`」表述同步改掉。
- **字体 CSS 构建期生成**：4 个 woff2 经 `resources.Get` → `fingerprint` → `.RelPermalink`，`@font-face` 用 `resources.FromString` 生成 `css/fonts.css` 后再指纹并先于主样式链接；首屏 Newsreader regular 与 Commit Mono 400 另发 `preload`（AST-13/AST-14）；OFL 文本与字体同目录发布（AST-15）。
- **`@property --wf-veil-rgb` 注册在 `assets/css/tokens.css`**：`syntax: "<number>+"`、`inherits: true`、`initial-value: 250 249 246`，让纸光通道能在 900ms 主题切换中插值；只是注册既有令牌，不新增取值。
- **令牌迁到 `assets/css/tokens.css`**：P1 的 `docs/design/tokens.css` 已 `git mv` 迁入并删除 docs 副本，grain 的 `url()` 改为产物相对路径 `../images/`（AST-08）；活文档路径同步，历史 handoff 与归档 change 不改。
- **不碰 `outputFormats`/`mediatypes`**：Hugo 默认输出已含 RSS 与 sitemap，主题无权也不需要改站点输出（CFG-13/CFG-14）。
- **LICENSE 版权方**：MIT，`Copyright (c) 2026 Lan-zk`（沿用 D17 的 GitHub owner）。
- **语言字段的版本边界与版本中立写法（修正 D8 / CNT-19 的措辞）**：2026-10-20 用标准版 v0.146.0 与 v0.168.0 实测：
  - 0.146.0：`.Language.LanguageCode` / `.LanguageDirection` / `.LanguageName` 存在；`.Language.Locale` / `.Direction` / `.Label` **不存在**，模板一用即 `can't evaluate field Locale in type *langs.Language`、exit 1。
  - 0.168.0：反转——`.Locale` / `.Direction` / `.Label` 是现行字段；`.LanguageCode` / `.LanguageDirection` / `.LanguageName` 自 0.158 弃用（deprecation WARN，`--panicOnWarning` 下构建失败），`.Site.Languages` 自 0.156 弃用。
  - 两版同时绿（exit 0、零 WARN、Pages 21/16）用的是**版本中立配方**，不按 `hugo.Version` 分支：站点在 `[languages.<lang>.params]` 给 `locale` / `dir` / `label`；`baseof` 用 `site.Language.Params.locale | default site.Language.Lang` 与 `site.Language.Params.dir | default "ltr"`；`head` 用 `site.Home.AllTranslations` 判语言数、`range .AllTranslations` 输出 `hreflang="{{ .Language.Params.locale | default .Language.Lang }}"`；`lang-switch` 迭代 `site.Home.AllTranslations`，默认链到各语言首页（无翻译页不再落 `/`），当前页有对应翻译再覆盖为该页 permalink，显示名取 `params.label`。
  - 被否决的替代方案：模板按 `hugo.Version ge "0.158.0"` 分支切 Locale/LanguageCode。两版实测都 exit 0，但模板行为随 Hugo 版本漂移、两套分支需长期维护，属 maintenance trap；params + AllTranslations 配方无分支。
  - 对 D8 / 任务文本的修正：「`<html lang="{{ site.Language.LanguageCode }}" dir="{{ .Language.Direction }}">`、hreflang 用 `.Language.Locale`」只在 ≥0.158 成立，不能作为最低支持版的实现依据；`exampleSite` 不写 `languageCode`/`languageDirection`/`languageName` 配置键（0.168 同样弃用为 WARN），`<html lang="zh">` 由 `[languages.zh.params] locale = "zh"` 提供。
- **2.3 路径修正**：三个 spike 位于 `docs/design/spikes/`（仓库根下三层），令牌迁到 `assets/css/tokens.css` 后正确相对路径是 `../../../assets/css/tokens.css`；`design.md`/`tasks.md` 原写的 `../../assets/css/tokens.css` 会解析到 `docs/assets/` 并 404，已按实测修正并用 headless Chrome 复验 `--wf-ink` = `#353431`。

理由：静态首帧让 P2 一次成型、P3 只加时间驱动；默认导航由模板提供，避免主题菜单把英文名带进中文站点；构建期字体 CSS 让指纹路径可用且无 Node 构建依赖；语言字段的两套 API 各会挂掉 CI 的一端，版本中立配方是唯一能同时满足 0.146.0 与 0.168.0 且不引入版本分支的方案。

后果：`AGENTS.md`、`README.md`（P4）的契约说明按本条目执行；知识库追加 E13 并修正 CNT-19/CNT-20；P3 只改场景时间驱动与转场，不回改 P2 结构。

### D21 P2 审查后的阅读与交互基线

**状态：默认采用**（2026-10-20，本轮按 `DESIGN.md` 审查与优化）。

决定：固定框架采用视口内三行 grid，顶栏和页脚保留在视口边缘，只有中间正文使用原生滚动；页脚换行时由布局自然分配高度，正文不穿过 chrome。无 JS 时导航、正文、页脚回到文档流。保留浏览器原生导航、锚点与历史行为，不增加 JS 滚动或历史管理（延续 D7；模板仍遵守 TPL-16）。

UI 脚本下载失败时由 head 捕获资源错误并撤销 js 增强标记，复用无 JS 文档流与普通导航，避免留下没有处理器的菜单按钮；此路径由主动阻断 ui.js 的浏览器回归覆盖。

小屏全屏菜单作为具名模态对话框，背景设为 inert，Tab / Shift+Tab 在面板内循环；Escape 关闭并回焦，跨 800px 断点时关闭并解除隔离。关闭中的菜单也保持 inert，避免淡出期间出现不可见的 Tab 停靠点。关闭动作使用本地化文字，遵守 Bare Chrome Rule。

已有 `params.waitforit.defaultTheme` 由服务端输出并供启动脚本读取（CFG-05/CFG-07）：无保存值时用站点默认值，存储不可用时也保留默认值；显式 auto/day/night 优先，非法存储回退 auto。显式 auto 必须保存，才能覆盖站点 day/night 默认值。无 JS 时同样保留站点默认模式。

信件元信息后使用既有 24px section 间距；缺少 `params.subject` 时显示文章标题，元信息仍按 CNT-08 隐藏缺失字段。日期列在同一列表内共享宽度；文章行与独立动作链接至少 44×44，段内链接保持自然排版。禁止合成字重与斜体；日夜颗粒层分别固定读取各自的既有图像和透明度，新增的令牌别名不引入视觉新值（AST-08 的产物路径约定保持）。

理由：首轮实测发现正文与页脚叠印、无 JS 导航占用信件元信息区域、模态菜单焦点逃逸，以及 320px / 200% 文字缩放时页脚溢出；参考站存在类似行为不能成为保留缺陷的依据。修复落实 Fixed Frame Rule、Two Faces Rule 与键盘可访问要求，不修改 `DESIGN.md` 的配色、字体、纸光、间距或动效取值。

后果：当前证据以 `docs/design/evidence/p2-review/` 为准，早期 P2 截图保留为历史记录。P3 的跨页转场必须覆盖正文滚动区域与浏览器返回恢复；当前 Chromium 实测返回后 scrollTop 保持 200 → 200。发布前仍需 Firefox、WebKit、真实触控设备与辅助技术验证。

## D22 P3：用户轮廓品牌与签名体验

日期：2026-10-21。状态：默认采用；实现已完成，活动变更 signature-capabilities 留待最终审核。本条更新 D7 的时长、D8-R 的时间驱动实现与 D20 的 P3 边界，历史条目保留。

决定：用户提供图片主体作为品牌标志，以三块区域和负形平面重绘 SVG/currentColor；首页/内页/404/favicon/OG 共用。四角星限交互装饰。根 DESIGN.md 与 sidecar 同步，SVG 门禁显式增加唯一品牌资产；来源与处理见 CREDITS 和 P3 logo.md。标志不是逐像素无损转换，不为原图未知来源作额外许可断言。

海面保留 P2 双 Canvas 与四层表面；时间驱动最多24fps，reduce/saveData/hidden/pagehide 取消 RAF，pageshow 恢复，时间步长封顶避免跳跃。无法通用检测 OS 省电模式，故明确支持 reduce 与浏览器 saveData，不声称电池 API 检测。关闭 sea 不输出 Canvas/脚本（CFG-05/07、AST-02/04/16）。

代码 hook 走 layouts/_markup，HighlightCodeBlock Inner + class 高亮覆盖，关闭行号/行高亮，未知语言转义原文。复制另存 hook 原文并补回 Goldmark 去掉的一个尾换行；按钮仅脚本就绪后显示，成功或拒绝都有可见/可宣布反馈，拒绝选中代码。透明细线、单色语义、44px 命中区、代码内横滚（TPL-03/13/22、CNT-18/25/26）。

OG/Twitter 输出逐页标题/摘要/绝对URL/语言与文章发布时间；打包1200×630默认品牌图，允许 params.waitforit.image/imageAlt 覆盖，bundle 优先于 assets，支持 PNG/JPEG/WebP，缺失回落默认。默认图不绘制逐篇标题；不增加 CJK 字体或构建工具依赖（AST-01/02/10/16、CNT-03/08/19）。

转场为纯 CSS 原生跨文档增强，仅 features.transitions=true 时加载；默认false，exampleSite开启。正文220ms退出/520ms入场取 DESIGN令牌，框架/背景静止。reduce关闭，浏览器不支持即普通MPA；无导航拦截、history或scroll脚本（AST-02/04/16、TPL-16）。

后果：P3验收与说明分别见 docs/design/evidence/p3-signature/ 和 docs/signature-capabilities.md；P4仍需真实设备/跨引擎/辅助技术与发布流程。未提交、推送或归档本活动变更。

## D23 海面可见性与实站对照复核

日期：2026-10-21。状态：默认采用，补充D22。

用户反馈动态海面难以察觉，实际复现确认脚本正常、无reduce/saveData/hidden降级；问题在于原有1.2vh幅度、约39秒周期与hairline透明度叠乘使最终合成画面变化太弱。原有Canvas hash变化断言只证明绘制，不能证明可见。

决定：海面独立令牌为24秒周期、2.4vh近景幅度、ink远0.10/近0.28强度，保留24fps上限与中央veil。周期reduce归零，偏好恢复时重新读取；不改变纸光、正文、分隔线。新增完整合成画面两秒边缘变化与中央稳定的回归，失败和通过画面都保留。1.2%是fixture的工程下限，非人眼通用阈值。

实际对照Earendil实时首页/列表/文章/OG：参考为有透视和明暗体积的波面，主题仍是二维线场，形态差距未消除；参考逐篇OG含文章标题，主题默认仍是共享品牌图。功能通过不等于视觉保真。对照截图只放docs/design/reference/live-2026-10-21/，不进入主题资产。具体差距与下一优先级见docs/design/evidence/p3-signature/earendil-comparison.md。

## D24 按实站差距升级波面、首页与逐篇OG

日期：2026-10-21。状态：用户已授权继续优化，取代D22/D23的稀疏线场、共享默认OG与首屏列表安排。

海面保持原创Canvas 2D与四层结构，使用三组方向波的透视高度场与解析坡度着色；远处密集、近处宽阔。计算一份标量场着色双昼夜，内部宽度≤640像素，24fps上限，后台/离页/reduce/saveData暂停及静态首帧不变。未复制Earendil的shader或运行时。海平线改为60vh；首页纸光从48vh到68vh渐退，露出下方波面；正文页保留径向纸光保护。

首页主句居中，近期文章与附加正文保留在首屏后的原生滚动区域；无JS恢复文档流。动效与阅读内容都不承担导航逻辑（TPL-16）。

OG改为Hugo images.Text原生逐页标题图，本地图覆盖优先。中英标题按字形/单词预算折行，中文闭合标点随前行；极长无空格标题缩小至32px、最多8行并省略，完整标题保留元数据。品牌名展示最长36字符，元数据仍完整。1200×630原创纸纹品牌底不采用参考像素（AST-01/02/10/17，CNT-08/19）。

英文字体取既有Newsreader的400/opsz72静态TrueType；中文用OFL Noto Serif SC400（保留原始30928 Unicode映射）。新增TTF只在Hugo图像构建时读取，不调用Permalink/Publish。代价为仓库增加约14MiB字体输入，浏览器仍只下载原有289.7KiB WOFF2，不需Node/Chrome/字体转换或网络构建。门禁显式区分web字体与两个build-only白名单；许可/来源与可复跑转换脚本见CREDITS及scripts/prepare-og-fonts.py（AST-15/16/17）。

0.146的strings.Truncate返回template.HTML，传给images.Text前显式printf成string，避免版本差异；两版均不用0.147才引入的aligny。首轮0.146错误已修复并纳入双版验收。

验收以docs/design/evidence/p3-fidelity/为准，旧p3-signature/的线场和共享OG记录是历史。参考仍是独立品牌和不同渲染技术，当前并不声称逐像素匹配或已完成真实手机/跨引擎性能验证。

## D25 P3 规范同步与归档

日期：2026-10-21。状态：按用户“归档，然后提交并推送”的明确指示执行。

signature-capabilities 的13项任务已完成。先同步 asset-licensing 的字体/原创资产边界与 design-system 的品牌形态要求，再创建 signature-experience 主规范；保留原有 Purpose 与未修改要求。变更归档至 openspec/changes/archive/2026-10-21-signature-capabilities/。P2 theme-skeleton 的归档和本轮实现、验证证据一并纳入版本控制。此前“待审核/未归档”描述记录的是当时状态，由本条更新；P4发布范围不因此提前完成。

## D26 Resting Lamb：安歇草地与窄溪

日期：2026-10-21。状态：用户要求按已交付说明实际实现并预览。supersedes D2 的海面保真目标、D8/D8-R 的海面路线与未来 WebGL 海面计划、D22–D24 的海面视觉/配置/两秒变化指标；这些条目的 OG、品牌、复制与导航决定继续有效。

场景改为原创纸墨单色低伏草地与偏右窄溪；地形、岸线和草根固定，局部草梢缓摆、水道内弱纹理漂移，表达标志的安歇、信靠与谦卑。保留字体、框架、四层表面与纸光；不引入彩色、具象羊、远程资产或渲染依赖（AST-16）。DESIGN 为视觉权威，sidecar/浏览器令牌同步。

唯一开关改为 params.waitforit.features.scene，删除 sea 旧键，无别名（CFG-05/07/08、TPL-03）。草摆14s/2.5px，水纹2 CSS px/s；地面基准60vh、首页veil48–68vh保持。内部采样宽度≤640，静态缓存复用昼夜几何，24逻辑帧/秒上限。reduce/saveData确定性首帧后停止RAF；hidden/pagehide暂停，恢复平滑继续。无JS/Canvas失败/关闭路径保留可读纸面，不承诺无JS景观。

验收以六至八秒局部变化、阅读区稳定和静态对照为准，替换旧两秒1.2%海面指标；绘制计数按逻辑帧，不按单个Canvas路径。新证据在 docs/design/evidence/resting-lamb-scene/，旧P3证据作为历史保留。Hugo最低版/基线双构建及弃用审计沿用REL-07/08；真实设备和跨引擎仍需P4。

## D27 溪流复用原波面并扩大占比

日期：2026-10-21。状态：实施期用户明确提出“溪流可以复用原先海面的效果”“溪流占比再多一些”。supersedes D26 中的窄溪比例与2 CSS px/s短线流纹实现。

前景溪流扩至约20vw，原来的三组方向波、射线高度修正与解析坡度明暗改为更细尺度，仅在固定溪岸内计算并裁切合成。草地与岸线保持固定；波纹使用18s相位周期与0.45vh虚拟高度，非溪岸/整块地面位移。单份标量场着昼夜色，包围盒限定计算量；移除短线水纹与无用stream-speed令牌，新增stream-width/amplitude与motion-stream-cycle。

场景可见性改为测量实际水道内部的变化比例，不再沿用窄线水纹区域占比上限；草地与阅读保护约束不变。静态降级、24fps上限、原生Canvas与无额外构建依赖保持（AST-16、REL-07）。

## D28 同一风场与浅水柔岸

日期：2026-10-21。状态：用户要求草地呈现风吹起伏、岸边自然融合，并以风作为草水共同推动力。supersedes D26/D27 的独立草/水时钟、1/5草簇活动与清晰水道切线。

统一12s基础相位的空间风场，在场景中沿同一方向传播；中近景草簇扎根不动，随局部风力弯曲、轻微压低和回弹；同一位置的风力调制水波采样偏移与解析坡度强度。水面继续复用原方向波场，但不再使用独立stream-cycle。标称草摆7px、远景保持弱或静止，水波不是与草同幅度的机械摆动。

岸边用标称18px、随深度变化的固定浅水渐变替代3px清晰切边；草根密度按水陆混合权重渐退，疏密成簇的贴岸草弯入水面，打断连续边线。波场与土底共用同一固定覆盖函数，不对整个画面做模糊。溪流前景20vw与0.45vh虚拟细波高度保持。

删除motion-grass-cycle/motion-stream-cycle，新增motion-wind-cycle和shore-softness，DESIGN/sidecar/tokens同步。24fps上限、640内部宽度、reduce/saveData静态首帧与后台暂停保持；新录像验证空间联动及岸边过渡（AST-16、REL-07）。

## D29 · 本地场景调参工具（2026-10-21）

用户要求自行微调后回传参数。增加独立的 `docs/design/spikes/scene-tuner.html`，由 `scripts/preview-scene.mjs` 在本机同源提供 `/tune/`，iframe 加载真实 Hugo 产物。滑块修改草水共用的 CSS 令牌，`wf:scene-update` 每帧合并输入并重建固定几何/昼夜缓存；主题页面不输出控制面板，不引入运行时依赖。溪流位置/偏移/弯曲、草密度/草高、共同风力/风向参数默认值保持 D28 画面。工具支持昼夜、两档实际 iframe 视口、暂停观察、仅看景物、浏览器本地保存及校验后的 JSON 复制/下载/导入；系统 reduce/saveData 优先于工具动效控制。JSON 可供用户回传，再修改默认令牌（AST-16、REL-07）。

## D30 用户回传默认值与交叉叠波（2026-10-21）

用户通过调参页回传16项CSS参数，按原值采纳；完整JSON在 `docs/design/evidence/resting-lamb-scene/crossing-waves/parameters.json`。前景26.5vw、远端66.5%、近端偏移13.5%、弯曲9.5%/5.3、岸边25px、波幅0.4vh、草密度1.45/草高1.3/草摆12px、风力1/向右/12s、地平线55vh、远近浓度0.13/0.3；supersedes D27/D28/D29 中相应默认值。JSON的day/desktop仅表示用户预览状态，不改变主题默认auto或响应式行为。

用户指出水纹过于规律。当前三组波的受光投影使第一组近乎抵消、第二组主导，改为平衡三组高度权重0.42/0.34/0.24、错开相位0/0.9/2.3，纹理频率从原海面3.6倍降至1.8倍；用斜光与2.2倍坡度明暗对比同时显出三组坡度，形成交叉起伏。保持原方向波与射线高度修正、共同风场、固定岸线与浅岸覆盖，不引入随机逐帧噪声或外部渲染依赖。参数同步DESIGN/sidecar/tokens及调参页重置值，保存同一组参数的调整前后对照；构建/静态偏好和两档昼夜验证沿用AST-16、REL-07/08。

## 待定项

| 项 | 需要谁定 | 影响 |
| --- | --- | --- |
| 主题最终显示名（沿用 `waitforit` 还是另起） | 用户 | 目录名、`theme` 值、params 命名空间 |
| 版权行（LICENSE 的 copyright 主体） | 用户 | LICENSE 与发布包 |
| 正文字体（已定：Newsreader，见 D9-R） | 无需再定 | 字体子集、视觉基线 |
| 是否投递 themes.gohugo.io | 用户 | 截图规格、`theme.toml` 维护成本 |

### D31 · 溪流材质、清晰草叶与固定星点（2026-10-21）

用户要求根据 Earendil 实站提高水面、草地的真实感并增加天空星点。保留 D30 的16项参数和统一风场。水面采用原创多尺度方向波的坡度反射与局部高光，草叶用独立的尖端曲面；将草叶/星点画布与水面采样分辨率分离，避免低分辨率放大草簇。天空是确定性固定点，夜间更明显，不闪烁、不移动；它们不是交互星形SVG。首页纸光在顶部露出星点，文字附近仍受保护。沿用 Canvas 2D、24fps上限和静态降级，具体性能以本轮实测记录为准。参考截图仅存 `docs/design/reference/2026-10-21-landscape/`。

## D32 · WebGL2 场景渲染器（2026-10-21）

日期：2026-10-21。状态：用户要求在保持效果、样式、动效不变的前提下把场景从 Canvas 2D 迁移到 WebGL2；实现与证据见 `openspec/changes/archive/2026-10-21-webgl-scene/` 与 `docs/design/evidence/webgl-scene/`。supersedes D2/D8-R 中“Canvas 2D、不引入 shader、WebGL 移到 v0.2”的条款，D26–D31 中“Canvas 2D 渲染器与静态缓存实现”的描述，以及 `docs/design/resting-lamb-scene-brief.md` 的“不使用 WebGL”限制；视觉参数、材质语义、24fps、统一风场、昼夜/尺寸、降级与暂停条款继续有效。

决定：`assets/js/scene.js` 改为单文件、零依赖的 WebGL2 渲染器；day/night 各一个上下文，保留双画布与 CSS 900ms 交叉淡化。静态地形、固定星点与远端草叶在尺寸/令牌/主题变化时以 4x MSAA 烘焙为纹理，解析后释放 MSAA 缓冲；水面在 289×254 FBO 用片元着色器复刻原公式，按线性过滤 + 预乘 alpha 放大；中近景草叶实例化，风在顶点着色器求值，先画入 2× 离屏层再线性降采样。抗锯齿选型来自 P1 spike：MSAA 4x 草层约损失 3% 墨量，不采用；2× 超采样层墨量与 Canvas 2D 基线差 0.19%，采用。默认帧缓冲关闭 MSAA。GLSL 内联在 `scene.js`，不新增 shader 文件、不引入渲染库或远程资源（AST-16）；shader 为原创，asset-licensing 继续禁止复制上游 GLSL。内部栅格仍为 CSS 像素且上限 1440，不引入 DPR；24 逻辑帧上限、时间步长封顶、hidden/pagehide/pageshow、reduce/saveData 确定性静帧、`wf:scene-update`、`features.scene` 与无 JS 行为保持不变。WebGL2 不可用、初始化失败或上下文丢失时静默退回纸面 + 纸光 + 颗粒，不启动 RAF、不产生 console error；`webglcontextrestored` 重建资源后继续。

测试与契约：Canvas 2D 内部探针（path/clip/toDataURL）替换为只读 `?wf-scene-probe=1` 探针（phase/frames/staticBuilds/tips/staticImage）、默认帧缓冲 clear 计帧与截图对比。T2 视觉等价基线：确定性静态首帧 1440/390 × 昼夜与迁移前差异 mean 0.23–0.37/255、p99 5–6、>2 比例 3.1–5.4%，静态底色层 near-identical（mean ≤0.007、p99 0）；4× 草/水/星点对照与 9 秒昼夜录像见证据目录。`scene-visibility` 四组 + 上下文丢失恢复通过，`signature` 38/38，调参 15/15，资产门禁 5/5；Windows 工作区的 CRLF 与异步下载测试可移植性修正不属于渲染行为变更。性能：同机 headless 软件后端下主线程每逻辑帧提交中位 0.2ms（迁移前 Canvas 2D 中位 39.6ms），逻辑帧 18.6fps（迁移前 11.2fps）；headless/软件渲染不代表真机，真实设备与跨引擎验收仍属 P4。本机网络受限，Hugo 0.146.0 未能在本机复核（0.168.0 严格构建与弃用审计通过）；模板与配置未改动，风险留待 CI 或用户环境复核。
