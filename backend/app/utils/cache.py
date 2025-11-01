import redis
from typing import Optional, Any
import json
import pickle
from functools import wraps
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis client (singleton)
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client singleton"""
    global _redis_client
    
    if _redis_client is None:
        try:
            redis_url = getattr(settings, 'REDIS_URL', None)
            if redis_url:
                _redis_client = redis.from_url(
                    redis_url,
                    decode_responses=False,  # We'll handle encoding
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                _redis_client.ping()
                logger.info("Redis connection established")
            else:
                logger.info("Redis URL not configured, caching disabled")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Caching disabled.")
            _redis_client = None
    
    return _redis_client


def cache_result(key_prefix: str, ttl: int = 300):
    """
    Decorator to cache function results in Redis
    
    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds (default: 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            redis_client = get_redis_client()
            
            # If Redis not available, just call function
            if redis_client is None:
                return func(*args, **kwargs)
            
            # Build cache key from function args
            cache_key = f"{key_prefix}:{_build_cache_key(*args, **kwargs)}"
            
            try:
                # Try to get from cache
                cached = redis_client.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit: {cache_key}")
                    return pickle.loads(cached)
                
                # Cache miss, call function
                logger.debug(f"Cache miss: {cache_key}")
                result = func(*args, **kwargs)
                
                # Store in cache
                redis_client.setex(
                    cache_key,
                    ttl,
                    pickle.dumps(result)
                )
                
                return result
                
            except Exception as e:
                logger.warning(f"Cache error: {e}. Falling back to direct call.")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Delete cache keys matching pattern
    
    Args:
        pattern: Pattern to match (e.g., "teacher_stats:*")
    """
    redis_client = get_redis_client()
    
    if redis_client is None:
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys matching '{pattern}'")
    except Exception as e:
        logger.warning(f"Failed to invalidate cache: {e}")


def _build_cache_key(*args, **kwargs) -> str:
    """Build cache key from function arguments"""
    key_parts = []
    
    # Add args (skip first arg if it's 'self' or db session)
    for arg in args:
        if hasattr(arg, '__class__'):
            class_name = arg.__class__.__name__
            if class_name in ['Session', 'AsyncSession']:
                continue
        key_parts.append(str(arg))
    
    # Add kwargs
    for k, v in sorted(kwargs.items()):
        if k in ['db', 'session']:
            continue
        key_parts.append(f"{k}={v}")
    
    return ":".join(key_parts)


# Convenience functions for common cache operations
def cache_teacher_stats(teacher_id: int, period: str, data: Any, ttl: int = 300):
    """Cache teacher statistics"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"teacher_stats:{teacher_id}:{period}"
            redis_client.setex(key, ttl, pickle.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to cache teacher stats: {e}")


def get_cached_teacher_stats(teacher_id: int, period: str) -> Optional[Any]:
    """Get cached teacher statistics"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"teacher_stats:{teacher_id}:{period}"
            cached = redis_client.get(key)
            if cached:
                return pickle.loads(cached)
        except Exception as e:
            logger.warning(f"Failed to get cached teacher stats: {e}")
    return None


def invalidate_teacher_stats(teacher_id: int):
    """Invalidate all cached stats for a teacher"""
    invalidate_cache(f"teacher_stats:{teacher_id}:*")


def cache_student_analytics(student_id: int, data: Any, ttl: int = 180):
    """Cache student analytics"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"student_analytics:{student_id}"
            redis_client.setex(key, ttl, pickle.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to cache student analytics: {e}")


def get_cached_student_analytics(student_id: int) -> Optional[Any]:
    """Get cached student analytics"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"student_analytics:{student_id}"
            cached = redis_client.get(key)
            if cached:
                return pickle.loads(cached)
        except Exception as e:
            logger.warning(f"Failed to get cached student analytics: {e}")
    return None
