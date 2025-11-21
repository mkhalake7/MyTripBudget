#!/usr/bin/env python3
"""
Fix duplicate expense splits in the database
"""
import sys
sys.path.insert(0, '/Users/mdkhalake/Documents/My Projects/MyTripBudget')

from backend.database import SessionLocal
from backend import models

def fix_duplicate_splits():
    db = SessionLocal()
    try:
        # Get all expenses
        expenses = db.query(models.Expense).all()
        
        for expense in expenses:
            # Get all splits for this expense
            splits = db.query(models.ExpenseSplit).filter(
                models.ExpenseSplit.expense_id == expense.id
            ).all()
            
            if len(splits) == 0:
                print(f"Expense {expense.id} ({expense.description}) has no splits - skipping")
                continue
                
            # Check if splits sum correctly
            split_total = sum(s.amount for s in splits)
            
            if abs(split_total - expense.amount) > 0.01:
                print(f"\nExpense {expense.id}: {expense.description}")
                print(f"  Amount: ${expense.amount:.2f}")
                print(f"  Splits total: ${split_total:.2f} ({len(splits)} splits)")
                print(f"  FIXING: Deleting all splits and recreating...")
                
                # Delete all existing splits
                for split in splits:
                    db.delete(split)
                db.commit()
                
                # Get group members
                members = db.query(models.GroupMember).filter(
                    models.GroupMember.group_id == expense.group_id
                ).all()
                
                if expense.split_type == 'EQUAL':
                    # Recreate equal splits
                    split_amount = expense.amount / len(members)
                    for member in members:
                        new_split = models.ExpenseSplit(
                            expense_id=expense.id,
                            user_id=member.user_id,
                            amount=split_amount
                        )
                        db.add(new_split)
                    print(f"  Created {len(members)} equal splits of ${split_amount:.2f} each")
                else:
                    print(f"  WARNING: Cannot auto-fix {expense.split_type} split type")
                    print(f"  Please delete this expense and recreate it manually")
                
                db.commit()
        
        print("\n✓ Database cleanup complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("This script will fix duplicate expense splits in the database.")
    response = input("Continue? (yes/no): ")
    if response.lower() == 'yes':
        fix_duplicate_splits()
    else:
        print("Cancelled")
