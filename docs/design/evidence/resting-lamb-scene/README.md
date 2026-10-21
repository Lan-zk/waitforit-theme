# Resting Lamb 场景实现与预览（2026-10-21）

按用户确认的调整说明实施；主规范已同步。本目录记录**迁移前 Canvas 2D 渲染器**的实现与证据（历史）；当前渲染器见 D32 与 `docs/design/evidence/webgl-scene/`。`openspec/changes/resting-lamb-scene/` 仍为活动变更、尚未归档；原海面与 P3 证据保留为历史。

## 最新覆盖

当前为实站对照后的材质优化：多尺度反射水纹、清晰尖叶与固定星点，保留用户的16项默认参数。**本页以下为早期历史**；最新截图、录像、检查与性能见 [natural-landscape](natural-landscape/README.md)。上一轮参数和交叉波对照保存在 [crossing-waves](crossing-waves/README.md)。

## 效果

- [约9秒日间演示](meadow-day.mp4)、[约9秒夜间演示](meadow-night.mp4)：1440×900 实际浏览器截图序列，按采集墙钟时间编码，保留原速度；约6–10帧/秒的录制采样不代表场景绘制帧率。
- [桌面日间](home-1440-day.png)、[桌面夜间](home-1440-night.png)、[390日间](home-390-day.png)、[390夜间](home-390-night.png)。
- [中文阅读页](zh-post-1440-day.png)、[夜间手机阅读页](post-390-night.png)、[手机菜单](menu-390.png)、[404](404-390-day.png)。
- [无JS](no-js-390.png)、[关闭场景](disabled-390.png)、[减少动效](visibility/390-day-reduce-0.png)。

低伏草地在首屏下方铺开，偏右溪流按小屏重新定位，前景约20vw。当前版本按用户第三轮建议调整：中近景草簇成片受风弯曲、压低与回弹，水波方向和明暗强度从同一空间风场读取；只有一个12秒基础相位，草摆标称7px，细波虚拟高度0.45vh。地形、草根与岸线固定，场景仍为纸墨单色。

岸边的整齐无草带已移除：地面与水波共用随深度变化的18px浅水覆盖，贴岸草簇疏密成团、部分弯入水面，既能看到溪水，也有材质交叠。没有给全画面加模糊。新旧对照保存在 [调整前日间](before-wind/home-1440-day.png) 与 [调整前动效](before-wind/meadow-day.mp4)。

早期方案曾使用14秒/2.5px、约1/5草簇活动和独立18秒水波；它已由这轮统一风场替代。原始海面与既往P3证据继续作为历史。
## 验证

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| Hugo 0.146.0 / 0.168.0 严格构建 | 两版通过，无WARN；标准版、不增加构建依赖 | build-146.log / build-168.log |
| INFO弃用审计 | 两版无弃用/WARN/error | info-146.log / info-168.log |
| 资产与设计门禁 | 5项通过，13色/双字体与SVG白名单保持 | assets-gate.log |
| 签名专项 | 两版各38/38；含reduce恢复、后台/离页、省流、关闭、Canvas不可用、复制/OG/导航 | signature-results-146.json / signature-results-168.json |
| 首页/OG专项 | 两版各23/23；原生滚动、标题安全区、本地覆盖与构建字体隔离保持 | fidelity-results-146.json / fidelity-results-168.json |
| 基础探针 | 390×844、1440×900各9/9 | probe-390.json / probe-1440.json |
| 场景画面 | 1440/390昼夜4/4；六秒草水变化、邻近草簇同向、草根固定、主句稳定；reduce像素与绘制均不变化 | visibility/visibility.json |
| 实际页面复核 | 首页/英中文阅读/404 × 昼夜 × 两尺寸，16组无溢出、无脚本错误；另存滚动/菜单/关闭/无JS截图 | browser-review.json |
| 本地调参页 | 14/14；实时画布、JSON往返/校验/复制/下载、刷新保留、390实际视口、窄屏与reduce通过 | tuner/tuner.json |
| OpenSpec strict | 全量6项通过 | openspec-validation.log |

可见性差分区域避开页脚文字：草地为宽度8–55%、高度70–84%；溪水为桌面宽度69–90%/小屏58–90%、高度70–84%，再用实际水道遮罩限定采样；保护区为主句实际范围加16px。RGB最大通道差≥4算变化像素。草地变化比例至少0.1%、平均通道差不超过10/255、最大不超过64/255，溪水内部变化比例至少2%、平均通道差不超过12/255、最大不超过64/255，保护区变化比例<0.1%。用户要求的连续细波会改变大部分水面，故用变化强度限制闪烁，替代初版短线水纹的变化面积上限。新增实际绘制路径观测：按草叶根部坐标匹配前后帧，根部位移须为零；相邻24×8 CSS px内、可辨移动的草叶方向一致率至少75%（至少50对）。它验证成片受风与扎根，不暴露生产调试接口。最终具体数值见visibility.json；这些是fixture工程指标，不是通用人眼感知结论。静态缓存哈希一致；reduce对照六秒后零变化、零持续绘制。阅读页保留原径向纸光，并经截图检查。

测试切换reduce时等待浏览器的媒体偏好变更事件，并确认静态首帧绘制后300ms计数稳定，再开始计数；早期固定100ms等待在并行录制负载下曾出现一次不稳定结果，不同MediaQueryList的change事件及最终静帧绘制可以分批派发，已改正测试同步方式，同时在渲染器RAF与change处理处统一提交确定性静帧，避免matches先更新、change稍后派发时暂留动画中间帧；没有放宽冻结断言。

## 性能与限制

`performance-before.json` / `performance-after.json` 为同机 Headless Chromium 155、DPR1、实际1440×813视口，各预热1秒后采样10秒。包装RAF回调，仅在day目标画布发生一次复合时记逻辑帧；旧版检测putImageData，新版检测drawImage，耗时包括双主题实际绘制。两个版本均约20逻辑帧/秒，受24fps上限与浏览器帧调度共同约束。旧海面绘制中位9.7ms、p95为10.2ms；统一风场版中位3.1ms、p95为3.5ms（各200帧）。数值见JSON，不把录制采样帧率当作绘制帧率。

固定场景缓存在尺寸或调参令牌变化时重建，连续绘制为缓存复合、中近景草簇及水道包围盒内的细波场；增加草簇参与范围是本轮明确的视觉需求。无JS/Canvas失败/关闭时保留纸光与正文，不保证景观。真实手机、Safari/Firefox及辅助技术验收仍属于P4；本次本机结果不替代这些验证。

## 复跑

分别以两版Hugo严格构建exampleSite，托管生成目录；关闭版需额外配置：

```toml
[params.waitforit.features]
scene = false
transitions = false
```

```bash
node scripts/check-assets.mjs
node test/probe.mjs --url http://127.0.0.1:8821/signature-check/ --width 390 --height 844
node test/signature.mjs --url http://127.0.0.1:8821/ --disabled-url http://127.0.0.1:8822/ --out /tmp/wf-signature
node test/fidelity.mjs --url http://127.0.0.1:8821/ --build-root /path/to/public --out /tmp/wf-fidelity
node test/scene-visibility.mjs --url http://127.0.0.1:8821/ --out /tmp/wf-scene-visibility
node test/scene-performance.mjs --url http://127.0.0.1:8821/ --out /tmp/wf-scene-performance.json
```

关闭路径必须实际提供关闭版本URL。画布不可用由signature专项在页面加载前模拟2D上下文失败；正常主题/导航仍可用且无持续场景循环。原海面性能基线由改动前的构建保留后测得，不依赖历史手写数值。

## 临时调参入口

当前 [本地调参页](http://127.0.0.1:8821/tune/) 同源嵌入实际主题，提供15个滑块与风向选择，可切换昼夜/两档实际视口、暂停观察与仅看景物。调好后“复制参数”或下载JSON回传；工具自动保存浏览器当前参数，支持校验导入和恢复默认。正常主题无面板，Hugo不发布工具。启动与参数单位见 [工具说明](../../spikes/scene-tuner.md)，截图见 [桌面](tuner/tuner-1440.png) / [窄屏](tuner/tuner-390.png)。
