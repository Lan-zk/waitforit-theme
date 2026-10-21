# Credits

waitforit-theme is an original Hugo theme. Its visual language is inspired by the Earendil
site and its upstream repository. Theme code and copy are original; visual assets are
created for this repository or derived from the user-provided brand silhouette described
below. Third-party licenses and sources are recorded below. Nothing in
this file relicenses third-party work.

## Inspiration: Earendil

- Reference site: <https://earendil.com>
- Upstream repository: <https://github.com/earendil-works/website>, pinned at commit
  `31b1b04` (retrieved 2026-10-20; details and hashes in
  `docs/design/reference/upstream-pin.md`).
- Upstream license: Apache License 2.0. The upstream repository ships no `NOTICE` file and
  its source files carry no per-file copyright line; the Apache-2.0 text governs the
  reference repository only.
- What was referenced: the page structure, page types, interaction patterns, and the
  overall visual language, as recorded in `DESIGN.md` and
  `openspec/changes/design-contract/design.md`.
- What was not reused: no Earendil CSS, JavaScript, WebGL/GLSL shader code, copy, logo,
  image, SVG path data, or font bytes are included in this repository or in its build
  output. The comparison was structural only.
- The theme's WebGL2 scene renderer and its GLSL are original to this repository (D32);
  no upstream shader code was adapted, and the shaders stay inline in
  `assets/js/scene.js`.

## Fonts

The theme bundles Latin WOFF2 subsets of two SIL Open Font License families. The full
license text and copyright line for each family is shipped in `assets/fonts/` next to the
font files. The MIT license that covers this theme's source code does **not** apply to the
font files; the SIL Open Font License 1.1 governs them.

| Font | Role | Copyright holder | License | Shipped files |
| --- | --- | --- | --- | --- |
| Newsreader | Serif: display, title, reading | Copyright 2020 The Newsreader Project Authors (<http://github.com/productiontype/Newsreader>) | SIL Open Font License, Version 1.1 | `assets/fonts/newsreader-latin-var.woff2`, `assets/fonts/newsreader-italic-latin-var.woff2` |
| Commit Mono | Mono: body, ui, form, label, code | Copyright (c) 2023 Eigil Nikolajsen (<eigi0088@gmail.com>) | SIL Open Font License, Version 1.1 | `assets/fonts/commit-mono-400-latin.woff2`, `assets/fonts/commit-mono-700-latin.woff2` |

License texts:

- `assets/fonts/newsreader-OFL.txt` — the OFL 1.1 text with the Newsreader copyright line
  (4,394 bytes, SHA-256 `fdfad38143ec470553cae82a1e45320bdd1b9ec70415d37bd0171051d8a4ded8`).
- `assets/fonts/commit-mono-OFL.txt` — the OFL 1.1 text with the Commit Mono copyright line
  (4,360 bytes, SHA-256 `005e08f22d472be5139dcaf876dbed7ce8f17a501cd180c3259ad2aaf27237fe`).

### Newsreader

- Source: Google Fonts repository, directory `ofl/newsreader/`:
  <https://github.com/google/fonts/tree/main/ofl/newsreader>. The files used were
  `Newsreader[opsz,wght].ttf`, `Newsreader-Italic[opsz,wght].ttf`, and `OFL.txt`,
  retrieved on 2026-10-20.
- Upstream version: 1.003 (`name` table), variable font with axes `wght` 200-800 and
  `opsz` 6-72, including a true italic. Both axes are preserved in the subsets.
- Source SHA-256: upright
  `8a08d13f8a6c0d51be379a60af84f945f65369a67e509ee3c3bdcc421254d7c1`, italic
  `796668611f80b64d5adf182fde3b6f29ed83b4e7cbec7b96937e84ac01364792`.
- Subset SHA-256: upright
  `5a254819f3f3ce601359016c82c690419198a03446372f228e6be66961dd7763` (125,812 bytes),
  italic
  `b2705b8453f06e95c96d2908d245dee05d6609d480d7e85ed064c79b31111224` (140,676 bytes).

### Commit Mono

- Source: official release `v1.143` of <https://github.com/eigilnikolajsen/commit-mono>:
  release archive `CommitMono-1.143.zip`, using `CommitMono-1.143/CommitMono-400-Regular.otf`
  and `CommitMono-1.143/CommitMono-700-Regular.otf`, retrieved on 2026-10-20.
- Upstream version: 1.143. The release archive contains regular and italic OpenType
  (CFF) fonts; only the 400 and 700 upright faces are bundled.
- Source SHA-256: 400
  `a0031e19949b928b6ef749775fbd229adb43f4b96a30175d3098fa1fd92e58ee`, 700
  `658d3920e788196d6be9c4f444bb7c305acfbe3b247a527be1424af5ddc3ee6d`.
- Subset SHA-256: 400
  `4baaa6da8b79878519eab74c02f89b16f126f8699b212be4f3c4c0aa2b0b1984` (15,100 bytes),
  700
  `812f70c0845540a269afeda18c8bf09018cc2e6b94add80875cd2b4864dca860` (15,080 bytes).
- License text: the release archive's own `license.txt` contains the OFL 1.1 body but
  omits the copyright line, so `assets/fonts/commit-mono-OFL.txt` is taken from the
  repository file `LICENSE-FONT` (main branch), which includes both the copyright line and
  the full license text. The truncated 1,856-byte copy found in the upstream reference
  site's `_build/static/fonts/` was not used.

### Font subsetting

The four WOFF2 files were produced from the official sources above with fontTools
`pyftsubset` (fonttools 4.67.0, woff2 flavor) on 2026-10-20:

- Unicode coverage: the Google Fonts Latin set (`U+0000-00FF`, `U+0131`, `U+0152-0153`,
  `U+02BB-02BC`, `U+02C6`, `U+02DA`, `U+02DC`, `U+2000-206F`, `U+2074`, `U+20AC`,
  `U+2122`, `U+2191`, `U+2193`, `U+2212`, `U+2215`, `U+FEFF`, `U+FFFD`).
- Layout features retained: `ccmp, locl, mark, mkmk, rlig, clig, liga, calt, kern, vert`
  on all four files, plus `rvrn, tnum, ordn, sups` on the two Newsreader files. The
  full `--layout-features='*'` set would have pushed the four files to 331,016 bytes
  (over the 300 KB font budget); the trimmed set keeps kerning, ligatures, and both
  Newsreader variation axes.
- Total font payload: 296,668 bytes (≈289.7 KiB) across the four WOFF2 files, under the
  300 KB budget.
- CJK text is not bundled; it falls back to system fonts (`Noto Serif SC`,
  `Noto Sans Mono CJK SC`, etc.) as declared by `--wf-font-serif` / `--wf-font-mono`.

Plantin Now / Plantin MT Pro (commercial, site-only license) and Departure Mono (upstream
reference-site font) are **not** included in this repository or in its build output.

## Original theme assets

The four-point star SVGs, paper-grain PNGs, and cursors under `assets/` are
original works created for this theme. They contain no copied upstream path data or pixel
bytes; the comparison method and upstream pin are documented in
`docs/design/reference/upstream-pin.md`.

## Reference screenshots

Upstream comparison screenshots live only under `docs/design/reference/` (see
`docs/design/reference/baseline/` and `docs/design/reference/upstream-pin.md`). They are
reference artifacts for design review: they are not part of `assets/`, are not referenced
by templates, and never enter the theme's build output.

## Code license

The theme's source code is licensed under the MIT License; that license does not cover the
bundled font files, which remain under the SIL Open Font License 1.1 as described above.

## 用户提供的品牌轮廓（2026-10-21）

`assets/images/emblem.svg` 根据用户本轮提供图片的主体平面重绘，派生透明 PNG、favicon、Apple 图标与 OG。原始图片的第三方来源未提供；本记录仅说明输入与处理过程，不为来源或第三方权利作额外断言。处理证据见 `docs/design/evidence/p3-signature/logo.md`。

## Build-only social-image fonts (2026-10-21)

Hugo's native image renderer reads TrueType files from `assets/fonts/og/`; these are never published as web fonts. Browser font payload remains the four WOFF2 files above.

- `newsreader-400.ttf` (43,004 bytes, SHA-256 `1e1d930dd86f99b5d9480917f444afc9f18b7c71116ba9a557feb6bcbced70a5`) is derived from the existing licensed Latin Newsreader variable font at wght=400, opsz=72; 223 Unicode mappings retained. Covered by the Newsreader OFL text, also copied next to the build font as `assets/fonts/og/newsreader-OFL.txt`.
- `noto-serif-sc-400.ttf` (14,561,480 bytes, SHA-256 `fe51c9269e14d22c5964f5c235c8c7aec50be25483b5573da00caf4177d91057`) is a static wght=400 instance of Google Fonts' Noto Serif SC; all 30,928 source Unicode mappings are retained. Copyright 2012 Google Inc.; SIL OFL 1.1 is included as `assets/fonts/og/noto-serif-sc-OFL.txt`.
- Official source: <https://github.com/google/fonts/tree/main/ofl/notoserifsc>, font Git blob `eab063faf229160a52d3760f5555150e4eb9e5bf`, downloaded 2026-10-21. Source `NotoSerifSC[wght].ttf` SHA-256 `050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9`. FontTools 4.60.2 instanced the fonts, removed hinting, retained horizontal kerning and all source character mappings. No font conversion tool is needed by theme users.

The full Chinese face increases repository/build input size by about 14 MiB; it does not add a network request or font download to the reader's page. The MIT code license does not relicense these fonts.
