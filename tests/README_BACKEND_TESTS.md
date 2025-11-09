# Backend Test Files - Vitest + Supertest + Nock

## Test Files Created

### 1. Health Route Test
**File**: `tests/integration/server/health.test.ts`

Tests the `GET /health` endpoint:
- ✅ Returns 200 status
- ✅ Returns healthy status
- ✅ Includes timestamp
- ✅ Includes uptime
- ✅ Returns JSON content type
- ✅ Responds quickly

**Usage**:
```bash
pnpm test:backend tests/integration/server/health.test.ts
```

### 2. Reddit Service Test
**File**: `tests/integration/server/reddit-service.test.ts`

Tests the Reddit service (`getTop` and `verifyRedditUser` functions) using **Nock** for HTTP mocking:
- ✅ Successfully fetch top posts
- ✅ Handle 429 rate limit error
- ✅ Handle 500 server error
- ✅ Handle OAuth token failure
- ✅ Handle network errors
- ✅ Use default subreddit
- ✅ Respect limit parameter
- ✅ Handle missing credentials
- ✅ Verify Reddit user (exists/not exists)
- ✅ Handle network errors in user verification

**Usage**:
```bash
pnpm test:backend tests/integration/server/reddit-service.test.ts
```

### 3. Database-Backed Endpoint Test
**File**: `tests/integration/server/database-endpoint.test.ts`

Tests database-backed endpoints using **Supertest** and **real Postgres**:
- ✅ Check user exists endpoint
- ✅ Create user in database
- ✅ Handle duplicate user submission
- ✅ Create contractor record
- ✅ Return 404 when user doesn't exist
- ✅ Handle transaction rollback on error

**Usage**:
```bash
pnpm test:backend tests/integration/server/database-endpoint.test.ts
```

## Setup & Teardown

All tests use `globalThis.__APP__` pattern for app instance management:

```typescript
declare global {
  var __APP__: ReturnType<typeof createServer> | undefined;
}

beforeAll(() => {
  if (globalThis.__APP__) {
    app = globalThis.__APP__;
  } else {
    app = createServer();
    globalThis.__APP__ = app;
  }
});
```

This ensures:
- App instance is created once and reused
- Proper cleanup in afterAll hooks
- Efficient test execution

## Dependencies

- **supertest**: HTTP assertion library for Express
- **nock**: HTTP server mocking library
- **@types/nock**: TypeScript types for nock

Install with:
```bash
pnpm install
```

## Running Tests

```bash
# Run all backend tests
pnpm test:backend

# Run specific test file
pnpm test:backend tests/integration/server/health.test.ts

# Run with coverage
pnpm test:backend:coverage

# Watch mode
pnpm test:backend:watch
```

## Test Structure

```
tests/integration/server/
├── health.test.ts              # Health route tests
├── reddit-service.test.ts      # Reddit service tests (Nock)
└── database-endpoint.test.ts   # Database endpoint tests (Supertest + Postgres)
```

## Key Features

### Nock Mocking (Reddit Service)
- Mocks Reddit OAuth token endpoint
- Mocks Reddit API endpoints
- Handles success, 429, 500, and network errors
- Cleans up interceptors after each test

### Supertest (API Endpoints)
- Tests full HTTP request/response cycle
- Validates status codes, response bodies, headers
- Tests error handling

### Real Postgres (Database Tests)
- Uses actual database connection
- Tests database operations
- Verifies data persistence
- Tests transaction rollbacks

## Environment Variables

Tests automatically set:
- `NODE_ENV=test`
- `REDDIT_CLIENT_ID=test_client_id`
- `REDDIT_CLIENT_SECRET=test_client_secret`
- `TEST_DATABASE_URL` (from test setup)

## Notes

- Database tests require a running PostgreSQL instance
- See `tests/TEST_DATABASE_SETUP.md` for database setup
- Nock interceptors are cleaned after each test
- App instance is reused across tests for efficiency

