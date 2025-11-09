# GitHub Actions CI Workflow

## Overview

The CI workflow (`ci.yml`) runs automated tests and enforces 100% code coverage for both backend and frontend.

## Workflow Features

### ✅ Node.js 20
- Uses the latest LTS version of Node.js
- Caches npm dependencies for faster builds

### ✅ PostgreSQL Service
- Spins up PostgreSQL 15 as a service container
- Health checks ensure database is ready before tests
- Automatically configured with test database

### ✅ Environment Configuration
- Auto-creates `.env` file with:
  - `NODE_ENV=test`
  - `TEST_DATABASE_URL` (Postgres connection string)
  - `DATABASE_URL` (for compatibility)
  - Test credentials for Reddit API
  - Test ping message

### ✅ Dependency Installation
- Uses `npm ci` for clean, reproducible installs
- Faster than `npm install` in CI environments

### ✅ Test Execution
- Runs backend tests with coverage: `npm run test:backend:coverage`
- Runs frontend tests with coverage: `npm run test:frontend:coverage`
- Both test suites must pass

### ✅ Coverage Enforcement
- **100% coverage required** for:
  - Branches
  - Functions
  - Lines
  - Statements
- Build **fails automatically** if coverage < 100%
- Enforced by Vitest thresholds in config files

### ✅ Coverage Artifacts
- Uploads backend coverage reports (`server/coverage/`)
- Uploads frontend coverage reports (`client/coverage/`)
- Artifacts retained for 30 days
- Includes HTML, LCOV, and JSON formats

## Workflow Triggers

Runs on:
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main`
- Pull requests to `develop`

## Workflow Steps

1. **Checkout code** - Gets the latest code
2. **Setup Node.js 20** - Installs Node with npm cache
3. **Create .env file** - Sets up test environment variables
4. **Install dependencies** - Runs `npm ci`
5. **Wait for PostgreSQL** - Ensures database is ready
6. **Run backend tests** - With coverage (100% enforced)
7. **Run frontend tests** - With coverage (100% enforced)
8. **Upload artifacts** - Coverage reports for download

## Coverage Reports

After the workflow runs, you can download:
- **Backend Coverage**: `backend-coverage` artifact
  - HTML report: `server/coverage/index.html`
  - LCOV: `server/coverage/lcov.info`
  - JSON: `server/coverage/coverage-final.json`

- **Frontend Coverage**: `frontend-coverage` artifact
  - HTML report: `client/coverage/index.html`
  - LCOV: `client/coverage/lcov.info`
  - JSON: `client/coverage/coverage-final.json`

## Failure Conditions

The workflow will fail if:
- ❌ Backend tests fail
- ❌ Frontend tests fail
- ❌ Backend coverage < 100%
- ❌ Frontend coverage < 100%
- ❌ Database connection fails
- ❌ Dependency installation fails

## Local Testing

To test the CI workflow locally:

```bash
# Start PostgreSQL (Docker)
docker run --name fairdatause-test-db \
  -e POSTGRES_DB=fairdatause_test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# Create .env file
cat > .env << EOF
NODE_ENV=test
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fairdatause_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fairdatause_test
REDDIT_CLIENT_ID=test_client_id
REDDIT_CLIENT_SECRET=test_client_secret
PING_MESSAGE=test ping
EOF

# Install dependencies
npm ci

# Run tests with coverage
npm run test:backend:coverage
npm run test:frontend:coverage
```

## Notes

- Coverage thresholds are configured in:
  - `vitest.config.backend.ts` (backend)
  - `client/vitest.config.ts` (frontend)
- Both configs use v8 coverage provider
- Coverage reports are generated in separate directories
- The workflow automatically fails if coverage drops below 100%

