# Handoff — P3 签名能力（2026-10-21）

P3实现及本地验收完成，用户要求最终审核，当前活动变更为`signature-capabilities`；不自动归档、提交或推送。前轮P2归档与审查改动仍在同一工作区，保持原样。

实现契约见`docs/signature-capabilities.md`；设计契约/sidecar已同步，决策追加D22。完整结果、限制、截图和测试证据见`docs/design/evidence/p3-signature/README.md`。Hugo知识库补TPL-22/SRC-106，规则总数106。

品牌主文件`assets/images/emblem.svg`，用户图片主体平面重绘；透明PNG、favicon、Apple、默认OG共用。星形仅交互。SVG派生PNG由维护者工具`scripts/render-brand.mjs`预生成，用户构建不要求Node/Chrome。原图来源仅注明用户提供，未作第三方权利断言。

海面时间驱动24fps上限，reduce/saveData/hidden/pagehide停止，pageshow恢复。代码hook支持单色高亮、独立横滚、原文复制与失败选区；Goldmark去掉的尾换行显式补回。OG提供共享1200×630图、bundle/assets覆盖及完整OG/Twitter标签；不自动将每篇标题绘制进默认图片。转场纯CSS跨文档，默认关闭，exampleSite开启；220/520ms正文退入，reduce关闭，无导航/历史/滚动接管。

双版Hugo0.146/0.168严格构建与INFO审计通过；基础probe四组9/9，P3专项两版36/36（包含真实Clipboard读回）；全页面118组零失败，559本地引用零失败；资产五门禁和OpenSpec strict通过。探针入口`node test/signature.mjs --url <fixture-site> [--disabled-url <features-off-site>] --out <evidence-dir>`。全页面额外复核脚本本轮在临时目录运行，JSON/截图已保存；尚未接入CI。

开发时曾发现并修正尾换行丢失；测试服务根路径、Enter CDP事件和地址导航不触发转场的问题见报告。Impeccable detector无法解析Hugo动态stylesheet，未将空结果冒充完整证明。

下一阶段：用户审核后同步/归档P3；P4跨引擎/真实触控设备/辅助技术、CI浏览器和链接门禁，再补README安装、命名/theme.toml、版本/发布。不声称真实设备或线上性能已验证。

## 用户反馈后的复核

用户表示看不到海面动态，并建议实站对照。已证明原功能在绘制但合成运动太弱；新增任务2.2、完整画面可见性测试test/sea-visibility.mjs，海面独立24秒/2.4vh/远0.10近0.28令牌，中央veil不动。保留失败和通过的两尺寸昼夜画面，并录制sea-after/sea-preview.mp4。决策D23及DESIGN/sidecar同步。实站对照图仅在docs/design/reference/live-2026-10-21/，差距报告earendil-comparison.md明确：当前二维线场仍达不到参考有体积的波面，默认OG也没有参考逐篇标题。不得把功能通过当成视觉保真完成。
