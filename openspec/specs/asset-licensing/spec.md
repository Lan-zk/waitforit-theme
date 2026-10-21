# asset-licensing Specification

## Purpose

保证 waitforit-theme 分发包中的每个字体与媒体资产都可再分发、可追溯、与代码许可分离，并且不混入上游参考站点或商业授权的版权资产。

## Requirements

### Requirement: 字体白名单

主题 SHALL 只随包分发白名单内的 OFL 字体（网页衬线角色Newsreader、等宽角色Commit Mono，网页中文字形走系统回退；标题图片构建允许静态Newsreader与Noto Serif SC的两个明确白名单TrueType文件，且MUST NOT作为网页字体发布）；Plantin Now / Plantin MT Pro 等商业字体与上游参考站点专属的 Departure Mono MUST NOT 出现在仓库或任何构建产物中。

#### Scenario: 白名单外字体入场

- **WHEN** `assets/fonts/` 新增了不在白名单内的字体文件或被禁字体的引用
- **THEN** 资产校验失败并输出违规文件名与非零退出码

#### Scenario: 构建产物只含白名单

- **WHEN** 构建 exampleSite 并扫描产物
- **THEN** 产物内的字体文件集合是白名单的子集，且不包含被禁字体的任何字节或 CSS 引用

### Requirement: 字体许可文本随包

每个随包的字体文件旁 MUST 存在其 OFL 许可文本与版权行；`CREDITS.md` MUST 记录字体名称、版权持有者、许可全称与获取来源；代码的 MIT 许可 MUST NOT 被解释为对字体文件的再许可。

#### Scenario: 缺许可文本

- **WHEN** 某个字体文件没有对应的许可文本文件
- **THEN** 资产校验失败并指明缺失的许可文件路径

#### Scenario: 许可与代码分离

- **WHEN** 查看 `LICENSE` 与 `CREDITS.md`
- **THEN** 代码许可为 MIT，每个字体的许可与版权行各自独立且可追溯，字体许可优先于 MIT 适用于字体文件

### Requirement: 原创资产边界

主题资产 MUST 为原创、来自可再分发公开许可，或用户提供并明确授权用于主题品牌：四角星 SVG、纸纹、光标、favicon 与场景渲染参数均须自行绘制或生成，用户品牌轮廓的独立重绘须在CREDITS记录输入和处理方式；MUST NOT 复制上游参考仓库的 `styles.css`、`script.js`、GLSL/WebGL 代码、图片、logo 或 SVG 路径数据；对上游结构的引用 MUST 在 `CREDITS.md` 标注来源与许可。

#### Scenario: 资产相似度检查

- **WHEN** 将主题资产与上游参考仓库资产做路径数据与字节比对
- **THEN** 不存在路径数据复用、字节复制或像素级重绘，仅可存在独立绘制的同类图形

#### Scenario: 参考截图不入产物

- **WHEN** 扫描仓库与构建产物
- **THEN** 上游设计对照截图只出现在 `docs/design/reference/`，不被 exampleSite 或主题资产引用，也不进入构建产物

### Requirement: 资产门禁

构建与合入前 MUST 运行资产校验，覆盖字体白名单、许可文本存在性、`CREDITS.md` 来源标注与产物扫描；任一检查失败 MUST 阻断构建。

#### Scenario: 门禁阻断构建

- **WHEN** 资产校验任一项失败
- **THEN** 构建脚本以非零退出码终止，且不产出发布用构建结果
