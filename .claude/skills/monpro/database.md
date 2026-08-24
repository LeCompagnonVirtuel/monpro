# MONPRO Database Rules

Use PostgreSQL.

Rules:
- UUID IDs
- foreign keys
- unique constraints
- indexes for frequent filters/searches
- migrations for all schema changes
- seed data only for development/demo
- transactions for stateful workflows

Money:
- store integer FCFA units
- never use floating point for financial calculations

Audit:
- record important administrative and financial events

Privacy:
- minimize sensitive data
- isolate KYC data
- do not expose private storage URLs publicly
