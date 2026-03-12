from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from collections import defaultdict
from datetime import datetime
from .. import models, schemas, auth, database

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)

@router.post("/", response_model=schemas.Expense)
def create_expense(expense: schemas.ExpenseCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    print(f"\n=== CREATE EXPENSE CALLED ===")
    print(f"User: {current_user.email}")
    print(f"Group ID: {expense.group_id}")
    print(f"Amount: {expense.amount}")
    print(f"Split Type: {expense.split_type}")
    print(f"Splits provided: {len(expense.splits) if expense.splits else 0}")
    
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == expense.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is member of group
    is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == expense.group_id, models.GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to add expense to this group")

    # Determine payer
    payer_id = current_user.id
    if expense.payer_id:
        # Verify payer is a member of the group
        payer_is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == expense.group_id, models.GroupMember.user_id == expense.payer_id).first()
        if not payer_is_member:
            raise HTTPException(status_code=400, detail=f"Payer {expense.payer_id} is not a member of this group")
        payer_id = expense.payer_id

    # Parse date if provided as string
    expense_date = None
    if expense.date:
        try:
            # Try parsing ISO format (YYYY-MM-DD)
            expense_date = datetime.fromisoformat(expense.date)
        except (ValueError, AttributeError):
            # If it's already a datetime object or invalid, use None
            expense_date = None

    # Create expense
    db_expense = models.Expense(
        description=expense.description,
        amount=expense.amount,
        payer_id=payer_id,
        group_id=expense.group_id,
        split_type=expense.split_type or "EQUAL",
        category=expense.category or "General",
        notes=expense.notes,
        date=expense_date
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    # Log activity
    db_activity = models.Activity(
        user_id=current_user.id,
        group_id=expense.group_id,
        type="EXPENSE_ADDED",
        description=f"{current_user.full_name} added '{expense.description}' (${expense.amount})"
    )
    db.add(db_activity)
    # Don't commit yet, we'll commit with splits
    
    # SAFEGUARD: Check if splits already exist for this expense (in case of duplicate API calls)
    existing_splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == db_expense.id).all()
    if existing_splits:
        print(f"WARNING: Found {len(existing_splits)} existing splits for expense {db_expense.id}. Deleting them to prevent duplicates.")
        for split in existing_splits:
            db.delete(split)
        db.commit()
    
    # Handle splits based on split_type
    members = db.query(models.GroupMember).filter(models.GroupMember.group_id == expense.group_id).all()
    
    if expense.split_type == "EQUAL":
        # Equal split among all members OR specified subset
        target_members = []
        
        if expense.splits:
            # Split among specified users
            # Verify all users are in the group
            member_ids = {m.user_id for m in members}
            for split in expense.splits:
                if split.user_id not in member_ids:
                     raise HTTPException(status_code=400, detail=f"User {split.user_id} is not a member of this group")
                target_members.append(split.user_id)
        else:
            # Default: Split among ALL members
            target_members = [m.user_id for m in members]
            
        if target_members:
            split_amount = expense.amount / len(target_members)
            for user_id in target_members:
                db_split = models.ExpenseSplit(
                    expense_id=db_expense.id,
                    user_id=user_id,
                    amount=split_amount
                )
                db.add(db_split)
    
    elif expense.split_type == "EXACT":
        # Custom amounts specified by user
        if not expense.splits:
            raise HTTPException(status_code=400, detail="Splits required for EXACT split type")
        
        # Validate that splits sum to total amount
        total_splits = sum(s.amount for s in expense.splits)
        if abs(total_splits - expense.amount) > 0.01:  # Allow small floating point difference
            raise HTTPException(status_code=400, detail=f"Splits must sum to total amount. Got {total_splits}, expected {expense.amount}")
        
        for split in expense.splits:
            db_split = models.ExpenseSplit(
                expense_id=db_expense.id,
                user_id=split.user_id,
                amount=split.amount
            )
            db.add(db_split)
    
    elif expense.split_type == "PERCENTAGE":
        # Percentage-based splits
        if not expense.splits:
            raise HTTPException(status_code=400, detail="Splits required for PERCENTAGE split type")
        
        # Validate that percentages sum to 100
        total_percentage = sum(s.amount for s in expense.splits)
        if abs(total_percentage - 100.0) > 0.01:
            raise HTTPException(status_code=400, detail=f"Percentages must sum to 100. Got {total_percentage}")
        
        for split in expense.splits:
            split_amount = (split.amount / 100.0) * expense.amount
            db_split = models.ExpenseSplit(
                expense_id=db_expense.id,
                user_id=split.user_id,
                amount=split_amount
            )
            db.add(db_split)
    
    db.commit()
    
    # Log how many splits were created
    final_splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == db_expense.id).all()
    print(f"=== EXPENSE CREATED ===")
    print(f"Expense ID: {db_expense.id}")
    print(f"Total splits created: {len(final_splits)}")
    for split in final_splits:
        print(f"  User {split.user_id}: ${split.amount:.2f}")
    print(f"======================\n")
    
    return db_expense

@router.get("/group/{group_id}", response_model=List[schemas.Expense])
def read_group_expenses(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Check membership
    is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view expenses for this group")
        
    # expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    # return expenses
    
    # Join with User to get payer name
    results = db.query(models.Expense, models.User.full_name).join(models.User, models.Expense.payer_id == models.User.id).filter(models.Expense.group_id == group_id).all()
    
    expenses_with_names = []
    for expense, payer_name in results:
        expense.payer_name = payer_name
        expenses_with_names.append(expense)
        
    return expenses_with_names

@router.get("/balances/{group_id}", response_model=List[schemas.BalanceSummary])
def get_group_balances(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Check membership
    is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view balances for this group")
    
    # Calculate balances
    # Balance = (What others owe you) - (What you owe others)
    # For each expense: payer is owed, others owe their split
    
    balances = defaultdict(float)
    
    # Get all expenses for this group
    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    
    for expense in expenses:
        # Get all splits for this expense
        splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id).all()
        
        for split in splits:
            if split.user_id == expense.payer_id:
                # This person paid but also owes their share
                # Net effect: they are owed (total - their_share)
                balances[split.user_id] += (expense.amount - split.amount)
            else:
                # This person owes money to the payer
                balances[split.user_id] -= split.amount
                
    # Include payments in balance calculation
    payments = db.query(models.Payment).filter(models.Payment.group_id == group_id).all()
    for payment in payments:
        # Payer paid someone, so their balance increases (they are "more owed" or "less owing")
        balances[payment.payer_id] += payment.amount
        # Payee received money, so their balance decreases
        balances[payment.payee_id] -= payment.amount
    
    # ... (previous code for calculating net balances)
    
    # Calculate simplified debts
    # 1. Separate into debtors and creditors
    debtors = []
    creditors = []
    
    for uid, amount in balances.items():
        if amount < -0.01:
            debtors.append({"id": uid, "amount": amount})
        elif amount > 0.01:
            creditors.append({"id": uid, "amount": amount})
            
    # 2. Sort by amount magnitude (optional, but good for minimizing transactions)
    debtors.sort(key=lambda x: x["amount"])
    creditors.sort(key=lambda x: x["amount"], reverse=True)
    
    all_debts = []
    
    # 3. Match them up
    i = 0 # debtor index
    j = 0 # creditor index
    
    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        
        # The amount to settle is the minimum of what debtor owes and creditor is owed
        amount = min(abs(debtor["amount"]), creditor["amount"])
        
        # Record the debt
        all_debts.append({
            "debtor_id": debtor["id"],
            "creditor_id": creditor["id"],
            "amount": amount
        })
        
        # Update remaining amounts
        debtor["amount"] += amount
        creditor["amount"] -= amount
        
        # Move indices if settled
        if abs(debtor["amount"]) < 0.01:
            i += 1
        if creditor["amount"] < 0.01:
            j += 1
            
    # Get user details and format response
    result = []
    members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    user_map = {u.id: u for u in db.query(models.User).filter(models.User.id.in_([m.user_id for m in members])).all()}
    
    for member in members:
        user = user_map.get(member.user_id)
        if user:
            # Filter debts relevant to this user
            user_debts = []
            for debt in all_debts:
                if debt["debtor_id"] == user.id:
                    creditor = user_map.get(debt["creditor_id"])
                    user_debts.append(schemas.Debt(
                        debtor_id=user.id,
                        debtor_name=user.full_name,
                        creditor_id=debt["creditor_id"],
                        creditor_name=creditor.full_name if creditor else "Unknown",
                        amount=debt["amount"]
                    ))
                elif debt["creditor_id"] == user.id:
                    debtor = user_map.get(debt["debtor_id"])
                    user_debts.append(schemas.Debt(
                        debtor_id=debt["debtor_id"],
                        debtor_name=debtor.full_name if debtor else "Unknown",
                        creditor_id=user.id,
                        creditor_name=user.full_name,
                        amount=debt["amount"]
                    ))
            
            result.append(schemas.BalanceSummary(
                user_id=user.id,
                user_email=user.email,
                user_name=user.full_name,
                balance=balances.get(user.id, 0.0),
                debts=user_debts
            ))
    
    return result

@router.post("/settle", response_model=schemas.Payment)
def settle_debt(payment: schemas.PaymentCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Verify group membership
    is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == payment.group_id, models.GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized for this group")
        
    # Verify payee is in group
    payee_is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == payment.group_id, models.GroupMember.user_id == payment.payee_id).first()
    if not payee_is_member:
         raise HTTPException(status_code=400, detail="Payee is not in this group")

    db_payment = models.Payment(
        payer_id=current_user.id,
        payee_id=payment.payee_id,
        group_id=payment.group_id,
        amount=payment.amount,
        notes=payment.notes,
        date=payment.date or datetime.now()
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)

    # Add activity
    payee = db.query(models.User).filter(models.User.id == payment.payee_id).first()
    db_activity = models.Activity(
        user_id=current_user.id,
        group_id=payment.group_id,
        type="PAYMENT_MADE",
        description=f"{current_user.full_name} paid {payee.full_name if payee else 'someone'} ${payment.amount}"
    )
    db.add(db_activity)
    db.commit()

    return db_payment

@router.get("/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Get all groups user is in
    user_groups = db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == current_user.id).all()
    
    total_balance = 0.0
    owed_to_you = 0.0
    you_owe = 0.0
    group_summaries = []
    
    for group in user_groups:
        # Calculate balance for this user in this group
        group_balance = 0.0
        
        # Expenses where user is payer
        # User is owed (Amount - User's split)
        # We need a more efficient way or just query it
        
        # 1. Total paid by user in this group
        # This is not enough, we need to know how much OTHERS owe for those expenses
        
        # Let's use the logic from get_group_balances but just for this user
        group_user_balance = 0.0
        
        # Expenses where user participated (either as payer or splitter)
        # All expenses in group
        all_expenses = db.query(models.Expense).filter(models.Expense.group_id == group.id).all()
        for exp in all_expenses:
            splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == exp.id).all()
            for split in splits:
                if split.user_id == current_user.id:
                    if exp.payer_id == current_user.id:
                        # User paid, so they are owed (Total - their share)
                        group_user_balance += (exp.amount - split.amount)
                    else:
                        # Someone else paid, user owes their share
                        group_user_balance -= split.amount
                elif exp.payer_id == current_user.id:
                    # User paid, but is NOT in this specific split? (Edge case)
                    # Actually if they are not in the split, someone else owes them the split amount
                    # BUT our logic above 'Total - their share' covers it if we only look at splits where user IS present.
                    # Wait, if user is payer but NOT in splits, they are owed the WHOLE split amount.
                    pass 
            
            # If user is payer but not in ANY split (unlikely):
            user_in_splits = any(s.user_id == current_user.id for s in splits)
            if exp.payer_id == current_user.id and not user_in_splits:
                 group_user_balance += exp.amount

        # 2. Payments
        # Payments made by user (+)
        payments_made = db.query(models.Payment).filter(models.Payment.group_id == group.id, models.Payment.payer_id == current_user.id).all()
        for p in payments_made:
            group_user_balance += p.amount
            
        # Payments received by user (-)
        payments_received = db.query(models.Payment).filter(models.Payment.group_id == group.id, models.Payment.payee_id == current_user.id).all()
        for p in payments_received:
            group_user_balance -= p.amount
            
        total_balance += group_user_balance
        if group_user_balance > 0.01:
            owed_to_you += group_user_balance
        elif group_user_balance < -0.01:
            you_owe += abs(group_user_balance)
            
        group_summaries.append(schemas.GroupSummary(
            group_id=group.id,
            group_name=group.name,
            balance=group_user_balance
        ))
        
    return schemas.DashboardSummary(
        total_balance=total_balance,
        owed_to_you=owed_to_you,
        you_owe=you_owe,
        group_summaries=group_summaries
    )

@router.get("/activities", response_model=List[schemas.Activity])
def get_activities(group_id: int = None, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.Activity, models.User.full_name, models.Group.name).join(models.User, models.Activity.user_id == models.User.id).join(models.Group, models.Activity.group_id == models.Group.id)
    
    if group_id:
        # Check membership
        is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
        if not is_member:
            raise HTTPException(status_code=403, detail="Not authorized")
        query = query.filter(models.Activity.group_id == group_id)
    else:
        # Global activities for groups user belongs to
        user_group_ids = db.query(models.GroupMember.group_id).filter(models.GroupMember.user_id == current_user.id).all()
        id_list = [g[0] for g in user_group_ids]
        query = query.filter(models.Activity.group_id.in_(id_list))
        
    results = query.order_by(models.Activity.created_at.desc()).limit(50).all()
    
    activities = []
    for activity, user_name, group_name in results:
        activities.append(schemas.Activity(
            id=activity.id,
            user_id=activity.user_id,
            user_name=user_name,
            group_id=activity.group_id,
            group_name=group_name,
            type=activity.type,
            description=activity.description,
            created_at=activity.created_at
        ))
    return activities
