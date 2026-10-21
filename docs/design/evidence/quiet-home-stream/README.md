# 单屏首页、精简控件与溪流

2026-10-21；活动变更quiet-home-stream，决策D36/D37。截图使用虚构exampleSite。参考Earendil海面的层次与连续运动，不复制代码；实时参考标签两次读取超时，最终方向结合仓库参考图和用户提供截图。

## 结果

- 首页/控件12/12，1440/835/390：只有经文与出处，无第二屏，隐藏页脚标识，一个目标语言链接；当前译文/缺译文回退与无JS通过。单语/三语临时配置严格构建分别不输出切换/输出一个原生details。
- 阅读28/28、内容边界116/116、fidelity23/23、三档probe各9/9；这些UI结果在最终平流调整前采集，此后仅修改scene材质与文档。
- 最终材质visibility四组通过：水草局部变化、阅读中心变化0、根/静态地形不动、reduce像素变化0；丢上下文暂停且恢复后继续，无错误。
- `flow/results.json`：1440/390×昼夜，三帧两段、每段三个前景局部。24处最优位移全部向下游，22处归一化相关性>0.80且比原地相关性高>0.03；每组至少80%稳定轨迹。允许高光随坡面出现/消失，不要求整个图像刚性平移。纹理读回由测试hook完成，生产探针未新增接口。
- 最终签名回归37/37，Hugo0.168.0严格构建0WARN；资产5/5。未归档、未提交。

## 画面与局限

`before/`为本轮前、`after/`为最终材质，1440×900和390×844昼夜的确定性reduce首帧。`flow/*-water-0/1/2.png`为实际连续水面帧；`*-live.png`是同次运行的上下文截图，不与纹理帧精确同步。带透明区域的纹理不是最终合成画面。完整动画在本地预览验收。

渲染环境是Chrome156、SwiftShader，普通headless配置无WebGL，场景脚本需`WF_SOFTWARE_WEBGL=1`。同环境10秒采样，实际视口1440×813：逻辑帧97→93，主线程提交中位约0.1→0.1ms、p95约0.1→0.2ms，long tasks97→94。单次软件后端采样不支持真实GPU性能结论，也不宣称性能提升；源码仍有24fps上限、静态缓存和原水面采样预算。Safari/Firefox/真实设备仍待P4。

## 复跑

```bash
/tmp/wf-hugo/v168/hugo --source exampleSite --themesDir ../.. --panicOnWarning --printPathWarnings --printUnusedTemplates --printI18nWarnings --destination /tmp/wf-stream-after
node scripts/check-assets.mjs
node test/home-controls.mjs --url http://127.0.0.1:1313/ --out /tmp/wf-home-controls
WF_SOFTWARE_WEBGL=1 node test/scene-capture.mjs --url http://127.0.0.1:1313/zh/ --out /tmp/wf-stream-capture
WF_SOFTWARE_WEBGL=1 node test/stream-flow.mjs --url http://127.0.0.1:1313/zh/ --out /tmp/wf-stream-flow
WF_SOFTWARE_WEBGL=1 node test/scene-visibility.mjs --url http://127.0.0.1:1313/zh/ --out /tmp/wf-stream-visibility
WF_SOFTWARE_WEBGL=1 node test/scene-performance.mjs --url http://127.0.0.1:1313/zh/ --out /tmp/wf-stream-performance.json
```
