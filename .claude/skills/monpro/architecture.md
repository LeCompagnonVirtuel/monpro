# MONPRO Architecture Rules

## Target monorepo

Preferred:

apps/
  mobile/
  api/
  admin/

packages/
  types/
  config/
  ui/

docs/

Use a simpler structure if the existing repository already has a sound architecture.

## Boundaries

UI must not contain business rules.

API controllers should orchestrate, not contain complex domain logic.

Domain/application services own business rules.

Repositories own persistence concerns.

Provider adapters isolate:
- payments
- SMS/OTP
- storage
- maps/geocoding
- notifications

## Dependency rule

Prefer:

UI → API client → backend controller → application service → repository/provider

Avoid:

UI → database
UI → payment provider
UI → privileged secrets

## API versioning

All public API routes should be versioned.

Breaking API changes require an explicit versioning decision.

## Configuration

Use environment variables for secrets and deployment-specific values.

Create .env.example with names and safe placeholders.
