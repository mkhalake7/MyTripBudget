import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def register_user(email, name, password):
    try:
        # Endpoint is /signup, not /auth/register
        resp = requests.post(f"{BASE_URL}/signup", json={
            "email": email,
            "full_name": name,
            "password": password
        })
        if resp.status_code == 200:
            # Registration successful, now login to get token
            return login_user(email, password)
        # If already exists, try login
        return login_user(email, password)
    except Exception as e:
        print(f"Error registering {email}: {e}")
        return None

def login_user(email, password):
    # Endpoint is /token, not /auth/token
    resp = requests.post(f"{BASE_URL}/token", data={
        "username": email,
        "password": password
    })
    if resp.status_code == 200:
        return resp.json()
    print(f"Login failed for {email}: {resp.text}")
    return None

def create_group(token, name):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/groups/", json={"name": name}, headers=headers)
    return resp.json()

def add_member(token, group_id, email):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/groups/{group_id}/members?email={email}", headers=headers)
    return resp.json()

def add_expense(token, group_id, amount, description, split_type="EQUAL", splits=None):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "amount": amount,
        "description": description,
        "group_id": group_id,
        "split_type": split_type
    }
    if splits:
        data["splits"] = splits
    
    resp = requests.post(f"{BASE_URL}/expenses/", json=data, headers=headers)
    if resp.status_code != 200:
        print(f"Failed to add expense: {resp.text}")
    return resp.json()

def get_balances(token, group_id):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/expenses/balances/{group_id}", headers=headers)
    return resp.json()

def main():
    # 1. Setup Users
    print("Setting up users...")
    user_a = register_user("alice@test.com", "Alice", "password123")
    user_b = register_user("bob@test.com", "Bob", "password123")
    user_c = register_user("charlie@test.com", "Charlie", "password123")
    
    token_a = user_a["access_token"]
    
    # 2. Create Group
    print("Creating group...")
    group = create_group(token_a, "Test Split Group")
    group_id = group["id"]
    print(f"Group created with ID: {group_id}")
    
    # 3. Add Members
    print("Adding members...")
    add_member(token_a, group_id, "bob@test.com")
    add_member(token_a, group_id, "charlie@test.com")
    
    # Get User IDs (needed for splits)
    # We can get them from balances or members endpoint, but let's assume we know them or fetch them
    # For simplicity, let's fetch members
    headers = {"Authorization": f"Bearer {token_a}"}
    members = requests.get(f"{BASE_URL}/groups/{group_id}/members", headers=headers).json()
    user_map = {m["email"]: m["id"] for m in members}
    print(f"Members: {user_map}")
    
    id_a = user_map["alice@test.com"]
    id_b = user_map["bob@test.com"]
    id_c = user_map["charlie@test.com"]
    
    # 4. Test Case 1: Equal Split (All 3) - $30
    # Alice pays $30. Split 3 ways ($10 each).
    # Alice is owed $20. Bob owes $10. Charlie owes $10.
    print("\nTest 1: Adding $30 expense (Equal Split - All)...")
    add_expense(token_a, group_id, 30.0, "Dinner", "EQUAL")
    
    balances = get_balances(token_a, group_id)
    print("Balances after Test 1:")
    for b in balances:
        print(f"{b['user_name']}: {b['balance']}")
        
    # Verify
    bal_a = next(b['balance'] for b in balances if b['user_id'] == id_a)
    if abs(bal_a - 20.0) > 0.01:
        print("❌ Test 1 Failed: Alice should be owed 20")
    else:
        print("✅ Test 1 Passed")

    # 5. Test Case 2: Equal Split (Subset: Alice & Bob) - $20
    # Alice pays $20. Split 2 ways ($10 each). Charlie is EXCLUDED.
    # Alice paid $20, her share is $10. She is owed $10 from Bob.
    # Total Balances should be:
    # Alice: +20 (prev) + 10 (new) = +30
    # Bob: -10 (prev) - 10 (new) = -20
    # Charlie: -10 (prev) + 0 (new) = -10
    
    print("\nTest 2: Adding $20 expense (Equal Split - Alice & Bob only)...")
    splits = [
        {"user_id": id_a, "amount": 0},
        {"user_id": id_b, "amount": 0}
    ]
    add_expense(token_a, group_id, 20.0, "Lunch", "EQUAL", splits)
    
    balances = get_balances(token_a, group_id)
    print("Balances after Test 2:")
    for b in balances:
        print(f"{b['user_name']}: {b['balance']}")
        
    bal_a = next(b['balance'] for b in balances if b['user_id'] == id_a)
    bal_b = next(b['balance'] for b in balances if b['user_id'] == id_b)
    bal_c = next(b['balance'] for b in balances if b['user_id'] == id_c)
    
    if abs(bal_a - 30.0) < 0.01 and abs(bal_b + 20.0) < 0.01 and abs(bal_c + 10.0) < 0.01:
        print("✅ Test 2 Passed")
    else:
        print(f"❌ Test 2 Failed. Expected A:+30, B:-20, C:-10. Got A:{bal_a}, B:{bal_b}, C:{bal_c}")

if __name__ == "__main__":
    main()
