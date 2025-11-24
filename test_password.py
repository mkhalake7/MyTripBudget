#!/usr/bin/env python3
"""
Test password verification directly
"""
import bcrypt

# Test credentials
test_password = "password123"
stored_hash = "$2b$12$9wLypAkttot6QDnn74Gpx.mc1lqemi1DqvuAIVllZyVcrOjIjMjcS"

print(f"Testing password: '{test_password}'")
print(f"Stored hash: {stored_hash}")

# Test verification
try:
    result = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
    print(f"\nVerification result: {result}")
    
    if result:
        print("✓ Password verification works!")
    else:
        print("❌ Password verification failed!")
        
except Exception as e:
    print(f"❌ Error during verification: {e}")
    import traceback
    traceback.print_exc()

# Also test creating a new hash
print("\nCreating new hash for comparison:")
new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"New hash: {new_hash}")

# Verify against new hash
result2 = bcrypt.checkpw(test_password.encode('utf-8'), new_hash.encode('utf-8'))
print(f"New hash verification: {result2}")
