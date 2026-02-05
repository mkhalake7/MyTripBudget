from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth, database

router = APIRouter(
    prefix="/groups",
    tags=["groups"]
)

@router.post("/", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_group = models.Group(
        name=group.name, 
        description=group.description,
        category=group.category,
        currency=group.currency,
        admin_id=current_user.id
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add creator as a member
    db_member = models.GroupMember(user_id=current_user.id, group_id=db_group.id)
    db.add(db_member)
    db.commit()
    
    return db_group

@router.get("/", response_model=List[schemas.Group])
def read_users_groups(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # This query joins GroupMember and Group to find groups the user belongs to
    groups = db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == current_user.id).all()
    return groups

@router.get("/{group_id}", response_model=schemas.Group)
def get_group(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Check membership
    is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view this group")
        
    return group

@router.put("/{group_id}", response_model=schemas.Group)
def update_group(group_id: int, group_update: schemas.GroupUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Only admin can update
    if db_group.admin_id != current_user.id:
         raise HTTPException(status_code=403, detail="Only admin can update group details")

    if group_update.name is not None:
        db_group.name = group_update.name
    if group_update.description is not None:
        db_group.description = group_update.description
    if group_update.category is not None:
        db_group.category = group_update.category
    if group_update.currency is not None:
        db_group.currency = group_update.currency
        
    db.commit()
    db.refresh(db_group)
    return db_group

@router.post("/{group_id}/leave")
def leave_group(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=400, detail="You are not a member of this group")
        
    # Prevent admin from leaving without transferring ownership
    if group.admin_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot leave group. Delete the group instead.")

    db.delete(member)
    db.commit()
    return {"message": "Left group successfully"}

@router.post("/{group_id}/members", response_model=schemas.User)
def add_member(group_id: int, email: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if current user is a member (basic permission check)
    is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to add members to this group")

    # Find user to add
    user_to_add = db.query(models.User).filter(models.User.email == email).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already a member
    existing_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == user_to_add.id).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User already in group")
    
    new_member = models.GroupMember(user_id=user_to_add.id, group_id=group_id)
    db.add(new_member)
    db.commit()
    
    return user_to_add

@router.get("/{group_id}/members", response_model=List[schemas.User])
def get_group_members(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if current user is a member
    is_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view members of this group")
    
    # Get all members
    members = db.query(models.User).join(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    return members

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if it's admin (authorization)
    if group.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only admin can delete this group")

    # Delete associated data (cascade manually if not set in DB, but assuming basic cleanup)
    # Delete members
    db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).delete()
    # Delete expenses
    db.query(models.Expense).filter(models.Expense.group_id == group_id).delete()
    # Delete group
    db.delete(group)
    db.commit()
    
    return None
