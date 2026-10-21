---
title: "meadow-tiler"
description: "A tiny WebGL2 field that draws a meadow and a narrow stream behind any page."
date: 2026-08-02
params:
  repo: "https://github.com/waitforit-example/meadow-tiler"
  demo: "https://example.com/meadow-tiler/"
---

A single-file WebGL2 renderer: fixed ground, wind-shaped grass, a narrow stream, and a deterministic star field. It was written for this theme's scene layer and is published as a standalone module.

The renderer keeps a static baked frame for reduced motion and draws at most 24 logical frames per second otherwise. No external renderer, shader file, or image is used.
