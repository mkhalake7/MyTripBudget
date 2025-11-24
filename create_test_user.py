#!/usr/bin/env python3
"""
Create a test user for login testing
"""
import sys
sys.path.insert(0, '/Users/mdkhalake/Documents/My Projects/MyTripBudget')

from backend.database import SessionLocal
from backend import models, auth

def create_test_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(models.User).filter(models.User.email == "test@example.com").first()
        if existing:
            print("✓ User test@example.com already exists")
            print(f"  ID: {existing.id}")
            print(f"  Name: {existing.full_name}")
            return
        
        # Create new user
        hashed_password = auth.get_password_hash("password123")
        user = models.User(
            email="test@example.com",
            full_name="Test User",
            hashed_password=hashed_password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("✓ Created test user!")
        print(f"  Email: test@example.com")
        print(f"  Password: password123")
        print(f"  Name: Test User")
        print(f"  ID: {user.id}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
