# MONPRO API

Backend NestJS pour la marketplace de services professionnels.

## Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- npm ou pnpm

## Installation

```bash
npm install
cp .env.example .env
# Configurer DATABASE_URL dans .env
```

## Base de données

```bash
# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# Seed (données de démonstration)
npx prisma db seed

# Explorer la DB
npx prisma studio
```

## Développement

```bash
npm run dev
# API: http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/docs
# Health: http://localhost:3000/api/v1/health
```

## Build

```bash
npm run build
npm run start:prod
```

## Déploiement Railway

1. Créer un projet Railway
2. Ajouter un service PostgreSQL
3. Connecter le repo GitHub
4. Railway détecte automatiquement `railway.json`
5. Configurer les variables d'environnement :
   - `DATABASE_URL` (fourni automatiquement par Railway PostgreSQL)
   - `JWT_SECRET` (générer avec `openssl rand -hex 32`)
   - `NODE_ENV=production`
   - `OTP_PROVIDER=dev` (ou configurer un vrai provider SMS)

## Architecture

```
src/
├── auth/              # OTP, JWT, refresh tokens
├── users/             # Profils utilisateurs
├── professionals/     # Profils pros, matching, vérification
├── categories/        # Catégories (admin CRUD)
├── services/          # Services, recherche
├── service-requests/  # Demandes de service (workflow complet)
├── quotes/            # Devis (envoi, accept/reject)
├── bookings/          # Réservations, suivi statut
├── payments/          # Abstraction providers (Orange Money, Wave...)
├── reviews/           # Notations multi-critères
├── messaging/         # Chat REST + WebSocket
├── notifications/     # Push notifications
├── favorites/         # Favoris
├── geography/         # Pays, villes, communes, quartiers
├── uploads/           # Upload fichiers sécurisé
├── admin/             # Dashboard, stats, litiges, commissions
├── common/            # Guards, decorators, filters, interceptors
└── prisma/            # Service database global
```

## Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /auth/request-otp | Demander OTP |
| POST | /auth/verify-otp | Vérifier OTP |
| POST | /auth/register | Inscription |
| GET | /categories | Catégories |
| GET | /services | Services |
| GET | /services/search?q= | Recherche |
| GET | /professionals | Liste pros |
| GET | /professionals/match | Matching |
| POST | /service-requests | Créer demande |
| POST | /quotes | Envoyer devis |
| PATCH | /quotes/:id/accept | Accepter devis |
| POST | /bookings | Créer réservation |
| POST | /payments | Initier paiement |
| POST | /reviews | Donner avis |
| GET | /conversations | Mes conversations |
| GET | /admin/dashboard | Stats admin |

Documentation complète: `/api/docs` (Swagger)
