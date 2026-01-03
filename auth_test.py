#!/usr/bin/env python3
"""
HailO Authentication API Testing Suite
Tests the specific endpoints mentioned in the review request
"""

import requests
import json
import sys

# Base URL for testing (FastAPI proxy to Node.js backend)
BASE_URL = "http://localhost:8001"

def test_health_check():
    """Test GET /api/v1/health"""
    print("🔍 Testing Health Check API...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "OK":
                print("✅ Health Check API - Working")
                return True
            else:
                print(f"❌ Health Check API - Status not OK: {data.get('status')}")
                return False
        else:
            print(f"❌ Health Check API - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health Check API - Request failed: {str(e)}")
        return False

def test_request_otp():
    """Test POST /api/v1/auth/request-otp"""
    print("\n🔍 Testing Send OTP API...")
    
    try:
        payload = {"phone": "+919876543210"}
        response = requests.post(f"{BASE_URL}/api/v1/auth/request-otp", 
                               json=payload, 
                               headers={"Content-Type": "application/json"})
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "mockOtp" in data:
                print("✅ Send OTP API - Working")
                return True, data.get("mockOtp")
            else:
                print(f"❌ Send OTP API - Invalid response format: {data}")
                return False, None
        else:
            print(f"❌ Send OTP API - Expected 200, got {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Send OTP API - Request failed: {str(e)}")
        return False, None

def test_verify_otp(otp):
    """Test POST /api/v1/auth/verify-otp"""
    print("\n🔍 Testing Verify OTP API...")
    
    try:
        payload = {"phone": "+919876543210", "otp": otp or "1234"}
        response = requests.post(f"{BASE_URL}/api/v1/auth/verify-otp", 
                               json=payload, 
                               headers={"Content-Type": "application/json"})
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                print("✅ Verify OTP API - Working")
                return True, data.get("token")
            else:
                print(f"❌ Verify OTP API - Missing token or user: {data}")
                return False, None
        else:
            print(f"❌ Verify OTP API - Expected 200, got {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Verify OTP API - Request failed: {str(e)}")
        return False, None

def test_get_locations(token):
    """Test GET /api/v1/locations (requires auth)"""
    print("\n🔍 Testing Get Locations API...")
    
    if not token:
        print("❌ Get Locations API - No auth token available")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(f"{BASE_URL}/api/v1/locations", headers=headers)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print("✅ Get Locations API - Working")
                return True
            else:
                print(f"❌ Get Locations API - Expected array, got: {type(data)}")
                return False
        elif response.status_code == 401:
            print("❌ Get Locations API - Authentication failed")
            return False
        else:
            print(f"❌ Get Locations API - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Get Locations API - Request failed: {str(e)}")
        return False

def test_create_location(token):
    """Test POST /api/v1/locations (requires auth)"""
    print("\n🔍 Testing Create Location API...")
    
    if not token:
        print("❌ Create Location API - No auth token available")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        payload = {
            "label": "Home",
            "type": "HOME", 
            "address": "Test Address",
            "isPrimary": True
        }
        response = requests.post(f"{BASE_URL}/api/v1/locations", 
                               json=payload, headers=headers)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print("✅ Create Location API - Working")
            return True
        elif response.status_code == 401:
            print("❌ Create Location API - Authentication failed")
            return False
        else:
            print(f"❌ Create Location API - Expected 200/201, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Create Location API - Request failed: {str(e)}")
        return False

def test_auth_protection():
    """Test that protected endpoints require authentication"""
    print("\n🔍 Testing Authentication Protection...")
    
    try:
        # Test locations endpoint without auth
        response = requests.get(f"{BASE_URL}/api/v1/locations", 
                              headers={"Content-Type": "application/json"})
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ Authentication Protection - Working")
            return True
        else:
            print(f"❌ Authentication Protection - Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Authentication Protection - Request failed: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("🚀 Starting HailO Authentication API Tests")
    print(f"📍 Testing server at: {BASE_URL}")
    print("=" * 60)
    
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health_check()))
    
    # Test 2: Send OTP
    otp_success, mock_otp = test_request_otp()
    results.append(("Send OTP", otp_success))
    
    # Test 3: Verify OTP (needed for auth token)
    verify_success, token = test_verify_otp(mock_otp)
    results.append(("Verify OTP", verify_success))
    
    # Test 4: Get Locations (requires auth)
    results.append(("Get Locations", test_get_locations(token)))
    
    # Test 5: Create Location (requires auth)
    results.append(("Create Location", test_create_location(token)))
    
    # Test 6: Auth Protection
    results.append(("Auth Protection", test_auth_protection()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
        else:
            failed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if failed == 0:
        print("🎉 All authentication tests passed!")
        return True
    else:
        print(f"⚠️  {failed} test(s) failed. Check the details above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)