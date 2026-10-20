# Handoff — waitforit-theme 启动（2026-10-20）

下一会话目标：收尾 P0，进入 P1，产出可执行的设计契约与三个 spike，为 P2 的主题骨架定下不可再变的约束。

## 当前状态

- 仓库：`E:\File\self\github\waitforit-theme`，已 `git init`（main），尚无提交。
- 已有：`AGENTS.md`、`docs/decisions.md`、本文件。
- 还没有：主题代码、`exampleSite/`、`go.mod`、`README.md`、`theme.toml`。不要提前写模板绕过 P1 的设计契约。
- 本仓库没有从旧仓库复制任何研究文件或截图；证据仍留在旧仓库，按下面路径查阅。

## 决策

长期决策见 `docs/decisions.md`（D1–D16），不在这里重复。接手时先读它，尤其 D2（保真 L2）、D5（内容模型）、D9（字体）、D10（许可）、D13（公共契约）。

本会话产生的、只对下一阶段有意义的上下文：

- 用户明确要“独立、可分发的 theme 仓库”，真实站点内容隔离；不是把现有站点样式抽出来。
- 主题名暂用 `waitforit`；Module 路径、显示名、版权行、正文字体仍未定，列在 `docs/decisions.md` 的「待定项」。
- 用户已同意按 P0 → P1 顺序推进；P1 的设计结论要能被后续模板直接引用，而不是观感描述。
- 用户偏好：中文沟通；先分析、再动手；产物放在本仓库 `docs/` 体系内。

## 下一步（按序）

### P0 收尾

1. 向用户确认「待定项」：GitHub owner / Module 路径、主题最终显示名、LICENSE 版权行、正文字体偏好。
2. 确认后更新 `docs/decisions.md`，清空已定项；建 `go.mod`（module path 用确认值）与 `LICENSE`（MIT + 版权行）。
3. 完成标志：`docs/decisions.md` 的「待定项」只剩“是否投递 themes.gohugo.io”，且 `go.mod`、`LICENSE` 存在。

### P1 设计契约与 spike

1. 建 `docs/design/`；写 `DESIGN.md`：
   - 版式与字体阶梯、颜色与纸面质感、间距/框架、动效参数（时长、曲线）、z-index 分层；
   - 内容语气与排版规则（信件体元信息、正文行宽、脚注/代码）；
   - 降级矩阵：无 JS、`prefers-reduced-motion`、窄屏、慢设备各自看到什么；
   - 对照截图清单与差异说明（只引用，不复制素材）。
2. 写 `docs/design/tokens.css`：CSS 自定义属性的唯一来源，`DESIGN.md` 引用它，不重复数值。
3. 做三个 spike，每个都留 1440 与 390 截图、一段结论，写回 `DESIGN.md`：
   - 排版 spike：同一 fixture 对比 Newsreader 与 Source Serif 4，含中文回退与行高；
   - 海面 spike：Canvas 2D 分层波线原型，含强度/地平线参数与 reduced-motion 静态回退；
   - 转场 spike：跨文档 View Transitions 的最小示例，确认无支持时直接跳转。
4. 完成标志：`DESIGN.md`、`tokens.css` 存在；三个 spike 都有截图 + 结论；正文字体在 `decisions.md` D9 落定；不出现真实内容。

### P2 只做预告，不开始

主题骨架 + `exampleSite` fixture + 构建通过 `--panicOnWarning` 后才算进入 P2；细节见 `decisions.md` D5/D11。

## 环境与命令

- Windows + pwsh；本机未安装 Hugo。下载 Hugo extended v0.168.0（GitHub 直连常超时，用 `https://ghfast.top/https://github.com/gohugoio/hugo/releases/...` 镜像），校验值见旧仓库 `reload/_research/hugo/sources.md`；二进制不要提交进本仓库。
- 构建验证（P2 起）：仓库根目录 `hugo --source exampleSite --themesDir ../.. --panicOnWarning --printPathWarnings`。
- 截图：Node 24 + 系统 Chrome（`C:\Program Files\Google\Chrome\Application\chrome.exe`）；旧仓库的 Playwright 版本与缓存浏览器可能不匹配，优先用 `executablePath` 指向系统 Chrome，不为本仓库重新下载浏览器。
- 旧仓库有可借鉴的截图/检查脚本，但不要复制到本仓库；在 `test/` 重写精简版。

## 容易踩的坑

- 主题不会合并 `content/`；`exampleSite` 不是“主题自带内容”的分发方式，README 必须写 starter 复制步骤。
- 主题自己的 `hugo.toml` 只能提供 `params`、`menus`、`outputFormats`、`mediatypes`；`baseURL`、语言、部署配置归站点。
- Hugo 0.168 仍兼容 `_default/` 与 `partials/` 旧路径，但本仓库按新模板系统写；不要拿旧教程的查找顺序当依据。
- PlantinNow/Plantin 与 Departure Mono 不可分发；OFL 字体也要保留许可文本。
- Earendil 的 Apache-2.0 没有 NOTICE 与版权行；引用结构要注明来源，但文案、logo、`styles.css`、shader、文章正文不复制。
- 截图只能作为内部分析对照，发布包排除 `docs/design/reference/`。

## 证据位置（旧仓库 `E:\File\self\github\waitforit-site`）

- `reload/_research/earendil/NOTES.md`：Earendil 架构、构建流水线、设计 token、许可、工时估算。
- `reload/_research/earendil/sources.md`：来源与抓取记录。
- `reload/_research/earendil-website/`：稀疏 clone，build.py、模板、CSS/JS。
- `reload/_research/hugo/NOTES.md`：Hugo 架构、模板系统与实测记录。
- `reload/earendil-hugo.html`：可行性报告，L2/路线/风险判断的依据。
- `reload/poc/`：Hugo PoC 骨架，可参考结构，不复制内容。
- `reload/hugo-guide.html`、`reload/hugo-eli5.html`：Hugo 使用与心智模型。

## Suggested skills

- `impeccable`：P1 写设计契约、tokens、spike 与后续 `critique`/`audit`；在本仓库内运行，避免旧项目上下文干扰。
- `writing-for-agents`：改 `AGENTS.md`、`docs/` 指针、决策记录时使用，防止文档变成流水账。
- `agent-browser`：1440/390 截图、交互与降级验证；`browser-use` 可作为备用。
- `code-review`：v0.1.0 发布前审模板、CSS 与文档契约的一致性。
- `handoff`：下次会话结束前生成本目录下的新交接文档。
