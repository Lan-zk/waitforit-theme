## MODIFIED Requirements

### Requirement: 字体白名单

主题 SHALL 只随包分发白名单内的 OFL 字体（网页衬线角色Newsreader、等宽角色Commit Mono，网页中文字形走系统回退；标题图片构建允许静态Newsreader与Noto Serif SC的两个明确白名单TrueType文件，且MUST NOT作为网页字体发布）；Plantin Now / Plantin MT Pro 等商业字体与上游参考站点专属的 Departure Mono MUST NOT 出现在仓库或任何构建产物中。

#### Scenario: 白名单外字体入场

- **WHEN** `assets/fonts/` 新增了不在白名单内的字体文件或被禁字体的引用
- **THEN** 资产校验失败并输出违规文件名与非零退出码

#### Scenario: 构建产物只含白名单

- **WHEN** 构建 exampleSite 并扫描产物
- **THEN** 产物内的字体文件集合是白名单的子集，且不包含被禁字体的任何字节或 CSS 引用

### Requirement: 原创资产边界

主题资产 MUST 为原创、来自可再分发公开许可，或用户提供并明确授权用于主题品牌：四角星 SVG、纸纹、光标、favicon 与场景渲染参数均须自行绘制或生成，用户品牌轮廓的独立重绘须在CREDITS记录输入和处理方式；MUST NOT 复制上游参考仓库的 `styles.css`、`script.js`、GLSL/WebGL 代码、图片、logo 或 SVG 路径数据；对上游结构的引用 MUST 在 `CREDITS.md` 标注来源与许可。

#### Scenario: 资产相似度检查

- **WHEN** 将主题资产与上游参考仓库资产做路径数据与字节比对
- **THEN** 不存在路径数据复用、字节复制或像素级重绘，仅可存在独立绘制的同类图形

#### Scenario: 参考截图不入产物

- **WHEN** 扫描仓库与构建产物
- **THEN** 上游设计对照截图只出现在 `docs/design/reference/`，不被 exampleSite 或主题资产引用，也不进入构建产物
