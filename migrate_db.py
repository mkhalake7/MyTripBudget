#!/usr/bin/env python3
"""
Add missing date column to expenses table
"""
import sys
sys.path.insert(0, '/Users/mdkhalake/Documents/My Projects/MyTripBudget')

from backend.database import SessionLocal, engine
import sqlite3

def migrate():
    try:
        # Connect to SQLite database
        conn = sqlite3.connect('sql_app.db')
        cursor = conn.cursor()
        
        # Check if date column exists
        cursor.execute("PRAGMA table_info(expenses)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'date' not in columns:
            print("Adding 'date' column to expenses table...")
            cursor.execute("ALTER TABLE expenses ADD COLUMN date DATETIME")
            conn.commit()
            print("✓ Column added successfully!")
        else:
            print("✓ Date column already exists")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
