#!/usr/bin/env python3
"""
Debug authentication and permissions
"""
import requests
import json

def login():
    """Login through proxy"""
    url = "http://localhost/api/users/login/"
    data = {
        "username": "teacher1",
        "password": "Teacher123!"
    }
    response = requests.post(url, json=data)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Login successful")
        print(f"User ID: {result.get('user_id')}")
        print(f"Role: {result.get('role')}")
        print(f"Username: {result.get('username')}")
        return result["access_token"]
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_current_user(token):
    """Get current user info"""
    url = "http://localhost/api/v1/users/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"\n📝 Current user info:")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        user = response.json()
        print(f"Username: {user.get('username')}")
        print(f"Role: {user.get('role')}")
        print(f"Email: {user.get('email')}")
        return user
    else:
        print(f"Response: {response.text}")
        return None

def test_teaching_classes(token):
    """Test classes teaching endpoint"""
    url = "http://localhost/api/v1/classes/teaching"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n📚 Testing classes/teaching:")
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    return response.json() if response.status_code == 200 else []

def main():
    print("🔍 Debug Authentication & Permissions")
    print("=" * 50)
    
    # Login
    token = login()
    if not token:
        return
    
    # Get current user
    user = test_current_user(token)
    
    # Test teaching classes
    classes = test_teaching_classes(token)
    
    print(f"\n📊 Summary:")
    print(f"- User role: {user.get('role') if user else 'Unknown'}")
    print(f"- Teaching classes: {len(classes)} classes")
    
    if user and user.get('role') != 'TEACHER':
        print(f"⚠️  WARNING: User role is {user.get('role')}, not TEACHER")
        print("This might cause issues accessing teacher-specific endpoints")

if __name__ == "__main__":
    main()