# Quick Start Guide

Get the platform running in 5 minutes!

## Prerequisites Check

```bash
node --version  # Should be 18+
psql --version  # Should be 12+
```

## Quick Setup (5 Steps)

### 1. Database Setup
```bash
# Using Docker (easiest)
docker run --name postgres-sme \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sme_assessment \
  -p 5432:5432 \
  -d postgres:15

# Or create manually
createdb sme_assessment
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB password
npm run migrate
npm run dev
```

### 3. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
echo "NEXT_PUBLIC_API_VERSION=v1" >> .env.local
npm run dev
```

### 4. Test It!
1. Open http://localhost:3000
2. Register a new account
3. Create business profile
4. Start an assessment

### 5. Run Tests
```bash
cd backend
npm test
```

## Common Issues

**Port 5000 in use?**
- Change `PORT` in `backend/.env`

**Port 3000 in use?**
- Change port in `frontend/package.json` scripts

**Database connection failed?**
- Check PostgreSQL is running
- Verify credentials in `backend/.env`
- Check if database exists: `psql -l | grep sme_assessment`

## Next Steps

- See `SETUP.md` for detailed instructions
- See `README.md` for full documentation
- Add all 98 questions using `npm run seed:questions`

