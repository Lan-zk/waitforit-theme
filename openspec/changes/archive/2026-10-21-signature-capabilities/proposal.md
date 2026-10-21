## Why

P2 已验证静态主题骨架。现在需要交付可审核的签名体验，并将用户提供的主体轮廓作为品牌标志。

## What Changes

- 提取透明底品牌轮廓，接入首页、内页、404、favicon 与分享图。
- 动态海面保持四层表面，以原创Canvas透视高度场表现波面明暗，支持减少动效、省流与后台暂停。
- Markdown 代码块提供单色高亮、语言标签、可访问复制与失败提示；生成带中英文逐篇标题的OG/Twitter图片和元数据。
- 原生跨文档 View Transitions，保留链接、历史、锚点、无 JS 与不支持浏览器的原生导航。
- 首页首屏聚焦主句与海面，近期文章保留在后续滚动区域。
- 同步设计契约、sidecar、fixture、自动探针与双版本验证。

## Capabilities

### New Capabilities

- `signature-experience`: 品牌标志、动态海面、代码复制、社交分享与页面转场。

### Modified Capabilities

- `asset-licensing`: 增加仅用于构建的OFL字体白名单与用户授权品牌素材边界。
- `design-system`: 品牌标志使用用户提供轮廓，交互装饰仍仅限四角星。

## Impact

影响 assets、layouts、i18n、默认参数、exampleSite、设计契约及浏览器探针。无运行时依赖、远程构建资源或内容迁移；继续支持 Hugo 0.146.0 与 0.168.0 标准版。
