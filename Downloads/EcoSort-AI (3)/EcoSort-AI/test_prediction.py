"""Quick prediction API test script."""
import requests
import io
from PIL import Image
import time

# Give server a moment to fully start
time.sleep(2)

BASE_URL = "http://127.0.0.1:8000"

print("Testing API connection...")

# Test root endpoint
try:
    r = requests.get(f"{BASE_URL}/")
    print(f"✓ Root endpoint: {r.status_code} - {r.json()}")
except Exception as e:
    print(f"✗ Root endpoint failed: {e}")
    exit(1)

# Generate a dummy test image (224x224 RGB)
print("\nGenerating test image...")
img = Image.new('RGB', (224, 224), color=(73, 109, 137))
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Test prediction endpoint
print("Testing prediction endpoint...")
try:
    files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
    r = requests.post(f"{BASE_URL}/predict", files=files)
    print(f"✓ Prediction endpoint: {r.status_code}")
    print(f"  Response: {r.json()}")
    result = r.json()
    if 'prediction' in result and 'confidence' in result:
        print(f"\n✓✓ SUCCESS: Model returned classification!")
        print(f"   Prediction: {result['prediction']}")
        print(f"   Confidence: {result['confidence']}")
    else:
        print(f"✗ Unexpected response format: {result}")
except Exception as e:
    print(f"✗ Prediction endpoint failed: {e}")
    import traceback
    traceback.print_exc()
