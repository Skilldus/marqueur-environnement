# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # compile TypeScript entry points → dist/
yarn test           # run all tests once (Vitest + jsdom)
yarn test:watch     # tests in watch mode
yarn test:coverage  # coverage report
yarn package        # build + zip dist/ → extension.zip (Windows only)
```

Run a single test file:
```bash
yarn vitest run src/__tests__/options.test.ts
```

Run tests matching a name pattern:
```bash
yarn vitest run -t "exportRules"
```

## Architecture

This is a **Chrome Extension (Manifest V3)** built with Vite + TypeScript.

### Two compiled entry points (`src/` → `dist/`)

| Source | Output | Role |
|---|---|---|
| `src/content.ts` | `dist/content.js` | Content script injected on every page |
| `src/options.ts` | `dist/options.js` | Options page logic |

### Static assets (`public/` → `dist/` via Vite copy)

- `public/manifest.json` — declares permissions (`storage` only), entry points, icons
- `public/options.html` — options page; links `styles/options.css` and `options.js`
- `public/styles/banner.css` — injected into every page via manifest `content_scripts.css`
- `public/styles/options.css` — options page styles with light/dark theme via CSS custom properties

### Data flow

Rules are stored as `Rule[]` in `chrome.storage.sync` under the key `rules`.

**Content script** (`content.ts`): on page load, reads all rules from storage, iterates them in order, tests `window.location.href` against each rule's `pattern` (regex), injects the first match as a DOM banner and stops. Only one banner is ever shown per page.

**Options page** (`options.ts`): full CRUD for rules via `chrome.storage.sync`. The dark/light theme preference is stored separately in `localStorage` (key `theme`) and applied as `data-theme="dark"` on `<html>`. A small inline `<script>` in `options.html` reads localStorage before CSS loads to prevent flash.

### Shared types and utilities

- `src/types.ts` — `Rule`, `RulePosition`, `RuleSize` — the only shared module between the two entry points
- `src/utils.ts` — WCAG luminance/contrast helpers, position/size label helpers, `validateImportedRules` (used only by `options.ts`)

> Note: `getLuminance` / `getContrastTextColor` are intentionally duplicated in `content.ts` (content scripts cannot import from `utils.ts` after bundling would tree-shake it; keeping it self-contained avoids accidental coupling).

### Banner DOM structure

```
div.env-ribbon-wrapper.{position}.{size}   ← background color, fixed/relative positioning
  └── div.env-banner                        ← text color (auto black/white via WCAG contrast)
        └── span                            ← rule.label
```

Horizontal positions (`top`/`bottom`) are inserted into `document.body` as first/last child with `position: relative`. Corner positions (`top-left`, `top-right`, `bottom-left`, `bottom-right`) use `position: fixed` with CSS `rotate()` to create diagonal ribbon badges.

### Test setup

Tests use `jsdom` environment. `src/__tests__/setup.ts` stubs `chrome.storage.sync` and `URL.createObjectURL` as global side effects — it runs automatically when imported by test files.

`options.ts` queries DOM elements at **module load time** (top-level `document.getElementById` calls). Tests must therefore:
1. Set `document.body.innerHTML` with all required element IDs
2. Call `vi.resetModules()` to clear the module cache
3. Dynamically `await import("../options")` so the module runs against the fresh DOM

The `OPTIONS_HTML` fixture in `options.test.ts` must include every element ID that `options.ts` references at module scope.
