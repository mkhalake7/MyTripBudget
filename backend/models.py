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
    
    groups = relationship("GroupMember", back_populates="user")
    expenses_paid = relationship("Expense", back_populates="payer")
    expense_splits = relationship("ExpenseSplit", back_populates="user")

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("GroupMember", back_populates="group")
    expenses = relationship("Expense", back_populates="group")

class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="groups")
    group = relationship("Group", back_populates="members")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    payer_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))
    split_type = Column(String, default="EQUAL")  # EQUAL, EXACT, PERCENTAGE
    date = Column(DateTime(timezone=True), nullable=True)  # User-specified expense date
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    payer = relationship("User", back_populates="expenses_paid")
    group = relationship("Group", back_populates="expenses")
    splits = relationship("ExpenseSplit", back_populates="expense")

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float) # The amount this user owes

    expense = relationship("Expense", back_populates="splits")
    user = relationship("User", back_populates="expense_splits")
