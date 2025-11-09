# Quick Start - Frontend Tests

## 🚀 Quick Commands

```bash
# Install dependencies (includes whatwg-fetch)
pnpm install

# Run all frontend tests
pnpm test:frontend

# Run specific test file
pnpm test:frontend tests/unit/client/components/PostsList.test.tsx

# Run with coverage
pnpm test:frontend:coverage

# Watch mode
pnpm test:frontend:watch
```

## 📋 Test Files Created

### 1. PostsList Component Test
**File**: `tests/unit/client/components/PostsList.test.tsx`

Tests component that fetches from `/api/posts`:
- ✅ Success response with posts
- ✅ 500 server error
- ✅ 404 not found
- ✅ Network errors
- ✅ Malformed JSON
- ✅ Empty state
- ✅ Loading state

### 2. useCurrency Branching Logic Test
**File**: `tests/unit/client/hooks/useCurrency-branching.test.tsx`

Tests all branching paths in `useCurrency` hook:
- ✅ USD vs non-USD detection
- ✅ Exchange rate availability checks
- ✅ Error handling (timeout, network, generic)
- ✅ Currency symbol mapping
- ✅ formatCurrency calculations

### 3. useAuth Branching Logic Test
**File**: `tests/unit/client/hooks/useAuth-branching.test.tsx`

Tests all branching paths in `useAuth` hook:
- ✅ Mounted state checks
- ✅ Session loading (success, error, exception, null)
- ✅ Sign out (success, error)
- ✅ Sign in (custom URL, default origin)
- ✅ Auth state changes
- ✅ Provider validation

## 🎯 What's Tested

### PostsList Component
- Fetches from `/api/posts` endpoint
- Displays loading spinner
- Shows posts in cards
- Handles 500 errors
- Handles network errors
- Shows empty state

### Branching Logic
- All `if/else` conditions
- All error handling paths
- All state transitions
- All conditional rendering

## 🔧 Setup

All tests use:
- **MSW** for API mocking
- **whatwg-fetch** for fetch API support
- **React Testing Library** for component testing
- **Vitest** as test runner

## ✅ Ready to Run!

All test files are complete and ready. Just run:
```bash
pnpm install && pnpm test:frontend
```

