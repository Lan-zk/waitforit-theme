---
title: "meadow-tiler"
description: "一块很小的 WebGL2 场地，在任何页面背后画出草地与一条窄溪。"
date: 2026-08-02
params:
  repo: "https://github.com/waitforit-example/meadow-tiler"
  demo: "https://example.com/meadow-tiler/"
---

单文件 WebGL2 渲染器：固定的地形、随风弯曲的草、一条窄溪，以及确定性的星点。它为这个主题的场景层而写，也作为独立模块发布。

渲染器在减少动效时保留烘焙好的静态帧，其余时候每秒绘制不超过 24 个逻辑帧。没有外部渲染器、shader 文件或图片。
