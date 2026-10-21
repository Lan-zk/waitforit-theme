---
name: "waitforit-theme"
description: "A letter-shaped Hugo theme. Paper light over a resting meadow, two OFL typefaces, one fixed frame, and a star that belongs to the pointer."
colors:
  ink: "#353431"
  muted-ink: "rgba(25, 24, 22, 0.6)"
  hairline: "rgba(39, 37, 34, 0.18)"
  paper: "#faf9f6"
  pure-white: "#ffffff"
  night-ink: "rgba(240, 240, 240, 0.8)"
  night-bright: "#ffffff"
  night-muted: "rgba(240, 240, 240, 0.6)"
  night-hairline: "rgba(244, 242, 238, 0.18)"
  night-paper: "#2e2d2b"
  moonlight: "rgba(255, 255, 255, 0.95)"
  chrome-scrim: "rgba(30, 30, 30, 0.95)"
  star-dark: "#1c1b1a"
typography:
  display:
    fontFamily: "'Newsreader', 'Noto Serif SC', 'Songti SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.25rem, 0.875rem + 1.5vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0"
  title:
    fontFamily: "'Newsreader', 'Noto Serif SC', 'Songti SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0"
  reading:
    fontFamily: "'Newsreader', 'Noto Serif SC', 'Songti SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  body:
    fontFamily: "'Commit Mono', 'Noto Sans Mono CJK SC', 'Sarasa Mono SC', ui-monospace, 'SFMono-Regular', Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  ui:
    fontFamily: "'Commit Mono', 'Noto Sans Mono CJK SC', 'Sarasa Mono SC', ui-monospace, 'SFMono-Regular', Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0"
  form:
    fontFamily: "'Commit Mono', 'Noto Sans Mono CJK SC', 'Sarasa Mono SC', ui-monospace, 'SFMono-Regular', Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "'Commit Mono', 'Noto Sans Mono CJK SC', 'Sarasa Mono SC', ui-monospace, 'SFMono-Regular', Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0"
  code:
    fontFamily: "'Commit Mono', 'Noto Sans Mono CJK SC', 'Sarasa Mono SC', ui-monospace, 'SFMono-Regular', Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.846
    letterSpacing: "0"
rounded:
  menu: "4px"
  key: "5px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  section: "24px"
  block: "28px"
  frame: "75px"
  page-top: "151px"
  page-bottom: "175px"
  horizon-gap: "2.5rem"
components:
  center-logo:
    width: "125px"
  corner-logo:
    width: "32px"
  menu-trigger:
    typography: "{typography.ui}"
    textColor: "{colors.moonlight}"
  nav-link:
    typography: "{typography.ui}"
    textColor: "{colors.moonlight}"
  nav-link-hover:
    textColor: "{colors.pure-white}"
  nav-star:
    width: "15px"
    height: "15px"
  theme-toggle:
    typography: "{typography.ui}"
    textColor: "{colors.moonlight}"
    padding: "6px 10px"
  lang-menu:
    backgroundColor: "{colors.chrome-scrim}"
    typography: "{typography.ui}"
    rounded: "{rounded.menu}"
    padding: "6px 0"
    width: "160px"
  lang-item:
    typography: "{typography.ui}"
    padding: "8px 16px"
  footer-mark:
    typography: "{typography.ui}"
    textColor: "{colors.moonlight}"
  letter-meta:
    typography: "{typography.body}"
    textColor: "{colors.ink}"
    padding: "0 0 24px"
  reading-body:
    typography: "{typography.reading}"
    textColor: "{colors.ink}"
    width: "760px"
  post-date:
    typography: "{typography.body}"
    textColor: "{colors.muted-ink}"
  post-title:
    typography: "{typography.title}"
    textColor: "{colors.ink}"
  disclosure:
    typography: "{typography.title}"
    textColor: "{colors.ink}"
    padding: "7px 0"
  disclosure-chevron:
    width: "7px"
    height: "7px"
  apply-link:
    typography: "{typography.label}"
    textColor: "{colors.ink}"
  email-input:
    typography: "{typography.form}"
    textColor: "{colors.ink}"
    backgroundColor: "transparent"
    padding: "0"
  code-block:
    typography: "{typography.code}"
    backgroundColor: "transparent"
    padding: "1.5rem 0"
  kbd:
    typography: "{typography.label}"
    rounded: "{rounded.key}"
---

# Design System: waitforit-theme

## Overview

**Creative North Star: "A Letter at Rest Beside Still Waters"**

waitforit-theme is a correspondence theme, not a product shell. Every page is a sheet of warm paper — a radial veil of `--wf-paper` — at rest beside a low meadow and a narrow stream: an original Canvas 2D landscape with fixed ground, wind-shaped grass and softly blended stream ripples, fading out where the paper becomes solid. A static grain tile sits between veil and frame. A fixed frame holds the only chrome a page ever gets: the brand emblem, the word MENU, a footer. Nothing scrolls but content. A post is a letter you received — Date, From, To, Subject set in mono above a serif reading column — and the site should read like the inside of an envelope, not the outside of an app.

The austerity is structural, not stylistic. Two OFL typefaces: Newsreader for the human voice, Commit Mono for the machine voice. Thirteen color tokens: paper and ink by day, their night counterparts under `[data-theme="night"]`, and one moonlight that must survive both lights. Two radii in the whole system: `4px` on the language menu, `5px` on a keycap. No card, no chip, no filled button, no accent hue. Depth is never faked with elevation: the scene sits under the veil, the veil under the grain, the grain under the frame, and that stack is the entire trick.

Motion is a small fixed vocabulary: pages arrive in 520ms and leave in 220ms, content enters in 300ms, the menu opens in 240ms and closes in 180ms, the theme cross-fades in 900ms while scene, veil, and grain change light together, and the subscribe line confirms in 720ms. Everything respects `prefers-reduced-motion` — every duration token becomes 0ms and the landscape freezes on its first frame — and nothing ever moves to attract attention.

**Key Characteristics:**
- Two typefaces only: Newsreader (OFL variable serif, true italic) for display, title, and reading; Commit Mono (OFL) for body, UI, form, label, and code.
- Thirteen color tokens: `paper` and `ink` by day, `night-paper` and `night-ink` by night, plus a muted ink, a hairline, and a `moonlight` that survives both lights.
- One brand emblem: the user-supplied silhouette. One interaction ornament: an original eight-ray four-point star, used as the cursor and a hover reward — never as static decoration and never as a bullet.
- One fixed frame (75px, 40px at ≤800px, 28px at ≤520px) around one centered column of `min(100%, 760px)`.
- Four stacked layers and no page background: scene, then veil, then grain, then frame.
- Letter-shaped content: posts open with a Date, From, To, Subject block in mono above a serif reading column.
- Quiet interaction instead of state chrome: dotted underlines turning solid, a 15px star revealed on hover, a 520ms page fade.
- A declared font deviation: Newsreader and Commit Mono replace the reference's Plantin Now and Departure Mono, and the two `--wf-font-*` variables are the only override point for a site that self-hosts its own pair.

## Colors

The palette is paper and ink under two lights: thirteen tokens, one moonlight, no third hue.

### Primary
- **Paper** (`#faf9f6`, `--wf-paper`): the color of the radial veil, the light that makes the reading surface, and the base of the day grain tile. It is painted as a shape, never as a solid body background.
- **Ink** (`#353431`, `--wf-ink`): body and heading text on paper, the day chrome, and the day star and cursor.

### Secondary
- **Muted ink** (`rgba(25, 24, 22, 0.6)`): dates, letter-meta keys, placeholders, and secondary chrome — ink at 60 percent.
- **Hairline** (`rgba(39, 37, 34, 0.18)`): the rule under a letter's meta block, the rules above and below code, and dividers.
- **Pure white** (`#ffffff`): the one-step brightening of chrome text on hover over the scene.
- **Chrome scrim** (`rgba(30, 30, 30, 0.95)`): the language menu surface over a 10px backdrop blur — the only floating surface in the system.

### Neutral
- **Night paper** (`#2e2d2b`): the night veil color and the base of the night grain tile.
- **Night ink** (`rgba(240, 240, 240, 0.8)`): night body text and the night chrome.
- **Night bright** (`#ffffff`): night headings, hovered links, and the selected language row.
- **Night muted** (`rgba(240, 240, 240, 0.6)`) and **night hairline** (`rgba(244, 242, 238, 0.18)`): the same quiet marks, inverted.
- **Moonlight** (`rgba(255, 255, 255, 0.95)`): chrome, footer, and the nav star over the scene; it must survive both a pale sky and a dark one, so it is white at 95 percent rather than a themed value.
- **Star dark** (`#1c1b1a`): the day star and cursor glyph, drawn in the ink it must be seen against rather than recolored with CSS filters.

Day and night are the same token roles under two lights, not two themes. Night swaps token values only — `--wf-ink` resolves to `--wf-night-ink`, `--wf-paper` to `--wf-night-paper`, the hairline to the night hairline, the star to `--wf-moonlight` — and the unthemed variables keep their value in both lights. Auto mode follows the system preference until the reader chooses an explicit light or night. Each token's canonical OKLCH value and an eight-step tonal ramp live in `.impeccable/design.json`; the hex and rgba values above are the browser-facing source, and `assets/css/tokens.css` — the stylesheet the theme actually loads — mirrors them one-for-one as `--wf-*` custom properties.

### Named Rules
**The Paper Is Not a Background Rule.** There is no page background color. The surface is a fixed radial ellipse of paper (`--wf-veil-size: 72% 115%`, centered at `50% 48%`, alpha 0.985 at the center falling to 0 at the 96 percent stop), painted over the live scene. Do not replace it with a solid fill: a solid `#faf9f6` body would hide the landscape and turn the design back into a white page.

## Typography

**Display Font:** Newsreader (OFL variable serif, opsz 6–72 and wght 200–800 axes, true italic; fallback chain `'Noto Serif SC', 'Songti SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif`).
**Body Font:** Newsreader at 18–20px for every reading surface; the reading column is the product.
**Label/Mono Font:** Commit Mono (OFL) for chrome, meta, forms, labels, and code; the CJK fallback chain is `'Noto Sans Mono CJK SC', 'Sarasa Mono SC'`, then `ui-monospace`.

**Character:** the theme keeps exactly two voices. Serif means a human speaking — display, titles, prose, values. Mono means a machine or a control speaking — menu, dates, forms, actions, code. The contrast between the two is the typographic idea; neither voice is substituted for the other within a phrase, and the one deviation from the reference's typography (Plantin Now and Departure Mono) is declared here rather than improvised later.

### Hierarchy
- **Display** (Newsreader 400 italic, `clamp(1.25rem, 0.875rem + 1.5vw, 2.5rem)`, 20 to 40px and frozen to `clamp(1.25rem, 0.75rem + 3vw, 2rem)` at ≤800px, line-height 1.15, centered, two lines maximum): the home hero sentence, and nothing else. Its first viewport is reserved for the sentence and meadow; article links remain reachable by native scrolling.
- **Title** (Newsreader 400 italic, `1.25rem`, line-height 1.15): page titles, post titles, and disclosure headings.
- **Reading** (Newsreader 400, `clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)`, 18 to 20px, line-height 1.6, measure 760px): post bodies and every long-form surface.
- **Body** (Commit Mono 400, `0.9375rem`, line-height 1.6): letter meta, post dates, captions, and letter footers.
- **UI** (Commit Mono 400, `0.9375rem`, line-height 1.25, uppercase): nav, footer, theme and language controls.
- **Form** (Commit Mono 400, `0.9375rem`, line-height 1.6): the subscribe input, the only form control on the site.
- **Label** (Commit Mono 400, `0.8125rem`, line-height 1.25, uppercase): action links such as APPLY, ATOM, and RSS, plus language codes and keycaps.
- **Code** (Commit Mono 400, `0.8125rem`, line-height 1.846): code blocks; no fill and no radius, only hairline rules above and below.

### Named Rules
**The Two Faces Rule.** Newsreader and Commit Mono are the only typefaces this theme may use; every other family in a stack is a glyph fallback, not a design decision. A new role is assigned to one of the two voices and never to a third family. The Resting Lamb landscape is an intentional change of scene meaning; typography remains Newsreader and Commit Mono, and a site choosing its own pair overrides `--wf-font-serif` and `--wf-font-mono` with its own self-hosted OFL pair; the font files themselves never enter this repository or its build output.

## Layout

The frame is fixed chrome and the content is a letter inside it. A 75px frame (`--wf-frame-block`) surrounds every page and does not move with the content; at ≤800px it drops to 40px and at ≤520px to 28px. Content begins `--wf-page-top` (151px, the frame plus 76px) from the top of the viewport and ends `--wf-page-bottom` (175px, the frame plus 100px) from the bottom, so the letter always has air above it and more air below.

The reading column is `min(100%, 760px)` (`--wf-measure`), 680px at ≤800px, and `min(680px, calc(100vw - 360px))` between 801px and 1100px. Three breakpoints carry the whole adaptation: **520px**, **800px**, and **1100px** (`--wf-bp-mobile`, `--wf-bp-tablet`, `--wf-bp-desktop` in the token file). Chrome is one row, not a nav bar: brand emblem at the start, MENU at the end, the locale and theme switches in the footer. Below 800px the menu becomes a full-screen paper panel, and every interactive target is at least 44px (`--wf-tap-target`).

Depth lives in the order of four layers, never in the content: the drawn scene at `--wf-z-scene` (0), the radial paper veil above it at `--wf-z-veil` (1), the 120px grain tile above that at `--wf-z-grain` (2), and the frame above everything at `--wf-z-frame` (3). On the home page the veil fades vertically below the hero to reveal the meadow; reading pages retain the radial protection. The veil's light center drops from `50% 48%` to `50% 40%` at ≤520px so small screens keep more meadow in view. The meadow's far edge is fixed at `--wf-horizon` (55vh), and the home hero is centered in the first reading viewport, with recent posts and extra content in the next scroll section.

Content keeps two structural sub-grids. A letter's meta block is `max-content 1fr` with a `1ch` column gap and a 6px (`--wf-space-xs`) row gap; a post row is the same two-column shape with the date in the first column. Both unwind to a single column at ≤520px. Interactive chrome uses logical properties (`padding-inline`, `margin-block`) so the frame survives a right-to-left locale without a second layout.

### Named Rules
**The Fixed Frame Rule.** The frame is chrome, not a container: it stays 75px, 40px, or 28px at the three breakpoints and content never paints over it. Nothing goes in the frame except the brand emblem, MENU, and the footer marks — no breadcrumbs, no progress bars, no floating buttons.

## Elevation & Depth

This system has no elevation. Nothing in content rises, floats, or casts a shadow: cards, dropdowns, and chips do not exist, and the only depth signal is the stack itself — meadow behind paper, paper behind grain, grain behind frame. If an element appears above another, it is because it belongs to a later layer, not because it has a larger shadow.

Three functional shadows exist in the whole theme, and none of them sits on a content surface. **Menu scrim** (`0 8px 32px rgba(0, 0, 0, 0.4)`) separates the language menu — the only true drop shadow in the system — from whatever it covers. **Sky-legibility** (`0 2px 8px rgba(0, 0, 0, 0.5)`) keeps the 404 line readable where it sits directly on the drawn scene instead of on the veil. **Keycap ring** (`0 0 0 1px rgb(28 27 26 / 10%), 0 3px 0 rgb(28 27 26 / 10%)`) is the only two-part shadow, and it draws `kbd` keycaps in prose. The sidecar's `extensions.shadows` records these three values because the frontmatter's component schema has no shadow property; they are still tokens, not one-off styling.

Opt-in cross-document transitions keep the frame and scene static while the reading surface exits upward over 220ms and enters from below over 520ms, using page motion tokens. Native links, fragment navigation and browser history own navigation and scroll restoration. Reduced motion disables the transition; unsupported browsers navigate normally.

The theme change is the one animation that touches depth: over 900ms (`--wf-motion-theme`) the scene, veil, grain, and chrome change light together, cross-fading as a single stack. Never fade them separately, and never animate the layer order.

### Named Rules
**The Stack Is the Depth Rule.** Depth comes from layer order, never from elevation on content: the scene under the veil, the veil under the grain, the grain under the frame. Content never floats, and no shadow may be added to a reading surface; the three functional shadows above are the whole vocabulary.

## Shapes

Everything is a right angle. The page, the veil's edge (a gradient with no border), the frame, hairlines, code blocks, and inputs are square by default, and zero is the assumed radius. The system rounds exactly two things: the language menu surface takes `4px` (`--wf-radius-menu`) because it floats over the scene and a hard corner would read as a cut in the page, and `kbd` takes `5px` (`--wf-radius-key`) because it is a physical key. Nothing else rounds — not buttons, not inputs, not code, not the letter.

The brand emblem is the user-supplied curled silhouette, with its three dark regions and curved negative spaces preserved in `assets/images/emblem.svg`. It inherits `currentColor`, keeps its 558:375 aspect ratio, and appears in the header, 404, favicon and default social image. The star remains the only interaction ornament: eight fixed rays on a 32-unit grid, a diamond core and a center point in `assets/images/star-*.svg`; it appears at 15px on links and as the day/night cursor. Neither mark rotates, gains a shadow or changes geometry.

The third shape language is the dotted underline. Links are underlined dotted at `0.06em` thickness and `0.14em` offset; on hover or focus the line becomes solid and the text brightens by one step. Focus rings belong to the same language: a 1px ring at a 3px offset (`--wf-focus-width`, `--wf-focus-offset`) in `currentColor`, visible on paper and on night. A 15px star may appear beside a hovered link after the hover duration, but it never spins continuously: no duration token exists for a spin, and motion without a token is not allowed.

### Named Rules
**The Rounded Corner Is a Signal Rule.** `4px` means this surface floats over the scene; `5px` means this is a key. No other value is allowed, and a rounded button, input, card, or code block is a defect rather than a variation. The star keeps its geometry in every use and is never recolored, cached, or restyled.

## Components

There are no cards, no chips, no filled buttons, and no accent. An action is text; hierarchy comes from position, from size, and from serif against mono. The sections below describe what may exist and how it looks; the nine `wf-` snippets with self-contained HTML and CSS live in `.impeccable/design.json`.

### Text and action links
A text link keeps the dotted underline of its paragraph and brightens to ink on hover, or to night-bright at night. An action link is the same gesture in mono label casing: uppercase, no fill, no border, followed by a 15px star that is revealed on hover or keyboard focus and marked `aria-hidden`.

### Chrome
The menu trigger is bare mono text — MENU — with `aria-expanded` and `aria-controls`; the panel is a right-aligned column of mono links that open in 240ms and close in 180ms, and below 800px it becomes a full-screen paper panel with 44px rows. The language menu is the only floating surface: 160px wide, chrome-scrim background over a 10px blur, `4px` radius, one menu-scrim shadow, mono rows at `8px 16px`, with the selected locale in night-bright. The theme switch is the same bare mono text with `6px 10px` of padding.

### The letter meta block
The signature of the post template: a mono definition list of Date, From, To, and Subject above the reading column. Keys are muted ink and values are ink, the grid is `max-content 1fr` with a `1ch` gap, and the block closes with a hairline 24px (`--wf-space-section`) below. It is the only place where keys and values sit side by side, and it reads as the inside of an envelope rather than as a form.

### Post row
A post row is one link with a date and a title. The date is mono body text in muted ink; the title is Newsreader italic at `1.25rem` in ink, with a 15px star revealed at its end on hover or focus. The row has two columns above 520px and one below, and the whole row is the click target.

### Disclosure
A disclosure is a `details` element with a serif title as its summary and a hairline chevron (`7px`) that turns 180 degrees over the hover duration when open. There is no card, no background, and no border on the body; the summary is a title, not a button, and it takes the focus ring like any other control.

### Subscribe line
The site's only form control: a borderless mono input that autosizes to its content with `field-sizing: content`, an `aria-label` instead of a visible label, and a return-key affordance revealed once the field is non-empty — there is no submit button, and Enter submits. Muted ink is reserved for the placeholder and the affordance; the typed text is ink. Keyboard focus shows the 1px ring at a 3px offset even though the reference relied on the caret alone, which is a deliberate accessibility improvement rather than a style choice.

### Code and keycaps
Code and keycaps are the only places the system admits a second surface. A code block is transparent with hairline rules above and below, mono at 13px on a 1.846 line, and no radius or inline padding. Its header has a language label and a localized text-only Copy control with a 44px hit target; success and failure are announced politely. Code alone scrolls horizontally. Syntax uses ink and muted ink, never accent colors. Copy preserves source whitespace and falls back to selection on failure. Without JavaScript the copy control is hidden. A keycap is a mono label at 13px on a `5px` radius with the two-part keycap ring; it never gets a fill, and the theme has no `kbd` surface in chrome, so keycaps exist only in prose.

### Signature: the resting meadow
The Canvas 2D scene is a low monochrome meadow beside a narrow stream, expressing the Resting Lamb emblem's repose, trust and humility. Ground, banks and grass roots stay fixed; middle and foreground grass bends in coherent patches while water highlights respond to the same traveling wind field. Deterministic geometry is shared by day and night; small screens reposition the stream rather than crop it away. The stream widens to about 26.5vw in the foreground. Its light and shade reuse the original sea’s three directional waves and analytic slopes. Three crossing wave families use balanced height weights (0.42/0.34/0.24), distinct phases and half the previous texture frequency; an oblique light with controlled contrast exposes all three slopes instead of suppressing one family into parallel bands. Both materials use one spatial gust field and one phase clock: wind bends rooted blades and modulates water advection and slope strength. A shallow-water crossfade and irregular, sparse overhanging bank grass replace the clean cut between materials; bank geometry and ground remain still. Cached static layers keep continuous drawing bounded at 640 internal pixels wide and 24 logical frames per second. No shader, external renderer or landscape image is used.

Scene tokens: `--wf-horizon: 55vh`, `--wf-scene-opacity-far: 0.13`, `--wf-scene-opacity-near: 0.3`, `--wf-grass-sway: 12px`, `--wf-motion-wind-cycle: 12s`, `--wf-shore-softness: 25px`, `--wf-stream-width: 26.5vw`, and `--wf-stream-amplitude: 0.4vh`. Stream geometry uses `--wf-stream-origin: 66.5%`, `--wf-stream-drift: 13.5%`, `--wf-stream-bend: 9.5%` and `--wf-stream-curve: 5.3` (radians over full depth); percentages are fractions of viewport width. Below 520px the origin shifts left 10 percentage points and bend scales by 4/3. `--wf-grass-density: 1.45`, `--wf-grass-height: 1.3` and `--wf-wind-strength: 1` are multipliers; `--wf-wind-direction: 1` means right and `-1` means left. A local-only tuning workbench changes these CSS tokens through a coalesced `wf:scene-update` event; it is served separately and never emitted by Hugo. The home veil fades from `48vh` to `68vh`; reading pages retain the central radial veil. Continuous motion is locally perceptible over six to eight seconds while the reading region stays still. Hidden/away pages stop drawing; reduced motion or save-data draws the deterministic first frame and stops the loop. Reduced motion also sets the shared wind cycle to zero. With no JS, unavailable Canvas or `features.scene=false`, paper, grain, content and navigation remain available; disabling the feature emits neither Canvas nor scene script.

### Social images
Default social images use the brand emblem and current page title, set in a centered serif composition on a textured paper base at 1200×630. Titles wrap by character-aware line budgets and shrink for long text; the full title remains in metadata. English uses Newsreader and Chinese uses Noto Serif SC. TrueType copies are build-only assets and are never web font downloads. A local per-page image override takes precedence.

### Snippet inventory
Nine `wf-` snippets ship in the sidecar, each self-contained HTML and CSS with `wf-` classes, unique ids, and no reset; every interactive snippet carries its own inline hover and focus-visible states, the four snippets that bear an icon inline their SVG so no icon font or sprite is needed, and Letter meta deliberately carries neither state nor graphic; Code block includes a localized text Copy action: Text link, Action link, Menu trigger + panel, Letter meta, Post row, Values disclosure, Subscribe line, Code block, Language menu. Three reference components are excluded on purpose. The Pi replay terminal is excluded because `pi-*` colors and a terminal card are a product UI outside this theme's scope. The keycap is excluded because it is documentation chrome for the reference's keyboard and this theme has no `kbd` surface in chrome, so keycaps remain a prose style only. The brand emblem and interaction star are excluded because they are assets — `assets/images/emblem.svg`, `assets/images/star-*.svg`, the cursors, and the favicon — governed by the color and shape rules rather than a component that can be pasted into a page.

### Named Rules
**The Bare Chrome Rule.** Every action is text: no fill, no border, no card, no chip, and no icon set. If an element cannot be expressed as a word, a dot underline, a hairline, or the star, or the brand emblem, it does not belong in this theme. Component snippets must stay paste-sized and self-contained, and any reference component that ships is a decision recorded with its reason in the snippet inventory.

## Do's and Don'ts

### Do:
- Keep the reading column at `min(100%, 760px)` and the serif at 18 to 20px; the letter is the product.
- Declare the font substitution in the repository: Newsreader and Commit Mono are the theme's only faces, and `--wf-font-serif` and `--wf-font-mono` are the only override point for a site that self-hosts its own OFL pair.
- Reserve Commit Mono for chrome, meta, forms, and code, and set every human voice in Newsreader.
- Express hierarchy with size, ink opacity between 60 and 80 percent, and hairlines, never with hue, weight, or fills.
- Use the dotted underline — `0.06em` thick at `0.14em` offset, solid on hover — plus a 15px star as the single interaction language for links.
- Let the scene, veil, and grain carry depth, and keep content surfaces flat and shadowless.
- Honour the duration tokens and `prefers-reduced-motion`: at reduce, every motion token is 0ms and the landscape freezes on its first frame.
- Ship a skip link and keep every chrome control reachable by keyboard and pointer, even though the reference site does not.

### Don't:
- Don't introduce a third typeface, and never let Plantin Now, Plantin, or Departure Mono into the repository or its build output; the only permitted deviation is the `--wf-font-*` override with self-hosted OFL faces.
- Don't introduce an accent hue, a card, a chip, a filled button, or a shadow beyond the three functional ones.
- Don't fake weight or slant: no `text-shadow` thickening and no synthetic italic; mono stays at its 400 token weight and serif emphasis uses Newsreader's true italic.
- Don't paint a solid page background or stack an opaque panel over the scene; the drawn landscape must stay visible outside the veil.
- Don't animate anything to draw attention — no pulses, no autoplay, no scroll-jacking; the only continuous motion is the grass tips and stream textures.
- Don't use the star as a static ornament, a bullet, or a decoration; lists mark items with the star glyph and the star asset belongs to the pointer and the chrome.
- Don't hardcode a token value in a template or a stylesheet; add the token first and consume it as `var(--wf-*)`, so a theme-wide change stays a one-file change.
- Don't copy the reference's known defects as patterns: the missing skip link, the English flash before client-side i18n, and the light-mode nav overlap are documented gaps, not design decisions.
