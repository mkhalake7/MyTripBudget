import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def get_token(email, password):
    login_data = {"username": email, "password": password}
    res = requests.post(f"{BASE_URL}/token", data=login_data)
    if res.status_code == 200:
        return res.json()["access_token"]
    return None

def test_multi_user():
    unique_suffix = str(uuid.uuid4())[:8]
    
    # User A details
    user_a = {
        "email": f"user_a_{unique_suffix}@example.com",
        "password": "Password123!",
        "full_name": f"User A {unique_suffix}",
        "mobile_number": "1111111111"
    }
    
    # User B details
    user_b = {
        "email": f"user_b_{unique_suffix}@example.com",
        "password": "Password123!",
        "full_name": f"User B {unique_suffix}",
        "mobile_number": "2222222222"
    }

    print(f"\n--- Starting Multi-User Verification ({unique_suffix}) ---")

    # 1. Register User A & B
    print("\n1. Registering Users...")
    requests.post(f"{BASE_URL}/signup", json=user_a)
    requests.post(f"{BASE_URL}/signup", json=user_b)
    print("SUCCESS: Users registered.")

    # 2. Login User A
    token_a = get_token(user_a["email"], user_a["password"])
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # 3. User A creates a group
    print("\n2. User A creating group...")
    group_res = requests.post(f"{BASE_URL}/groups/", json={"name": "Shared Trip", "currency": "INR"}, headers=headers_a)
    group = group_res.json()
    group_id = group["id"]
    user_a_id = group["admin_id"]
    print(f"SUCCESS: Group created with ID {group_id}")

    # 4. User A adds User B to the group
    print("\n3. User A adding User B to group...")
    add_member_res = requests.post(f"{BASE_URL}/groups/{group_id}/members?email={user_b['email']}", headers=headers_a)
    user_b_data = add_member_res.json()
    user_b_id = user_b_data["id"]
    print(f"SUCCESS: User B (ID {user_b_id}) added to group.")

    # 5. User A adds an expense (1000 INR)
    print("\n4. User A adding 1000 INR expense (Equal split)...")
    expense_a = {
        "group_id": group_id,
        "description": "Lunch",
        "amount": 1000,
        "category": "Food",
        "payer_id": user_a_id,
        "split_type": "EQUAL"
    }
    requests.post(f"{BASE_URL}/expenses/", json=expense_a, headers=headers_a)
    print("SUCCESS: 1000 INR expense added.")

    # 6. Login User B
    token_b = get_token(user_b["email"], user_b["password"])
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 7. User B adds an expense (200 INR)
    print("\n5. User B adding 200 INR expense (Equal split)...")
    expense_b = {
        "group_id": group_id,
        "description": "Snacks",
        "amount": 200,
        "category": "Food",
        "payer_id": user_b_id,
        "split_type": "EQUAL"
    }
    requests.post(f"{BASE_URL}/expenses/", json=expense_b, headers=headers_b)
    print("SUCCESS: 200 INR expense added.")

    # 8. Verify Balances for User A
    print("\n6. Verifying balances for User A...")
    balance_res_a = requests.get(f"{BASE_URL}/expenses/balances/{group_id}", headers=headers_a)
    balances = balance_res_a.json()
    
    # Expected: 
    # User A paid 1000, owes 500 (from A's) and 100 (from B's). Net +400.
    # User B paid 200, owes 100 (from B's) and 500 (from A's). Net -400.
    
    user_a_summary = next(u for u in balances if u["user_id"] == user_a_id)
    user_b_summary = next(u for u in balances if u["user_id"] == user_b_id)
    
    print(f"  - User A Balance: {user_a_summary['balance']}")
    print(f"  - User B Balance: {user_b_summary['balance']}")
    
    if abs(user_a_summary['balance'] - 400) < 0.01 and abs(user_b_summary['balance'] + 400) < 0.01:
        print("SUCCESS: Balances are correct.")
    else:
        print("FAILED: Balance mismatch!")

    # 9. Verify Specific Debt (Who owes whom)
    print("\n7. Verifying specific debts...")
    # User B owes User A 400
    b_debts = user_b_summary["debts"]
    relevant_debt = next((d for d in b_debts if d["debtor_id"] == user_b_id and d["creditor_id"] == user_a_id), None)
    
    if relevant_debt and abs(relevant_debt["amount"] - 400) < 0.01:
        print(f"SUCCESS: User B correctly owes User A {relevant_debt['amount']} INR.")
    else:
        print("FAILED: Debt calculation error!")

    # 10. User B settles the debt
    print("\n8. User B settling the debt (400 INR)...")
    settle_data = {
        "group_id": group_id,
        "amount": 400,
        "payee_id": user_a_id,
        "notes": "Settling up lunch and snacks"
    }
    requests.post(f"{BASE_URL}/expenses/settle", json=settle_data, headers=headers_b)
    print("SUCCESS: Debt settled.")

    # 11. Final Balance check
    print("\n9. Final balance check...")
    final_res = requests.get(f"{BASE_URL}/expenses/balances/{group_id}", headers=headers_a)
    final_balances = final_res.json()
    a_final = next(u for u in final_balances if u["user_id"] == user_a_id)
    b_final = next(u for u in final_balances if u["user_id"] == user_b_id)
    
    print(f"  - User A Final Balance: {a_final['balance']}")
    print(f"  - User B Final Balance: {b_final['balance']}")
    
    if abs(a_final['balance']) < 0.01 and abs(b_final['balance']) < 0.01:
        print("SUCCESS: All balances settled to zero.")
    else:
        print("FAILED: Final balance non-zero!")

    print("\n--- Multi-User Verification COMPLETE ---")

if __name__ == "__main__":
    test_multi_user()
