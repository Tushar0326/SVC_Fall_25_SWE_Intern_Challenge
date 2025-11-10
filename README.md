# 🧪 SVC Fall ’25 — SWE Intern Testing & CI Challenge  
### **Testing Report — Tushar Raj Choudhary**

---

## 1. 🔍 Original Tests Review

The initial repository included mostly scaffolded code with:
- ✅ Minimal pre-written frontend tests under `client/` (basic component rendering).
- ✅ Backend `vitest.config.backend.ts` provided but **no existing tests**.
- ❌ No meaningful test coverage or coverage enforcement.
- ❌ No DB lifecycle handling for integration testing.
- ❌ Mocking not set up for external APIs like Reddit’s.
- ❌ Coverage directory committed to repo (tool-generated, should be ignored).

**Key Gaps:**
- No backend API or service tests.
- No error state or edge case handling in tests.
- No automated testing pipeline (CI) or DB setup.
- Frontend network-bound components lacked integration tests or MSW handler usage.

---

## 2. ✅ What I Added & Why

### 🖥️ Backend (Express)
| File/Module                        | Test Added                                | Purpose |
|------------------------------------|-------------------------------------------|---------|
| `server/src/routes/health.ts`      | `tests/backend/health.test.ts`            | Tests `/health` route JSON structure and uptime behavior. |
| `server/src/reddit/service.ts`     | `tests/backend/reddit.service.test.ts`    | Mocks Reddit API via `nock` for success, 429, 5xx cases. |
| `server/src/posts/controller.ts`   | `tests/backend/posts.int.test.ts`         | Full integration w/ DB + Supertest for CRUD + validation. |

### 💻 Frontend (React + Vite)
| Component/File                     | Test Added                                | Notes |
|------------------------------------|-------------------------------------------|-------|
| `client/src/components/Posts.tsx`  | `client/src/components/Posts.test.tsx`    | API success + server error using MSW for mock API. |
| `client/src/hooks/useFetch.ts`     | `client/src/hooks/useFetch.test.ts`       | Handles loading, success, network error, empty data. |

### 🛠️ Automation & Config
- `vitest.config.backend.ts` and `client/vitest.config.ts`
  - Enforces **100% coverage** (`all: true`, per-file, branches/lines/functions/statements).
  - Outputs to `server/coverage/` and `client/coverage/`.
- ✅ Added **GitHub Actions CI pipeline** (`ci.yml`) to run all tests and upload coverage artifacts.
- ✅ Created test DB setup script for auto-migration/seed for local & CI runs.

---

## 3. ⚠️ Issues Faced & Solutions

| Issue | Solution |
|-------|----------|
| Test DB did not initialize automatically | Wrote `test-db-setup.js` to wait for Postgres, run migrations, and seed data |
| External Reddit API rate-limits | Mocked with `nock` for reliable unit testing, optionally bypassed for integration |
| Race conditions in frontend API tests | Introduced MSW for deterministic HTTP layer |
| CI failing due to missing `.env` | Added `.env.example` and auto-generated `.env` in CI step |
| Coverage directory being checked in | Added `/coverage` and `server/coverage` to `.gitignore` |

---

## 4. 🧱 Repo Health Assessment

**✅ Strengths:**
- Organized monorepo structure with clear separation (client/server/shared).
- Uses Vite & Vitest which are compatible for fast dev cycles.

**⚠️ Suggested Improvements:**
- Remove committed `coverage/` folder.
- Introduce dependency inversion for Reddit API wrapper to allow easier injection/mocking.
- Consider automating linting and formatting in CI.

**Testability Score: 8/10**
- Some tight coupling between routes and DB logic could be refactored to improve sealed unit testing.
- Frontend components relied on real network calls — MSW fixed this.

---

## 5. 🚀 How to Run Tests Locally

```bash
# clone repo
git clone https://github.com/<your-username>/SVC_Fall_25_SWE_Intern_Challenge.git

cd SVC_Fall_25_SWE_Intern_Challenge

# install deps & setup env
npm install
cp .env.example .env

# run test suite (backend + frontend)
npm test
