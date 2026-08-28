# MONPRO Mobile — Checklist de release

## Pré-release

### Vérifications automatiques

- [ ] `npx tsc --noEmit` — aucune erreur TypeScript
- [ ] `npx eslint src --ext .ts,.tsx --max-warnings 0` — aucun warning ESLint
- [ ] `npx jest` — tous les tests passent (206/206)
- [ ] `npx expo export --platform android` — export sans erreur

### Vérifications manuelles

- [ ] Tous les écrans affichent correctement un état de chargement
- [ ] Tous les écrans affichent un état vide approprié
- [ ] Tous les écrans gèrent les erreurs avec un message utilisateur
- [ ] La bannière hors-ligne apparaît quand la connexion est coupée
- [ ] Le deep linking fonctionne (`monpro://`)
- [ ] Les notifications push sont reçues et ouvrent le bon écran
- [ ] Le refresh token fonctionne (laisser l'app 16+ minutes, puis agir)
- [ ] Le logout nettoie bien l'état (tokens, cache, socket)

### Sécurité

- [ ] Aucun token/secret dans les logs (`console.log`)
- [ ] Tokens stockés dans expo-secure-store uniquement
- [ ] Pas d'URL API hardcodée dans les composants
- [ ] L'avertissement "mode développement" apparaît sur les paiements simulés
- [ ] Aucun fichier `.env` commité

### Configuration

- [ ] `app.json > extra > eas > projectId` configuré (pas "REQUIRES_EAS_CONFIGURATION")
- [ ] `eas.json` créé avec les 3 profils (development, preview, production)
- [ ] Icons et splash screen en haute résolution

## Process de release

1. **Brancher** : créer branche `release/vX.Y.Z`
2. **Versionner** : mettre à jour `version` dans `app.json`
3. **Vérifier** : exécuter toutes les vérifications ci-dessus
4. **Builder** : `eas build --profile production --platform all`
5. **Tester** : installer le build production sur appareil de test
6. **Soumettre** : `eas submit --platform all --profile production`
7. **Taguer** : `git tag vX.Y.Z && git push --tags`

## Post-release

- [ ] Vérifier le statut de soumission sur les stores
- [ ] Monitorer les crashs (si Sentry ou équivalent configuré)
- [ ] Vérifier les métriques de rétention J1

## Rollback

En cas de bug critique post-release :
1. Identifier le commit problématique
2. Revert et créer un hotfix
3. Build et soumission express

## API Gaps restants

Voir `docs/API-GAPS.md` pour les fonctionnalités qui nécessitent des ajouts backend avant d'être complètement opérationnelles en production.
