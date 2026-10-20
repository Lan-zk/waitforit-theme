/* 手绘海面（D5 / D8）：Canvas 2D 线场，四层表面的最底层。
 *
 * P2 只画静态首帧：day/night 两张画布各调用一次 draw(phase = 0)。
 * P3 把这里换成 requestAnimationFrame 循环并读 --wf-motion-* 即可，无需改标记与层级（D11 不返工约束）。
 * 颜色一律从令牌实读（--wf-paper / --wf-hairline / --wf-horizon），不写死任何值。 */
(function () {
  "use strict";

  var scene = document.querySelector(".wf-scene");
  if (!scene) {
    return;
  }
  var canvases = scene.querySelectorAll("[data-wf-canvas]");
  if (!canvases.length) {
    return;
  }
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function readPalette(mode) {
    var root = document.documentElement;
    var previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", mode);
    var styles = window.getComputedStyle(root);
    var palette = {
      hairline: styles.getPropertyValue("--wf-hairline").trim(),
      paper: styles.getPropertyValue("--wf-paper").trim(),
      horizon: parseFloat(styles.getPropertyValue("--wf-horizon")) / 100
    };
    if (previous) {
      root.setAttribute("data-theme", previous);
    } else {
      root.removeAttribute("data-theme");
    }
    return palette;
  }

  var palettes = {
    day: readPalette("day"),
    night: readPalette("night")
  };

  function draw(canvas, palette, phase) {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (!width || !height) {
      return;
    }
    if (canvas.width !== Math.round(width * DPR) || canvas.height !== Math.round(height * DPR)) {
      canvas.width = Math.round(width * DPR);
      canvas.height = Math.round(height * DPR);
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, width, height);

    var horizonY = height * (isFinite(palette.horizon) ? palette.horizon : 0.394309);
    var count = 18;
    var step = Math.max(6, Math.round(width / 220));
    ctx.strokeStyle = palette.hairline || palette.paper;
    ctx.lineWidth = 1;

    for (var i = 0; i < count; i += 1) {
      var t = i / (count - 1);
      var baseY = horizonY + Math.pow(t, 1.8) * (height - horizonY);
      var amplitude = 0.5 + Math.pow(t, 2.2) * (height * 0.012);
      var wavelength = width * (0.16 + t * 0.55);
      ctx.globalAlpha = 0.22 + t * 0.5;
      ctx.beginPath();
      for (var x = 0; x <= width; x += step) {
        var y =
          baseY +
          Math.sin((x / wavelength) * Math.PI * 2 + phase + t * 2.4) * amplitude +
          Math.sin((x / (wavelength * 0.41)) * Math.PI * 2 - phase * 0.5 + t * 5.1) * amplitude * 0.32;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function paint() {
    for (var i = 0; i < canvases.length; i += 1) {
      var canvas = canvases[i];
      var mode = canvas.getAttribute("data-wf-canvas");
      var palette = palettes[mode];
      if (palette) {
        draw(canvas, palette, 0);
      }
    }
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(paint, 150);
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", paint);
  }

  paint();
})();
