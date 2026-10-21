/* 时间驱动海面：原创透视高度场，24fps 上限；reduce/saveData/后台/离页暂停。 */
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
  var connection = navigator.connection;
  var frame = null;
  var lastTime = null;
  var phase = 0;
  var away = false;
  var interval = 1000 / 24;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var cycleMs = 0;

  function readPalette(mode) {
    var root = document.documentElement;
    var previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", mode);
    var styles = window.getComputedStyle(root);
    var palette = {
      ink: styles.getPropertyValue("--wf-sea-ink").trim(),
      amplitude: parseFloat(styles.getPropertyValue("--wf-sea-amplitude")) / 100,
      alphaFar: parseFloat(styles.getPropertyValue("--wf-sea-opacity-far")),
      alphaNear: parseFloat(styles.getPropertyValue("--wf-sea-opacity-near")),
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

  var colorContext = document.createElement("canvas").getContext("2d");
  if (!colorContext) {
    return;
  }
  var buffers = [];
  var field = null;
  var fieldWidth = 0;
  var fieldHeight = 0;

  function rgba(color) {
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = color;
    colorContext.fillRect(0, 0, 1, 1);
    return colorContext.getImageData(0, 0, 1, 1).data;
  }

  Object.keys(palettes).forEach(function (mode) {
    palettes[mode].paperRGB = rgba(palettes[mode].paper);
    palettes[mode].inkRGB = rgba(palettes[mode].ink);
  });

  function prepare() {
    var width = scene.clientWidth;
    var height = scene.clientHeight;
    if (!width || !height) {
      return false;
    }
    // 限制内部采样量；同一份透视明暗场供双主题着色，避免两次计算波面。
    var nextWidth = Math.min(640, Math.max(240, Math.round(width * 0.65)));
    var nextHeight = Math.max(1, Math.round(nextWidth * height / width));
    if (nextWidth !== fieldWidth || nextHeight !== fieldHeight) {
      fieldWidth = nextWidth;
      fieldHeight = nextHeight;
      field = new Float32Array(fieldWidth * fieldHeight);
      buffers = [];
      for (var i = 0; i < canvases.length; i += 1) {
        var canvas = canvases[i];
        canvas.width = fieldWidth;
        canvas.height = fieldHeight;
        var context = canvas.getContext("2d");
        if (context) {
          buffers.push({ canvas: canvas, context: context, pixels: context.createImageData(fieldWidth, fieldHeight) });
        }
      }
    }
    return buffers.length > 0;
  }

  function paint() {
    if (!prepare()) {
      return;
    }
    var palette = palettes.day;
    var horizon = isFinite(palette.horizon) ? palette.horizon : 0.6;
    var horizonY = Math.round(fieldHeight * horizon);
    var seaHeight = fieldHeight - horizonY;
    var aspect = fieldWidth / fieldHeight;
    var amplitude = palette.amplitude * fieldHeight / seaHeight * 2;
    var index = 0;

    for (var y = 0; y < fieldHeight; y += 1) {
      if (y < horizonY) {
        var sky = palette.alphaFar * 0.65 * (1 - y / horizonY);
        for (var sx = 0; sx < fieldWidth; sx += 1) {
          field[index++] = sky;
        }
        continue;
      }
      var depth = (y - horizonY) / seaHeight;
      var distance = 2 / (depth + 0.02);
      var fog = 1 - Math.exp(-depth * 6);
      var detail = 1 / (1 + distance * 0.025);
      var strength = palette.alphaFar + (palette.alphaNear - palette.alphaFar) * Math.sqrt(depth);
      for (var x = 0; x < fieldWidth; x += 1) {
        var rayX = (x / fieldWidth - 0.5) * aspect * 1.15;
        var worldX = rayX * distance;
        var a = worldX * 3.1 + distance * 4.2 - phase;
        var b = worldX * -4.5 + distance * 7.2 + phase * 0.72;
        var c = worldX * 7.7 + distance * 2.8 - phase * 1.4;
        var height = amplitude * (Math.sin(a) * 0.6 + Math.sin(b) * 0.26 + Math.sin(c) * 0.14);
        // 一次射线高度修正产生近景起伏；解析坡度构成受光面与背光面。
        var z = distance * (1 - height / 1.5);
        worldX = rayX * z;
        a = worldX * 3.1 + z * 4.2 - phase;
        b = worldX * -4.5 + z * 7.2 + phase * 0.72;
        c = worldX * 7.7 + z * 2.8 - phase * 1.4;
        var ca = Math.cos(a);
        var cb = Math.cos(b);
        var cc = Math.cos(c);
        var slopeX = amplitude * (1.86 * ca - 1.17 * cb + 1.078 * cc);
        var slopeZ = amplitude * (2.52 * ca + 1.872 * cb + 0.392 * cc);
        var shadow = Math.max(0, Math.min(1, 0.48 + (slopeX * 1.8 - slopeZ * 1.4) * detail));
        field[index++] = strength * fog * (0.12 + shadow * 0.82);
      }
    }

    for (var i = 0; i < buffers.length; i += 1) {
      var target = buffers[i];
      var mode = target.canvas.getAttribute("data-wf-canvas");
      var colors = palettes[mode];
      var paper = colors.paperRGB;
      var ink = colors.inkRGB;
      var pixels = target.pixels.data;
      for (var pixel = 0; pixel < field.length; pixel += 1) {
        var shade = field[pixel] * ink[3] / 255;
        var offset = pixel * 4;
        pixels[offset] = paper[0] + (ink[0] - paper[0]) * shade;
        pixels[offset + 1] = paper[1] + (ink[1] - paper[1]) * shade;
        pixels[offset + 2] = paper[2] + (ink[2] - paper[2]) * shade;
        pixels[offset + 3] = 255;
      }
      target.context.putImageData(target.pixels, 0, 0);
    }
  }

  function paused() {
    return away || document.hidden || reduceMotion.matches || (connection && connection.saveData) || !isFinite(cycleMs) || cycleMs <= 0;
  }

  function tick(now) {
    frame = null;
    if (paused()) {
      return;
    }
    if (lastTime === null) {
      lastTime = now;
    }
    var elapsed = now - lastTime;
    if (elapsed >= interval) {
      // 限制恢复或长任务后的时间步长，避免海面突然跳跃。
      phase += Math.min(elapsed, 100) * Math.PI * 2 / cycleMs;
      lastTime = now;
      paint();
    }
    frame = window.requestAnimationFrame(tick);
  }

  function sync() {
    // 偏好切回正常时重新读取周期；reduce 下的 0ms 不缓存为永久静止。
    var cycleValue = window.getComputedStyle(document.documentElement).getPropertyValue("--wf-motion-sea-cycle").trim();
    cycleMs = parseFloat(cycleValue) * (/ms$/.test(cycleValue) ? 1 : 1000);
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }
    lastTime = null;
    if (reduceMotion.matches || (connection && connection.saveData)) {
      phase = 0;
      paint();
    }
    if (!paused()) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pagehide", function () {
    away = true;
    sync();
  });
  window.addEventListener("pageshow", function () {
    away = false;
    sync();
  });
  if (connection && connection.addEventListener) {
    connection.addEventListener("change", sync);
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(paint, 150);
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", sync);
  }

  paint();
  sync();
})();
