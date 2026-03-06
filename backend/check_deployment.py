import sys
import os

print("--- PythonAnywhere Deployment Check ---")
print(f"Python execution: {sys.executable}")
print(f"Version: {sys.version}")
print(f"CWD: {os.getcwd()}")

print("\n--- Checking Imports ---")
try:
    import fastapi
    print(f"FastAPI: {fastapi.__version__}")
except ImportError as e:
    print(f"FastAPI: FAIL ({e})")

try:
    import pydantic
    print(f"Pydantic: {pydantic.__version__}")
except ImportError as e:
    print(f"Pydantic: FAIL ({e})")

try:
    import sqlalchemy
    print(f"SQLAlchemy: {sqlalchemy.__version__}")
except ImportError as e:
    print(f"SQLAlchemy: FAIL ({e})")

print("\n--- Checking App Import ---")
try:
    # Ensure current dir is in path
    sys.path.append(os.getcwd())
    from main import app
    print("Successfully imported 'app' from main.py")
except Exception as e:
    print(f"Import 'app' FAILED: {e}")
    import traceback
    traceback.print_exc()

print("\n--- Checking Database File ---")
# Mimic the logic in database.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(BASE_DIR, 'sql_app.db')

if os.path.exists(db_path):
    print(f"Database found at: {db_path}")
else:
    print(f"Database NOT found at: {db_path} (Are you running this from the 'backend' folder?)")

try:
    from database import engine
    connection = engine.connect()
    print("Database connection successful")
    connection.close()
except Exception as e:
    print(f"Database connection FAILED: {e}")
