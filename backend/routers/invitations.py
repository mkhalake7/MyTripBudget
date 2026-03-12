from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timedelta

from database import get_db
import models, schemas, auth
from services.email import send_invitation_email

router = APIRouter(prefix="/invitations", tags=["invitations"])

@router.post("/", response_model=schemas.Invitation)
def create_invitation(
    invitation: schemas.InvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if group exists and user is admin (or member)
    group = db.query(models.Group).filter(models.Group.id == invitation.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if a pending invitation already exists for this email in this group
    existing_invite = db.query(models.GroupInvitation).filter(
        models.GroupInvitation.email == invitation.email,
        models.GroupInvitation.group_id == invitation.group_id,
        models.GroupInvitation.status == "PENDING"
    ).first()
    
    if existing_invite:
        # Update existing invite with new token and expiry
        existing_invite.token = str(uuid.uuid4())
        existing_invite.expires_at = datetime.utcnow() + timedelta(days=7)
        db.commit()
        db.refresh(existing_invite)
        invite = existing_invite
    else:
        # Create new invitation
        invite = models.GroupInvitation(
            email=invitation.email,
            name=invitation.name,
            group_id=invitation.group_id,
            inviter_id=current_user.id,
            token=str(uuid.uuid4()),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(invite)
        db.commit()
        db.refresh(invite)
    
    # Send invitation email
    success = send_invitation_email(
        email=invite.email,
        name=invite.name,
        group_name=group.name,
        inviter_name=current_user.full_name,
        token=invite.token
    )
    
    if not success:
        # Log error or notify user, but we return the invite anyway
        print(f"Failed to send email to {invite.email}")

    return invite

@router.get("/verify/{token}")
def verify_invitation(token: str, db: Session = Depends(get_db)):
    invite = db.query(models.GroupInvitation).filter(
        models.GroupInvitation.token == token,
        models.GroupInvitation.status == "PENDING"
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found or already used")
    
    if invite.expires_at < datetime.utcnow():
        invite.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    group = db.query(models.Group).filter(models.Group.id == invite.group_id).first()
    inviter = db.query(models.User).filter(models.User.id == invite.inviter_id).first()
    
    return {
        "email": invite.email,
        "name": invite.name,
        "group_name": group.name,
        "inviter_name": inviter.full_name
    }

@router.post("/claim/{token}")
def claim_invitation(
    token: str, 
    claim: schemas.InvitationClaim,
    db: Session = Depends(get_db)
):
    invite = db.query(models.GroupInvitation).filter(
        models.GroupInvitation.token == token,
        models.GroupInvitation.status == "PENDING"
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found or already used")
    
    if invite.expires_at < datetime.utcnow():
        invite.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == invite.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered. Please login to join.")
    
    # Create new user
    new_user = models.User(
        email=invite.email,
        full_name=claim.full_name,
        hashed_password=auth.get_password_hash(claim.password),
        is_active=True
    )
    db.add(new_user)
    db.flush() # Get user id
    
    # Add to group
    member = models.GroupMember(user_id=new_user.id, group_id=invite.group_id)
    db.add(member)
    
    # Mark invite as joined
    invite.status = "JOINED"
    
    # Add activity
    activity = models.Activity(
        group_id=invite.group_id,
        user_id=new_user.id,
        type="MEMBER_JOINED",
        description=f"{new_user.full_name} joined the group via invitation"
    )
    db.add(activity)
    
    db.commit()
    
    # Generate token for immediate login
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/join/{token}")
def join_with_existing_account(
    token: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    invite = db.query(models.GroupInvitation).filter(
        models.GroupInvitation.token == token,
        models.GroupInvitation.status == "PENDING"
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found or already used")
    
    # Check if email matches (or we can be lenient and allow any logged in user to use the link?)
    # Usually links are email-specific for security.
    if invite.email != current_user.email:
         raise HTTPException(status_code=403, detail="This invitation was sent to a different email address.")

    # Check if already a member
    is_member = db.query(models.GroupMember).filter(
        models.GroupMember.user_id == current_user.id,
        models.GroupMember.group_id == invite.group_id
    ).first()
    
    if is_member:
        invite.status = "JOINED"
        db.commit()
        return {"message": "You are already a member of this group"}

    # Add to group
    member = models.GroupMember(user_id=current_user.id, group_id=invite.group_id)
    db.add(member)
    
    # Mark invite as joined
    invite.status = "JOINED"
    
    # Add activity
    activity = models.Activity(
        group_id=invite.group_id,
        user_id=current_user.id,
        type="MEMBER_JOINED",
        description=f"{current_user.full_name} joined the group via invitation"
    )
    db.add(activity)
    
    db.commit()
    return {"message": "Successfully joined the group"}
