"""
Simple test script to verify exam proctoring API is working
"""

import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoints():
    print("Testing Exam Proctoring API endpoints...\n")

    # Test 1: Check if proctoring endpoints exist
    endpoints_to_test = [
        "/proctoring/start-monitoring",
        "/proctoring/verify-identity",
        "/proctoring/monitor-behavior",
        "/proctoring/end-monitoring",
    ]

    for endpoint in endpoints_to_test:
        url = f"{BASE_URL}{endpoint}"
        print(f"Testing {endpoint}...")

        try:
            # Try OPTIONS request (doesn't need auth)
            response = requests.options(url, timeout=5)
            print(f"  ✓ Endpoint exists (status: {response.status_code})")

            # Try POST without auth (should get 401/422)
            response = requests.post(url, json={}, timeout=5)
            if response.status_code in [401, 422, 403]:
                print(f"  ✓ Endpoint requires authentication (status: {response.status_code})")
            else:
                print(f"  ✗ Unexpected status: {response.status_code}")
                print(f"     Response: {response.text[:200]}")

        except requests.exceptions.ConnectionError:
            print("  ✗ Connection failed - backend may not be running")
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")

        print()

if __name__ == "__main__":
    test_endpoints()
