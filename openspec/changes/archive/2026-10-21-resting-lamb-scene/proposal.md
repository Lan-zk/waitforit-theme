> 状态提示（2026-10-21）：本变更已归档于 `openspec/changes/archive/2026-10-21-resting-lamb-scene/`。它记录的是 Canvas 2D 场景替换；渲染器随后由已归档变更 `2026-10-21-webgl-scene`（D32）迁移为 WebGL2。视觉、参数、动效与降级条款仍有效，一切实现性渲染器描述以 D32 为准。

## Why

当前海面表达航海意象，与用户 Resting Lamb 标志所表达的安歇、信靠、谦卑不一致。用户已要求按 `docs/design/resting-lamb-scene-brief.md` 实际实现并预览草地与窄溪。

## What Changes

- 用原创单色低伏草地和窄溪替换透视波面，固定地形，仅草梢与水纹缓动。
- 保留双画布、四层页面表面、24fps 上限和静态降级。
- **BREAKING**：开关 `features.sea` 改为 `features.scene`，删除旧键与海浪令牌。
- 同步设计契约、fixture、场景验收与截图/视频证据。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `signature-experience`：背景场景与首页构图改为草地/窄溪，更新开关及可见性要求。
- `design-system`：明确程序化景观属于背景层，场景视觉与 sidecar 同步。

## Impact

影响 scene.js、场景令牌、配置及 partial、DESIGN/sidecar、相关文档与 CDP 测试。无新增依赖、外部素材或真实站点内容；Hugo 0.146.0 最低支持不变。
