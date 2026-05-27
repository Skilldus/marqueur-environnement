# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

## [Unreleased]

## [1.4.0] - 2026-05-27

### Added
- Support Firefox : `browser_specific_settings` et `data_collection_permissions` dans le manifest
- Scripts de packaging distincts pour Chrome (`yarn package`) et Firefox (`yarn package:firefox`)
- Artifacts CI séparés `extension-chrome.zip` et `extension-firefox.zip` dans GitHub Actions
- Les deux zips sont joints à chaque GitHub Release

### Fixed
- Remplacement des usages de `innerHTML` par des API DOM sûres pour la conformité au validateur AMO

## [1.3.1] - 2026-05-21

### Fixed

- Test patch release avec le code de la version 1.3.0 manquant

## [1.3.0] - 2026-05-21

### Added

- Possibilité de personnaliser la couleur du texte du bandeau (surcharge de la couleur automatique basée sur la couleur de fond)
- Possibilité d'ajouter une bordure au texte du bandeau

## [1.2.1] - 2025-01-01

### Fixed

- Correction de bugs divers

## [1.2.0] - 2025-01-01

### Added

- Support de plusieurs langues
