#!/usr/bin/env python3
"""
HailO Backend API Testing Suite
Tests the Node.js + Express backend running on port 8002
"""

import requests
import json
import sys
from datetime import datetime

# Test configuration - Using FastAPI proxy as specified in review request
BASE_URL = "http://localhost:8001"
HEADERS = {"Content-Type": "application/json"}

# Test data
TEST_PHONE = "+919876543210"
TEST_OTP = "1234"
TEST_COORDINATES = {
    "andheri_east": {"latitude": 19.1188, "longitude": 72.8913},
    "bkc": {"latitude": 19.0661, "longitude": 72.8354},
    "bandra": {"latitude": 19.0634, "longitude": 72.8350},
    "powai": {"latitude": 19.1249, "longitude": 72.9077}
}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log_pass(self, test_name):
        print(f"✅ {test_name}")
        self.passed += 1
        
    def log_fail(self, test_name, error):
        print(f"❌ {test_name}: {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n📊 Test Summary: {self.passed}/{total} passed")
        if self.errors:
            print("\n🚨 Failed Tests:")
            for error in self.errors:
                print(f"  - {error}")
        return self.failed == 0

def test_health_check(results):
    """Test GET /api/v1/health"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health")
        
        if response.status_code != 200:
            results.log_fail("Health Check", f"Expected 200, got {response.status_code}")
            return
            
        data = response.json()
        
        # Check required fields
        if data.get("status") != "OK":
            results.log_fail("Health Check", f"Expected status 'OK', got '{data.get('status')}'")
            return
            
        if data.get("uberMode") != "MOCK":
            results.log_fail("Health Check", f"Expected uberMode 'MOCK', got '{data.get('uberMode')}'")
            return
            
        results.log_pass("Health Check")
        
    except Exception as e:
        results.log_fail("Health Check", f"Request failed: {str(e)}")

def test_auth_flow(results):
    """Test authentication flow and return token"""
    token = None
    
    # Test OTP request
    try:
        payload = {"phone": TEST_PHONE}
        response = requests.post(f"{BASE_URL}/api/v1/auth/request-otp", 
                               json=payload, headers=HEADERS)
        
        if response.status_code != 200:
            results.log_fail("OTP Request", f"Expected 200, got {response.status_code}")
            return None
            
        data = response.json()
        
        if not data.get("success"):
            results.log_fail("OTP Request", f"Expected success=true, got {data.get('success')}")
            return None
            
        if data.get("mockOtp") != TEST_OTP:
            results.log_fail("OTP Request", f"Expected mockOtp '{TEST_OTP}', got '{data.get('mockOtp')}'")
            return None
            
        results.log_pass("OTP Request")
        
    except Exception as e:
        results.log_fail("OTP Request", f"Request failed: {str(e)}")
        return None
    
    # Test OTP verification
    try:
        payload = {"phone": TEST_PHONE, "otp": TEST_OTP, "name": "Test User"}
        response = requests.post(f"{BASE_URL}/api/v1/auth/verify-otp", 
                               json=payload, headers=HEADERS)
        
        if response.status_code != 200:
            results.log_fail("OTP Verification", f"Expected 200, got {response.status_code}")
            return None
            
        data = response.json()
        
        if not data.get("token"):
            results.log_fail("OTP Verification", "No token returned")
            return None
            
        if not data.get("user"):
            results.log_fail("OTP Verification", "No user object returned")
            return None
            
        user = data["user"]
        if user.get("phone") != TEST_PHONE:
            results.log_fail("OTP Verification", f"Expected phone '{TEST_PHONE}', got '{user.get('phone')}'")
            return None
            
        token = data["token"]
        results.log_pass("OTP Verification")
        return token
        
    except Exception as e:
        results.log_fail("OTP Verification", f"Request failed: {str(e)}")
        return None

def test_user_profile(results, token):
    """Test GET /api/v1/me with Bearer token"""
    if not token:
        results.log_fail("User Profile", "No token available")
        return
        
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/v1/me", headers=headers)
        
        if response.status_code != 200:
            results.log_fail("User Profile", f"Expected 200, got {response.status_code}")
            return
            
        data = response.json()
        
        if data.get("phone") != TEST_PHONE:
            results.log_fail("User Profile", f"Expected phone '{TEST_PHONE}', got '{data.get('phone')}'")
            return
            
        results.log_pass("User Profile")
        
    except Exception as e:
        results.log_fail("User Profile", f"Request failed: {str(e)}")

def test_commute_search(results, token):
    """Test POST /api/v1/commute/search"""
    if not token:
        results.log_fail("Commute Search", "No token available")
        return
        
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        payload = {
            "mode": "EXPLORER",
            "origin": TEST_COORDINATES["andheri_east"],
            "destination": TEST_COORDINATES["bkc"]
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/commute/search", 
                               json=payload, headers=headers)
        
        if response.status_code != 200:
            results.log_fail("Commute Search", f"Expected 200, got {response.status_code}")
            return
            
        data = response.json()
        
        # Check required fields
        required_fields = ["etaMinutes", "estimateMin", "estimateMax", "currency", "deepLinkUrl", "isMock"]
        for field in required_fields:
            if field not in data:
                results.log_fail("Commute Search", f"Missing field: {field}")
                return
                
        if not data.get("isMock"):
            results.log_fail("Commute Search", "Expected isMock=true")
            return
            
        # Validate deep link format
        deep_link = data.get("deepLinkUrl", "")
        if not deep_link.startswith("https://m.uber.com/ul/"):
            results.log_fail("Commute Search", f"Invalid deep link format: {deep_link}")
            return
            
        # Check if coordinates are in the deep link
        andheri_lat = str(TEST_COORDINATES["andheri_east"]["latitude"])
        bkc_lat = str(TEST_COORDINATES["bkc"]["latitude"])
        if andheri_lat not in deep_link or bkc_lat not in deep_link:
            results.log_fail("Commute Search", "Deep link missing coordinates")
            return
            
        results.log_pass("Commute Search")
        
    except Exception as e:
        results.log_fail("Commute Search", f"Request failed: {str(e)}")

def test_surge_radar(results, token):
    """Test POST /api/v1/commute/surge-radar"""
    if not token:
        results.log_fail("Surge Radar", "No token available")
        return
        
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        payload = {
            "origin": TEST_COORDINATES["andheri_east"],
            "destination": TEST_COORDINATES["bkc"],
            "durationMinutes": 30
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/commute/surge-radar", 
                               json=payload, headers=headers)
        
        if response.status_code != 200:
            results.log_fail("Surge Radar", f"Expected 200, got {response.status_code}")
            return
            
        data = response.json()
        
        # Check required fields
        if "buckets" not in data:
            results.log_fail("Surge Radar", "Missing buckets array")
            return
            
        buckets = data["buckets"]
        if not isinstance(buckets, list) or len(buckets) != 7:
            results.log_fail("Surge Radar", f"Expected 7 buckets, got {len(buckets) if isinstance(buckets, list) else 'not a list'}")
            return
            
        if "bestBucket" not in data:
            results.log_fail("Surge Radar", "Missing bestBucket")
            return
            
        if "potentialSaving" not in data:
            results.log_fail("Surge Radar", "Missing potentialSaving")
            return
            
        results.log_pass("Surge Radar")
        
    except Exception as e:
        results.log_fail("Surge Radar", f"Request failed: {str(e)}")

def test_insights_summary(results, token):
    """Test GET /api/v1/insights/summary"""
    if not token:
        results.log_fail("Insights Summary", "No token available")
        return
        
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/v1/insights/summary?period=7d", headers=headers)
        
        if response.status_code != 200:
            results.log_fail("Insights Summary", f"Expected 200, got {response.status_code}")
            return
            
        data = response.json()
        
        # Check required fields
        required_fields = ["totalTrips", "totalSpend", "weekScore"]
        for field in required_fields:
            if field not in data:
                results.log_fail("Insights Summary", f"Missing field: {field}")
                return
                
        results.log_pass("Insights Summary")
        
    except Exception as e:
        results.log_fail("Insights Summary", f"Request failed: {str(e)}")

def test_insights_export(results, token):
    """Test GET /api/v1/insights/export"""
    if not token:
        results.log_fail("Insights Export", "No token available")
        return
        
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/v1/insights/export?period=30d", headers=headers)
        
        if response.status_code != 200:
            results.log_fail("Insights Export", f"Expected 200, got {response.status_code}")
            return
            
        # Check if response is CSV
        content_type = response.headers.get("content-type", "")
        if "text/csv" not in content_type:
            results.log_fail("Insights Export", f"Expected CSV content-type, got {content_type}")
            return
            
        # Check CSV header
        csv_content = response.text
        if not csv_content.startswith("Date,Origin,Destination"):
            results.log_fail("Insights Export", "Invalid CSV header")
            return
            
        results.log_pass("Insights Export")
        
    except Exception as e:
        results.log_fail("Insights Export", f"Request failed: {str(e)}")

def test_auth_protection(results):
    """Test that protected routes require Bearer token"""
    protected_endpoints = [
        ("GET", "/api/v1/me"),
        ("POST", "/api/v1/commute/search"),
        ("POST", "/api/v1/commute/surge-radar"),
        ("GET", "/api/v1/insights/summary"),
        ("GET", "/api/v1/insights/export")
    ]
    
    for method, endpoint in protected_endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={}, headers=HEADERS)
                
            if response.status_code != 401:
                results.log_fail(f"Auth Protection ({endpoint})", f"Expected 401, got {response.status_code}")
                return
                
        except Exception as e:
            results.log_fail(f"Auth Protection ({endpoint})", f"Request failed: {str(e)}")
            return
            
    results.log_pass("Auth Protection")

def main():
    print("🚀 Starting HailO Backend API Tests")
    print(f"📍 Testing server at: {BASE_URL}")
    print("=" * 50)
    
    results = TestResults()
    
    # Run tests in sequence
    test_health_check(results)
    token = test_auth_flow(results)
    test_user_profile(results, token)
    test_commute_search(results, token)
    test_surge_radar(results, token)
    test_insights_summary(results, token)
    test_insights_export(results, token)
    test_auth_protection(results)
    
    print("=" * 50)
    success = results.summary()
    
    if success:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("💥 Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()