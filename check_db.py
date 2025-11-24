#!/usr/bin/env python3
"""
Check for duplicate expense splits in the database
"""
import sys
sys.path.insert(0, '/Users/mdkhalake/Documents/My Projects/MyTripBudget')

from backend.database import SessionLocal
from backend import models

def check_splits():
    db = SessionLocal()
    try:
        expenses = db.query(models.Expense).all()
        print(f'Total expenses: {len(expenses)}\n')
        
        has_issues = False
        for expense in expenses:
            splits = db.query(models.ExpenseSplit).filter(
                models.ExpenseSplit.expense_id == expense.id
            ).all()
            
            split_total = sum(s.amount for s in splits)
            
            print(f'Expense {expense.id}: {expense.description}')
            print(f'  Amount: ${expense.amount:.2f}')
            print(f'  Splits: {len(splits)}')
            print(f'  Sum: ${split_total:.2f}')
            
            if abs(split_total - expense.amount) > 0.01:
                print(f'  ❌ ISSUE: Splits do not match expense amount!')
                has_issues = True
            else:
                print(f'  ✓ OK')
            print()
        
        if not has_issues:
            print('\n✓ All expenses look good!')
        else:
            print('\n❌ Some expenses have issues. Run fix_splits.py to fix them.')
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_splits()
