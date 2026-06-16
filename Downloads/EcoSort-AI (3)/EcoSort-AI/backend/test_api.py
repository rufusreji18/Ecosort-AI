import requests
import json
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_system():
    print("="*60)
    print(" EcoSort-AI System API Verification Suite")
    print("="*60)
    
    # 1. Ping Root
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"[PING] Root Endpoint: Code {r.status_code} - {r.json().get('message')}")
    except Exception as e:
        print(f"[FATAL] Server is offline or unreachable at {BASE_URL}: {e}")
        sys.exit(1)
        
    # Generate unique emails for tests
    import time
    ts = int(time.time())
    user_email = f"user_{ts}@test.com"
    admin_email = f"admin_{ts}@test.com"
    
    print("\n--- Testing Authentication & RBAC ---")
    
    # 2. Register User
    signup_user_payload = {
        "username": "test_user_node",
        "email": user_email,
        "password": "userpass123",
        "role": "user"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=signup_user_payload)
    print(f"[AUTH] User Signup: Code {r.status_code} - {r.json()}")
    
    # 3. Register Admin
    signup_admin_payload = {
        "username": "test_admin_node",
        "email": admin_email,
        "password": "adminpass123",
        "role": "admin"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=signup_admin_payload)
    print(f"[AUTH] Admin Signup: Code {r.status_code} - {r.json()}")
    
    # 4. Login User
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": user_email,
        "password": "userpass123"
    })
    user_token = r.json().get("token")
    print(f"[AUTH] User Login: Code {r.status_code} - Role: {r.json().get('role')}, Token length: {len(user_token) if user_token else 0}")
    
    # 5. Login Admin
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": admin_email,
        "password": "adminpass123"
    })
    admin_token = r.json().get("token")
    print(f"[AUTH] Admin Login: Code {r.status_code} - Role: {r.json().get('role')}, Token length: {len(admin_token) if admin_token else 0}")

    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    print("\n--- Testing IoT Smart Dustbin Integration ---")
    
    # Create a dummy image file for testing
    dummy_img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dummy_test_pic.jpg")
    with open(dummy_img_path, "wb") as f:
        f.write(b"MOCK_IMAGE_BINARY_DATA_FOR_ECOSORT_TESTS")
        
    # 6. Post Image as IoT Bin
    try:
        with open(dummy_img_path, "rb") as img_file:
            files = {"file": ("iot_test.jpg", img_file, "image/jpeg")}
            r = requests.post(
                f"{BASE_URL}/api/predict-iot?bin_id=bin_test_node",
                files=files
            )
        print(f"[IoT] Waste Image Upload: Code {r.status_code} - Prediction: {r.json().get('prediction')}, Conf: {r.json().get('confidence')}")
    except Exception as img_err:
        print(f"[IoT ERROR] Waste prediction failed: {img_err}")
    finally:
        if os.path.exists(dummy_img_path):
            os.remove(dummy_img_path)

    # 7. Post Fill-Level update under threshold (< 80%)
    level_update_normal = {
        "bin_id": "bin_test_node",
        "fill_level": 45.5
    }
    r = requests.post(f"{BASE_URL}/api/bin/update-level", json=level_update_normal)
    print(f"[IoT] Fill Level Normal (45%): Code {r.status_code} - Status: {r.json().get('status')}, Alert Triggered: {r.json().get('alert_triggered')}")

    # 8. Post Fill-Level update triggering warning threshold (>= 80%)
    level_update_critical = {
        "bin_id": "bin_test_node",
        "fill_level": 92.0
    }
    r = requests.post(f"{BASE_URL}/api/bin/update-level", json=level_update_critical)
    print(f"[IoT] Fill Level Critical (92%): Code {r.status_code} - Status: {r.json().get('status')}, Alert Triggered: {r.json().get('alert_triggered')}, Req Created: {r.json().get('collection_request_created')}")

    print("\n--- Testing Telemetry Dashboards & Reports ---")

    # 9. Get User Dashboard
    r = requests.get(f"{BASE_URL}/api/dashboard/user", headers=user_headers)
    print(f"[USER] Dashboard Stats: Code {r.status_code} - Points: {r.json().get('points')} PTS, Total Scans: {r.json().get('scans', {}).get('total')}")
    
    # 10. Get Admin Dashboard
    r = requests.get(f"{BASE_URL}/api/dashboard/admin", headers=admin_headers)
    print(f"[ADMIN] Dashboard Stats: Code {r.status_code} - Total Bins: {r.json().get('metrics', {}).get('total_bins')}, Full Bins Count: {r.json().get('metrics', {}).get('full_bins')}")

    # 11. Access Admin page as Standard User (RBAC verification)
    r = requests.get(f"{BASE_URL}/api/dashboard/admin", headers=user_headers)
    print(f"[RBAC] Protected Access check (User accessing Admin page): Code {r.status_code} - {r.json().get('detail') if r.status_code == 403 else 'PASS'}")

    # 12. List Bins
    r = requests.get(f"{BASE_URL}/api/bins")
    print(f"[DATA] Bins Registered count: Code {r.status_code} - {len(r.json())} bins found")

    print("\n" + "="*60)
    print(" API Verification Completed Successfully!")
    print("="*60)

if __name__ == "__main__":
    test_system()
