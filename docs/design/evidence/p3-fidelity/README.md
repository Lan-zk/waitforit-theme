# 实站差距优化结果（2026-10-21）

用户授权按实站对照建议继续优化。本轮已替换稀疏线场、调整首页首屏，并完成Hugo原生中英文逐篇标题OG。验收完成后，用户于2026-10-21指示归档、提交并推送；变更已同步主规范并归档为`2026-10-21-signature-capabilities`。

## 现在的画面

[8秒真实浏览器录屏](sea-preview.mp4)，[1440日间](current/home-1440-day.png)，[1440夜间](current/home-1440-night.png)，[390日间](current/home-390-day.png)，[390夜间](current/home-390-night.png)。

参考实站截图只在 [reference/live-2026-10-21](../../reference/live-2026-10-21/README.md)。与参考[首页](https://earendil.com/)及所查看的[文章分享图](https://earendil.com/static/og/posts/pi-durable-on-cloudflare.png)比较：

| 差距 | 前一版 | 本轮结果 |
| --- | --- | --- |
| 海面形态 | 18条稀疏正弦线，缺少波面体积 | 原创Canvas 2D透视高度场，三组方向波、远密近疏、连续明暗与近景波峰；未复制shader或参考像素 |
| 首页焦点 | 主句、近期列表与正文一起占首屏 | 主句居中，60vh附近开始海面，文章保留在下一原生滚动区域；更接近参考的单一首屏焦点 |
| 波面可见区域 | 中央veil几乎完全遮住海面 | 仅首页纸光在48–68vh间渐退，近景波面覆盖首屏下部；阅读页仍保护正文 |
| OG内容 | 全页共享默认品牌图，没有逐篇标题 | Hugo原生1200×630品牌与当前标题图，中英断行/缩小，本地覆盖优先；极长标题最多8行并省略，完整标题保留metadata |
| OG字体 | 没有字体构建管线 | OFL Newsreader/Noto Serif SC只用于构建，不发布为web字体；网页WOFF2仍289.7KiB |

这是原创近似，不声称逐像素一致：细浪随机性、光照细节、纸纹强度与字体外观仍和参考不同；用户标志与OFL字体替代继续保留。参考截图与网站文案没有进入主题/fixture资产。

## 验证

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| Hugo 0.146 / 0.168 标准版严格构建 | 两版通过，EN26/ZH18，28张生成图，无WARN | build-146.log / build-168.log |
| INFO弃用审计 | 两版无弃用/WARN/error命中 | info-146.log / info-168.log |
| 新构图/OG专项 | 两版各23/23，包括首屏焦点、原生滚动、OG安全区、逐页唯一图、覆盖优先、字体未发布 | current/fidelity-results.json / fidelity-results-146.json |
| P3签名专项 | 两版各36/36，真实Clipboard、reduce/saveData/后台与恢复、转场/历史均通过 | signature-results-168.json / signature-results-146.json |
| 基础探针 | 390当前版、1440最低版均9/9 | probe-168-390.json / probe-146-1440.json |
| 全页面/重排 | 30条路由 × 两尺寸 × 昼夜 +10组320–1100px/100–200%文字，共130组零失败 | browser-review.json |
| 链接/资源 | 31个HTML（含重定向），619项本地引用，零失败 | links.json |
| 海面可见性 | 四组全部通过；边缘两秒明显变化11–19%，主句附近0% | sea-visibility/visibility.json |
| 资产/许可/sidecar | 五项通过，含两个build-only字体及同目录OFL检查 | assets-gate.log |
| OpenSpec | 全量strict通过 | openspec-validation.log |

全页面复核还包含模拟触控滚动285px、触控菜单、跨断点模态清理与返回scrollTop200→200，零脚本/网络错误。新OG专项通过像素边界确认标题在x80..1120、y190..600内，没有因中文/长单词裁切；手工查看了中文标点、英文换行与八行极长标题。截图与JSON在current/，目录顶层部分草稿图不作为最终证据。

完整画面测试的“中央安静”区域随新首页契约调整为主句实际边界附近，旧测试将已明确露出的下方海面也算作中央正文，故在首轮新画面上失败。并非静止了首页下方海面；阅读页仍有完整径向纸光保护。1.2%变化率依旧只是fixture工程下限，不是通用人眼阈值。

## 性能与代价

1440×900、DPR1、本机Headless Chromium软件绘制，双Canvas内部640×400；90次实际绘制回调采样中位8.3ms、95分位10.4ms、最大11.1ms。每秒最多24次绘制；同一份高度/明暗场为昼夜着色，避免双算波面。详见performance.json。未把本机数据当成真机、Safari或Firefox性能结论。

中文OG需完整字形覆盖，构建专用Noto Serif SC静态TTF为14,561,480字节、保留源字体30,928个Unicode映射；加上43,004字节Newsreader TTF。此代价增加仓库/构建输入约14MiB，不增加页面字体请求。许可和来源记录在CREDITS，旁放OFL文本；维护者重建字体可用scripts/prepare-og-fonts.py，主题用户构建仍只需Hugo，不需网络、Node或字体转换工具。

初次最低版构建暴露strings.Truncate返回template.HTML的版本差异；已显式转string后双版通过。超长图像标题采用八行省略策略，metadata保持全量，不假称任意长度标题都能完整画进一张图。

Impeccable detector返回空数组，但仍不能解析Hugo动态stylesheet路径，颜色/自定义属性范围不完整；见detector.log。对应范围由资产门禁与真实浏览器检查补充。

## 复跑与后续

```bash
node scripts/check-assets.mjs
node test/fidelity.mjs --url http://127.0.0.1:8798/ --build-root /path/to/public --out /tmp/wf-fidelity
node test/sea-visibility.mjs --url http://127.0.0.1:8798/ --out /tmp/wf-sea
node test/signature.mjs --url http://127.0.0.1:8798/ --out /tmp/wf-signature
```

本轮已同步主规范并归档。后续P4优先真实手机、WebKit/Firefox、读屏和线上性能，并把浏览器/链接检查接入CI；README安装契约与发布工作尚未完成。
