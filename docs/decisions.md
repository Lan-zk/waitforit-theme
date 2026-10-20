# 决策记录

范围：本仓库的产品目标、工程边界、技术选型与对外契约。写作对象是后续接手的 agent 与人，不是对外宣传材料。

维护规则：一条决策只在这里写一次；改主意时追加新条目并注明 `supersedes`，不改写历史。状态含义：**已确认**＝用户明确拍板；**默认采用**＝已提出且用户未反对，可在对应阶段开始前改；**硬约束**＝许可或安全原因不可选；**待定**＝需要用户提供信息。

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

## 待定项

| 项 | 需要谁定 | 影响 |
| --- | --- | --- |
| 主题最终显示名（沿用 `waitforit` 还是另起） | 用户 | 目录名、`theme` 值、params 命名空间 |
| 版权行（LICENSE 的 copyright 主体） | 用户 | LICENSE 与发布包 |
| 正文字体（已定：Newsreader，见 D9-R） | 无需再定 | 字体子集、视觉基线 |
| 是否投递 themes.gohugo.io | 用户 | 截图规格、`theme.toml` 维护成本 |
