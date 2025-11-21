from fastapi import FastAPI
from .database import engine
from . import models
from .routers import auth, groups, expenses

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MyTripBudget API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*", # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(expenses.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MyTripBudget API"}
