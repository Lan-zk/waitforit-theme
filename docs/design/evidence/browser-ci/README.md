# Chrome 自动验收与发布准备

日期：2026-10-21。用户限定只测试Chrome（D38），未开展其他浏览器或真机验收。

## 已完成

- `content-types`：17/17任务完成，三个主规范逐项比较后同步，删除旧信件要求；归档至 `openspec/changes/archive/2026-10-21-content-types/`。修正规范中“第一页不分页”为“只有一页才隐藏控件”，覆盖文案示例改用现存键，生产行为不变。后续三个视觉变更保持独立活动记录。
- 新增五组消费者构建：完整示例、单语、自定义菜单、最小站点、关闭scene/transitions。资源可达、六项导航、菜单整体替换、默认值、无JS和Chrome可访问树共61/61；独立复跑亦61/61。
- `results.json` 为完整本地入口结果：两档probe各9/9、home-controls12/12、content-boundaries116项、immersive-reading28/28、signature38/38、scene-visibility四组及上下文恢复、stream-flow四组全部通过。
- Hugo0.168.0严格构建0WARN，资产5/5，OpenSpec全部校验通过。最小消费者不执行“使用全部模板”的覆盖审计，仍保持其余WARN失败；完整fixture承担unused-template审计。
- 新工作流复用 `test/ci.mjs`，无运行时依赖，失败上传日志/JSON/截图，不自动重试。此处是本地运行证据；新配置尚未推送执行，不声明GitHub CI已绿。

## 测试抖动

首轮完整运行在水流轨迹方向断言失败，保留 `flow-before-fix.json/log`：1440夜色一处相关性0.658的模糊匹配跳到远处相似波形，被误判为反向。追踪算法原本允许20%高光失配，却仍对全部低置信度匹配判方向，两者不一致。

现在仅对相关性>0.80且高于原地相关性>0.03的轨迹判方向，同时仍要求至少80%采样有稳定对应。没有缩小搜索范围以排除反向。正向四组分别6/6、5/6、6/6、5/6稳定轨迹通过；静帧反例无有效移动，倒放反例的6条高置信度轨迹向上，二者均被拒绝。原始测量和反例在 `stream-flow-results.json`。

转场测试改为等待目标URL及 `pagereveal.viewTransition.ready`，记录ready拒绝原因，保留原动画名与520/220ms断言。两次完整签名采样均38/38；历史随机中止未再现，不能据此声称所有平台的转场问题已消失。草叶峰值64等scene-visibility原阈值不变。

转场事件与ready的用法核对 [Chrome官方文档](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document)。CI采用的Ubuntu24.04镜像内置Chrome，工作流输出实际版本，不把本地156视为远端版本，见 [GitHub镜像清单](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)。

## 当前电脑原生GPU采样

完整浏览器套件结束后单独采样10秒，结果为 `native-chrome-performance.json`：Chrome156、1440×813、Apple M4 Metal renderer、199逻辑帧，主线程每帧提交中位0.2ms/p95 0.3ms、无页面错误、长任务0。该耗时是JS提交，不是GPU计时，也不代表手机或其他电脑。当前保留内容页场景，不基于软件后端结果新增“仅首页动画”限制。

## 安装与发布边界

已补README、theme.toml（显示名waitforit）和Unreleased变更记录；首轮不投递主题目录。最小themesDir消费者及离线Go replace模块消费者均构建通过。另按README从远端获取eac4e4e，解析为 `v0.0.0-20261021151923-eac4e4eef70b`，新站严格构建通过，字体和样式发布、文档不进入产物；见 `install-pinned.json`。不引用尚不存在的tag。

本轮尚未提交、推送或发布首个tag。远端CI通过后再完成首轮版本发布；其他浏览器、真机和读屏软件属于明确未覆盖项，不阻塞这次用户限定的Chrome验收。

## 复跑

```bash
HUGO_BIN=/tmp/wf-hugo/v168/hugo WF_SOFTWARE_WEBGL=1 node test/ci.mjs --out /tmp/wf-browser-evidence
WF_NATIVE_GPU=1 node test/scene-performance.mjs --url http://127.0.0.1:1313/zh/ --out /tmp/wf-native-performance.json
node scripts/check-assets.mjs
openspec validate --all --strict
```
