import sys
import os
from fastapi.responses import JSONResponse

# Add the project root to path so 'backend' can be imported as a package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Set VERCEL env so backend code can detect the environment
os.environ.setdefault("VERCEL", "1")

try:
    from backend.main import app
except Exception as e:
    # If the import fails, create a minimal app that returns the error
    # so Vercel shows a useful message instead of a raw 500
    from fastapi import FastAPI
    app = FastAPI()

    error_message = str(e)

    @app.get("/{path:path}")
    @app.post("/{path:path}")
    @app.put("/{path:path}")
    @app.delete("/{path:path}")
    async def fallback(path: str):
        return JSONResponse(
            status_code=503,
            content={
                "error": "Backend failed to start",
                "detail": error_message,
                "hint": "Check that DATABASE_URL is set in Vercel environment variables.",
            },
        )
