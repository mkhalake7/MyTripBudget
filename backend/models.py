from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    mobile_number = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)  # URL path to profile picture
    default_currency = Column(String, default="INR")
    is_active = Column(Boolean, default=True)
    
    groups = relationship("GroupMember", back_populates="user")
    expenses_paid = relationship("Expense", back_populates="payer")
    expense_splits = relationship("ExpenseSplit", back_populates="user")
    payments_made = relationship("Payment", foreign_keys="[Payment.payer_id]", back_populates="payer")
    payments_received = relationship("Payment", foreign_keys="[Payment.payee_id]", back_populates="payee")

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    category = Column(String, default="Trip")
    currency = Column(String, default="INR")
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("GroupMember", back_populates="group")
    expenses = relationship("Expense", back_populates="group")
    payments = relationship("Payment", back_populates="group")
    activities = relationship("Activity", back_populates="group")
    admin = relationship("User", foreign_keys=[admin_id])
    invitations = relationship("GroupInvitation", back_populates="group")

class GroupMember(Base):
    __tablename__ = "group_members"
# ... (lines 43-108 remain same)
    group = relationship("Group", back_populates="activities")

class GroupInvitation(Base):
    __tablename__ = "group_invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    name = Column(String, nullable=True) # Name of invited person
    group_id = Column(Integer, ForeignKey("groups.id"))
    inviter_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    status = Column(String, default="PENDING") # PENDING, JOINED, EXPIRED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    group = relationship("Group", back_populates="invitations")
    inviter = relationship("User")
