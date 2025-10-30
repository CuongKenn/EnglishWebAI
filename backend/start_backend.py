"""
Start backend with proper configuration for large file uploads
"""
import uvicorn
import os
import sys

# Change to backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

print("=" * 60)
print("Starting EnglishWebAI Backend")
print("=" * 60)
print(f"Working directory: {os.getcwd()}")
print(f"Python: {sys.executable}")
print("Configuration:")
print("  - Port: 8000")
print("  - Max file size: 50MB")
print("  - Auto-reload: Enabled")
print("=" * 60)
print()

# Configure for large file uploads (50MB)
config = uvicorn.Config(
    "main:app",
    host="0.0.0.0",
    port=8000,
    reload=True,
    reload_dirs=[backend_dir],
    timeout_keep_alive=120,
    limit_concurrency=100,
    limit_max_requests=1000,
    # Allow large file uploads (50MB)
    h11_max_incomplete_event_size=50 * 1024 * 1024,
    log_level="info"
)

server = uvicorn.Server(config)

try:
    server.run()
except KeyboardInterrupt:
    print("\nShutting down backend...")
except Exception as e:
    print(f"Error starting backend: {e}")
    import traceback
    traceback.print_exc()

