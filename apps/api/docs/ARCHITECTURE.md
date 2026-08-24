# MONPRO Backend Architecture

## Stack

- **Runtime**: Node.js 20 (Alpine)
- **Framework**: NestJS 10
- **Language**: TypeScript 5.x (strict)
- **ORM**: Prisma 5.22
- **Database**: PostgreSQL
- **Auth**: JWT + OTP (phone-based)
- **WebSocket**: Socket.IO
- **Validation**: class-validator + class-transformer

## Module Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap + global config
├── health.controller.ts       # Health probes
├── auth/                      # Authentication (OTP, JWT)
│   ├── providers/             # SMS provider abstraction
│   └── dto/
├── users/                     # User profiles + addresses
│   └── dto/
├── professionals/             # Professional profiles + matching
│   └── dto/
├── categories/                # Service categories
│   └── dto/
├── services/                  # Available services
├── service-requests/          # Client service requests
│   └── dto/
├── quotes/                    # Professional quotes
│   └── dto/
├── bookings/                  # Booking lifecycle
│   └── dto/
├── interventions/             # Intervention tracking
│   └── dto/
├── payments/                  # Payment processing
│   ├── providers/             # Payment provider abstraction
│   └── dto/
├── ledger/                    # Financial ledger (immutable)
├── reviews/                   # Reviews & ratings
│   └── dto/
├── messaging/                 # Real-time messaging
│   └── dto/
├── notifications/             # Push notifications
│   └── providers/             # Push provider abstraction
├── device-tokens/             # Push token management
│   └── dto/
├── businesses/                # Business entities
│   └── dto/
├── uploads/                   # File uploads
│   └── providers/             # Storage provider abstraction
├── favorites/                 # User favorites
├── geography/                 # Geographic data
│   └── dto/
├── admin/                     # Admin operations
│   └── dto/
├── prisma/                    # PrismaService (global)
└── common/
    ├── guards/                # JwtAuthGuard, RolesGuard
    ├── decorators/            # @Public, @Roles, @CurrentUser
    ├── interceptors/          # Timeout, Transform
    └── state-machines/        # Centralized state transitions
```

## Key Patterns

### Authentication
- Phone-based OTP with `crypto.randomInt` (6-digit, bcrypt-hashed)
- JWT access token (15min) + refresh token (7d)
- Global JWT guard with `@Public()` opt-out decorator

### Authorization
- RBAC via `@Roles()` decorator + `RolesGuard`
- IDOR prevention: ownership checks on all mutations
- State machines prevent invalid transitions

### Provider Abstraction
Three abstraction layers allow swapping external services:
- `ISmsProvider` → `DevSmsProvider` (logs in dev)
- `IPushNotificationProvider` → `DevPushProvider` (logs in dev)
- `IStorageProvider` → `LocalStorageProvider` (filesystem)
- `IPaymentProvider` → `DevPaymentProvider` (mock)

### Financial Integrity
- Immutable ledger (append-only, never update/delete)
- Commission resolved from config hierarchy (professional → service → category → global)
- Webhook idempotency via unique constraint + processedAt check
- All ledger operations in `$transaction`

### Data Validation
- All endpoints use class-validator DTOs
- `ValidationPipe` with `whitelist: true` strips unknown fields
- `forbidNonWhitelisted: true` rejects extra fields

## Database

- PostgreSQL with Prisma ORM
- UUID primary keys
- Soft-deletes via `isActive` flags
- 30+ indexes on query-critical columns
- CHECK constraints on financial amounts and ratings
- Compound unique constraints where appropriate

## Production Configuration

- Helmet security headers
- CORS with whitelist
- Swagger disabled in production
- Graceful shutdown hooks
- 30s request timeout
- Non-root Docker user
- Health check endpoint for orchestrator probes
