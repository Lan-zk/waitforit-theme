# Resting Lamb 场景交接

用户要求按 `docs/design/resting-lamb-scene-brief.md` 实际实现并看效果。本轮完成原创Canvas 2D单色低伏草地与偏右窄溪，取代海面。当前活动变更 `resting-lamb-scene` 已实现并同步主规范；未归档、提交或推送。

> 历史交接：场景渲染器随后由 D32 / 已归档变更 `2026-10-21-webgl-scene` 迁移为 WebGL2；最新交接见 `docs/handoff/2026-10-21-webgl-scene.md`。本文描述的 Canvas 2D 实现仅作历史记录。

视觉/代码以根 DESIGN.md、sidecar、assets/css/tokens.css 与 assets/js/scene.js 为准；D26/D27/D28/D29追加记录场景替换、波面复用/溪流扩宽，以及统一风场/岸边融合与本地调参工具。唯一开关改为 params.waitforit.features.scene，无sea兼容键。默认hero与虚构首页文案改为安静草地语义；未改品牌轮廓、字体、正文/菜单/OG/复制/原生导航机制。

scene.js 用固定种子共用昼夜几何、缓存地形与远景草；中近景草簇与水波由同一12秒基础相位的空间风场驱动。草摆标称7px，草根固定、草叶弯曲和轻微压低；风力同时影响水波采样偏移与坡度强度，不再使用独立草/水周期。溪流约20vw/0.45vh，浅水过渡标称18px并随深度收窄，贴岸草疏密错落并伸入水面，去掉整齐无草带。内部宽度≤640、最多24逻辑帧/秒，暂停/偏好恢复/Canvas失败和原纸光保护保持。

当前证据与预览见 `docs/design/evidence/resting-lamb-scene/README.md`：昼夜约9秒实速演示、1440/390两档首页及阅读/菜单/404/静态降级截图。两版Hugo严格构建/INFO审计、资产门禁、signature各38/38、fidelity各23/23、基础探针两组各9/9、四组场景画面与全量OpenSpec strict通过。性能采样与方法见performance-before/after.json和证据README。

test/sea-visibility.mjs改名scene-visibility.mjs，按六秒局部变化与阅读保护校准上下界；reduce六秒零像素变化、零持续绘制。signature按day画布一次缓存复合计逻辑帧，并新增Canvas不可用和实时reduce恢复检查；场景测试记录实际草叶路径，检查根部固定及邻近草簇运动方向一致性。媒体偏好测试等待change事件及静帧稳定窗口；渲染器RAF和事件处理均可提交同一确定性静帧，避免matches先更新而change稍后派发时暂留中间帧。

预览服务当前为 http://127.0.0.1:8821/（/tmp/wf-lamb/after静态构建），最低版8823，关闭版8822。修改代码后须重新构建到对应目录；代码改动不支持热更新；滑块实时重绘。临时录制和编码工具在/tmp/wf-lamb，最终截图/视频/报告已入证据目录。

下一步根据用户视觉反馈调整，之后可归档；P4真实设备/跨引擎/辅助技术、CI浏览器门禁和发布契约仍未完成。不要把本机桌面CDP当作手机/Safari/Firefox验收，不提前声称可安装。

用户进一步要求临时控制面板自行微调，已完成 `docs/design/spikes/scene-tuner.html` 与 `scripts/preview-scene.mjs`。当前服务由该Node脚本提供（`--root /tmp/wf-lamb/after --port 8821`），调参入口 http://127.0.0.1:8821/tune/ 。15滑块加风向，覆盖溪流宽度/位置/曲线/浅岸/细波、草密度/高度/摆幅、共同风力/方向/周期、地平线/远近浓度。支持昼夜、1440/390真实iframe视口、仅景物/暂停、JSON复制/下载/校验导入/恢复与浏览器保存；14/14浏览器检查通过，报告与截图在证据tuner目录。原页面不输出工具，Hugo不发布工具。参数以带单位CSS变量JSON回传后，再同步tokens/DESIGN/sidecar及工具默认值；启动方式和参数单位见 `docs/design/spikes/scene-tuner.md`。

渲染器收到 `wf:scene-update` 后每帧合并输入再读令牌并重建缓存，保留当前风相位和24fps上限；初始布局尺寸尚未可用时由ResizeObserver补画。新一轮签名两版各38/38、fidelity各23/23、probe两档各9/9，场景4/4（邻近方向一致率97.8%–100%，草根零位移，reduce六秒零像素变化和零持续绘制），16页面截图无溢出/错误。最终同机10秒采200帧，绘制中位3.1ms、p95 3.5ms；跨设备性能仍未验证。

## 当前覆盖：用户回传参数与交叉水波

用户回传完整16项CSS参数，已按原值采纳，详见 `docs/design/evidence/resting-lamb-scene/crossing-waves/parameters.json`；D30 supersedes 以上段落的默认数值。当前26.5vw溪宽、55vh地平线、25px浅岸、0.4vh波幅、草密度1.45/高度1.3/摆幅12px，其余曲线/位置/风/浓度按JSON同步tokens、DESIGN、sidecar及调参页重置值。day/desktop仅是预览状态，主题默认auto保持。

水面平行条带的原因是旧光照投影几乎抵消一组方向波、另一组主导。现保留三方向与射线高度修正，频率降至旧海面1.8倍，平衡高度权重、错开相位，并用斜光与受控对比同时显示三组坡度。共同风场和固定岸线不变。相同参数的双尺寸昼夜静态前后对照、动态录像及本轮报告统一在 crossing-waves/；主证据目录的旧数值/截图为历史。

本轮验收：两版严格构建无WARN、资产门禁5/5、OpenSpec strict6/6、签名各38/38、调参15/15、四组场景可见性/静态偏好通过；性能中位5.1ms/p95 7.0ms（同机200帧，画面范围及草密度增加）。所有本轮证据见 crossing-waves/README.md。下一步由用户刷新当前预览检查水波观感，不自行归档/提交/推送。

## 当前覆盖：实站水面、清晰草叶与星空

上一批已由用户要求提交并推送为 `acc2297b`。本轮在其上实现用户新要求，未提交/推送。D31及DESIGN是当前材质契约，保留D30全部16项参数。实站昼夜参考截图仅在 `docs/design/reference/2026-10-21-landscape/`；没有读取/复制上游shader、样式或素材。

scene.js 用五尺度交叉波与局部坡面反射代替原三向平滑明暗；坐标沿河道中心弯曲，透视距离加时间偏移使水向近岸流动，竖屏横向尺度至少1避免平行条纹。统一风相位同时驱动草叶与水面。草为长短宽窄各异的尖端曲面，固定根部、远近排序；画布按CSS像素绘制至1440，水面另采样至等效视口900，24fps上限不变。确定性固定星点缓存于底图，夜间更明显；首页veil顶部透明、48vh完整保护、68vh淡出，阅读页径向veil不变。

证据以 `docs/design/evidence/resting-lamb-scene/natural-landscape/README.md` 为准：相同参数双尺寸昼夜前后对照、约9秒实速昼夜视频；双版严格构建、资产5项、OpenSpec6项、签名38/38、探针两档各9/9、调参15/15和画面4/4通过。草根固定，邻近方向一致率98.0%–99.8%，主句区域零可辨变化；reduce六秒零像素变化和零持续绘制。测试改为观测尖叶第一段曲线，未放宽强度阈值；首轮白天过深已降低绘制增益。最终同机200帧中位5.1ms/p95 5.3ms，不代表真机/跨引擎。

当前8821首页和/tune/已更新；代码变更仍须重建 `/tmp/wf-lamb/after`，调参可以实时重绘。下一步由用户查看水、草、天空的观感后反馈；不自行归档或发布。活动OpenSpec新增第7节已完成。
