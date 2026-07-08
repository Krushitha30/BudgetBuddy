import urllib.request
import urllib.error
import json
import time

BASE_URL = 'http://127.0.0.1:8000/api'

def make_request(path, method='GET', data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Python-Auth-Tester'
    }
    if token:
        headers['Authorization'] = f"Bearer {token}"
        
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            return response.status, json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        err_data = e.read().decode('utf-8')
        try:
            parsed_err = json.loads(err_data)
        except:
            parsed_err = err_data
        return e.code, parsed_err

def run_tests():
    # 1. Register User
    username = f"testuser_{int(time.time())}"
    email = f"{username}@example.com"
    password = "TestPassword123!"
    
    print(f"--- 1. Testing Registration: {username} ---")
    reg_data = {
        "username": username,
        "email": email,
        "password": password
    }
    status, res = make_request("/users/register/", "POST", reg_data)
    print(f"Status: {status}")
    print(f"Response: {res}")
    assert status == 201, f"Failed to register. Status: {status}"
    print("Registration OK!")
    
    # 2. Login User (Generate JWT)
    print("\n--- 2. Testing Login (JWT Generation) ---")
    login_data = {
        "username": username,
        "password": password
    }
    status, res = make_request("/token/", "POST", login_data)
    print(f"Status: {status}")
    assert status == 200, f"Failed to log in. Status: {status}"
    assert "access" in res, "No access token in login response"
    assert "refresh" in res, "No refresh token in login response"
    
    access_token = res["access"]
    refresh_token = res["refresh"]
    print("Login OK! Tokens generated successfully.")
    
    # 3. Access Protected Route (Profile)
    print("\n--- 3. Testing Protected Route (Get Profile) ---")
    status, res = make_request("/users/profile/", "GET", token=access_token)
    print(f"Status: {status}")
    print(f"Response: {res}")
    assert status == 200, f"Failed to access profile. Status: {status}"
    assert res["username"] == username, "Username in profile does not match"
    print("Protected Route OK! Profile loaded successfully.")
    
    # 4. Logout User (Blacklist Token)
    print("\n--- 4. Testing Logout (Token Blacklist) ---")
    logout_data = {
        "refresh": refresh_token
    }
    status, res = make_request("/users/logout/", "POST", logout_data, token=access_token)
    print(f"Status: {status}")
    print(f"Response: {res}")
    assert status == 205 or status == 200, f"Failed to logout. Status: {status}"
    print("Logout OK!")
    
    # 5. Verify Blacklisted Token fails to refresh
    print("\n--- 5. Verifying Blacklisted Token Rejected ---")
    refresh_data = {
        "refresh": refresh_token
    }
    status, res = make_request("/token/refresh/", "POST", refresh_data)
    print(f"Status: {status} (Expected 401)")
    print(f"Response: {res}")
    assert status == 401, f"Expected 401 for blacklisted token refresh, got {status}"
    print("Verification OK! Blacklisted token rejected as expected.")
    
    print("\n==============================")
    print("ALL JWT API TESTS PASSED!")
    print("==============================")

if __name__ == "__main__":
    run_tests()
