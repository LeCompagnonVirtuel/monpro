---
name: monpro
description: "Senior engineering operating system for MONPRO, a Côte d’Ivoire-first marketplace connecting clients with verified service professionals. Use for architecture, implementation, debugging, testing, security, payments, mobile UX, backend, admin, deployment, and product decisions."
---

# MONPRO Engineering Skill

## Mission

Build MONPRO as a production-grade marketplace for services in Côte d’Ivoire, designed to scale across Africa.

MONPRO connects:
- Clients needing services
- Professionals providing services
- Administrators operating the marketplace

Core flow:

Client → Service → Request → Matching → Quotes → Booking → Intervention → Payment → Review

Never treat MONPRO as a simple directory.

## Non-negotiable engineering rules

1. Inspect the existing repository before changing anything.
2. Never delete or rewrite existing code without understanding its purpose.
3. Prefer small, testable changes.
4. Never ship fake functionality as real functionality.
5. Never hardcode secrets, payment credentials, API keys, categories, commissions, or production data.
6. Server-side authorization is mandatory; never trust mobile-client role claims.
7. Critical business state is controlled by the backend.
8. Payment success is confirmed by the payment provider/backend, never by the client app alone.
9. KYC documents are private and must never be publicly exposed.
10. Every feature must have loading, empty, error, success, and permission states where relevant.
11. After meaningful changes, run type-check, lint, tests, and build as applicable.
12. Do not declare a feature complete while the project is broken or the implementation is only mocked.
13. Use adapters/interfaces for external providers so providers can be replaced.
14. Use migrations for database changes.
15. Use UTC timestamps internally; localize presentation to Côte d’Ivoire.
16. Money must be represented safely in integer FCFA units or another explicitly safe monetary representation. Never use floating-point arithmetic for financial calculations.
17. Keep personally identifiable and sensitive data to the minimum required.
18. Document external integrations that still require credentials or provider configuration.

## Product scope

MONPRO must support dynamically managed categories and services, including:

- Maison & Habitat
- Électronique & Technologie
- Automobile
- Entretien
- BTP
- Transport & Logistique
- Événementiel
- Beauté & Bien-être
- Éducation
- Services professionnels
- Services aux entreprises

Categories and services belong in the database/admin system, not hardcoded UI arrays.

## Roles

### Client
Search, request, locate, compare professionals, receive quotes, book, communicate, pay, review, favorite, report.

### Professional
Onboard, select services, define zones and availability, submit verification, receive requests, quote, schedule, perform jobs, communicate, view earnings and ratings.

### Admin
Manage users, professionals, KYC verification, categories, services, requests, bookings, payments, commissions, reviews, disputes, reports, statistics, configuration and audit logs.

## Recommended stack

### Mobile
- React Native
- Expo
- TypeScript
- Expo Router

### API
- Node.js
- TypeScript
- NestJS preferred for a structured production backend, unless the existing repository has a strong reason to use another framework.

### Database
- PostgreSQL
- A type-safe ORM such as Prisma or the project's established ORM

### Admin
- Next.js
- TypeScript
- Tailwind CSS

### Deployment
- Railway for API/database where appropriate
- Expo/EAS for mobile builds

Do not introduce a new framework merely for preference if an existing codebase is already coherent.

## Architecture principles

Use modular boundaries:

- auth
- users
- professionals
- categories
- services
- locations
- requests
- matching
- quotes
- bookings
- payments
- commissions
- conversations
- notifications
- reviews
- favorites
- KYC
- disputes
- reports
- admin
- audit

Keep domain logic out of UI components.

Use:
- DTOs
- schemas/validation
- services/use-cases
- repositories/data access
- provider adapters
- typed API contracts

## Marketplace state machines

### Service request
DRAFT → SUBMITTED → MATCHING → QUOTED → ACCEPTED → SCHEDULED → IN_PROGRESS → COMPLETED

Terminal/exception states:
CANCELLED, DISPUTED

### Professional verification
PENDING → VERIFIED
PENDING → REJECTED
VERIFIED → SUSPENDED

### Booking
PENDING → CONFIRMED → ARRIVING → IN_PROGRESS → COMPLETED

Exception:
CANCELLED / DISPUTED

Do not permit arbitrary status transitions. Validate transitions server-side.

## Matching

Matching should be a backend scoring system, not client-side sorting.

Potential factors:
- requested service
- professional service coverage
- service area
- distance
- availability
- verification status
- rating
- completed jobs
- response rate
- cancellation rate

Keep scoring configurable so it can evolve without rewriting the application.

## Location

Support:
- country
- region
- city
- district/commune
- neighborhood
- address
- coordinates

The MVP targets Côte d’Ivoire, but country-specific logic must not be scattered through the code.

Request location permission explicitly on mobile.

Avoid exposing exact private addresses to unauthorized users.

## Payments

Create a provider abstraction.

Potential providers for Côte d’Ivoire can include:
- Orange Money
- MTN MoMo
- Moov Money
- Wave
- another licensed payment aggregator

Do not assume a provider is available or configured. Verify current API capabilities before implementation.

Payment lifecycle must support:
- initiation
- pending
- success
- failed
- cancelled
- refund where supported
- webhook/provider confirmation
- transaction history
- platform commission

Use idempotency for payment creation and webhook processing.

## Commission

Commission is configuration, not hardcoded business logic.

Support:
- global commission
- category commission
- professional-specific commission
- customer service fee if later enabled

Record immutable financial ledger entries for completed transactions.

## KYC

Store only required verification data.

Sensitive documents:
- private storage
- access control
- signed/temporary access where needed
- audit access
- retention/deletion policy

Never expose KYC files through a public URL.

A mock verification provider must be explicitly marked MOCK/DEV.

## Messaging

Client ↔ Professional conversations must enforce authorization.

Support:
- text
- image/file attachments where appropriate
- read state
- timestamps
- push notification hooks

Do not allow users to access another conversation by changing an ID in the request.

## Reviews

Only allow reviews for completed legitimate bookings/interventions.

Prevent:
- duplicate review for same booking
- reviewing an unrelated professional
- arbitrary rating injection

Keep moderation/reporting hooks.

## Mobile UX

Primary client navigation:
- Accueil
- Recherche
- Demandes
- Messages
- Profil

Professional navigation:
- Accueil
- Demandes
- Interventions
- Messages
- Profil

Design principles:
- simple
- premium
- fast
- mobile-first
- accessible
- clear hierarchy
- strong empty/error/loading states
- centralized design tokens
- no unnecessary visual complexity

Use reusable components instead of duplicating UI.

## API conventions

Use versioned APIs, e.g.:

/api/v1/auth
/api/v1/categories
/api/v1/services
/api/v1/professionals
/api/v1/service-requests
/api/v1/quotes
/api/v1/bookings
/api/v1/payments
/api/v1/reviews
/api/v1/conversations
/api/v1/notifications

Use:
- consistent HTTP semantics
- validation
- pagination
- filtering
- sorting
- structured errors
- rate limiting
- authentication
- authorization
- audit logging where appropriate

Generate/maintain OpenAPI documentation.

## Database

Prefer UUID primary identifiers.

Use:
- foreign keys
- unique constraints
- indexes
- timestamps
- soft delete only where justified
- explicit status enums/state transitions
- transactional writes for multi-record business operations

Expected domains include:

users
profiles
professionals
categories
subcategories
services
professional_services
service_requests
request_media
quotes
bookings
payments
payment_transactions
commissions
addresses
locations
availability
conversations
messages
notifications
reviews
favorites
kyc_documents
verification_requests
disputes
reports
audit_logs

Adapt names to the existing schema if it already exists.

## Security

Mandatory:
- server-side authorization
- input validation
- rate limiting
- secure password hashing if passwords are used
- secure token handling
- refresh-token/session controls
- upload validation
- file size limits
- MIME/content validation
- secure headers
- secret management
- audit logs
- protection against IDOR
- protection against mass assignment
- protection against injection
- safe error messages

Never return sensitive fields accidentally from ORM queries.

## Testing

Every critical business workflow needs tests.

Minimum:
- auth
- permissions
- professional verification
- request creation
- matching
- quote creation/acceptance
- booking transitions
- payment state transitions
- commission calculation
- reviews
- messaging authorization
- admin permissions

Use unit tests for domain rules and integration/API tests for workflows.

## Development workflow

For every task:

### 1. Understand
Inspect:
- package manifests
- source tree
- environment configuration
- database schema/migrations
- existing tests
- README
- build scripts

### 2. Plan
State:
- files to modify
- dependencies needed
- data changes
- API changes
- test strategy
- risks

### 3. Implement
Make the smallest coherent change.

### 4. Verify
Run applicable:
- type-check
- lint
- unit tests
- integration tests
- mobile build/type checks
- API build
- admin build

### 5. Review
Check:
- security
- authorization
- edge cases
- error states
- loading states
- database consistency
- backward compatibility

### 6. Report
Clearly distinguish:
- IMPLEMENTED
- MOCKED
- REQUIRES_EXTERNAL_CONFIGURATION
- NOT_IMPLEMENTED

## MVP priority

Prioritize this end-to-end path first:

Client:
OTP → profile → home → category → service → request → location → professionals → quote → choose professional → booking → intervention → review

Professional:
OTP → professional profile → services → verification → incoming request → quote → booking → intervention → earnings

Admin:
login → dashboard → professional verification → categories/services → users → requests → bookings

Do not build advanced features before this core flow is stable.

## Demo data

Seeds may contain fictional demo professionals and sample records.

Clearly label demo data.

Never create fake reviews or fake verification records that could be mistaken for production truth.

## External integrations

When an integration is unavailable:
- create a clean interface/adapter
- provide a development mock only where useful
- label it clearly
- add configuration documentation
- never silently substitute fake production behavior

## Definition of Done

A feature is complete only when:

- code is implemented
- types pass
- lint passes where configured
- relevant tests pass
- migrations are applied/tested if needed
- authorization is verified
- error/loading/empty states exist
- no secret is committed
- API contracts are documented
- mobile/admin flows are wired
- mocks are clearly identified
- README/configuration is updated where necessary

## First command

When this skill is activated for a new project, do NOT immediately generate a large amount of code.

First:
1. inspect the repository
2. identify existing architecture
3. identify package manager
4. identify current app/backend/admin structure
5. inspect database/migrations
6. inspect environment examples
7. inspect tests
8. produce a concise implementation plan
9. only then start implementation
