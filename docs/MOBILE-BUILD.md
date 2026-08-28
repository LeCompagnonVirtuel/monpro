# MONPRO Mobile — Build & Déploiement

## Prérequis

- EAS CLI installé : `npm install -g eas-cli`
- Compte Expo connecté : `eas login`
- Projet configuré : `eas init` (génère le projectId)

## Profils EAS

### eas.json

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Commandes de build

```bash
# Build développement (dev client)
eas build --profile development --platform android
eas build --profile development --platform ios

# Build preview (APK interne)
eas build --profile preview --platform android

# Build production
eas build --profile production --platform android
eas build --profile production --platform ios
```

## Configuration Android

- Package : `com.monpro.app`
- Icon adaptative : `assets/adaptive-icon.png`
- Permissions : LOCATION, CAMERA, READ_EXTERNAL_STORAGE
- Target SDK : défini par Expo SDK 52

## Configuration iOS

- Bundle ID : `com.monpro.app`
- supportsTablet : false
- Permissions NSInfo :
  - NSLocationWhenInUseUsageDescription
  - NSCameraUsageDescription
  - NSPhotoLibraryUsageDescription

## Deep linking

- Scheme : `monpro://`
- Routes supportées par Expo Router file-based routing

## Vérifications pré-build

```bash
# TypeScript
npx tsc --noEmit

# Lint
npx eslint src --ext .ts,.tsx --max-warnings 0

# Tests
npx jest --no-coverage

# Export statique (vérification de compilation)
npx expo export --platform android
```

## Soumission aux stores

```bash
# Google Play
eas submit --platform android --profile production

# App Store
eas submit --platform ios --profile production
```

## Variables d'environnement en production

L'URL API est configurée via le mécanisme de priorité décrit dans `MOBILE-ENVIRONMENT.md`. Pour un build production :

1. Configurer `apiUrl` dans `app.json > extra` ou
2. Utiliser les secrets EAS : `eas secret:create --name EXPO_PUBLIC_API_URL --value <url>`

## Versioning

- `version` dans `app.json` : version affichée (semver)
- `autoIncrement` dans le profil production : incrémente le buildNumber/versionCode automatiquement
