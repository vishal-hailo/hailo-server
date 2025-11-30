# HailO - Mumbai's Commute Genius 🚕

**v1.0.0** - Full-stack production-ready mobile app for smart commute planning in Mumbai.

## 🎯 Overview

HailO is a commute intelligence app (NOT a ride-hailing app). Users save Home/Office locations, see live Uber prices/ETAs with Surge Radar timing intelligence, then deep-link to Uber for booking.

**v1.0 Features:**
- 🔐 Mock OTP Authentication (code: 1234)
- 🏠 Save Home/Office locations  
- 📊 Real-time Uber price estimates (MOCK mode)
- 📈 Surge Radar - 30-minute pricing forecast
- 🚀 Smart Book - Deep link to Uber app
- 📱 Week Score & Insights tracking
- 💰 Savings calculator

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Auth**: JWT

### Frontend
- **Platform**: React Native (iOS + Android)
- **Framework**: Expo SDK
- **Navigation**: Expo Router
- **Charts**: Victory Native
- **HTTP**: Axios

## 🚀 Quick Start

### Backend Setup

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```

Server runs on http://localhost:8002

### Mobile App Setup

```bash
cd frontend
yarn install
npx expo start
```

Scan QR code with Expo Go app

## 🔑 API Testing

```bash
# Health check
curl http://localhost:8002/api/v1/health

# Get OTP
curl -X POST http://localhost:8002/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'

# Mock OTP: 1234
```

## 📱 Core Screens

1. **Splash** → Auth check
2. **Phone** → +91 input
3. **OTP** → 1234 verification
4. **Home** → Pulsing cards with live estimates
5. **Surge Radar** → 30-min forecast chart
6. **Success** → Booking confirmation
7. **Insights** → Stats & savings

## 🎨 Mumbai Test Coordinates

- **Andheri East**: 19.1188, 72.8913
- **BKC**: 19.0661, 72.8354
- **Bandra**: 19.0634, 72.8350
- **Powai**: 19.1249, 72.9077

## 🚀 Deep Links (Works Day 1)

```
https://m.uber.com/ul/?action=setPickup&pickup[latitude]=19.1188&pickup[longitude]=72.8913&dropoff[latitude]=19.0661&dropoff[longitude]=72.8354
```

Opens Uber app with prefilled pickup/dropoff. No API keys needed!

## 🔐 Environment Variables

**Backend (.env)**
```
DATABASE_URL="postgresql://hailo_user:hailo_pass@localhost:5432/hailo"
UBER_MOCK=true
JWT_SECRET=hailo-super-secret-jwt-key-mumbai-2025
OTP_MOCK_CODE=1234
PORT=8002
```

**Frontend (app.json)**
```json
{
  "extra": {
    "EXPO_PUBLIC_BACKEND_URL": "http://localhost:8002"
  }
}
```

## 📊 Database Schema

- **User**: id, phone, name
- **Location**: userId, type (HOME/OFFICE/OTHER), label, lat/lng
- **CommuteLog**: userId, origin/dest coords, estimates, handoffClicked

## 🎯 MOCK vs REAL API

### MOCK Mode (Default)
- Realistic Mumbai pricing
- Time-based surge simulation
- No API keys required

### REAL Mode
Set `UBER_MOCK=false` and add Uber API credentials when ready.

---

**Built for Mumbai commuters** 🇮🇳
