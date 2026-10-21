# Handoff — 实站差距优化（2026-10-21）

用户在实站对照后明确授权按建议继续优化。当前活动变更signature-capabilities已增加6.1–6.4四项任务，实施和验收完成，仍待最终审核，不归档/提交/推送。此前P2归档与全部工作区改动保留。

最新结果与画面以docs/design/evidence/p3-fidelity/README.md为准；p3-signature/的线场/共享OG和第一轮可见性修复是历史。设计决策D24更新海面、首页和OG；DESIGN与sidecar同步，Hugo知识库增AST-17/SRC-107，共107条规则。

- assets/js/scene.js：原创Canvas 2D透视高度场，三组方向波、解析坡度明暗、远近透视；640内部宽度上限，同一标量场着色双昼夜，24fps和全部暂停/静态降级保留。不是参考shader移植。
- 首页主句居中，文章保留在下一滚动段；60vh海平线，首页veil在48–68vh渐退，阅读页veil不变。
- social.html/og-title.html：Hugo原生逐篇标题图，中英文与长单词折行，闭合标点不孤立行首，极长标题八行省略；完整标题在metadata，本地图片覆盖优先。最低版strings.Truncate须printf转string。背景纸纹/用户品牌轮廓均为主题自己的资产。
- build-only OFL字体assets/fonts/og/：Newsreader400（43KB）及Noto Serif SC400（14.56MB，30928字形映射），同目录OFL。门禁仅明确允许这两个额外TTF；不Publish/Permalink，不进浏览器字体输出，web WOFF2仍289.7KiB。CREDITS记录Git blob、hash、版权与转换；scripts/prepare-og-fonts.py仅维护者需要。

双版Hugo0.146/0.168严格构建/INFO审计通过；新专项各23/23、P3各36/36；基础两组9/9；全页130组零失败、619本地引用零失败；资产门禁/全量OpenSpec strict通过。新截图、中文/英文/超长OG、8秒MP4及对照说明都在p3-fidelity/。本机1440×900绘制中位8.3ms/p95 10.4ms不是手机/跨引擎性能证明。

新增exampleSite虚构隐藏fixture og-long-check双语/og-edge-check，均list:never。test/fidelity.mjs检查构图、原生滚动、标题图像边界、逐篇图唯一性、覆盖和TTF不发布；test/sea-visibility的安静区域现在是主句实际范围，下方海面本来就应动态露出。

下一步：用户审核后同步/归档P3，再做P4真实设备、跨引擎/辅助技术和CI浏览器门禁、README安装/命名与发布。差距仍包括细浪随机性、光照和纸纹细节，不宣称逐像素匹配Earendil。
