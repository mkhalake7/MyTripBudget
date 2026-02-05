import sys
import os

# Add the project directory to the sys.path
path = os.path.expanduser(os.path.dirname(os.path.abspath(__file__)))
if path not in sys.path:
    sys.path.insert(0, path)

from main import app
from a2wsgi import ASGIMiddleware

# PythonAnywhere looks for an 'application' callable by default
application = ASGIMiddleware(app)
