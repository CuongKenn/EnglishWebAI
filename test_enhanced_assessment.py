#!/usr/bin/env python3
"""
Test script for Enhanced Weekly Assessment API
"""
import requests
import json
import sys

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

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

def test_create_assessment(token, class_id=1):
    """Test creating enhanced weekly assessment"""
    url = f"{BASE_URL}/enhanced-weekly-assessments/generate"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "class_id": class_id,
        "week_number": 1,
        "assessment_type": "weekly_integrated",
        "difficulty_level": "medium",
        "grade_level": 8
    }
    
    print("Creating enhanced weekly assessment...")
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Assessment created successfully!")
        print(f"Assessment ID: {result['id']}")
        print(f"Title: {result['title']}")
        print(f"Type: {result['assessment_type']}")
        return result["id"]
    else:
        print(f"❌ Failed to create assessment: {response.status_code}")
        print(response.text)
        return None

def test_list_assessments(token, class_id=1):
    """Test listing assessments"""
    url = f"{BASE_URL}/enhanced-weekly-assessments/"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"class_id": class_id}
    
    print("Fetching assessments...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        assessments = response.json()
        print(f"✅ Found {len(assessments)} assessments")
        for assessment in assessments:
            print(f"  - {assessment['title']} (Week {assessment['week_number']})")
        return assessments
    else:
        print(f"❌ Failed to fetch assessments: {response.status_code}")
        print(response.text)
        return []

def test_export_analysis(token, class_id=1):
    """Test exporting error analysis"""
    url = f"{BASE_URL}/enhanced-weekly-assessments/export/error-analysis"
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {
        "class_id": class_id,
        "assessment_type": "weekly_integrated",
        "week_number": 1
    }
    
    print("Exporting error analysis...")
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        # Save the Excel file
        with open("error_analysis.xlsx", "wb") as f:
            f.write(response.content)
        print("✅ Error analysis exported to error_analysis.xlsx")
        return True
    else:
        print(f"❌ Failed to export analysis: {response.status_code}")
        print(response.text)
        return False

def main():
    print("🚀 Testing Enhanced Weekly Assessment API")
    print("=" * 50)
    
    # Test with admin user
    token = login("admin", "Admin123!")
    if not token:
        print("❌ Authentication failed")
        sys.exit(1)
    
    print("✅ Authentication successful")
    
    # Test creating assessment
    assessment_id = test_create_assessment(token)
    if not assessment_id:
        sys.exit(1)
    
    # Test listing assessments
    assessments = test_list_assessments(token)
    
    # Test exporting analysis (only if we have submissions)
    if assessment_id:
        test_export_analysis(token)
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main()