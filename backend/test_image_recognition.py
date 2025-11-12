"""
Test Image Recognition API
Quick test script without needing frontend login
"""

import sys

import requests

# Configuration
API_URL = "http://localhost:8000"
TOKEN = "YOUR_TOKEN_HERE"  # Get from browser localStorage after login

def test_health():
    """Test health endpoint (no auth required)"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{API_URL}/api/v1/ai/image-recognition/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_recognize(image_path: str, level: str = "beginner"):
    """Test image recognition endpoint"""
    print(f"📸 Testing image recognition with: {image_path}")

    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }

    with open(image_path, "rb") as f:
        files = {"file": f}
        data = {"level": level}

        response = requests.post(
            f"{API_URL}/api/v1/ai/image-recognition/recognize",
            headers=headers,
            files=files,
            data=data,
            timeout=30
        )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print("\n✅ Success!")
        print(f"Primary Object: {result.get('primary_object', {}).get('label')}")

        if result.get('primary_object'):
            vocab = result['primary_object']['vocabulary']
            print("\nVocabulary Details:")
            print(f"  Word: {vocab['word']}")
            print(f"  IPA (US): {vocab['ipa_us']}")
            print(f"  IPA (UK): {vocab.get('ipa_uk', 'N/A')}")
            print(f"  Definition: {vocab['definition']}")
            print(f"  Example: {vocab['example_sentence']}")
            print(f"  Translation: {vocab.get('example_translation', 'N/A')}")
            print(f"  Synonyms: {', '.join(vocab.get('synonyms', []))}")
    else:
        print(f"\n❌ Error: {response.text}")

if __name__ == "__main__":
    # Test health first
    test_health()

    # Test with image if provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        level = sys.argv[2] if len(sys.argv) > 2 else "beginner"

        if TOKEN == "YOUR_TOKEN_HERE":
            print("⚠️  Please set your TOKEN in the script first!")
            print("   Get it from browser localStorage after login")
            print("   Or login via API:")
            print(f"   curl -X POST {API_URL}/api/users/login -H 'Content-Type: application/json' -d '{{\"username\":\"admin\",\"password\":\"admin123\"}}'")
        else:
            test_recognize(image_path, level)
    else:
        print("💡 Usage: python test_image_recognition.py <image_path> [level]")
        print("   Example: python test_image_recognition.py apple.jpg beginner")
