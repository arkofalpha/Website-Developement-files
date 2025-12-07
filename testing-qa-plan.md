# Testing & QA Plan

This document defines the testing strategy for the Business Self-Assessment Platform. It covers unit, integration, and end-to-end (E2E) testing, sample test cases (including scoring verification), performance and load testing, test data and environments, CI configuration recommendations, and acceptance criteria.

---

## 1. Testing Goals
- Ensure scoring logic is correct and stable.
- Verify API contract and data integrity between frontend and backend.
- Validate UI flows (registration, assessment, submission, PDF download).
- Catch regressions early via automated tests in CI.
- Validate system behavior under expected load and identify bottlenecks.

---

## 2. Test Types & Scope

1. Unit Tests
- Fast, isolated tests for small code units.
- Focus areas:
  - Scoring logic (theme mean, composite mean, percentage calculation, reverse-scoring)
  - Utility functions (validation, date handling, formatting)
  - Permission checks (RBAC helpers)
- Tools: Jest (Node), pytest (Python), or similar.

2. Integration Tests
- Test interactions between components (API + DB, background jobs).
- Focus areas:
  - API endpoints: assessment creation, responses submission, submit and results retrieval
  - Persistence: theme_scores and assessment_summaries are created correctly
  - Transactional behavior: ensure partial writes are rolled back on failure
  - Email service integration (mock email sending)
  - File storage integration (PDF upload to S3/Blob)
  - Queue system (background job processing)
- Tools: Supertest (Node), pytest + requests (Python), or Postman/Newman for contract tests.

3. Contract Testing (NEW)
- Test API contracts between frontend and backend
- Ensure backward compatibility
- Tools: Pact (recommended) or Postman contract tests
- Version contracts and handle breaking changes

4. End-to-End (E2E) Tests
- Full user flows through the UI in a real browser environment.
- Focus flows:
  - User registration and login (including password reset)
  - Business profile creation
  - Start assessment, save-in-progress, resume, submit
  - View dashboard, download PDF report
  - Admin flows: view analytics, edit feedback templates
- Tools: Playwright (recommended), Cypress

5. Performance & Load Tests
- Validate throughput and response-times under expected concurrency.
- Focus areas:
  - Report (PDF) generation under concurrent requests
  - Bulk assessment submissions (simulating many SMEs)
  - DB query performance for admin analytics endpoints
- Tools: k6 (recommended), Apache JMeter, Artillery

6. Security & Vulnerability Tests
- Dependency scanning, static analysis, and occasional pen tests
- Tools: Snyk, OWASP ZAP, GitHub Dependabot

7. Accessibility Tests
- Automated checks and spot manual reviews
- Tools: axe-core, Lighthouse

---

## 3. Test Environment & Data

Environments:
- Local developer environment for fast iteration
- CI environment for automated tests (PRs)
- Staging environment mirroring production

Databases:
- Use a disposable test DB (SQLite for unit tests where possible, PostgreSQL for integration tests)
- Seed test data: themes, questions, a set of example businesses and users
- **Test data management:**
  - Use factories (e.g., `factory-girl` for Node.js, `factory_boy` for Python)
  - Seed scripts for consistent test data
  - Separate test databases per environment
  - Document test data cleanup strategy

Test data guidelines:
- Provide fixtures for:
  - Complete all-5s responses
  - All-1s responses
  - Mixed responses (edge cases)
  - Responses with missing questions (incomplete) to validate behavior
  - Reverse-scored questions
  - Weighted theme scenarios
- Use factories to generate random but repeatable datasets (e.g., factory_boy, faker)
- **Test data cleanup:** Automatically clean up test data after each test run

---

## 4. Sample Test Cases

A. Scoring Unit Tests (happy path + edge cases)

1. All 5s -> Theme mean = 5, percentage = 100%
- Input: responses for a theme: [5,5,5]
- Expected: mean = 5.00, percentage = 100.00

2. All 1s -> Theme mean = 1, percentage = 0%
- Input: [1,1,1]
- Expected: mean = 1.00, percentage = 0.00

3. Mixed scores
- Input: [1,3,5]
- Expected: mean = 3.00, percentage = 50.00

4. Reverse scored question
- Setup: question flagged reverse_scored
- Input raw score: 5 -> treated as 1 (6 - 5)
- Verify overall theme mean reflects reversed scoring

5. Composite weighted vs unweighted
- Setup themes with weights [1, 2]
- Verify composite mean calculation uses weights

6. Missing/partial responses
- Behavior 1 (MVP): require all questions — submission fails with 400 + errors listing missing questions
- Behavior 2 (optional): compute using available answers and mark assessment as incomplete

B. API Integration Tests

1. Create assessment -> returns draft with theme/question payload
2. Submit responses -> verify responses persisted (unique constraint enforced)
3. Submit assessment -> verify theme_scores and assessment_summary are created and assessment.status set to completed
4. Attempt duplicate response -> returns 409 or updates existing depending on business rules

C. E2E Tests (Playwright/Cypress)

1. Register -> verify email verification prompt shown
2. Login -> land on dashboard
3. Create business profile -> profile visible
4. Start assessment -> answer all questions -> submit -> see results page with charts and download PDF link
5. Download PDF -> assert non-empty (and optionally verify textual content like theme names present)

D. Performance Tests

1. PDF generation under concurrency
- Scenario: N concurrent PDF generation jobs (N = 10, 50, 100)
- Metrics: mean latency, p95/p99 latency, error rate
- Success criteria: p95 < 10s for N=10; p95 < 30s for N=50 (tune according to infra)

2. Bulk submissions
- Scenario: 1000 assessments submitted over 10 minutes
- Metrics: throughput, error rate, DB connection utilization

---

## 5. Test Automation & CI Integration

Suggested pipeline (GitHub Actions example):
- On PR:
  - Run lint and unit tests (fast)
  - Run type checks (if using TypeScript)
  - Run integration tests against a transient test DB (Postgres container)
  - Run E2E smoke tests (headless) for main flows
- On merge to main:
  - Run full test suite (including performance smoke-tests in staging)
  - Build artifacts and run container image scanning

Example GitHub Actions matrix jobs:
- job: test
  - steps: setup node / install / run lint / run unit tests
- job: integration (needs: test)
  - steps: start postgres service / run migrations / run integration tests
- job: e2e (needs: integration)
  - steps: deploy to ephemeral environment or use staging / run Playwright tests

---

## 6. Test Code Examples

A. Jest unit test for scoring (Node.js / TypeScript)

```ts
// score.test.ts
import { calculateScores } from '../src/score';

test('all 5s yields mean 5 and 100%', () => {
  const responses = [5,5,5];
  const mean = calculateMean(responses);
  const percentage = calculatePercentage(mean);

  expect(mean).toBeCloseTo(5.0, 2);
  expect(percentage).toBeCloseTo(100.0, 2);
});
```

B. Supertest integration test (Express)

```js
const request = require('supertest');
const app = require('../src/app');

describe('Assessments API', () => {
  it('creates assessment and returns themes', async () => {
    const res = await request(app)
      .post('/api/assessments')
      .send({ businessProfileId: 'some-uuid' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.themes.length).toBeGreaterThan(0);
  });
});
```

C. Playwright E2E snippet

```ts
import { test, expect } from '@playwright/test';

test('user can complete assessment and download report', async ({ page }) => {
  await page.goto('https://staging.example.com');
  await page.click('text=Register');
  // fill registration, verify email via mock, login
  // create profile
  await page.click('text=Start Assessment');
  // answer questions: click first option for each
  await page.locator('.question-option').first().click();
  // submit, wait for results
  await page.click('text=Submit');
  await expect(page.locator('text=Overall Performance Score')).toBeVisible();
  // click download
  await page.click('text=Download PDF');
  // optionally, verify a downloaded file exists via fixtures
});
```

---

## 7. Test Reporting & Metrics

### Test Coverage Targets
- **Scoring module:** 95%+ (critical business logic)
- **API endpoints:** 80%+ (happy path + error cases)
- **Frontend components:** 70%+ (user interactions)
- **Overall:** 75%+ minimum
- **Controllers and services:** 60%+ minimum

### Test Results & Reporting
- Publish test result artifacts in CI (JUnit XML)
- Surface failing tests in PRs
- Generate coverage reports (HTML) and publish to CI
- Track coverage trends over time

### Performance Metrics
- Store k6 run outputs and track p95/p99 over time
- **Performance Baselines:**
  - API Response Times: p95 < 500ms
  - Assessment creation: p95 < 200ms
  - Score calculation: p95 < 500ms
  - PDF generation: p95 < 10s (single user)
  - Database queries: p95 < 100ms
  - Analytics queries: p95 < 2s

### Flaky Tests
- Track flakiness and quarantine unstable tests
- Require investigation and fix within 1 sprint
- Use retry logic sparingly (prefer fixing root cause)

---

## 8. QA Process Definition

### Test Ownership
- **Unit tests:** Developers write, run in CI
- **Integration tests:** Developers write, QA reviews
- **E2E tests:** QA writes, run in CI and staging
- **Manual testing:** QA performs before each release
- **UAT:** Product owner + stakeholders

### Bug Triage Process
- **Severity levels:**
  - **Critical:** System down, data loss, security breach (fix within 24 hours)
  - **High:** Major feature broken, significant UX issue (fix within 1 week)
  - **Medium:** Minor feature issue, moderate UX problem (fix within 2 weeks)
  - **Low:** Cosmetic issues, minor improvements (fix in next sprint)
- **Process:** Bug reported → Triage → Assign → Fix → Verify → Close
- **SLA:** Critical bugs fixed within 24 hours

### Release Criteria Checklist
Before any release to production:
- [ ] All automated tests passing
- [ ] Test coverage targets met (75%+ overall, 95%+ for scoring)
- [ ] Manual QA sign-off
- [ ] Security scan passed (no critical vulnerabilities)
- [ ] Performance benchmarks met (p95 targets)
- [ ] Documentation updated (API docs, runbook)
- [ ] Rollback plan tested
- [ ] Stakeholder approval
- [ ] Monitoring dashboards configured
- [ ] Backup/restore tested

## 9. Acceptance Criteria

The project is ready for release to staging when:
- All unit tests for scoring pass and are included in CI.
- Integration tests covering assessment submission and scoring pass.
- E2E smoke tests for key flows pass in a staging environment.
- Performance smoke tests show acceptable latencies for expected load (p95 targets met).
- Security scans show no critical vulnerabilities.
- **Contract tests pass (frontend/backend compatibility).**
- **Accessibility tests pass (WCAG AA basic).**

---

## 10. Test Maintenance & Ownership

- Assign a QA lead responsible for test suites maintenance and triage of flaky tests.
- Keep test data and fixtures under source control and refreshed periodically.
- Review tests during code reviews; add tests for new features.
- **Test review process:** All new features require corresponding tests
- **Flaky test policy:** Quarantine and fix within 1 sprint

---

## 11. Next Steps & Deliverables

- Implement the scoring unit tests (examples provided above) and add to CI.
- Create integration test scripts for critical endpoints.
- Write Playwright E2E scripts covering main user flows and run them in CI.
- Define performance thresholds and run baseline k6 tests in staging.
- **Set up contract testing** (Pact or Postman contracts).
- **Add accessibility testing** automation (@axe-core/react).
- **Create test data factories** for consistent test data generation.
- **Document test maintenance** procedures and ownership.

---

## 12. Accessibility Testing Details

### Automated Accessibility Tests
- Use `@axe-core/react` for automated a11y tests in E2E suite
- Run Lighthouse accessibility audits in CI
- Target: WCAG 2.1 AA compliance

### Manual Accessibility Review Checklist
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader compatibility (test with NVDA/JAWS)
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Form labels properly associated with inputs
- [ ] Error messages clearly announced
- [ ] Focus indicators visible
- [ ] Alt text for all images
- [ ] ARIA labels where needed

## 13. How to run tests locally (PowerShell examples)

Unit tests (Jest/Node):

```powershell
# install dependencies
npm install
# run unit tests
npm run test:unit
# run with coverage
npm run test:coverage
```

Integration tests (requires a local Postgres)

```powershell
# start postgres (example using docker)
docker run --name sap-postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=app_test -p 5432:5432 -d postgres:15
# run migrations
npm run migrate:test
# run integration tests
npm run test:integration
```

E2E tests (Playwright)

```powershell
# install playwright browsers
npx playwright install
# run tests headless
npm run test:e2e
# run tests headed for debugging
npm run test:e2e --headed
```

Performance test (k6)

```powershell
# run a local k6 script
k6 run --vus 50 --duration 1m tests/perf/pdf-generation.js
```

---

File created for the QA plan. Adjust thresholds and test anchors to your infra and SLAs.