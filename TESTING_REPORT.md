# Testing Report

## Original tests review
- **Scope covered**: [unit | integration | e2e].
- **Critical areas tested**: [list modules/features].
- **Gaps observed**:
  - [gap 1]
  - [gap 2]
- **Flakiness/instability**: [none | describe cases and frequency].
- **Performance of test suite**: [avg runtime, bottlenecks].
- **CI behavior**: [reliable | intermittent failures | missing checks].

## What I added and why
- **New test cases**:
  - [test name]: validates [behavior]. Rationale: [risk/bug/edge case].
  - [test name]: validates [behavior]. Rationale: [risk/bug/edge case].
- **Fixtures/mocks**: [what was added/updated and why].
- **Coverage deltas**: [line/branch/function % before → after].
- **Regression protections**: [list of bugs reproduced by tests].

## Challenges faced and solutions
- **[challenge]**: [concise description]
  - Solution: [what was done]
  - Trade-offs: [impact]
- **[challenge]**: [concise description]
  - Solution: [what was done]
  - Trade-offs: [impact]

## Repo health assessment
- **Architecture**: [strengths: separation of concerns, clear boundaries | weaknesses: tight coupling, implicit contracts].
- **Tech debt**:
  - [debt item]: [impact on maintainability/testability].
  - [debt item]: [impact on performance/reliability].
- **Testability**:
  - Positives: [pure functions, DI, clear contracts, small components].
  - Risks: [global state, IO in logic, side-effects without seams].
- **Recommended actions**:
  - [action]: expected ROI [high/med/low].
  - [action]: expected ROI [high/med/low].

## How to run the test suite
- **Install dependencies**
  - pnpm: `pnpm install`
  - npm: `npm install`
  - yarn: `yarn install`
- **Unit/integration tests (frontend + backend)**
  - All: `pnpm test` or `pnpm test:all`
  - Frontend only: `pnpm test:frontend`
  - Backend only: `pnpm test:backend`
  - Watch mode: `pnpm test:frontend:watch` or `pnpm test:backend:watch`
  - Coverage: `pnpm test:frontend:coverage` and `pnpm test:backend:coverage`
- **Database-backed tests (if applicable)**
  - Start test DB via Docker (first time): `pnpm test:db:setup`
  - Start container: `pnpm test:db:start`
  - Stop container: `pnpm test:db:stop`
  - Logs: `pnpm test:db:logs`
  - Clean container: `pnpm test:db:clean`
  - DB prep script (wait, migrate, seed if configured): `node scripts/test-db-setup.js`
- **Environment variables**
  - Copy `.env.example` → `.env` and set `DATABASE_URL` or `PG*` variables if tests hit Postgres.

## AI tools used
- **Tools/Models**: [list tools, e.g., Cascade, code search, lint assistants].
- **Assistance provided**: [test planning, test writing, bug triage, refactoring].
- **Human oversight**: [review steps taken].
- **Data sources**: [only local repo code, no external proprietary data].
