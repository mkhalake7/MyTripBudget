import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_backend():
    unique_suffix = str(uuid.uuid4())[:8]
    test_user = {
        "email": f"test_{unique_suffix}@example.com",
        "password": "Password123!",
        "full_name": f"Test User {unique_suffix}",
        "mobile_number": "1234567890"
    }

    print(f"\n--- Starting Backend Verification ({unique_suffix}) ---")

    # 1. Register
    print("\n1. Testing Registration...")
    reg_res = requests.post(f"{BASE_URL}/signup", json=test_user)
    if reg_res.status_code != 200:
        print(f"FAILED: Registration returned {reg_res.status_code}")
        print(reg_res.text)
        return
    print("SUCCESS: Registered successfully.")

    # 2. Login
    print("\n2. Testing Login...")
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"]
    }
    login_res = requests.post(f"{BASE_URL}/token", data=login_data)
    if login_res.status_code != 200:
        print(f"FAILED: Login returned {login_res.status_code}")
        return
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Logged in and received token.")

    # 3. Create Group
    print("\n3. Testing Group Creation...")
    group_data = {
        "name": "Swiss Alps Trip",
        "description": "Skiing holiday",
        "category": "Trip",
        "currency": "INR"
    }
    group_res = requests.post(f"{BASE_URL}/groups/", json=group_data, headers=headers)
    if group_res.status_code != 200:
        print(f"FAILED: Group creation returned {group_res.status_code}")
        return
    group = group_res.json()
    group_id = group["id"]
    print(f"SUCCESS: Created group '{group['name']}' with ID {group_id}")

    # 4. Add Expense with Category and Notes
    print("\n4. Testing Expense Addition (with Category and Notes)...")
    expense_data = {
        "group_id": group_id,
        "description": "Train to Zermatt",
        "amount": 1200,
        "category": "Transport",
        "notes": "SBB high-speed train",
        "payer_id": group["admin_id"],
        "splits": [
            {"user_id": group["admin_id"], "amount": 1200}
        ]
    }
    exp_res = requests.post(f"{BASE_URL}/expenses/", json=expense_data, headers=headers)
    if exp_res.status_code != 200:
        print(f"FAILED: Expense addition returned {exp_res.status_code}")
        print(exp_res.text)
        return
    print(f"SUCCESS: Added expense '{expense_data['description']}' in category '{expense_data['category']}'")

    # 5. Verify Activity Feed
    print("\n5. Testing Activity Feed...")
    act_res = requests.get(f"{BASE_URL}/expenses/activities?group_id={group_id}", headers=headers)
    if act_res.status_code != 200:
        print(f"FAILED: Activity feed retrieval returned {act_res.status_code}")
        return
    activities = act_res.json()
    print(f"SUCCESS: Retrieved {len(activities)} activities.")
    for act in activities:
        print(f"  - {act['description']} ({act['type']})")

    # 6. Verify Dashboard Summary
    print("\n6. Testing Dashboard Summary...")
    sum_res = requests.get(f"{BASE_URL}/expenses/summary", headers=headers)
    if sum_res.status_code != 200:
        print(f"FAILED: Summary retrieval returned {sum_res.status_code}")
        return
    summary = sum_res.json()
    print(f"SUCCESS: Total Balance: {summary['total_balance']}, Owed To You: {summary['owed_to_you']}, You Owe: {summary['you_owe']}")

    # 7. Settle Up (Payment)
    # For this test, we'll just check if the endpoint is reachable and returns 200, 
    # even if there's no actual debt to settle in this single-user scenario.
    print("\n7. Testing Settle Up (Payment Tracking)...")
    settle_data = {
        "group_id": group_id,
        "amount": 100,
        "payee_id": group["admin_id"],
        "notes": "Manual verification payment"
    }
    settle_res = requests.post(f"{BASE_URL}/expenses/settle", json=settle_data, headers=headers)
    if settle_res.status_code != 200:
        print(f"FAILED: Settle Up returned {settle_res.status_code}")
        return
    print("SUCCESS: Payment recorded successfully.")

    # 8. Final Check Activity for Payment
    act_res_final = requests.get(f"{BASE_URL}/expenses/activities?group_id={group_id}", headers=headers)
    activities_final = act_res_final.json()
    if any(a['type'] == 'PAYMENT_MADE' for a in activities_final):
        print("SUCCESS: Payment activity logged.")
    else:
        print("FAILED: Payment activity not found.")

    print("\n--- Backend Verification COMPLETE ---")

if __name__ == "__main__":
    test_backend()
