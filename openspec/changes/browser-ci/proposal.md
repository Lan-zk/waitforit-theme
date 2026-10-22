# Proposal

## Why

用户指定先关闭content-types，再补稳定的自动验收、当前电脑实测和发布交付。现有CI仅覆盖构建，菜单替换、单语和最小消费者缺少持续检查。

## What Changes

- 复用零依赖CDP测试，新增隔离构建与本地服务编排和消费者配置fixture。
- CI执行核心布局、内容、阅读、签名、场景运动与流向检查；失败保留结果，不自动重试。
- 跨文档转场等待真实ready状态并记录异常，替代旧文档中的固定延迟。

## Capabilities

### New Capabilities

- `browser-ci`: 可复跑的消费者变体与浏览器门禁。

## Impact

仅修改测试、CI和虚构fixture。生产构建无需Node或浏览器，无新运行时依赖。
