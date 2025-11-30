# Firebase Phone Authentication Setup Guide

## Overview

HailO uses **Firebase Phone Authentication** for real SMS-based OTP verification. This guide will walk you through setting up Firebase for both the mobile app (React Native/Expo) and backend (Node.js/Express).

---

## Prerequisites

- Firebase account (free)
- Google Cloud Console access
- Node.js and npm installed
- React Native/Expo environment setup

---

## Part 1: Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `hailo-mumbai` (or your choice)
4. **Disable Google Analytics** (optional for phone auth)
5. Click **"Create project"**

### Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **"Phone"**
3. Toggle **"Enable"**
4. Click **"Save"**

### Step 3: Add Test Phone Numbers (Development Only)

For testing without using real SMS credits:

1. In **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **"Phone numbers for testing"**
3. Add test numbers:
   - Phone: `+91 98765 43210`
   - Code: `123456`
4. Click **"Add"**

**Note**: Test phone numbers work ONLY in development. For production, use real phone numbers.

---

## Part 2: Mobile App Configuration (React Native)

### Step 1: Get Firebase Config

1. In Firebase Console, click the **gear icon** → **Project settings**
2. Scroll to **"Your apps"**
3. Click **"Web"** (🌐 icon)
4. Register app name: `HailO`
5. Copy the `firebaseConfig` object

### Step 2: Update `.env` File

Create or update `/app/frontend/.env`:

```env
# Firebase Configuration (from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hailo-mumbai.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=hailo-mumbai
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hailo-mumbai.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefXXXXXX
```

### Step 3: Verify `firebaseConfig.ts`

The file `/app/frontend/firebaseConfig.ts` should automatically read these env variables:

```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

### Step 4: Test on Device

**Important**: Firebase Phone Auth requires a real device or simulator with SMS capabilities. Expo Go works fine.

1. Start Expo: `cd /app/frontend && npx expo start`
2. Scan QR code with Expo Go app
3. Enter test phone number: `+91 98765 43210`
4. Enter test OTP: `123456`

---

## Part 3: Backend Configuration (Node.js)

### Step 1: Generate Service Account Key

1. In Firebase Console, go to **Project settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Save the JSON file as `firebase-service-account.json`
4. **IMPORTANT**: Add this file to `.gitignore` (never commit to version control!)

### Step 2: Configure Backend `.env`

Update `/app/server/.env`:

**Option A: Using Service Account File (Recommended for Development)**

```env
# Firebase Admin SDK - Service Account File
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

**Option B: Using Individual Variables (Recommended for Production)**

```env
# Firebase Admin SDK - Individual Credentials
FIREBASE_PROJECT_ID=hailo-mumbai
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@hailo-mumbai.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

To get these values, open the downloaded `firebase-service-account.json`:
- `FIREBASE_PROJECT_ID` → `project_id`
- `FIREBASE_CLIENT_EMAIL` → `client_email`
- `FIREBASE_PRIVATE_KEY` → `private_key` (keep the \n characters!)

### Step 3: Place Service Account File

```bash
cd /app/server
mv ~/Downloads/firebase-service-account.json ./
echo "firebase-service-account.json" >> .gitignore
```

### Step 4: Restart Backend

```bash
cd /app/server
npm run dev
```

Look for this output:
```
✅ Firebase Admin SDK initialized successfully
🚀 HailO Server running on port 8002
```

### Step 5: Test Firebase Endpoint

```bash
curl http://localhost:8002/api/v1/auth/firebase-test
```

Expected response:
```json
{
  "status": "Firebase Admin SDK loaded",
  "configured": true,
  "message": "Firebase Phone Auth is ready"
}
```

---

## Part 4: Testing the Complete Flow

### Test with Mock Phone Number

1. Open HailO app
2. Enter test phone: `+91 98765 43210`
3. Tap "Send OTP"
4. Firebase sends SMS (free in test mode)
5. Enter test OTP: `123456`
6. User is authenticated ✅

### Test with Real Phone Number

1. Remove test phone numbers from Firebase Console
2. Enter your real phone: `+91 XXXXXXXXXX`
3. Receive real SMS with 6-digit OTP
4. Enter OTP
5. User is authenticated ✅

**Note**: Firebase has a free tier of 10,000 SMS/month. After that, you'll be charged.

---

## Part 5: API Flow Diagram

```
Mobile App                    Backend                     Firebase
─────────────────────────────────────────────────────────────────────

1. User enters phone (+91...)
   │
   ├─> signInWithPhoneNumber()
   │      │
   │      └──> Firebase sends SMS ──────────────────> User receives OTP
   │
2. User enters OTP
   │
   ├─> confirmationResult.confirm(otp)
   │      │
   │      └──> Firebase verifies OTP ✅
   │             │
   │             └──> Returns Firebase ID Token
   │
3. App sends ID Token
   │
   ├─> POST /api/v1/auth/firebase-login
   │      ├── { firebaseIdToken: "..." }
   │      │
   │      └──> Backend verifies token
   │            with Firebase Admin SDK ───────────> Firebase validates
   │                                                     │
   │      <─── Returns JWT + user                       │
   │                                                     ✅
4. App stores JWT
   │
   └─> Navigate to Home screen
```

---

## Part 6: Troubleshooting

### Issue: "No Firebase credentials found"

**Solution**: Ensure `firebase-service-account.json` exists in `/app/server/` OR set env variables correctly.

```bash
# Check if file exists
ls -la /app/server/firebase-service-account.json

# Check if env variables are set
cat /app/server/.env | grep FIREBASE
```

### Issue: "Invalid phone number format"

**Solution**: Always use international format with country code.

- ✅ Correct: `+91 98765 43210`
- ❌ Wrong: `9876543210`
- ❌ Wrong: `+919876543210` (no spaces, Firebase may reject)

### Issue: "SMS quota exceeded"

**Solution**:
1. Check Firebase Console → Usage
2. Upgrade to Blaze plan (pay-as-you-go)
3. Or use test phone numbers for development

### Issue: "auth/code-expired"

**Solution**: OTP codes expire after 30 seconds. Request a new OTP.

### Issue: "Token verification failed"

**Solution**:
1. Ensure backend has correct service account credentials
2. Check that `firebaseConfig.ts` has correct API keys
3. Verify both use the SAME Firebase project

---

## Part 7: Security Best Practices

### 1. Never Commit Credentials

Add to `.gitignore`:
```
firebase-service-account.json
.env
```

### 2. Use Environment Variables in Production

For Heroku/Railway/Vercel:
```bash
heroku config:set FIREBASE_PROJECT_ID=hailo-mumbai
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
heroku config:set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@hailo-mumbai.iam.gserviceaccount.com
```

### 3. Enable App Check (Recommended)

1. In Firebase Console → **App Check**
2. Register your app
3. Protects against abuse and bots

### 4. Rate Limiting

Firebase automatically rate limits:
- 10 SMS per phone number per day (development)
- Configurable in production

---

## Part 8: Switching Between Mock & Firebase Auth

### Use Firebase (Production)

File: `/app/frontend/app/auth/phone.tsx` (Firebase version)

### Use Mock OTP (Testing without Firebase)

Rename files:
```bash
mv /app/frontend/app/auth/phone.tsx /app/frontend/app/auth/phone-firebase.tsx
mv /app/frontend/app/auth/phone-mock.tsx /app/frontend/app/auth/phone.tsx
```

Mock OTP will always be `1234` - no Firebase setup needed.

---

## Part 9: Cost Estimate

### Firebase Spark Plan (Free)
- 10,000 SMS verifications/month
- Unlimited free phone auth test numbers

### Firebase Blaze Plan (Pay-as-you-go)
- $0.01 per SMS (India)
- $0.05 per SMS (US)
- First 10,000 free each month

**For HailO**: With 1,000 users doing 2 logins/month = 2,000 SMS = **FREE**

---

## Part 10: Checklist

Before deploying to production:

- [ ] Firebase project created
- [ ] Phone authentication enabled
- [ ] Mobile app has Firebase config in `.env`
- [ ] Backend has service account credentials
- [ ] Test phone numbers work in development
- [ ] Real phone numbers work in staging
- [ ] Service account JSON in `.gitignore`
- [ ] Environment variables set in production
- [ ] Rate limiting configured
- [ ] App Check enabled (optional but recommended)

---

## Support

If you encounter issues:

1. Check Firebase Console → **Authentication** → **Users** (you should see phone numbers)
2. Check Firebase Console → **Authentication** → **Usage** (SMS quota)
3. Check backend logs: `tail -f /tmp/hailo-node.log`
4. Check mobile logs: Expo DevTools console

**Firebase Documentation**: https://firebase.google.com/docs/auth/web/phone-auth

---

**🎉 Congratulations! Your app now has real Firebase Phone Authentication working!**
