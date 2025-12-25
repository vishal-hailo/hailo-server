# HailO Authentication Flow - User Guide

## ✅ Backend Status: WORKING

The Node.js backend server is running successfully on port 8001 with all authentication endpoints functional.

### Backend Test Results:
```bash
✅ Health Check: http://localhost:8001/api/v1/health
✅ Request OTP: POST /api/v1/auth/request-otp
✅ Verify OTP: POST /api/v1/auth/verify-otp
```

## 📱 How to Login to the App

### Step 1: Enter Phone Number
1. Open the app at: https://hailo-redesign.preview.emergentagent.com
2. You should see the "Welcome to HailO" screen
3. Enter your phone number in the format: `+919876543210`
   - **Important**: Must include `+91` prefix
   - Must be exactly 13 characters total (+91 + 10 digits)
   - Example: `+919876543210`

### Step 2: Click Continue
- The "Continue" button will send a request to the backend
- You should see "Sending..." briefly
- If successful, you'll be redirected to the OTP screen

### Step 3: Enter OTP
1. On the OTP screen, enter: `1234`
2. Click "Verify & Continue"
3. You'll be redirected based on your profile status:
   - **New User** (no name): Goes to registration screen
   - **Existing User** (has name): Goes to home screen or location setup

## 🔧 Troubleshooting

### If "Continue" button doesn't work:

1. **Check phone number format**:
   - Must start with `+91`
   - Must be exactly 13 characters
   - No spaces or special characters except `+`
   - Example: `+919876543210` ✅
   - Wrong: `9876543210` ❌
   - Wrong: `+91 98765 43210` ❌

2. **Check browser console** (if using web):
   - Open Developer Tools (F12)
   - Look for any error messages in the Console tab
   - Should see logs like:
     ```
     Attempting to send OTP to: +919876543210
     API URL: https://hailo-redesign.preview.emergentagent.com
     Making request to: https://hailo-redesign.preview.emergentagent.com/api/v1/auth/request-otp
     OTP Response: {success: true, mockOtp: "1234", ...}
     OTP sent successfully, navigating to OTP screen
     ```

3. **Check network connection**:
   - The app needs internet to reach the backend
   - Try refreshing the page

4. **Clear app data** (if on mobile):
   - Close and reopen the app
   - Or clear the Expo Go cache

### If OTP verification fails:

1. Make sure you enter exactly: `1234`
2. The OTP is case-sensitive and must be 4 digits

## 🧪 Manual Backend Testing

You can test the backend APIs directly using curl:

### Test 1: Request OTP
```bash
curl -X POST https://hailo-redesign.preview.emergentagent.com/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "mockOtp": "1234",
  "note": "In production, OTP would be sent via SMS"
}
```

### Test 2: Verify OTP
```bash
curl -X POST https://hailo-redesign.preview.emergentagent.com/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "1234"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phone": "+919876543210",
    "name": null
  }
}
```

## 📊 Current Configuration

- **Backend URL**: https://hailo-redesign.preview.emergentagent.com
- **Backend Port**: 8001
- **Auth Type**: Mock OTP (no real SMS)
- **Mock OTP Code**: `1234`
- **Database**: In-memory (temporary storage)

## 🎯 What Happens After Login

1. **New User Flow**:
   - Enter phone → Enter OTP → Register (enter name) → Location Setup → Home Screen

2. **Returning User Flow**:
   - Enter phone → Enter OTP → Home Screen (if locations already set)
   - Enter phone → Enter OTP → Location Setup (if locations not set)

## 💡 Tips

- The phone number field auto-fills with `+91` when you open it
- Just type the 10-digit number after `+91`
- The OTP is always `1234` in mock mode
- First-time users will need to enter their name after OTP verification
