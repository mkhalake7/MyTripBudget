from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class Group(GroupBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    description: str
    amount: float
    group_id: int

class SplitDetail(BaseModel):
    user_id: int
    amount: float  # Can be amount or percentage depending on split_type

class ExpenseCreate(ExpenseBase):
    payer_id: Optional[int] = None
    split_type: Optional[str] = "EQUAL"  # EQUAL, EXACT, PERCENTAGE
    splits: Optional[List[SplitDetail]] = None  # Only for EXACT/PERCENTAGE
    date: Optional[str] = None  # User-specified expense date

class Expense(ExpenseBase):
    id: int
    payer_id: int
    payer_name: Optional[str] = None
    split_type: str
    created_at: datetime
    date: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExpenseSplitResponse(BaseModel):
    user_id: int
    user_email: str
    user_name: str
    amount: float
    
    class Config:
        from_attributes = True

class Debt(BaseModel):
    debtor_id: int
    debtor_name: str
    creditor_id: int
    creditor_name: str
    amount: float

class BalanceSummary(BaseModel):
    user_id: int
    user_email: str
    user_name: str
    balance: float  # Positive means they are owed, negative means they owe
    debts: List[Debt] = []  # List of specific debts (either owed by or owed to this user)
