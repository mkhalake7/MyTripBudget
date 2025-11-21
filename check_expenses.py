#!/usr/bin/env python3
"""
Debug script to check expenses and splits for a specific group
"""
import sys
sys.path.insert(0, '/Users/mdkhalake/Documents/My Projects/MyTripBudget')

from backend.database import SessionLocal
from backend import models

def check_group_expenses(group_id):
    db = SessionLocal()
    try:
        # Get group info
        group = db.query(models.Group).filter(models.Group.id == group_id).first()
        if not group:
            print(f"Group {group_id} not found")
            return
            
        print(f"\n=== Group: {group.name} (ID: {group_id}) ===\n")
        
        # Get all expenses for this group
        expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
        print(f"Total expenses: {len(expenses)}")
        print(f"Total amount: ${sum(e.amount for e in expenses):.2f}\n")
        
        for expense in expenses:
            print(f"\nExpense ID: {expense.id}")
            print(f"  Description: {expense.description}")
            print(f"  Amount: ${expense.amount:.2f}")
            print(f"  Payer ID: {expense.payer_id}")
            print(f"  Split Type: {expense.split_type}")
            
            # Get splits for this expense
            splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id).all()
            print(f"  Splits ({len(splits)}):")
            split_total = 0
            for split in splits:
                print(f"    User {split.user_id}: ${split.amount:.2f}")
                split_total += split.amount
            print(f"  Split total: ${split_total:.2f}")
            
            if abs(split_total - expense.amount) > 0.01:
                print(f"  WARNING: Splits don't match expense amount!")
        
        # Calculate balances
        print("\n=== Balances ===")
        balances = {}
        for expense in expenses:
            splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id).all()
            for split in splits:
                if split.user_id not in balances:
                    balances[split.user_id] = 0.0
                    
                if split.user_id == expense.payer_id:
                    balances[split.user_id] += (expense.amount - split.amount)
                else:
                    balances[split.user_id] -= split.amount
        
        for user_id, balance in balances.items():
            user = db.query(models.User).filter(models.User.id == user_id).first()
            name = user.full_name if user else f"User {user_id}"
            print(f"{name}: ${balance:+.2f}")
            
    finally:
        db.close()

if __name__ == "__main__":
    # Check Kerala group - replace with actual group ID
    group_id = input("Enter group ID to check (or press Enter for all groups): ")
    
    db = SessionLocal()
    if not group_id:
        groups = db.query(models.Group).all()
        for group in groups:
            print(f"\n{'='*60}")
            check_group_expenses(group.id)
    else:
        check_group_expenses(int(group_id))
    db.close()
