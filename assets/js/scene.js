/* 安歇草地与溪流：静态地形缓存、共用风场、尖叶、星点与浅水柔岸，24fps 上限；reduce/saveData/后台/离页暂停。 */
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
      ink: styles.getPropertyValue("--wf-scene-ink").trim(),
      night: mode === "night",
      sway: parseFloat(styles.getPropertyValue("--wf-grass-sway")),
      shore: parseFloat(styles.getPropertyValue("--wf-shore-softness")),
      origin: parseFloat(styles.getPropertyValue("--wf-stream-origin")) / 100,
      drift: parseFloat(styles.getPropertyValue("--wf-stream-drift")) / 100,
      bend: parseFloat(styles.getPropertyValue("--wf-stream-bend")) / 100,
      curve: parseFloat(styles.getPropertyValue("--wf-stream-curve")),
      density: parseFloat(styles.getPropertyValue("--wf-grass-density")),
      grassHeight: parseFloat(styles.getPropertyValue("--wf-grass-height")),
      windStrength: parseFloat(styles.getPropertyValue("--wf-wind-strength")),
      windDirection: parseFloat(styles.getPropertyValue("--wf-wind-direction")),
      streamWidth: parseFloat(styles.getPropertyValue("--wf-stream-width")) / 100,
      waterAmplitude: parseFloat(styles.getPropertyValue("--wf-stream-amplitude")) / 100,
      alphaFar: parseFloat(styles.getPropertyValue("--wf-scene-opacity-far")),
      alphaNear: parseFloat(styles.getPropertyValue("--wf-scene-opacity-near")),
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

  var buffers = [];
  var grass = [];
  var rippleField = null;
  var rippleStep = 1;
  var rippleWidth = 0;
  var rippleHeight = 0;
  var stars = [];
  var streamBounds = null;
  var streamPath = null;
  var width = 0;
  var height = 0;
  var cssWidth = 0;
  var cssHeight = 0;
  var scale = 1;
  var horizonY = 0;
  var small = false;

  function edge(x) {
    return horizonY + height * (Math.sin(x / width * 4.8 + 0.6) * 0.018 + Math.cos(x / width * 8.2) * 0.007);
  }

  function stream(depth) {
    return {
      x: width * (palettes.day.origin - (small ? 0.10 : 0) + depth * palettes.day.drift + Math.sin(depth * palettes.day.curve) * palettes.day.bend * (small ? 4 / 3 : 1)),
      y: horizonY + (height - horizonY) * depth,
      half: width * (0.0025 + palettes.day.streamWidth * 0.5 * Math.pow(Math.max(0, depth), 1.4)) * (1 + Math.sin(depth * 27) * 0.07 + Math.sin(depth * 61) * 0.035)
    };
  }

  function shoreWidth(depth) {
    return palettes.day.shore * scale * (0.3 + Math.max(0, depth) * 0.7);
  }

  function waterCoverage(x, depth, creek) {
    var shore = shoreWidth(depth);
    var irregularity = Math.sin(depth * 47 + x / width * 13) * 0.16 + Math.sin(depth * 119) * 0.08;
    var mix = Math.max(0, Math.min(1, (creek.half - Math.abs(x - creek.x)) / shore + 0.45 + irregularity));
    return mix * mix * (3 - 2 * mix);
  }

  // 同一阵沿地面经过的风：相邻草簇与水面共享方向、传播相位和强弱包络。
  function windAt(x, depth) {
    var travel = phase * palettes.day.windDirection - x * 2.6 + depth * 1.4;
    return palettes.day.windStrength * (0.18 + (0.5 + 0.5 * Math.sin(travel)) * (0.62 + 0.2 * Math.sin(travel * 0.47 + 0.8)) + 0.06 * Math.sin(travel * 1.8 + depth));
  }

  function buildGeometry() {
    var seed = 271021;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    stars = [];
    for (var star = 0; star < Math.round(cssWidth * cssHeight / 4200); star += 1) {
      stars.push({ x: random() * width, y: random() * horizonY * 0.9, radius: (0.45 + Math.pow(random(), 3) * 1.05) * scale, opacity: 0.25 + random() * 0.65 });
    }
    grass = [];
    // 同一份固定几何用于昼夜；只有草梢偏移，不在每帧重新抽样。
    var count = Math.round((small ? 2100 : 6500) * palettes.day.density);
    for (var i = 0; i < count; i += 1) {
      var x = random() * width;
      var depth = Math.pow(random(), 0.8);
      var y = edge(x) + (height - edge(x)) * depth;
      var creek = stream((y - horizonY) / (height - horizonY));
      var coverage = waterCoverage(x, (y - horizonY) / (height - horizonY), creek);
      if (coverage > 0.92 || random() < coverage * 0.78) {
        continue;
      }
      var patch = 0.5 + 0.25 * Math.sin(x / width * 23 + depth * 13) + 0.25 * Math.cos(x / width * 39 - depth * 17);
      if (random() > 0.35 + patch * 0.65) {
        continue;
      }
      grass.push({
        x: x, y: y, depth: depth,
        length: palettes.day.grassHeight * (2 + Math.pow(depth, 1.35) * 29) * scale * (0.4 + random() * 1.15),
        lean: (random() - 0.5) * 17 * scale * depth,
        breadth: (0.3 + random() * 0.65) * scale * (0.25 + depth),
        opacity: 0.28 + random() * 0.72,
        active: depth > 0.16
      });
    }
    // 贴岸草簇扎根于浅水过渡带，弯入水面，打断连续的清晰分界。
    var banks = Math.round((small ? 90 : 200) * palettes.day.density);
    for (var j = 0; j < banks; j += 1) {
      var d = 0.12 + random() * 0.88;
      var bank = stream(d);
      var side = j % 2 === 0 ? -1 : 1;
      if (random() > 0.45 + 0.4 * Math.sin(d * 18 + side * 0.7)) {
        continue;
      }
      var rootX = bank.x + side * (bank.half + (random() - 0.15) * shoreWidth(d));
      grass.push({
        x: rootX, y: bank.y, depth: d,
        length: palettes.day.grassHeight * (4 + d * 26) * scale * (0.7 + random() * 0.6),
        lean: -side * (3 + d * 7) * scale,
        breadth: (0.4 + random() * 0.7) * scale * (0.3 + d),
        opacity: 0.3 + random() * 0.45,
        active: true
      });
    }
    grass.sort(function (a, b) { return a.y - b.y; });
    var left = width;
    var right = 0;
    streamPath = new Path2D();
    for (var side = -1; side <= 1; side += 2) {
      for (var step = 0; step <= 100; step += 1) {
        var d = side === -1 ? step / 100 : 1 - step / 100;
        var p = stream(d);
        var px = p.x + (p.half + shoreWidth(d) * 0.8) * side;
        left = Math.min(left, px);
        right = Math.max(right, px);
        if (side === -1 && step === 0) {
          streamPath.moveTo(px, p.y);
        } else {
          streamPath.lineTo(px, p.y);
        }
      }
    }
    streamPath.closePath();
    left = Math.max(0, Math.min(width - 1, left));
    right = Math.max(left + 1, Math.min(width, right));
    streamBounds = { x: Math.floor(left), y: Math.floor(horizonY), width: Math.ceil(right) - Math.floor(left), height: height - Math.floor(horizonY) };
    // 水面单独采样；草叶和星点保留屏幕像素，不随水面缓冲放大。
    rippleStep = Math.max(1, width / 900);
    rippleWidth = Math.ceil(streamBounds.width / rippleStep);
    rippleHeight = Math.ceil(streamBounds.height / rippleStep);
    rippleField = new Float32Array(rippleWidth * rippleHeight);
  }

  function drawGrass(context, blade, colors, moving) {
    var depth = blade.depth;
    var strength = colors.alphaFar + (colors.alphaNear - colors.alphaFar) * depth;
    var footerFade = 1 - 0.65 * Math.exp(-Math.pow((blade.y / height - 0.90) / 0.07, 2));
    var wind = moving ? windAt(blade.x / width, depth) : 0;
    var sway = wind * palettes.day.windDirection * palettes.day.sway * scale * (0.35 + depth * 0.65);
    context.globalAlpha = strength * blade.opacity * footerFade * Math.min(1, depth * 8) * (moving ? 0.95 : 1);
    context.fillStyle = colors.ink;
    var tip = blade.x + blade.lean + sway;
    var top = blade.y - blade.length * (1 - wind * 0.1);
    var bend = blade.x + blade.lean * 0.18 + sway * 0.3;
    // 两条弧收拢为尖叶，根部有宽度；近景叶片更长，逐渐显出独立轮廓。
    context.beginPath();
    context.moveTo(blade.x, blade.y);
    context.quadraticCurveTo(bend, top + blade.length * 0.3, tip, top);
    context.quadraticCurveTo(bend + blade.breadth, top + blade.length * 0.48, blade.x + blade.breadth, blade.y);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
  }

  function cacheGround(target, colors) {
    var context = target.base.getContext("2d");
    var pixels = context.createImageData(width, height);
    context.fillStyle = colors.paper;
    context.fillRect(0, 0, 1, 1);
    var paper = context.getImageData(0, 0, 1, 1).data;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = colors.ink;
    context.fillRect(0, 0, 1, 1);
    var ink = context.getImageData(0, 0, 1, 1).data;
    colors.paperRGB = paper;
    colors.inkRGB = ink;

    // 地形明暗仅在尺寸改变时计算；水道两岸和远缘始终固定。
    for (var y = 0; y < height; y += 1) {
      var creek = stream(Math.max(0, (y - horizonY) / (height - horizonY)));
      for (var x = 0; x < width; x += 1) {
        var depth = Math.max(0, (y - edge(x)) / (height - edge(x)));
        var fog = 1 - Math.exp(-depth * 9);
        var strength = colors.alphaFar + (colors.alphaNear - colors.alphaFar) * depth;
        var fold = 0.34 + 0.12 * Math.sin(x / width * 7 + depth * 4) + 0.07 * Math.cos(x / width * 13 - depth * 6);
        var coverage = waterCoverage(x, Math.max(0, (y - horizonY) / (height - horizonY)), creek);
        var waterShade = 1 + (colors.night ? 0.28 : -0.10) * coverage;
        var shade = strength * fog * fold * waterShade * ink[3] / 255;
        var offset = (y * width + x) * 4;
        pixels.data[offset] = paper[0] + (ink[0] - paper[0]) * shade;
        pixels.data[offset + 1] = paper[1] + (ink[1] - paper[1]) * shade;
        pixels.data[offset + 2] = paper[2] + (ink[2] - paper[2]) * shade;
        pixels.data[offset + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    context.fillStyle = colors.ink;
    for (var star = 0; star < stars.length; star += 1) {
      var point = stars[star];
      context.globalAlpha = point.opacity * (colors.night ? 0.8 : 0.22);
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    for (var i = 0; i < grass.length; i += 1) {
      if (!grass[i].active) {
        drawGrass(context, grass[i], colors, false);
      }
    }
  }

  function prepare() {
    var nextCssWidth = scene.clientWidth;
    var nextCssHeight = scene.clientHeight;
    if (!nextCssWidth || !nextCssHeight) {
      return false;
    }
    if (nextCssWidth !== cssWidth || nextCssHeight !== cssHeight) {
      cssWidth = nextCssWidth;
      cssHeight = nextCssHeight;
      width = Math.min(1440, Math.round(cssWidth));
      height = Math.max(1, Math.round(width * cssHeight / cssWidth));
      scale = width / cssWidth;
      horizonY = height * palettes.day.horizon;
      small = cssWidth <= 520;
      buildGeometry();
      buffers = [];
      for (var i = 0; i < canvases.length; i += 1) {
        var canvas = canvases[i];
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        var base = document.createElement("canvas");
        base.width = width;
        base.height = height;
        if (!context || !base.getContext("2d")) {
          continue;
        }
        var colors = palettes[canvas.getAttribute("data-wf-canvas")];
        var ripples = document.createElement("canvas");
        ripples.width = rippleWidth;
        ripples.height = rippleHeight;
        var rippleContext = ripples.getContext("2d");
        if (!rippleContext) {
          continue;
        }
        var target = { canvas: canvas, context: context, base: base, colors: colors, ripples: ripples, rippleContext: rippleContext, pixels: rippleContext.createImageData(ripples.width, ripples.height) };
        cacheGround(target, colors);
        buffers.push(target);
      }
    }
    return buffers.length > 0;
  }

  function paintRipples() {
    var amplitude = palettes.day.waterAmplitude / 0.004;
    // 竖屏保持横向细节尺度，避免窄水道只截到平行波纹的一小段。
    var aspect = Math.max(1, width / height);
    var time = phase * palettes.day.windStrength;
    for (var y = 0; y < rippleHeight; y += 1) {
      var depth = Math.max(0, (y * rippleStep + streamBounds.y - horizonY) / (height - horizonY));
      var creek = stream(depth);
      var distance = 1.6 / (depth + 0.12);
      var wind = windAt(creek.x / width, depth);
      var force = amplitude * (0.65 + wind * 0.35);
      var flow = time * 0.16;
      // 透视距离向远处增大；加上时间偏移使等相位波脊向近岸移动。
      var z = distance + flow;
      var detail = Math.min(1, depth * 7);
      var start = Math.max(0, Math.floor((creek.x - creek.half - shoreWidth(depth) * 0.8 - streamBounds.x) / rippleStep));
      var end = Math.min(rippleWidth, Math.ceil((creek.x + creek.half + shoreWidth(depth) * 0.8 - streamBounds.x) / rippleStep));
      for (var x = start; x < end; x += 1) {
        // 随河道中心弯曲的透视坐标：水向近景流动，风在同一时钟上横向推动细波。
        var worldX = (x * rippleStep + streamBounds.x - creek.x) / width * aspect * distance;
        var drift = time * palettes.day.windDirection;
        var a = worldX * 9 + z * 18 - drift * 0.3;
        var b = worldX * -13 + z * 29 + drift * 0.23 + 1.7;
        var c = worldX * 21 + z * 47 - drift * 0.51 + 2.8;
        var warp = force * (Math.sin(a) * 0.42 + Math.sin(b) * 0.24);
        var ca = Math.cos(a + warp * distance * 0.35);
        var cb = Math.cos(b + warp * distance * 0.5);
        var cc = Math.cos(c + warp * distance * 0.7);
        var cd = Math.cos(worldX * -43 + z * 83 + warp * 2 - drift * 0.8);
        var ce = Math.cos(worldX * 71 + z * 143 + warp * 3 + drift * 0.65);
        var nx = force * (ca * 0.17 - cb * 0.18 + cc * 0.12 - cd * 0.055 * detail + ce * 0.025 * detail);
        var nz = force * (ca * 0.32 + cb * 0.23 + cc * 0.13 + cd * 0.075 * detail + ce * 0.035 * detail);
        // 以坡面朝向产生宽反射与窄波脊；高光只落在局部坡面，避免把每道波都描成等宽亮线。
        var facing = (nz * 0.92 + nx * 0.38) / Math.sqrt(1 + nx * nx + nz * nz);
        var reflection = Math.exp(-((nx - 0.08) * (nx - 0.08) * 30 + (nz - 0.22) * (nz - 0.22) * 38));
        var glint = Math.pow(reflection, 5) * (0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(b * 0.53 + c * 0.21)), 2));
        var shade = 0.46 + facing * 0.7 - reflection * reflection * 0.24 - glint * 0.3;
        rippleField[y * rippleWidth + x] = Math.max(0.015, Math.min(0.95, shade));
      }
    }

    for (var i = 0; i < buffers.length; i += 1) {
      var target = buffers[i];
      var colors = target.colors;
      var pixels = target.pixels.data;
      var paper = colors.paperRGB;
      var ink = colors.inkRGB;
      for (var py = 0; py < rippleHeight; py += 1) {
        var d = Math.max(0, (py * rippleStep + streamBounds.y - horizonY) / (height - horizonY));
        var p = stream(d);
        var strength = colors.alphaFar + (colors.alphaNear - colors.alphaFar) * Math.sqrt(d);
        var from = Math.max(0, Math.floor((p.x - p.half - shoreWidth(d) * 0.8 - streamBounds.x) / rippleStep));
        var to = Math.min(rippleWidth, Math.ceil((p.x + p.half + shoreWidth(d) * 0.8 - streamBounds.x) / rippleStep));
        for (var px = from; px < to; px += 1) {
          var index = py * rippleWidth + px;
          var field = rippleField[index];
          var shade = strength * (colors.night ? 0.03 + (1 - field) * 0.55 + Math.max(0, 0.3 - field) * 2.6 : field * 1.3) * ink[3] / 255;
          var offset = index * 4;
          var bankFade = waterCoverage(px * rippleStep + streamBounds.x, d, p);
          pixels[offset] = paper[0] + (ink[0] - paper[0]) * shade;
          pixels[offset + 1] = paper[1] + (ink[1] - paper[1]) * shade;
          pixels[offset + 2] = paper[2] + (ink[2] - paper[2]) * shade;
          pixels[offset + 3] = 255 * bankFade * (1 - Math.exp(-d * 10));
        }
      }
      target.rippleContext.putImageData(target.pixels, 0, 0);
    }
  }

  function paint() {
    if (!prepare()) {
      return;
    }
    paintRipples();
    for (var i = 0; i < buffers.length; i += 1) {
      var target = buffers[i];
      var context = target.context;
      var colors = target.colors;
      context.drawImage(target.base, 0, 0);
      context.save();
      context.clip(streamPath);
      context.drawImage(target.ripples, streamBounds.x, streamBounds.y, rippleWidth * rippleStep, rippleHeight * rippleStep);
      context.restore();
      for (var k = 0; k < grass.length; k += 1) {
        if (grass[k].active) {
          drawGrass(context, grass[k], colors, true);
        }
      }
    }
  }

  function paused() {
    return !buffers.length || away || document.hidden || reduceMotion.matches || (connection && connection.saveData) || !isFinite(cycleMs) || cycleMs <= 0;
  }

  function freezeMotion() {
    // 媒体查询的 matches 可先于 change 事件更新；RAF 与事件都能提交同一静帧。
    if ((reduceMotion.matches || (connection && connection.saveData)) && phase !== 0) {
      phase = 0;
      paint();
    }
  }

  function tick(now) {
    frame = null;
    if (paused()) {
      freezeMotion();
      return;
    }
    if (lastTime === null) {
      lastTime = now;
    }
    var elapsed = now - lastTime;
    if (elapsed >= interval) {
      // 时间步长封顶；从后台恢复时草梢与水纹平滑继续。
      var step = Math.min(elapsed, 100);
      if (cycleMs > 0) {
        phase += step * Math.PI * 2 / cycleMs;
      }
      lastTime = now;
      paint();
    }
    frame = window.requestAnimationFrame(tick);
  }

  function sync() {
    // 偏好切回正常时重新读取周期；reduce 下的 0ms 不缓存为永久静止。
    var cycleValue = window.getComputedStyle(document.documentElement).getPropertyValue("--wf-motion-wind-cycle").trim();
    cycleMs = parseFloat(cycleValue) * (/ms$/.test(cycleValue) ? 1 : 1000);
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }
    lastTime = null;
    freezeMotion();
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
    resizeTimer = window.setTimeout(function () {
      paint();
      sync();
    }, 150);
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", sync);
  }

  // 本地调参页只更新 CSS 令牌；合并同一帧内的滑块输入后重建缓存。
  var updateFrame = null;
  window.addEventListener("wf:scene-update", function () {
    if (updateFrame !== null) {
      return;
    }
    updateFrame = window.requestAnimationFrame(function () {
      updateFrame = null;
      palettes.day = readPalette("day");
      palettes.night = readPalette("night");
      cssWidth = 0;
      paint();
      sync();
    });
  });

  // 首次布局尚无尺寸时，在场景获得实际尺寸后补画；不启动空画布动画。
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      if (scene.clientWidth !== cssWidth || scene.clientHeight !== cssHeight) {
        paint();
        sync();
      }
    }).observe(scene);
  }

  paint();
  sync();
})();
