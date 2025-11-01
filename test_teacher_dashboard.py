#!/usr/bin/env python3
"""
Test teacher dashboard API
"""
import requests
import json

def login(username, password):
    """Login and get access token"""
    url = f"http://localhost:8000/api/users/login/"
    data = {
        "username": username,
        "password": password
    }
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.text}")
        return None

def test_teacher_dashboard(token):
    """Test teacher dashboard overview"""
    url = "http://localhost:8000/api/v1/teacher/dashboard/overview"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing teacher dashboard overview...")
    response = requests.get(url, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    return response.status_code == 200

def test_classes_endpoint(token):
    """Test classes teaching endpoint"""
    url = "http://localhost:8000/api/v1/classes/teaching"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nTesting classes teaching...")
    response = requests.get(url, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    return response.status_code == 200

def main():
    print("🔍 Testing Teacher Dashboard APIs")
    print("=" * 50)
    
    # Login with admin (has teacher role for testing)
    token = login("admin", "Admin123!")
    if not token:
        print("❌ Authentication failed")
        return
    
    print("✅ Authentication successful")
    
    # Test dashboard
    test_teacher_dashboard(token)
    
    # Test classes
    test_classes_endpoint(token)

if __name__ == "__main__":
    main()