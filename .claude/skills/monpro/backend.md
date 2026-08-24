# MONPRO Backend Standards

Use a modular backend.

Suggested modules:

auth
users
professionals
categories
services
locations
requests
matching
quotes
bookings
payments
commissions
conversations
notifications
reviews
favorites
kyc
disputes
reports
admin
audit

Every module should have clear:
- controller/API layer
- DTO/schema validation
- application/domain service
- persistence layer
- tests

Business-critical workflows should use database transactions.

Use idempotency for externally retried operations such as payment initiation and webhook processing.
