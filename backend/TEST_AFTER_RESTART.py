"""
Test script to verify everything works after restart
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 70)
print("TESTING BACKEND AFTER RESTART")
print("=" * 70)
print()

# Test 1: Check if backend is running
print("Test 1: Checking if backend is running...")
try:
    response = requests.get(f"{BASE_URL}/docs", timeout=5)
    if response.status_code == 200:
        print("  [OK] Backend is running!")
    else:
        print(f"  [WARN] Backend returned status {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"  [ERROR] Backend is NOT running!")
    print(f"  Error: {e}")
    print()
    print("  Please start the backend first:")
    print("    cd C:\\Users\\HNC\\Desktop\\EnglishWebAI\\EnglishWebAI\\backend")
    print("    python main.py")
    exit(1)

print()

# Test 2: Get courses list
print("Test 2: Testing GET /api/v1/courses/...")
try:
    # You'll need a valid token
    print("  [INFO] This test requires authentication")
    print("  Please test manually in the UI:")
    print("    1. Login to Teacher Dashboard")
    print("    2. Try creating a course with thumbnail")
    print("    3. Check if thumbnail appears in My Courses")
except Exception as e:
    print(f"  [ERROR] {e}")

print()
print("=" * 70)
print("MANUAL TESTING STEPS:")
print("=" * 70)
print()
print("1. Open browser: http://localhost:3000")
print("2. Login as Teacher")
print("3. Go to Teacher Dashboard > Courses Management")
print("4. Click 'Tao khoa hoc moi'")
print("5. Fill form and upload thumbnail image")
print("6. Click 'Tao khoa hoc'")
print("7. Go to My Courses")
print("8. Check if thumbnail is displayed")
print()
print("If all steps work without error = SUCCESS!")
print("=" * 70)


