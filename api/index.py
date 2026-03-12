import sys
import os

# Add the parent directory to the path so we can import 'backend'
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the FastAPI app from backend/main.py
try:
    from backend.main import app
except ImportError as e:
    print(f"Error importing app: {e}")
    # Fallback for different directory structure during local testing if needed
    from main import app
