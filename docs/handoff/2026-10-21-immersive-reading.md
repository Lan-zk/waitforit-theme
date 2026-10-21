# 全高阅读、渐进模糊与安歇标识

日期：2026-10-21。接续content-taxonomy-review；用户在浏览器批注中提出七项视觉反馈，并明确要求牧羊杖光标与弱化滚动条。

## 已完成

- main改全高原生滚动，固定控件叠放，无页眉页脚硬分区；阅读列首尾四层渐进模糊和轻纸色混合，到边界退去。末段留白，键盘目标移入清晰区；装饰不拦截点击。
- 去掉双语经文标点并按句换行，中文加字距；默认页脚安歇/Rest一行；brand可覆盖，footer仅作可选补充。exampleSite删去旧夜邮品牌与重复footer覆盖，站点title保持虚构内容属性。
- 桌面标签紧凑、coarse44px，随笔分区中英说明段落删除；logo使用主题ink；原创牧羊杖亮暗SVG，hotspot(23,3)；主滚动条透明轨道与低对比thumb。
- D35追加，不改历史决策。DESIGN/sidecar同步；新增immersive-reading活动变更，三轮变更均未归档、未提交。
- 修改probe中用户明确替换的阅读矩形断言，并区分桌面文字标签与触屏目标；没有删除其余门禁或降低chrome要求。新增reading专项含真实像素对照。

## 验证与预览

严格构建0WARN、资产5/5、reading28/28、content116/116、1440/390探针各9/9、fidelity23/23、软件WebGL signature37/37。

本地预览 `http://127.0.0.1:1313/zh/`；重点检查 `/zh/blog/boundary-data/` 的中段与底部、`/zh/essays/` 的标签密度。可切换昼夜。已验证无JS和UI加载失败降级；Safari/Firefox/真机仍待P4。

截图、JSON、环境差异及命令：`docs/design/evidence/immersive-reading/README.md`。页面转场历史抖动未宣称解决；本轮没有改场景或转场代码。发布文档、CI浏览器门禁与真实设备矩阵仍属后续。
