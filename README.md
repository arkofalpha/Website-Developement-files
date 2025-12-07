# Business Self-Assessment Platform

A comprehensive web platform for SMEs to self-assess their business performance across 11 thematic areas, receive automated scoring and feedback, and download detailed PDF reports.

## Features

- **User Authentication**: Secure registration, login, and password reset
- **Business Profile Management**: Create and manage business profiles
- **Interactive Assessment**: Complete 11-theme assessment with save/resume functionality
- **Automated Scoring**: Real-time calculation of theme scores and composite indicators
- **Visual Dashboard**: Interactive charts (radar, bar) showing performance metrics
- **PDF Reports**: Downloadable assessment reports (coming soon)
- **Admin Panel**: Analytics and management tools (coming soon)

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Bcrypt for password hashing
- Helmet for security
- Express Rate Limit

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Chart.js for visualizations
- Axios for API calls
- Zustand for state management

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sme_assessment
DB_USER=postgres
DB_PASSWORD=your_password
```

5. Run database migrations:
```bash
npm run migrate
```

6. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_VERSION=v1
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
.
├── backend/
│   ├── config/          # Database configuration
│   ├── migrations/      # Database migrations
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── frontend/
│   ├── components/      # React components
│   ├── lib/             # API client and utilities
│   ├── pages/           # Next.js pages
│   └── styles/          # Global styles
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Business Profiles
- `POST /api/v1/business-profiles` - Create business profile
- `GET /api/v1/business-profiles/me` - Get current user's profile
- `PUT /api/v1/business-profiles/me` - Update profile

### Assessments
- `POST /api/v1/assessments` - Create new assessment
- `GET /api/v1/assessments` - List assessments
- `GET /api/v1/assessments/:id` - Get assessment details
- `PUT /api/v1/assessments/:id/responses` - Save responses
- `POST /api/v1/assessments/:id/submit` - Submit assessment
- `GET /api/v1/assessments/:id/results` - Get results

## Development

### Running Tests

Backend tests:
```bash
cd backend
npm test
```

### Database Migrations

Run migrations:
```bash
cd backend
npm run migrate
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Rate limiting on API endpoints
- Security headers (Helmet)
- Input validation and sanitization
- CORS configuration

## License

This project is proprietary software.

## Quick Start

See `QUICKSTART.md` for a 5-minute setup guide.

## Setup Instructions

See `SETUP.md` for detailed setup instructions.

## Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Test Coverage
- Scoring module: 95%+ target
- API endpoints: 80%+ target
- Overall: 75%+ minimum

## PDF Report Generation

PDF reports are generated on-demand when users click "Download PDF Report" on the results page.

- Reports are stored temporarily in `backend/reports/`
- Auto-cleanup after 1 hour
- Can be configured to use S3/cloud storage

## Support

For issues and questions, please contact the development team.

