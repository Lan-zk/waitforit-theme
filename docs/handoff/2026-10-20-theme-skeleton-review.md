# Handoff — P2 归档与审查（2026-10-20）

下一步为 P3 签名能力。当前 P2 已归档并完成基于根 DESIGN.md 的审查与修复；完整结果、截图、边界与后续顺序见 `docs/design/evidence/p2-review/README.md`。

- `theme-skeleton` 使用 spec-driven，4 项规划产物与 29/29 任务完成。经用户选择先同步再归档：新增 `theme-distribution` / `theme-shell` 主规范各 8 条要求，4 份主规范严格校验通过。归档路径为 `openspec/changes/archive/2026-10-20-theme-skeleton/`。
- 修复阅读区域与 chrome 叠印、小屏菜单语义/焦点/背景隔离、无 JS 导航布局、独立动作触控尺寸、320px/200% 重排、标题降级与信件间距、默认主题及显式 auto、日夜颗粒层；实现决策追加 D21。
- 固定框架现在由三行 grid 保持在视口边缘，中间 main 原生滚动；无 JS 使用文档流。没有 JS 滚动或历史管理，Chromium 返回恢复实测 scrollTop 200 → 200。P3 转场必须保留此行为。
- 未修改 DESIGN.md / `.impeccable/design.json` 的视觉契约；只将既有日夜颗粒值拆成令牌别名。资产门禁五项通过。Impeccable 的 sidecar 时间戳提示仍保留，未擅自刷新。
- 两版标准 Hugo 0.146.0 / 0.168.0 均零 WARN、零弃用命中，EN 22 / ZH 16；常驻探针扩为 9 项，双版本 × 1440/390 均通过。24 个 HTML 页面 × 两尺寸 × 日夜 + 10 组重排 = 106 组通过；546 个站内引用零失败。
- 10 张最终截图与一张修复前对照、四份最终探针 JSON、browser-review/links/detector JSON 已保留。额外全页面检查尚未接入 CI；真实手机、辅助技术、Firefox/WebKit 与线上性能尚未验证。
- Impeccable detector 返回空数组，但 Hugo stylesheet 模板表达式不能被其解析，颜色/自定义属性检查不完整；对应范围由资产门禁与渲染检查覆盖，不能把 detector 空结果当作完整证明。
- 新增 `exampleSite/content/reading-check.md`（虚构、list:never）覆盖长链接、强调、列表和引用；现有 second-letter 覆盖缺少 Subject，中文 posts 保持空列表。

建议顺序：动态海面 → 代码块/复制与 OG → View Transitions；随后 P4 接入 CI 浏览器/链接/截图门禁，完成 README 安装契约。主题仍处于可构建、未声明可安装的阶段。本轮未提交或推送。

- 收尾并发检查出现过一次菜单未展开，之后 16 次带事件记录的并发复现未再出现；期间记录到一次脚本连接重置，原失败成因未证实。主动阻断 ui.js 稳定重现了失效导航：现已在 head 捕获 UI 资源错误并恢复普通导航，新增第 9 项回归，修复前后记录与加载观察保留在证据目录。
