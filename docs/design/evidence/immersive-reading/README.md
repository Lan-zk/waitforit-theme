# 全高阅读与视觉反馈验收

日期：2026-10-21。决策 D35，活动变更 `immersive-reading`。接续 `content-taxonomy-review`，旧轮证据不改写。

## 实现与验收结果

- 增强后的main覆盖视窗上下，header/footer为固定控件层，空白处不截获点击。滚动列两端使用1/2/4/8px的四层backdrop-filter，覆盖范围逐层收窄；宽层轻混纸色，不产生实色页眉页脚带。scroll/resize/pageshow/ResizeObserver事件更新边界强度，不开连续动画循环；到开头/结尾时对应边缘强度为0。
- 保留正文首尾留白；1440下末段范围约597..725、390下约509..772（900px视高），末段完整进入清晰区。键盘聚焦边缘链接时居中；装饰层pointer-events:none。
- 中英文经文无标点、按分句换行；中文0.08em字距与1.65行高，出处保留。默认页脚单行安歇/Rest，站点brand覆盖与可选footer补充仍可用。
- 桌面文字标签最小24px、字号13px、横向间隔8px；coarse pointer恢复44px。标签总览与chrome仍44px。删除随笔分区中英fixture说明段落。
- logo改为主题ink，亮色不再使用star-dark。光标为原创牧羊杖SVG、hotspot(23,3)，保留亮暗与对比描边；hover星形不变。
- 主滚动条透明轨道、默认透明thumb，hover/focus用hairline；原生滚动和键盘行为保留。

结果：

- Hugo0.168.0严格构建退出0、无WARN；EN67/ZH59页。
- 资产门禁5/5；主规范和活动变更严格校验通过。
- `test/immersive-reading.mjs`：28/28，含1440/390昼夜、全高、首/中/尾、底部清晰、键盘目标、coarse目标与无JS。
- `test/content-boundaries.mjs`：116/116；slogan与标签目标按D35更新断言。
- `test/probe.mjs`：1440/390各9/9；reader-frame按用户要求改为全高，44px chrome、24px桌面文字标签分别检查；无JS仍检查正常文档流和不重叠。
- `test/fidelity.mjs`：23/23，首页首屏、原生滚动与OG保持通过。
- `WF_SOFTWARE_WEBGL=1 node test/signature.mjs`：37/37，场景、代码复制、转场、历史滚动与降级通过。本轮未出现前轮已知转场中止，不据此认定其已解决。

## 截图与环境

`reading-first-*`、`reading-middle-*`、`reading-last-*`对应长文首、中、尾。`edge-with/without-blur.png`是同一位置启用/隐藏完整边缘效果的像素对照（包含模糊与纸色混合）；结果记录在reading-results的rendered-blur-pixels中，最大通道差异185以上，且样式断言确认四种不同blur半径。不是只检查CSS声明。

阅读专项截图没有启用Chrome的`--hide-scrollbars`；其他历史探针默认保留该参数。阅读专项在reduce下冻结背景，并覆盖coarse pointer与无JS。普通内容截图环境无法获得WebGL2时使用原有背景降级；signature通过已有软件WebGL开关单独检查场景。

未覆盖Safari/Firefox、真机与真实GPU性能。不支持backdrop-filter时CSS隐藏边缘层；无JS/UI包下载失败回到正常文档流，没有模糊遮挡。

## 复跑

Hugo0.168.0：

```bash
hugo --source exampleSite --themesDir ../.. \
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings \
  --destination /tmp/wf-immersive-build
node scripts/check-assets.mjs
node scripts/preview-scene.mjs --root /tmp/wf-immersive-build --port 8844
```

另一终端：

```bash
node test/immersive-reading.mjs --url http://127.0.0.1:8844/ --out /tmp/wf-immersive-reading
node test/content-boundaries.mjs --url http://127.0.0.1:8844/ --out /tmp/wf-immersive-boundaries
node test/probe.mjs --url http://127.0.0.1:8844/ --width 1440 --json
node test/probe.mjs --url http://127.0.0.1:8844/ --width 390 --json
node test/fidelity.mjs --url http://127.0.0.1:8844/ --build-root /tmp/wf-immersive-build --out /tmp/wf-immersive-fidelity
WF_SOFTWARE_WEBGL=1 node test/signature.mjs --url http://127.0.0.1:8844/ --out /tmp/wf-immersive-signature
openspec validate immersive-reading --strict
```

参考：用户提供的[全高阅读页面](https://earendil.com/posts/pi-durable-on-cloudflare/)；[MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)核对滤镜作用与支持边界。布局、分层mask和光标均为本仓库独立实现，未拷贝参考站CSS、shader或素材。
