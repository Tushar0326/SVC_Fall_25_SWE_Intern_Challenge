# Test Plan Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

**New dependencies added:**
- `@testing-library/react` - React component testing
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment for tests
- `@vitest/ui` - Test UI (optional)

### 2. Run Tests

```bash
# Run all tests
pnpm test:all

# Run frontend tests only
pnpm test:frontend

# Run backend tests only
pnpm test:backend

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:frontend:watch
pnpm test:backend:watch
```

### 3. View Coverage Reports

After running coverage:
- Frontend: `./coverage/frontend/index.html`
- Backend: `./coverage/backend/index.html`

---

## File Structure Created

```
tests/
├── setup-frontend.ts          # Frontend test setup
├── mocks/
│   ├── handlers.ts            # Combined MSW handlers
│   ├── reddit.ts              # Reddit API mocks
│   ├── ipapi.ts               # IP geolocation mocks
│   ├── exchange-rate.ts       # Exchange rate mocks
│   └── supabase.ts            # Supabase auth mocks
├── utils/
│   └── test-helpers.tsx       # React testing utilities
├── factories/
│   ├── user.ts                # User test data factory
│   └── contractor.ts          # Contractor test data factory
├── unit/
│   └── client/
│       ├── hooks/
│       │   └── useCurrency.test.tsx
│       └── components/
│           └── MagicLinkAuth.test.tsx
└── integration/
    └── client/
        └── pages/
            └── SocialQualifyForm.test.tsx
```

---

## Next Steps to Reach 100% Coverage

### Phase 1: Complete Frontend Hooks (Priority: High)

1. **`tests/unit/client/hooks/useAuth.test.tsx`**
   - Test session loading
   - Test sign in with magic link
   - Test sign out
   - Test auth state changes
   - Test error handling

2. **`tests/unit/client/hooks/use-mobile.test.tsx`** (if custom logic exists)

### Phase 2: Complete Frontend Components (Priority: High)

1. **`tests/unit/client/components/UserMenu.test.tsx`**
   - Test authenticated state
   - Test unauthenticated state
   - Test sign out flow
   - Test dialog interactions

### Phase 3: Complete Frontend Pages (Priority: High)

1. **`tests/integration/client/pages/Index.test.tsx`**
   - Test currency detection
   - Test platform rendering
   - Test navigation
   - Test CTA buttons

2. **`tests/integration/client/pages/Marketplace.test.tsx`**
   - Test company list rendering
   - Test locked companies
   - Test navigation

3. **`tests/integration/client/pages/SiliconValleyConsulting.test.tsx`**
   - Test contractor request submission
   - Test authentication checks
   - Test button states

4. **`tests/integration/client/pages/NotFound.test.tsx`**
   - Test 404 rendering
   - Test navigation link

### Phase 4: Complete Backend Tests (Priority: Medium)

1. **`tests/integration/server/index.test.ts`**
   - Test global error handler
   - Test request logging
   - Test CORS
   - Test middleware stack

2. **`tests/integration/database/transactions.test.ts`**
   - Test transaction rollbacks
   - Test concurrent operations
   - Test connection pool

3. **`tests/integration/database/constraints.test.ts`**
   - Test foreign key constraints
   - Test unique constraints
   - Test validation edge cases

### Phase 5: Edge Cases & Error Scenarios (Priority: Medium)

1. **Backend Edge Cases**
   - Very large payloads
   - Invalid Content-Type
   - SQL injection attempts
   - Connection pool exhaustion
   - Database timeouts

2. **Frontend Edge Cases**
   - Network failures
   - Slow network
   - Browser back button
   - Multiple tabs
   - Form validation edge cases

### Phase 6: E2E Tests (Priority: Low)

1. **`tests/e2e/qualification-flow.spec.ts`**
   - Complete user qualification flow

2. **`tests/e2e/contractor-request-flow.spec.ts`**
   - Complete contractor request flow

3. **`tests/e2e/authentication-flow.spec.ts`**
   - Complete authentication flow

---

## Testing Patterns

### Component Testing Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../utils/test-helpers';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Hook Testing Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(null);
  });

  it('should update state after async operation', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await waitFor(() => {
      expect(result.current.value).toBe('expected');
    });
  });
});
```

### API Integration Testing Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';

describe('API Integration', () => {
  it('should handle API success', async () => {
    server.use(
      http.post('/api/endpoint', () => {
        return HttpResponse.json({ success: true });
      })
    );
    
    // Test component that uses API
  });

  it('should handle API error', async () => {
    server.use(
      http.post('/api/endpoint', () => {
        return HttpResponse.json(
          { success: false, message: 'Error' },
          { status: 400 }
        );
      })
    );
    
    // Test error handling
  });
});
```

---

## Common Issues & Solutions

### Issue: Tests failing due to missing mocks

**Solution**: Ensure all external APIs are mocked in `tests/mocks/handlers.ts`

### Issue: React Router navigation not working in tests

**Solution**: Use `renderWithProviders` which includes `BrowserRouter`

### Issue: Supabase client not mocked

**Solution**: Mock the Supabase client in test setup or use MSW to mock HTTP requests

### Issue: Currency API calls in tests

**Solution**: All currency APIs are mocked in `tests/mocks/ipapi.ts` and `exchange-rate.ts`

### Issue: Database tests interfering with each other

**Solution**: Use transactions with rollback or isolated test databases

---

## Coverage Checklist

### Backend Coverage Checklist

- [ ] `server/index.ts` - Error handler, middleware
- [ ] `server/routes/demo.ts` - ✅ Complete
- [ ] `server/routes/social-qualify-form.ts` - ✅ Complete (enhance edge cases)
- [ ] `server/routes/contractor-request.ts` - ✅ Complete (enhance edge cases)
- [ ] `server/routes/test-mongo.ts` - Remove or test
- [ ] `server/node-build.ts` - Test startup logic

### Frontend Coverage Checklist

- [ ] `client/App.tsx` - Route configuration
- [ ] `client/pages/Index.tsx` - Currency, navigation, rendering
- [ ] `client/pages/SocialQualifyForm.tsx` - ✅ Started (complete)
- [ ] `client/pages/Marketplace.tsx` - Company list, navigation
- [ ] `client/pages/SiliconValleyConsulting.tsx` - Contractor request
- [ ] `client/pages/NotFound.tsx` - 404 page
- [ ] `client/components/MagicLinkAuth.tsx` - ✅ Started (complete)
- [ ] `client/components/UserMenu.tsx` - Auth states, sign out
- [ ] `client/hooks/useAuth.tsx` - Session, sign in, sign out
- [ ] `client/hooks/useCurrency.ts` - ✅ Started (complete)
- [ ] `client/lib/utils.ts` - ✅ Complete
- [ ] `client/lib/supabase.ts` - Client initialization

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Status**: Ready for Implementation
**Last Updated**: [Current Date]

