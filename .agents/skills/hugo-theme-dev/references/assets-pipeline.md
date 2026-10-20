# 资源管线规则（assets / static / CSS / JS / 图像 / 字体）

**用途**：写 `assets/`、`layouts/_partials/head.html` 里的 CSS/JS 引用、`static/` 落盘文件、字体与图片处理时读本文件。基线 Hugo **v0.168.0**（2026-10-20）。标记含义见 `sources.md` §1。

## 1. `assets/` 与 `static/` 的根本区别

- **AST-01** `resources.Get` **只能**读 `assets/`（及 mount 到 `assets` 的目录）；`static/` 里的文件永远拿不到资源对象。⟦D⟧ SRC-70, SRC-83
- **AST-02** `assets/` 里的文件**不会自动发布**——只有在模板里调用 `.Permalink`、`.RelPermalink`、`.Publish` 才会写进 `public/`；`static/` 里的文件则被原样拷贝。
  - 后果：字体/图片只被 CSS `url()` 引用的写法在 Hugo Pipes 下**不会产出**，线上 404。⟦D⟧ SRC-70, SRC-83；⟦E⟧ 推断实现细节，见坑 2
- **AST-03** 管线以**整条链**为缓存键，链上任何参数变动都会重新生成、产生新哈希文件；旧文件留在 `public/` 需要 `--gc`/`--cleanDestinationDir` 清理。⟦D⟧ SRC-74, SRC-75；⟦I⟧ 缓存键机制

## 2. 读取与发布资源

- `resources.Get PATH`：精确路径（大小写敏感），目录用 `assets/` 相对路径。⟦D⟧ SRC-70
- `resources.GetMatch PATTERN` / `resources.Match`：glob（`images/*.{jpg,png}`）。⟦D⟧ SRC-71
- `resources.Copy TARGET RESOURCE`：改发布路径（常用于把指纹文件固定到某目录）。⟦D⟧ SRC-73
- `resources.Minify RESOURCE`：支持 CSS/JS/JSON/XML/SVG。⟦D⟧ SRC-74
- `resources.Fingerprint ALGORITHM RESOURCE`：返回带哈希文件名；`.Data.Integrity` 给出 SRI 字符串（`sha256-…`）。⟦D⟧ SRC-75
- **AST-04** 需要 subresource integrity 时：`integrity` 属性与 `crossorigin="anonymous"` 一起写，否则浏览器可能不校验/加载失败。⟦D⟧ SRC-75；⟦I⟧ 浏览器行为
- `resources.Concat TARGET RESOURCES...`：同媒体类型才能合并，**不会重写被合并文件里的 `url()`**（相对路径会断）。⟦D⟧ SRC-72
- `resources.PostProcess` 自 **v0.164.0 弃用**，改用 `templates.Defer`（渐进增强样式/脚本）；完整迁移规则属 U16。⟦D⟧ SRC-76
- `resources.GetRemote`：受 `security.http` 双重限制（URL 允许表 + 媒体类型），默认拒绝 IP/localhost 并校验解析地址；404 返回 **nil 而非错误**。主题**不要**在构建期抓远程资源。⟦D⟧ SRC-77, SRC-39

## 3. CSS 管线

- **AST-05** `resources.ToCSS` 已改名为 `css.Sass`（别名 `toCSS`），入参是资源，`transpiler` 可选 `libsass`（默认）或 `dartsass`。⟦D⟧ SRC-66
- **AST-06** `libsass` **只在 extended 版**可用，且官方称 "embedded LibSass was deprecated in v0.153.0 and will be removed in a future release"；`dartsass` 需要外部 `sass` 二进制（`security.exec.allow` 默认放行 `^(dart-)?sass$`）。⟦D⟧ SRC-66, SRC-91, SRC-39
- **AST-07** `css.PostCSS` **必须**有 Node 与 `npm` 安装的插件（`postcss.config.js`）；`security.node.permissions` 默认禁写盘。⟦D⟧ SRC-67, SRC-39
- **AST-08** CSS 里的 `url()` **不会被重写**：字体/图片写相对路径，指纹化 CSS 后路径依旧指向原位置。这是 Hugo 长期存在的限制（issue 仍 open），文档层面无明文承诺。⟦U⟧ SRC-201（U 项，落地时用实际产物验证）
- 推荐链（零外部依赖）：`resources.Get "css/x.css" | minify | fingerprint` + `.Data.Integrity`。⟦D⟧ SRC-70, SRC-74, SRC-75
- `@import` 不会自动内联；要单文件必须先合并（`resources.Concat`）或走 PostCSS 的 import 插件。⟦D⟧ SRC-72；⟦I⟧ 常见误解

## 4. JS 管线

- **AST-09** `js.Build` 内置 esbuild，**不需要 npm**；只有 `import` 落到 `node_modules` 时才需要安装依赖。⟦D⟧ SRC-69
- `js.Build` 默认生成 `assets/jsconfig.json`，可用 `build.noJSConfigInAssets = true` 关掉（站点配置，主题改不了）。⟦D⟧ SRC-69
- Babel/TailwindCSS 等更重的管线需要 Node 工具链；主题默认不引入。⟦D⟧ SRC-67

## 5. 图像处理

- **AST-10** 可处理格式：AVIF、BMP、GIF、JPEG、PNG、TIFF、WebP；**不支持** HEIC/HEIF、ICO、SVG（SVG 只能原样发布）。⟦D⟧ SRC-78
- 方法：`.Resize`、`.Fit`、`.Fill`、`.Process`（可串多个 filter）。`.Resize` 只改宽高，容易变形；等比裁切用 `.Fit`/`.Fill`。⟦D⟧ SRC-79, SRC-80
- **AST-11** EXIF 方向**不会**自动修正：`images.AutoOrient` 必须显式调用，且通常放在 filter 链首位。⟦D⟧ SRC-81
- **AST-12** 变换后的图像**不保留元数据**（EXIF/IPTC/XMP 丢失）。⟦D⟧ SRC-78
- `imaging` 段（站点配置）控制默认质量、锚点、处理格式；主题不能设置。⟦D⟧ SRC-82
- 构造成本高：主题只对 `exampleSite` 的 fixture 图片做处理，源图控制在小尺寸，CI 缓存 `resources/` 目录。⟦D⟧ SRC-78；⟦I⟧ 工程建议

## 6. 字体（本仓库关键决策）

- **AST-13** 二选一，语义不同：
  - `assets/fonts/x.woff2`：必须**显式发布**才产出，推荐写法：
    ```go-html-template
    {{ with resources.Get "fonts/newsreader-latin.woff2" }}
      {{ $f := . | fingerprint }}
      <link rel="preload" href="{{ $f.RelPermalink }}" as="font" type="font/woff2" crossorigin>
    {{ end }}
    ```
    好处：文件名带哈希、可长缓存、可在 head 里 preload。⟦D⟧ SRC-70, SRC-75
  - `static/fonts/x.woff2`：自动拷贝、可直接写 `/fonts/x.woff2`，但**没有哈希、没有资源对象、不能 fingerprint/verify**。⟦D⟧ SRC-83
- **AST-14** 本项目走 `assets/fonts` + 显式发布 + preload：字体是最大首屏阻塞资源，需要长缓存指纹（`docs/decisions.md` D9 只允许 OFL 字体，D12 工程化要求含指纹）。⟦D⟧ SRC-70, SRC-75；⟦I⟧ 方案取舍
- **AST-15** 字体 license 文件与字体同目录交付（OFL 要求保留版权声明），字体文件不得按 MIT 再许可（`CREDITS.md` 记录，见 D10）。⟦D⟧ 仓库决策
- 只 preload 首屏必需字重；其余用 `font-display: swap` 并在 CSS 里声明 `unicode-range` 子集（中文回退字体不 preload）。⟦I⟧ 性能建议

## 7. 可移植性矩阵（决定主题引入哪条管线）

| 方案 | 额外依赖 | 何时可用 | 本仓库 |
| --- | --- | --- | --- |
| assets CSS + minify + fingerprint + integrity | 无 | 任意 edition | **默认方案** |
| `js.Build` | 无（除非依赖 node_modules） | 任意 edition | 可用于渐进增强脚本 |
| `css.Sass` + libsass | **仅 extended 版** | 已废弃，未来移除 | 不用 |
| `css.Sass` + dartsass | 外部 `sass` 二进制 | 任意 edition（需装 sass） | 不用 |
| PostCSS / TailwindCSS / Babel | Node + npm 依赖 | 需站点装工具链 | 不用 |
| `resources.GetRemote` | 构建期网络 | 受 security 限制 | 不用（离线可构建是硬要求） |
| 图像处理 | CPU/内存 | 任意 edition | 只用于 exampleSite |

- **AST-16** 主题必须做到"克隆即构建"：不要求 extended、不要求 Node、不要求网络。⟦D⟧ SRC-91, SRC-67, SRC-69；⟦I⟧ 本仓库工程原则（D12）

## 8. 坑清单

| 症状 | 原因 | 规则 |
| --- | --- | --- |
| `resources.Get` 返回 nil | 文件在 `static/` 或路径大小写不符 | AST-01 |
| 字体/图片线上 404 | 只被 CSS `url()` 引用，没调用 `.RelPermalink` | AST-02, AST-08 |
| CSS 里 `url()` 路径破了 | 指纹/合并改变了文件位置，`url()` 不重写 | AST-08 |
| 字体在用户机器上变形 | 没 `AutoOrient` / 用了 `.Resize` 而非 `.Fit` | AST-10, AST-11 |
| 本地 extended 通过、CI 标准版失败 | 用了 libsass | AST-05, AST-06, AST-16 |
| SRI 不生效 | 缺 `crossorigin` 或 integrity 串写错 | AST-04 |
| 改了 CSS 但浏览器还是旧的 | 指纹链参数没变 / `public/` 残留 | AST-03 |
| 构建要联网 | 用了 `GetRemote` | AST-16, `resources.GetRemote` 段 |
| 生成了 `assets/jsconfig.json` | `js.Build` 默认行为 | AST-09 |

## 9. 本仓库要交付的资源清单（P2 落地）

- `assets/css/`：`tokens.css`（P1 产出，直接搬进主题）、`style.css`（或按层拆几个文件后 `resources.Concat`），单一入口在 `head.html` 里 `minify | fingerprint` 并输出 `integrity`。
- `assets/js/`：渐进增强（海面 Canvas、主题切换、View Transitions），用 `js.Build` 或直接 `resources.Get | minify | fingerprint`；无 JS 时正文可读。
- `assets/fonts/`：OFL 字体子集（Newsreader/Source Serif 4 + Commit Mono + Noto Serif SC 子集），每个字体配 license 文本；在 `head.html` preload 首屏字重。
- 不交付：`static/` 下的大文件（除非 `favicon` 这类不需要哈希的）、任何 WebGL shader、任何 Plantin/Departure Mono 字体（D9 硬边界）。
- 图片只出现在 `exampleSite/` 的 fixture 与 `docs/design/reference/`，不进发布产物。

## 10. 来源

`SRC-39`、`SRC-65`–`SRC-83`、`SRC-201`；实测部分依赖 `sources.md` 的 U8/U15 待补。URL 与未核实项见 `sources.md`。
