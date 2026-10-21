/* 安歇草地与溪流（WebGL2）：静态地形/星点/远景草一次烘焙，水面片元场与实例化草叶每逻辑帧绘制；
 * 24fps 上限；reduce/saveData/后台/离页暂停；双昼夜画布由 CSS 交叉淡化；无 WebGL2 时退回纸面。
 * 几何、风场、颜色与尺寸仍由 CSS 令牌与固定 PRNG 决定，数据源与 Canvas 2D 版本一致。 */
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
  var failed = false;
  var lost = false;
  var frameCount = 0;
  var staticBuilds = 0;
  var probeEnabled = /[?&]wf-scene-probe=1(?:&|$)/.test(window.location.search);
  var probeBlades = [];

  // ---------- 令牌与颜色 ----------
  function readPalette(mode) {
    var root = document.documentElement;
    var previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", mode);
    var styles = window.getComputedStyle(root);
    var palette = {
      ink: readColor("--wf-scene-ink"),
      paper: readColor("--wf-paper"),
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
      horizon: parseFloat(styles.getPropertyValue("--wf-horizon")) / 100
    };
    if (previous) {
      root.setAttribute("data-theme", previous);
    } else {
      root.removeAttribute("data-theme");
    }
    return palette;
  }

  // 用真实 CSS 颜色解析代替 1x1 Canvas 2D 取色；值为 computed color（rgb/rgba）。
  function readColor(token) {
    var element = document.createElement("span");
    element.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:0;height:0;color:var(" + token + ")";
    document.documentElement.appendChild(element);
    var value = window.getComputedStyle(element).color;
    document.documentElement.removeChild(element);
    var match = /rgba?\(([^)]+)\)/.exec(value);
    if (!match) {
      return [0, 0, 0, 1];
    }
    var parts = match[1].split(/[ ,/]+/).filter(function (part) { return part !== ""; }).map(parseFloat);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts.length > 3 ? parts[3] : 1];
  }

  var palettes = {
    day: readPalette("day"),
    night: readPalette("night")
  };

  // ---------- 几何（与 Canvas 2D 版本逐行一致） ----------
  var width = 0;
  var height = 0;
  var cssWidth = 0;
  var cssHeight = 0;
  var scale = 1;
  var horizonY = 0;
  var small = false;
  var stars = [];
  var staticBlades = [];
  var dynamicBlades = [];
  var streamBounds = null;
  var rippleStep = 1;
  var rippleWidth = 0;
  var rippleHeight = 0;
  var staticStars = null;
  var staticData = null;
  var dynamicData = null;
  var sizeDirty = true;

  function edge(x) {
    return horizonY + height * (Math.sin(x / width * 4.8 + 0.6) * 0.018 + Math.cos(x / width * 8.2) * 0.007);
  }

  function streamCreek(depth) {
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
    var grass = [];
    // 同一份固定几何用于昼夜；只有草梢偏移，不在每帧重新抽样。
    var count = Math.round((small ? 2100 : 6500) * palettes.day.density);
    for (var i = 0; i < count; i += 1) {
      var x = random() * width;
      var depth = Math.pow(random(), 0.8);
      var y = edge(x) + (height - edge(x)) * depth;
      var creek = streamCreek((y - horizonY) / (height - horizonY));
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
      var bank = streamCreek(d);
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
    for (var step = 0; step <= 100; step += 1) {
      var dd = step / 100;
      var p = streamCreek(dd);
      left = Math.min(left, p.x + (p.half + shoreWidth(dd) * 0.8) * -1);
      right = Math.max(right, p.x + (p.half + shoreWidth(dd) * 0.8));
    }
    left = Math.max(0, Math.min(width - 1, left));
    right = Math.max(left + 1, Math.min(width, right));
    streamBounds = { x: Math.floor(left), y: Math.floor(horizonY), width: Math.ceil(right) - Math.floor(left), height: height - Math.floor(horizonY) };
    rippleStep = Math.max(1, width / 900);
    rippleWidth = Math.ceil(streamBounds.width / rippleStep);
    rippleHeight = Math.ceil(streamBounds.height / rippleStep);

    staticBlades = [];
    dynamicBlades = [];
    for (var k = 0; k < grass.length; k += 1) {
      (grass[k].active ? dynamicBlades : staticBlades).push(grass[k]);
    }
    probeBlades = grass;
    staticStars = new Float32Array(stars.length * 4);
    for (var s = 0; s < stars.length; s += 1) {
      staticStars[s * 4] = stars[s].x;
      staticStars[s * 4 + 1] = stars[s].y;
      staticStars[s * 4 + 2] = stars[s].radius;
      staticStars[s * 4 + 3] = stars[s].opacity;
    }
    staticData = packBlades(staticBlades);
    dynamicData = packBlades(dynamicBlades);
  }

  function packBlades(blades) {
    var data = new Float32Array(blades.length * 7);
    for (var i = 0; i < blades.length; i += 1) {
      data[i * 7] = blades[i].x;
      data[i * 7 + 1] = blades[i].y;
      data[i * 7 + 2] = blades[i].depth;
      data[i * 7 + 3] = blades[i].length;
      data[i * 7 + 4] = blades[i].lean;
      data[i * 7 + 5] = blades[i].breadth;
      data[i * 7 + 6] = blades[i].opacity;
    }
    return data;
  }

  // ---------- GLSL ----------
  var COMMON = "precision highp float;\nuniform vec2 uSize;\nuniform float uHorizon;\nuniform float uOriginEff;\nuniform float uDrift;\nuniform float uBendEff;\nuniform float uCurve;\nuniform float uStreamWidth;\nuniform float uShoreScaled;\nvec3 creekAt(float d){ float halfW = uSize.x * (0.0025 + uStreamWidth * 0.5 * pow(max(0.0, d), 1.4)) * (1.0 + sin(d * 27.0) * 0.07 + sin(d * 61.0) * 0.035); return vec3(uSize.x * (uOriginEff + d * uDrift + sin(d * uCurve) * uBendEff), uHorizon + (uSize.y - uHorizon) * d, halfW); }\n";

  var VS_TERRAIN = "#version 300 es\n" +
    "void main(){ vec2 p[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0)); gl_Position = vec4(p[gl_VertexID], 0.0, 1.0); }";

  var FS_TERRAIN = "#version 300 es\n" + COMMON +
    "uniform vec3 uPaper;\nuniform vec3 uInk;\nuniform float uInkAlpha;\nuniform float uAlphaFar;\nuniform float uAlphaNear;\nuniform float uNight;\nout vec4 fragColor;\n" +
    "void main(){\n" +
    "  float px = floor(gl_FragCoord.x);\n" +
    "  float iy = uSize.y - 1.0 - floor(gl_FragCoord.y);\n" +
    "  float edgeY = uHorizon + uSize.y * (sin(px / uSize.x * 4.8 + 0.6) * 0.018 + cos(px / uSize.x * 8.2) * 0.007);\n" +
    "  float depth = max(0.0, (iy - edgeY) / (uSize.y - edgeY));\n" +
    "  float dd = max(0.0, (iy - uHorizon) / (uSize.y - uHorizon));\n" +
    "  vec3 creek = creekAt(dd);\n" +
    "  float fog = 1.0 - exp(-depth * 9.0);\n" +
    "  float strength = uAlphaFar + (uAlphaNear - uAlphaFar) * depth;\n" +
    "  float fold = 0.34 + 0.12 * sin(px / uSize.x * 7.0 + depth * 4.0) + 0.07 * cos(px / uSize.x * 13.0 - depth * 6.0);\n" +
    "  float shore = uShoreScaled * (0.3 + max(0.0, dd) * 0.7);\n" +
    "  float irr = sin(dd * 47.0 + px / uSize.x * 13.0) * 0.16 + sin(dd * 119.0) * 0.08;\n" +
    "  float mixv = clamp((creek.z - abs(px - creek.x)) / shore + 0.45 + irr, 0.0, 1.0);\n" +
    "  float coverage = mixv * mixv * (3.0 - 2.0 * mixv);\n" +
    "  float waterShade = 1.0 + mix(-0.10, 0.28, uNight) * coverage;\n" +
    "  float shade = strength * fog * fold * waterShade * uInkAlpha;\n" +
    "  fragColor = vec4(mix(uPaper, uInk, shade), 1.0);\n" +
    "}";

  var VS_STAR = "#version 300 es\n" +
    "layout(location = 0) in vec2 aCorner;\n" +
    "layout(location = 1) in vec4 aStar;\n" +
    "uniform vec2 uSize;\n" +
    "out vec2 vCenter;\n" +
    "out float vRadius;\n" +
    "out float vOpacity;\n" +
    "void main(){\n" +
    "  float reach = aStar.z + 1.0;\n" +
    "  vec2 pos = aStar.xy + aCorner * reach;\n" +
    "  gl_Position = vec4(pos.x / uSize.x * 2.0 - 1.0, 1.0 - pos.y / uSize.y * 2.0, 0.0, 1.0);\n" +
    "  vCenter = aStar.xy;\n" +
    "  vRadius = aStar.z;\n" +
    "  vOpacity = aStar.w;\n" +
    "}";

  var FS_STAR = "#version 300 es\nprecision highp float;\n" +
    "uniform vec2 uSize;\nuniform vec3 uInk;\nuniform float uInkAlpha;\nuniform float uNightFactor;\n" +
    "in vec2 vCenter;\nin float vRadius;\nin float vOpacity;\nout vec4 fragColor;\n" +
    "void main(){\n" +
    "  vec2 pix = vec2(floor(gl_FragCoord.x) + 0.5, uSize.y - 0.5 - floor(gl_FragCoord.y));\n" +
    "  float covered = 0.0;\n" +
    "  for (int j = 0; j < 4; j++) {\n" +
    "    for (int i = 0; i < 4; i++) {\n" +
    "      vec2 samplePos = pix - 0.5 + vec2((float(i) + 0.5) / 4.0, (float(j) + 0.5) / 4.0);\n" +
    "      covered += step(distance(samplePos, vCenter), vRadius);\n" +
    "    }\n" +
    "  }\n" +
    "  float alpha = vOpacity * uNightFactor * uInkAlpha * (covered / 16.0);\n" +
    "  if (alpha <= 0.0) { discard; }\n" +
    "  fragColor = vec4(uInk, alpha);\n" +
    "}";

  var VS_GRASS = "#version 300 es\nprecision highp float;\n" +
    "layout(location = 0) in vec2 aGeom;\n" +
    "layout(location = 1) in vec4 aBlade;\n" +
    "layout(location = 2) in vec3 aShape;\n" +
    "uniform vec2 uSize;\nuniform float uPhase;\nuniform float uWindStrength;\nuniform float uWindDirection;\nuniform float uSway;\nuniform float uScale;\nuniform float uAlphaFar;\nuniform float uAlphaNear;\nuniform float uMoving;\n" +
    "out float vAlpha;\n" +
    "vec2 bezier2(vec2 p0, vec2 p1, vec2 p2, float t){ float u = 1.0 - t; return u * u * p0 + 2.0 * u * t * p1 + t * t * p2; }\n" +
    "void main(){\n" +
    "  float depth = aBlade.z;\n" +
    "  float wind = 0.0;\n" +
    "  if (uMoving > 0.5) {\n" +
    "    float travel = uPhase * uWindDirection - (aBlade.x / uSize.x) * 2.6 + depth * 1.4;\n" +
    "    wind = uWindStrength * (0.18 + (0.5 + 0.5 * sin(travel)) * (0.62 + 0.2 * sin(travel * 0.47 + 0.8)) + 0.06 * sin(travel * 1.8 + depth));\n" +
    "  }\n" +
    "  float sway = wind * uWindDirection * uSway * uScale * (0.35 + depth * 0.65);\n" +
    "  float tip = aBlade.x + aShape.x + sway;\n" +
    "  float top = aBlade.y - aBlade.w * (1.0 - wind * 0.1);\n" +
    "  float bend = aBlade.x + aShape.x * 0.18 + sway * 0.3;\n" +
    "  vec2 p0 = vec2(aBlade.x, aBlade.y);\n" +
    "  vec2 c1 = vec2(bend, top + aBlade.w * 0.3);\n" +
    "  vec2 p2 = vec2(tip, top);\n" +
    "  vec2 c2 = vec2(bend + aShape.y, top + aBlade.w * 0.48);\n" +
    "  vec2 p3 = vec2(aBlade.x + aShape.y, aBlade.y);\n" +
    "  float t = aGeom.x;\n" +
    "  vec2 left = bezier2(p0, c1, p2, t);\n" +
    "  vec2 right = bezier2(p2, c2, p3, 1.0 - t);\n" +
    "  vec2 pos = aGeom.y < 0.5 ? left : right;\n" +
    "  float strength = uAlphaFar + (uAlphaNear - uAlphaFar) * depth;\n" +
    "  float footer = 1.0 - 0.65 * exp(-pow((aBlade.y / uSize.y - 0.90) / 0.07, 2.0));\n" +
    "  float gain = min(1.0, depth * 8.0);\n" +
    "  vAlpha = strength * aShape.z * footer * gain * (uMoving > 0.5 ? 0.95 : 1.0);\n" +
    "  gl_Position = vec4(pos.x / uSize.x * 2.0 - 1.0, 1.0 - pos.y / uSize.y * 2.0, 0.0, 1.0);\n" +
    "}";

  var FS_GRASS = "#version 300 es\nprecision highp float;\nuniform vec3 uInk;\nuniform float uInkAlpha;\nin float vAlpha;\nout vec4 fragColor;\nvoid main(){ fragColor = vec4(uInk, vAlpha * uInkAlpha); }";

  var VS_FULL = "#version 300 es\nvoid main(){ vec2 p[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0)); gl_Position = vec4(p[gl_VertexID], 0.0, 1.0); }";

  var FS_WATER = "#version 300 es\n" + COMMON +
    "uniform vec4 uBounds;\nuniform float uStep;\nuniform vec2 uRippleSize;\nuniform float uPhase;\nuniform float uWindStrength;\nuniform float uWindDirection;\nuniform float uAmplitude;\nuniform float uAspect;\nuniform float uAlphaFar;\nuniform float uAlphaNear;\nuniform float uNight;\nuniform vec3 uPaper;\nuniform vec3 uInk;\nuniform float uInkAlpha;\nout vec4 fragColor;\n" +
    "float windAt(float xn, float d){ float travel = uPhase * uWindDirection - xn * 2.6 + d * 1.4; return uWindStrength * (0.18 + (0.5 + 0.5 * sin(travel)) * (0.62 + 0.2 * sin(travel * 0.47 + 0.8)) + 0.06 * sin(travel * 1.8 + d)); }\n" +
    "void main(){\n" +
    "  float px = floor(gl_FragCoord.x);\n" +
    "  float rowY = uRippleSize.y - 1.0 - floor(gl_FragCoord.y);\n" +
    "  float depth = max(0.0, (rowY * uStep + uBounds.y - uHorizon) / (uSize.y - uHorizon));\n" +
    "  vec3 creek = creekAt(depth);\n" +
    "  float distanceToCreek = 1.6 / (depth + 0.12);\n" +
    "  float wind = windAt(creek.x / uSize.x, depth);\n" +
    "  float force = uAmplitude * (0.65 + wind * 0.35);\n" +
    "  float time = uPhase * uWindStrength;\n" +
    "  float flow = time * 0.16;\n" +
    "  float z = distanceToCreek + flow;\n" +
    "  float detail = min(1.0, depth * 7.0);\n" +
    "  float worldX = (px * uStep + uBounds.x - creek.x) / uSize.x * uAspect * distanceToCreek;\n" +
    "  float drift = time * uWindDirection;\n" +
    "  float a = worldX * 9.0 + z * 18.0 - drift * 0.3;\n" +
    "  float b = worldX * -13.0 + z * 29.0 + drift * 0.23 + 1.7;\n" +
    "  float c = worldX * 21.0 + z * 47.0 - drift * 0.51 + 2.8;\n" +
    "  float warp = force * (sin(a) * 0.42 + sin(b) * 0.24);\n" +
    "  float ca = cos(a + warp * distanceToCreek * 0.35);\n" +
    "  float cb = cos(b + warp * distanceToCreek * 0.5);\n" +
    "  float cc = cos(c + warp * distanceToCreek * 0.7);\n" +
    "  float cd = cos(worldX * -43.0 + z * 83.0 + warp * 2.0 - drift * 0.8);\n" +
    "  float ce = cos(worldX * 71.0 + z * 143.0 + warp * 3.0 + drift * 0.65);\n" +
    "  float nx = force * (ca * 0.17 - cb * 0.18 + cc * 0.12 - cd * 0.055 * detail + ce * 0.025 * detail);\n" +
    "  float nz = force * (ca * 0.32 + cb * 0.23 + cc * 0.13 + cd * 0.075 * detail + ce * 0.035 * detail);\n" +
    "  float facing = (nz * 0.92 + nx * 0.38) / sqrt(1.0 + nx * nx + nz * nz);\n" +
    "  float reflection = exp(-((nx - 0.08) * (nx - 0.08) * 30.0 + (nz - 0.22) * (nz - 0.22) * 38.0));\n" +
    "  float glint = pow(reflection, 5.0) * (0.35 + 0.65 * pow(max(0.0, sin(b * 0.53 + c * 0.21)), 2.0));\n" +
    "  float shade = 0.46 + facing * 0.7 - reflection * reflection * 0.24 - glint * 0.3;\n" +
    "  float fieldValue = max(0.015, min(0.95, shade));\n" +
    "  float strength = uAlphaFar + (uAlphaNear - uAlphaFar) * sqrt(depth);\n" +
    "  float themed = (uNight > 0.5) ? strength * (0.03 + (1.0 - fieldValue) * 0.55 + max(0.0, 0.3 - fieldValue) * 2.6) : strength * fieldValue * 1.3;\n" +
    "  float shore = uShoreScaled * (0.3 + max(0.0, depth) * 0.7);\n" +
    "  float irr = sin(depth * 47.0 + (px * uStep + uBounds.x) / uSize.x * 13.0) * 0.16 + sin(depth * 119.0) * 0.08;\n" +
    "  float mixv = clamp((creek.z - abs(px * uStep + uBounds.x - creek.x)) / shore + 0.45 + irr, 0.0, 1.0);\n" +
    "  float bankFade = mixv * mixv * (3.0 - 2.0 * mixv);\n" +
    "  float alpha = bankFade * (1.0 - exp(-depth * 10.0));\n" +
    "  vec3 color = mix(uPaper, uInk, themed * uInkAlpha);\n" +
    "  fragColor = vec4(color * alpha, alpha);\n" +
    "}";

  var VS_QUAD = "#version 300 es\nlayout(location = 0) in vec2 aPos;\nlayout(location = 1) in vec2 aUv;\nout vec2 vUv;\nvoid main(){ vUv = aUv; gl_Position = vec4(aPos, 0.0, 1.0); }";
  var FS_QUAD = "#version 300 es\nprecision highp float;\nuniform sampler2D uTex;\nin vec2 vUv;\nout vec4 fragColor;\nvoid main(){ fragColor = texture(uTex, vUv); }";

  var VS_WATERQUAD = "#version 300 es\nlayout(location = 0) in vec2 aCorner;\nuniform vec2 uSize;\nuniform vec4 uRect;\nuniform vec2 uRippleSize;\nout vec2 vUv;\nvoid main(){ vec2 pos = vec2(mix(uRect.x, uRect.z, aCorner.x), mix(uRect.w, uRect.y, aCorner.y)); vUv = aCorner; gl_Position = vec4(pos.x / uSize.x * 2.0 - 1.0, 1.0 - pos.y / uSize.y * 2.0, 0.0, 1.0); }";

  // ---------- 目标（每个主题一个上下文） ----------
  var targets = [];
  var BLADE_SEGMENTS = 12;
  var BLADE_VERTS = (BLADE_SEGMENTS + 1) * 2;
  var UNIFORM_NAMES = [
    "uSize", "uHorizon", "uOriginEff", "uDrift", "uBendEff", "uCurve", "uStreamWidth", "uShoreScaled",
    "uPaper", "uInk", "uInkAlpha", "uAlphaFar", "uAlphaNear", "uNight", "uNightFactor",
    "uPhase", "uWindStrength", "uWindDirection", "uSway", "uScale", "uMoving",
    "uBounds", "uStep", "uRippleSize", "uAmplitude", "uAspect", "uRect", "uTex"
  ];

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) {
      throw new Error("shader(" + (type === gl.VERTEX_SHADER ? "vs" : "fs") + "): createShader null");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("shader(" + (type === gl.VERTEX_SHADER ? "vs" : "fs") + "): " + (log || ("no-log lost=" + gl.isContextLost() + " len=" + source.length)));
    }
    return shader;
  }

  function createProgram(gl, vsSource, fsSource) {
    var vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("program: " + gl.getProgramInfoLog(program));
    }
    return program;
  }

  function setupPrograms(target) {
    var gl = target.gl;
    var programs = {
      terrain: createProgram(gl, VS_TERRAIN, FS_TERRAIN),
      star: createProgram(gl, VS_STAR, FS_STAR),
      grass: createProgram(gl, VS_GRASS, FS_GRASS),
      water: createProgram(gl, VS_FULL, FS_WATER),
      waterQuad: createProgram(gl, VS_WATERQUAD, FS_QUAD),
      quad: createProgram(gl, VS_QUAD, FS_QUAD)
    };
    target.programs = programs;
    target.uniforms = {};
    for (var name in programs) {
      if (!Object.prototype.hasOwnProperty.call(programs, name)) {
        continue;
      }
      var program = programs[name];
      var cache = {};
      for (var i = 0; i < UNIFORM_NAMES.length; i += 1) {
        cache[UNIFORM_NAMES[i]] = gl.getUniformLocation(program, UNIFORM_NAMES[i]);
      }
      target.uniforms[name] = cache;
      if (name === "quad" || name === "waterQuad") {
        gl.useProgram(program);
        gl.uniform1i(cache.uTex, name === "quad" ? 0 : 1);
      }
    }
    target.emptyVao = gl.createVertexArray();
    target.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, target.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1
    ]), gl.STATIC_DRAW);
    target.quadVao = gl.createVertexArray();
    gl.bindVertexArray(target.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, target.quadBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
    target.starQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, target.starQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    target.bladeGeomBuffer = gl.createBuffer();
    var geom = new Float32Array(BLADE_VERTS * 2);
    for (var seg = 0; seg <= BLADE_SEGMENTS; seg += 1) {
      var t = seg / BLADE_SEGMENTS;
      geom[(seg * 2) * 2] = t;
      geom[(seg * 2) * 2 + 1] = 0;
      geom[(seg * 2 + 1) * 2] = t;
      geom[(seg * 2 + 1) * 2 + 1] = 1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, target.bladeGeomBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geom, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return true;
  }

  function init() {
    for (var i = 0; i < canvases.length; i += 1) {
      var canvas = canvases[i];
      var kind = canvas.getAttribute("data-wf-canvas");
      if (kind !== "day" && kind !== "night") {
        continue;
      }
      var gl = canvas.getContext("webgl2", {
        alpha: true,
        // 草叶与静态层各自走离屏超采样/MSAA，默认帧缓冲无需再开 MSAA。
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "low-power"
      });
      if (!gl) {
        failed = true;
        return false;
      }
      var target = { canvas: canvas, kind: kind, gl: gl, palette: palettes[kind], ready: false, dirtyStatic: true, sizeDirty: true };
      try {
        setupPrograms(target);
      } catch (error) {
        if (probeEnabled) {
          window.wfSceneProbe = { error: "programs: " + (error && error.message ? error.message : String(error)) };
        }
        failed = true;
        return false;
      }
      target.ready = true;
      attachContextEvents(target);
      targets.push(target);
    }
    if (!targets.length) {
      failed = true;
      return false;
    }
    if (probeEnabled) {
      window.wfSceneProbe = {
        phase: function () { return phase; },
        frames: function () { return frameCount; },
        staticBuilds: function () { return staticBuilds; },
        blades: function () { return probeBlades.slice(); },
        tips: function () { return currentTips(); },
        // 只读诊断：把某一主题的静态底色纹理读回 PNG，供静态层像素对照。
        staticImage: function (kind) {
          var target = targets.filter(function (item) { return item.kind === (kind || "day"); })[0];
          if (!target || !target.staticResolveFbo) {
            return null;
          }
          var gl = target.gl;
          var pixels = new Uint8Array(width * height * 4);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.staticResolveFbo);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var context = canvas.getContext("2d");
          var image = context.createImageData(width, height);
          for (var y = 0; y < height; y += 1) {
            var source = (height - 1 - y) * width * 4;
            var destination = y * width * 4;
            for (var x = 0; x < width * 4; x += 1) {
              image.data[destination + x] = pixels[source + x];
            }
          }
          context.putImageData(image, 0, 0);
          return canvas.toDataURL("image/png");
        },
        ready: function () { return !failed && targets.every(function (target) { return target.ready; }); },
        debug: function () {
          return {
            staticBlades: staticBlades.length,
            dynamicBlades: dynamicBlades.length,
            width: width,
            height: height,
            targets: targets.map(function (target) {
              var attributes = target.gl.getContextAttributes();
              return {
                kind: target.kind,
                antialias: attributes.antialias,
                samples: target.samples,
                maxSamples: target.gl.getParameter(target.gl.MAX_SAMPLES),
                error: target.gl.getError()
              };
            })
          };
        }
      };
    }
    return true;
  }

  function attachContextEvents(target) {
    target.canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
      target.ready = false;
      lost = true;
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    }, false);
    target.canvas.addEventListener("webglcontextrestored", function () {
      lost = false;
      try {
        target.gl = target.canvas.getContext("webgl2");
        setupPrograms(target);
        target.ready = true;
        target.sizeDirty = true;
        target.dirtyStatic = true;
        paint();
        sync();
      } catch (error) {
        failed = true;
      }
    }, false);
  }

  function currentTips() {
    var tips = [];
    for (var i = 0; i < probeBlades.length; i += 1) {
      var blade = probeBlades[i];
      var wind = blade.active ? windAt(blade.x / width, blade.depth) : 0;
      var sway = wind * palettes.day.windDirection * palettes.day.sway * scale * (0.35 + blade.depth * 0.65);
      tips.push({
        x: blade.x,
        y: blade.y,
        tipX: blade.x + blade.lean + sway,
        tipY: blade.y - blade.length * (1 - wind * 0.1),
        depth: blade.depth,
        active: blade.active
      });
    }
    return tips;
  }

  // ---------- 尺寸相关资源 ----------
  function deleteSizeResources(target) {
    var gl = target.gl;
    if (target.staticMsFbo) { gl.deleteFramebuffer(target.staticMsFbo); target.staticMsFbo = null; }
    if (target.staticMsRb) { gl.deleteRenderbuffer(target.staticMsRb); target.staticMsRb = null; }
    if (target.staticResolveFbo) { gl.deleteFramebuffer(target.staticResolveFbo); target.staticResolveFbo = null; }
    if (target.staticTexture) { gl.deleteTexture(target.staticTexture); target.staticTexture = null; }
    if (target.waterFbo) { gl.deleteFramebuffer(target.waterFbo); target.waterFbo = null; }
    if (target.waterTexture) { gl.deleteTexture(target.waterTexture); target.waterTexture = null; }
    if (target.grassFbo) { gl.deleteFramebuffer(target.grassFbo); target.grassFbo = null; }
    if (target.grassTexture) { gl.deleteTexture(target.grassTexture); target.grassTexture = null; }
    if (target.starBuffer) { gl.deleteBuffer(target.starBuffer); target.starBuffer = null; }
    if (target.starVao) { gl.deleteVertexArray(target.starVao); target.starVao = null; }
    if (target.staticBuffer) { gl.deleteBuffer(target.staticBuffer); target.staticBuffer = null; }
    if (target.staticVao) { gl.deleteVertexArray(target.staticVao); target.staticVao = null; }
    if (target.dynamicBuffer) { gl.deleteBuffer(target.dynamicBuffer); target.dynamicBuffer = null; }
    if (target.dynamicVao) { gl.deleteVertexArray(target.dynamicVao); target.dynamicVao = null; }
  }

  function createTexture(gl, w, h, filter) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  function sizeResources(target) {
    var gl = target.gl;
    var samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0);
    target.samples = samples >= 2 ? samples : 0;
    target.staticTexture = createTexture(gl, width, height, gl.NEAREST);
    target.staticResolveFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.staticResolveFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.staticTexture, 0);

    target.waterTexture = createTexture(gl, rippleWidth, rippleHeight, gl.LINEAR);
    target.waterFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.waterFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.waterTexture, 0);

    // 草叶层：2× 离屏超采样，合成时按像素中心 LINEAR 降采样（P1 grass-aa spike 选型 C）。
    target.grassTexture = createTexture(gl, width * 2, height * 2, gl.LINEAR);
    target.grassFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.grassFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.grassTexture, 0);

    target.starBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, target.starBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, staticStars, gl.STATIC_DRAW);
    target.starVao = gl.createVertexArray();
    gl.bindVertexArray(target.starVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, target.starQuadBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, target.starBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);

    target.staticBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, target.staticBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, staticData, gl.STATIC_DRAW);
    target.staticVao = createBladeVao(gl, target, target.staticBuffer);
    target.dynamicBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, target.dynamicBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dynamicData, gl.STATIC_DRAW);
    target.dynamicVao = createBladeVao(gl, target, target.dynamicBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    target.sizeDirty = false;
    target.dirtyStatic = true;
  }

  function createBladeVao(gl, target, instanceBuffer) {
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, target.bladeGeomBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 28, 16);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);
    return vao;
  }

  // ---------- uniform 写入 ----------
  function uniformBase(target, programName) {
    var gl = target.gl;
    var u = target.uniforms[programName];
    var palette = target.palette;
    gl.useProgram(target.programs[programName]);
    gl.uniform2f(u.uSize, width, height);
    gl.uniform1f(u.uHorizon, horizonY);
    gl.uniform1f(u.uOriginEff, palette.origin - (small ? 0.10 : 0));
    gl.uniform1f(u.uDrift, palette.drift);
    gl.uniform1f(u.uBendEff, palette.bend * (small ? 4 / 3 : 1));
    gl.uniform1f(u.uCurve, palette.curve);
    gl.uniform1f(u.uStreamWidth, palette.streamWidth);
    gl.uniform1f(u.uShoreScaled, palette.shore * scale);
    return u;
  }

  function uniformPalette(target, programName) {
    var gl = target.gl;
    var u = uniformBase(target, programName);
    var palette = target.palette;
    gl.uniform3f(u.uPaper, palette.paper[0] / 255, palette.paper[1] / 255, palette.paper[2] / 255);
    gl.uniform3f(u.uInk, palette.ink[0] / 255, palette.ink[1] / 255, palette.ink[2] / 255);
    gl.uniform1f(u.uInkAlpha, palette.ink[3]);
    gl.uniform1f(u.uAlphaFar, palette.alphaFar);
    gl.uniform1f(u.uAlphaNear, palette.alphaNear);
    gl.uniform1f(u.uNight, palette.night ? 1 : 0);
    gl.uniform1f(u.uNightFactor, palette.night ? 0.8 : 0.22);
    return u;
  }

  // ---------- 烘焙与绘制 ----------
  function bakeStatic(target) {
    var gl = target.gl;
    // 静态层只在尺寸/令牌变化时重建；MSAA 缓冲按需创建并在解析后释放，避免常驻显存。
    if (!target.staticMsFbo) {
      target.staticMsFbo = gl.createFramebuffer();
      target.staticMsRb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, target.staticMsRb);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, target.samples || 0, gl.RGBA8, width, height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.staticMsFbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, target.staticMsRb);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.staticMsFbo);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.clearColor(target.palette.paper[0] / 255, target.palette.paper[1] / 255, target.palette.paper[2] / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(target.programs.terrain);
    uniformPalette(target, "terrain");
    gl.bindVertexArray(target.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var starU = uniformPalette(target, "star");
    gl.uniform1f(starU.uNightFactor, target.palette.night ? 0.8 : 0.22);
    gl.bindVertexArray(target.starVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, stars.length);

    var grassU = uniformBase(target, "grass");
    gl.uniform1f(grassU.uPhase, 0);
    gl.uniform1f(grassU.uWindStrength, palettes.day.windStrength);
    gl.uniform1f(grassU.uWindDirection, palettes.day.windDirection);
    gl.uniform1f(grassU.uSway, palettes.day.sway);
    gl.uniform1f(grassU.uScale, scale);
    gl.uniform1f(grassU.uAlphaFar, target.palette.alphaFar);
    gl.uniform1f(grassU.uAlphaNear, target.palette.alphaNear);
    gl.uniform1f(grassU.uMoving, 0);
    gl.uniform3f(grassU.uInk, target.palette.ink[0] / 255, target.palette.ink[1] / 255, target.palette.ink[2] / 255);
    gl.uniform1f(grassU.uInkAlpha, target.palette.ink[3]);
    gl.bindVertexArray(target.staticVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, BLADE_VERTS, staticBlades.length);

    gl.bindFramebuffer(gl.FRAMEBUFFER, target.staticResolveFbo);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.staticMsFbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, target.staticResolveFbo);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.deleteFramebuffer(target.staticMsFbo);
    target.staticMsFbo = null;
    gl.deleteRenderbuffer(target.staticMsRb);
    target.staticMsRb = null;
    gl.disable(gl.BLEND);
    target.dirtyStatic = false;
    staticBuilds += 1;
  }

  function renderWater(target) {
    var gl = target.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.waterFbo);
    gl.viewport(0, 0, rippleWidth, rippleHeight);
    gl.disable(gl.BLEND);
    var u = uniformPalette(target, "water");
    var palette = target.palette;
    gl.uniform1f(u.uPhase, phase);
    gl.uniform1f(u.uWindStrength, palettes.day.windStrength);
    gl.uniform1f(u.uWindDirection, palettes.day.windDirection);
    gl.uniform1f(u.uAmplitude, palettes.day.waterAmplitude / 0.004);
    gl.uniform1f(u.uAspect, Math.max(1, width / height));
    gl.uniform4f(u.uBounds, streamBounds.x, streamBounds.y, streamBounds.width, streamBounds.height);
    gl.uniform1f(u.uStep, rippleStep);
    gl.uniform2f(u.uRippleSize, rippleWidth, rippleHeight);
    gl.bindVertexArray(target.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function renderTarget(target) {
    var gl = target.gl;
    renderWater(target);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(target.programs.quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.staticTexture);
    gl.bindVertexArray(target.quadVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.enable(gl.BLEND);
    // 水面纹理按预乘 alpha 存储；LINEAR 在预乘空间插值，与 Canvas 2D drawImage 的放大一致。
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    var waterU = uniformBase(target, "waterQuad");
    gl.uniform4f(waterU.uRect, streamBounds.x, streamBounds.y, streamBounds.x + rippleWidth * rippleStep, streamBounds.y + rippleHeight * rippleStep);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, target.waterTexture);
    gl.bindVertexArray(target.quadVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // 草叶层：2× 离屏 FBO 超采样，合成时用 LINEAR 做 2×2 平均降采样（P1 grass-aa spike 选型 C）。
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.grassFbo);
    gl.viewport(0, 0, width * 2, height * 2);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    // 写入透明草层：颜色按直通 alpha 混合、alpha 通道单独按 (ONE, 1-a) 累计，
    // 否则 8-bit alpha 会被自身反复相乘（a²），合成后草叶显著变淡。
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    var grassU = uniformBase(target, "grass");
    gl.uniform1f(grassU.uPhase, phase);
    gl.uniform1f(grassU.uWindStrength, palettes.day.windStrength);
    gl.uniform1f(grassU.uWindDirection, palettes.day.windDirection);
    gl.uniform1f(grassU.uSway, palettes.day.sway);
    gl.uniform1f(grassU.uScale, scale);
    gl.uniform1f(grassU.uAlphaFar, target.palette.alphaFar);
    gl.uniform1f(grassU.uAlphaNear, target.palette.alphaNear);
    gl.uniform1f(grassU.uMoving, 1);
    gl.uniform3f(grassU.uInk, target.palette.ink[0] / 255, target.palette.ink[1] / 255, target.palette.ink[2] / 255);
    gl.uniform1f(grassU.uInkAlpha, target.palette.ink[3]);
    gl.bindVertexArray(target.dynamicVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, BLADE_VERTS, dynamicBlades.length);

    // 2× 草层（预乘 alpha）合成回主画布。
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    var grassComposite = uniformBase(target, "waterQuad");
    gl.uniform4f(grassComposite.uRect, 0, 0, width, height);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, target.grassTexture);
    gl.bindVertexArray(target.quadVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  // ---------- 生命周期 ----------
  function prepare() {
    if (failed || lost) {
      return false;
    }
    var nextCssWidth = scene.clientWidth;
    var nextCssHeight = scene.clientHeight;
    if (!nextCssWidth || !nextCssHeight) {
      return false;
    }
    var needsGeometry = nextCssWidth !== cssWidth || nextCssHeight !== cssHeight;
    if (needsGeometry) {
      cssWidth = nextCssWidth;
      cssHeight = nextCssHeight;
      width = Math.min(1440, Math.round(cssWidth));
      height = Math.max(1, Math.round(width * cssHeight / cssWidth));
      scale = width / cssWidth;
      horizonY = height * palettes.day.horizon;
      small = cssWidth <= 520;
      buildGeometry();
      for (var i = 0; i < targets.length; i += 1) {
        targets[i].sizeDirty = true;
        targets[i].dirtyStatic = true;
      }
    }
    for (var j = 0; j < targets.length; j += 1) {
      var target = targets[j];
      if (!target.ready) {
        return false;
      }
      target.palette = palettes[target.kind];
      if (target.sizeDirty) {
        target.canvas.width = width;
        target.canvas.height = height;
        deleteSizeResources(target);
        sizeResources(target);
        target.dirtyStatic = true;
      }
    }
    return targets.length > 0;
  }

  function paint() {
    if (!prepare()) {
      return;
    }
    for (var i = 0; i < targets.length; i += 1) {
      var target = targets[i];
      if (target.dirtyStatic) {
        bakeStatic(target);
      }
      renderTarget(target);
    }
    frameCount += 1;
  }

  function paused() {
    return failed || lost || !targets.length || away || document.hidden || reduceMotion.matches || (connection && connection.saveData) || !isFinite(cycleMs) || cycleMs <= 0;
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

  try {
    if (!init()) {
      failed = true;
      return;
    }
    paint();
    sync();
  } catch (error) {
    // 上下文创建或着色器失败时退回纸面：不启动 RAF，也不向控制台报错。
    if (probeEnabled) {
      window.wfSceneProbe = window.wfSceneProbe || { error: "init: " + (error && error.message ? error.message : String(error)) };
    }
    failed = true;
  }
})();
