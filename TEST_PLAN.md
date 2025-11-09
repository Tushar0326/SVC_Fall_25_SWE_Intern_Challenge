# Comprehensive Test Plan - 100% Coverage

## Overview

This document outlines a complete test strategy to achieve 100% test coverage for both frontend (React + Vite) and backend (Express + PostgreSQL) codebases.

---

## Table of Contents

1. [Backend Test Plan](#backend-test-plan)
2. [Frontend Test Plan](#frontend-test-plan)
3. [Integration Test Plan](#integration-test-plan)
4. [Test Infrastructure Setup](#test-infrastructure-setup)
5. [External API Mocking Strategy](#external-api-mocking-strategy)
6. [Database Setup for Tests](#database-setup-for-tests)
7. [Edge Cases & Unhappy Paths](#edge-cases--unhappy-paths)
8. [Coverage Goals & Metrics](#coverage-goals--metrics)

---

## Backend Test Plan

### Files Requiring Tests

#### ✅ Already Tested (Maintain & Enhance)
- `server/routes/demo.ts` - ✅ Covered
- `server/routes/social-qualify-form.ts` - ✅ Covered (enhance edge cases)
- `server/routes/contractor-request.ts` - ✅ Covered (enhance edge cases)
- `server/index.ts` - ✅ Partially covered (enhance error handler)

#### ❌ Missing Tests

1. **`server/index.ts`**
   - Global error handler middleware
   - Request logging middleware
   - CORS configuration
   - Express middleware stack
   - Environment variable validation

2. **`server/routes/test-mongo.ts`** (or remove if dead code)
   - If keeping: test endpoint response
   - If removing: document removal

3. **`server/node-build.ts`**
   - Server startup logic
   - Production build handling

### Backend Test Types

#### Unit Tests
- **Location**: `tests/unit/server/`
- **Focus**: Pure functions, utilities, validation logic
- **Examples**:
  - Request body parsing utilities
  - Zod schema validation edge cases
  - Error message formatting

#### Integration Tests (API Endpoints)
- **Location**: `tests/integration/`
- **Focus**: Full HTTP request/response cycles
- **Current**: `tests/*.test.ts` (maintain structure)
- **Enhancements**:
  - Database transaction rollbacks
  - Connection pool exhaustion
  - Concurrent request handling

#### Database Integration Tests
- **Location**: `tests/integration/database/`
- **Focus**: Database operations, constraints, transactions
- **Coverage**:
  - Foreign key constraints
  - Unique constraints
  - Transaction rollbacks
  - Connection pool management

---

## Frontend Test Plan

### Files Requiring Tests

#### Components (`client/components/`)

1. **`MagicLinkAuth.tsx`**
   - Form submission
   - Email validation
   - Loading states
   - Error handling
   - Success state (email sent)
   - Resend functionality

2. **`UserMenu.tsx`**
   - Authenticated state rendering
   - Unauthenticated state rendering
   - Sign out functionality
   - Loading states
   - Dialog open/close

#### Pages (`client/pages/`)

1. **`Index.tsx`**
   - Currency detection
   - Currency API error handling
   - Platform data rendering
   - Navigation handlers
   - CTA button clicks
   - User authentication state display

2. **`SocialQualifyForm.tsx`**
   - Form field validation
   - Form submission flow
   - API error handling
   - Success state rendering
   - Navigation after success
   - Magic link integration
   - User existence check integration

3. **`Marketplace.tsx`**
   - Company list rendering
   - Currency conversion
   - Locked company handling
   - Navigation to company pages
   - Alert display logic

4. **`SiliconValleyConsulting.tsx`**
   - Contractor request submission
   - Authentication checks
   - Currency display
   - Button state management
   - Error message handling
   - Navigation logic

5. **`NotFound.tsx`**
   - 404 rendering
   - Console error logging
   - Navigation link

#### Hooks (`client/hooks/`)

1. **`useAuth.tsx`**
   - Initial session loading
   - Auth state changes
   - Sign in with magic link
   - Sign out
   - Error handling
   - Session persistence

2. **`useCurrency.ts`**
   - Currency detection
   - API error handling
   - Fallback to USD
   - Exchange rate fetching
   - Formatting function

3. **`use-mobile.tsx`** (if custom logic)
   - Mobile detection
   - Window resize handling

#### Utilities (`client/lib/`)

1. **`utils.ts`** - ✅ Already tested (`utils.spec.ts`)
2. **`supabase.ts`**
   - Client initialization
   - Configuration validation

#### App Entry (`client/App.tsx`)
- Route configuration
- Provider setup
- Error boundary (if exists)

### Frontend Test Types

#### Component Unit Tests
- **Location**: `tests/unit/client/components/`
- **Tools**: Vitest + React Testing Library
- **Focus**: Component rendering, user interactions, state changes

#### Hook Unit Tests
- **Location**: `tests/unit/client/hooks/`
- **Tools**: Vitest + `@testing-library/react-hooks` (or renderHook)
- **Focus**: Hook logic, state management, side effects

#### Page Integration Tests
- **Location**: `tests/integration/client/pages/`
- **Tools**: Vitest + React Testing Library + MSW
- **Focus**: Full page flows, API interactions, navigation

#### Utility Tests
- **Location**: `tests/unit/client/lib/`
- **Focus**: Pure functions, helpers

---

## Integration Test Plan

### E2E User Flows
- **Location**: `tests/e2e/`
- **Tools**: Playwright or Cypress (recommend Playwright)
- **Scenarios**:
  1. Complete qualification form submission
  2. User sign-in flow
  3. Contractor request flow
  4. Navigation between pages
  5. Error recovery flows

### API Integration Tests
- **Location**: `tests/integration/api/`
- **Focus**: Full stack integration
- **Coverage**:
  - Form submission → Database → Response
  - Authentication → API calls
  - Error propagation frontend → backend

---

## Test Infrastructure Setup

### Vitest Configuration

#### Frontend Config (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup-frontend.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/frontend',
      include: ['client/**/*.{ts,tsx}'],
      exclude: [
        'client/**/*.test.{ts,tsx}',
        'client/**/*.spec.{ts,tsx}',
        'client/components/ui/**', // Third-party UI library
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
```

#### Backend Config (Enhance existing `vitest.config.backend.ts`)
```typescript
// Update thresholds to 100%
thresholds: {
  global: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
  },
},
```

### Test Setup Files

#### `tests/setup-frontend.ts`
```typescript
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
```

#### `tests/setup-backend.ts` (Enhance existing)
- Add database transaction rollback
- Add connection pool management
- Add cleanup utilities

---

## External API Mocking Strategy

### APIs to Mock

#### 1. Reddit API (Already Mocked with MSW)
- **Location**: `tests/mocks/reddit.ts`
- **Endpoints**:
  - `POST https://www.reddit.com/api/v1/access_token`
  - `GET https://oauth.reddit.com/user/{username}/about`
- **Scenarios**:
  - ✅ Successful OAuth token
  - ✅ Successful user verification
  - ✅ User not found (404)
  - ✅ OAuth failure (401)
  - ✅ Network error
  - **NEW**: Rate limiting (429)
  - **NEW**: Timeout scenarios
  - **NEW**: Malformed JSON response
  - **NEW**: Invalid token response

#### 2. Currency Detection APIs (New - For Frontend Tests)

**IP API (`https://ipapi.co/json/`)**
- **Location**: `tests/mocks/ipapi.ts`
- **Scenarios**:
  - Successful detection (various currencies)
  - Network timeout
  - Invalid response
  - Rate limiting

**Exchange Rate API (`https://api.exchangerate-api.com/v4/latest/USD`)**
- **Location**: `tests/mocks/exchange-rate.ts`
- **Scenarios**:
  - Successful rate fetch
  - Missing currency in rates
  - Network error
  - Invalid JSON

#### 3. Supabase Auth (For Frontend Tests)
- **Location**: `tests/mocks/supabase.ts`
- **Mock**: `@supabase/supabase-js` client
- **Scenarios**:
  - Successful magic link send
  - Invalid email
  - Network error
  - Session management

### MSW Handler Structure

```
tests/mocks/
├── handlers.ts          # Combined handlers
├── reddit.ts           # Reddit API mocks
├── ipapi.ts            # IP geolocation mocks
├── exchange-rate.ts    # Exchange rate mocks
└── supabase.ts         # Supabase auth mocks
```

---

## Database Setup for Tests

### Test Database Strategy

#### Option 1: Shared Test Database (Current)
- **Pros**: Fast, simple
- **Cons**: Potential test interference
- **Enhancement**: Use transactions with rollback

#### Option 2: Isolated Test Databases (Recommended for 100% Coverage)
- **Pros**: Complete isolation, parallel execution
- **Cons**: Slower setup
- **Implementation**: Docker containers per test suite

### Database Test Utilities

#### `tests/utils/database.ts`
```typescript
import { Pool } from 'pg';

export async function setupTestDatabase(): Promise<Pool> {
  // Create isolated test database
  // Return connection pool
}

export async function cleanupTestDatabase(pool: Pool): Promise<void> {
  // Truncate all tables
  // Reset sequences
}

export async function withTransaction<T>(
  pool: Pool,
  callback: (client: Pool) => Promise<T>
): Promise<T> {
  // Execute in transaction, rollback after
}
```

### Test Data Factories

#### `tests/factories/user.ts`
```typescript
export function createTestUser(overrides?: Partial<User>): User {
  return {
    email: `test-${Date.now()}@example.com`,
    phone: '1234567890',
    reddit_username: 'testuser',
    ...overrides,
  };
}
```

### Database Test Scenarios

1. **Connection Pool Exhaustion**
   - Test behavior when max connections reached

2. **Transaction Rollbacks**
   - Test partial writes, constraint violations

3. **Concurrent Operations**
   - Test race conditions (duplicate submissions)

4. **Foreign Key Constraints**
   - Test contractor creation without user

5. **Unique Constraints**
   - Test duplicate email/phone combinations

---

## Edge Cases & Unhappy Paths

### Backend Edge Cases

#### Request Body Parsing
- ✅ Buffer parsing (covered)
- ✅ String parsing (covered)
- **NEW**: 
  - Empty body
  - Content-Type mismatch
  - Chunked encoding
  - Very large payloads (>10MB)
  - Invalid UTF-8 sequences
  - Nested object depth limits

#### Validation Edge Cases
- **Email**:
  - Plus addressing (`user+tag@example.com`)
  - International domains
  - Very long emails (255+ chars)
  - Special characters
  - SQL injection attempts

- **Phone**:
  - International formats (+44, etc.)
  - Extensions (x123)
  - Non-numeric characters
  - Very long numbers
  - Empty/null/undefined

- **Reddit Username**:
  - Case sensitivity
  - Special characters
  - Very long usernames
  - Banned/deleted accounts
  - Unicode characters

#### Database Edge Cases
- Connection timeout during query
- Deadlock scenarios
- Constraint violations
- Partial transaction failures
- Connection pool exhaustion
- Database unavailable

#### API Integration Edge Cases
- Reddit API:
  - Rate limiting (429)
  - Timeout (no response)
  - Malformed JSON
  - Invalid token format
  - Token expiration during request

### Frontend Edge Cases

#### Form Validation
- Client-side validation bypass
- Browser autofill
- Paste events with invalid data
- Special characters in inputs
- Very long input values
- Unicode/emoji in inputs

#### API Error Handling
- Network failures (offline)
- Slow network (timeout)
- Partial responses
- CORS errors
- 500 errors
- 404 errors
- Malformed JSON responses

#### Authentication Edge Cases
- Expired sessions
- Invalid magic link tokens
- Multiple tabs with different auth states
- Sign out during active request
- Session refresh failures

#### Navigation Edge Cases
- Browser back button after form submission
- Direct URL access to protected routes
- Navigation during API call
- Browser refresh during form submission

#### Currency Detection Edge Cases
- API timeout
- Invalid currency code
- Missing exchange rate
- Network failure
- CORS errors
- Rate limiting

---

## Coverage Goals & Metrics

### Coverage Targets

#### Backend
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

#### Frontend
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

### Exclusions (Justified)

1. **UI Component Library** (`client/components/ui/**`)
   - Third-party Radix UI components
   - Already tested by library maintainers

2. **Type Definitions** (`*.d.ts`)
   - Type-only files

3. **Configuration Files**
   - `vite.config.ts`, `tailwind.config.ts`
   - Tested through usage

4. **Entry Points** (if minimal)
   - `client/App.tsx` (if only routing)
   - Document if excluded

### Coverage Reporting

#### Scripts (`package.json`)
```json
{
  "scripts": {
    "test": "vitest run",
    "test:frontend": "vitest --config vitest.config.ts",
    "test:backend": "vitest --config vitest.config.backend.ts",
    "test:all": "npm run test:frontend && npm run test:backend",
    "test:coverage": "npm run test:frontend:coverage && npm run test:backend:coverage",
    "test:coverage:frontend": "vitest --config vitest.config.ts --coverage",
    "test:coverage:backend": "vitest --config vitest.config.backend.ts --coverage",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

#### CI Integration
- Run coverage on every PR
- Fail if coverage drops below 100%
- Generate coverage reports (HTML + LCOV)
- Upload to coverage service (Codecov, Coveralls)

---

## Test File Structure

```
tests/
├── unit/
│   ├── client/
│   │   ├── components/
│   │   │   ├── MagicLinkAuth.test.tsx
│   │   │   └── UserMenu.test.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.test.tsx
│   │   │   └── useCurrency.test.tsx
│   │   └── lib/
│   │       └── supabase.test.ts
│   └── server/
│       └── utils/
│           └── parsing.test.ts
├── integration/
│   ├── client/
│   │   └── pages/
│   │       ├── Index.test.tsx
│   │       ├── SocialQualifyForm.test.tsx
│   │       ├── Marketplace.test.tsx
│   │       ├── SiliconValleyConsulting.test.tsx
│   │       └── NotFound.test.tsx
│   ├── api/
│   │   ├── social-qualify-form.integration.test.ts
│   │   └── contractor-request.integration.test.ts
│   └── database/
│       ├── transactions.test.ts
│       └── constraints.test.ts
├── e2e/
│   ├── qualification-flow.spec.ts
│   ├── contractor-request-flow.spec.ts
│   └── authentication-flow.spec.ts
├── mocks/
│   ├── handlers.ts
│   ├── reddit.ts
│   ├── ipapi.ts
│   ├── exchange-rate.ts
│   └── supabase.ts
├── factories/
│   ├── user.ts
│   └── contractor.ts
├── utils/
│   ├── database.ts
│   ├── test-helpers.ts
│   └── render-helpers.tsx
├── setup-frontend.ts
├── setup-backend.ts
└── README.md
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Setup frontend test configuration
2. ✅ Create test setup files
3. ✅ Setup MSW for API mocking
4. ✅ Create test utilities and factories

### Phase 2: Backend Completion (Week 2)
1. ✅ Enhance existing backend tests
2. ✅ Add missing endpoint tests
3. ✅ Add database edge case tests
4. ✅ Add error handler tests

### Phase 3: Frontend Core (Week 3)
1. ✅ Test all hooks
2. ✅ Test all components
3. ✅ Test utility functions

### Phase 4: Frontend Pages (Week 4)
1. ✅ Test all page components
2. ✅ Test navigation flows
3. ✅ Test form submissions

### Phase 5: Integration & E2E (Week 5)
1. ✅ Full-stack integration tests
2. ✅ E2E user flows
3. ✅ Performance testing

### Phase 6: Edge Cases & Polish (Week 6)
1. ✅ All edge cases
2. ✅ Unhappy paths
3. ✅ Coverage verification
4. ✅ Documentation

---

## Testing Best Practices

### 1. Test Organization
- One test file per source file
- Group related tests with `describe` blocks
- Use descriptive test names

### 2. Test Data
- Use factories for test data
- Clean up after each test
- Use unique identifiers (timestamps, UUIDs)

### 3. Assertions
- Test behavior, not implementation
- Use meaningful error messages
- Test both positive and negative cases

### 4. Mocking
- Mock external dependencies
- Mock at the boundary (API calls, not internal functions)
- Use MSW for HTTP mocking

### 5. Coverage
- Aim for 100% but prioritize critical paths
- Don't test third-party code
- Document exclusions

---

## Next Steps

1. Review and approve this test plan
2. Setup test infrastructure (configs, setup files)
3. Begin Phase 1 implementation
4. Track progress with coverage reports
5. Iterate based on findings

---

## Questions & Decisions Needed

1. **E2E Tool**: Playwright or Cypress? (Recommend Playwright)
2. **Test Database**: Shared or isolated? (Recommend isolated for 100% coverage)
3. **Coverage Service**: Codecov, Coveralls, or other?
4. **CI/CD**: GitHub Actions, or other?
5. **Dead Code**: Remove `test-mongo.ts` or test it?

---

**Last Updated**: [Current Date]
**Status**: Draft - Pending Review

