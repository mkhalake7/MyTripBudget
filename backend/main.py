from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import auth, groups, expenses, invitations
import os

app = FastAPI(title="MyTripBudget API")

# CORS — always allow Vercel deployment + localhost
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://mytripbudget.vercel.app",
]

# Also allow dynamic Render / Vercel preview URLs
render_url = os.environ.get("RENDER_EXTERNAL_URL")
if render_url:
    origins.append(render_url)

vercel_url = os.environ.get("VERCEL_URL")
if vercel_url:
    origins.append(f"https://{vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (skip on Vercel — read-only filesystem)
if not os.environ.get("VERCEL"):
    try:
        os.makedirs("uploads", exist_ok=True)
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    except OSError:
        print("Warning: Could not create uploads directory (read-only filesystem)")


@app.on_event("startup")
async def startup_event():
    """
    Run DB table creation at startup (not at import time).
    This prevents the function from crashing during cold-start
    if the DB initialisation fails — the error is caught gracefully.
    """
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables created / verified OK.")
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")


# API routes
app.include_router(auth.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")


# Health check endpoint
@app.get("/api/")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "MyTripBudget API is running"}


# --- Serve React Frontend (only when static files are present) ---
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="react-assets")

    @app.get("/{full_path:path}")
    async def serve_react(request: Request, full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
