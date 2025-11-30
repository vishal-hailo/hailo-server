# HailO Backend API

## Stack
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Environment Variables

See `.env` file:
- `DATABASE_URL`: PostgreSQL connection string
- `UBER_MOCK`: true/false (mock vs real API)
- `JWT_SECRET`: Secret for JWT tokens
- `PORT`: Server port (default: 8002)

## API Endpoints

All endpoints are prefixed with `/api/v1`

### Health
```
GET /api/v1/health
```

### Auth
```
POST /api/v1/auth/request-otp
POST /api/v1/auth/verify-otp
GET /api/v1/me (requires auth)
```

### Locations
```
GET /api/v1/locations (requires auth)
POST /api/v1/locations (requires auth)
PUT /api/v1/locations/:id (requires auth)
DELETE /api/v1/locations/:id (requires auth)
```

### Commute
```
POST /api/v1/commute/search (requires auth)
POST /api/v1/commute/surge-radar (requires auth)
POST /api/v1/commute/handoff (requires auth)
```

### Insights
```
GET /api/v1/insights/summary?period=7d (requires auth)
GET /api/v1/insights/export?period=30d (requires auth)
```

## Mock Uber Service

Realistic Mumbai pricing simulation:
- Distance-based pricing (₹12/km base)
- Time-of-day surge (8-10 AM, 5-8 PM = +30%)
- 30-minute surge forecast with wave patterns
- Deep link generation (works without API keys)

## Database Schema

See `prisma/schema.prisma` for full schema.

Key models:
- User (id, phone, name)
- Location (userId, type, label, lat/lng)
- CommuteLog (userId, origin/dest, estimates, handoffClicked)
