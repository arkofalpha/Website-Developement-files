# Setup Guide

Complete setup instructions for the Business Self-Assessment Platform.

## Prerequisites

- **Node.js** 18.0 or higher
- **PostgreSQL** 12.0 or higher
- **npm** or **yarn** package manager

## Step 1: Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres-sme -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sme_assessment -p 5432:5432 -d postgres:15`

2. **Create Database**
   ```sql
   CREATE DATABASE sme_assessment;
   ```

3. **Note your database credentials** for the next step

## Step 2: Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sme_assessment
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   FRONTEND_URL=http://localhost:3000
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```
   This will create all necessary tables.

6. **Seed initial data (optional)**
   ```bash
   node scripts/seedQuestions.js
   ```

7. **Start the backend server**
   ```bash
   npm run dev
   ```
   Server should start on `http://localhost:5000`

## Step 3: Frontend Setup

1. **Open a new terminal and navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_API_VERSION=v1
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   Frontend should start on `http://localhost:3000`

## Step 4: Verify Installation

1. **Check backend health**
   - Open browser: `http://localhost:5000/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check frontend**
   - Open browser: `http://localhost:3000`
   - Should see the login page

3. **Test registration**
   - Click "Create account"
   - Register with email and password
   - Complete business profile setup
   - Start an assessment

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready` or check Docker container
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l` (should list `sme_assessment`)

### Port Already in Use
- Backend (5000): Change `PORT` in `backend/.env`
- Frontend (3000): Change port in `frontend/package.json` scripts

### Migration Errors
- Ensure PostgreSQL user has CREATE privileges
- Check if tables already exist: `\dt` in psql
- Drop and recreate database if needed: `DROP DATABASE sme_assessment; CREATE DATABASE sme_assessment;`

### Frontend Can't Connect to Backend
- Verify backend is running on correct port
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Check CORS settings in `backend/server.js`

### Module Not Found Errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

## Running Tests

### Backend Tests
```bash
cd backend
npm test
```

### Test Coverage
```bash
cd backend
npm run test:coverage
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use a process manager (PM2, systemd)
3. Set up SSL/HTTPS
4. Configure proper database connection pooling
5. Set secure JWT_SECRET

### Frontend
1. Build: `npm run build`
2. Start: `npm start`
3. Or deploy to Vercel/Netlify

## Next Steps

- Add all 98 questions to the database
- Configure email service (SendGrid/SES)
- Set up file storage (S3) for PDFs
- Configure monitoring (Sentry, Datadog)
- Set up CI/CD pipeline

## Support

For issues, check:
- Backend logs in terminal
- Browser console for frontend errors
- Database logs for connection issues

