# MONPRO Mobile — Configuration Environnement

## Prérequis

- Node.js 18+
- pnpm 9.1.0
- Expo CLI (`npx expo`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (émulateur) ou appareil physique
- Xcode (iOS, macOS uniquement)

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd MONPRO

# Installer les dépendances
pnpm install

# Naviguer vers l'app mobile
cd apps/mobile
```

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `EXPO_PUBLIC_API_URL` | URL de l'API backend | `https://monpro-api.onrender.com/api/v1` |

### Configuration par fichier

Dans `app.json` → `expo.extra` :

```json
{
  "extra": {
    "apiUrl": "http://192.168.1.100:3000/api/v1",
    "eas": {
      "projectId": "votre-project-id"
    }
  }
}
```

### Priorité de résolution

1. `Constants.expoConfig.extra.apiUrl` (EAS build config)
2. `process.env.EXPO_PUBLIC_API_URL`
3. Fallback : `https://monpro-api.onrender.com/api/v1`

## Démarrage en développement

```bash
# Démarrer Metro bundler
npx expo start

# Avec effacement du cache
npx expo start --clear

# Tunnel (pour appareil physique sur un autre réseau)
npx expo start --tunnel
```

## Monorepo

Le projet utilise pnpm workspaces + Turborepo :

```
MONPRO/
├── apps/
│   ├── mobile/    # App React Native (Expo)
│   └── api/       # Backend NestJS (GELÉ)
├── packages/      # Packages partagés
├── pnpm-workspace.yaml
└── turbo.json
```

Metro est configuré pour résoudre les modules pnpm via `nodeModulesPaths` dans `metro.config.js`.

## Stockage sécurisé

Les tokens JWT sont stockés dans `expo-secure-store` :

- Clé access token : `monpro_access_token`
- Clé refresh token : `monpro_refresh_token`

**Jamais** dans AsyncStorage. **Jamais** loggés.

## Configuration EAS

Le `projectId` dans `app.json > extra > eas` doit être configuré après `eas init`.

Profils de build dans `eas.json` :
- `development` : build de dev avec dev client
- `preview` : build interne pour test
- `production` : build de production signé
