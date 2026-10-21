# Resting Lamb 本地调参

先构建虚构 exampleSite（AST-16、REL-07），再启动本地工具；不需要安装 Node 依赖。Hugo 命令以仓库根为工作目录，Node ≥22。

```bash
hugo --source exampleSite --themesDir ../.. --destination /tmp/wf-scene-preview \
  --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings
node scripts/preview-scene.mjs --root /tmp/wf-scene-preview --port 8821
```

打开 [调参页](http://127.0.0.1:8821/tune/)。服务只绑定 127.0.0.1；构建目录可替换。`/` 为正常主题页面，`/tune/` 只由本地工具提供，Hugo 构建不会发布工具。源码变更需重新构建；滑块变更即时重绘，无需构建。

调好后点“复制参数”，把完整 JSON 粘贴到聊天；也可下载 `resting-lamb-scene.json`。复制未获浏览器许可时会展开并选中 JSON，可手动复制。浏览器会保存上次参数；“恢复默认”清除参数改动。“查看 / 粘贴参数 JSON”可导入文字或文件，错误参数会拒绝并保留当前状态。

两档预览改变 iframe 的实际布局视口（1440×900、390×844），外部等比缩放只让页面放得下。“仅看景物”隐藏文字与框架，仍保留实际纸光和颗粒；“暂停观察”冻结当前相位，便于比较静态形状。这两个观察开关不写入导出参数。面板收起后预览随可用空间变大。系统减少动态效果或省流偏好优先，不强行播放。

| 参数 | 含义 / 单位 | 默认 |
| --- | --- | --- |
| stream-width | 前景完整水道宽度 / vw | 26.5 |
| stream-origin | 水道远端中心 / 视口宽度百分比 | 66.5% |
| stream-drift | 近端相对远端的横向偏移 / 视口宽度百分比 | 13.5% |
| stream-bend | 正弦弯曲幅度 / 视口宽度百分比 | 9.5% |
| stream-curve | 从远到近的正弦相位跨度 / 弧度，越大弯曲越多 | 5.3 |
| shore-softness | 前景浅岸过渡标称宽度 / CSS px，远处按深度收窄 | 25px |
| stream-amplitude | 波面起伏强度 / vh（0.4vh为材质基准） | 0.4 |
| grass-density / grass-height | 草叶数 / 草高的倍率 | 1.45 / 1.3 |
| grass-sway | 草梢摆动的标称幅度 / CSS px | 12px |
| wind-strength / wind-direction | 草水共用的风力倍率 / 方向（1向右，-1向左） | 1 / 1 |
| motion-wind-cycle | 基础风相位周期 / 秒，越长越慢 | 12s |
| horizon | 地平线距视口顶部 / vh | 55 |
| scene-opacity-far / scene-opacity-near | 远近景墨色强度，无单位 | 0.13 / 0.3 |

JSON 中键名均带 `--wf-` 前缀，数值为含单位字符串，以免回传歧义。手机沿用主题当前构图修正：远端左移10个百分点、弯曲幅度×4/3。风是连续变化的多频包络，12秒是基础相位周期，不代表整幅画面每12秒完全重复。极端参数可以让水道部分出画；回传前建议检查昼夜及两档尺寸。高草密度和更宽水面会增加绘制成本。

实现入口：`scene-tuner.html` 操作同源 iframe 的 CSS 变量，发送 `wf:scene-update`。渲染器每帧合并输入，重建固定几何与昼夜缓存；平时保留24fps上限。面板本身不改仓库默认文件，最终参数需要人工确认后写回 tokens / DESIGN / sidecar。

复跑工具验收：

```bash
node test/scene-tuner.mjs --url http://127.0.0.1:8821/tune/ --out /tmp/wf-scene-tuner
```
