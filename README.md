# Algorithmic Bias Bug Bounty Platform

A full-stack platform where enterprise companies list their AI models and independent researchers submit bias bug reports for financial bounties.

## Features

- **Dual-sided marketplace**: Companies list AI models, researchers find and report bias
- **Role-based authentication**: Separate dashboards for companies and researchers
- **Stripe escrow integration**: Secure payment handling for bounties
- **Sandboxed AI testing**: Secure environment for testing AI models
- **Bug tracking workflow**: Full lifecycle from submission to payment

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Payments**: Stripe Connect
- **Sandbox**: Python FastAPI
- **Infrastructure**: Docker, Docker Compose

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Python 3.11+
- Docker and Docker Compose (optional)

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone and enter directory
cd "Algorithmic Bias Bug Bounty platform"

# Copy environment file and fill in the REQUIRED values
# (POSTGRES_PASSWORD, JWT_SECRET — compose refuses to start without them)
cp .env.example .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed
```

Visit: http://localhost:3000

### Option 2: Local Development

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install sandbox dependencies
cd ../sandbox && pip install -r requirements.txt

# Start PostgreSQL and create database
psql -U postgres -c "CREATE DATABASE bugbounty;"

# Run migrations
cd ../backend && npx prisma migrate dev

# Seed database
npx prisma db seed

# Start all services (in separate terminals)
npm run dev          # Backend on port 3001
cd ../frontend && npm run dev  # Frontend on port 3000
cd ../sandbox && python main.py  # Sandbox on port 8000
```

## Demo Accounts

After seeding the database there are demo accounts for both roles. For security
the credentials are not listed here — see `backend/prisma/seed.ts` for the
seeded emails and the shared demo password.

## Project Structure

```
algorithmic-bias-bugbounty/
├── backend/                 # Node.js/Express API
│   ├── prisma/             # Database schema & migrations
│   └── src/
│       ├── config/         # Configuration files
│       ├── middleware/     # Auth, validation, rate limiting
│       ├── routes/         # API endpoints
│       └── services/       # Business logic (Stripe, AI Proxy)
├── frontend/               # Next.js application
│   └── src/
│       ├── app/            # Pages and routes
│       ├── components/     # Reusable UI components
│       ├── hooks/          # React hooks
│       └── lib/            # Utilities and API client
├── sandbox/                # Python FastAPI sandbox
├── docker-compose.yml
└── .env.example
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Models
- `GET /api/models` - List all models
- `GET /api/models/:id` - Get model details
- `POST /api/models` - Create model (company only)
- `PUT /api/models/:id` - Update model
- `DELETE /api/models/:id` - Delete model

### Bounties
- `GET /api/bounties` - List all bounties
- `GET /api/bounties/:id` - Get bounty details
- `POST /api/bounties` - Create bounty (company only)
- `PUT /api/bounties/:id` - Update bounty

### Bug Reports
- `GET /api/bugs` - List bug reports
- `GET /api/bugs/:id` - Get bug report details
- `POST /api/bugs` - Submit bug report (researcher only)
- `PUT /api/bugs/:id` - Update bug status (company only)

### Users
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/earnings` - Get earnings (researcher)
- `GET /api/users/stats` - Get stats (company)

## Environment Variables

See `.env.example` for the full list. The backend **refuses to start in
production** when a required variable is missing or insecure.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string. **Required.** Use `?sslmode=require` for TLS in production
- `NODE_ENV` - Set to `production` in deployed environments
- `JWT_SECRET` - Secret for JWT tokens. **Required** and must be a unique random value in production (the known dev defaults are rejected)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Stripe credentials. Required in production
- `RESEND_API_KEY` - Resend API key for transactional email (bug report notifications). Leave unset in development — sends are skipped and logged as `[REDACTED]`
- `RESEND_EMAIL_FROM` - Verified sender address (default `onboarding@resend.dev`, which only works for testing)
- `ADMIN_EMAILS` - Comma-separated emails with admin access (e.g. the log viewer). Alternative: set a user's `role` to `ADMIN` in the DB
- `ENABLE_LOG_VIEWER` - Set to `true` to turn on the (admin-only) log viewer endpoint

### Deployment checklist

- Set `NODE_ENV=production`
- Use a managed PostgreSQL with TLS (`sslmode=require`) — the Docker `db`
  service is for local development only and its port should not be published
  in production
- Generate a unique `JWT_SECRET` (e.g. `openssl rand -base64 48`)
- Run migrations with `npx prisma migrate deploy` (never `migrate dev` in production)
- All responses carry security headers (helmet on the API, `next.config.js`
  headers on the frontend)

### Secret hygiene

- **All secrets live in environment variables only** — never in source code,
  config files, comments, or Dockerfiles. `.env` files are gitignored; commit
  `.env.example` templates with placeholders only.
- **Client-side exposure:** only `NEXT_PUBLIC_`-prefixed vars reach the browser.
  Never prefix a secret (API key, DB URL, JWT secret) with `NEXT_PUBLIC_`.
  There is no Supabase integration; if one is added, the anon key is safe
  client-side **only** with Row Level Security on every table, and the service
  role key must never ship client-side.
- **Rotation warning:** early development versions of this repo contained
  hardcoded development credentials and default secrets (e.g. the seed
  password `password123` and the known dev `JWT_SECRET` fallbacks) in git
  history. Even though those are known dev defaults, **rotate any secret that
  may have existed in code or history before relying on it in production** —
  generate a fresh `JWT_SECRET`, new Stripe/Resend keys, and a new database
  password. Treat any value that ever appeared in source or git history as
  compromised.

## Privacy

See [`audit.md`](audit.md) for the personal-data flow map and the logging,
redaction, and API-response rules all changes must follow.

## License

MIT
