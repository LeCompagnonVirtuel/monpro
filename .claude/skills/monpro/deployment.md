# MONPRO Deployment

Target:
- mobile: Expo/EAS
- API: Railway or equivalent
- database: PostgreSQL

Environments:
development
staging
production

Required:
- environment variables
- health check
- database migrations
- secure secrets
- logs
- backups/retention strategy appropriate to deployment
- rollback strategy

Never deploy development mock payment behavior as production payment behavior.

Document every external credential/integration required for production.
