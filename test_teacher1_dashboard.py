#!/usr/bin/env python3
"""
Test teacher dashboard with teacher1 user
"""
import requests
import json

def login():
    """Login teacher1 through proxy"""
    url = "http://localhost/api/users/login/"
    data = {
        "username": "teacher1",
        "password": "Teacher123!"
    }
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_dashboard(token):
    """Test teacher dashboard"""
    url = "http://localhost/api/v1/teacher/dashboard/overview"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing teacher dashboard...")
    response = requests.get(url, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200

def main():
    print("🔍 Testing Teacher Dashboard with teacher1")
    print("=" * 50)
    
    token = login()
    if not token:
        return
    
    print("✅ Login successful")
    test_dashboard(token)

if __name__ == "__main__":
    main()