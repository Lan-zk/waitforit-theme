# 品牌轮廓处理

输入：用户于本轮提供的 `codex-clipboard-04921316-a529-4e5f-ba28-2f559142b22e.png`。仅提取主体，不保留白底、留白或纸纹。未对原图第三方来源/许可作额外推断。

先使用内置 imagegen（非 CLI）进行 background-extraction，两次输出未达到干净平面标志要求，未进入发布资产。最终按原图三块深色区域与负形，以贝塞尔路径整理 `assets/images/emblem.svg`；是轮廓的平面重绘，并非逐像素无损转换。统一 `currentColor`，558:375 比例；星形保留为交互装饰。

最终提取提示：`Precisely extract the black symbol from this input. Flat opaque BLACK silhouette, transparent background, NO glow NO shadow NO blur NO texture NO gradients. All three black regions must be 100% opaque with clean sharp edges. White becomes completely transparent including internal white cut-outs. Preserve the exact original outline. The logo fills canvas with 5% margin. This is a clean flat logo cutout, NOT an artistic interpretation.`

发布资产：`assets/images/emblem.svg`（主文件）、`emblem.png`（558×375 透明预览）、昼夜 favicon、180×180 apple-touch-icon、1200×630 og-default.png。PNG 由 `node scripts/render-brand.mjs` 从原生 SVG/HTML 经 Chrome 栅格化预生成；用户 Hugo 构建无此依赖。
