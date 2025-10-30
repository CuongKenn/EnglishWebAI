"""
Performance test for optimized teacher analytics
Run this to verify the optimizations are working
"""

import time
import requests
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def login_as_teacher():
    """Login and get token"""
    response = requests.post(
        f"http://localhost:8000/api/users/login",
        json={"username": "testteacher", "password": "Test123!"}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print("❌ Login failed. Make sure you have a test teacher account.")
        return None

def test_statistics_performance(token):
    """Test statistics endpoint performance"""
    print("\n📊 Testing /teacher/statistics...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test different periods
    periods = ["week", "month", "semester", "year"]
    
    for period in periods:
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/teacher/statistics",
            params={"period": period},
            headers=headers
        )
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ {period:10s}: {elapsed:.3f}s - {data['total_students']} students, avg score {data['avg_score']}")
        else:
            print(f"  ❌ {period:10s}: Failed - {response.status_code}")

def test_export_performance(token):
    """Test Excel export performance"""
    print("\n📥 Testing /teacher/statistics/export...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    start = time.time()
    response = requests.get(
        f"{BASE_URL}/teacher/statistics/export",
        params={"period": "month"},
        headers=headers
    )
    elapsed = time.time() - start
    
    if response.status_code == 200:
        file_size = len(response.content) / 1024  # KB
        print(f"  ✅ Export: {elapsed:.3f}s - File size: {file_size:.1f} KB")
    else:
        print(f"  ❌ Export failed: {response.status_code}")

def test_student_analytics_pagination(token):
    """Test student analytics with pagination"""
    print("\n👥 Testing /classes/{id}/analytics/students (pagination)...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First get a class ID
    classes_response = requests.get(f"{BASE_URL}/classes/teaching", headers=headers)
    if classes_response.status_code != 200 or not classes_response.json():
        print("  ⚠️  No classes found")
        return
    
    class_id = classes_response.json()[0]["id"]
    
    # Test pagination
    for page in [1, 2]:
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/teacher/classes/{class_id}/analytics/students",
            params={"page": page, "page_size": 20},
            headers=headers
        )
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Page {page}: {elapsed:.3f}s - {len(data['students'])} students (total: {data['total']})")
        else:
            print(f"  ❌ Page {page} failed: {response.status_code}")

def test_class_overview(token):
    """Test class overview endpoint"""
    print("\n📋 Testing /classes/{id}/analytics/overview...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get a class ID
    classes_response = requests.get(f"{BASE_URL}/classes/teaching", headers=headers)
    if classes_response.status_code != 200 or not classes_response.json():
        print("  ⚠️  No classes found")
        return
    
    class_id = classes_response.json()[0]["id"]
    
    start = time.time()
    response = requests.get(
        f"{BASE_URL}/teacher/classes/{class_id}/analytics/overview",
        headers=headers
    )
    elapsed = time.time() - start
    
    if response.status_code == 200:
        data = response.json()
        print(f"  ✅ Overview: {elapsed:.3f}s")
        print(f"     - {data['student_count']} students")
        print(f"     - {data['total_exercises']} exercises")
        print(f"     - {data['total_submissions']} submissions")
        print(f"     - Class avg: {data['class_average']}")
    else:
        print(f"  ❌ Failed: {response.status_code}")

def main():
    print("=" * 60)
    print("🚀 TEACHER ANALYTICS PERFORMANCE TEST")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Login
    print("\n🔐 Logging in...")
    token = login_as_teacher()
    
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    print("✅ Login successful!")
    
    # Run tests
    test_statistics_performance(token)
    test_class_overview(token)
    test_student_analytics_pagination(token)
    test_export_performance(token)
    
    print("\n" + "=" * 60)
    print("✅ PERFORMANCE TEST COMPLETED")
    print("=" * 60)
    print("\n💡 Expected performance:")
    print("  - Statistics: < 1 second")
    print("  - Class overview: < 0.5 seconds")
    print("  - Student analytics: < 2 seconds")
    print("  - Excel export: < 5 seconds")
    print("\n📊 If times are significantly higher, check:")
    print("  1. Database indexes were created")
    print("  2. No other heavy processes running")
    print("  3. Database has reasonable amount of data")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

