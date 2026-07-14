import urllib.request
import urllib.error
import json
import time

BASE_URL = 'http://127.0.0.1:8000/api'

def make_request(path, method='GET', data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json', 'User-Agent': 'Python-Expense-Tester'}
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
            return e.code, json.loads(err_data)
        except:
            return e.code, err_data

def run_tests():
    # Setup: Register and login a test user
    username = f"expensetest_{int(time.time())}"
    password = "TestPass123!"

    print("--- Setup: Registering and logging in test user ---")
    make_request("/users/register/", "POST", {"username": username, "email": f"{username}@test.com", "password": password})
    status, res = make_request("/token/", "POST", {"username": username, "password": password})
    assert status == 200, f"Login failed: {res}"
    token = res["access"]
    print(f"Logged in as: {username}")

    # 1. Add Expense (POST)
    print("\n--- 1. Testing Add Expense (POST /api/expenses/) ---")
    expense_data = {
        "title": "Grocery Shopping",
        "amount": "500.00",
        "category": "Food",
        "description": "Weekly groceries",
        "expense_date": "2026-07-14"
    }
    status, res = make_request("/expenses/", "POST", expense_data, token)
    print(f"Status: {status}")
    print(f"Response: {res}")
    assert status == 201, f"Add expense failed: {res}"
    expense_id = res["id"]
    print(f"Expense created with ID: {expense_id} - OK!")

    # 2. Get All Expenses (GET)
    print("\n--- 2. Testing Get All Expenses (GET /api/expenses/) ---")
    status, res = make_request("/expenses/", "GET", token=token)
    print(f"Status: {status}")
    print(f"Total expenses found: {len(res)}")
    assert status == 200, f"Get expenses failed: {res}"
    assert len(res) >= 1, "No expenses found after adding one"
    print("Get All Expenses OK!")

    # 3. Update Expense (PATCH)
    print(f"\n--- 3. Testing Update Expense (PATCH /api/expenses/{expense_id}/) ---")
    update_data = {"title": "Updated Grocery Shopping", "amount": "650.00"}
    status, res = make_request(f"/expenses/{expense_id}/", "PATCH", update_data, token)
    print(f"Status: {status}")
    print(f"Updated title: {res.get('title')} | Updated amount: {res.get('amount')}")
    assert status == 200, f"Update expense failed: {res}"
    assert res["title"] == "Updated Grocery Shopping", "Title was not updated"
    print("Update Expense OK!")

    # 4. Delete Expense (DELETE)
    print(f"\n--- 4. Testing Delete Expense (DELETE /api/expenses/{expense_id}/) ---")
    status, res = make_request(f"/expenses/{expense_id}/", "DELETE", token=token)
    print(f"Status: {status} (Expected 204)")
    assert status == 204, f"Delete expense failed: {res}"
    print("Delete Expense OK!")

    # 5. Verify expense is gone
    print(f"\n--- 5. Verifying Expense is Deleted ---")
    status, res = make_request(f"/expenses/{expense_id}/", "GET", token=token)
    print(f"Status: {status} (Expected 404)")
    assert status == 404, f"Expected 404, got {status}"
    print("Verified - Expense no longer exists!")

    print("\n==============================")
    print("ALL EXPENSE API TESTS PASSED!")
    print("==============================")

if __name__ == "__main__":
    run_tests()
