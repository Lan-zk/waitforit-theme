# Proposal

## Why

用户指定先关闭content-types，再补稳定的自动验收、当前电脑实测和发布交付。现有CI仅覆盖构建，菜单替换、单语和最小消费者缺少持续检查。

## What Changes

- 复用零依赖CDP测试，新增隔离构建与本地服务编排和消费者配置fixture；套件作为发版前本地验收执行（D40）。
- 曾接入CI的浏览器作业在两次远端运行中均失败，按D40移除：CI只保留Hugo构建、资产与设计契约门禁和每周latest校验，浏览器套件改为发版前本地步骤；失败仍保留结果，不自动重试。
- 跨文档转场等待真实ready状态并记录异常，替代旧文档中的固定延迟。

## Capabilities

### New Capabilities

- `browser-ci`: 可复跑的消费者变体与发版前浏览器验收。

## Impact

仅修改测试、文档和虚构fixture；CI只保留既有Hugo构建。生产构建无需Node或浏览器，无新运行时依赖。
