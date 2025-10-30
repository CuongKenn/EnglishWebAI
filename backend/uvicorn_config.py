"""
Uvicorn configuration for handling large file uploads
"""

# Maximum upload size: 50MB
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB in bytes

config = {
    "host": "0.0.0.0",
    "port": 8000,
    "reload": True,
    "limit_concurrency": 100,
    "timeout_keep_alive": 120,
    "limit_max_requests": 1000,
    # This is the key setting for large file uploads
    "h11_max_incomplete_event_size": MAX_UPLOAD_SIZE,
}

