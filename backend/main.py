from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine
import models
from routers import auth, groups, expenses, invitations
# ... (lines 7-42)
app.include_router(invitations.router)

# --- Serve React Frontend ---
# Path to the built React app (backend/static/)
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

if os.path.exists(STATIC_DIR):
    # Serve static assets (JS, CSS, images) from the assets subfolder
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="react-assets")

    # Catch-all: serve index.html for any non-API route (SPA client-side routing)
    @app.get("/{full_path:path}")
    async def serve_react(request: Request, full_path: str):
        # If the path points to a file in static dir, serve it
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html for React Router to handle
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to MyTripBudget API. Build the frontend and place it in backend/static/"}

