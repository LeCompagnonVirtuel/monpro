# MONPRO Security Documentation

## Authentication

### OTP
- 6-digit code generated with `crypto.randomInt` (CSPRNG)
- Hashed with bcrypt before storage
- 5-minute TTL, max 3 verification attempts
- Rate limited: max 3 OTP requests per phone per 10 minutes
- Blocked users (SUSPENDED, role-blocked) cannot authenticate

### JWT
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Global JWT guard (all routes protected by default)
- `@Public()` decorator for explicit opt-out

## Authorization

### RBAC
- Roles: CLIENT, PROFESSIONAL, ADMIN
- `@Roles()` decorator + `RolesGuard`
- Admin endpoints require ADMIN role

### IDOR Prevention
All mutation endpoints verify ownership:
- Bookings: client or assigned professional only
- Payments: booking owner only
- Addresses: user's own addresses only
- Businesses: owner only for mutations
- Interventions: assigned professional or booking client
- Conversations: participant only

## Input Validation

- class-validator DTOs on all public endpoints
- `whitelist: true` strips unknown properties
- `forbidNonWhitelisted: true` rejects extra fields
- UUID validation on all ID parameters
- Enum validation on status fields

## Upload Security

- Folder whitelist: avatars, services, kyc, messages, reviews, categories
- MIME validation: image/jpeg, image/png, image/webp, image/heic only
- 5MB size limit
- UUID-generated filenames (user-provided names discarded)
- Path traversal prevention (folder must match whitelist exactly)

## WebSocket Security

- JWT verification on connection handshake
- userId extracted from token (never from client message)
- Conversation membership verified before join

## Payment Security

- Webhook signature verification before processing
- Idempotency: `@@unique([provider, providerRef])` + `processedAt` check
- Amounts from database, never from request body
- Commission from server-side config, never from client

## State Machines

Prevent invalid state transitions for:
- ServiceRequest, Quote, Booking, Payment, Dispute
- Centralized validation, BadRequestException on invalid transitions

## Infrastructure

- Helmet security headers
- CORS whitelist
- Non-root Docker user
- No secrets in logs (OTP codes logged only in dev mode)
- `.env.example` documents required secrets
- Swagger disabled in production

## External Services (REQUIRES_EXTERNAL_CONFIGURATION)

- SMS: DevSmsProvider in development (logs to console)
- Push: DevPushProvider in development (logs to console)
- Payment: DevPaymentProvider in development (mock responses)
- Storage: LocalStorageProvider in development (filesystem)
