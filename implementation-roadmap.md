# Implementation Roadmap & Timeline

This roadmap converts the project requirements into a realistic, phased implementation plan for an MVP and subsequent improvements. It includes milestones, deliverables, estimated durations, resource assumptions, acceptance criteria, dependencies, and risks. Use this to plan sprints and assign owners.

---

## Summary (MVP scope)
MVP goal: Deliver a secure, usable web platform that lets SME users register, create a business profile, complete the 11-theme self-assessment, receive automated scoring & feedback, view results on an interactive dashboard, and download a PDF report.

MVP core features:
- User auth (register/login/password reset) and business profile
- Assessment UI (complete/save/resume) with 1–5 Likert questions
- Scoring engine and API endpoints
- Dashboard with theme scores and radar/bar charts
- PDF report generation (server-side) and download
- Basic admin: question import/seed and view aggregate analytics
- CI with automated tests and staging deployment

Assumptions:
- Small cross-functional team: 2 developers, 1 designer, 1 QA/DevOps part-time
- Cloud hosting (AWS/GCP/Azure) with managed Postgres
- Questions are final and will be seeded from provided list

---

## High-level timeline (calendar weeks)
**Revised estimate:** 10-12 weeks for MVP (includes 2-4 weeks buffer for integration issues and unexpected delays).
**Original estimate:** 8 weeks (can compress to 6 with parallel work and experienced engineers) - considered optimistic.

Week 0 — Discovery & Setup (1 week)
- Tasks: Finalize requirements, confirm question bank, **make explicit tech stack decision (Node.js + Express recommended)**, set up repos and CI, create staging environment, **set up infrastructure (email service, file storage)**.
- Deliverables: Project plan, seeded question JSON, CI skeleton, staging environment URL, **tech stack decision document, infrastructure setup**.

Weeks 1–3 — Backend Core & Scoring (3 weeks)
- Tasks:
  - Implement DB schema & migrations
  - Seed questions and themes
  - Implement authentication (register/login/password reset) with RBAC
  - Build scoring engine and API endpoints
  - Unit & integration tests for scoring and APIs
- Deliverables: Migrated DB, auth endpoints, assessments API, tests passing in CI.
- Acceptance criteria: endpoints documented, tests green, seed process idempotent.

Weeks 2–5 — Frontend MVP (4 weeks, overlaps backend)
- Tasks:
  - UI design and components (assessment flow, dashboard, report page)
  - Implement assessment UI with save/resume
  - Implement dashboard charts and drilldowns
  - Connect to backend endpoints, handle validation & error states
  - Accessibility checks and responsive design
- Deliverables: Functional SPA (React or Next.js) deployed to staging.
- Acceptance criteria: user can complete and submit an assessment end-to-end in staging.

Weeks 4–7 — PDF Report & Background Jobs (3.5-4 weeks, overlaps frontend)
- Tasks:
  - **Week 4-5:** Template design and HTML/CSS (0.75w)
  - **Week 5-6:** Puppeteer integration and basic generation (0.75w)
  - **Week 6-7:** Queue system, error handling, retry logic (0.5w)
  - **Week 6-7:** Chart rendering in PDF (Chart.js → image conversion) (0.5w)
  - **Week 7:** Testing, optimization, and file storage integration (S3/Blob) (0.5w)
  - Implement background job queue (Bull for Node.js)
  - Link report generation to assessment submission and provide download link
  - Test PDF content and print quality
- Deliverables: Reports generated and downloadable from UI; queued job metrics observed; PDFs stored in cloud storage.
- Acceptance criteria: report PDF accurately reflects assessment data and includes charts; p95 generation time < 10s for single user.

Week 7-8 — Admin & Analytics, QA, Hardening (1.5-2 weeks)
- Tasks:
  - Basic admin UI for viewing aggregates and editing feedback templates
  - **Email service integration** (SendGrid/SES) - registration, password reset, assessment completion emails
  - **Monitoring setup** (error tracking, APM, log aggregation)
  - Run security checklist (MFA for admins, HTTPS, secrets management, **security headers, CSRF protection**)
  - Penetration test planning and vulnerability scanning
  - Full QA run, fix critical issues
  - **Performance baseline testing** (API response times, PDF generation)
- Deliverables: Admin panel MVP, security checklist completed, **monitoring dashboards**, staging sign-off.
- Acceptance criteria: admin can view analytics; no critical vulnerabilities remain; **monitoring alerts configured**.

Week 9-10 — Integration & Buffer (2 weeks)
- Tasks:
  - **Integration testing** between frontend and backend
  - **Bug fixes** from QA phase
  - **Documentation** (developer onboarding guide, deployment runbook, API docs)
  - **Performance optimization** based on testing
  - **Security hardening** final pass
- Deliverables: Integrated system, documentation complete, performance benchmarks met.
- Acceptance criteria: All integration tests pass; documentation reviewed and approved.

Week 11-12 — Staging to Pilot Release (2 weeks)
- Tasks:
  - Deploy to production-like environment
  - Run acceptance E2E tests, performance smoke tests
  - **Disaster recovery testing** (backup/restore procedures)
  - Create rollout plan for pilot users
  - **User onboarding flow** testing
- Deliverables: Pilot release, deployment runbooks, backup and monitoring set up, **DR plan tested**.
- Acceptance criteria: pilot users can onboard without major issues; monitored metrics OK; **RTO ≤ 4 hours, RPO ≤ 1 hour verified**.

---

## Detailed Milestones, Owners & Estimates
(Estimates in developer-weeks; 1 dev-week ≈ 40 hrs)

Milestone A — Project Setup & Discovery
- Duration: 1 week
- Owners: PM/Tech lead, Designer
- Activities: finalize questions, wireframes, set up repo & CI, staging infra
- Output: `requirements`, `seed files`, `CI pipeline (skeleton)`

Milestone B — Backend Core & Tests
- Duration: 3 dev-weeks
- Owners: Backend dev
- Activities:
  - DB schema & migrations (0.5w)
  - Seeding questions & import scripts (0.5w)
  - Auth (registration/login/password reset, token handling) (0.75w)
  - Assessments API (create, save responses, submit) (0.75w)
  - Scoring service & unit tests (0.5w)
  - Integration tests (0.5w)
- Output: API endpoints, test coverage >= 80% for core modules

Milestone C — Frontend MVP
- Duration: 4 dev-weeks (can be parallel by two devs to shorten to 2w)
- Owners: Frontend dev + Designer
- Activities:
  - UI components & routing (1w)
  - Assessment flow + save/resume (1w)
  - Dashboard charts + visualization (1w)
  - Connect to APIs, validation, error handling, responsive & accessibility (1w)
- Output: Complete assessment UX, dashboard, and report page in staging

Milestone D — PDF Reports & Background Jobs
- Duration: 2.5-3 dev-weeks (revised from 2 weeks)
- Owners: Backend dev
- Activities:
  - Implement report templates (HTML/CSS) (0.75w)
  - Implement Puppeteer-based generation and queue processing (0.75w)
  - Chart rendering in PDF (Chart.js → image conversion) (0.5w)
  - Integrate with UI and storage (S3/Blob) (0.5w)
  - Error handling, retry logic, and testing (0.5w)

Milestone E — Admin, Security, QA & Launch Prep
- Duration: 2–3 dev-weeks (revised from 1-2 weeks)
- Owners: Backend + DevOps + QA
- Activities:
  - Admin analytics and feedback template editor (1w)
  - Email service integration (0.5w)
  - Monitoring and observability setup (0.5w)
  - Security hardening (headers, CSRF, input sanitization) (0.5w)
  - Backups, DR testing, monitoring (0.5w)
  - Final QA and acceptance tests (0.5w)
  - Documentation (developer guide, runbook) (0.5w)
- Output: Staging signed off and pilot plan ready, monitoring dashboards live

---

## Sprint Plan (2-week sprints example)
- Sprint 1 (Weeks 0–1): Discovery, repo/CICD, DB schema, seed import
- Sprint 2 (Weeks 2–3): Auth, assessments API, scoring tests
- Sprint 3 (Weeks 4–5): Frontend assessment UI, connect to backend, basic dashboard
- Sprint 4 (Weeks 6–7): PDF generation, background jobs, admin UI, QA
- Sprint 5 (Weeks 8–9): Staging hardening, pilot release, bug fixes

---

## Acceptance Criteria (per milestone)
- All endpoints documented in OpenAPI and covered by integration tests.
- Scoring module unit tests pass and coverage reported.
- Frontend implements save/resume and validates input; accessible (WCAG AA basic).
- PDF reports contain chart images and theme breakdowns as in design spec.
- Admin can view aggregate metrics and edit feedback templates.
- CI runs and prevents merging failing PRs.

---

## Dependencies
- Finalized question bank and wording
- Cloud account and infra (S3, managed Postgres, KMS)
- Team availability for parallel work (frontend/back) to meet 6–8 week estimate

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Scope creep | High | Medium | Maintain strict MVP list, push extras to backlog; change control process | PM |
| Team member unavailability | Medium | High | Cross-train team, document knowledge, pair programming | PM |
| PDF generation complexity | Medium | Medium | Allocate 2.5-3 weeks instead of 2; use queue system, retry logic | Backend Dev |
| Database performance issues | Low | High | Load testing, query optimization, proper indexes, connection pooling | Backend Dev |
| Third-party service outages | Low | Medium | Use multiple providers, graceful degradation, monitoring | DevOps |
| Security breach | Low | Critical | Security audits, penetration testing, monitoring alerts | Security Lead |
| Integration issues | Medium | High | Add 2-week integration buffer; continuous integration testing | Tech Lead |
| Data privacy/regulatory issues | Low | High | Implement data minimization and configurable retention from the start; consult legal early | PM/Legal |
| Resource constraints | Medium | Medium | Stagger tasks and use contractors for short bursts (e.g., PDF expert) | PM |

---

## Monitoring & Post-launch

### Monitoring Setup
- **Application Monitoring (APM):** New Relic, Datadog, or open-source (Prometheus + Grafana)
- **Error Tracking:** Sentry or Rollbar
- **Log Aggregation:** ELK stack, CloudWatch, or Datadog
- **Uptime Monitoring:** Pingdom, UptimeRobot
- **Custom Dashboards:** Business metrics (assessments completed, user registrations)

### Key Metrics to Monitor
- **Technical KPIs:**
  - API response times (p95 < 500ms target)
  - PDF generation success rate (> 99% target)
  - Database query performance (p95 < 100ms)
  - Error rates (< 0.1% target)
  - Uptime (> 99.5% target)
- **Business KPIs:**
  - Daily active assessments
  - Time-to-complete assessment (< 30 minutes target)
  - Assessment completion rate (> 80% target)
  - User registration rate
  - PDF download rate

### Post-launch Plan
- Iterative improvements every 2 weeks based on user feedback
- Weekly review of monitoring dashboards
- Monthly performance optimization sprints
- Quarterly security audits

---

## Tech Stack Decision

**Recommended: Node.js + Express + Next.js**

**Rationale:**
- Single language (JavaScript/TypeScript) for full-stack development
- Faster development with shared types/interfaces
- Better ecosystem for PDF generation (Puppeteer)
- Easier team onboarding if team is JS-focused
- Strong community and library support

**Alternative considered:** Python Django/DRF - viable but requires Python expertise and separate frontend team coordination.

## Cost Estimation (Monthly MVP)

- **Hosting (AWS/GCP/Azure):** $100-300/month
- **Database (Managed Postgres):** $50-150/month
- **Storage (S3/Blob for PDFs):** $10-50/month
- **CDN (CloudFront/Cloudflare):** $20-100/month
- **Email service (SendGrid/SES):** $15-50/month
- **Monitoring (Datadog/New Relic):** $50-200/month
- **Domain & SSL:** $10-20/month

**Total MVP estimate:** $255-970/month

## Next actions (immediate)
1. Review and sign off roadmap and MVP scope (product owner).
2. **Make explicit tech stack decision** (Node.js recommended).
3. **Set up infrastructure accounts** (cloud provider, email service, monitoring).
4. Create tickets (Jira/GitHub Issues) for milestones and sprint 1 tasks.
5. Implement CI workflow to run unit/integration tests.
6. Start backend schema/migrations and seed import for the question bank.
7. **Create developer onboarding guide** template.

---

Prepared by: Project Tech Lead
Date: 2025-11-09


