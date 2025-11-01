#!/usr/bin/env python3
"""
Test API through nginx proxy
"""
import requests
import json

def login():
    """Login through proxy"""
    url = "http://localhost/api/users/login/"
    data = {
        "username": "admin",
        "password": "Admin123!"
    }
    print(f"Logging in via: {url}")
    response = requests.post(url, json=data)
    print(f"Login status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Login successful")
        return response.json()["access_token"]
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_dashboard_via_proxy(token):
    """Test dashboard through nginx proxy"""
    url = "http://localhost/api/v1/teacher/dashboard/overview"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Testing dashboard via proxy: {url}")
    response = requests.get(url, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
    
    return response.status_code == 200

def main():
    print("🔍 Testing APIs through Nginx Proxy")
    print("=" * 50)
    
    # Login through proxy
    token = login()
    if not token:
        return
    
    # Test dashboard through proxy
    test_dashboard_via_proxy(token)

if __name__ == "__main__":
    main()