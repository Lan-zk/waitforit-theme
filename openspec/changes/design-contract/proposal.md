# Proposal

## Why

主题的 P1 需要一个**可执行、可验收的视觉契约**，而不是观感描述。`docs/design/` 尚未建立，设计决策散在 D2/D3/D10/D12，P2 一写模板就会靠临场发挥，验收只能靠"像不像"。

earendil.com 的设计系统已经成熟（`DESIGN.md` 26 色令牌 + 8 排版角色 + 22 组件键、`.impeccable/design.json` 12 个自包含组件片段、纸光 + 四角星 + 两字体的完整叙事），可以直接转译，但**不能原样照搬**：字体许可（Plantin Now 是站点专属商业授权，其他方不得使用）、WebGL 海面实现、图片/logo/纸纹的版权构成三条硬边界。转译而不是发明，能省掉重复设计，并把风险集中到"是否忠实"与"许可是否干净"这两件可判定的事上。

## What Changes

- 新增 `docs/design/transfer-matrix.md`：把参考系统的 26 个颜色令牌（13 个采纳；12 个 `pi-*` 内嵌预览令牌与 `nav-overlap` 排除，后者是上游已记录的可访问性例外）、8 个排版角色、22 个组件键、12 个组件片段逐条映射为「采纳 / 替换 / 排除 + 理由」，并给出 `ds-` → `wf-` 命名映射。
- 新增 `docs/design/tokens.css`：`--wf-*` 设计令牌（颜色、字阶、间距、断点、`--wf-horizon`、三态主题 `auto/day/night`），作为唯一机器可读颜色/尺寸来源；P2 起移入 `assets/css/tokens.css` 并删除该文件。
- 新增仓库根 `DESIGN.md`（8 个标准章节 + YAML frontmatter）与 `.impeccable/design.json` sidecar（由 impeccable `document` 生成），二者构成视觉的唯一权威；`DESIGN.md` 改动必须同步重生成 sidecar。
- 新增 3 个静态 spike 原型（`docs/design/spikes/`，非主题模板）：字体 A/B（Newsreader vs Source Serif 4 + Commit Mono）、Canvas 2D 海面 + 纸光层级、导航/主题转场。
- 新增原创资产：四角星 SVG（18/24/32）、light/dark favicon、星形光标 SVG、可平铺纸纹 PNG；**不复制**参考仓库任何像素、路径数据或 GLSL。
- 字体策略按决策 C 保持现有边界：`Newsreader`（衬线角色，latin 子集 + `Noto Serif SC` 系统回退）与 `Commit Mono`（等宽角色）随主题分发，均 OFL；**不引入** Plantin Now 与 Departure Mono。主题暴露 `--wf-font-serif` / `--wf-font-mono`，站点可用自持字体覆盖以获得 100% 参考观感。
- 修订设计决策：D7（动效时序改为参考规范）、D8（页面表面 = 径向纸光覆盖 Canvas 2D 场景）、D9（字体角色与子集化补充）、D16（设计契约落点移到仓库根）；新增 D19（参考转译原则与上游 pin 策略）。
- 更新 `AGENTS.md`：字体硬边界措辞、设计文档指针、DESIGN ↔ sidecar 同步规则。
- 新增 `CREDITS.md` 字体/参考段落与 `assets/fonts/*-OFL.txt`。

无 BREAKING 变更：仓库尚无模板与外部使用者。

## Capabilities

### New Capabilities

- `design-system`: 全站视觉的唯一机器可读来源——设计令牌、排版角色映射、页面表面构成（纸光/场景/颗粒）、组件形态与动效时序、reduced-motion 降级、`DESIGN.md ↔ sidecar` 同步规则、保真验收判定。
- `asset-licensing`: 主题分发包的资产与许可约束——可再分发字体白名单与许可文本随包、字体文件不按 MIT 再许可、原创资产边界（禁止复制参考仓库像素/路径/shader）、`CREDITS.md` 记录、CI 资产门禁。

### Modified Capabilities

无。`openspec/specs/` 当前为空，本变更不修改已归档规格。

## Impact

- 文档：`docs/design/`（新建 transfer-matrix、tokens.css、spikes、reference）、`docs/decisions.md`（追加 D19，修订 D7/D8/D9/D16）、`docs/handoff/` 新交接文件、`AGENTS.md`。
- 新增目录/文件：根 `DESIGN.md`、`.impeccable/design.json`、`docs/design/transfer-matrix.md`、`docs/design/tokens.css`、`docs/design/spikes/`、`docs/design/reference/upstream-pin.md`、`assets/fonts/`、`CREDITS.md`。
- 构建与 CI：无新增依赖；新增资产白名单与令牌门禁脚本（P2 接入 CI）。
- 不涉及：Hugo 模板、`exampleSite/`、运行时 JS、真实站点内容。
