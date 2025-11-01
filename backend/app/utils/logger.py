"""
Logger Utility for Backend
Provides consistent logging across the application with proper levels
"""
import logging
import sys
from app.core.config import settings

# Create logger
logger = logging.getLogger("englishwebai")

# Set level based on environment
log_level = logging.DEBUG if settings.DEBUG else logging.INFO
logger.setLevel(log_level)

# Create console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(log_level)

# Create formatter
formatter = logging.Formatter(
    fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(formatter)

# Add handler to logger
if not logger.handlers:
    logger.addHandler(console_handler)

# Convenience functions
def debug(message, *args, **kwargs):
    """Log debug message (only in DEBUG mode)"""
    logger.debug(message, *args, **kwargs)

def info(message, *args, **kwargs):
    """Log info message"""
    logger.info(message, *args, **kwargs)

def warning(message, *args, **kwargs):
    """Log warning message"""
    logger.warning(message, *args, **kwargs)

def error(message, *args, **kwargs):
    """Log error message"""
    logger.error(message, *args, **kwargs, exc_info=True)

def critical(message, *args, **kwargs):
    """Log critical message"""
    logger.critical(message, *args, **kwargs, exc_info=True)
