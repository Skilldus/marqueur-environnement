# Indicateur d'Environnement

> Extension Chrome et Firefox — Affiche un bandeau coloré sur les pages dont l'URL correspond à des règles configurables.

[![Version](https://img.shields.io/github/v/tag/Skilldus/marqueur-environnement?label=version\&color=blue)](https://github.com/Skilldus/marqueur-environnement/releases)
[![CI](https://github.com/Skilldus/marqueur-environnement/actions/workflows/ci.yml/badge.svg)](https://github.com/Skilldus/marqueur-environnement/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome\&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-MV3-FF7139?logo=firefox\&logoColor=white)

---

## Fonctionnalités

- **Détection par regex** — chaque règle teste `window.location.href`, la première correspondance gagne
- **6 positions** — bandeau pleine largeur en haut/bas, ou badge diagonal dans les 4 coins
- **4 tailles** — petite, moyenne, grande, ou dimensions personnalisées (hauteur + taille de police)
- **Couleur de fond** libre avec **contraste texte automatique** (calcul WCAG)
- **Couleur de texte** personnalisable en surcharge du calcul automatique
- **Bordure de texte** optionnelle pour renforcer la lisibilité
- **Import / Export** des règles en JSON
- **Thème clair/sombre** sur la page d'options
- **Multilingue** : 🇫🇷 Français · 🇬🇧 English · 🇪🇸 Español · 🇩🇪 Deutsch · 🇧🇷 Português

---

## Installation

### Chrome

1. Télécharger `extension-chrome.zip` depuis la [dernière release](https://github.com/Skilldus/marqueur-environnement/releases/latest)
2. Décompresser l'archive
3. Ouvrir `chrome://extensions`, activer le **mode développeur**
4. Cliquer **Charger l'extension non empaquetée** et sélectionner le dossier extrait

### Firefox

1. Télécharger `extension-firefox.zip` depuis la [dernière release](https://github.com/Skilldus/marqueur-environnement/releases/latest)
2. Ouvrir `about:debugging#/runtime/this-firefox`
3. Cliquer **Charger un module complémentaire temporaire** et sélectionner le fichier zip

---

## Configuration

Accéder aux options via l'icône de l'extension → **Options** (ou `chrome://extensions` → Détails → Options de l'extension).

### Créer une règle

| Champ | Description |
|---|---|
| **Pattern** | Expression régulière testée contre l'URL complète (`window.location.href`) |
| **Label** | Texte affiché dans le bandeau (ex. `DEV`, `STAGING`, `PROD`) |
| **Couleur** | Couleur de fond du bandeau en hexadécimal |
| **Position** | `top` · `bottom` · `top-left` · `top-right` · `bottom-left` · `bottom-right` |
| **Taille** | `small` · `medium` · `large` · `custom` (hauteur + taille de police libres) |
| **Couleur du texte** | Optionnelle — surcharge le contraste WCAG automatique |
| **Bordure** | Optionnelle — ajoute un contour au texte |

Les règles sont évaluées **dans l'ordre** : seul le premier match est affiché.

### Import / Export

Le bouton **Exporter** génère un fichier `rules.json`. Le bouton **Importer** accepte ce même format pour restaurer ou partager une configuration.

---

## Développement

### Prérequis

- Node.js 22+
- Yarn

### Installation

```bash
git clone https://github.com/Skilldus/marqueur-environnement.git
cd marqueur-environnement
yarn install
```

### Commandes

```bash
yarn build          # Compile TypeScript → dist/
yarn test           # Lance tous les tests (Vitest + jsdom)
yarn test:watch     # Tests en mode watch
yarn test:coverage  # Rapport de couverture
yarn package        # Build + zip Chrome  → extension.zip
yarn package:firefox # Build + zip Firefox → extension-firefox.zip
```

### Architecture

```
src/
├── content.ts      # Script injecté sur chaque page (lecture des règles + injection du bandeau)
├── options.ts      # Page d'options (CRUD des règles, import/export, thème)
├── types.ts        # Types partagés : Rule, RulePosition, RuleSize
└── utils.ts        # Helpers WCAG, validation import

public/
├── manifest.json   # Manifest V3 (Chrome + Firefox)
├── options.html    # Page d'options
├── styles/         # CSS bandeau + options (thème clair/sombre)
├── icons/          # Icônes 16/32/48/128 px
└── _locales/       # Traductions (fr, en, es, de, pt_BR)
```

---

## Release

Voir [`docs/releases.md`](docs/releases.md) pour le processus complet.

```bash
yarn release:minor   # 1.3.x → 1.4.0
yarn release:patch   # 1.4.0 → 1.4.1
yarn release:major   # 1.4.x → 2.0.0
```

Le tag déclenche automatiquement la CI qui crée la GitHub Release avec `extension-chrome.zip` et `extension-firefox.zip` en pièces jointes.

---

## Licence

[MIT](LICENSE)
