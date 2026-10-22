# Design

- 使用现有Node>=22/CDP和Chrome发现逻辑；Hugo固定0.168.0，构建WARN失败（REL-01/07/08）。
- exampleSite提供single/custom/disabled配置覆盖与独立minimal站点，CLI传theme和themesDir，不写主题默认菜单（CFG-05/11/15、CNT-19/21）。
- 完整fixture保留unused-template审计。只有首页的消费者不承诺使用所有模板，minimal不加printUnusedTemplates，其余警告仍失败；不伪造代码块以满足覆盖审计（TPL-14/15）。
- Node串行构建和执行测试，异步子进程保持本地HTTP服务可响应；结果保存在指定目录，发版前本地运行，失败即停止发布，不用重复尝试隐藏失败（D40：不再上传CI artifact）。软件WebGL仅用于功能验证，性能结论另行采样。
- 转场hook在pagereveal.ready结算时采集动画，测试等目标URL和ready/异常；保留动画名及520/220ms断言，不将超时或拒绝算通过。运动尖峰历史缺少稳定复现，保留原scene-visibility阈值并记录现状。

## Acceptance

五组消费者构建和61项资源/导航/降级/可访问树检查通过；完整浏览器套件本地通过并产出结果目录。流向检测只判定高置信度轨迹，至少覆盖80%采样；静帧和倒放反例必须失败。CI不执行浏览器套件（D40），远端build绿与本地套件通过分别记录，不得合并成"CI全绿"一句。用户明确只测Chrome，不开展其他浏览器或真机验证（D38）。
