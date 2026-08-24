# MONPRO Security Rules

Threat model at minimum:
- unauthorized role access
- IDOR
- token theft
- OTP abuse
- brute force
- malicious uploads
- injection
- mass assignment
- fake payment confirmation
- webhook replay
- sensitive data leakage
- admin privilege abuse

Controls:
- authorization on every protected resource
- validation at API boundary
- rate limits
- secure sessions/tokens
- webhook signature verification where provider supports it
- idempotency
- upload restrictions
- least privilege
- audit logs
- safe errors
- secret rotation strategy

Never trust:
- client role
- client price
- client commission
- client payment status
- client ownership claims
- client verification status
