# MONPRO Deployment Guide

## Prerequisites

- PostgreSQL 14+
- Node.js 20+
- Docker (for containerized deployment)

## Environment Variables

Copy `.env.example` and configure:

```bash
cp .env.example .env
```

**Required:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Generate with `openssl rand -hex 32`

**Optional:**
- `PORT` — Server port (default: 3000)
- `NODE_ENV` — `development` or `production`
- `CORS_ORIGINS` — Comma-separated allowed origins
- `STORAGE_PROVIDER` — `local` (default), `s3`, `cloudinary`

## Local Development

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm start:dev
```

## Docker Deployment

```bash
docker build -t monpro-api .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e NODE_ENV=production \
  monpro-api
```

The container:
- Runs as non-root user (`appuser`)
- Applies pending migrations on startup
- Exposes health check at `/api/v1/health`
- Listens on port 3000

## Railway Deployment

The project includes `railway.json` and `nixpacks.toml` for Railway.

Push to the configured branch and Railway will:
1. Build the Docker image
2. Run migrations automatically
3. Start the application

## Health Checks

- **Liveness**: `GET /api/v1/health` — Returns 200 if the server is running
- **Readiness**: `GET /api/v1/health/ready` — Returns database connectivity status

## Database Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name description

# Apply migrations in production
pnpm prisma migrate deploy

# Reset and reseed (development only!)
pnpm prisma migrate reset
```

## Monitoring

- Structured logging via NestJS Logger
- Request timeout: 30 seconds
- Graceful shutdown on SIGTERM/SIGINT

## External Services Configuration

For production, configure these providers:

| Service | Env Variables | Default |
|---------|--------------|---------|
| SMS | `OTP_PROVIDER`, Twilio/AT credentials | `dev` (logs) |
| Push | `EXPO_ACCESS_TOKEN` | `dev` (logs) |
| Payments | Provider-specific API keys | `dev` (mock) |
| Storage | `STORAGE_PROVIDER`, S3/Cloudinary credentials | `local` |
