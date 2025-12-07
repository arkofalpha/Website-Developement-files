# Technical Specification: Data Model & API

## Database Schema

### Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user', 'admin', 'program_manager'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete support
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id), -- Audit field
    updated_by UUID REFERENCES users(id), -- Audit field
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'program_manager'))
);

-- Business Profiles table
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    employee_count INTEGER NOT NULL,
    registration_type VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete support
    created_by UUID REFERENCES users(id), -- Audit field
    updated_by UUID REFERENCES users(id), -- Audit field
    CONSTRAINT valid_employee_count CHECK (employee_count >= 0)
);

-- Themes table
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.00, -- For weighted scoring
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_weight CHECK (weight > 0)
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID NOT NULL REFERENCES themes(id),
    text TEXT NOT NULL,
    help_text TEXT,
    order_index INTEGER NOT NULL,
    reverse_scored BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    business_profile_id UUID NOT NULL REFERENCES business_profiles(id),
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'in_progress', 'completed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete support
    created_by UUID REFERENCES users(id), -- Audit field
    updated_by UUID REFERENCES users(id), -- Audit field
    CONSTRAINT valid_status CHECK (status IN ('draft', 'in_progress', 'completed'))
);

-- Responses table
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    score INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_score CHECK (score BETWEEN 1 AND 5),
    UNIQUE(assessment_id, question_id)
);

-- Theme Scores table
CREATE TABLE theme_scores (
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    theme_id UUID NOT NULL REFERENCES themes(id),
    mean_score DECIMAL(3,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (assessment_id, theme_id),
    CONSTRAINT valid_mean_score CHECK (mean_score BETWEEN 1 AND 5),
    CONSTRAINT valid_percentage CHECK (percentage BETWEEN 0 AND 100)
);

-- Assessment Summary table
CREATE TABLE assessment_summaries (
    assessment_id UUID PRIMARY KEY REFERENCES assessments(id),
    composite_mean DECIMAL(3,2) NOT NULL,
    composite_percentage DECIMAL(5,2) NOT NULL,
    performance_band VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_composite_mean CHECK (composite_mean BETWEEN 1 AND 5),
    CONSTRAINT valid_percentage CHECK (composite_percentage BETWEEN 0 AND 100),
    CONSTRAINT valid_band CHECK (
        performance_band IN (
            'needs_improvement',
            'below_average',
            'moderate',
            'strong'
        )
    )
);

-- Feedback Templates table
CREATE TABLE feedback_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID REFERENCES themes(id),
    performance_band VARCHAR(50) NOT NULL,
    feedback_text TEXT NOT NULL,
    recommendations TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_band CHECK (
        performance_band IN (
            'needs_improvement',
            'below_average',
            'moderate',
            'strong'
        )
    )
);

-- Add necessary indexes
CREATE INDEX idx_responses_assessment_id ON responses(assessment_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_theme_scores_assessment_id ON theme_scores(assessment_id);
CREATE INDEX idx_questions_theme_id ON questions(theme_id);

-- Additional indexes for performance (analytics queries)
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at) WHERE status = 'completed';
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_business_profiles_sector ON business_profiles(sector);
CREATE INDEX idx_business_profiles_country ON business_profiles(country);
CREATE INDEX idx_theme_scores_percentage ON theme_scores(percentage);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

-- Email verification table
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP address or user_id
    action VARCHAR(50) NOT NULL, -- 'login', 'password_reset', 'register', etc.
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, action, window_start)
);
CREATE INDEX idx_rate_limits_lookup ON rate_limits(identifier, action, window_start);
```

## API Specification

### API Versioning
All endpoints use `/api/v1/` prefix for versioning:
- Current version: v1
- Future versions: v2, v3, etc.
- Backward compatibility maintained for at least 1 major version

### Standard Error Response Format
All error responses follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error message"
      }
    ],
    "timestamp": "2025-01-27T10:00:00Z",
    "requestId": "req-123-456"
  }
}
```

Common error codes:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)

### Rate Limiting
- Default: 100 requests per 15 minutes per IP/user
- Authentication endpoints: 5 requests per 15 minutes per IP
- Admin endpoints: 200 requests per 15 minutes per user
- Rate limit headers included in all responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## API Specification

### Authentication Endpoints

#### POST /api/auth/register
Request:
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```
Response (201 Created):
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "role": "user",
  "token": "string"
}
```

#### POST /api/auth/login
Request:
```json
{
  "email": "string",
  "password": "string"
}
```
Response (200 OK):
```json
{
  "token": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "fullName": "string",
    "role": "string"
  }
}
```

#### POST /api/auth/refresh
Request:
```json
{
  "refreshToken": "string"
}
```
Response (200 OK):
```json
{
  "token": "string",
  "refreshToken": "string"
}
```

#### POST /api/auth/logout
Request: (Authorization header with token)
Response (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

#### POST /api/auth/verify-email
Request:
```json
{
  "token": "string"
}
```
Response (200 OK):
```json
{
  "message": "Email verified successfully"
}
```

### User Endpoints

#### GET /api/users/me
Response (200 OK):
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "role": "string",
  "createdAt": "string",
  "lastLogin": "string"
}
```

#### PUT /api/users/me
Request:
```json
{
  "fullName": "string"
}
```
Response (200 OK):
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "updatedAt": "string"
}
```

#### GET /api/users/me/assessments
Query Parameters:
- page (optional, default: 1)
- limit (optional, default: 20)
- status (optional: 'draft', 'in_progress', 'completed')

Response (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "string",
      "startedAt": "string",
      "completedAt": "string",
      "summary": {
        "compositeMean": "number",
        "compositePercentage": "number",
        "performanceBand": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Business Profile Endpoints

#### POST /api/business-profiles
Request:
```json
{
  "businessName": "string",
  "sector": "string",
  "country": "string",
  "city": "string",
  "employeeCount": "number",
  "registrationType": "string",
  "contactEmail": "string",
  "contactPhone": "string"
}
```
Response (201 Created):
```json
{
  "id": "uuid",
  "businessName": "string",
  "sector": "string",
  "country": "string",
  "city": "string",
  "employeeCount": "number",
  "registrationType": "string",
  "contactEmail": "string",
  "contactPhone": "string",
  "createdAt": "string"
}
```

### Assessment Endpoints

#### POST /api/assessments
Request:
```json
{
  "businessProfileId": "uuid"
}
```
Response (201 Created):
```json
{
  "id": "uuid",
  "status": "draft",
  "startedAt": "string",
  "themes": [
    {
      "id": "uuid",
      "name": "string",
      "questions": [
        {
          "id": "uuid",
          "text": "string",
          "helpText": "string"
        }
      ]
    }
  ]
}
```

#### PUT /api/assessments/{id}/responses
Request:
```json
{
  "responses": [
    {
      "questionId": "uuid",
      "score": "number",
      "comment": "string"
    }
  ]
}
```
Response (200 OK):
```json
{
  "id": "uuid",
  "status": "in_progress",
  "completedResponses": "number",
  "totalQuestions": "number"
}
```

#### POST /api/assessments/{id}/submit
Response (200 OK):
```json
{
  "id": "uuid",
  "status": "completed",
  "completedAt": "string",
  "summary": {
    "compositeMean": "number",
    "compositePercentage": "number",
    "performanceBand": "string"
  },
  "themeScores": [
    {
      "themeId": "uuid",
      "themeName": "string",
      "meanScore": "number",
      "percentage": "number",
      "feedback": {
        "text": "string",
        "recommendations": ["string"]
      }
    }
  ]
}
```

#### GET /api/assessments/{id}
Response (200 OK):
```json
{
  "id": "uuid",
  "status": "string",
  "startedAt": "string",
  "completedAt": "string",
  "businessProfile": {
    "id": "uuid",
    "businessName": "string",
    "sector": "string"
  },
  "themes": [
    {
      "id": "uuid",
      "name": "string",
      "questions": [
        {
          "id": "uuid",
          "text": "string",
          "helpText": "string"
        }
      ]
    }
  ]
}
```

#### DELETE /api/assessments/{id}
Response (200 OK):
```json
{
  "message": "Assessment deleted successfully"
}
```

#### GET /api/assessments/{id}/report
Response (200 OK):
```json
{
  "id": "uuid",
  "business": {
    "name": "string",
    "sector": "string"
  },
  "completedAt": "string",
  "summary": {
    "compositeMean": "number",
    "compositePercentage": "number",
    "performanceBand": "string"
  },
  "themeScores": [
    {
      "themeName": "string",
      "meanScore": "number",
      "percentage": "number",
      "feedback": {
        "text": "string",
        "recommendations": ["string"]
      },
      "responses": [
        {
          "questionText": "string",
          "score": "number",
          "comment": "string"
        }
      ]
    }
  ]
}
```

### Admin Endpoints

#### GET /api/admin/analytics
Query Parameters:
- sector (optional)
- country (optional)
- dateFrom (optional)
- dateTo (optional)
- page (optional, default: 1)
- limit (optional, default: 50)

Response (200 OK):
```json
{
  "totalAssessments": "number",
  "averageCompositeMean": "number",
  "themeAverages": [
    {
      "themeName": "string",
      "averageMean": "number",
      "averagePercentage": "number"
    }
  ],
  "bandDistribution": {
    "needsImprovement": "number",
    "belowAverage": "number",
    "moderate": "number",
    "strong": "number"
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

#### GET /api/admin/users
Query Parameters:
- page (optional, default: 1)
- limit (optional, default: 20)
- role (optional)
- search (optional: email or name)

Response (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "role": "string",
      "createdAt": "string",
      "lastLogin": "string",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

#### POST /api/admin/feedback-templates
Request:
```json
{
  "themeId": "uuid",
  "performanceBand": "string",
  "feedbackText": "string",
  "recommendations": ["string"]
}
```
Response (201 Created):
```json
{
  "id": "uuid",
  "themeId": "uuid",
  "performanceBand": "string",
  "feedbackText": "string",
  "recommendations": ["string"],
  "createdAt": "string"
}
```

#### PUT /api/admin/feedback-templates/{id}
Request: (same as POST)
Response (200 OK): (same as POST)

#### DELETE /api/admin/feedback-templates/{id}
Response (200 OK):
```json
{
  "message": "Feedback template deleted successfully"
}
```

## Scoring Algorithm Implementation

```typescript
interface Response {
  questionId: string;
  score: number;
  comment?: string;
}

interface ThemeScore {
  themeId: string;
  meanScore: number;
  percentage: number;
}

interface AssessmentSummary {
  compositeMean: number;
  compositePercentage: number;
  performanceBand: 'needs_improvement' | 'below_average' | 'moderate' | 'strong';
}

class ScoreCalculator {
  private static calculateThemeMean(scores: number[]): number {
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private static calculatePercentage(mean: number): number {
    return ((mean - 1) / 4) * 100;
  }

  private static determinePerformanceBand(mean: number): string {
    if (mean <= 2.0) return 'needs_improvement';
    if (mean <= 3.0) return 'below_average';
    if (mean <= 4.0) return 'moderate';
    return 'strong';
  }

  static calculateScores(
    responses: Response[],
    questions: Map<string, { themeId: string; reverseScored: boolean }>,
    themes: Map<string, { weight: number }>
  ): {
    themeScores: ThemeScore[];
    summary: AssessmentSummary;
  } {
    // Group responses by theme
    const scoresByTheme = new Map<string, number[]>();
    
    responses.forEach(response => {
      const question = questions.get(response.questionId);
      if (!question) return;
      
      const score = question.reverseScored ? 6 - response.score : response.score;
      
      const themeScores = scoresByTheme.get(question.themeId) || [];
      themeScores.push(score);
      scoresByTheme.set(question.themeId, themeScores);
    });

    // Calculate theme scores
    const themeScores: ThemeScore[] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    scoresByTheme.forEach((scores, themeId) => {
      const meanScore = this.calculateThemeMean(scores);
      const percentage = this.calculatePercentage(meanScore);
      
      const theme = themes.get(themeId);
      const weight = theme?.weight || 1;
      
      weightedSum += meanScore * weight;
      totalWeight += weight;

      themeScores.push({
        themeId,
        meanScore,
        percentage
      });
    });

    // Calculate composite scores
    const compositeMean = weightedSum / totalWeight;
    const compositePercentage = this.calculatePercentage(compositeMean);
    const performanceBand = this.determinePerformanceBand(compositeMean);

    return {
      themeScores,
      summary: {
        compositeMean,
        compositePercentage,
        performanceBand
      }
    };
  }
}
```

## Example Assessment Submission Flow

1. Create assessment:
```typescript
// POST /api/assessments
const assessment = await db.assessments.create({
  userId,
  businessProfileId,
  status: 'draft'
});
```

2. Submit responses in batches:
```typescript
// PUT /api/assessments/{id}/responses
const responses = await db.responses.bulkCreate(requestBody.responses.map(r => ({
  assessmentId: id,
  questionId: r.questionId,
  score: r.score,
  comment: r.comment
})));
```

3. Complete assessment and calculate scores:
```typescript
// POST /api/assessments/{id}/submit
const responses = await db.responses.findAll({ where: { assessmentId: id } });
const questions = await db.questions.findAll({ include: ['theme'] });
const themes = await db.themes.findAll();

const { themeScores, summary } = ScoreCalculator.calculateScores(
  responses,
  questions,
  themes
);

await db.transaction(async (t) => {
  // Save theme scores
  await db.themeScores.bulkCreate(themeScores, { transaction: t });
  
  // Save summary
  await db.assessmentSummaries.create({
    assessmentId: id,
    ...summary
  }, { transaction: t });
  
  // Update assessment status
  await db.assessments.update({
    status: 'completed',
    completedAt: new Date()
  }, {
    where: { id },
    transaction: t
  });
});

// Generate and store feedback
await generateAndStoreFeedback(id, themeScores, summary);
```

## Performance Considerations

1. Database Indexes:
- Composite indexes on frequently queried combinations
- Partial indexes for active records
- Consider materialized views for analytics

2. Caching Strategy:
- **Redis for:**
  - Session storage (if using JWT refresh tokens)
  - Theme/question data (rarely changes, TTL: 24 hours)
  - Completed assessment results (TTL: 24 hours)
  - Rate limiting counters
- **Browser caching:**
  - Static assets (CSS, JS, images) with long cache headers
  - API responses with appropriate cache headers (ETag, Last-Modified)
- **CDN caching:**
  - Static assets served from CDN
  - PDF files (if public access needed)

3. Query Optimization:
- Eager loading of related data
- Pagination for large result sets
- Selective column fetching

4. Background Jobs:
- PDF report generation (Bull queue for Node.js)
- Analytics computation (scheduled jobs)
- Email notifications (registration, password reset, assessment completion)
- Data retention cleanup (scheduled hard-delete jobs)

5. State Management (Frontend):
- **MVP:** React Context API or Zustand (lightweight)
- **Future:** Consider Redux if state complexity grows
- **Document:** Where state lives (client vs server) for each feature

6. API Documentation:
- Use OpenAPI/Swagger specification
- Generate interactive docs (Swagger UI)
- Include in CI to keep docs in sync with code
- Document all endpoints, request/response schemas, error codes