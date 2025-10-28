"""
Test audio upload endpoint
"""
import requests
import os

# Assuming backend is running on localhost:8000
BASE_URL = "http://localhost:8000"

def test_upload_audio():
    # Create a dummy audio file for testing
    test_file_path = "test_audio.mp3"
    with open(test_file_path, "wb") as f:
        f.write(b"fake audio content for testing")
    
    try:
        # Login first to get token
        login_response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "teacher@example.com",  # Change to your test account
                "password": "password123"
            }
        )
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            print(login_response.text)
            return
        
        token = login_response.json()["access_token"]
        print(f"✓ Login successful, token: {token[:20]}...")
        
        # Upload audio
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_audio.mp3", f, "audio/mpeg")}
            headers = {"Authorization": f"Bearer {token}"}
            
            print("\n📤 Uploading audio...")
            upload_response = requests.post(
                f"{BASE_URL}/api/v1/question-bank/upload/audio",
                files=files,
                headers=headers
            )
        
        print(f"\n📊 Response Status: {upload_response.status_code}")
        print(f"📄 Response Body: {upload_response.text}")
        
        if upload_response.status_code == 200:
            print("\n✅ Upload successful!")
            print(f"URL: {upload_response.json().get('url')}")
        else:
            print("\n❌ Upload failed!")
            
    finally:
        # Cleanup
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print(f"\n🧹 Cleaned up test file")

if __name__ == "__main__":
    test_upload_audio()

