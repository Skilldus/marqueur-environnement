# Environment Indicator

> Chrome and Firefox extension — Displays a colored banner on pages whose URL matches configurable rules.

[![Version](https://img.shields.io/github/v/tag/Skilldus/marqueur-environnement?label=version\&color=blue)](https://github.com/Skilldus/marqueur-environnement/releases)
[![CI](https://github.com/Skilldus/marqueur-environnement/actions/workflows/ci.yml/badge.svg)](https://github.com/Skilldus/marqueur-environnement/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome\&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-MV3-FF7139?logo=firefox\&logoColor=white)

---

## Features

- **Regex matching** — each rule tests `window.location.href`, the first match wins
- **6 positions** — full-width banner at top/bottom, or diagonal badge in any of the 4 corners
- **4 sizes** — small, medium, large, or custom dimensions (height + font size)
- **Free background color** with **automatic text contrast** (WCAG calculation)
- **Custom text color** to override the automatic contrast
- **Optional text border** for improved readability
- **Import / Export** rules as JSON
- **Light/dark theme** on the options page
- **Multilingual**: 🇫🇷 Français · 🇬🇧 English · 🇪🇸 Español · 🇩🇪 Deutsch · 🇧🇷 Português

---

## Installation

### Chrome

1. Download `extension-chrome.zip` from the [latest release](https://github.com/Skilldus/marqueur-environnement/releases/latest)
2. Extract the archive
3. Open `chrome://extensions` and enable **Developer mode**
4. Click **Load unpacked** and select the extracted folder

### Firefox

1. Download `extension-firefox.zip` from the [latest release](https://github.com/Skilldus/marqueur-environnement/releases/latest)
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** and select the zip file

---

## Configuration

Access the options via the extension icon → **Options** (or `chrome://extensions` → Details → Extension options).

### Creating a rule

| Field | Description |
|---|---|
| **Pattern** | Regular expression tested against the full URL (`window.location.href`) |
| **Label** | Text displayed in the banner (e.g. `DEV`, `STAGING`, `PROD`) |
| **Color** | Banner background color in hexadecimal |
| **Position** | `top` · `bottom` · `top-left` · `top-right` · `bottom-left` · `bottom-right` |
| **Size** | `small` · `medium` · `large` · `custom` (free height + font size) |
| **Text color** | Optional — overrides the automatic WCAG contrast |
| **Border** | Optional — adds an outline to the text |

Rules are evaluated **in order**: only the first match is displayed.

### Import / Export

The **Export** button generates a `rules.json` file. The **Import** button accepts that same format to restore or share a configuration.

---

## Development

### Prerequisites

- Node.js 22+
- Yarn

### Setup

```bash
git clone https://github.com/Skilldus/marqueur-environnement.git
cd marqueur-environnement
yarn install
```

### Commands

```bash
yarn build           # Compile TypeScript → dist/
yarn test            # Run all tests (Vitest + jsdom)
yarn test:watch      # Tests in watch mode
yarn test:coverage   # Coverage report
yarn package         # Build + zip Chrome  → extension.zip
yarn package:firefox # Build + zip Firefox → extension-firefox.zip
```

### Architecture

```
src/
├── content.ts      # Script injected on every page (reads rules + injects banner)
├── options.ts      # Options page (rule CRUD, import/export, theme)
├── types.ts        # Shared types: Rule, RulePosition, RuleSize
└── utils.ts        # WCAG helpers, import validation

public/
├── manifest.json   # Manifest V3 (Chrome + Firefox)
├── options.html    # Options page
├── styles/         # Banner + options CSS (light/dark theme)
├── icons/          # Icons 16/32/48/128 px
└── _locales/       # Translations (fr, en, es, de, pt_BR)
```

---

## Release

See [`docs/releases.md`](docs/releases.md) for the full process.

```bash
yarn release:minor   # 1.3.x → 1.4.0
yarn release:patch   # 1.4.0 → 1.4.1
yarn release:major   # 1.4.x → 2.0.0
```

Pushing a tag automatically triggers the CI, which creates the GitHub Release with `extension-chrome.zip` and `extension-firefox.zip` as attachments.

---

## License

[MIT](LICENSE)
