# Business Self-Assessment Platform for Performance and Capacity Evaluation

## 1 — Project Title
Business Self-Assessment Platform for Performance and Capacity Evaluation

## 2 — Background
Small and medium-sized enterprises (SMEs) drive employment, innovation, and local economic growth, yet many lack scalable, affordable tools to diagnose operational capacity and performance. Existing diagnostic instruments are often consultant-driven or fragmented. This project digitizes an established diagnostic survey (previously on KoboToolbox) into a self-service web platform that automates scoring, visualization, and tailored feedback, enabling SMEs to iteratively assess and improve.

## 3 — Goal
Deliver a secure, user-friendly online platform enabling SME owners/managers to self-assess across core business functions, receive instant automated feedback and downloadable reports, and allow aggregate analytics for policy and program design.

## 4 — Specific Objectives
- Digitize the SME assessment tool into an online platform.
- Automate per-question scoring, theme means, percentages, and a composite Enterprise Capacity Indicator.
- Provide an interactive dashboard showing performance by thematic area.
- Generate downloadable reports (PDF) with tailored feedback and recommendations.
- Implement a secure database for user and assessment data.
- Enable aggregate analytics to reveal SME trends and capacity gaps.

## 5 — Scope
- Primary users: SME owners, managers, or designated staff.
- Core functionality: user auth/profile, assessment completion, instant scoring & feedback, dashboard visualizations, report download, and aggregated analytics for administrators.
- Initial content: the provided instrument covering 11 thematic areas and their questions (Likert 1–5).
- Exclusions (MVP): advanced benchmarking against external datasets, multi-language beyond a primary language (can be added), and complex payment/subscription flows unless requested.

## 6 — System Features

### 6.1 User Module
- Registration, login, password recovery (email OTP or reset link).
- Business profile setup: business name, location (country/city), sector, employee count, registration type, contact email.
- User dashboard: list of completed assessments, status, historical trend visualizations, option to start new assessment.
- Role-based access: basic users (SME), admins (view aggregates, manage questions), and possibly programme managers (view cohort reports).

### 6.2 Assessment Module
- Assessment presented as thematic sections (11 themes). Each question uses a 1–5 Likert response.
- Ability to save-in-progress and resume.
- Optional guidance/help text per question.
- Review screen and confirmation before submission.
- On-submit: compute scores, show immediate feedback, add to user history, allow download of PDF report.

### 6.3 Admin & Analytics Module
- CRUD for questions, themes, and suggested recommendations.
- View aggregate analytics, filters by sector/location/size/time.
- Export anonymized results (CSV, Excel).
- Manage recommended feedback templates for each scoring band.

## 7 — Thematic Areas and Questions

1. Problem Identification and Market Need (questions: 7)
2. Business Positioning and Target Market (7)
3. Product and Service Development (13)
4. Human Resource and Staffing (11)
5. Marketing Channels and Customer Engagement (17)
6. Marketing Strategy and Practice (11)
7. Business Systems (6)
8. Record Keeping and Planning (10)
9. Assets and Equipment (4)
10. Financial Health and Performance (4)
11. Business Sustainability and Continuity (8)

Total questions: 98 (verify exact count during import; counted from provided list — will validate).

Assumption: Each question is scored 1–5 where 1 = strongly disagree/very poor and 5 = strongly agree/very strong (this mapping is configurable).

## 8 — Data Processing and Feedback Generation

### Scoring rules (specification)
- Per question: integer score 1..5.
- Per thematic area:
  - mean_score_theme = sum(scores for theme) / number_of_questions_in_theme
  - percentage_theme = ((mean_score_theme - 1) / 4) * 100
    - Rationale: map 1..5 onto 0%..100% scale where 1→0% and 5→100%.
- Composite Enterprise Capacity Indicator (ECI):
  - Option A (simple average): composite_mean = sum(mean_score_theme for each theme) / number_of_themes
  - Option B (weighted average): composite_mean = sum(weight_i * mean_score_theme_i) / sum(weights) — weights configurable by admin.
  - composite_percentage = ((composite_mean - 1) / 4) * 100
- Performance bands & feedback mapping:
  - mean 1.0–2.0 (percentage 0–25%) → Needs significant improvement (Action: implement immediate foundational changes; training; accounting setup)
  - mean 2.01–3.0 (25.25–50%) → Below average / some gaps (Action: targeted improvements, mentoring)
  - mean 3.01–4.0 (50.5–75%) → Moderate performance (Action: optimization, scaling)
  - mean 4.01–5.0 (75.75–100%) → Strong performance (Action: scaling, advanced strategies)

Exact band bounds and messaging should be configurable by product/admin.

### Feedback generation
- For each theme, show short textual feedback based on the band and 2–4 tailored recommendations (pull from a template library keyed by theme and band).
- For critical low-scoring questions (score <= 2), show "priority actions" list.
- Provide suggested resources (articles, templates, contact points) possibly as links.

## 9 — Output and Visualization

### Dashboard
- Summary table: theme | mean_score | percentage | band (color-coded).
- Visual charts:
  - Radar chart showing mean_score per theme.
  - Bar chart for theme percentages.
  - Time-series line chart for repeat assessments.
- Color coding:
  - Red: Needs improvement (<=2.0)
  - Orange: Moderate (2.01–3.0)
  - Yellow/Light green: Good (3.01–4.0)
  - Green: Strong (4.01–5.0)
- Interactivity: hover for question-level drilldown, filters by date/sector/location.

### Downloadable Report (PDF)
- Cover: business name, date, composite score, snapshot chart.
- Executive summary: Top strengths, top 3 improvement areas.
- Table: theme scores and band.
- Detailed section: per-theme breakdown with charts and specific recommendations.
- Annex: raw question scores and definitions.
- Footer: suggested next steps and contact info for further support.

Report generation options: server-side PDF rendering (headless Chrome / Puppeteer or wkhtmltopdf), or client-side generation (jsPDF) for small workloads.

## 10 — Data Model (high level)

Entities (example fields):
- User: id, name, email, password_hash, role, created_at, last_login
- BusinessProfile: id, user_id, business_name, sector, country, city, employee_count, registration_type, created_at
- Theme: id, name, description, order, weight (optional)
- Question: id, theme_id, text, help_text, order, reverse_scored (false by default)
- Assessment: id, user_id, business_profile_id, created_at, completed_at, version
- Response: id, assessment_id, question_id, score (1–5), comment(optional)
- ThemeScore: assessment_id, theme_id, mean_score, percentage
- AssessmentSummary: assessment_id, composite_mean, composite_percentage, band

Note: Consider soft deletes and audit logging.

## 11 — API Endpoints (examples)
- POST /api/auth/register {email, password, name}
- POST /api/auth/login {email, password} -> token
- GET /api/themes -> list themes and questions (for rendering)
- POST /api/assessments -> create assessment (initial)
- PUT /api/assessments/{id}/responses -> submit responses
- GET /api/assessments/{id}/results -> computed scores & feedback
- GET /api/users/{id}/assessments -> list of assessments
- GET /api/admin/aggregates?sector=&country=&date_from= -> admin analytics

Auth: JWT or session-based; endpoints protected by middleware.

## 12 — Scoring Algorithm Pseudocode (server-side)
- Input: assessment.responses [{question_id, score}]
- For each theme:
  - gather scores for questions in theme
  - mean = sum(scores)/n
  - percentage = ((mean - 1) / 4) * 100
- composite_mean = average of theme means (or weighted)
- composite_percentage = ((composite_mean - 1) / 4) * 100
- For each theme and composite, determine band and select feedback template
- Save ThemeScore and AssessmentSummary records
- Return results payload with theme breakdown, charts-ready arrays, and feedback text

Edge cases:
- Missing answers: decide (1) require answers to all questions before submit, or (2) compute using available answers and flag "incomplete" — recommend requiring completion for valid scoring or indicate number of unanswered questions.

## 13 — Privacy, Security, and Compliance
- Authentication: secure password hashing (bcrypt/argon2), enforce strong passwords and optional 2FA.
- Authorization: role-based access control.
- Transport: TLS (HTTPS) for all traffic.
- Data encryption: encrypt sensitive PII at rest (database column encryption or full-disk encryption).
- Backups: regular encrypted backups with retention policy.
- Data anonymization: for aggregate exports, remove direct identifiers unless authorized.
- Consent & privacy: present clear terms & data usage consent at registration; implement data deletion request workflow.
- Compliance: recommend alignment with local data protection laws and GDPR if serving EU users.

## 14 — Tech Stack Recommendations (MVP)

**Decision: Node.js + Express + Next.js (Recommended)**

**Rationale:**
- Single language (JavaScript/TypeScript) for full-stack development
- Faster development with shared types/interfaces
- Better ecosystem for PDF generation (Puppeteer)
- Easier team onboarding if team is JS-focused
- Strong community and library support

**Stack Details:**
- **Frontend:** Next.js (React framework) with Tailwind CSS for UI kit
- **Backend:** Node.js + Express (TypeScript recommended)
- **Database:** PostgreSQL (relational fit for structured questions/responses)
- **Authentication:** JWT with refresh tokens (stateless API)
- **Hosting:** 
  - Frontend: Vercel/Netlify
  - Backend: AWS/GCP/Azure (containerized deployment)
  - Database: Managed Postgres (RDS/Cloud SQL)
- **PDF generation:** Puppeteer (headless Chrome) with Bull queue for background jobs
- **Charts:** Chart.js or ApexCharts for dashboard visualizations
- **CI/CD:** GitHub Actions for automated tests and deployments
- **Caching:** Redis for session management and data caching
- **Email:** SendGrid or AWS SES
- **File Storage:** AWS S3, Azure Blob, or GCP Cloud Storage (for PDFs)
- **Monitoring:** Sentry (error tracking), Datadog/New Relic (APM), CloudWatch (logs)
- **State Management:** React Context API or Zustand (lightweight) for MVP

## 15 — UX & Accessibility Notes
- Mobile-first responsive design.
- Clear progress indicators, ability to save and resume.
- Provide examples/help text for Likert choices.
- Use accessible colors and ensure WCAG contrast and keyboard navigation.
- Minimal cognitive load: show one question at a time or grouped per theme.

## 16 — Testing & QA Plan
- Unit tests: scoring functions, API endpoints returning correct aggregates.
- Integration tests: full assessment submission -> results + report generation.
- End-to-end tests: user registration, complete assessment, download PDF (Cypress or Playwright).
- Performance: test report generation under concurrency and DB indices for response retrieval.
- Edge cases: incomplete responses, invalid scores, duplicate submissions.

Sample test cases:
- All 5s -> theme mean = 5, percentage = 100%
- Mixed scores -> correct weighted composite
- Missing answers -> rejection or flagged incomplete.

## 17 — Implementation Roadmap (phased)

**Revised Timeline (includes buffer time)**

Phase 0 — Discovery & Design (1–2 weeks)
- Validate questions, counts, edge cases.
- Finalize UX wireframes and data model.
- **Make explicit tech stack decision.**
- **Set up infrastructure accounts** (cloud, email, monitoring).

Phase 1 — MVP (10–12 weeks, revised from 6–8 weeks)
- **Week 0:** Discovery & setup, infrastructure
- **Weeks 1–3:** Backend core (DB, auth, API, scoring)
- **Weeks 2–5:** Frontend MVP (UI, assessment flow, dashboard)
- **Weeks 4–7:** PDF generation & background jobs
- **Weeks 7–8:** Admin, email service, monitoring
- **Weeks 9–10:** Integration, bug fixes, documentation
- **Weeks 11–12:** QA, security hardening, pilot release

**Key additions:**
- Email service integration
- Monitoring and observability setup
- File storage for PDFs
- Security headers and CSRF protection
- Developer documentation

Phase 2 — Enhancements (4–6 weeks)
- Advanced analytics and cohort filters
- Admin templates for tailored feedback
- Save/resume improvements, multi-language support
- Security hardening and backups
- **Performance optimization**
- **User onboarding improvements**

Phase 3 — Scaling & Integrations (ongoing)
- Role-based program manager views
- External benchmarking, API integrations
- User accounts/org hierarchies and team assessments
- **Horizontal scaling** (load balancers, read replicas)
- **Advanced caching strategies**

(Adjust timeline depending on team size — these are estimates for a small cross-functional team: 2 devs, 1 designer, 1 QA/DevOps part-time.)

## 18 — Acceptance Criteria
- End-users can register, complete, and submit the assessment.
- Scores computed per-theme and composite match the specification and sample tests.
- Dashboard displays theme scores and charts; PDF report contains expected sections and can be downloaded.
- Admin can view aggregated analytics and edit questions/feedback templates.
- Automated tests for scoring pass; application runs in staging with HTTPS.

## 19 — Deliverables
- Source code repo (frontend + backend).
- Database migration scripts and seed data (themes + questions).
- Documentation (this document) + API spec and scoring pseudocode.
- Sample PDF report template.
- Tests (unit and basic E2E).
- Deployment pipeline to staging.

## 20 — Next Steps (recommended immediate actions)
- Confirm exact question count and any edits (e.g., remove duplicates, alter wording).
- Decide on composite scoring rule (equal vs weighted).
- **Make explicit tech stack decision** (Node.js + Express + Next.js recommended).
- **Set up infrastructure accounts** (cloud provider, email service, monitoring).
- Prepare sample dataset (1–3 test businesses) and acceptance test cases.
- **Create developer onboarding guide** template.
- **Set up CI/CD pipeline** skeleton.
- **Define success metrics and KPIs.**
- **Create cost estimation** for infrastructure.

## 21 — Success Metrics & KPIs

### Technical KPIs
- **API response times:** p95 < 500ms
- **PDF generation success rate:** > 99%
- **Database query performance:** p95 < 100ms
- **Error rates:** < 0.1%
- **Uptime:** > 99.5%

### Business KPIs
- **User adoption:**
  - Target: 100 users in first 3 months
  - Target: 50 completed assessments in first month
- **Engagement:**
  - Average time to complete assessment: < 30 minutes
  - Assessment completion rate: > 80%
- **User satisfaction:**
  - NPS score: > 50 (post-assessment survey)

### Analytics Implementation
- **User analytics:** Google Analytics or Mixpanel
- **Custom events:** Assessment started, completed, PDF downloaded
- **Funnel analysis:** Registration → Profile → Assessment → Completion
- **Cohort analysis:** User retention over time

## 22 — Cost Estimation (Monthly MVP)

- **Hosting (AWS/GCP/Azure):** $100-300/month
- **Database (Managed Postgres):** $50-150/month
- **Storage (S3/Blob for PDFs):** $10-50/month
- **CDN (CloudFront/Cloudflare):** $20-100/month
- **Email service (SendGrid/SES):** $15-50/month
- **Monitoring (Datadog/New Relic):** $50-200/month
- **Domain & SSL:** $10-20/month

**Total MVP estimate:** $255-970/month

**Scaling projections:**
- 100 users: $300-500/month
- 1,000 users: $500-1,000/month
- 10,000 users: $1,000-2,500/month

## Assumptions made
- Likert mapping 1..5 is monotonic (higher = better). If some questions should be reverse-scored, add a flag per question.
- All questions are required in MVP unless you prefer permitting partial completion.
- Localization not included in MVP.
- **Questions are immutable** (never edited, only new versions added) for MVP to maintain assessment comparability.
- **Monolithic deployment** for MVP (can refactor to microservices later if needed).

## 23 — Missing Components (To Be Added)

### Critical for MVP
- **Email service integration** (SendGrid/SES) - registration, password reset, assessment completion
- **File storage** (S3/Blob) - PDF storage and retrieval
- **Monitoring setup** - error tracking, APM, log aggregation
- **Security headers** - helmet.js, CSRF protection
- **Input sanitization** - validation and sanitization libraries

### High Priority
- **Developer onboarding guide** - local setup, development workflow
- **Deployment runbook** - pre-deployment checklist, rollback procedures
- **API documentation** - OpenAPI/Swagger specification
- **Performance baselines** - defined targets for response times

### Medium Priority
- **Architecture Decision Records (ADRs)** - document key technical decisions
- **User research plan** - interviews, usability testing
- **Cost tracking** - monitor infrastructure costs