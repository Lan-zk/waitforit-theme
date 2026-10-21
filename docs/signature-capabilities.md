# P3 签名能力

P3能力已同步至 `openspec/specs/signature-experience/`，变更归档于 `openspec/changes/archive/2026-10-21-signature-capabilities/`。Resting Lamb 场景替换已实现并同步主规范，活动变更为 `openspec/changes/resting-lamb-scene/`，新证据见 `docs/design/evidence/resting-lamb-scene/`。构建最低支持 Hugo 0.146.0，基线 0.168.0；主题构建不需要 Node、Chrome、extended 或网络。

## 配置与内容

```toml
[params.waitforit.features]
scene = true           # 默认开启；false 不加载 Canvas 或场景脚本
transitions = true   # 默认 false；exampleSite 开启，供审核
```

背景为原创 Canvas 2D 单色低伏草地、溪流与固定星点。固定地形、岸线和草根，中近景尖叶随同一空间风场弯曲、压低与回弹；共享12秒基础相位，标称草摆12 CSS px。五尺度交叉水波在随河道弯曲的透视坐标内向下游缓慢流动，坡面反射与局部高光呈现波光；风同时影响细波移动和强弱。前景溪宽26.5vw、波幅参数0.4vh；25px浅水过渡随远近收窄，贴岸草伸入水面。草叶/天空按CSS像素绘制，宽度最多1440；水面单独采样到等效视口宽度最多900。静态地形、远景草、固定星点缓存，共用昼夜几何，24逻辑帧/秒上限；小屏重定位溪流。星点夜间更明显，不闪烁、不移动。首页地面55vh，veil从顶部透明到48vh完整保护，再于68vh淡出；阅读页保留完整径向纸光。

减少动效、省流、后台与离页时停止循环；reduce/saveData呈现确定性首帧，偏好恢复后继续。省流检测以浏览器暴露的 `navigator.connection.saveData` 为准；不能承诺自动识别全部 OS 省电模式。`features.scene=false` 不输出画布与场景脚本；旧 `features.sea` 已移除。无 JS、Canvas 不可用或场景脚本失败时，正文/导航和纸光颗粒底面仍可用，不承诺静态景观。

Markdown 围栏自动使用单色高亮和文字复制按钮。语言缺失或不支持时显示纯文本。行号选项被关闭，长行在代码内横滚。复制保留缩进、符号和尾换行；安全上下文/权限不允许 Clipboard 时，选中代码并显示本地化提示。禁用或加载不到代码脚本时按钮保持隐藏。

默认OG由Hugo原生生成1200×630品牌与当前页标题图。中文/英文自动换行并缩小，极长标题最多8行后省略，完整标题保留元数据；本地图片覆盖优先。OG/Twitter 的标题、摘要、URL、语言以及文章发布时间按页面生成。逐页图片覆盖示例：

```yaml
params:
  waitforit:
    image: "cover.png"
    imageAlt: "图片的简洁描述"
```

先在当前 bundle 查找，再在 `assets/` 查找；支持 PNG/JPEG/WebP。缺失或不支持的覆盖回落默认图片。绝对图片 URL 取自站点 `baseURL`，部署时必须正确设置。bundle fixture 见 `exampleSite/content/og-check/`。

转场采用浏览器原生跨文档 View Transitions，正文 220ms 退出、520ms 入场，框架与背景静止。只增强双方开启的同源导航；不接管路由、历史或滚动。减少动效关闭转场，浏览器不支持时保持原生导航，无 JS 也可正常阅读与导航。

品牌主文件是 `assets/images/emblem.svg`，透明 PNG 为 `emblem.png`；header/404 继承昼夜墨色，favicon、Apple 图标与默认 OG 使用同一轮廓。维护者可用 `node scripts/render-brand.mjs` 重新栅格化品牌底图，主题用户无需执行。标题字形由Hugo直接生成；assets/fonts/og中的OFL TrueType仅用于构建，不作为网页字体发布。中文字体给仓库增加约14MiB，浏览器WOFF2仍为289.7KiB。

## 复跑

先按 AGENTS.md 的命令严格构建 exampleSite，再以任意本地静态服务托管构建目录：

```bash
node scripts/check-assets.mjs
node test/fidelity.mjs --url http://127.0.0.1:8798/ --build-root /path/to/public --out /tmp/wf-fidelity
node test/scene-visibility.mjs --url http://127.0.0.1:8798/ --out /tmp/wf-scene-visibility
node test/probe.mjs --url http://127.0.0.1:8798/signature-check/ --width 390
node test/signature.mjs --url http://127.0.0.1:8798/ --out /tmp/wf-signature-evidence
```

可选 `--disabled-url` 指向 scene/transitions 均关闭的同一 fixture 构建，补查关闭路径。验收页面为 `/signature-check/`、`/zh/signature-check/` 和 `/og-check/`，均不出现在文章列表中。

实现依据：[Hugo code hook](https://gohugo.io/render-hooks/code-blocks/)、[HighlightCodeBlock](https://gohugo.io/functions/transform/highlightcodeblock/)、[原生跨文档转场](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document)。版本边界与实测见 Hugo 技能 TPL-22 及 P3 证据目录。

首页首屏保留给居中主句和低伏草地/窄溪；文章列表与附加正文通过原生滚动继续访问，不删除内容。当前场景验收见 `docs/design/evidence/resting-lamb-scene/README.md`；P3海面与OG历史见 `docs/design/evidence/p3-fidelity/README.md`。
