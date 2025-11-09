# Vitest Configuration Reference

## 📁 Configuration Files

### Backend Config
**File**: `vitest.config.backend.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'backend',
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './server/coverage',
      include: ['server/**/*.ts'],
      exclude: [
        'server/**/*.test.ts',
        'server/**/*.spec.ts',
        'server/node-build.ts',
      ],
      all: true, // Include untested files
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
    setupFiles: ['./tests/setup-backend.ts'],
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, './shared'),
      '@server': resolve(__dirname, './server'),
    },
  },
});
```

### Frontend Config
**File**: `client/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'frontend',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../tests/setup-frontend.ts'], // MSW setup
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: path.resolve(__dirname, './coverage'),
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'components/ui/**', // Radix UI
        'vite-env.d.ts',
        '**/*.d.ts',
        'vitest.config.ts',
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
      '@': path.resolve(__dirname, '.'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
```

## 🎯 Key Features

### Backend Config
- ✅ **Environment**: `node`
- ✅ **Coverage Provider**: `v8`
- ✅ **Coverage Thresholds**: 100% (branches, functions, lines, statements)
- ✅ **Untested Files**: Included (`all: true`)
- ✅ **Reports Directory**: `./server/coverage`
- ✅ **Setup File**: `./tests/setup-backend.ts`

### Frontend Config
- ✅ **Environment**: `jsdom`
- ✅ **Coverage Provider**: `v8`
- ✅ **Coverage Thresholds**: 100% (branches, functions, lines, statements)
- ✅ **MSW Setup**: `../tests/setup-frontend.ts`
- ✅ **Reports Directory**: `./client/coverage` (resolved from client/)
- ✅ **React Plugin**: Enabled for JSX/TSX support

## 📊 Coverage Reports

### Backend Reports
Location: `./server/coverage/`
- `index.html` - HTML coverage report
- `lcov.info` - LCOV format for CI/CD
- `coverage-final.json` - JSON format
- Console output (text)

### Frontend Reports
Location: `./client/coverage/`
- `index.html` - HTML coverage report
- `lcov.info` - LCOV format for CI/CD
- `coverage-final.json` - JSON format
- Console output (text)

## 🚀 Usage

### Backend
```bash
# Run tests
pnpm test:backend

# Run with coverage (100% enforced)
pnpm test:backend:coverage

# Watch mode
pnpm test:backend:watch
```

### Frontend (Root Config)
```bash
# Run tests
pnpm test:frontend

# Run with coverage (100% enforced)
pnpm test:frontend:coverage

# Watch mode
pnpm test:frontend:watch
```

### Frontend (Client Config)
```bash
# Run tests from client config
pnpm test:frontend:client

# Run with coverage
pnpm test:frontend:client:coverage

# Watch mode
pnpm test:frontend:client:watch
```

## ⚠️ Coverage Enforcement

Both configs enforce **100% coverage**. Tests will fail if:
- Branches < 100%
- Functions < 100%
- Lines < 100%
- Statements < 100%

## 📝 Notes

- Backend config includes untested files in coverage (`all: true`)
- Frontend config uses MSW setup file for API mocking
- Both use v8 coverage provider for accurate coverage
- Reports are written to separate directories for organization
- All thresholds are set to 100% to enforce complete coverage

