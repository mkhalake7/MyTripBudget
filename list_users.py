import sqlite3

# Connect to the database
conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()

# Check schema first
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()
print("\n=== Users Table Schema ===")
for col in columns:
    print(f"{col[1]} ({col[2]})")

# Query all users
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()

print("\n=== All Users ===")
if users:
    # Get column names
    column_names = [description[0] for description in cursor.description]
    print(" | ".join(column_names))
    print("-" * 80)
    
    for user in users:
        print(" | ".join(str(field) for field in user))
    
    print(f"\nTotal users: {len(users)}")
else:
    print("No users found in the database.")

conn.close()
