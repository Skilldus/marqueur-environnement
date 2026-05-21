# Gestion des releases

## Faire une release

| Objectif | Commande |
|---|---|
| Corriger un bug (1.2.1 → 1.2.2) | `yarn release:patch` |
| Nouvelle fonctionnalité (1.2.1 → 1.3.0) | `yarn release:minor` |
| Changement majeur/breaking (1.2.1 → 2.0.0) | `yarn release:major` |
| Version explicite | `node scripts/release.mjs 1.5.0` |

Chaque commande :
1. Vérifie qu'une section `[Unreleased]` existe dans `CHANGELOG.md` (erreur si absente)
2. Renomme `[Unreleased]` en `[X.Y.Z] - YYYY-MM-DD` et recrée une section `[Unreleased]` vide
3. Met à jour la version dans `package.json` et `public/manifest.json`
4. Crée un commit `chore: release vX.Y.Z`
5. Crée le tag git `vX.Y.Z`
6. Pousse le commit et le tag

GitHub Actions prend ensuite le relais automatiquement.

## Rédiger les notes de release

Avant de lancer `yarn release:*`, renseigner la section `[Unreleased]` dans `CHANGELOG.md` :

```markdown
## [Unreleased]
### Added
- Nouvelle option de couleur personnalisée pour le bandeau

### Fixed
- Correction de l'affichage sur les pages en iframe

### Changed
- Le label est maintenant tronqué avec une ellipse au-delà de 40 caractères
```

Catégories disponibles : `Added`, `Fixed`, `Changed`, `Removed`, `Security`.

Si la section `[Unreleased]` est vide au moment du release, le script **bloque** et affiche une erreur — c'est intentionnel pour forcer la documentation.

## Ce que fait la CI

| Événement | Workflow | Actions |
|---|---|---|
| Push sur `master` ou PR | `ci.yml` | Tests + Build (vérification) |
| Push d'un tag `v*.*.*` | `release.yml` | Tests + Build + Zip + GitHub Release |

## Résultat d'une release sur GitHub

Une fois le tag poussé, `release.yml` crée automatiquement :
- Une **GitHub Release** nommée `Release vX.Y.Z`
- Les **notes de release** issues de la section correspondante dans `CHANGELOG.md`
- L'**`extension.zip`** en pièce jointe (prêt à être chargé dans Chrome via `chrome://extensions`)

## Fichiers concernés

| Fichier | Rôle |
|---|---|
| `CHANGELOG.md` | Notes de release par version (à rédiger avant chaque release) |
| `scripts/release.mjs` | Bump de version + mise à jour CHANGELOG + commit + tag + push |
| `.github/workflows/release.yml` | Build, packaging, extraction des notes et création de la GitHub Release |
| `.github/workflows/ci.yml` | Vérification continue (tests + build) sur chaque push/PR |
